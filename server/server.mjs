import http from 'node:http';
import { pathToFileURL } from 'node:url';
import oracledb from 'oracledb';
import { ApiError, schemaName, allowedOrigins, requireOrigin, objectBody, registerData, email, password, fullName, productData, productId } from './validation.mjs';
import { hashPassword, verifyPassword, newToken, hashToken, readToken, sessionCookie } from './security.mjs';

const JSON_LIMIT = 64 * 1024;
const userFields = 'U.ID_USUARIO, U.NOMBRE_COMPLETO, U.CORREO, U.ROL';
const productFields = 'P.ID_PRODUCTO, P.ID_PROPIETARIO, P.NOMBRE, P.DESCRIPCION, P.CATEGORIA, P.VALOR_COMPRA, P.PRECIO_DIA, P.GARANTIA, P.IMAGEN_URL, P.ESTADO, U.CORREO';

function userView(row) {
  return { id: row.ID_USUARIO, fullName: row.NOMBRE_COMPLETO, email: row.CORREO, role: row.ROL };
}

function productView(row, viewerId) {
  return {
    id: row.ID_PRODUCTO,
    ownerEmail: row.ID_PROPIETARIO === viewerId ? row.CORREO : '',
    name: row.NOMBRE,
    description: row.DESCRIPCION ?? '',
    category: row.CATEGORIA ?? '',
    purchaseValue: row.VALOR_COMPRA ?? null,
    rentalValue: row.PRECIO_DIA,
    guarantee: row.GARANTIA,
    imageUrl: row.IMAGEN_URL ?? '',
    status: row.ESTADO
  };
}

export function readJson(req) {
  if ((req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    req.resume();
    return Promise.reject(new ApiError(415, 'Envía los datos como application/json.'));
  }
  if (Number(req.headers['content-length']) > JSON_LIMIT) {
    req.resume();
    return Promise.reject(new ApiError(413, 'La solicitud supera el tamaño permitido.'));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let rejected = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > JSON_LIMIT) {
        rejected = true;
        chunks.length = 0;
        reject(new ApiError(413, 'La solicitud supera el tamaño permitido.'));
      } else if (!rejected) chunks.push(chunk);
    });
    req.on('end', () => {
      if (rejected) return;
      try { resolve(objectBody(JSON.parse(Buffer.concat(chunks).toString('utf8')))); }
      catch (error) { reject(error instanceof ApiError ? error : new ApiError(400, 'El JSON de la solicitud no es válido.')); }
    });
    req.on('error', reject);
    req.on('aborted', () => reject(new ApiError(400, 'La solicitud fue interrumpida.')));
  });
}

function reply(res, status, body, cookie) {
  if (res.destroyed || res.writableEnded) return;
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    ...(cookie ? { 'Set-Cookie': cookie } : {})
  });
  res.end(data);
}

export async function startServer({ port, host, env = process.env, pool: suppliedPool, logger = console } = {}) {
  const schema = schemaName(env.DB_SCHEMA ?? 'RENTROOM_S5_EVIDENCE');
  const origins = allowedOrigins(env.ALLOWED_ORIGINS);
  const secureCookie = env.COOKIE_SECURE === 'true';
  if (!suppliedPool && (!env.DB_USER || !env.DB_PASSWORD || !env.DB_CONNECT_STRING)) {
    throw new Error('Configura DB_USER, DB_PASSWORD y DB_CONNECT_STRING en server/.env.');
  }
  const pool = suppliedPool ?? await oracledb.createPool({
    user: env.DB_USER, password: env.DB_PASSWORD, connectString: env.DB_CONNECT_STRING,
    poolMin: 0, poolMax: 4, poolIncrement: 1, queueTimeout: 10000, connectTimeout: 10
  });
  const table = name => `${schema}.${name}`;

  async function connectionWork(work) {
    const connection = await pool.getConnection();
    connection.callTimeout = 10000;
    try { return await work(connection); }
    catch (error) {
      try { await connection.rollback(); } catch { /* Retain the original error. */ }
      throw error;
    } finally { await connection.close(); }
  }

  const query = (connection, sql, binds = {}) => connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

  async function currentUser(connection, req, required = true) {
    const token = readToken(req.headers.cookie);
    let row;
    if (token) {
      const result = await query(connection,
        `SELECT ${userFields} FROM ${table('SESION_API')} S JOIN ${table('USUARIO')} U ON U.ID_USUARIO = S.ID_USUARIO
         WHERE S.TOKEN_HASH = :tokenHash AND S.EXPIRA_EN > CAST(SYSTIMESTAMP AS TIMESTAMP)
         AND U.ESTADO = 'ACTIVO' AND U.ROL IN ('CLIENTE','PROPIETARIO')`, { tokenHash: hashToken(token) });
      row = result.rows[0];
    }
    if (!row && required) throw new ApiError(401, 'Inicia sesión para continuar.');
    return row ? userView(row) : null;
  }

  async function createSession(connection, req, userId) {
    const token = newToken();
    const previous = readToken(req.headers.cookie);
    if (previous) await query(connection, `DELETE FROM ${table('SESION_API')} WHERE TOKEN_HASH = :tokenHash`, { tokenHash: hashToken(previous) });
    await query(connection, `DELETE FROM ${table('SESION_API')} WHERE EXPIRA_EN <= CAST(SYSTIMESTAMP AS TIMESTAMP)`);
    await query(connection,
      `INSERT INTO ${table('SESION_API')} (TOKEN_HASH, ID_USUARIO, EXPIRA_EN)
       VALUES (:tokenHash, :userId, CAST(SYSTIMESTAMP AS TIMESTAMP) + INTERVAL '8' HOUR)`,
      { tokenHash: hashToken(token), userId });
    return sessionCookie(token, secureCookie);
  }

  async function getProduct(connection, id, viewerId) {
    const result = await query(connection,
      `SELECT ${productFields} FROM ${table('PRODUCTO')} P JOIN ${table('USUARIO')} U ON U.ID_USUARIO = P.ID_PROPIETARIO
       WHERE P.ID_PRODUCTO = :id`, { id });
    if (!result.rows[0]) throw new ApiError(404, 'No se encontró el producto.');
    return productView(result.rows[0], viewerId);
  }

  async function editableProduct(connection, id, ownerId) {
    const result = await query(connection,
      `SELECT ESTADO FROM ${table('PRODUCTO')} WHERE ID_PRODUCTO = :id AND ID_PROPIETARIO = :ownerId FOR UPDATE`, { id, ownerId });
    if (!result.rows[0]) throw new ApiError(404, 'No se encontró un producto de tu cuenta con ese identificador.');
    const reserved = await query(connection,
      `SELECT COUNT(*) AS TOTAL FROM ${table('RESERVA')} WHERE ID_PRODUCTO = :id AND ESTADO IN ('PENDIENTE','CONFIRMADA')`, { id });
    if (result.rows[0].ESTADO === 'RESERVADO' || reserved.rows[0].TOTAL > 0) {
      throw new ApiError(409, 'El producto tiene reservas activas y no puede modificarse ni eliminarse.');
    }
    return result.rows[0];
  }

  async function dispatch(req) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const method = req.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) requireOrigin(req, origins);

    if (method === 'GET' && pathname === '/api/health') {
      await connectionWork(connection => query(connection, 'SELECT 1 AS READY FROM DUAL'));
      return { body: { status: 'ok', database: 'oracle' } };
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = registerData(await readJson(req));
      const secret = await hashPassword(body.password);
      return connectionWork(async connection => {
        const duplicate = await query(connection, `SELECT ID_USUARIO FROM ${table('USUARIO')} WHERE LOWER(TRIM(CORREO)) = :email`, { email: body.email });
        if (duplicate.rows.length) throw new ApiError(409, 'El correo ya se encuentra registrado.');
        const result = await query(connection,
          `INSERT INTO ${table('USUARIO')} (NOMBRE_COMPLETO, CORREO, CLAVE_HASH, ROL, ESTADO)
           VALUES (:fullName, :email, :secret, :role, 'ACTIVO') RETURNING ID_USUARIO INTO :id`,
          { fullName: body.fullName, email: body.email, secret, role: body.role, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
        const id = result.outBinds.id[0];
        const cookie = await createSession(connection, req, id);
        await connection.commit();
        return { status: 201, cookie, body: { user: { id, fullName: body.fullName, email: body.email, role: body.role }, message: 'Cuenta creada correctamente.' } };
      });
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      const accountEmail = email(body.email);
      const accountPassword = password(body.password);
      return connectionWork(async connection => {
        const result = await query(connection,
          `SELECT ${userFields}, U.CLAVE_HASH, U.ESTADO FROM ${table('USUARIO')} U WHERE LOWER(TRIM(U.CORREO)) = :email`, { email: accountEmail });
        const row = result.rows[0];
        const matches = await verifyPassword(accountPassword, row?.CLAVE_HASH);
        if (!matches || row.ESTADO !== 'ACTIVO' || !['CLIENTE', 'PROPIETARIO'].includes(row.ROL)) {
          throw new ApiError(401, 'Correo o contraseña incorrectos.');
        }
        const cookie = await createSession(connection, req, row.ID_USUARIO);
        await connection.commit();
        return { cookie, body: { user: userView(row), message: 'Sesión iniciada correctamente.' } };
      });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      return connectionWork(async connection => ({ body: { user: await currentUser(connection, req) } }));
    }

    if (method === 'PATCH' && pathname === '/api/auth/profile') {
      const name = fullName((await readJson(req)).fullName);
      return connectionWork(async connection => {
        const user = await currentUser(connection, req);
        await query(connection, `UPDATE ${table('USUARIO')} SET NOMBRE_COMPLETO = :name WHERE ID_USUARIO = :id AND ESTADO = 'ACTIVO'`, { name, id: user.id });
        await connection.commit();
        return { body: { user: { ...user, fullName: name }, message: 'Perfil actualizado.' } };
      });
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      return connectionWork(async connection => {
        const token = readToken(req.headers.cookie);
        if (token) await query(connection, `DELETE FROM ${table('SESION_API')} WHERE TOKEN_HASH = :tokenHash`, { tokenHash: hashToken(token) });
        await connection.commit();
        return { cookie: sessionCookie('', secureCookie, true), body: { message: 'Sesión cerrada.' } };
      });
    }

    if (method === 'GET' && pathname === '/api/products') {
      return connectionWork(async connection => {
        const user = await currentUser(connection, req, false);
        const result = await query(connection,
          `SELECT ${productFields} FROM ${table('PRODUCTO')} P JOIN ${table('USUARIO')} U ON U.ID_USUARIO = P.ID_PROPIETARIO
           WHERE P.ESTADO = 'DISPONIBLE' AND U.ESTADO = 'ACTIVO' ORDER BY P.ID_PRODUCTO DESC`);
        return { body: { products: result.rows.map(row => productView(row, user?.id)) } };
      });
    }

    if (method === 'POST' && pathname === '/api/products') {
      const body = productData(await readJson(req));
      return connectionWork(async connection => {
        const user = await currentUser(connection, req);
        if (user.role !== 'PROPIETARIO') throw new ApiError(403, 'Solo un propietario puede publicar productos.');
        const result = await query(connection,
          `INSERT INTO ${table('PRODUCTO')} (ID_PROPIETARIO, NOMBRE, DESCRIPCION, CATEGORIA, VALOR_COMPRA, PRECIO_DIA, GARANTIA, IMAGEN_URL, ESTADO)
           VALUES (:ownerId, :name, :description, :category, :purchaseValue, :rentalValue, :guarantee, :imageUrl, 'DISPONIBLE') RETURNING ID_PRODUCTO INTO :id`,
          { ...body, ownerId: user.id, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
        const product = await getProduct(connection, result.outBinds.id[0], user.id);
        await connection.commit();
        return { status: 201, body: { product, message: 'Producto publicado.' } };
      });
    }

    const productPath = /^\/api\/products\/([^/]+)$/.exec(pathname);
    if (productPath && ['PUT', 'DELETE'].includes(method)) {
      const id = productId(productPath[1]);
      const body = method === 'PUT' ? productData(await readJson(req), true) : null;
      return connectionWork(async connection => {
        const user = await currentUser(connection, req);
        if (user.role !== 'PROPIETARIO') throw new ApiError(403, 'Solo un propietario puede gestionar productos.');
        const current = await editableProduct(connection, id, user.id);
        if (method === 'DELETE') {
          await query(connection, `UPDATE ${table('PRODUCTO')} SET ESTADO = 'INACTIVO' WHERE ID_PRODUCTO = :id AND ID_PROPIETARIO = :ownerId`, { id, ownerId: user.id });
          await connection.commit();
          return { body: { message: 'Producto retirado del catálogo.' } };
        }
        await query(connection,
          `UPDATE ${table('PRODUCTO')} SET NOMBRE = :name, DESCRIPCION = :description, CATEGORIA = :category, VALOR_COMPRA = :purchaseValue,
           PRECIO_DIA = :rentalValue, GARANTIA = :guarantee, IMAGEN_URL = :imageUrl, ESTADO = :status
           WHERE ID_PRODUCTO = :id AND ID_PROPIETARIO = :ownerId`, { ...body, status: body.status ?? current.ESTADO, id, ownerId: user.id });
        const product = await getProduct(connection, id, user.id);
        await connection.commit();
        return { body: { product, message: 'Producto actualizado.' } };
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
      else if (error.errorNum === 1) reply(res, 409, { message: 'El registro ya existe. Revisa los datos ingresados.' });
      else if (error.errorNum === 12899) reply(res, 400, { message: 'Uno de los campos supera el largo permitido.' });
      else {
        logger.error('Solicitud API fallida:', error.code ?? 'INTERNAL_ERROR');
        reply(res, 503, { message: 'No se pudo completar la operación. Comprueba la conexión con Oracle e intenta nuevamente.' });
      }
    }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 15000;
  server.keepAliveTimeout = 5000;

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port ?? Number(env.PORT ?? 3001), host ?? env.HOST ?? '127.0.0.1', resolve);
    });
  } catch (error) {
    if (!suppliedPool) await pool.close(0);
    throw error;
  }
  let closing;
  const close = () => closing ??= (async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (!suppliedPool) await pool.close(10);
  })();
  return { server, pool, port: server.address().port, close };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const app = await startServer();
    console.log(`RentRoom API lista en http://${process.env.HOST ?? '127.0.0.1'}:${app.port}`);
    const stop = () => app.close().then(() => process.exit(0)).catch(() => process.exit(1));
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    console.error('No se pudo iniciar la API:', error.code ?? 'CONFIGURATION_ERROR');
    process.exitCode = 1;
  }
}
