import { Plus } from 'lucide-react'

export default function Faq({ t }) {
  const f = t.faq
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t-[3px] border-ink bg-white">
      <div className="mx-auto max-w-4xl px-4 py-24 md:px-8 md:py-32">
        <h1 id="faq-title" data-reveal className="h2">{f.title}</h1>
        <div className="mt-12 space-y-4">
          {f.items.map(([q, a], i) => (
            // Native <details> = keyboard + screen reader support for free; same `name` makes it one-open-at-a-time.
            <details key={i} name="faq" data-reveal className="group rounded-xl border-[3px] border-ink bg-paper px-5 open:bg-mint open:shadow-[5px_5px_0_var(--color-ink)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white transition-colors group-open:bg-accent" aria-hidden="true">
                  <Plus className="size-5 transition-transform duration-300 group-open:rotate-45" strokeWidth={3} />
                </span>
              </summary>
              <p className="max-w-[65ch] pb-6 leading-relaxed text-ink/80">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
