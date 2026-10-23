import { BRAND, BOT_USERNAME, CONTACT, LINKS, botUrl } from '../config'
import { Logo } from './Header'

export default function Footer({ t }) {
  const f = t.footer
  const link = 'text-paper/70 underline-offset-4 hover:text-accent hover:underline'
  return (
    <footer data-dark className="border-t-[3px] border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <Logo label={`${BRAND} — ${t.home}`} />
          <p className="mt-4 max-w-sm text-paper/65">{f.tagline}</p>
        </div>
        <div>
          <h2 className="font-black">{f.contacts}</h2>
          <ul className="mt-4 space-y-2.5">
            <li><a className={link} href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a></li>
            <li><a className={link} href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a className={link} href={botUrl()}>Telegram: @{BOT_USERNAME}</a></li>
          </ul>
        </div>
        <div>
          <h2 className="font-black">{f.docs}</h2>
          <ul className="mt-4 space-y-2.5">
            <li><a className={link} href={LINKS.oferta}>{f.oferta}</a></li>
            <li><a className={link} href={LINKS.privacy}>{f.privacy}</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-7xl border-t-2 border-paper/15 px-4 py-6 text-sm text-paper/50 md:px-8">
        © {new Date().getFullYear()} {BRAND}. {f.rights}
      </p>
    </footer>
  )
}
