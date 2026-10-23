import { useRef } from 'react'
import { BadgeCheck, Clock, Send, Wallet } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP, MQ } from '../lib/motion'

const ICONS = [Wallet, Send, Clock, BadgeCheck]

export default function Timeline({ t }) {
  const root = useRef(null)
  const tl = t.timeline

  useGSAP(() => {
    const items = gsap.utils.toArray('.tl-item')
    const mm = gsap.matchMedia()
    mm.add(MQ, ({ conditions }) => {
      if (conditions.reduce) {
        gsap.set('.tl-line', { strokeDashoffset: 0 })
        items.forEach((el) => el.classList.add('is-on'))
        return () => items.forEach((el) => el.classList.remove('is-on'))
      }
      // Line tip and checkpoints share the same 60% viewport mark, so a box lights as the line reaches it.
      gsap.to('.tl-line', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.tl-list', start: 'top 60%', end: 'bottom 60%', scrub: true } })
      items.forEach((el) => ScrollTrigger.create({ trigger: el.querySelector('.tl-dot'), start: 'center 60%', end: 'max', toggleClass: { targets: el, className: 'is-on' } }))
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} data-dark aria-labelledby="tl-title" className="border-y-[3px] border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 md:grid-cols-2 md:px-8 md:py-36">
        <div className="md:sticky md:top-36 md:self-start">
          <h2 id="tl-title" data-reveal className="h2">{tl.title}</h2>
          <p data-reveal className="mt-5 max-w-md text-lg text-paper/70">{tl.sub}</p>
        </div>

        <ol className="tl-list relative">
          <svg className="absolute top-7 bottom-7 left-7 h-[calc(100%-3.5rem)] w-1 -translate-x-1/2 overflow-visible" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 0V100" stroke="rgb(241 246 238 / .15)" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            <path className="tl-line" d="M1 0V100" stroke="var(--color-accent)" strokeWidth="4" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
          </svg>
          {tl.steps.map(([title, desc], i) => {
            const Icon = ICONS[i]
            return (
              <li key={i} className="tl-item relative flex gap-6 pb-16 last:pb-0">
                <span className="tl-dot relative grid size-14 shrink-0 place-items-center rounded-xl border-[3px] border-paper/25 bg-ink text-paper/60">
                  <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="tl-body pt-1">
                  <h3 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h3>
                  <p className="mt-2 max-w-md leading-relaxed text-paper/70">{desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
