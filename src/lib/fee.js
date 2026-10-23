export const COMMISSION = [10, 15] // percent, min–max

export function split(price, pct) {
  const fee = Math.round((price * pct) / 100)
  return { fee, payout: price - fee }
}

export const som = (n) => new Intl.NumberFormat('ru-RU').format(n)
