import { useState } from 'react'
import { api } from './api'

export default function Login({ onLogin }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      onLogin(await api('/login', { username: form.get('username'), password: form.get('password') }))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4 text-ink">
      <form onSubmit={submit} className="card w-full max-w-sm bg-white p-7">
        <h1 className="text-3xl font-black tracking-tight">tarqat admin</h1>
        <p className="mt-1 text-ink/65">Faqat platforma xodimlari uchun</p>
        <label className="mt-6 block">
          <span className="text-sm font-bold">Login</span>
          <input name="username" autoComplete="username" required className="mt-1 w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold">Parol</span>
          <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
        </label>
        {error && <p role="alert" className="mt-4 rounded-lg border-2 border-alert bg-alert/10 px-3 py-2 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full disabled:opacity-60">{busy ? 'Tekshirilmoqda…' : 'Kirish'}</button>
      </form>
    </main>
  )
}
