import { useRef } from 'react'
import { Check } from 'lucide-react'
import { gsap, useGSAP, FULL_MOTION } from '../lib/motion'
import { botUrl } from '../config'

const SIDES = [
  { start: 'advertiser', bg: 'bg-accent', from: { xPercent: -40, rotation: -7 } },
  { start: 'owner', bg: 'bg-brand', from: { xPercent: 40, rotation: 7 } },
]

export default function Audiences({ t }) {
  const root = useRef(null)
  const a = t.audiences

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(FULL_MOTION, () => {
      // The two sides slide in from opposite edges and meet in the middle.
      gsap.utils.toArray('.aud-card').forEach((el, i) =>
        gsap.from(el, { ...SIDES[i].from, ease: 'none', scrollTrigger: { trigger: '.aud-grid', start: 'top bottom', end: 'center 60%', scrub: true } }),
      )
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} aria-labelledby="aud-title" className="overflow-hidden border-t-[3px] border-ink">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
        <h2 id="aud-title" data-reveal className="h2 max-w-4xl">{a.title}</h2>
        <div className="aud-grid mt-16 grid gap-8 md:grid-cols-2">
          {SIDES.map((side, i) => (
            // Reveal on the wrapper, slide on the card: two elements, so the transforms never fight.
            <div key={side.start} data-reveal>
              <div className={`aud-card card flex h-full flex-col p-7 md:p-10 ${side.bg}`}>
                <h3 className="text-3xl leading-tight font-black tracking-tight md:text-4xl">{t.how.tabs[i].label}</h3>
                <ul className="mt-8 flex-1 space-y-4">
                  {a.points[i].map((p) => (
                    <li key={p} className="flex items-start gap-3 text-lg font-medium">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border-2 border-ink bg-white">
                        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <a href={botUrl(side.start)} className="btn btn-ghost mt-10 self-start">{i ? t.hero.secondary : t.hero.primary}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
