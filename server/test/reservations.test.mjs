import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';
import { sampleReservationData } from '../validation.mjs';
import { newToken } from '../security.mjs';

function futureDate(daysFromToday) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

test('sample reservation validation accepts only known garments and real, ordered, future dates', () => {
  const startDate = futureDate(1);
  assert.deepEqual(sampleReservationData({ garmentCode: 'POLERA_BASICA', startDate, endDate: startDate }), {
    garmentCode: 'POLERA_BASICA', startDate, endDate: startDate,
  });
  for (const value of [
    { garmentCode: 'UNKNOWN', startDate, endDate: startDate },
    { garmentCode: 'POLERA_BASICA', startDate: '2026-02-30', endDate: '2026-03-01' },
    { garmentCode: 'POLERA_BASICA', startDate: futureDate(-1), endDate: startDate },
    { garmentCode: 'POLERA_BASICA', startDate, endDate: futureDate(0) },
    { garmentCode: 'POLERA_BASICA', startDate: futureDate(2), endDate: startDate },
  ]) {
    assert.throws(() => sampleReservationData(value), { status: 400 });
  }
});

test('sample reservations require a client, persist values and reject concurrent date overlap', async t => {
  let role = 'CLIENTE';
  let nextId = 1;
  const saved = [];
  const lockStatements = [];
  const pool = {
    async getConnection() {
      return {
        async execute(sql, binds = {}) {
          if (sql.includes('FROM RENTROOM_S5_EVIDENCE.SESION_API')) {
            return { rows: [{ ID_USUARIO: 17, NOMBRE_COMPLETO: 'Camila', CORREO: 'camila@example.com', ROL: role }] };
          }
          if (sql.includes('FROM RENTROOM_S5_EVIDENCE.PRENDA_MUESTRA')) {
            lockStatements.push(sql);
            return { rows: [{ CODIGO_PRENDA: binds.garmentCode, PRECIO_DIA: 10000, GARANTIA: 20000 }] };
          }
          if (sql.includes('SELECT COUNT(*) AS TOTAL FROM RENTROOM_S5_EVIDENCE.RESERVA_MUESTRA')) {
            const overlaps = saved.some(item => item.garmentCode === binds.garmentCode &&
              item.startDate <= binds.endDate && item.endDate >= binds.startDate);
            return { rows: [{ TOTAL: Number(overlaps) }] };
          }
          if (sql.includes('INSERT INTO RENTROOM_S5_EVIDENCE.RESERVA_MUESTRA')) {
            saved.push({
              id: nextId,
              garmentCode: binds.garmentCode,
              startDate: binds.startDate,
              endDate: binds.endDate,
              userId: binds.userId,
              rentalPrice: binds.rentalPrice,
              guarantee: binds.guarantee,
            });
            return { outBinds: { id: [nextId++] } };
          }
          if (sql.includes('FROM RENTROOM_S5_EVIDENCE.RESERVA_MUESTRA R')) {
            return { rows: saved.filter(item => item.userId === binds.userId).map(item => ({
              ID_RESERVA: item.id,
              CODIGO_PRENDA: item.garmentCode,
              FECHA_INICIO: item.startDate,
              FECHA_FIN: item.endDate,
              PRECIO_DIA: item.rentalPrice,
              GARANTIA: item.guarantee,
              DIAS: Math.floor((Date.parse(`${item.endDate}T00:00:00Z`) - Date.parse(`${item.startDate}T00:00:00Z`)) / 86400000) + 1,
            })) };
          }
          throw new Error(`Unexpected SQL: ${sql}`);
        },
        async commit() {},
        async rollback() {},
        async close() {},
      };
    },
  };
  const app = await startServer({ port: 0, pool, env: {}, logger: { error() {} } });
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.port}/api/sample-reservations`;
  const cookie = `rr_session=${newToken()}`;
  const startDate = futureDate(2);
  const endDate = futureDate(3);
  const headers = { Origin: 'http://localhost:4200', Cookie: cookie, 'Content-Type': 'application/json' };
  const request = (method, body, requestHeaders = headers) => fetch(base, {
    method, headers: requestHeaders, ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const unauthenticated = await request('POST', { garmentCode: 'POLERA_BASICA', startDate, endDate }, {
    Origin: 'http://localhost:4200', 'Content-Type': 'application/json',
  });
  assert.equal(unauthenticated.status, 401);

  const created = await request('POST', { garmentCode: 'POLERA_BASICA', startDate, endDate });
  assert.equal(created.status, 201);
  assert.deepEqual((await created.json()).reservation, {
    id: 1, garmentCode: 'POLERA_BASICA', startDate, endDate,
    rentalDays: 2, rentalTotal: 20000, guarantee: 20000, total: 40000,
  });
  assert.equal(saved.length, 1);
  assert.equal(lockStatements.length, 1);
  assert.match(lockStatements[0], /FOR UPDATE/);

  const listing = await request('GET');
  assert.equal(listing.status, 200);
  assert.equal((await listing.json()).reservations.length, 1);

  const overlapping = await request('POST', {
    garmentCode: 'POLERA_BASICA', startDate: futureDate(3), endDate: futureDate(4),
  });
  assert.equal(overlapping.status, 409);
  assert.equal(saved.length, 1);

  role = 'PROPIETARIO';
  const ownerAttempt = await request('POST', {
    garmentCode: 'CHALECO_TEJIDO', startDate, endDate,
  });
  assert.equal(ownerAttempt.status, 403);
  assert.equal(saved.length, 1);
});
