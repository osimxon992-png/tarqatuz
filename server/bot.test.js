import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDb } from './db.js'
import { postLink, probeResult } from './bot.js'

test('a post counts as deleted only when Telegram says so', () => {
  assert.equal(probeResult({ description: 'Bad Request: message is not modified: specified new message content and reply markup are exactly the same' }), 'ok')
  assert.equal(probeResult({ description: 'Bad Request: message to edit not found' }), 'gone')
  assert.equal(probeResult({ description: 'Forbidden: bot is not a member of the channel chat' }), 'unreachable')
  assert.equal(probeResult(new Error('fetch failed')), 'retry') // network trouble is never the owner's fault
})

test('post links for public and private channels', () => {
  assert.equal(postLink('@kanal', -1001234567890, 7), 'https://t.me/kanal/7')
  assert.equal(postLink('id-1001234567890', -1001234567890, 7), 'https://t.me/c/1234567890/7')
})

test('bot columns are added once and survive reopening', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'tarqat-')), 'db.sqlite')
  openDb(path).close()
  const db = openDb(path)
  const cols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name)
  assert.ok(['advertiser_tg', 'ad_chat', 'ad_msg', 'review_msg', 'post_msg'].every((c) => cols.includes(c)))
  db.close()
})

test('Mini App accepts only initData signed with our bot token', async () => {
  const { createHmac } = await import('node:crypto')
  const { verifyInitData } = await import('./tg.js')
  const token = '123:abc'
  const now = 1_700_000_000_000
  const sign = (fields, key = token) => {
    const check = Object.entries(fields).map(([k, v]) => `${k}=${v}`).sort().join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(key).digest()
    return new URLSearchParams({ ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') }).toString()
  }
  const fields = { auth_date: String(now / 1000), query_id: 'q', user: JSON.stringify({ id: 42, first_name: 'A' }) }
  assert.equal(verifyInitData(sign(fields), token, now).id, 42)
  assert.equal(verifyInitData(sign(fields, '999:other'), token, now), null) // another bot's signature
  assert.equal(verifyInitData(sign(fields).replace('42', '43'), token, now), null) // tampered user
  assert.equal(verifyInitData(sign(fields), token, now + 25 * 60 * 60 * 1000), null) // too old
  assert.equal(verifyInitData('', token, now), null)
})
