import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import { ACTIONS } from './labels'

export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    api(path).then(
      (data) => live && setState({ data, error: null }),
      (error) => live && setState({ data: null, error }),
    )
    return () => { live = false }
  }, [path, tick])
  return { ...state, reload: () => setTick((n) => n + 1) }
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
export const fmtDate = (ms) => (ms ? dateFmt.format(ms) : '—')

export function timeLeft(until, now = Date.now()) {
  const ms = until - now
  if (ms <= 0) return null
  return `${Math.floor(ms / 3_600_000)} soat ${Math.floor((ms % 3_600_000) / 60_000)} daq`
}

export function PageTitle({ title, sub }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
      {sub && <p className="mt-2 text-ink/70">{sub}</p>}
    </header>
  )
}

export function Badge({ status, map }) {
  const [label, colour] = map[status]
  return <span className={`inline-block rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${colour}`}>{label}</span>
}

export function FilterTabs({ value, onChange, map }) {
  const options = [[null, 'Hammasi'], ...Object.entries(map).map(([k, [label]]) => [k, label])]
  return (
    <div role="group" aria-label="Holat boʻyicha filtr" className="mb-5 flex flex-wrap gap-2">
      {options.map(([key, label]) => (
        <button
          key={label}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-bold ${value === key ? 'bg-ink text-paper' : 'bg-white hover:bg-mint'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Table({ head, rows, empty }) {
  if (!rows) return null
  if (!rows.length) return <p className="rounded-2xl border-[3px] border-dashed border-ink/30 p-8 text-center text-ink/60">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-2xl border-[3px] border-ink bg-white shadow-[6px_6px_0_var(--color-ink)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b-[3px] border-ink bg-paper">
          <tr>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y-2 divide-ink/10 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">{rows}</tbody>
      </table>
    </div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <p role="alert" className="mb-5 rounded-xl border-2 border-alert bg-alert/10 px-4 py-3 font-semibold">{error.message}</p>
}

// A button that asks for confirmation (and a reason when the rule needs one) before calling onRun(reason).
export function ActionButton({ action, needReason, onRun }) {
  const dialog = useRef(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [label, explain, colour] = ACTIONS[action]

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onRun(reason)
      dialog.current.close()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setReason(''); setError(null); dialog.current.showModal() }}
        className={`rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-bold whitespace-nowrap shadow-[3px_3px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${colour}`}
      >
        {label}
      </button>
      <dialog ref={dialog} className="m-auto w-[min(92vw,440px)] rounded-2xl border-[3px] border-ink bg-paper p-0 text-ink shadow-[8px_8px_0_var(--color-ink)] backdrop:bg-ink/60">
        <form onSubmit={submit} className="p-6">
          <h2 className="text-xl font-black">{label}</h2>
          <p className="mt-2 text-ink/75">{explain}</p>
          {needReason && (
            <label className="mt-4 block">
              <span className="text-sm font-bold">Izoh (jurnalga yoziladi)</span>
              <textarea
                required
                maxLength={500}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-ink bg-white p-3"
              />
            </label>
          )}
          {error && <p role="alert" className="mt-3 rounded-lg border-2 border-alert bg-alert/10 px-3 py-2 text-sm font-semibold">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialog.current.close()} className="btn btn-ghost py-2">Bekor qilish</button>
            <button type="submit" disabled={busy} className="btn btn-primary py-2 disabled:opacity-60">{busy ? 'Bajarilmoqda…' : 'Tasdiqlash'}</button>
          </div>
        </form>
      </dialog>
    </>
  )
}
