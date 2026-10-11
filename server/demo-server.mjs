// API local de demostración con SQLite (sin Oracle). Mantiene las mismas rutas que server.mjs.
import http from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { ApiError, allowedOrigins, requireOrigin, registerData, email, password, fullName, productData, productId, sampleReservationData } from './validation.mjs';
import { hashPassword, verifyPassword, newToken, hashToken, readToken, sessionCookie } from './security.mjs';
import { readJson } from './server.mjs';

const GARMENTS = {
  POLERA_BASICA: { rate: 10000, guarantee: 20000 },
  CHALECO_TEJIDO: { rate: 10000, guarantee: 20000 },
};

function openDatabase(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL UNIQUE,
      clave_hash TEXT NOT NULL, rol TEXT NOT NULL CHECK (rol IN ('CLIENTE','PROPIETARIO')));
    CREATE TABLE IF NOT EXISTS sesion (
      token_hash TEXT PRIMARY KEY, id_usuario INTEGER NOT NULL REFERENCES usuario(id), expira_en INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT, id_propietario INTEGER NOT NULL REFERENCES usuario(id),
      nombre TEXT NOT NULL, descripcion TEXT, categoria TEXT, valor_compra REAL, precio_dia REAL NOT NULL,
      garantia REAL NOT NULL, imagen_url TEXT, estado TEXT NOT NULL DEFAULT 'DISPONIBLE');
    CREATE TABLE IF NOT EXISTS reserva_muestra (
      id INTEGER PRIMARY KEY AUTOINCREMENT, codigo_prenda TEXT NOT NULL, id_arrendatario INTEGER NOT NULL REFERENCES usuario(id),
      fecha_inicio TEXT NOT NULL, fecha_fin TEXT NOT NULL, precio_dia REAL NOT NULL, garantia REAL NOT NULL,
      estado TEXT NOT NULL DEFAULT 'CONFIRMADA', creada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS auditoria_reserva (
      id INTEGER PRIMARY KEY AUTOINCREMENT, id_reserva INTEGER NOT NULL, accion TEXT NOT NULL,
      estado_anterior TEXT, estado_nuevo TEXT NOT NULL, fecha_evento TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

    CREATE TRIGGER IF NOT EXISTS trg_reserva_validar_insert BEFORE INSERT ON reserva_muestra
    BEGIN
      SELECT RAISE(ABORT, 'La fecha de término no puede ser anterior a la fecha de inicio.') WHERE NEW.fecha_fin < NEW.fecha_inicio;
      SELECT RAISE(ABORT, 'La fecha de inicio no puede ser anterior a hoy.') WHERE NEW.fecha_inicio < date('now', 'localtime', '-1 day');
      SELECT RAISE(ABORT, 'La prenda ya está reservada durante esas fechas. Elige otro período.')
        WHERE NEW.estado IN ('PENDIENTE','CONFIRMADA') AND EXISTS (
          SELECT 1 FROM reserva_muestra WHERE codigo_prenda = NEW.codigo_prenda AND estado IN ('PENDIENTE','CONFIRMADA')
            AND fecha_inicio <= NEW.fecha_fin AND fecha_fin >= NEW.fecha_inicio);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reserva_validar_update BEFORE UPDATE OF fecha_inicio, fecha_fin, estado ON reserva_muestra
    BEGIN
      SELECT RAISE(ABORT, 'La fecha de término no puede ser anterior a la fecha de inicio.') WHERE NEW.fecha_fin < NEW.fecha_inicio;
      SELECT RAISE(ABORT, 'Una reserva cancelada o finalizada no puede cambiar de estado.')
        WHERE OLD.estado IN ('CANCELADA','FINALIZADA') AND NEW.estado <> OLD.estado;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reserva_auditoria_insert AFTER INSERT ON reserva_muestra
    BEGIN
      INSERT INTO auditoria_reserva (id_reserva, accion, estado_anterior, estado_nuevo) VALUES (NEW.id, 'CREAR', NULL, NEW.estado);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reserva_auditoria_update AFTER UPDATE OF estado ON reserva_muestra
    WHEN OLD.estado <> NEW.estado
    BEGIN
      INSERT INTO auditoria_reserva (id_reserva, accion, estado_anterior, estado_nuevo) VALUES (NEW.id, 'CAMBIAR_ESTADO', OLD.estado, NEW.estado);
    END;
  `);
  return db;
}

const userView = row => ({ id: row.id, fullName: row.nombre, email: row.correo, role: row.rol });

function productView(row, viewerId) {
  return {
    id: row.id, ownerEmail: row.id_propietario === viewerId ? row.correo : '', name: row.nombre,
    description: row.descripcion ?? '', category: row.categoria ?? '', purchaseValue: row.valor_compra,
    rentalValue: row.precio_dia, guarantee: row.garantia, imageUrl: row.imagen_url ?? '', status: row.estado,
  };
}

function reservationView(row) {
  const rentalDays = Math.floor((Date.parse(`${row.fecha_fin}T00:00:00Z`) - Date.parse(`${row.fecha_inicio}T00:00:00Z`)) / 86400000) + 1;
  return {
    id: row.id, garmentCode: row.codigo_prenda, startDate: row.fecha_inicio, endDate: row.fecha_fin, rentalDays,
    rentalTotal: rentalDays * row.precio_dia, guarantee: row.garantia, total: rentalDays * row.precio_dia + row.garantia,
  };
}

function reply(res, status, body, cookie) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(cookie ? { 'Set-Cookie': cookie } : {}),
  });
  res.end(data);
}

export async function startDemoServer({ port, host, env = process.env, logger = console } = {}) {
  const db = openDatabase(env.DEMO_DB_FILE ?? new URL('./data/rentroom-demo.sqlite', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const origins = allowedOrigins(env.ALLOWED_ORIGINS);
  const secure = env.COOKIE_SECURE === 'true';
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = work => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = work(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };

  function currentUser(req, required = true) {
    const token = readToken(req.headers.cookie);
    const row = token && get(
      `SELECT u.* FROM sesion s JOIN usuario u ON u.id = s.id_usuario WHERE s.token_hash = ? AND s.expira_en > ?`,
      hashToken(token), Date.now());
    if (!row && required) throw new ApiError(401, 'Inicia sesión para continuar.');
    return row ? userView(row) : null;
  }

  function createSession(req, userId) {
    const token = newToken();
    const previous = readToken(req.headers.cookie);
    if (previous) run('DELETE FROM sesion WHERE token_hash = ?', hashToken(previous));
    run('DELETE FROM sesion WHERE expira_en <= ?', Date.now());
    run('INSERT INTO sesion (token_hash, id_usuario, expira_en) VALUES (?, ?, ?)', hashToken(token), userId, Date.now() + 8 * 3600000);
    return sessionCookie(token, secure);
  }

  const productRow = id => get('SELECT p.*, u.correo FROM producto p JOIN usuario u ON u.id = p.id_propietario WHERE p.id = ?', id);

  async function dispatch(req) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const method = req.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) requireOrigin(req, origins);

    if (method === 'GET' && pathname === '/api/health') return { body: { status: 'ok', database: 'sqlite-demo' } };

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = registerData(await readJson(req));
      const secret = await hashPassword(body.password);
      if (get('SELECT id FROM usuario WHERE correo = ?', body.email)) throw new ApiError(409, 'El correo ya se encuentra registrado.');
      const id = Number(run('INSERT INTO usuario (nombre, correo, clave_hash, rol) VALUES (?, ?, ?, ?)', body.fullName, body.email, secret, body.role).lastInsertRowid);
      const cookie = createSession(req, id);
      return { status: 201, cookie, body: { user: { id, fullName: body.fullName, email: body.email, role: body.role }, message: 'Cuenta creada correctamente.' } };
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      const row = get('SELECT * FROM usuario WHERE correo = ?', email(body.email));
      const matches = await verifyPassword(password(body.password), row?.clave_hash);
      if (!matches) throw new ApiError(401, 'Correo o contraseña incorrectos.');
      return { cookie: createSession(req, row.id), body: { user: userView(row), message: 'Sesión iniciada correctamente.' } };
    }

    if (method === 'GET' && pathname === '/api/auth/me') return { body: { user: currentUser(req) } };

    if (method === 'PATCH' && pathname === '/api/auth/profile') {
      const name = fullName((await readJson(req)).fullName);
      const user = currentUser(req);
      run('UPDATE usuario SET nombre = ? WHERE id = ?', name, user.id);
      return { body: { user: { ...user, fullName: name }, message: 'Perfil actualizado.' } };
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const token = readToken(req.headers.cookie);
      if (token) run('DELETE FROM sesion WHERE token_hash = ?', hashToken(token));
      return { cookie: sessionCookie('', secure, true), body: { message: 'Sesión cerrada.' } };
    }

    if (method === 'GET' && pathname === '/api/products') {
      const user = currentUser(req, false);
      const rows = all(`SELECT p.*, u.correo FROM producto p JOIN usuario u ON u.id = p.id_propietario WHERE p.estado = 'DISPONIBLE' ORDER BY p.id DESC`);
      return { body: { products: rows.map(row => productView(row, user?.id)) } };
    }

    if (method === 'POST' && pathname === '/api/products') {
      const body = productData(await readJson(req));
      const user = currentUser(req);
      if (user.role !== 'PROPIETARIO') throw new ApiError(403, 'Solo un propietario puede publicar productos.');
      const id = Number(run(
        `INSERT INTO producto (id_propietario, nombre, descripcion, categoria, valor_compra, precio_dia, garantia, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        user.id, body.name, body.description, body.category, body.purchaseValue, body.rentalValue, body.guarantee, body.imageUrl).lastInsertRowid);
      return { status: 201, body: { product: productView(productRow(id), user.id), message: 'Producto publicado.' } };
    }

    const productPath = /^\/api\/products\/([^/]+)$/.exec(pathname);
    if (productPath && ['PUT', 'DELETE'].includes(method)) {
      const id = productId(productPath[1]);
      const body = method === 'PUT' ? productData(await readJson(req), true) : null;
      const user = currentUser(req);
      if (user.role !== 'PROPIETARIO') throw new ApiError(403, 'Solo un propietario puede gestionar productos.');
      const current = get('SELECT * FROM producto WHERE id = ? AND id_propietario = ?', id, user.id);
      if (!current) throw new ApiError(404, 'No se encontró un producto de tu cuenta con ese identificador.');
      if (method === 'DELETE') {
        run(`UPDATE producto SET estado = 'INACTIVO' WHERE id = ?`, id);
        return { body: { message: 'Producto retirado del catálogo.' } };
      }
      run(`UPDATE producto SET nombre = ?, descripcion = ?, categoria = ?, valor_compra = ?, precio_dia = ?, garantia = ?, imagen_url = ?, estado = ? WHERE id = ?`,
        body.name, body.description, body.category, body.purchaseValue, body.rentalValue, body.guarantee, body.imageUrl, body.status ?? current.estado, id);
      return { body: { product: productView(productRow(id), user.id), message: 'Producto actualizado.' } };
    }

    if (method === 'GET' && pathname === '/api/sample-reservations') {
      const user = currentUser(req);
      if (user.role !== 'CLIENTE') throw new ApiError(403, 'Solo las cuentas Cliente pueden consultar sus reservas.');
      const rows = all(`SELECT * FROM reserva_muestra WHERE id_arrendatario = ? AND estado IN ('PENDIENTE','CONFIRMADA') ORDER BY fecha_inicio`, user.id);
      return { body: { reservations: rows.map(reservationView) } };
    }

    if (method === 'POST' && pathname === '/api/sample-reservations') {
      const body = sampleReservationData(await readJson(req));
      const user = currentUser(req);
      if (user.role !== 'CLIENTE') throw new ApiError(403, 'Solo una cuenta Cliente puede reservar prendas.');
      const garment = GARMENTS[body.garmentCode];
      return transaction(() => {
        const overlap = get(
          `SELECT COUNT(*) AS total FROM reserva_muestra WHERE codigo_prenda = ? AND estado IN ('PENDIENTE','CONFIRMADA')
           AND fecha_inicio <= ? AND fecha_fin >= ?`, body.garmentCode, body.endDate, body.startDate);
        if (overlap.total > 0) throw new ApiError(409, 'La prenda ya está reservada durante esas fechas. Elige otro período.');
        const id = Number(run(
          `INSERT INTO reserva_muestra (codigo_prenda, id_arrendatario, fecha_inicio, fecha_fin, precio_dia, garantia) VALUES (?, ?, ?, ?, ?, ?)`,
          body.garmentCode, user.id, body.startDate, body.endDate, garment.rate, garment.guarantee).lastInsertRowid);
        return { status: 201, body: { reservation: reservationView(get('SELECT * FROM reserva_muestra WHERE id = ?', id)), message: 'Reserva guardada correctamente.' } };
      });
    }

    throw new ApiError(404, 'La ruta solicitada no existe.');
  }

  const server = http.createServer(async (req, res) => {
    try {
      const result = await dispatch(req);
      reply(res, result.status ?? 200, result.body, result.cookie);
    } catch (error) {
      if (error instanceof ApiError) reply(res, error.status, { message: error.message });
      else {
        logger.error('Solicitud demo fallida:', error.code ?? error.message);
        reply(res, 500, { message: 'No se pudo completar la operación.' });
      }
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port ?? Number(env.PORT ?? 3001), host ?? env.HOST ?? '127.0.0.1', resolve);
  });
  return { server, db, port: server.address().port, close: () => new Promise(resolve => server.close(() => { db.close(); resolve(); })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const app = await startDemoServer();
    console.log(`RentRoom API de DEMOSTRACIÓN (SQLite) lista en http://127.0.0.1:${app.port}`);
  } catch (error) {
    console.error('No se pudo iniciar la API de demostración:', error.message);
    process.exitCode = 1;
  }
}
