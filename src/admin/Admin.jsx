import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Megaphone, Receipt, ScrollText, Wallet } from 'lucide-react'
import { api } from './api'
import Login from './Login'
import { Audit, Channels, Dashboard, Orders, Payouts } from './views'

const TABS = [
  ['dashboard', 'Bosh panel', LayoutDashboard, Dashboard],
  ['orders', 'Buyurtmalar', Receipt, Orders],
  ['channels', 'Kanallar', Megaphone, Channels],
  ['payouts', 'Toʻlovlar', Wallet, Payouts],
  ['audit', 'Jurnal', ScrollText, Audit],
]

// Route lives in the hash: #orders/live = Orders tab filtered to "live".
function readHash() {
  const [tab, filter = null] = location.hash.slice(1).split('/')
  return { tab: TABS.some(([key]) => key === tab) ? tab : 'dashboard', filter }
}

export default function Admin() {
  const [me, setMe] = useState(undefined) // undefined: still checking the session
  const [route, setRoute] = useState(readHash)

  useEffect(() => {
    api('/me').then(setMe, () => setMe(null))
    const loggedOut = () => setMe(null)
    const hashChanged = () => setRoute(readHash())
    addEventListener('admin:unauthorized', loggedOut)
    addEventListener('hashchange', hashChanged)
    return () => {
      removeEventListener('admin:unauthorized', loggedOut)
      removeEventListener('hashchange', hashChanged)
    }
  }, [])

  if (me === undefined) return null
  if (!me) return <Login onLogin={setMe} />

  const View = TABS.find(([key]) => key === route.tab)[3]
  const setFilter = (f) => { location.hash = f ? `${route.tab}/${f}` : route.tab }
  const logout = () => api('/logout', {}).finally(() => setMe(null))
  const logoutButton = (
    <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border-2 border-paper/30 px-3 py-1.5 text-sm font-bold hover:border-accent hover:text-accent">
      <LogOut className="size-4" aria-hidden="true" />Chiqish
    </button>
  )

  return (
    <div className="min-h-screen bg-paper text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside data-dark className="flex flex-col bg-ink text-paper md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-lg border-2 border-paper/30 bg-brand text-ink">
            <Megaphone className="size-5" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="text-xl font-black">tarqat</span>
          <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-black text-ink">admin</span>
          <div className="ml-auto md:hidden">{logoutButton}</div>
        </div>
        <nav aria-label="Admin menyusi" className="overflow-x-auto px-3 pb-3">
          <ul className="flex gap-1 md:flex-col">
            {TABS.map(([key, label, Icon]) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  aria-current={route.tab === key ? 'page' : undefined}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold whitespace-nowrap text-paper/75 hover:bg-paper/10 hover:text-paper aria-[current=page]:bg-accent aria-[current=page]:text-ink"
                >
                  <Icon className="size-5" aria-hidden="true" />{label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto hidden border-t-2 border-paper/15 p-5 md:block">
          <p className="mb-3 text-sm text-paper/60">Kirgan: <b className="text-paper">{me.username}</b></p>
          {logoutButton}
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <View key={route.tab} filter={route.filter} setFilter={setFilter} />
      </main>
    </div>
  )
}
