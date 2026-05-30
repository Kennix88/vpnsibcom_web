'use client'
import { publicApiClient } from '@app/core/publicApiClient'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  TbShieldCheckFilled,
  TbShieldExclamation,
  TbShieldX,
} from 'react-icons/tb'

/* ─── Types ──────────────────────────────────────────────────────── */
type ConnectionStatus = 'loading' | 'green' | 'danger'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  w?: number
  url?: string
  ring?: boolean
  online?: boolean
  withStatus?: boolean
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_CFG = {
  loading: {
    from: 'var(--warning)',
    via: 'rgba(255,171,64,0.4)',
    glow: '255,171,64',
    Icon: TbShieldExclamation,
    iconColor: 'var(--warning)',
    badgeBg: 'var(--warning-container)',
    badgeBorder: 'rgba(255,171,64,0.35)',
    pulse: true,
  },
  green: {
    from: 'var(--success)',
    via: 'var(--accent-network)',
    glow: '55,227,162',
    Icon: TbShieldCheckFilled,
    iconColor: 'var(--success)',
    badgeBg: 'var(--success-container)',
    badgeBorder: 'rgba(55,227,162,0.35)',
    pulse: false,
  },
  danger: {
    from: 'var(--error)',
    via: 'rgba(255,107,102,0.4)',
    glow: '255,107,102',
    Icon: TbShieldX,
    iconColor: 'var(--error)',
    badgeBg: 'var(--error-container)',
    badgeBorder: 'rgba(255,107,102,0.35)',
    pulse: true,
  },
} satisfies Record<ConnectionStatus, object>

/* ─── Hook ───────────────────────────────────────────────────────── */
function useConnectionStatus(enabled: boolean) {
  const [status, setStatus] = useState<ConnectionStatus>('loading')

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const run = async () => {
      try {
        const result = await publicApiClient.greenCheck()
        if (!cancelled) setStatus(result.isGreen ? 'green' : 'danger')
      } catch {
        if (!cancelled) setStatus('danger')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return status
}

/* ─── Fallback avatar ────────────────────────────────────────────── */
/**
 * Показывается когда url не передан или изображение не загрузилось.
 * Градиентный фон из палитры + SVG-силуэт пользователя.
 */
function AvatarFallback({ size }: { size: number }) {
  const iconSize = Math.round(size * 0.48)

  return (
    <div
      className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
      style={{
        /* мягкий фиолетовый градиент из design-tokens */
        background:
          'linear-gradient(145deg, var(--primary-container), var(--secondary-container))',
      }}>
      {/* SVG силуэт — не зависит от внешних пакетов */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden>
        {/* голова */}
        <circle cx="12" cy="8" r="4" fill="var(--primary)" opacity="0.9" />
        {/* тело */}
        <path
          d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  )
}

/* ─── Shield badge ───────────────────────────────────────────────── */
function ShieldBadge({
  status,
  size,
}: {
  status: ConnectionStatus
  size: number
}) {
  const cfg = STATUS_CFG[status]

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0, rotate: 20 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          bottom: -Math.round(size * 0.15),
          right: -Math.round(size * 0.15),
          background: cfg.badgeBg,
          border: `1.5px solid ${cfg.badgeBorder}`,
          boxShadow: `0 2px 8px rgba(${cfg.glow},0.4)`,
        }}>
        <cfg.Icon
          style={{ color: cfg.iconColor, fontSize: Math.round(size * 0.65) }}
        />
      </motion.span>
    </AnimatePresence>
  )
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function Avatar({
  w = 40,
  url,
  ring = false,
  online = false,
  withStatus = false,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const status = useConnectionStatus(withStatus)

  useEffect(() => {
    setImageError(false)
  }, [url])

  const showFallback = !url || imageError
  const showRing = ring || withStatus
  const cfg = STATUS_CFG[status]

  const pulseSpread = Math.round(Math.min(14, Math.max(4, w * 0.11)))
  const ringThickness = Math.max(2, Math.round(w * 0.035))
  const badgeSize = Math.max(16, Math.round(w * 0.32))

  /* ── Inner image/fallback ──────────────────────────────────────── */
  const imageNode = (
    <div
      className="relative flex justify-center items-center rounded-full overflow-hidden"
      style={{
        width: showRing ? '100%' : w,
        height: showRing ? '100%' : w,
        background: 'var(--surface-container)',
      }}>
      {showFallback ? (
        <AvatarFallback size={showRing ? w : w} />
      ) : (
        <Image
          src={url!}
          alt="Avatar"
          width={w}
          height={w}
          className="absolute inset-0 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )

  /* ── No ring ───────────────────────────────────────────────────── */
  if (!showRing) {
    return (
      <div
        {...props}
        style={{ width: w, height: w, position: 'relative', ...props.style }}>
        {imageNode}
      </div>
    )
  }

  /* ── Ring + badge ──────────────────────────────────────────────── */
  const ringGradient = withStatus
    ? `conic-gradient(from 0deg, ${cfg.from}, ${cfg.via}, ${cfg.from})`
    : 'conic-gradient(from 0deg, var(--primary), var(--accent-network), var(--primary))'

  const glowRgb = withStatus ? cfg.glow : '195,166,255'
  const pulseAnim = withStatus ? cfg.pulse : true

  return (
    <div
      {...props}
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: w, height: w, ...props.style }}>
      {/* Pulse glow */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={
          pulseAnim
            ? {
                boxShadow: [
                  `0 0 0 0px rgba(${glowRgb},0)`,
                  `0 0 0 ${pulseSpread}px rgba(${glowRgb},0.22)`,
                  `0 0 0 0px rgba(${glowRgb},0)`,
                ],
              }
            : {
                boxShadow: `0 0 0 ${Math.round(pulseSpread * 0.6)}px rgba(${glowRgb},0.14)`,
              }
        }
        transition={
          pulseAnim
            ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.5 }
        }
      />

      {/* Ring frame */}
      <motion.div
        key={withStatus ? status : 'default'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="rounded-full"
        style={{
          padding: ringThickness,
          background: ringGradient,
          width: w,
          height: w,
        }}>
        <div
          className="rounded-full overflow-hidden flex items-center justify-center w-full h-full"
          style={{ background: 'var(--background)' }}>
          {imageNode}
        </div>
      </motion.div>

      {/* Shield badge */}
      {withStatus && <ShieldBadge status={status} size={badgeSize} />}

      {/* Simple online dot */}
      {online && !withStatus && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 480 }}
          className="absolute block rounded-full border-2"
          style={{
            width: Math.max(10, Math.round(w * 0.2)),
            height: Math.max(10, Math.round(w * 0.2)),
            bottom: 0,
            right: 0,
            background: 'var(--success)',
            borderColor: 'var(--background)',
            boxShadow: '0 0 7px var(--success)',
          }}
        />
      )}
    </div>
  )
}
