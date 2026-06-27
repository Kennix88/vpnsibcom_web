'use client'

import { config } from '@app/config/client'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import Image, { type ImageLoaderProps } from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const TADDY_API_URL = 'https://api.taddy.pro/v1'
const TADDY_SDK_VERSION = '1.3.17'
const RING_SIZE = 38
const RING_STROKE = 2.5
const RING_R = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUM = 2 * Math.PI * RING_R

let isTaddyInterstitialRunning = false

// ─── Types ────────────────────────────────────────────────────────────────────

type TaddyAd = {
  id: string
  title: string | null
  description: string | null
  image: string | null
  video: string | null
  icon: string | null
  text: string | null
  button: string | null
  link: string
}

type TaddyUser = {
  id: number | null
  username?: string | null
  source: string | null
}

type LoadState = 'loading' | 'ready' | 'no-fill' | 'error'

export type Props = {
  pubId?: string
  payload?: Record<string, unknown>
  canCloseImmediately?: boolean
  requiredViewSeconds?: number
  demo?: boolean
  showSkeleton?: boolean
  onClosed?: () => void
  onViewed?: () => void
  onNoFill?: () => void
  onError?: (error: unknown) => void
}

// ─── Demo Ad ─────────────────────────────────────────────────────────────────

const demoAd: TaddyAd = {
  id: 'demo-taddy-interstitial',
  title: 'VPNsib Premium',
  description:
    'Fast VPN access for every device with secure, zero-log traffic routing.',
  image: '/logo.png',
  video: null,
  icon: '/logo.png',
  text: 'Get more traffic and premium servers with one tap.',
  button: 'Get Premium',
  link: 'https://fasti.fun/tma',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeAd(value: unknown): TaddyAd | null {
  if (!value || typeof value !== 'object') return null
  const r = value as Partial<TaddyAd>
  if (!r.id || !r.link) return null
  return {
    id: String(r.id),
    title: r.title ?? null,
    description: r.description ?? null,
    image: r.image ?? null,
    video: r.video ?? null,
    icon: r.icon ?? null,
    text: r.text ?? null,
    button: r.button ?? null,
    link: String(r.link),
  }
}

async function getTelegramUser(): Promise<TaddyUser> {
  try {
    const { retrieveLaunchParams, retrieveRawInitData } =
      await import('@tma.js/sdk-react')
    const raw = retrieveRawInitData()
    const lp = retrieveLaunchParams()
    const params = new URLSearchParams(raw ?? '')
    const userRaw = params.get('user')
    const user = userRaw ? JSON.parse(userRaw) : undefined
    return {
      id: typeof user?.id === 'number' ? user.id : null,
      username: typeof user?.username === 'string' ? user.username : null,
      source: lp.tgWebAppStartParam?.trim() || null,
    }
  } catch {
    return { id: null, username: null, source: null }
  }
}

async function requestAd(
  pubId: string,
  payload?: Record<string, unknown>,
): Promise<TaddyAd | null> {
  const user = await getTelegramUser()
  const res = await fetch(`${TADDY_API_URL}/ads/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sdkVersion: TADDY_SDK_VERSION,
      pubId,
      user,
      origin: 'web',
      format: 'app-interstitial',
      fields: [],
      ...(payload ? { payload } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Taddy ads/get ${res.status}`)
  const data = (await res.json()) as { result?: unknown; error?: string }
  if (data.error) throw new Error(data.error)
  return normalizeAd(data.result)
}

async function sendImpression(id: string): Promise<void> {
  await fetch(`${TADDY_API_URL}/ads/impression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch((err) => console.warn('Taddy impression failed', err))
}

const passthroughLoader = ({ src }: ImageLoaderProps) => src

// ─── CornerTimer ──────────────────────────────────────────────────────────────

function CornerTimer({
  closeEnabled,
  remaining,
  total,
  onClose,
}: {
  closeEnabled: boolean
  remaining: number
  total: number
  onClose: () => void
}) {
  const progress = total > 0 ? remaining / total : 0
  const dash = RING_CIRCUM * progress

  return (
    <AnimatePresence mode="wait">
      {closeEnabled ? (
        <motion.button
          key="close-btn"
          type="button"
          onClick={onClose}
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.65 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          className="flex size-[38px] cursor-pointer items-center justify-center rounded-full border border-white/[0.12] backdrop-blur-sm outline-none"
          style={{ background: 'rgba(0,0,0,0.52)' }}
          aria-label="Закрыть рекламу">
          <X
            size={14}
            strokeWidth={2.8}
            style={{ color: 'rgba(255,255,255,0.78)' }}
          />
        </motion.button>
      ) : (
        <motion.div
          key="countdown-ring"
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex size-[38px] items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border border-white/[0.1] backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.52)' }}
          />
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="absolute inset-0 -rotate-90"
            aria-hidden>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${RING_CIRCUM}`}
              style={{ transition: 'stroke-dasharray 0.9s linear' }}
            />
          </svg>
          <span
            className="relative z-10 select-none text-[11px] font-bold tabular-nums"
            style={{ color: 'rgba(255,255,255,0.88)' }}>
            {remaining}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="relative w-full shrink-0 animate-pulse"
        style={{
          height: '46%',
          minHeight: 200,
          background: 'var(--surface-container-lowest)',
        }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              'linear-gradient(to top, var(--surface-container-low) 0%, transparent 100%)',
          }}
        />
      </div>
      <div className="-mt-[26px] ml-4 shrink-0">
        <div
          className="size-[54px] animate-pulse rounded-2xl border-2"
          style={{
            borderColor: 'var(--surface-container-low)',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-2.5">
        <div
          className="h-[26px] w-2/3 animate-pulse rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
        <div className="space-y-1.5">
          <div
            className="h-3.5 w-full animate-pulse rounded"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="h-3.5 w-[80%] animate-pulse rounded"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
        </div>
        <div className="flex-1" />
        <div
          className="h-[52px] w-full animate-pulse rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
        <div
          className="mx-auto h-3.5 w-32 animate-pulse rounded"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaddyInterstitial({
  pubId = config.taddyPubId,
  payload,
  canCloseImmediately = true,
  requiredViewSeconds = canCloseImmediately ? 0 : 5,
  demo = false,
  showSkeleton = true,
  onClosed,
  onViewed,
  onNoFill,
  onError,
}: Props) {
  const [ad, setAd] = useState<TaddyAd | null>(demo ? demoAd : null)
  const [loadState, setLoadState] = useState<LoadState>(
    demo ? 'ready' : 'loading',
  )
  const [open, setOpen] = useState(showSkeleton ? true : demo)

  const totalSeconds = Math.max(0, requiredViewSeconds)
  const [remaining, setRemaining] = useState(totalSeconds)
  const [closeEnabled, setCloseEnabled] = useState(
    canCloseImmediately || totalSeconds === 0,
  )

  const impressionRef = useRef<string | null>(null)
  // Разделены на два независимых guard'а: «просмотр» и «закрытие» —
  // это два самостоятельных события, и один не должен блокировать другой
  // (раньше общий finishedRef после завершения таймера навсегда
  // отключал крестик, потому что markViewed ставил тот же флаг).
  const viewedFiredRef = useRef(false)
  const closedFiredRef = useRef(false)

  // Стабилизируем коллбэки через рефы — как в TaddyInterstitialForSDK,
  // чтобы одноразовый эффект загрузки объявления не захватывал
  // протухшие версии onNoFill/onError/onClosed/onViewed.
  const onClosedRef = useRef(onClosed)
  const onViewedRef = useRef(onViewed)
  const onNoFillRef = useRef(onNoFill)
  const onErrorRef = useRef(onError)
  onClosedRef.current = onClosed
  onViewedRef.current = onViewed
  onNoFillRef.current = onNoFill
  onErrorRef.current = onError

  // ── Helpers ────────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    setOpen(false)
    setTimeout(() => onClosedRef.current?.(), 300)
  }, [])

  const markViewed = useCallback(() => {
    if (viewedFiredRef.current) return
    viewedFiredRef.current = true
    onViewedRef.current?.()
  }, [])

  useEffect(() => {
    if (!showSkeleton && loadState === 'ready') {
      setOpen(true)
    }
  }, [showSkeleton, loadState])

  // ── Load ad ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (demo) return
    let cancelled = false
    const load = async () => {
      try {
        if (isTaddyInterstitialRunning) {
          setLoadState('no-fill')
          onNoFillRef.current?.()
          return
        }
        isTaddyInterstitialRunning = true
        if (!pubId) {
          setLoadState('error')
          onErrorRef.current?.(new Error('pubId is required'))
          return
        }
        const next = await requestAd(pubId, payload)
        if (cancelled) return
        if (!next) {
          setLoadState('no-fill')
          onNoFillRef.current?.()
          return
        }
        setAd(next)
        setLoadState('ready')
      } catch (err) {
        if (!cancelled) {
          console.error('TaddyInterstitial load failed', err)
          onErrorRef.current?.(err)
          setLoadState('error')
        }
      } finally {
        isTaddyInterstitialRunning = false
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Impression ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ad || demo || impressionRef.current === ad.id) return
    impressionRef.current = ad.id
    void sendImpression(ad.id)
  }, [ad, demo])

  // ── Countdown ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!ad || closeEnabled || remaining <= 0) return
    const timer = window.setInterval(() => {
      setRemaining((cur) => {
        const next = Math.max(0, cur - 1)
        if (next === 0) {
          window.clearInterval(timer)
          setCloseEnabled(true)
          markViewed()
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [ad, closeEnabled, markViewed, remaining])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    if (!closeEnabled || closedFiredRef.current) return
    closedFiredRef.current = true
    dismiss()
  }

  const handleOpen = () => {
    if (!ad) return
    markViewed()
    window.open(ad.link, '_blank', 'noopener,noreferrer')
  }

  // ── Bail out ───────────────────────────────────────────────────────────────

  if (!open && loadState !== 'ready') return null

  const title = ad?.title ?? 'Спонсор'
  const description = ad?.description ?? ad?.text ?? ''
  const buttonText = ad?.button ?? 'Открыть'

  // ── Variants ──────────────────────────────────────────────────────────────

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const cardVariants: Variants = {
    hidden: { y: '55%', opacity: 0, scale: 0.96 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 255, damping: 27, mass: 0.85 },
    },
    exit: {
      y: '45%',
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.24, ease: [0.4, 0, 1, 1] as const },
    },
  }

  const contentContainerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 340, damping: 28 },
    },
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="taddy-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-auto fixed inset-0 z-[99999] flex items-end justify-center sm:items-center"
          style={{
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(18px)',
          }}
          role="dialog"
          aria-modal
          aria-label="Advertisement">
          <motion.div
            key="taddy-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={[
              'pointer-events-auto relative flex w-full max-w-[480px] flex-col overflow-hidden',
              'h-dvh',
              'sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl',
              'sm:shadow-[0_32px_100px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.07)]',
            ].join(' ')}
            style={{ background: 'var(--surface-container-low)' }}>
            {/* Ambient corner glow */}
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  'radial-gradient(ellipse at 10% 105%, rgba(59,42,115,0.45) 0%, transparent 52%)',
              }}
            />

            {loadState === 'loading' && showSkeleton ? (
              <AdSkeleton />
            ) : loadState === 'loading' ? null : (
              <>
                {/* ── Media area ─────────────────────────────────────── */}
                <motion.button
                  type="button"
                  onClick={handleOpen}
                  whileTap={{ scale: 0.994 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="relative z-10 w-full shrink-0 cursor-pointer overflow-hidden border-none p-0"
                  style={{
                    height: '60%',
                    minHeight: 200,
                    maxHeight: 400,
                    background: 'var(--surface-container-lowest)',
                  }}
                  aria-label={`Открыть: ${title}`}>
                  {ad?.video ? (
                    // Video: contain + blurred bg
                    <>
                      <video
                        src={ad.video}
                        autoPlay
                        playsInline
                        muted
                        loop
                        className="absolute inset-0 size-full object-cover opacity-30 blur-2xl"
                        aria-hidden
                        style={{ transform: 'scale(1.12)' }}
                      />
                      <video
                        src={ad.video}
                        autoPlay
                        playsInline
                        muted
                        loop
                        className="relative size-full object-contain"
                      />
                    </>
                  ) : ad?.image ? (
                    // Image: blurred bg (cover) + sharp foreground (contain)
                    // guarantees 1:1, 1:2, 2:1 are all fully visible
                    <>
                      {/* Blurred atmospheric backdrop — slightly scaled to hide blur edges */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ transform: 'scale(1.12)' }}
                        aria-hidden>
                        <Image
                          loader={passthroughLoader}
                          unoptimized
                          src={ad.image}
                          alt=""
                          fill
                          sizes="(max-width: 480px) 100vw, 480px"
                          className="object-cover opacity-35"
                          style={{ filter: 'blur(24px)' }}
                        />
                      </div>
                      {/* Sharp foreground at natural ratio */}
                      <Image
                        loader={passthroughLoader}
                        unoptimized
                        src={ad.image}
                        alt={title}
                        fill
                        sizes="(max-width: 480px) 100vw, 480px"
                        className="object-contain"
                      />
                    </>
                  ) : (
                    // No-media fallback
                    <div className="flex size-full flex-col items-center justify-center gap-5">
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(ellipse at 50% 50%, var(--primary-container) 0%, transparent 70%)',
                          opacity: 0.55,
                        }}
                      />
                      <div
                        className="relative flex size-24 items-center justify-center rounded-[28px] border border-white/[0.1]"
                        style={{ background: 'rgba(195,166,255,0.1)' }}>
                        {ad?.icon ? (
                          <Image
                            loader={passthroughLoader}
                            unoptimized
                            src={ad.icon}
                            alt=""
                            width={64}
                            height={64}
                            className="size-16 rounded-2xl object-contain"
                          />
                        ) : (
                          <span
                            className="text-4xl font-black"
                            style={{ color: 'var(--primary)' }}>
                            Ad
                          </span>
                        )}
                      </div>
                      <span
                        className="relative text-2xl font-extrabold"
                        style={{ color: 'var(--on-surface)' }}>
                        {title}
                      </span>
                    </div>
                  )}

                  {/* Top vignette */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-16"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
                    }}
                  />

                  {/* Bottom fade to card bg */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
                    style={{
                      background:
                        'linear-gradient(to top, var(--surface-container-low) 0%, transparent 100%)',
                    }}
                  />

                  {/* Ad label badge — top left */}
                  <div
                    className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/[0.14] px-2.5 py-1 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.44)' }}>
                    <div
                      className="size-1.5 rounded-full"
                      style={{ background: 'var(--primary)' }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
                      Ad · 18+
                    </span>
                  </div>

                  {/* Corner timer — top right */}
                  <div className="absolute right-3 top-3 z-20">
                    <CornerTimer
                      closeEnabled={closeEnabled}
                      remaining={remaining}
                      total={totalSeconds}
                      onClose={handleClose}
                    />
                  </div>
                </motion.button>

                {/* ── Floating app icon ──────────────────────────────── */}
                <div className="relative z-10 -mt-[26px] ml-4 shrink-0">
                  <div
                    className="relative size-[54px] overflow-hidden rounded-[14px] border-2"
                    style={{
                      borderColor: 'var(--surface-container-low)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                    }}>
                    {ad?.icon ? (
                      <Image
                        loader={passthroughLoader}
                        unoptimized
                        src={ad.icon}
                        alt=""
                        width={54}
                        height={54}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex size-full items-center justify-center text-[18px] font-black"
                        style={{
                          background: 'var(--primary-container)',
                          color: 'var(--primary)',
                        }}>
                        {title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Content ─────────────────────────────────────────── */}
                <motion.div
                  variants={contentContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pt-2"
                  style={{
                    paddingBottom:
                      'max(20px, calc(16px + env(safe-area-inset-bottom)))',
                  }}>
                  {/* Title */}
                  <motion.p
                    variants={itemVariants}
                    className="mb-1 text-[20px] font-extrabold leading-tight tracking-tight"
                    style={{ color: 'var(--on-surface)' }}>
                    {title}
                  </motion.p>

                  {/* Description */}
                  {description && (
                    <motion.p
                      variants={itemVariants}
                      className="mb-4 line-clamp-2 text-[13.5px] leading-relaxed"
                      style={{ color: 'rgba(233,230,234,0.52)' }}>
                      {description}
                    </motion.p>
                  )}

                  <div className="flex-1" />

                  {/* CTA button */}
                  <motion.div variants={itemVariants}>
                    <motion.div
                      className="rounded-2xl"
                      animate={{
                        boxShadow: [
                          '0 4px 22px rgba(195,166,255,0.22)',
                          '0 6px 44px rgba(195,166,255,0.52)',
                          '0 4px 22px rgba(195,166,255,0.22)',
                        ],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}>
                      <motion.button
                        type="button"
                        onClick={handleOpen}
                        whileHover={{ scale: 1.025, y: -1 }}
                        whileTap={{ scale: 0.97, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 24,
                        }}
                        className="relative flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-none text-[15px] font-extrabold tracking-[0.02em] outline-none"
                        style={{
                          background: 'var(--primary)',
                          color: 'var(--on-primary)',
                        }}>
                        {/* Shimmer sweep */}
                        <motion.div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                          }}
                          animate={{ x: ['-130%', '130%'] }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'linear',
                            repeatDelay: 1.6,
                          }}
                        />
                        <span className="relative z-10">{buttonText}</span>
                        <motion.div
                          className="relative z-10"
                          animate={{ x: [0, 3, 0] }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}>
                          <ArrowRight size={17} strokeWidth={2.8} />
                        </motion.div>
                      </motion.button>
                    </motion.div>
                  </motion.div>

                  {/* Advertise link */}
                  <motion.div
                    variants={itemVariants}
                    className="mt-4 text-center">
                    <Link
                      href="https://taddy.pro/vpnsibcom_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11.5px] underline underline-offset-2 transition-colors hover:text-white/45"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Разместить рекламу здесь
                    </Link>
                  </motion.div>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
