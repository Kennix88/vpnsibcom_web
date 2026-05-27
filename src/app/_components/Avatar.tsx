'use client'
import { publicApiClient } from '@app/core/publicApiClient'
import getRandomEmoji from '@app/utils/get-random-emoji.util'
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
  /** Animated conic-gradient ring */
  ring?: boolean
  /** Simple green online dot (ignored when withStatus=true) */
  online?: boolean
  /** Fetch & show connection-status shield badge + reactive ring */
  withStatus?: boolean
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_CFG = {
  loading: {
    // ring colors for conic-gradient
    from: 'var(--warning)',
    via: 'rgba(255,171,64,0.4)',
    // glow pulse rgba
    glow: '255,171,64',
    // badge
    Icon: TbShieldExclamation,
    iconColor: 'var(--warning)',
    badgeBg: 'var(--warning-container)',
    badgeBorder: 'rgba(255,171,64,0.35)',
    // ring animation: pulse continuously
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
          style={{
            color: cfg.iconColor,
            fontSize: Math.round(size * 0.65),
          }}
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

  // Derived ring config
  const showRing = ring || withStatus
  const cfg = STATUS_CFG[status]

  // Scale pulse glow to avatar size: ~11% of w, clamped 4–14px
  const pulseSpread = Math.round(Math.min(14, Math.max(4, w * 0.11)))
  const ringThickness = Math.max(2, Math.round(w * 0.035))
  const badgeSize = Math.max(16, Math.round(w * 0.32))

  /* ── Base avatar image ─────────────────────────────────────────── */
  const imageNode = (
    <div
      className="flex relative justify-center items-center rounded-full"
      style={{
        width: showRing ? '100%' : w,
        height: showRing ? '100%' : w,
        background: 'var(--surface-container)',
      }}>
      {getRandomEmoji()}
      {url && !imageError && (
        <Image
          src={url}
          alt="Avatar"
          width={w}
          height={w}
          className="absolute rounded-full"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )

  /* ── Plain avatar (no ring) ────────────────────────────────────── */
  if (!showRing) {
    return (
      <div {...props} style={{ width: w, height: w, ...props.style }}>
        {imageNode}
      </div>
    )
  }

  /* ── Ring + badge variant ──────────────────────────────────────── */
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
      {/* Pulse glow layer — scaled to avatar size */}
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

      {/* Badge: status shield OR simple online dot */}
      {withStatus && <ShieldBadge status={status} size={badgeSize} />}

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
