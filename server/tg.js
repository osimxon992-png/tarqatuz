// Telegram Mini App: the app sends Telegram's signed initData with every request; it is the only proof of who the user is.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { postLink } from './bot.js'

const MAX_AGE_MS = 24 * 60 * 60 * 1000

// Telegram's algorithm: secret = HMAC("WebAppData", botToken); hash = HMAC(secret, sorted "key=value" lines without hash).
export function verifyInitData(initData, token, now = Date.now()) {
  if (typeof initData !== 'string' || !initData || !token) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')
  const check = [...params].map(([k, v]) => `${k}=${v}`).sort().join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(token).digest()
  const expected = createHmac('sha256', secret).update(check).digest('hex')
  if (hash.length !== expected.length || !timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null
  if (now - Number(params.get('auth_date')) * 1000 > MAX_AGE_MS) return null
  try {
    const user = JSON.parse(params.get('user'))
    return Number.isInteger(user?.id) ? user : null
  } catch {
    return null
  }
}

export const catalog = (db) => db.prepare(`
  SELECT id, username, title, category, subscribers, avg_views, price FROM channels
  WHERE status = 'verified' AND tg_chat_id IS NOT NULL ORDER BY subscribers DESC LIMIT 200`).all()

// Only what the user may see about their own orders and channels.
export const mine = (db, userId) => ({
  orders: db.prepare(`
    SELECT o.id, o.price, o.status, o.reason, o.created_at, o.release_at, o.post_msg, c.title, c.username, c.tg_chat_id
    FROM orders o JOIN channels c ON c.id = o.channel_id WHERE o.advertiser_tg = ? ORDER BY o.created_at DESC LIMIT 100`).all(userId)
    .map(({ post_msg, tg_chat_id, ...o }) => ({ ...o, link: post_msg > 0 ? postLink(o.username, tg_chat_id, post_msg) : null })),
  channels: db.prepare(`
    SELECT id, username, title, category, subscribers, price, status, note FROM channels WHERE owner_tg = ? ORDER BY created_at DESC`).all(userId),
  earnings: db.prepare(`
    SELECT o.id, o.payout, o.status, c.title FROM orders o JOIN channels c ON c.id = o.channel_id
    WHERE c.owner_tg = ? AND o.status IN ('held', 'live', 'disputed', 'completed') ORDER BY o.created_at DESC LIMIT 100`).all(userId),
})
