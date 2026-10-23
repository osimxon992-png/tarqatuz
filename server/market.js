import { COMMISSION, split } from '../src/lib/fee.js'
import { CHANNEL_ACTIONS, HOLD_MS, NEEDS_REASON, ORDER_ACTIONS } from '../src/lib/rules.js'
import { transaction } from './db.js'

// A refused action: the API turns it into this HTTP status with the message shown to the admin.
export class ActionError extends Error {
  constructor(message, status = 409) {
    super(message)
    this.status = status
  }
}

const audit = (db, admin, action, entity, id, detail, now) =>
  db.prepare('INSERT INTO audit (admin, action, entity, entity_id, detail, at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(admin, action, entity, id, detail ?? null, now)

function cleanReason(action, reason) {
  const text = typeof reason === 'string' ? reason.trim().slice(0, 500) : ''
  if (NEEDS_REASON.has(action) && !text) throw new ActionError('Sababini yozing', 400)
  return text || null
}

export function createChannel(db, c, now = Date.now()) {
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO channels (username, title, category, subscribers, avg_views, price, owner, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
    .run(c.username, c.title, c.category, c.subscribers, c.avgViews, c.price, c.owner, now)
  return Number(lastInsertRowid)
}

// Fee and payout are fixed when the advertiser pays, so a later commission change can't alter old orders.
export function createOrder(db, { channelId, advertiser, price, commissionPct, by }, now = Date.now()) {
  if (typeof advertiser !== 'string' || !advertiser.trim() || advertiser.length > 64) throw new ActionError('Reklama beruvchini yozing', 400)
  if (!Number.isInteger(price) || price <= 0) throw new ActionError('Narx notoʻgʻri', 400)
  if (!Number.isInteger(commissionPct) || commissionPct < COMMISSION[0] || commissionPct > COMMISSION[1]) throw new ActionError('Komissiya 10–15% boʻlishi kerak', 400)
  const channel = db.prepare('SELECT status FROM channels WHERE id = ?').get(channelId)
  if (channel?.status !== 'verified') throw new ActionError('Kanal tekshirilmagan', 400)
  const { fee, payout } = split(price, commissionPct)
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO orders (channel_id, advertiser, price, commission_pct, fee, payout, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(channelId, advertiser.trim(), price, commissionPct, fee, payout, now)
  const id = Number(lastInsertRowid)
  if (by) audit(db, by, 'create', 'order', id, null, now)
  return id
}

// Payment confirmed (by Click): the money is now held in escrow. Caller provides the transaction.
export function markOrderPaid(db, id, by, detail, now = Date.now()) {
  const { changes } = db.prepare("UPDATE orders SET status = 'held' WHERE id = ? AND status = 'new'").run(id)
  if (changes) audit(db, by, 'paid', 'order', id, detail, now)
  return changes === 1
}

export function orderAction(db, id, action, admin, reason, now = Date.now()) {
  const rule = ORDER_ACTIONS[action]
  if (!rule) throw new ActionError('Nomaʼlum amal', 400)
  const note = cleanReason(action, reason)
  return transaction(db, () => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) throw new ActionError('Buyurtma topilmadi', 404)
    const [from, to] = rule
    if (!from.includes(order.status)) throw new ActionError('Bu amal hozirgi holatda mumkin emas')
    // The 24h guarantee: a live post is paid out only after its hold ends. A dispute is the admin's own ruling.
    if (action === 'release' && order.status === 'live' && now < order.release_at) throw new ActionError('24 soat hali tugamagan')

    const fields = { status: to }
    if (to === 'live') Object.assign(fields, { posted_at: now, release_at: now + HOLD_MS })
    if (to === 'completed' || to === 'refunded') fields.closed_at = now
    if (note) fields.reason = note
    const cols = Object.keys(fields) // fixed names above, never user input
    db.prepare(`UPDATE orders SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(fields), id)

    if (to === 'completed') {
      db.prepare('INSERT INTO payouts (order_id, amount, created_at) VALUES (?, ?, ?)').run(id, order.payout, now)
    }
    audit(db, admin, action, 'order', id, note, now)
    return to
  })
}

export function channelAction(db, id, action, admin, reason, now = Date.now()) {
  const rule = CHANNEL_ACTIONS[action]
  if (!rule) throw new ActionError('Nomaʼlum amal', 400)
  const note = cleanReason(action, reason)
  return transaction(db, () => {
    const channel = db.prepare('SELECT status FROM channels WHERE id = ?').get(id)
    if (!channel) throw new ActionError('Kanal topilmadi', 404)
    if (!rule[0].includes(channel.status)) throw new ActionError('Bu amal hozirgi holatda mumkin emas')
    db.prepare('UPDATE channels SET status = ?, note = ? WHERE id = ?').run(rule[1], note, id)
    audit(db, admin, action, 'channel', id, note, now)
    return rule[1]
  })
}

export function markPayoutPaid(db, id, admin, now = Date.now()) {
  return transaction(db, () => {
    const payout = db.prepare('SELECT status FROM payouts WHERE id = ?').get(id)
    if (!payout) throw new ActionError('Toʻlov topilmadi', 404)
    if (payout.status !== 'pending') throw new ActionError('Bu toʻlov allaqachon belgilangan')
    db.prepare("UPDATE payouts SET status = 'paid', paid_at = ? WHERE id = ?").run(now, id)
    audit(db, admin, 'mark_paid', 'payout', id, null, now)
    return 'paid'
  })
}

// shortcut: lists return the newest 200 rows without paging; add cursor paging once volume grows.
export const listOrders = (db, status) => db.prepare(`
  SELECT o.*, c.username AS channel, c.owner FROM orders o JOIN channels c ON c.id = o.channel_id
  WHERE (:status IS NULL OR o.status = :status) ORDER BY o.created_at DESC LIMIT 200`).all({ status: status ?? null })

export const listChannels = (db, status) => db.prepare(`
  SELECT * FROM channels WHERE (:status IS NULL OR status = :status) ORDER BY created_at DESC LIMIT 200`).all({ status: status ?? null })

export const listPayouts = (db, status) => db.prepare(`
  SELECT p.*, o.price, c.username AS channel, c.owner FROM payouts p
  JOIN orders o ON o.id = p.order_id JOIN channels c ON c.id = o.channel_id
  WHERE (:status IS NULL OR p.status = :status) ORDER BY p.created_at DESC LIMIT 200`).all({ status: status ?? null })

export const listAudit = (db) => db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 200').all()

export function stats(db, now = Date.now()) {
  const one = (sql, ...args) => Object.values(db.prepare(sql).get(...args))[0] ?? 0
  return {
    awaitingPayment: one("SELECT COUNT(*) FROM orders WHERE status = 'new'"),
    held: one("SELECT COALESCE(SUM(price), 0) FROM orders WHERE status IN ('held', 'live', 'disputed')"),
    readyToRelease: one("SELECT COUNT(*) FROM orders WHERE status = 'live' AND release_at <= ?", now),
    disputes: one("SELECT COUNT(*) FROM orders WHERE status = 'disputed'"),
    pendingChannels: one("SELECT COUNT(*) FROM channels WHERE status = 'pending'"),
    payoutsDue: one("SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE status = 'pending'"),
    revenue: one("SELECT COALESCE(SUM(fee), 0) FROM orders WHERE status = 'completed'"),
  }
}
