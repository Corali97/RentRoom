import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { startDemoServer } from '../demo-server.mjs';

const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

test('los triggers de la base de demostración validan, bloquean superposiciones y auditan', async () => {
  const app = await startDemoServer({ port: 0, env: { DEMO_DB_FILE: ':memory:', ALLOWED_ORIGINS: 'http://localhost:4200' }, logger: { error() {} } });
  try {
    const { db } = app;
    db.prepare(`INSERT INTO usuario (nombre, correo, clave_hash, rol) VALUES ('Ana', 'ana@example.com', 'x', 'CLIENTE')`).run();
    const insert = (start, end, code = 'POLERA_BASICA') => db.prepare(
      `INSERT INTO reserva_muestra (codigo_prenda, id_arrendatario, fecha_inicio, fecha_fin, precio_dia, garantia) VALUES (?, 1, ?, ?, 10000, 20000)`)
      .run(code, start, end);

    const id = Number(insert(day(5), day(6)).lastInsertRowid);
    assert.throws(() => insert(day(6), day(7)), /ya está reservada/);
    assert.throws(() => insert(day(9), day(8), 'CHALECO_TEJIDO'), /fecha de término/);
    assert.throws(() => insert(day(-3), day(-2), 'CHALECO_TEJIDO'), /anterior a hoy/);
    insert(day(5), day(6), 'CHALECO_TEJIDO');

    db.prepare(`UPDATE reserva_muestra SET estado = 'CANCELADA' WHERE id = ?`).run(id);
    assert.throws(() => db.prepare(`UPDATE reserva_muestra SET estado = 'CONFIRMADA' WHERE id = ?`).run(id), /no puede cambiar de estado/);

    const audit = db.prepare('SELECT accion, estado_anterior, estado_nuevo FROM auditoria_reserva WHERE id_reserva = ? ORDER BY id').all(id);
    assert.deepEqual(audit.map(row => ({ ...row })), [
      { accion: 'CREAR', estado_anterior: null, estado_nuevo: 'CONFIRMADA' },
      { accion: 'CAMBIAR_ESTADO', estado_anterior: 'CONFIRMADA', estado_nuevo: 'CANCELADA' },
    ]);
    insert(day(5), day(6));
  } finally { await app.close(); }
});
