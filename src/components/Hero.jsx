import { Fragment, useRef } from 'react'
import { BadgeCheck, Clock } from 'lucide-react'
import { gsap, useGSAP, MQ } from '../lib/motion'
import { botUrl } from '../config'
import Phone from './Phone'
import { AdPost } from './Screen'

const Words = ({ text }) =>
  text.split(' ').map((w, i) => (
    <Fragment key={i}>
      <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        <span className="hero-word inline-block">{w}</span>
      </span>{' '}
    </Fragment>
  ))

const STAMP_TILT = -14

export default function Hero({ t }) {
  const root = useRef(null)
  const h = t.hero

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MQ, ({ conditions }) => {
      if (conditions.reduce) {
        gsap.from('.hero-word, .hero-box, .hero-fade, .hero-phone, .hero-stamp', { opacity: 0, duration: 0.6 })
        return
      }
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-box', { scaleX: 0, transformOrigin: 'left center', duration: 0.7 }, 0.35)
        .from('.hero-word', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.08 }, 0)
        .from('.hero-fade', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.6)
        .from('.hero-phone', { y: 90, opacity: 0, duration: 1.1 }, 0.5)
        // The one loud moment: the "verified" stamp slams onto the post.
        .fromTo('.hero-stamp', { scale: 2.6, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: STAMP_TILT, duration: 0.45, ease: 'power3.in' }, 1.3)
        .to('.hero-phone', { x: 6, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' }, '>')
      gsap.to('.hero-float', { y: -14, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      const scroll = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('.hero-parallax', { yPercent: -16, ease: 'none', scrollTrigger: { ...scroll } })
      gsap.to('.hero-bg', { yPercent: 40, ease: 'none', scrollTrigger: { ...scroll } }) // drifts down = moves slower than content
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="top" ref={root} aria-labelledby="hero-title" className="relative overflow-hidden border-b-[3px] border-ink pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="hero-bg pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-28 -right-40 size-[560px] rounded-full border-[3px] border-ink bg-mint max-lg:top-auto max-lg:-bottom-56" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-20 px-4 md:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="hero-fade sticker bg-white">{h.badge}</p>
          <h1 id="hero-title" className="mt-7 text-[clamp(2.7rem,6.6vw,6rem)] leading-[0.92] font-black tracking-[-0.045em]">
            <Words text={h.titleA} />
            <span className="hero-box mt-3 inline-block rounded-2xl border-[3px] border-ink bg-brand px-4 pt-1 pb-2 shadow-[6px_6px_0_var(--color-ink)]">
              <Words text={h.titleB} />
            </span>
          </h1>
          <p className="hero-fade mt-8 max-w-xl text-lg leading-relaxed text-ink/75 md:text-xl">{h.sub}</p>
          <div className="hero-fade mt-10 flex flex-wrap gap-4">
            <a href={botUrl('advertiser')} className="btn btn-primary">{h.primary}</a>
            <a href={botUrl('owner')} className="btn btn-ghost">{h.secondary}</a>
          </div>
        </div>

        <div className="hero-phone relative mx-auto">
          <div className="hero-parallax">
            <div className="hero-float relative">
              <Phone title={h.channel} subtitle={`42 100 ${h.subs}`}>
                <div className="flex flex-1 flex-col justify-end p-3">
                  <AdPost t={t} />
                </div>
              </Phone>
              <div
                aria-hidden="true"
                className="hero-stamp absolute top-20 -left-14 grid size-32 place-items-center rounded-full border-[3px] border-ink bg-accent text-center shadow-[5px_5px_0_var(--color-ink)] max-sm:-left-4"
                style={{ transform: `rotate(${STAMP_TILT}deg)` }}
              >
                <span className="grid size-[104px] place-items-center rounded-full border-2 border-dashed border-ink px-2 text-sm leading-tight font-black">
                  <span><BadgeCheck className="mx-auto mb-1 size-6" strokeWidth={2.5} />{h.stamp}</span>
                </span>
              </div>
              <div aria-hidden="true" className="absolute -right-10 bottom-28 flex rotate-3 items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-3 text-sm font-bold shadow-[5px_5px_0_var(--color-ink)] max-sm:-right-3">
                <Clock className="size-5" strokeWidth={2.5} />{h.chipTimer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
