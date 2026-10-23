import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from './db.js'
import { channelAction, createChannel, createOrder, markOrderPaid, markPayoutPaid, orderAction, stats } from './market.js'
import { checkLogin, createSession, loginBlocked, recordFailedLogin, sessionAdmin, upsertAdmin, SESSION_MS } from './auth.js'
import { HOLD_MS } from '../src/lib/rules.js'

const T0 = 1_700_000_000_000

function setup() {
  const db = openDb(':memory:')
  const ch = createChannel(db, { username: '@t', title: 'T', category: 'tech', subscribers: 1000, avgViews: 300, price: 450000, owner: '@o' }, T0)
  channelAction(db, ch, 'verify', 'a', null, T0)
  const order = createOrder(db, { channelId: ch, advertiser: '@adv', price: 450000, commissionPct: 10 }, T0)
  markOrderPaid(db, order, 'click', null, T0)
  return { db, ch, order }
}

test('fee and payout are fixed at payment', () => {
  const { db, order } = setup()
  const o = db.prepare('SELECT fee, payout FROM orders WHERE id = ?').get(order)
  assert.deepEqual({ ...o }, { fee: 45000, payout: 405000 })
})

test('money is released only after the post stayed live 24 hours', () => {
  const { db, order } = setup()
  orderAction(db, order, 'mark_posted', 'a', null, T0)
  assert.throws(() => orderAction(db, order, 'release', 'a', null, T0 + HOLD_MS - 1), /24 soat/)
  assert.equal(stats(db, T0 + HOLD_MS).readyToRelease, 1)
  orderAction(db, order, 'release', 'a', null, T0 + HOLD_MS)
  const payout = db.prepare('SELECT id, amount, status FROM payouts WHERE order_id = ?').get(order)
  assert.equal(payout.amount, 405000)
  assert.equal(payout.status, 'pending')
  markPayoutPaid(db, payout.id, 'a', T0 + HOLD_MS + 1)
  assert.throws(() => markPayoutPaid(db, payout.id, 'a'), /allaqachon/)
  assert.equal(stats(db).revenue, 45000)
})

test('refund closes the order and blocks further moves', () => {
  const { db, order } = setup()
  assert.equal(stats(db).held, 450000)
  assert.throws(() => orderAction(db, order, 'refund', 'a', '  '), /Sababini/)
  orderAction(db, order, 'refund', 'a', 'Post chiqmadi')
  assert.equal(stats(db).held, 0)
  assert.throws(() => orderAction(db, order, 'mark_posted', 'a'), /mumkin emas/)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM payouts').get().n, 0)
})

test('a dispute can be settled for the owner before 24h', () => {
  const { db, order } = setup()
  orderAction(db, order, 'mark_posted', 'a', null, T0)
  orderAction(db, order, 'dispute', 'a', 'Matn oʻzgartirilgan', T0 + 1000)
  orderAction(db, order, 'release', 'a', null, T0 + 2000)
  assert.equal(db.prepare('SELECT status FROM orders WHERE id = ?').get(order).status, 'completed')
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit').get().n, 5) // verify + paid + posted + dispute + release
})

test('a card transfer is confirmed by hand, with a note, once', () => {
  const { db, ch } = setup()
  const order = createOrder(db, { channelId: ch, advertiser: '@chat', price: 300000, commissionPct: 12, by: 'boss' })
  assert.equal(stats(db).awaitingPayment, 1)
  assert.throws(() => orderAction(db, order, 'confirm_payment', 'boss', ''), /Sababini/)
  orderAction(db, order, 'confirm_payment', 'boss', '*1234 kartadan, 300 000')
  assert.equal(db.prepare('SELECT status FROM orders WHERE id = ?').get(order).status, 'held')
  assert.throws(() => orderAction(db, order, 'confirm_payment', 'boss', 'yana'), /mumkin emas/)
  const log = db.prepare("SELECT action FROM audit WHERE entity = 'order' AND entity_id = ? ORDER BY id").all(order).map((r) => r.action)
  assert.deepEqual(log, ['create', 'confirm_payment'])
  assert.throws(() => createOrder(db, { channelId: ch, advertiser: '  ', price: 1000, commissionPct: 10 }), /Reklama beruvchini/)
})

test('orders need a verified channel and a 10–15% commission', () => {
  const { db, ch } = setup()
  assert.throws(() => createOrder(db, { channelId: ch, advertiser: '@a', price: 1000, commissionPct: 9 }), /10–15/)
  channelAction(db, ch, 'block', 'a', 'Spam')
  assert.throws(() => createOrder(db, { channelId: ch, advertiser: '@a', price: 1000, commissionPct: 10 }), /tekshirilmagan/)
})

test('login, session expiry and password change', () => {
  const db = openDb(':memory:')
  assert.throws(() => upsertAdmin(db, 'boss', 'short'), /12/)
  upsertAdmin(db, 'boss', 'correct horse battery')
  assert.equal(checkLogin(db, 'boss', 'wrong password!!'), null)
  assert.equal(checkLogin(db, 'nobody', 'correct horse battery'), null)
  const admin = checkLogin(db, 'boss', 'correct horse battery')
  const token = createSession(db, admin.id, T0)
  assert.equal(sessionAdmin(db, token, T0 + 1).username, 'boss')
  assert.equal(sessionAdmin(db, token, T0 + SESSION_MS), null)
  const fresh = createSession(db, admin.id)
  upsertAdmin(db, 'boss', 'another long password')
  assert.equal(sessionAdmin(db, fresh), null) // new password logs everyone out
})

test('10 failed logins lock an address for 15 minutes', () => {
  const ip = 'test-ip'
  for (let i = 0; i < 9; i++) recordFailedLogin(ip, T0)
  assert.equal(loginBlocked(ip, T0), false)
  recordFailedLogin(ip, T0)
  assert.equal(loginBlocked(ip, T0 + 60_000), true)
  assert.equal(loginBlocked(ip, T0 + 15 * 60_000 + 1), false)
})
