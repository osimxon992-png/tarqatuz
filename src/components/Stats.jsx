import { useRef } from 'react'
import { gsap, useGSAP, MQ } from '../lib/motion'
import { CHANNELS_COUNT } from '../config'

// Only facts from the business model; the channel count stays a placeholder until real.
const VALUES = [[CHANNELS_COUNT, ''], ['24', ''], ['15', '%', '10–'], ['100', '%']]

export default function Stats({ t }) {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MQ.motion, () => {
      gsap.utils.toArray('[data-count]').forEach((el) =>
        gsap.from(el, {
          textContent: 0, snap: { textContent: 1 }, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }),
      )
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} className="border-b-[3px] border-ink">
      {/* Ink gaps act as the grid's rules */}
      <dl className="grid grid-cols-2 gap-[3px] bg-ink md:grid-cols-4">
        {VALUES.map(([value, suffix, prefix = ''], i) => {
          const numeric = /^\d+$/.test(value) // a {PLACEHOLDER} stays small and static
          return (
            <div key={i} className={`flex flex-col-reverse px-5 py-10 md:px-8 md:py-14 ${i % 3 === 0 ? 'bg-accent' : 'bg-paper'}`}>
              <dt data-reveal className="mt-3 max-w-[16ch] font-semibold text-ink/75">{t.stats[i]}</dt>
              <dd data-reveal className={`font-black tracking-[-0.04em] tabular-nums [overflow-wrap:anywhere] ${numeric ? 'text-5xl md:text-7xl' : 'text-2xl md:text-3xl'}`}>
                {prefix}<span {...(numeric && { 'data-count': true })}>{value}</span>{suffix}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
