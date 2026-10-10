import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const dummySalt = Buffer.alloc(16, 0);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, options);
  return `scrypt$16384$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  const valid = parts.length === 6 && parts[0] === 'scrypt' && parts[1] === '16384' && parts[2] === '8' &&
    parts[3] === '1' && /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{128}$/.test(parts[5]);
  const derived = await scrypt(password, valid ? Buffer.from(parts[4], 'hex') : dummySalt, 64, options);
  return valid && timingSafeEqual(derived, Buffer.from(parts[5], 'hex'));
}

export function newToken() { return randomBytes(32).toString('hex'); }
export function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }

export function readToken(cookieHeader) {
  if (typeof cookieHeader !== 'string') return null;
  const matches = cookieHeader.split(';').map(item => item.trim()).filter(item => item.startsWith('rr_session='));
  if (matches.length !== 1) return null;
  const token = matches[0].slice('rr_session='.length);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function sessionCookie(token, secure, clear = false) {
  return `rr_session=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 28800}${secure ? '; Secure' : ''}`;
}
