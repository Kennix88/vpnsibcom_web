'use client'
import { config } from '@app/config/client'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  Variants,
} from 'framer-motion'
import { useRef, useState } from 'react'
import {
  HiChatBubbleLeftRight,
  HiChevronRight,
  HiLockClosed,
  HiMegaphone,
  HiSpeakerWave,
} from 'react-icons/hi2'

// ─── Types ──────────────────────────────────────────────────────────────────

type AccentKey = 'info' | 'success' | 'tertiary' | 'ad'

interface ButtonConfig {
  href: string
  label: string
  description: string
  icon: React.ElementType
  accent: AccentKey
  badge?: 'live' | 'new'
}

// ─── Accent Map ──────────────────────────────────────────────────────────────
// Each entry only carries a single CSS var name — every visual (icon chip,
// hover glow, border) is derived from it with color-mix so the palette stays
// in sync with the rest of the app's design tokens automatically.

const accentVar: Record<AccentKey, string> = {
  info: 'var(--info)',
  success: 'var(--success)',
  tertiary: 'var(--tertiary)',
  ad: 'var(--ad)',
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
}

// ─── Status Badges (same pill language as the rest of the app) ──────────────

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
      transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 20 }}>
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
      transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 20 }}>
      new
    </motion.span>
  )
}

// ─── Single Button ────────────────────────────────────────────────────────────

function SocialButton({ btn }: { btn: ButtonConfig }) {
  const Icon = btn.icon
  const accent = accentVar[btn.accent]
  const ref = useRef<HTMLAnchorElement>(null)
  const [pressed, setPressed] = useState(false)

  // Subtle magnetic tilt — kept light so it reads as polish, not a gimmick
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { stiffness: 250, damping: 26 }
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [2, -2]),
    springConfig,
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-2.5, 2.5]),
    springConfig,
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    mouseX.set((e.clientX - left) / width - 0.5)
    mouseY.set((e.clientY - top) / height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div variants={itemVariants} style={{ perspective: 800 }}>
      <motion.a
        ref={ref}
        href={btn.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--surface-border)',
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 w-full
                   overflow-hidden cursor-pointer no-underline
                   focus-visible:outline-none focus-visible:ring-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        whileHover={{
          y: -2,
          background: 'var(--surface-container-high)',
          borderColor: `color-mix(in srgb, ${accent} 35%, var(--surface-border))`,
          boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.04)`,
          transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
        }}
        whileTap={{
          scale: 0.976,
          y: 0,
          transition: { type: 'spring', stiffness: 600, damping: 32 },
        }}>
        {/* Faint shimmer sweep on hover — neutral, not colored, so it never clashes */}
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

        {/* Icon chip */}
        <motion.div
          className="relative flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{
            background: `color-mix(in srgb, ${accent} 16%, transparent)`,
            color: accent,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 22%, transparent)`,
            transform: 'translateZ(6px)',
          }}
          whileHover={{
            scale: 1.08,
            rotate: [0, -6, 6, 0],
            transition: { duration: 0.4, ease: 'easeInOut' },
          }}>
          <Icon size={17} />
        </motion.div>

        {/* Labels */}
        <div
          className="relative flex flex-col min-w-0 gap-0.5 flex-1"
          style={{ transform: 'translateZ(4px)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-sm font-semibold leading-snug truncate"
              style={{ color: 'var(--on-surface)' }}>
              {btn.label}
            </span>
            <AnimatePresence>
              {btn.badge === 'live' && <LiveBadge />}
              {btn.badge === 'new' && <NewBadge />}
            </AnimatePresence>
          </div>
          <span
            className="text-[11px] leading-tight"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
            {btn.description}
          </span>
        </div>

        {/* Arrow */}
        <motion.div
          className="relative shrink-0"
          style={{ color: 'var(--outline)', transform: 'translateZ(4px)' }}
          animate={{ x: pressed ? 1 : 0 }}
          whileHover={{ x: 3, color: accent }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
          <HiChevronRight size={18} />
        </motion.div>
      </motion.a>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialButtons() {
  const buttons: ButtonConfig[] = [
    {
      href: config.TELEGRAM_CHANNEL_URL || '',
      label: 'Канал',
      description: 'Новости и обновления',
      icon: HiMegaphone,
      accent: 'info',
    },
    {
      href: config.TELEGRAM_CHAT_URL || '',
      label: 'Чат и поддержка',
      description: 'Быстрая помощь онлайн',
      icon: HiChatBubbleLeftRight,
      accent: 'success',
      badge: 'live',
    },
    {
      href: 'https://t.me/vpnsibcom?direct',
      label: 'Личные вопросы',
      description: 'Приватная поддержка, реклама и сотрудничество',
      icon: HiLockClosed,
      accent: 'tertiary',
    },
    {
      href: 'https://taddy.pro/vpnsibcom_bot',
      label: 'Заказать рекламу',
      description: 'Через платформу Taddy',
      icon: HiSpeakerWave,
      accent: 'ad',
      badge: 'new',
    },
  ]

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full font-mono max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      {buttons.map((btn) => (
        <SocialButton key={btn.href} btn={btn} />
      ))}
    </motion.div>
  )
}
