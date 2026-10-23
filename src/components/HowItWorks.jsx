import { useRef, useState } from 'react'
import { ScrollTrigger, gsap, useGSAP, FULL_MOTION } from '../lib/motion'
import { BRAND } from '../config'
import Phone from './Phone'
import Screen, { SCREENS } from './Screen'


export default function HowItWorks({ t }) {
  const root = useRef(null)
  const [tab, setTab] = useState(0)
  const [step, setStep] = useState(0)
  const h = t.how
  const steps = h.tabs[tab].steps

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(FULL_MOTION, () => {
      ScrollTrigger.create({
        trigger: '.how-pin', pin: true, start: 'top top', end: '+=300%',
        onUpdate: (self) => setStep(Math.min(3, Math.floor(self.progress * 4))),
      })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="qanday" ref={root} aria-labelledby="how-title" className="border-y-[3px] border-ink bg-mint">
      <div className="how-pin mx-auto max-w-7xl px-4 py-24 md:flex md:min-h-screen md:items-center md:px-8 md:pt-28 md:pb-16">
        <div className="grid w-full gap-12 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
          <div>
            <h1 id="how-title" data-reveal className="h2">{h.title}</h1>
            <p data-reveal className="mt-4 max-w-lg text-lg text-ink/75">{h.sub}</p>
            <div data-reveal role="group" aria-label={h.tabsLabel} className="mt-8 inline-flex flex-wrap overflow-hidden rounded-xl border-[3px] border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]">
              {h.tabs.map((tb, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={tab === i}
                  onClick={() => setTab(i)}
                  className={`px-4 py-2.5 text-sm font-bold transition-colors ${tab === i ? 'bg-ink text-paper' : 'hover:bg-accent'}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Desktop: one list, active step follows scroll (or click) */}
            <ol className="mt-8 hidden max-w-xl space-y-3 md:block">
              {steps.map(([title, desc], i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={step === i ? 'step' : undefined}
                    className={`flex w-full gap-4 rounded-xl border-[3px] p-4 text-left transition-[background-color,border-color,box-shadow] duration-200 ${step === i ? 'border-ink bg-white shadow-[5px_5px_0_var(--color-ink)]' : 'border-transparent hover:border-ink/30'}`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink text-sm font-black ${step === i ? 'bg-accent' : 'bg-transparent'}`}>{i + 1}</span>
                    <span>
                      <span className="block text-lg leading-8 font-black tracking-tight">{title}</span>
                      {step === i && <span className="screen-in mt-1 block text-ink/75">{desc}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {/* Mobile: plain vertical stack, every step with its screen */}
            <ol className="mt-10 space-y-6 md:hidden">
              {steps.map(([title, desc], i) => (
                <li key={i} data-reveal className="card bg-white p-5">
                  <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-accent text-sm font-black">{i + 1}</span>
                  <h3 className="mt-3 text-xl font-black tracking-tight">{title}</h3>
                  <p className="mt-1 text-ink/75">{desc}</p>
                  <div aria-hidden="true" className="mt-5 flex min-h-80 flex-col overflow-hidden rounded-xl border-2 border-ink bg-paper">
                    <Screen id={SCREENS[tab][i]} t={t} />
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="hidden md:block">
            <Phone title={BRAND} subtitle="bot">
              <div key={`${tab}-${step}`} className="screen-in flex flex-1 flex-col">
                <Screen id={SCREENS[tab][step]} t={t} />
              </div>
            </Phone>
            <div className="mt-7 flex justify-center gap-2" aria-hidden="true">
              {steps.map((_, i) => (
                <span key={i} className={`h-3 rounded-full border-2 border-ink transition-all duration-300 ${i === step ? 'w-10 bg-ink' : 'w-3 bg-white'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
