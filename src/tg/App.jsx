import { useEffect, useMemo, useState } from 'react'
import { BOT_USERNAME } from '../config'
import { som } from '../lib/fee'
import { Badge, timeLeft } from '../admin/ui'
import { CHANNEL_STATUS, ORDER_STATUS } from '../admin/labels'

const tg = window.Telegram?.WebApp
const CONNECT_URL = `https://t.me/${BOT_USERNAME}?startchannel&admin=post_messages+edit_messages+delete_messages`

// Every call carries Telegram's signed initData; the server trusts nothing else about who the user is.
async function api(path, body) {
  const res = await fetch(`/api/tg${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Telegram-Init-Data': tg.initData, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi')
  return data
}

function useLoad(path) {
  const [state, setState] = useState({})
  useEffect(() => {
    let live = true
    api(path).then((data) => live && setState({ data }), (error) => live && setState({ error }))
    return () => { live = false }
  }, [path])
  return state
}

const TABS = [['catalog', 'Katalog'], ['orders', 'Buyurtmalarim'], ['channels', 'Kanallarim']]

export default function App() {
  const [tab, setTab] = useState('catalog')

  useEffect(() => {
    if (!tg?.initData) return
    tg.ready()
    tg.expand()
    tg.setHeaderColor?.('#F1F6EE')
    tg.setBackgroundColor?.('#F1F6EE')
  }, [])

  if (!tg?.initData) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-content-center gap-5 px-4 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto size-16" />
        <h1 className="text-2xl font-black">Bu ilova Telegram ichida ishlaydi</h1>
        <a href={`https://t.me/${BOT_USERNAME}`} className="btn btn-primary">Botni ochish</a>
      </main>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      <header className="sticky top-0 z-10 border-b-[3px] border-ink bg-paper px-4 pt-3">
        <div className="flex items-center gap-2.5 text-lg font-black">
          <img src="/favicon.svg" alt="" className="size-8" />
          tarqat
        </div>
        <nav role="tablist" aria-label="Boʻlimlar" className="mt-3 flex gap-1">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="-mb-[3px] flex-1 rounded-t-lg border-[3px] border-transparent px-2 py-2 text-sm font-bold aria-selected:border-ink aria-selected:border-b-paper aria-selected:bg-paper"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="px-4 pt-4">
        {tab === 'catalog' && <Catalog />}
        {tab === 'orders' && <Orders onCatalog={() => setTab('catalog')} />}
        {tab === 'channels' && <Channels />}
      </main>
    </div>
  )
}

const Note = ({ children }) => <p className="py-10 text-center font-semibold text-ink/60">{children}</p>
const Failed = ({ error }) => <p role="alert" className="card bg-alert/20 p-4 font-semibold">{error.message}</p>

function Catalog() {
  const { data, error } = useLoad('/catalog')
  const [category, setCategory] = useState(null)
  const [busy, setBusy] = useState(null)
  const [orderError, setOrderError] = useState(null)
  const categories = useMemo(() => [...new Set(data?.map((c) => c.category))], [data])

  // The post itself is sent in the chat (the bot copies that message), so hand over to the chat now.
  async function order(id) {
    setBusy(id)
    setOrderError(null)
    try {
      await api('/order', { channelId: id })
      tg.close()
    } catch (e) {
      setOrderError(e)
      setBusy(null)
    }
  }

  if (error) return <Failed error={error} />
  if (!data) return <Note>Yuklanmoqda…</Note>
  if (!data.length) return <Note>Hozircha katalogda kanal yoʻq. Tez orada qoʻshiladi.</Note>
  const shown = category ? data.filter((c) => c.category === category) : data

  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? 'all'}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className="sticker shrink-0 bg-white aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {c ?? 'Hammasi'}
          </button>
        ))}
      </div>
      {orderError && <Failed error={orderError} />}
      <ul className="mt-2 grid gap-4">
        {shown.map((c) => (
          <li key={c.id} className="card bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black">{c.title}</h2>
                <p className="truncate text-sm text-ink/60">{c.username.startsWith('@') ? c.username : 'Yopiq kanal'} · {c.category}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-mint px-2 py-1 text-sm font-black">{som(c.price)} soʻm</span>
            </div>
            <dl className="mt-3 flex gap-5 text-sm">
              <div><dt className="text-ink/60">Obunachilar</dt><dd className="font-bold">{som(c.subscribers)}</dd></div>
              <div><dt className="text-ink/60">Oʻrtacha koʻrish</dt><dd className="font-bold">{som(c.avg_views)}</dd></div>
            </dl>
            <button type="button" disabled={busy !== null} onClick={() => order(c.id)} className="btn btn-primary mt-4 w-full disabled:opacity-60">
              {busy === c.id ? 'Ochilmoqda…' : 'Reklama berish'}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function Orders({ onCatalog }) {
  const { data, error } = useLoad('/me')
  if (error) return <Failed error={error} />
  if (!data) return <Note>Yuklanmoqda…</Note>
  if (!data.orders.length) {
    return (
      <div className="text-center">
        <Note>Hali buyurtma bermagansiz.</Note>
        <button type="button" onClick={onCatalog} className="btn btn-primary">Kanal tanlash</button>
      </div>
    )
  }
  return (
    <ul className="grid gap-4">
      {data.orders.map((o) => {
        const left = o.status === 'live' && timeLeft(o.release_at)
        return (
          <li key={o.id} className="card bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-black">#{o.id} · {o.title}</h2>
                <p className="text-sm text-ink/60">{som(o.price)} soʻm</p>
              </div>
              <Badge status={o.status} map={ORDER_STATUS} />
            </div>
            {left && <p className="mt-2 text-sm font-semibold">Kanal egasiga oʻtishiga: {left}</p>}
            {o.reason && <p className="mt-2 text-sm text-ink/70">{o.reason}</p>}
            {o.link && <button type="button" onClick={() => tg.openTelegramLink(o.link)} className="mt-3 text-sm font-bold underline decoration-brand decoration-[3px] underline-offset-4">Postni koʻrish</button>}
          </li>
        )
      })}
    </ul>
  )
}

function Channels() {
  const { data, error } = useLoad('/me')
  if (error) return <Failed error={error} />
  if (!data) return <Note>Yuklanmoqda…</Note>
  const pending = data.earnings.filter((e) => e.status !== 'completed').reduce((sum, e) => sum + e.payout, 0)
  const earned = data.earnings.filter((e) => e.status === 'completed').reduce((sum, e) => sum + e.payout, 0)

  return (
    <>
      {data.channels.length > 0 && (
        <dl className="card mb-5 grid grid-cols-2 gap-3 bg-mint p-4">
          <div><dt className="text-sm text-ink/70">Kutilmoqda</dt><dd className="text-xl font-black">{som(pending)} soʻm</dd></div>
          <div><dt className="text-sm text-ink/70">Ishlab topilgan</dt><dd className="text-xl font-black">{som(earned)} soʻm</dd></div>
        </dl>
      )}
      {!data.channels.length && <Note>Hali kanal ulamagansiz.</Note>}
      <ul className="grid gap-4">
        {data.channels.map((c) => (
          <li key={c.id} className="card bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-black">{c.title}</h2>
                <p className="text-sm text-ink/60">{som(c.subscribers)} obunachi · {som(c.price)} soʻm</p>
              </div>
              <Badge status={c.status} map={CHANNEL_STATUS} />
            </div>
            {c.note && <p className="mt-2 text-sm text-ink/70">{c.note}</p>}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => tg.openTelegramLink(CONNECT_URL)} className="btn btn-ghost mt-5 w-full">
        ➕ Kanal ulash
      </button>
    </>
  )
}
