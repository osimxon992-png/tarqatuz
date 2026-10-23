import { useState } from 'react'
import { Check } from 'lucide-react'
import { COMMISSION, split, som } from '../lib/fee'

export default function Pricing({ t }) {
  const p = t.pricing
  const [raw, setRaw] = useState('500000')
  const price = Number(raw) || 0
  const [lo, hi] = COMMISSION.map((pct) => split(price, pct))
  const range = (a, b) => (a === b ? som(a) : `${som(a)} – ${som(b)}`)

  return (
    <section id="narxlar" aria-labelledby="price-title" className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-24 md:px-8 md:py-36 lg:grid-cols-2">
      <div>
        <h1 id="price-title" data-reveal className="h2">{p.title}</h1>
        <ul className="mt-10 space-y-4">
          {p.points.map((x) => (
            <li key={x} data-reveal className="flex items-start gap-3 text-lg font-medium">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border-2 border-ink bg-brand"><Check className="size-4" strokeWidth={3} aria-hidden="true" /></span>
              {x}
            </li>
          ))}
        </ul>
      </div>

      {/* Calculator styled as a payment receipt */}
      <div data-reveal className="card mx-auto w-full max-w-md bg-white p-7">
        <h3 className="text-2xl font-black tracking-tight">{p.calcTitle}</h3>
        <label htmlFor="ad-price" className="mt-5 block text-sm font-bold text-ink/70">{p.label}, {t.cur}</label>
        <input
          id="ad-price"
          inputMode="numeric"
          autoComplete="off"
          value={raw ? som(price) : ''}
          onChange={(e) => setRaw(e.target.value.replace(/\D/g, '').slice(0, 12))}
          className="mt-2 w-full rounded-xl border-[3px] border-ink bg-paper px-4 py-3.5 text-3xl font-black tracking-tight tabular-nums outline-none focus:bg-mint"
        />
        <dl className="receipt-cut mt-8 space-y-4 pt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-ink/75">{p.fee} ({COMMISSION.join('–')}%)</dt>
            <dd aria-live="polite" className="font-bold tabular-nums">{range(lo.fee, hi.fee)} {t.cur}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border-[3px] border-ink bg-accent px-4 py-3">
            <dt className="font-bold">{p.payout}</dt>
            <dd aria-live="polite" className="text-xl font-black tracking-tight tabular-nums">{range(hi.payout, lo.payout)} {t.cur}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-ink/65">{p.note}</p>
      </div>
    </section>
  )
}
