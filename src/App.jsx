import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, useGSAP, MQ } from './lib/motion'
import { usePath } from './lib/router'
import { dict } from './i18n'
import { BRAND } from './config'
import Header from './components/Header'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Stats from './components/Stats'
import Problems from './components/Problems'
import Audiences from './components/Audiences'
import StepsStack from './components/StepsStack'
import HowItWorks from './components/HowItWorks'
import Catalog from './components/Catalog'
import Timeline from './components/Timeline'
import Pricing from './components/Pricing'
import Faq from './components/Faq'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'
import Privacy from './components/Privacy'

const Home = ({ t }) => (
  <>
    <Hero t={t} />
    <Marquee items={t.marquee} />
    <Stats t={t} />
    <Problems t={t} />
    <Audiences t={t} />
    <StepsStack t={t} />
    <Marquee items={Object.values(t.catalog.cats)} reverse className="border-t-[3px] bg-accent" />
    <Timeline t={t} />
  </>
)

// Paths match the hrefs in t.nav. Unknown paths fall back to the home page.
const PAGES = { '/': Home, '/qanday-ishlaydi': HowItWorks, '/kanallar': Catalog, '/narxlar': Pricing, '/faq': Faq, '/maxfiylik': Privacy }
const HOME_TITLE = document.title

export default function App() {
  const [lang, setLang] = useState('uz')
  const path = usePath()
  const lenis = useRef(null)
  const t = dict[lang]
  const Page = PAGES[path] ?? Home

  useEffect(() => {
    const label = t.nav.find(([href]) => href === path)?.[1] ?? (path === '/maxfiylik' ? t.privacyPage.title : null)
    document.title = label ? `${label} — ${BRAND}` : HOME_TITLE
  }, [path, t])

  useEffect(() => {
    document.documentElement.lang = lang
    ScrollTrigger.refresh() // copy length changes section heights; new pages' triggers measure themselves
  }, [lang])

  useEffect(() => {
    // Back/forward must not restore old scroll positions (pages always open at the top). Set through
    // ScrollTrigger, because it otherwise puts history.scrollRestoration back to "auto" on refresh.
    ScrollTrigger.clearScrollMemory('manual')
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    if (matchMedia(MQ.reduce).matches) return
    lenis.current = new Lenis({ anchors: { offset: -72 } })
    lenis.current.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.current.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.current.destroy()
      lenis.current = null
    }
  }, [])

  // Runs after the page's own effects, so pins exist before these triggers are measured; redone for every page.
  useGSAP(() => {
    // Every page starts at the top. Done here, after the page's pins exist: creating pins (and any leftover
    // smooth scroll) can put back the previous page's scroll position.
    lenis.current?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
    ScrollTrigger.update()

    gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } })

    const mm = gsap.matchMedia()
    mm.add(MQ, ({ conditions }) => {
      gsap.set('[data-reveal]', conditions.reduce ? { opacity: 0 } : { opacity: 0, y: 40, filter: 'blur(10px)' })
      const reveal = (els) =>
        gsap.to(els, {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: conditions.reduce ? 0.4 : 0.9,
          ease: 'power3.out', stagger: 0.08, clearProps: 'filter,transform', overwrite: true,
        })
      // onEnterBack too: content skipped by a jump (anchor link, End key) reveals when scrolled back into view.
      ScrollTrigger.batch('[data-reveal]', { start: 'top 88%', onEnter: reveal, onEnterBack: reveal })
      // Triggers made after the first load (page change) never fire onEnter for what is already on screen.
      reveal(gsap.utils.toArray('[data-reveal]').filter((el) => el.getBoundingClientRect().top < innerHeight * 0.88))
    })
    return () => mm.revert()
  }, { dependencies: [path], revertOnUpdate: true })

  return (
    <>
      <a href="#main" className="sr-only z-[70] rounded-full bg-accent px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        {t.skip}
      </a>
      <div id="progress" aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[5px] origin-left bg-brand" style={{ transform: 'scaleX(0)' }} />
      <Header t={t} lang={lang} setLang={setLang} path={path} />
      <main id="main" key={path}>
        <Page t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </>
  )
}
