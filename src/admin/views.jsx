import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from './api'
import { som, split } from '../lib/fee'
import { allowedActions, CHANNEL_ACTIONS, NEEDS_REASON, ORDER_ACTIONS } from '../lib/rules'
import { ACTIONS, CHANNEL_STATUS, ENTITY, ORDER_STATUS, PAYOUT_STATUS } from './labels'
import { ActionButton, Badge, ErrorBox, FilterTabs, fmtDate, PageTitle, Table, timeLeft, useApi } from './ui'

const query = (filter) => (filter ? `?status=${filter}` : '')
const Muted = ({ children }) => <div className="mt-0.5 text-xs text-ink/60">{children}</div>

export function Dashboard() {
  const { data: s, error } = useApi('/stats')
  // [label, value, link, needs attention]
  const tiles = s && [
    ['Toʻlov kutilayotgan buyurtmalar', s.awaitingPayment, '#orders/new', s.awaitingPayment > 0],
    ['Himoyadagi pul', `${som(s.held)} soʻm`, '#orders', false],
    ['Kanal egasiga oʻtkazishga tayyor', s.readyToRelease, '#orders/live', s.readyToRelease > 0],
    ['Ochiq nizolar', s.disputes, '#orders/disputed', s.disputes > 0],
    ['Tekshiruv kutayotgan kanallar', s.pendingChannels, '#channels/pending', s.pendingChannels > 0],
    ['Kanal egalariga toʻlanishi kerak', `${som(s.payoutsDue)} soʻm`, '#payouts/pending', s.payoutsDue > 0],
    ['Platforma daromadi', `${som(s.revenue)} soʻm`, '#orders/completed', false],
  ]
  return (
    <>
      <PageTitle title="Bosh panel" sub="Sariq kartalar sizning qaroringizni kutmoqda." />
      <ErrorBox error={error} />
      {tiles && (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map(([label, value, href, hot]) => (
            <li key={label}>
              <a href={href} className={`card block p-6 transition-transform hover:-translate-y-0.5 ${hot ? 'bg-accent' : 'bg-white'}`}>
                <p className="font-semibold text-ink/75">{label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight tabular-nums">{value}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// Order agreed in the Telegram chat: it starts as "Toʻlov kutilmoqda" until the card transfer is confirmed.
function NewOrder({ onCreated }) {
  const dialog = useRef(null)
  const { data: channels } = useApi('/channels?status=verified')
  const [form, setForm] = useState({ channelId: '', advertiser: '', price: '', commissionPct: '10' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const pickChannel = (e) => {
    const ch = channels?.find((c) => String(c.id) === e.target.value)
    setForm((f) => ({ ...f, channelId: e.target.value, price: ch ? String(ch.price) : f.price }))
  }
  const price = Number(form.price.replace(/\D/g, '')) || 0
  const { fee, payout } = split(price, Number(form.commissionPct))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/orders', { ...form, price })
      dialog.current.close()
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2.5'
  return (
    <>
      <button
        type="button"
        onClick={() => { setForm({ channelId: '', advertiser: '', price: '', commissionPct: '10' }); setError(null); dialog.current.showModal() }}
        className="btn btn-primary"
      >
        <Plus className="size-5" strokeWidth={3} aria-hidden="true" />Yangi buyurtma
      </button>
      <dialog ref={dialog} className="m-auto w-[min(92vw,460px)] rounded-2xl border-[3px] border-ink bg-paper p-0 text-ink shadow-[8px_8px_0_var(--color-ink)] backdrop:bg-ink/60">
        <form onSubmit={submit} className="p-6">
          <h2 className="text-xl font-black">Yangi buyurtma</h2>
          <p className="mt-1 text-sm text-ink/70">Chatda kelishilgan buyurtma. Pul tushgach, “Toʻlov tushdi” ni bosasiz.</p>
          <label className="mt-4 block">
            <span className="text-sm font-bold">Kanal</span>
            <select required value={form.channelId} onChange={pickChannel} className={field}>
              <option value="">Tanlang…</option>
              {channels?.map((c) => <option key={c.id} value={c.id}>{c.username} — {som(c.price)} soʻm</option>)}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-bold">Reklama beruvchi (Telegram)</span>
            <input required maxLength={64} placeholder="@username" value={form.advertiser} onChange={set('advertiser')} className={field} />
          </label>
          <div className="mt-3 grid grid-cols-[1fr_110px] gap-3">
            <label className="block">
              <span className="text-sm font-bold">Narx, soʻm</span>
              <input required inputMode="numeric" value={price ? som(price) : ''} onChange={set('price')} className={`${field} tabular-nums`} />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Komissiya</span>
              <select value={form.commissionPct} onChange={set('commissionPct')} className={field}>
                {[10, 11, 12, 13, 14, 15].map((p) => <option key={p} value={p}>{p}%</option>)}
              </select>
            </label>
          </div>
          {price > 0 && <p className="mt-3 text-sm">Platformaga: <b>{som(fee)}</b> · Kanal egasiga: <b>{som(payout)}</b> soʻm</p>}
          {error && <p role="alert" className="mt-3 rounded-lg border-2 border-alert bg-alert/10 px-3 py-2 text-sm font-semibold">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current.close()} className="btn btn-ghost py-2">Bekor qilish</button>
            <button type="submit" disabled={busy} className="btn btn-primary py-2 disabled:opacity-60">{busy ? 'Saqlanmoqda…' : 'Yaratish'}</button>
          </div>
        </form>
      </dialog>
    </>
  )
}

export function Orders({ filter, setFilter }) {
  const { data, error, reload } = useApi(`/orders${query(filter)}`)
  const run = (id, action) => async (reason) => {
    await api(`/orders/${id}`, { action, reason })
    reload()
  }
  const now = Date.now()
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Buyurtmalar" sub="Pul post 24 soat turmaguncha himoyada turadi. Narxlar soʻmda." />
        <NewOrder onCreated={() => (filter === 'new' ? reload() : setFilter('new'))} />
      </div>
      <FilterTabs value={filter} onChange={setFilter} map={ORDER_STATUS} />
      <ErrorBox error={error} />
      <Table
        head={['#', 'Kanal', 'Reklama beruvchi', 'Narx', 'Komissiya', 'Kanal egasiga', 'Holat', 'Muddat', 'Amallar']}
        empty="Bu holatda buyurtma yoʻq."
        rows={data?.map((o) => {
          const left = o.status === 'live' ? timeLeft(o.release_at, now) : null
          // Release is offered only once the 24h hold is over (the API refuses earlier anyway).
          const actions = allowedActions(ORDER_ACTIONS, o.status).filter((a) => !(a === 'release' && left))
          return (
            <tr key={o.id}>
              <td className="text-ink/60">{o.id}</td>
              <td><b>{o.channel}</b><Muted>{o.owner}</Muted></td>
              <td>{o.advertiser}<Muted>{fmtDate(o.created_at)}</Muted></td>
              <td className="font-bold tabular-nums">{som(o.price)}</td>
              <td className="tabular-nums">{som(o.fee)}<Muted>{o.commission_pct}%</Muted></td>
              <td className="tabular-nums">{som(o.payout)}</td>
              <td><Badge status={o.status} map={ORDER_STATUS} />{o.reason && <Muted>{o.reason}</Muted>}</td>
              <td className="whitespace-nowrap">
                {o.status === 'live' ? (left ? `${left} qoldi` : <b>Oʻtkazishga tayyor</b>) : fmtDate(o.closed_at)}
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => <ActionButton key={a} action={a} needReason={NEEDS_REASON.has(a)} onRun={run(o.id, a)} />)}
                  {/* Unpaid: only Click can move it on; the admin can hand the advertiser the pay link */}
                  {o.status === 'new' && (o.pay_url
                    ? <a href={o.pay_url} target="_blank" rel="noreferrer" className="rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold whitespace-nowrap shadow-[3px_3px_0_var(--color-ink)]">Click havolasi</a>
                    : <Muted>Click kalitlari .env da yoʻq</Muted>)}
                </div>
              </td>
            </tr>
          )
        })}
      />
    </>
  )
}

export function Channels({ filter, setFilter }) {
  const { data, error, reload } = useApi(`/channels${query(filter)}`)
  const run = (id, action) => async (reason) => {
    await api(`/channels/${id}`, { action, reason })
    reload()
  }
  return (
    <>
      <PageTitle title="Kanallar" sub="Statistikani tekshirib, kanalni katalogga chiqaring yoki rad eting." />
      <FilterTabs value={filter} onChange={setFilter} map={CHANNEL_STATUS} />
      <ErrorBox error={error} />
      <Table
        head={['Kanal', 'Kategoriya', 'Obunachi', 'Oʻrt. koʻrish', 'Koʻrish / obunachi', 'Narx', 'Egasi', 'Holat', 'Amallar']}
        empty="Bu holatda kanal yoʻq."
        rows={data?.map((c) => (
          <tr key={c.id}>
            <td><b>{c.username}</b><Muted>{fmtDate(c.created_at)}</Muted></td>
            <td>{c.category}</td>
            <td className="tabular-nums">{som(c.subscribers)}</td>
            <td className="tabular-nums">{som(c.avg_views)}</td>
            {/* A quick signal for bought subscribers: very few views per subscriber */}
            <td className="tabular-nums">
              <span className={`rounded-md px-1.5 py-0.5 font-bold ${c.avg_views / c.subscribers < 0.1 ? 'bg-alert/30' : ''}`}>{Math.round((c.avg_views / c.subscribers) * 100)}%</span>
            </td>
            <td className="tabular-nums">{som(c.price)}</td>
            <td>{c.owner}</td>
            <td><Badge status={c.status} map={CHANNEL_STATUS} />{c.note && <Muted>{c.note}</Muted>}</td>
            <td>
              <div className="flex flex-wrap gap-2">
                {allowedActions(CHANNEL_ACTIONS, c.status).map((a) => (
                  <ActionButton key={a} action={a} needReason={NEEDS_REASON.has(a)} onRun={run(c.id, a)} />
                ))}
              </div>
            </td>
          </tr>
        ))}
      />
    </>
  )
}

export function Payouts({ filter, setFilter }) {
  const { data, error, reload } = useApi(`/payouts${query(filter)}`)
  const paid = (id) => async () => {
    await api(`/payouts/${id}/paid`, {})
    reload()
  }
  return (
    <>
      <PageTitle title="Toʻlovlar" sub="Yakunlangan buyurtmalar boʻyicha kanal egalariga yuboriladigan pul. Summalar soʻmda." />
      <FilterTabs value={filter} onChange={setFilter} map={PAYOUT_STATUS} />
      <ErrorBox error={error} />
      <Table
        head={['#', 'Buyurtma', 'Kanal', 'Egasi', 'Summa', 'Holat', 'Yaratilgan', 'Toʻlangan', 'Amallar']}
        empty="Bu holatda toʻlov yoʻq."
        rows={data?.map((p) => (
          <tr key={p.id}>
            <td className="text-ink/60">{p.id}</td>
            <td>#{p.order_id}</td>
            <td><b>{p.channel}</b></td>
            <td>{p.owner}</td>
            <td className="font-bold tabular-nums">{som(p.amount)}</td>
            <td><Badge status={p.status} map={PAYOUT_STATUS} /></td>
            <td className="whitespace-nowrap">{fmtDate(p.created_at)}</td>
            <td className="whitespace-nowrap">{fmtDate(p.paid_at)}</td>
            <td>{p.status === 'pending' && <ActionButton action="mark_paid" onRun={paid(p.id)} />}</td>
          </tr>
        ))}
      />
    </>
  )
}

export function Audit() {
  const { data, error } = useApi('/audit')
  return (
    <>
      <PageTitle title="Jurnal" sub="Pul va kanallar bilan qilingan har bir amal: kim, qachon, nima uchun." />
      <ErrorBox error={error} />
      <Table
        head={['Vaqt', 'Kim', 'Amal', 'Obyekt', 'Sabab']}
        empty="Hali amal yoʻq."
        rows={data?.map((a) => (
          <tr key={a.id}>
            <td className="whitespace-nowrap">{fmtDate(a.at)}</td>
            <td>{a.admin}</td>
            <td className="font-semibold">{ACTIONS[a.action]?.[0] ?? a.action}</td>
            <td>{ENTITY[a.entity]} #{a.entity_id}</td>
            <td className="text-ink/75">{a.detail ?? '—'}</td>
          </tr>
        ))}
      />
    </>
  )
}
