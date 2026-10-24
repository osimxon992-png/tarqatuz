import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const DEFAULT_PATH = fileURLToPath(new URL('./data.db', import.meta.url))

// 'new' = created, waiting for the advertiser to pay through Click; 'held' = paid, money in escrow.
const ordersTable = (name) => `
  CREATE TABLE IF NOT EXISTS ${name} (
    id INTEGER PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES channels(id),
    advertiser TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    commission_pct INTEGER NOT NULL CHECK (commission_pct BETWEEN 10 AND 15),
    fee INTEGER NOT NULL,
    payout INTEGER NOT NULL CHECK (payout + fee = price),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'held', 'live', 'disputed', 'completed', 'refunded')),
    reason TEXT,
    created_at INTEGER NOT NULL,
    posted_at INTEGER,
    release_at INTEGER,
    closed_at INTEGER
  );`

// Money columns are whole so'm (INTEGER); times are epoch milliseconds.
export function openDb(path = process.env.DB_PATH || DEFAULT_PATH) {
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subscribers INTEGER NOT NULL,
      avg_views INTEGER NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0),
      owner TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'blocked')),
      note TEXT,
      created_at INTEGER NOT NULL
    );
    ${ordersTable('orders')}
    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
      amount INTEGER NOT NULL CHECK (amount > 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      created_at INTEGER NOT NULL,
      paid_at INTEGER
    );
    -- One row per Click payment attempt; its id is our merchant_prepare_id / merchant_confirm_id.
    CREATE TABLE IF NOT EXISTS click_payments (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      click_trans_id TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('prepared', 'confirmed', 'cancelled')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY,
      admin TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      detail TEXT,
      at INTEGER NOT NULL
    );
  `)
  migrateOrdersStatus(db)
  addBotColumns(db)
  return db
}

// Telegram ids the bot needs. Messages are copied from bot-sent copies, so what was approved is what gets posted.
const BOT_COLUMNS = {
  channels: ['tg_chat_id INTEGER', 'owner_tg INTEGER'],
  // ad_*: advertiser's frozen preview; review_msg: the copy the owner approved; post_msg: the post in the channel.
  orders: ['advertiser_tg INTEGER', 'ad_chat INTEGER', 'ad_msg INTEGER', 'review_msg INTEGER', 'post_msg INTEGER'],
}

function addBotColumns(db) {
  for (const [table, cols] of Object.entries(BOT_COLUMNS)) {
    const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name))
    for (const col of cols) if (!have.has(col.split(' ')[0])) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`)
  }
}

// Databases made before Click support can't hold status 'new'; SQLite can't widen a CHECK in place,
// so copy into a new table and swap it in (the documented 12-step ALTER procedure, minus what we don't need).
function migrateOrdersStatus(db) {
  const { sql } = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get()
  if (sql.includes("'new'")) return
  db.exec('PRAGMA foreign_keys = OFF')
  transaction(db, () => {
    db.exec(`${ordersTable('orders_next')}
      INSERT INTO orders_next SELECT * FROM orders;
      DROP TABLE orders;
      ALTER TABLE orders_next RENAME TO orders;`)
  })
  db.exec('PRAGMA foreign_keys = ON')
}

export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
