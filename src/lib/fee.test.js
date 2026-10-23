import { test } from 'node:test'
import assert from 'node:assert/strict'
import { split, som } from './fee.js'

test('split takes commission from the price', () => {
  assert.deepEqual(split(450000, 10), { fee: 45000, payout: 405000 })
  assert.deepEqual(split(450000, 15), { fee: 67500, payout: 382500 })
  assert.deepEqual(split(0, 15), { fee: 0, payout: 0 })
  assert.deepEqual(split(333, 15), { fee: 50, payout: 283 }) // rounds, payout + fee === price
})

test('som groups thousands', () => {
  assert.equal(som(1200000).replace(/\s/g, ' '), '1 200 000')
})
