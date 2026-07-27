'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { HiChevronRight } from 'react-icons/hi2'

/* ─── Общий тип иконки — принимает ЛЮБОЙ компонент-иконку (react-icons,
 * lucide-react, свой кастомный SVG-компонент). Если нужной иконки нет
 * в пресетах реестра — просто импортируешь любую другую и передаёшь сюда,
 * никаких доп. правок в этом файле не требуется. ── */
export type IconComponent = React.ElementType<{ size?: number }>

export type AccentKey =
  | 'info'
  | 'success'
  | 'tertiary'
  | 'ad'
  | 'error'
  | 'primary'

export const ACCENT_VAR: Record<AccentKey, string> = {
  info: 'var(--info)',
  success: 'var(--success)',
  tertiary: 'var(--tertiary)',
  ad: 'var(--ad)',
  error: 'var(--error)',
  primary: 'var(--primary)',
}

export type BadgeKind = 'live' | 'new'

export type ActionButtonVariant = 'card' | 'row'

export interface ActionButtonProps {
  icon: IconComponent
  label: string
  description?: string
  accent: AccentKey
  badge?: BadgeKind
  variant?: ActionButtonVariant
  onClick: () => void
}

/* ─── Status badges — переиспользуются в обоих вариантах ─────────── */
function LiveBadge() {
  return (
    <motion.span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--success) 15%, transparent)',
        color: 'var(--success)',
        border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}>
      <motion.span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--success)' }}
        animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      live
    </motion.span>
  )
}

function NewBadge() {
  return (
    <motion.span
      className="flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
        color: 'var(--primary)',
        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}>
      new
    </motion.span>
  )
}

/* ─── CARD variant — крупная плитка (grid), с 3D-tilt, как в SocialButtons ── */
function CardButton({
  icon: Icon,
  label,
  description,
  accent,
  badge,
  onClick,
}: ActionButtonProps) {
  const accentColor = ACCENT_VAR[accent]
  const ref = useRef<HTMLButtonElement>(null)
  const [pressed, setPressed] = useState(false)

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--surface-border)',
      }}
      className="group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 w-full
                 overflow-hidden cursor-pointer text-left
                 focus-visible:outline-none focus-visible:ring-2"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      whileHover={{
        y: -2,
        background: 'var(--surface-container-high)',
        borderColor: `color-mix(in srgb, ${accentColor} 35%, var(--surface-border))`,
        boxShadow: `0 8px 24px color-mix(in srgb, ${accentColor} 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
      }}
      whileTap={{
        scale: 0.976,
        y: 0,
        transition: { type: 'spring', stiffness: 600, damping: 32 },
      }}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.05) 50%, transparent 65%)',
          backgroundSize: '200% 100%',
        }}
        initial={{ backgroundPositionX: '200%' }}
        whileHover={{
          backgroundPositionX: ['-200%', '200%'],
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />

      <motion.div
        className="relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{
          background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
          color: accentColor,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 22%, transparent)`,
        }}
        whileHover={{
          scale: 1.08,
          rotate: [0, -6, 6, 0],
          transition: { duration: 0.4, ease: 'easeInOut' },
        }}>
        <Icon size={17} />
      </motion.div>

      <div className="relative flex flex-col min-w-0 gap-0.5 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-sm font-semibold leading-snug truncate"
            style={{ color: 'var(--on-surface)' }}>
            {label}
          </span>
          <AnimatePresence>
            {badge === 'live' && <LiveBadge />}
            {badge === 'new' && <NewBadge />}
          </AnimatePresence>
        </div>
        {description && (
          <span
            className="text-[11px] leading-tight"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
            {description}
          </span>
        )}
      </div>

      <motion.div
        className="relative shrink-0"
        style={{ color: 'var(--outline)' }}
        animate={{ x: pressed ? 1 : 0 }}
        whileHover={{ x: 3, color: accentColor }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
        <HiChevronRight size={18} />
      </motion.div>
    </motion.button>
  )
}

/* ─── ROW variant — компактная строка списка (для меню/модалок) ──── */
function RowButton({
  icon: Icon,
  label,
  description,
  accent,
  badge,
  onClick,
}: ActionButtonProps) {
  const accentColor = ACCENT_VAR[accent]

  return (
    <motion.button
      onClick={onClick}
      className="group relative flex items-center gap-3 w-full rounded-2xl px-3 py-3 overflow-hidden text-left cursor-pointer"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--surface-border)',
      }}
      whileHover={{
        y: -1,
        background: 'var(--surface-container-high)',
        borderColor: `color-mix(in srgb, ${accentColor} 32%, var(--surface-border))`,
        boxShadow: `0 6px 18px color-mix(in srgb, ${accentColor} 14%, transparent)`,
        transition: { duration: 0.16, ease: [0.2, 0, 0, 1] },
      }}
      whileTap={{ scale: 0.978 }}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.05) 50%, transparent 65%)',
          backgroundSize: '200% 100%',
        }}
        whileHover={{
          backgroundPositionX: ['-200%', '200%'],
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />

      <div
        className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
        style={{
          background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
          color: accentColor,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 22%, transparent)`,
        }}>
        <Icon size={17} />
      </div>

      <div className="relative flex flex-col min-w-0 gap-0.5 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--on-surface)' }}>
            {label}
          </span>
          <AnimatePresence>
            {badge === 'live' && <LiveBadge />}
            {badge === 'new' && <NewBadge />}
          </AnimatePresence>
        </div>
        {description && (
          <span
            className="text-[11px] leading-tight"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
            {description}
          </span>
        )}
      </div>
    </motion.button>
  )
}

/* ─── Public entry point ─────────────────────────────────────────── */
export default function ActionButton({
  variant = 'card',
  ...props
}: ActionButtonProps) {
  return variant === 'row' ? (
    <RowButton variant={variant} {...props} />
  ) : (
    <CardButton variant={variant} {...props} />
  )
}
