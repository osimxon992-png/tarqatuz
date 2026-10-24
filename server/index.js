import { createServer } from 'node:http'
import { openDb } from './db.js'
import * as auth from './auth.js'
import * as market from './market.js'
import * as click from './click.js'
import { startBot } from './bot.js'
import * as tg from './tg.js'
import { CHANNEL_STATUSES, ORDER_STATUSES, PAYOUT_STATUSES } from '../src/lib/rules.js'

const db = openDb()
const PORT = Number(process.env.PORT) || 8787
const HOST = process.env.HOST || '127.0.0.1'
const PROD = process.env.NODE_ENV === 'production'
// Same process as the API, so the bot and the admin panel share one database writer.
const bot = process.env.BOT_TOKEN ? startBot(db, process.env.BOT_TOKEN) : null

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 10_000) return reject(new market.ActionError('Soʻrov juda katta', 413))
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJson(req) {
  const text = await readBody(req)
  try {
    const body = text ? JSON.parse(text) : {}
    return body && typeof body === 'object' ? body : {}
  } catch {
    throw new market.ActionError('Notoʻgʻri JSON', 400)
  }
}

const getCookie = (req, name) =>
  req.headers.cookie?.split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1)

const sessionCookie = (token, maxAgeSec) =>
  `sid=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAgeSec}${PROD ? '; Secure' : ''}`

const statusParam = (url, allowed) => {
  const s = url.searchParams.get('status')
  return allowed.includes(s) ? s : null
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  const post = req.method === 'POST'

  // Click calls these itself (form-encoded, no cookie); the signature inside the body is the authentication.
  if (post && (path === '/api/click/prepare' || path === '/api/click/complete')) {
    const params = Object.fromEntries(new URLSearchParams(await readBody(req)))
    const result = path.endsWith('prepare') ? click.clickPrepare(db, params) : click.clickComplete(db, params)
    if (result.error !== 0) console.warn('Click', path, result.error, result.error_note, params.merchant_trans_id)
    return send(res, 200, result)
  }

  if (post) {
    // CSRF: the session cookie is SameSite=Strict, and on top of that we only accept JSON
    // (a cross-site form can't send it) from our own origin.
    if (!req.headers['content-type']?.startsWith('application/json')) return send(res, 415, { error: 'JSON kutilmoqda' })
    const origin = req.headers.origin
    if (origin && URL.parse(origin)?.host !== req.headers.host) return send(res, 403, { error: 'Ruxsat yoʻq' })
  }

  // Mini App inside the bot: the user is whoever Telegram's signed initData says, never a cookie.
  if (path.startsWith('/api/tg/')) {
    const user = tg.verifyInitData(req.headers['x-telegram-init-data'], process.env.BOT_TOKEN)
    if (!user) return send(res, 401, { error: 'Ilovani Telegram ichida oching' })
    if (!post && path === '/api/tg/catalog') return send(res, 200, tg.catalog(db))
    if (!post && path === '/api/tg/me') return send(res, 200, tg.mine(db, user.id))
    if (post && path === '/api/tg/order') {
      const { channelId } = await readJson(req)
      if (!bot) return send(res, 503, { error: 'Bot ishlamayapti' })
      await bot.beginAd(user.id, Number(channelId))
      return send(res, 200, { ok: true })
    }
    return send(res, 404, { error: 'Topilmadi' })
  }

  if (post && path === '/api/login') {
    const ip = req.socket.remoteAddress
    if (auth.loginBlocked(ip)) return send(res, 429, { error: 'Juda koʻp urinish. 15 daqiqadan keyin qayta urinib koʻring' })
    const { username, password } = await readJson(req)
    const admin = typeof username === 'string' && typeof password === 'string' && auth.checkLogin(db, username, password)
    if (!admin) {
      auth.recordFailedLogin(ip)
      return send(res, 401, { error: 'Login yoki parol notoʻgʻri' })
    }
    const token = auth.createSession(db, admin.id)
    return send(res, 200, { username: admin.username }, { 'Set-Cookie': sessionCookie(token, auth.SESSION_MS / 1000) })
  }

  // Everything below needs a logged-in admin.
  const token = getCookie(req, 'sid')
  const admin = auth.sessionAdmin(db, token)
  if (!admin) return send(res, 401, { error: 'Avval tizimga kiring' })

  if (post && path === '/api/logout') {
    auth.destroySession(db, token)
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) })
  }
  if (!post && path === '/api/me') return send(res, 200, { username: admin.username })
  if (!post && path === '/api/stats') return send(res, 200, market.stats(db))
  if (!post && path === '/api/orders') {
    const orders = market.listOrders(db, statusParam(url, ORDER_STATUSES))
    return send(res, 200, orders.map((o) => (o.status === 'new' ? { ...o, pay_url: click.payUrl(o) } : o)))
  }
  if (!post && path === '/api/channels') return send(res, 200, market.listChannels(db, statusParam(url, CHANNEL_STATUSES)))
  if (!post && path === '/api/payouts') return send(res, 200, market.listPayouts(db, statusParam(url, PAYOUT_STATUSES)))
  if (!post && path === '/api/audit') return send(res, 200, market.listAudit(db))

  // Admin creates an order by hand (agreed in Telegram chat); it waits for payment as 'new'.
  if (post && path === '/api/orders') {
    const { channelId, advertiser, price, commissionPct } = await readJson(req)
    const id = market.createOrder(db, {
      channelId: Number(channelId), advertiser, price: Number(price), commissionPct: Number(commissionPct), by: admin.username,
    })
    return send(res, 200, { id })
  }

  let m
  if (post && (m = path.match(/^\/api\/orders\/(\d+)$/))) {
    const { action, reason } = await readJson(req)
    const status = market.orderAction(db, Number(m[1]), action, admin.username, reason)
    bot?.orderChanged(Number(m[1]))
    return send(res, 200, { status })
  }
  if (post && (m = path.match(/^\/api\/channels\/(\d+)$/))) {
    const { action, reason } = await readJson(req)
    const status = market.channelAction(db, Number(m[1]), action, admin.username, reason)
    bot?.channelChanged(Number(m[1]))
    return send(res, 200, { status })
  }
  if (post && (m = path.match(/^\/api\/payouts\/(\d+)\/paid$/))) {
    return send(res, 200, { status: market.markPayoutPaid(db, Number(m[1]), admin.username) })
  }
  send(res, 404, { error: 'Topilmadi' })
}

createServer((req, res) =>
  handle(req, res).catch((e) => {
    if (e instanceof market.ActionError) return send(res, e.status, { error: e.message })
    console.error(e)
    send(res, 500, { error: 'Server xatosi' })
  }),
)
  .on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e
    console.error(`${PORT}-port band: API allaqachon ishlayapti (boshqa terminalda?). Uni yoping yoki .env da boshqa PORT bering.`)
    process.exit(1)
  })
  .listen(PORT, HOST, () => console.log(`tarqat API: http://${HOST}:${PORT}`))
