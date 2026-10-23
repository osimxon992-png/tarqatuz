import { useRef } from 'react'
import { gsap, useGSAP, FULL_MOTION } from '../lib/motion'
import { Link } from '../lib/router'
import Screen, { SCREENS } from './Screen'

const TILES = ['bg-white', 'bg-mint', 'bg-accent', 'bg-brand']
const stickTop = (i) => 100 + i * 22 // px below the viewport top; each later card peeks out a bit lower

export default function StepsStack({ t }) {
  const root = useRef(null)
  const steps = t.how.tabs[0].steps

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(FULL_MOTION, () => {
      const list = root.current.querySelector('.stack-list')
      const cards = gsap.utils.toArray('.stack-card')
      // Measure from the (non-sticky) list: a sticky card's own rect depends on the scroll position.
      const naturalTop = (k) => {
        const gap = parseFloat(getComputedStyle(cards[1]).marginTop)
        return cards.slice(0, k).reduce((sum, c) => sum + c.offsetHeight + gap, 0)
      }
      // Each card shrinks back while the next one slides up over it.
      cards.slice(0, -1).forEach((card, i) =>
        gsap.to(card, {
          scale: 0.9, ease: 'none',
          scrollTrigger: {
            trigger: list, scrub: true, invalidateOnRefresh: true,
            start: () => `top+=${naturalTop(i + 1)} bottom`,
            end: () => `top+=${naturalTop(i + 1)} ${stickTop(i + 1)}px`,
          },
        }),
      )
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} aria-labelledby="steps-title" className="border-t-[3px] border-ink">
      <div className="mx-auto max-w-5xl px-4 py-24 md:px-8 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="steps-title" data-reveal className="h2">{t.steps.title}</h2>
          <Link to="/qanday-ishlaydi" data-reveal className="btn btn-ghost">{t.steps.more}</Link>
        </div>
        {/* Below 768px the cards simply stack; from md up they stick and pile on top of each other */}
        <ol className="stack-list mt-14 space-y-8">
          {steps.map(([title, desc], i) => (
            <li key={i} className={`stack-card card origin-top md:sticky ${TILES[i]}`} style={{ top: stickTop(i) }}>
              <div data-reveal className="grid items-center gap-8 p-6 md:grid-cols-[1fr_280px] md:p-10">
                <div>
                  <span className="grid size-14 place-items-center rounded-xl border-[3px] border-ink bg-white text-2xl font-black">{i + 1}</span>
                  <h3 className="mt-6 text-3xl leading-tight font-black tracking-tight md:text-5xl">{title}</h3>
                  <p className="mt-4 max-w-md text-lg text-ink/80">{desc}</p>
                </div>
                <div aria-hidden="true" className="flex h-[340px] flex-col overflow-hidden rounded-xl border-2 border-ink bg-paper">
                  <Screen id={SCREENS[0][i]} t={t} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
