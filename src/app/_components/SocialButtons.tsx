'use client'
import { config } from '@app/config/client'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  Variants,
} from 'framer-motion'
import { useRef } from 'react'
import { FaAd } from 'react-icons/fa'
import { IoIosArrowDroprightCircle } from 'react-icons/io'
import { RiTelegram2Fill } from 'react-icons/ri'

// ─── Types ──────────────────────────────────────────────────────────────────

type ColorKey = 'info' | 'wager' | 'ad'

interface ButtonConfig {
  href: string
  label: string
  description: string
  icon: React.ElementType
  color: ColorKey
  badge?: 'live' | 'new'
}

// ─── Color Map ───────────────────────────────────────────────────────────────

const colorMap: Record<
  ColorKey,
  {
    bg: string
    text: string
    border: string
    iconBg: string
    glow: string
    shimmer: string
  }
> = {
  info: {
    bg: 'linear-gradient(135deg, var(--info-container) 0%, color-mix(in srgb, var(--info-container) 45%, transparent) 100%)',
    text: 'var(--on-info-container)',
    border: 'var(--info)',
    iconBg: 'rgba(89,191,255,0.15)',
    glow: 'var(--info-glow)',
    shimmer: 'rgba(89,191,255,0.18)',
  },
  wager: {
    bg: 'linear-gradient(135deg, var(--wager-container) 0%, color-mix(in srgb, var(--wager-container) 45%, transparent) 100%)',
    text: 'var(--on-wager-container)',
    border: 'var(--wager)',
    iconBg: 'rgba(214,58,58,0.15)',
    glow: 'var(--wager-container-rgba)',
    shimmer: 'rgba(214,58,58,0.15)',
  },
  ad: {
    bg: 'linear-gradient(135deg, var(--ad-container) 0%, color-mix(in srgb, var(--ad-container) 45%, transparent) 100%)',
    text: 'var(--on-ad-container)',
    border: 'var(--ad)',
    iconBg: 'rgba(255,106,0,0.15)',
    glow: 'var(--ad-container-rgba)',
    shimmer: 'rgba(255,106,0,0.15)',
  },
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, filter: 'blur(6px)', scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 28,
    },
  },
}

// ─── Live Badge ───────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <motion.span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{
        background: 'rgba(55, 227, 162, 0.15)',
        color: 'var(--success)',
        border: '1px solid rgba(55, 227, 162, 0.3)',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 20 }}>
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
        background: 'rgba(195, 166, 255, 0.15)',
        color: 'var(--primary)',
        border: '1px solid rgba(195, 166, 255, 0.3)',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 20 }}>
      new
    </motion.span>
  )
}

// ─── Single Button ────────────────────────────────────────────────────────────

function SocialButton({ btn }: { btn: ButtonConfig }) {
  const Icon = btn.icon
  const c = colorMap[btn.color]

  const ref = useRef<HTMLAnchorElement>(null)

  // Magnetic tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { stiffness: 220, damping: 22 }
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [3, -3]),
    springConfig,
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-4, 4]),
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
          background: c.bg,
          color: c.text,
          borderLeft: `3px solid ${c.border}`,
          boxShadow: `0 2px 16px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="group relative flex items-center gap-3 rounded-xl px-4 py-3 w-full justify-between
                   backdrop-blur-sm border border-white/[0.05] overflow-hidden cursor-pointer
                   no-underline"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{
          boxShadow: `0 6px 28px ${c.glow}, 0 0 0 1px ${c.border}44, inset 0 1px 0 rgba(255,255,255,0.08)`,
          y: -2,
          transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
        }}
        whileTap={{
          scale: 0.972,
          y: 0,
          transition: { type: 'spring', stiffness: 600, damping: 30 },
        }}>
        {/* Shimmer sweep on hover */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${c.shimmer} 50%, transparent 70%)`,
            backgroundSize: '200% 100%',
          }}
          initial={{ backgroundPositionX: '200%' }}
          whileHover={{
            backgroundPositionX: ['-200%', '200%'],
            transition: { duration: 0.55, ease: 'easeInOut' },
          }}
        />

        {/* Glow border pulse on hover */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 0 1px ${c.border}55`,
            transition: 'opacity 0.2s',
          }}
        />

        {/* Icon + Labels */}
        <div
          className="relative flex items-center gap-3 min-w-0"
          style={{ transform: 'translateZ(8px)' }}>
          <motion.div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{
              background: c.iconBg,
              color: c.border,
              boxShadow: `0 0 0 1px ${c.border}22`,
            }}
            whileHover={{
              scale: 1.12,
              rotate: [0, -8, 8, 0],
              transition: { duration: 0.4, ease: 'easeInOut' },
            }}>
            <Icon size={17} />
          </motion.div>

          <div className="flex flex-col min-w-0 gap-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold leading-snug truncate">
                {btn.label}
              </span>
              {btn.badge === 'live' && <LiveBadge />}
              {btn.badge === 'new' && <NewBadge />}
            </div>
            <span className="text-[11px] opacity-50 leading-tight truncate">
              {btn.description}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <motion.div
          className="relative shrink-0 opacity-40 group-hover:opacity-90"
          style={{ transform: 'translateZ(8px)' }}
          whileHover={{ x: 3, scale: 1.15 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
          <IoIosArrowDroprightCircle size={20} />
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
      icon: RiTelegram2Fill,
      color: 'info',
    },
    {
      href: config.TELEGRAM_CHAT_URL || '',
      label: 'Чат и Поддержка',
      description: 'Быстрая помощь онлайн',
      icon: RiTelegram2Fill,
      color: 'info',
      badge: 'live',
    },
    {
      href: 'https://t.me/vpnsibcom?direct',
      label: 'Сотрудничество и Реклама',
      description: 'Партнёрские предложения',
      icon: RiTelegram2Fill,
      color: 'wager',
    },
    {
      href: 'https://taddy.pro/vpnsibcom_bot',
      label: 'Заказать рекламу',
      description: 'Через платформу Taddy',
      icon: FaAd,
      color: 'ad',
      badge: 'new',
    },
  ]

  return (
    <motion.div
      className="flex flex-col gap-2.5 w-full font-mono max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      {buttons.map((btn) => (
        <SocialButton key={btn.href} btn={btn} />
      ))}
    </motion.div>
  )
}
