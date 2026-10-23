// Local stand-in for Click: sends a signed Prepare + Complete for one order to our running API.
// Usage: npm run click:sim -- <order id> <amount>     (needs `npm run server` and CLICK_* in .env)
import { signComplete, signPrepare } from './click.js'

const [orderId, amount] = process.argv.slice(2)
const { CLICK_SERVICE_ID: serviceId, CLICK_SECRET_KEY: secret, PORT = 8787 } = process.env
if (!orderId || !amount || !serviceId || !secret) {
  console.error('Foydalanish: npm run click:sim -- <buyurtma raqami> <summa>   (.env da CLICK_SERVICE_ID va CLICK_SECRET_KEY boʻlsin)')
  process.exit(1)
}

const post = async (path, params) => {
  const res = await fetch(`http://127.0.0.1:${PORT}/api/click/${path}`, { method: 'POST', body: new URLSearchParams(params) })
  return res.json()
}

const p = {
  click_trans_id: String(Date.now()), service_id: serviceId, click_paydoc_id: '1', merchant_trans_id: orderId,
  amount: `${amount}.00`, action: '0', error: '0', error_note: 'Success',
  sign_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
}
const prepare = await post('prepare', { ...p, sign_string: signPrepare(p, secret) })
console.log('Prepare  →', prepare)
if (prepare.error !== 0) process.exit(1)

const c = { ...p, action: '1', merchant_prepare_id: String(prepare.merchant_prepare_id) }
console.log('Complete →', await post('complete', { ...c, sign_string: signComplete(c, secret) }))
