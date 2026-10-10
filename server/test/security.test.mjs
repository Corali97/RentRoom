import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, newToken, hashToken, readToken, sessionCookie } from '../security.mjs';
import { schemaName, allowedOrigins, requireOrigin, registerData, productData, productId } from '../validation.mjs';

test('passwords use independent salts and reject wrong, legacy and malformed values', async () => {
  const first = await hashPassword('Prueba segura 2026!');
  const second = await hashPassword('Prueba segura 2026!');
  assert.notEqual(first, second);
  assert.equal(first.includes('Prueba segura'), false);
  assert.equal(await verifyPassword('Prueba segura 2026!', first), true);
  assert.equal(await verifyPassword('incorrecta', first), false);
  assert.equal(await verifyPassword('texto plano', 'texto plano'), false);
  assert.equal(await verifyPassword('x', 'scrypt$999999999$8$1$x$x'), false);
  assert.equal(await verifyPassword('x', null), false);
});

test('only a single valid opaque session cookie is accepted', () => {
  const token = newToken();
  assert.equal(readToken(`theme=dark; rr_session=${token}`), token);
  assert.notEqual(hashToken(token), token);
  assert.equal(readToken(`rr_session=${token}; rr_session=${token}`), null);
  assert.equal(readToken('rr_session=1 OR 1=1'), null);
  assert.equal(readToken(undefined), null);
  assert.match(sessionCookie(token, true), /HttpOnly; SameSite=Strict; Max-Age=28800; Secure$/);
  assert.match(sessionCookie('', false, true), /Max-Age=0$/);
});

test('schema identifiers and browser origins cannot inject SQL or bypass exact origin matching', () => {
  assert.equal(schemaName('RENTROOM_S5_EVIDENCE'), 'RENTROOM_S5_EVIDENCE');
  for (const value of ['SYSTEM.USUARIO', 'x', 'X;DROP TABLE USUARIO', '"SYSTEM"', 'A--']) {
    assert.throws(() => schemaName(value));
  }
  const origins = allowedOrigins();
  requireOrigin({ headers: { origin: 'http://localhost:4200' } }, origins);
  for (const origin of ['https://attacker.example', 'http://localhost:4200.attacker.example', 'null', undefined]) {
    assert.throws(() => requireOrigin({ headers: { origin } }, origins), { status: 403 });
  }
  assert.throws(() => allowedOrigins('*'));
});

test('registration normalizes identity and requires an explicit supported role', () => {
  const input = { fullName: ' Ana Pérez ', email: ' ANA@EXAMPLE.COM ', password: '12345678', role: 'PROPIETARIO' };
  const valid = registerData(input);
  assert.equal(valid.fullName, 'Ana Pérez');
  assert.equal(valid.email, 'ana@example.com');
  for (const change of [{ role: 'ADMIN' }, { role: null }, { password: 'corta' }, { email: 'no-es-correo' }, { fullName: ' ' }]) {
    assert.throws(() => registerData({ ...input, ...change }), { status: 400 });
  }
});

test('product validation rejects invalid prices, ownership input, unsafe image URLs and IDs', () => {
  const input = { name: 'Taladro', description: '', category: 'Herramientas', rentalValue: 4500, guarantee: 10000, purchaseValue: 50000, imageUrl: '' };
  assert.deepEqual(productData({ ...input, ownerId: 999, ownerEmail: 'other@example.com' }), input);
  for (const change of [{ rentalValue: 0 }, { rentalValue: -1 }, { rentalValue: 1.123 }, { rentalValue: Infinity },
    { rentalValue: '4500' }, { guarantee: -1 }, { purchaseValue: 1e12 }, { imageUrl: 'javascript:alert(1)' },
    { imageUrl: 'data:image/png;base64,abcd' }, { imageUrl: 'https://user:password@example.com/p.png' }, { category: ' ' }]) {
    assert.throws(() => productData({ ...input, ...change }), { status: 400 });
  }
  assert.throws(() => productData({ ...input, status: 'RESERVADO' }, true), { status: 400 });
  assert.equal(productId('12'), 12);
  for (const id of ['0', '-1', '1 OR 1=1', '1.5', '9007199254740992']) assert.throws(() => productId(id));
});
