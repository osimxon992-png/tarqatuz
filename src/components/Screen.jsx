import { BadgeCheck, Check, Eye, ShieldCheck } from 'lucide-react'
import { som } from '../lib/fee'

const PRICE = 450000
const rows = [['@namuna_tech', '54K', '19K'], ['@namuna_sport', '212K', '66K'], ['@namuna_talim', '87K', '23K']]

export function AdPost({ t, compact }) {
  return (
    <div className="overflow-hidden rounded-2xl rounded-bl-md border-2 border-ink bg-white">
      {/* Flat "poster" artwork instead of a photo */}
      <div className={`relative overflow-hidden border-b-2 border-ink bg-accent ${compact ? 'h-24' : 'h-36'}`}>
        <span className="absolute -right-6 -bottom-10 size-32 rounded-full border-2 border-ink bg-brand" />
        <span className="absolute top-3 left-3 rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-paper">{t.hero.tag}</span>
      </div>
      <p className="px-3 pt-2.5 text-[13px] leading-snug">{t.hero.post}</p>
      <div className="mx-3 mt-2.5 rounded-lg border-2 border-ink bg-mint py-1.5 text-center text-xs font-bold">{t.hero.postBtn}</div>
      <p className="flex items-center justify-end gap-1 px-3 py-2 text-[11px] text-ink/60">
        <Eye className="size-3" /> 8,2K · 14:05
      </p>
    </div>
  )
}

const Line = ({ children }) => <p className="text-xs font-bold text-ink/60">{children}</p>
const Button = ({ children, className }) => <div className={`mt-auto rounded-xl border-2 border-ink py-3 text-center text-sm font-bold ${className}`}>{children}</div>

// Screen order per flow (advertiser, channel owner), matching t.how.tabs[i].steps.
export const SCREENS = [['channel', 'pay', 'post', 'timer'], ['channel', 'pay', 'post', 'payout']]

// One phone screen per step of the flow: channel → pay → post → timer → payout.
export default function Screen({ id, t }) {
  const s = t.screens
  const box = 'flex flex-1 flex-col gap-3 p-4'

  if (id === 'channel') return (
    <div className={box}>
      <Line>{s.pick}</Line>
      {rows.map(([handle, subs, views], i) => (
        <div key={handle} className={`flex items-center gap-3 rounded-xl border-2 border-ink p-3 ${i === 0 ? 'bg-accent shadow-[3px_3px_0_var(--color-ink)]' : 'bg-white'}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink text-xs font-black text-paper">{handle[8].toUpperCase()}</span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-bold">{handle}<BadgeCheck className="size-3.5 shrink-0" /></p>
            <p className="flex items-center gap-1 text-xs text-ink/65">{subs} · <Eye className="size-3" /> {views}</p>
          </div>
        </div>
      ))}
      <Button className="bg-brand">{s.choose} · {som(PRICE)} {t.cur}</Button>
    </div>
  )

  if (id === 'pay') return (
    <div className={box}>
      <Line>{s.order}</Line>
      <div className="rounded-xl border-2 border-ink bg-white p-4">
        <p className="text-sm text-ink/65">@namuna_tech</p>
        <p className="mt-1 text-2xl font-black tracking-tight">{som(PRICE)} <span className="text-base">{t.cur}</span></p>
      </div>
      <Line>{s.method}</Line>
      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
        <span className="rounded-xl border-2 border-ink bg-ink py-3 text-center text-paper">Click</span>
        <span className="rounded-xl border-2 border-ink bg-white py-3 text-center">Payme</span>
      </div>
      <p className="flex items-center gap-2 rounded-xl border-2 border-ink bg-mint px-3 py-2.5 text-xs font-bold"><ShieldCheck className="size-4" />{s.safe}</p>
      <Button className="bg-accent">{s.pay}</Button>
    </div>
  )

  if (id === 'post') return (
    <div className={`${box} justify-end`}>
      <AdPost t={t} compact />
      <p className="self-center rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold">✓ {s.posted}</p>
    </div>
  )

  if (id === 'timer') return (
    <div className={`${box} items-center justify-center text-center`}>
      <div className="relative grid size-44 place-items-center rounded-full border-2 border-ink bg-white">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-mint)" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-brand)" strokeWidth="10" pathLength="100" strokeDasharray="100" strokeDashoffset="28" />
        </svg>
        <p className="text-2xl font-black tabular-nums">17:12:40</p>
      </div>
      <p className="font-bold">{s.watching}</p>
      <ul className="w-full space-y-2 text-left text-sm">
        {[s.live, s.intact].map((x) => (
          <li key={x} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2.5 font-semibold"><Check className="size-4 text-brand" strokeWidth={3} />{x}</li>
        ))}
      </ul>
    </div>
  )

  // payout
  return (
    <div className={`${box} items-center justify-center text-center`}>
      <span className="grid size-20 place-items-center rounded-full border-[3px] border-ink bg-accent shadow-[4px_4px_0_var(--color-ink)]"><Check className="size-10" strokeWidth={3} /></span>
      <p className="mt-3 text-3xl font-black tracking-tight">+{som(PRICE * 0.9)}</p>
      <p className="text-sm text-ink/65">{t.cur} · {s.paid}</p>
      <dl className="mt-4 w-full space-y-2 rounded-xl border-2 border-ink bg-white p-4 text-sm">
        <div className="flex justify-between"><dt className="text-ink/65">{s.price}</dt><dd className="font-bold">{som(PRICE)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink/65">{s.fee} (10%)</dt><dd className="font-bold">−{som(PRICE * 0.1)}</dd></div>
      </dl>
    </div>
  )
}
