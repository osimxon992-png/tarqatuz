import { BadgeCheck } from 'lucide-react'

// Decorative device frame; the real content lives in the surrounding text.
export default function Phone({ title, subtitle, children, className = '' }) {
  return (
    <div aria-hidden="true" className={`w-[280px] rounded-[2.5rem] border-[3px] border-ink bg-ink p-2 shadow-[10px_10px_0_var(--color-brand)] ${className}`}>
      <div className="flex h-[min(540px,66vh)] min-h-[440px] flex-col overflow-hidden rounded-[2rem] bg-paper">
        <div className="mx-auto mt-2 h-5 w-24 shrink-0 rounded-full bg-ink" />
        {title && (
          <div className="flex items-center gap-3 border-b-2 border-ink bg-white px-4 py-3">
            <span className="size-9 rounded-full border-2 border-ink bg-brand" />
            <div>
              <p className="flex items-center gap-1 text-sm font-bold">{title}<BadgeCheck className="size-3.5" /></p>
              <p className="text-xs text-ink/60">{subtitle}</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
