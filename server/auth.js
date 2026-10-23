import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const SESSION_MS = 12 * 60 * 60 * 1000

export function hashPassword(password) {
  const salt = randomBytes(16)
  return `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), 64)
  const expected = Buffer.from(hash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function upsertAdmin(db, username, password, now = Date.now()) {
  if (!/^[a-z0-9_.-]{3,32}$/i.test(username)) throw new Error('Login: 3–32 ta lotin harf, raqam yoki _ . -')
  if (password.length < 12) throw new Error('Parol kamida 12 ta belgi boʻlsin')
  db.prepare(`INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`).run(username, hashPassword(password), now)
  // A new password logs out every existing session of that admin.
  db.prepare('DELETE FROM sessions WHERE admin_id = (SELECT id FROM admins WHERE username = ?)').run(username)
}

// Compared against for unknown usernames, so response time doesn't reveal which logins exist.
const DUMMY_HASH = hashPassword(randomBytes(12).toString('hex'))

export function checkLogin(db, username, password) {
  const admin = db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username)
  const ok = verifyPassword(password, admin?.password_hash ?? DUMMY_HASH)
  return ok && admin ? { id: admin.id, username: admin.username } : null
}

// Only a hash of the token is stored, so a leaked database file doesn't hand out live sessions.
const sha256 = (token) => createHash('sha256').update(token).digest('hex')

export function createSession(db, adminId, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
  const token = randomBytes(32).toString('base64url')
  db.prepare('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), adminId, now + SESSION_MS)
  return token
}

export function sessionAdmin(db, token, now = Date.now()) {
  if (!token) return null
  return db.prepare(`SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha256(token), now) ?? null
}

export function destroySession(db, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
}

// Brute-force guard: 10 failed logins per address per 15 minutes.
// shortcut: in memory, so it resets on restart and isn't shared between processes; behind a proxy every
// client shares one address, so set it up to pass the real IP before going multi-instance.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 10
const fails = new Map()

export function loginBlocked(ip, now = Date.now()) {
  const f = fails.get(ip)
  if (f && now - f.since > WINDOW_MS) fails.delete(ip)
  return (fails.get(ip)?.count ?? 0) >= MAX_FAILS
}

export function recordFailedLogin(ip, now = Date.now()) {
  const f = fails.get(ip) ?? { count: 0, since: now }
  f.count += 1
  fails.set(ip, f)
}
