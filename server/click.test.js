import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from './db.js'
import { channelAction, createChannel, createOrder } from './market.js'
import { clickComplete, clickPrepare, payUrl, signComplete, signPrepare } from './click.js'

const cfg = { serviceId: '111', merchantId: '222', secret: 'test-secret' }

function setup() {
  const db = openDb(':memory:')
  const ch = createChannel(db, { username: '@t', title: 'T', category: 'tech', subscribers: 1000, avgViews: 300, price: 450000, owner: '@o' })
  channelAction(db, ch, 'verify', 'a', null)
  const order = createOrder(db, { channelId: ch, advertiser: '@adv', price: 450000, commissionPct: 10 })
  return { db, order, status: () => db.prepare('SELECT status FROM orders WHERE id = ?').get(order).status }
}

// What Click would send, signed with the given secret.
const prepareReq = (order, over = {}, secret = cfg.secret) => {
  const p = { click_trans_id: '9001', service_id: '111', click_paydoc_id: '1', merchant_trans_id: String(order), amount: '450000.00', action: '0', error: '0', error_note: 'Success', sign_time: '2026-10-23 12:00:00', ...over }
  return { ...p, sign_string: signPrepare(p, secret) }
}
const completeReq = (order, prepareId, over = {}) => {
  const p = { ...prepareReq(order), action: '1', merchant_prepare_id: String(prepareId), ...over }
  return { ...p, sign_string: signComplete(p, cfg.secret) }
}

test('pay link carries the order id and amount', () => {
  const url = new URL(payUrl({ id: 7, price: 450000 }, cfg))
  assert.equal(url.searchParams.get('transaction_param'), '7')
  assert.equal(url.searchParams.get('amount'), '450000')
  assert.equal(payUrl({ id: 7, price: 1 }, {}), null) // not configured yet
})

test('prepare + complete moves the order into escrow', () => {
  const { db, order, status } = setup()
  const prep = clickPrepare(db, prepareReq(order), cfg)
  assert.equal(prep.error, 0)
  assert.equal(clickPrepare(db, prepareReq(order), cfg).merchant_prepare_id, prep.merchant_prepare_id) // retry is safe
  assert.equal(status(), 'new')
  assert.equal(clickComplete(db, completeReq(order, prep.merchant_prepare_id), cfg).error, 0)
  assert.equal(status(), 'held')
  assert.equal(clickComplete(db, completeReq(order, prep.merchant_prepare_id), cfg).error, -4) // no double payment
})

test('forged or wrong requests are refused', () => {
  const { db, order, status } = setup()
  assert.equal(clickPrepare(db, prepareReq(order, {}, 'guessed-secret'), cfg).error, -1)
  assert.equal(clickPrepare(db, { ...prepareReq(order), amount: '1000.00' }, cfg).error, -1) // tampered after signing
  assert.equal(clickPrepare(db, prepareReq(order, { amount: '1000.00' }), cfg).error, -2)
  assert.equal(clickPrepare(db, prepareReq(999), cfg).error, -5)
  assert.equal(clickPrepare(db, prepareReq(order), { ...cfg, secret: undefined }).error, -1) // no key set → nothing accepted
  assert.equal(clickComplete(db, completeReq(order, 12345), cfg).error, -6)
  assert.equal(status(), 'new')
})

test('a payment Click reports as failed cancels the attempt', () => {
  const { db, order, status } = setup()
  const prep = clickPrepare(db, prepareReq(order), cfg)
  assert.equal(clickComplete(db, completeReq(order, prep.merchant_prepare_id, { error: '-5017' }), cfg).error, -9)
  assert.equal(status(), 'new')
  assert.equal(clickComplete(db, completeReq(order, prep.merchant_prepare_id), cfg).error, -9) // can't revive it
  // The advertiser can try again with a new Click transaction.
  const retry = clickPrepare(db, prepareReq(order, { click_trans_id: '9002' }), cfg)
  assert.equal(clickComplete(db, completeReq(order, retry.merchant_prepare_id, { click_trans_id: '9002' }), cfg).error, 0)
  assert.equal(status(), 'held')
})
