// Click SHOP-API: Click calls Prepare (action=0), then Complete (action=1) on our server.
// Every request is signed with our secret key; anything with a bad signature is refused.
import { createHash } from 'node:crypto'
import { transaction } from './db.js'
import { markOrderPaid } from './market.js'

export const clickConfig = () => ({
  serviceId: process.env.CLICK_SERVICE_ID,
  merchantId: process.env.CLICK_MERCHANT_ID,
  secret: process.env.CLICK_SECRET_KEY,
  returnUrl: process.env.PUBLIC_URL,
})

// Where the advertiser is sent to pay. transaction_param comes back to us as merchant_trans_id.
export function payUrl(order, cfg = clickConfig()) {
  if (!cfg.serviceId || !cfg.merchantId) return null
  const q = new URLSearchParams({ service_id: cfg.serviceId, merchant_id: cfg.merchantId, amount: order.price, transaction_param: order.id })
  if (cfg.returnUrl) q.set('return_url', cfg.returnUrl)
  return `https://my.click.uz/services/pay?${q}`
}

const md5 = (s) => createHash('md5').update(s).digest('hex')

export const signPrepare = (p, secret) =>
  md5(`${p.click_trans_id}${p.service_id}${secret}${p.merchant_trans_id}${p.amount}${p.action}${p.sign_time}`)
export const signComplete = (p, secret) =>
  md5(`${p.click_trans_id}${p.service_id}${secret}${p.merchant_trans_id}${p.merchant_prepare_id}${p.amount}${p.action}${p.sign_time}`)

// Click sends "450000.00"; orders are whole so'm.
const sameAmount = (sent, price) => Math.round(Number(sent) * 100) === price * 100

// Click's error codes (their docs): 0 ok, -1 sign, -2 amount, -3 action, -4 already paid,
// -5 order not found, -6 transaction not found, -8 bad request, -9 cancelled.
const reply = (p, error, note, extra = {}) => ({
  click_trans_id: p.click_trans_id, merchant_trans_id: p.merchant_trans_id, ...extra, error, error_note: note,
})

export function clickPrepare(db, p, cfg = clickConfig(), now = Date.now()) {
  if (!cfg.secret || p.sign_string !== signPrepare(p, cfg.secret)) return reply(p, -1, 'SIGN CHECK FAILED')
  if (String(p.service_id) !== String(cfg.serviceId)) return reply(p, -8, 'Error in request from click')
  if (String(p.action) !== '0') return reply(p, -3, 'Action not found')
  const order = db.prepare('SELECT id, price, status FROM orders WHERE id = ?').get(Number(p.merchant_trans_id))
  if (!order) return reply(p, -5, 'Order does not exist')
  if (order.status !== 'new') return reply(p, -4, 'Already paid')
  if (!sameAmount(p.amount, order.price)) return reply(p, -2, 'Incorrect parameter amount')

  // Click may retry Prepare: the same click_trans_id gets the same prepare id back.
  db.prepare(`INSERT INTO click_payments (order_id, click_trans_id, amount, status, created_at, updated_at)
    VALUES (?, ?, ?, 'prepared', ?, ?) ON CONFLICT(click_trans_id) DO NOTHING`)
    .run(order.id, String(p.click_trans_id), order.price, now, now)
  const payment = db.prepare('SELECT id, order_id FROM click_payments WHERE click_trans_id = ?').get(String(p.click_trans_id))
  if (payment.order_id !== order.id) return reply(p, -8, 'Error in request from click')
  return reply(p, 0, 'Success', { merchant_prepare_id: payment.id })
}

export function clickComplete(db, p, cfg = clickConfig(), now = Date.now()) {
  if (!cfg.secret || p.sign_string !== signComplete(p, cfg.secret)) return reply(p, -1, 'SIGN CHECK FAILED')
  if (String(p.action) !== '1') return reply(p, -3, 'Action not found')
  return transaction(db, () => {
    const payment = db.prepare('SELECT * FROM click_payments WHERE id = ? AND click_trans_id = ?')
      .get(Number(p.merchant_prepare_id), String(p.click_trans_id))
    if (!payment || payment.order_id !== Number(p.merchant_trans_id)) return reply(p, -6, 'Transaction does not exist')
    const done = { merchant_confirm_id: payment.id }
    if (payment.status === 'confirmed') return reply(p, -4, 'Already paid', done)
    if (payment.status === 'cancelled') return reply(p, -9, 'Transaction cancelled', done)
    // error < 0 means the payment failed on Click's side (e.g. not enough money): close our attempt.
    if (Number(p.error) < 0) {
      db.prepare("UPDATE click_payments SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, payment.id)
      return reply(p, -9, 'Transaction cancelled', done)
    }
    if (!sameAmount(p.amount, payment.amount)) return reply(p, -2, 'Incorrect parameter amount', done)
    // Another Click payment for the same order already went through.
    if (!markOrderPaid(db, payment.order_id, 'click', `Click #${payment.click_trans_id}`, now)) return reply(p, -4, 'Already paid', done)
    db.prepare("UPDATE click_payments SET status = 'confirmed', updated_at = ? WHERE id = ?").run(now, payment.id)
    return reply(p, 0, 'Success', done)
  })
}
