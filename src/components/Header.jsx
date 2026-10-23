import { useEffect, useState } from 'react'
import { Megaphone, Menu, X } from 'lucide-react'
import { BRAND, botUrl } from '../config'
import { Link } from '../lib/router'

export function Logo({ label }) {
  return (
    <Link to="/" aria-label={label} className="flex items-center gap-2.5 text-xl font-black tracking-tight">
      <span className="grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-brand text-ink">
        <Megaphone className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </span>
      {BRAND}
    </Link>
  )
}

export default function Header({ t, lang, setLang, path }) {
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  const links = (className) =>
    t.nav.map(([href, label]) => (
      <li key={href}>
        <Link to={href} aria-current={path === href ? 'page' : undefined} className={className}>{label}</Link>
      </li>
    ))

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 md:gap-10 md:px-8">
        <Logo label={`${BRAND} — ${t.home}`} />
        <nav aria-label={t.navLabel} className="hidden lg:block">
          <ul className="flex gap-7 text-[15px] font-semibold">
            {links('decoration-brand decoration-[3px] underline-offset-[6px] hover:underline aria-[current=page]:font-black aria-[current=page]:underline')}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div role="group" aria-label={t.langLabel} className="flex overflow-hidden rounded-lg border-[3px] border-ink text-xs font-black">
            {['uz', 'ru'].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 transition-colors ${lang === l ? 'bg-ink text-paper' : 'bg-white hover:bg-mint'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href={botUrl()} className="btn btn-primary hidden px-4 py-2 text-sm sm:inline-flex">{t.openBot}</a>
          <button
            type="button"
            aria-label={t.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-lg border-[3px] border-ink bg-white lg:hidden"
          >
            {open ? <X className="size-5" strokeWidth={3} /> : <Menu className="size-5" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label={t.navLabel} className="border-t-[3px] border-ink bg-paper px-4 pt-2 pb-6 lg:hidden">
          <ul className="divide-y-2 divide-ink/15">
            {links('block py-4 text-2xl font-black tracking-tight decoration-brand decoration-4 underline-offset-[6px] aria-[current=page]:underline')}
          </ul>
          <a href={botUrl()} className="btn btn-primary mt-4 w-full sm:hidden">{t.openBot}</a>
        </nav>
      )}
    </header>
  )
}
