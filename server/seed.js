// Creates/updates the admin from ADMIN_USER + ADMIN_PASSWORD (.env), and with --demo fills an empty DB with sample data.
import { openDb } from './db.js'
import { upsertAdmin } from './auth.js'
import { channelAction, createChannel, createOrder, markOrderPaid, markPayoutPaid, orderAction } from './market.js'

const db = openDb()
const { ADMIN_USER, ADMIN_PASSWORD } = process.env

if (ADMIN_USER && ADMIN_PASSWORD) {
  upsertAdmin(db, ADMIN_USER, ADMIN_PASSWORD)
  console.log(`Admin tayyor: ${ADMIN_USER}`)
} else if (!process.argv.includes('--demo')) {
  console.error('.env faylida ADMIN_USER va ADMIN_PASSWORD ni yozing (namuna: .env.example)')
  process.exit(1)
}

if (process.argv.includes('--demo')) {
  if (db.prepare('SELECT COUNT(*) AS n FROM channels').get().n > 0) {
    console.log('Bazada maʼlumot bor — demo qoʻshilmadi')
  } else {
    seedDemo()
    console.log('Demo maʼlumotlar qoʻshildi')
  }
}

function seedDemo() {
  const now = Date.now()
  const h = 60 * 60 * 1000
  const by = 'demo'
  // [username, category, subscribers, avg views, price, owner, final status]
  const channels = [
    ['@namuna_yangiliklar', 'Yangiliklar', 128000, 41000, 1200000, '@demo_ega1', 'verified'],
    ['@namuna_tech', 'Texnologiya', 54000, 19000, 650000, '@demo_ega2', 'verified'],
    ['@namuna_talim', 'Taʼlim', 87000, 23000, 800000, '@demo_ega3', 'verified'],
    ['@namuna_sport', 'Sport', 212000, 66000, 1800000, '@demo_ega4', 'verified'],
    ['@namuna_biznes', 'Biznes', 36000, 12000, 550000, '@demo_ega5', 'verified'],
    ['@namuna_avto', 'Avto', 61000, 17000, 600000, '@demo_ega6', 'pending'],
    ['@namuna_oshxona', 'Oshxona', 95000, 28000, 700000, '@demo_ega7', 'pending'],
    ['@namuna_moda', 'Moda', 44000, 15000, 500000, '@demo_ega8', 'pending'],
    ['@namuna_kino', 'Kino', 150000, 9000, 900000, '@demo_ega9', 'rejected'],
  ]
  const ids = channels.map(([username, category, subscribers, avgViews, price, owner, status], i) => {
    const id = createChannel(db, { username, title: `Namuna: ${category}`, category, subscribers, avgViews, price, owner }, now - (60 - i) * 24 * h)
    if (status === 'verified') channelAction(db, id, 'verify', by, null, now - 50 * 24 * h)
    if (status === 'rejected') channelAction(db, id, 'reject', by, 'Koʻrishlar obunachilarga nisbatan juda kam', now - 40 * 24 * h)
    return id
  })

  // [channel index, advertiser, commission %, hours ago created, steps to replay after payment; null = not paid yet]
  const orders = [
    [1, '@demo_reklama6', 10, 0.5, null],
    [3, '@demo_reklama7', 12, 1, null],
    [0, '@demo_reklama1', 12, 2, []],
    [1, '@demo_reklama2', 10, 5, []],
    [3, '@demo_reklama3', 15, 1, []],
    [2, '@demo_reklama1', 10, 10, [['mark_posted', 8]]],
    [4, '@demo_reklama4', 12, 20, [['mark_posted', 18]]],
    [0, '@demo_reklama5', 10, 34, [['mark_posted', 30]]], // hold over → ready to release
    [3, '@demo_reklama2', 15, 26, [['mark_posted', 22], ['dispute', 3, 'Post 6 soatdan keyin oʻchirilgan']]],
    [1, '@demo_reklama3', 10, 80, [['mark_posted', 78], ['release', 50]]],
    [2, '@demo_reklama4', 12, 70, [['mark_posted', 66], ['release', 40]]],
    [4, '@demo_reklama5', 10, 120, [['mark_posted', 118], ['release', 90]]],
    [0, '@demo_reklama1', 10, 60, [['refund', 55, 'Kanal egasi buyurtmani rad etdi']]],
  ]
  for (const [ci, advertiser, pct, ago, steps] of orders) {
    const id = createOrder(db, { channelId: ids[ci], advertiser, price: channels[ci][4], commissionPct: pct }, now - ago * h)
    if (!steps) continue
    markOrderPaid(db, id, by, 'Demo toʻlov', now - ago * h)
    for (const [action, stepAgo, reason] of steps) orderAction(db, id, action, by, reason, now - stepAgo * h)
  }
  // Oldest payout already sent to the owner.
  const oldest = db.prepare('SELECT id FROM payouts ORDER BY created_at LIMIT 1').get()
  markPayoutPaid(db, oldest.id, by, now - 80 * h)
}
