import { useRef } from 'react'
import { Asterisk } from 'lucide-react'
import { gsap, useGSAP, MQ } from '../lib/motion'

// Decorative ticker; the same facts are stated elsewhere on the page. Moves with scroll, not on a timer.
export default function Marquee({ items, reverse = false, className = 'border-b-[3px] bg-brand' }) {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MQ.motion, () => {
      gsap.fromTo('.mq-track', { xPercent: reverse ? -50 : 0 }, {
        xPercent: reverse ? 0 : -50, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <div ref={root} aria-hidden="true" className={`overflow-hidden border-ink py-4 md:py-5 ${className}`}>
      <div className="mq-track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {items.map((x) => (
              <span key={x} className="flex items-center gap-6 pr-6 text-2xl font-black tracking-tight whitespace-nowrap md:text-4xl">
                {x}<Asterisk className="size-7 md:size-9" strokeWidth={3} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
