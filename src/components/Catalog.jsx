import { useRef } from 'react'
import { BadgeCheck, Eye, Info } from 'lucide-react'
import { gsap, useGSAP, FULL_MOTION } from '../lib/motion'
import { botUrl } from '../config'
import { som } from '../lib/fee'

// Demo data — shown with a visible "demo" label, not real channels.
const CHANNELS = [
  ['news', '@namuna_yangiliklar', '128K', '41K', 1200000],
  ['tech', '@namuna_tech', '54K', '19K', 650000],
  ['edu', '@namuna_talim', '87K', '23K', 800000],
  ['sport', '@namuna_sport', '212K', '66K', 1800000],
  ['biz', '@namuna_biznes', '36K', '12K', 550000],
  ['auto', '@namuna_avto', '61K', '17K', 600000],
  ['food', '@namuna_oshxona', '95K', '28K', 700000],
  ['fashion', '@namuna_moda', '44K', '15K', 500000],
]
// Posters on a wall: tiles cycle through the palette.
const TILES = ['bg-white', 'bg-accent', 'bg-mint', 'bg-brand']

const wide = 'md:motion-safe:w-[300px] md:motion-safe:shrink-0'

export default function Catalog({ t }) {
  const root = useRef(null)
  const c = t.catalog

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(FULL_MOTION, () => {
      const track = root.current.querySelector('.cat-track')
      const box = track.parentElement
      const dist = () => {
        const cs = getComputedStyle(box)
        return track.scrollWidth - (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
      }
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.cat-pin', pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true },
      })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="kanallar" ref={root} aria-labelledby="cat-title" className="overflow-hidden">
      <div className="cat-pin py-24 md:motion-safe:flex md:motion-safe:min-h-screen md:motion-safe:flex-col md:motion-safe:justify-center md:motion-safe:pt-28 md:motion-safe:pb-16">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 id="cat-title" data-reveal className="h2">{c.title}</h1>
              <p data-reveal className="mt-4 max-w-xl text-lg text-ink/75">{c.sub}</p>
            </div>
            <p data-reveal className="sticker -rotate-2 bg-accent py-2 shadow-[3px_3px_0_var(--color-ink)]">
              <Info className="size-4" strokeWidth={2.5} aria-hidden="true" />{c.demo}
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 w-full max-w-7xl px-4 md:px-8">
          <ul className="cat-track grid gap-6 pr-2 pb-2 sm:grid-cols-2 lg:grid-cols-4 md:motion-safe:flex md:motion-safe:w-max">
            {CHANNELS.map(([cat, handle, subs, views, price], i) => (
              <li key={handle} className={`card flex flex-col p-6 ${TILES[i % TILES.length]} ${wide}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{c.cats[cat]}</span>
                  <span className="sticker bg-white px-2.5 text-xs">
                    <BadgeCheck className="size-3.5" strokeWidth={2.5} aria-hidden="true" />{c.verified}
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink font-black text-paper" aria-hidden="true">
                    {handle[8].toUpperCase()}
                  </span>
                  <p className="truncate font-bold">{handle}</p>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-ink/70">{c.subs}</dt>
                    <dd className="mt-1 text-2xl font-black tracking-tight">{subs}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-ink/70"><Eye className="size-3.5" aria-hidden="true" />{c.views}</dt>
                    <dd className="mt-1 text-2xl font-black tracking-tight">{views}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex items-end justify-between gap-2 border-t-2 border-dashed border-ink pt-4">
                  <span className="text-sm text-ink/70">{c.price}</span>
                  <span className="text-lg font-black tracking-tight">{som(price)} <span className="text-sm font-bold">{t.cur}</span></span>
                </div>
              </li>
            ))}
            <li className={`card flex flex-col justify-between bg-ink p-6 text-paper ${wide}`}>
              <p className="text-3xl leading-tight font-black tracking-tight">{c.allTitle}</p>
              <a href={botUrl('catalog')} className="btn btn-primary mt-8 self-start">{c.allCta}</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
