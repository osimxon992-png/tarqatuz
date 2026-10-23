import { BadgeCheck, ShieldCheck, Timer, X } from 'lucide-react'

const ICONS = [BadgeCheck, ShieldCheck, Timer]

export default function Problems({ t }) {
  const p = t.problems
  return (
    <section aria-labelledby="problems-title" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
      <h2 id="problems-title" data-reveal className="h2 max-w-4xl">{p.title}</h2>
      <ul className="mt-16 grid gap-8 md:grid-cols-3">
        {p.items.map(([problem, solution, desc], i) => {
          const Icon = ICONS[i]
          return (
            // Each card reads top-down: the old problem, crossed out, then what replaces it.
            <li key={i} data-reveal className="card flex flex-col overflow-hidden bg-white">
              <p className="flex items-center gap-2 border-b-[3px] border-ink bg-alert/15 px-6 py-4 font-bold text-ink/70 line-through decoration-alert decoration-[3px]">
                <X className="size-5 shrink-0 text-alert" strokeWidth={3} aria-hidden="true" />{problem}
              </p>
              <div className="flex flex-1 flex-col p-6 md:p-7">
                <span className="grid size-12 place-items-center rounded-xl border-[3px] border-ink bg-brand">
                  <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl leading-tight font-black tracking-tight">{solution}</h3>
                <p className="mt-3 leading-relaxed text-ink/75">{desc}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
