import { ReactNode } from 'react'

/* ─── Секционный заголовок — единый стиль для всех блоков заданий ──── */
export function SectionHeading({
  icon,
  title,
  hint,
}: {
  icon: ReactNode
  title: string
  hint?: string
}) {
  return (
    <div className="flex items-start gap-2 px-1">
      <span
        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
        style={{
          background: 'rgba(245,166,35,0.12)',
          color: 'var(--star)',
        }}>
        {icon}
      </span>
      <div className="flex flex-col min-w-0">
        <span
          className="text-[12.5px] font-mono font-bold uppercase tracking-wide"
          style={{ color: 'var(--on-surface)' }}>
          {title}
        </span>
        {hint && (
          <span
            className="text-[10.5px] font-mono"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.75 }}>
            {hint}
          </span>
        )}
      </div>
    </div>
  )
}
