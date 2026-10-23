import { ArrowUp, Check, Mail, Phone, Send } from 'lucide-react'
import { BRAND, CONTACT, LINKS, TELEGRAM_USERNAME, botUrl } from '../config'
import { Link, navigate } from '../lib/router'
import { Logo } from './Header'

const heading = 'text-sm font-black text-accent'
const link = 'text-paper/75 underline-offset-4 hover:text-paper hover:underline'

function Column({ title, children }) {
  return (
    <div>
      <h2 className={heading}>{title}</h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

export default function Footer({ t }) {
  const f = t.footer
  return (
    <footer data-dark className="overflow-hidden border-t-[3px] border-ink bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8 md:pt-20">
        {/* Contact strip: the three ways to reach us, big enough to tap */}
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            [Send, f.telegram, `@${TELEGRAM_USERNAME}`, botUrl('advertiser'), f.reply],
            [Phone, f.phone, CONTACT.phoneLabel, `tel:${CONTACT.phone}`],
            [Mail, f.email, CONTACT.email, `mailto:${CONTACT.email}`],
          ].map(([Icon, label, value, href, note]) => (
            <li key={label}>
              <a href={href} className="group flex h-full items-center gap-4 rounded-2xl border-[3px] border-paper/20 p-5 transition-colors hover:border-accent">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-ink">
                  <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-paper/60">{label}</span>
                  <span className="block truncate text-lg font-black group-hover:text-accent">{value}</span>
                  {note && <span className="block text-xs text-paper/50">{note}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo label={`${BRAND} — ${t.home}`} />
            <p className="mt-4 max-w-sm text-paper/65">{f.tagline}</p>
            <h2 className={`${heading} mt-8`}>{f.payTitle}</h2>
            <ul className="mt-4 space-y-2.5">
              {f.payPoints.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-paper/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
          </div>
          <Column title={f.pages}>
            <li><Link to="/" className={link}>{f.homePage}</Link></li>
            {t.nav.map(([href, label]) => <li key={href}><Link to={href} className={link}>{label}</Link></li>)}
          </Column>
          <Column title={f.forWhom}>
            <li><a href={botUrl('advertiser')} className={link}>{f.forAdvertisers}</a></li>
            <li><a href={botUrl('owner')} className={link}>{f.forOwners}</a></li>
            <li><a href={botUrl('catalog')} className={link}>{t.catalog.allCta}</a></li>
          </Column>
          <Column title={f.docs}>
            <li><a href={LINKS.oferta} className={link}>{f.oferta}</a></li>
            <li><a href={LINKS.privacy} className={link}>{f.privacy}</a></li>
          </Column>
        </div>
      </div>

      {/* Oversized wordmark: the poster-wall style signing off */}
      <p aria-hidden="true" className="mt-16 text-center text-[24vw] leading-[0.75] font-black tracking-[-0.06em] text-paper/[0.07] select-none">
        {BRAND}
      </p>

      <div className="border-t-2 border-paper/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-paper/55 md:px-8">
          <p>© {new Date().getFullYear()} {BRAND}. {f.rights}</p>
          <button type="button" onClick={() => navigate(location.pathname)} className="flex items-center gap-2 font-bold text-paper/75 hover:text-accent">
            {f.top}<ArrowUp className="size-4" strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
