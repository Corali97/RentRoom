import test from 'node:test';
import assert from 'node:assert/strict';
import { reservationDispatch } from '../reservation-routes.mjs';
import { ApiError } from '../validation.mjs';

function mock(method, pathname, body = {}, role = 'CLIENTE') {
  const calls = [];
  const conn = { async commit() { calls.push('COMMIT'); } };
  const args = {
    method, pathname, req: {},
    connectionWork: fn => fn(conn),
    currentUser: async () => ({id: 7,role}),
    readJson: async () => body,
    query: async (_c,sql,binds) => {
      calls.push({sql,binds});
      if (sql.includes('SP_CREAR_RESERVA')) return {outBinds:{reservationId:[25]}};
      if (sql.startsWith('SELECT ESTADO FROM')) return {rows:[{ESTADO:'DISPONIBLE'}]};
      return {rows:[]};
    },
    table: name => 'TEST.' + name, schema: 'TEST'
  };
  return {calls,args};
}
test('ruta desconocida no activa reservas',async () => {
  const t = mock('GET','/api/health');
  assert.equal(await reservationDispatch(t.args),null);
  assert.equal(t.calls.length,0);
});
test('rechaza fechas imposibles y desordenadas antes de consultar Oracle',async () => {
  for (const [startDate,endDate] of [['2026-02-30','2026-03-05'],['2030-10-04','2030-10-02']]) {
    const t = mock('POST','/api/reservations',{productId: 3,startDate,endDate});
    await assert.rejects(() => reservationDispatch(t.args),e => e instanceof ApiError && e.status === 400);
    assert.equal(t.calls.length,0);
  }
});
test('creación usa SP_CREAR_RESERVA y confirma la transacción',async () => {
  const t = mock('POST','/api/reservations',{productId: 3,startDate:'2030-10-01',endDate:'2030-10-05'});
  const result = await reservationDispatch(t.args);
  assert.equal(result.status,201);
  assert.equal(result.body.id,25);
  assert.ok(t.calls[0].sql.includes('SP_CREAR_RESERVA'));
  assert.equal(t.calls.at(-1),'COMMIT');
});
test('no deja confirmar reservas a clientes',async () => {
  const t = mock('POST','/api/owner/reservations/2/confirm',{});
  await assert.rejects(() => reservationDispatch(t.args),e => e instanceof ApiError && e.status===403);
  assert.equal(t.calls.length,0);
});
test('confirma usando identidad del propietario de la sesión',async () => {
  const t = mock('POST','/api/owner/reservations/2/confirm',{},'PROPIETARIO');
  const result = await reservationDispatch(t.args);
  assert.equal(result.body.message,'Reserva confirmada.');
  assert.equal(t.calls[0].binds.ownerId,7);
});
test('rechaza acciones de seguimiento no previstas',async () => {
  const t = mock('POST','/api/owner/reservations/2/tracking',{action:'BORRAR'},'PROPIETARIO');
  await assert.rejects(() => reservationDispatch(t.args),e => e instanceof ApiError && e.status===400);
});
test('traduce conflicto Oracle a HTTP 409',async () => {
  const t = mock('POST','/api/reservations',{productId:3,startDate:'2030-10-01',endDate:'2030-10-02'});
  t.args.query = async () => {throw Object.assign(new Error('ORA-20104: Fechas ocupadas'),{errorNum:20104});};
  await assert.rejects(() => reservationDispatch(t.args),e => e instanceof ApiError && e.status===409);
});
