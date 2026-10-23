import { useRef } from 'react'
import { gsap, useGSAP, MQ } from '../lib/motion'
import { HAS_BOT, botUrl } from '../config'

export default function FinalCta({ t }) {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MQ.motion, () => {
      const st = { trigger: root.current, start: 'top bottom', end: 'center center', scrub: true }
      gsap.fromTo('.cta-bg', { scale: 0.82 }, { scale: 1, ease: 'none', scrollTrigger: { ...st } })
      gsap.fromTo('.cta-text', { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { ...st } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} aria-labelledby="cta-title" className="border-t-[3px] border-ink px-4 py-20 md:px-8 md:py-28">
      <div className="relative mx-auto max-w-7xl px-6 py-24 text-center md:py-36">
        <div className="cta-bg absolute inset-0 rounded-[2rem] border-[3px] border-ink bg-accent shadow-[12px_12px_0_var(--color-ink)]" aria-hidden="true" />
        <div className="cta-text relative">
          <h2 id="cta-title" className="mx-auto max-w-4xl text-[clamp(2.4rem,6.5vw,5.5rem)] leading-[0.92] font-black tracking-[-0.045em] text-balance">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium">{t.cta.sub}</p>
          <a href={botUrl()} className="btn mt-10 bg-ink px-8 py-4 text-base text-paper shadow-[5px_5px_0_var(--color-brand)] hover:shadow-[7px_7px_0_var(--color-brand)]">
            {HAS_BOT ? t.openBot : t.writeUs}
          </a>
        </div>
      </div>
    </section>
  )
}
