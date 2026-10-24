export default function Privacy({ t }) {
  const p = t.privacyPage
  return (
    <section aria-labelledby="privacy-title" className="border-t-[3px] border-ink bg-white">
      <article className="mx-auto max-w-3xl px-4 py-24 md:px-8 md:py-32">
        <h1 id="privacy-title" data-reveal className="h2">{p.title}</h1>
        <p data-reveal className="mt-5 sticker bg-mint">{p.updated}</p>
        <p data-reveal className="mt-8 text-lg leading-relaxed">{p.intro}</p>
        {p.sections.map(([heading, blocks]) => (
          <div key={heading} data-reveal className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">{heading}</h2>
            {blocks.map((b, i) =>
              Array.isArray(b) ? (
                <ul key={i} className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-ink/80 marker:text-brand">
                  {b.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p key={i} className="mt-4 max-w-[70ch] leading-relaxed text-ink/80">{b}</p>
              ),
            )}
          </div>
        ))}
      </article>
    </section>
  )
}
