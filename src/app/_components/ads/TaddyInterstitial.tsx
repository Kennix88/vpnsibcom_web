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
const RING_SIZE = 40
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
  autoCloseOnViewed?: boolean
  onClosed?: () => void
  onViewed?: (ad: TaddyAd) => void
  onViewThrough?: (id: string) => void
  onShow?: (success: boolean) => void
  onNoFill?: () => void
  onStartFailed?: () => void
  onError?: (error: unknown) => void
}

// ─── Demo Ad ─────────────────────────────────────────────────────────────────

const demoAd: TaddyAd = {
  id: 'demo-taddy-interstitial',
  title: 'VPNsib Premium',
  description:
    'Fast VPN access for every device with secure, zero-log traffic routing.',
  image: 'https://kennix88.github.io/vpnsib-tonconnect-manifest/welcome-2.jpg',
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

// ─── CountdownRing ────────────────────────────────────────────────────────────
// SVG ring that drains linearly as remaining seconds decrease

function CountdownRing({
  total,
  remaining,
}: {
  total: number
  remaining: number
}) {
  const progress = total > 0 ? remaining / total : 0
  const dash = RING_CIRCUM * progress

  return (
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
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-8 animate-pulse rounded-lg bg-white/8" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/8" />
        </div>
        <div className="size-10 animate-pulse rounded-full bg-white/8" />
      </div>

      {/* media */}
      <div className="min-h-0 flex-1 animate-pulse bg-white/[0.04]" />

      {/* cta */}
      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-white/8" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/8" />
            <div className="h-3 w-full animate-pulse rounded bg-white/8" />
          </div>
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-white/8" />
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
  autoCloseOnViewed = true,
  onClosed,
  onViewed,
  onViewThrough,
  onShow,
  onNoFill,
  onStartFailed,
  onError,
}: Props) {
  const [ad, setAd] = useState<TaddyAd | null>(demo ? demoAd : null)
  const [loadState, setLoadState] = useState<LoadState>(
    demo ? 'ready' : 'loading',
  )
  const [open, setOpen] = useState(true)

  const totalSeconds = Math.max(0, requiredViewSeconds)
  const [remaining, setRemaining] = useState(totalSeconds)
  const [closeEnabled, setCloseEnabled] = useState(
    canCloseImmediately || totalSeconds === 0,
  )

  const impressionRef = useRef<string | null>(null)
  const finishedRef = useRef(false)
  const closedAfterViewRef = useRef(false)
  const adRef = useRef<TaddyAd | null>(demo ? demoAd : null)

  // ── Close + view helpers ───────────────────────────────────────────────────

  const closeWith = useCallback(
    (success: boolean) => {
      setOpen(false)
      // callbacks fire after exit animation (300ms)
      setTimeout(() => {
        if (!success) {
          onClosed?.()
          onShow?.(false)
        }
      }, 300)
    },
    [onClosed, onShow],
  )

  const markViewed = useCallback(
    async (currentAd: TaddyAd) => {
      if (finishedRef.current) return
      finishedRef.current = true
      onViewed?.(currentAd)
      onViewThrough?.(currentAd.id)
      onShow?.(true)
      if (autoCloseOnViewed && !closedAfterViewRef.current) {
        closedAfterViewRef.current = true
        onClosed?.()
        setOpen(false)
      }
    },
    [autoCloseOnViewed, onClosed, onShow, onViewed, onViewThrough],
  )

  // ── Load ad ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (demo) return

    let cancelled = false

    const load = async () => {
      try {
        if (isTaddyInterstitialRunning) {
          setLoadState('no-fill')
          onNoFill?.()
          return
        }
        isTaddyInterstitialRunning = true

        if (!pubId) {
          setLoadState('error')
          onStartFailed?.()
          return
        }

        const next = await requestAd(pubId, payload)
        if (cancelled) return

        if (!next) {
          setLoadState('no-fill')
          onNoFill?.()
          return
        }

        adRef.current = next
        setAd(next)
        setLoadState('ready')
      } catch (err) {
        if (!cancelled) {
          console.error('TaddyInterstitial load failed', err)
          onError?.(err)
          setLoadState('error')
          onStartFailed?.()
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

  useEffect(() => {
    adRef.current = ad
  }, [ad])

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
          void markViewed(ad)
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [ad, closeEnabled, markViewed, remaining])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    if (!closeEnabled || finishedRef.current) return
    finishedRef.current = true
    closeWith(false)
  }

  const handleOpen = () => {
    const cur = adRef.current
    if (!cur) return
    void markViewed(cur)
    window.open(cur.link, '_blank', 'noopener,noreferrer')
  }

  // ── Bail out on non-renderable states ─────────────────────────────────────

  if (!open && (loadState === 'no-fill' || loadState === 'error')) return null

  const hasMedia = Boolean(ad?.video || ad?.image)
  const title = ad?.title ?? 'Спонсор'
  const description = ad?.description ?? ad?.text ?? ''
  const buttonText = ad?.button ?? 'Открыть'

  // ── Animation variants ────────────────────────────────────────────────────

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  // Mobile: slide from bottom; tablet+: fade+scale from center
  const cardVariants: Variants = {
    hidden: {
      y: '50%',
      opacity: 0,
      scale: 0.97,
    },

    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },

    exit: {
      y: '40%',
      opacity: 0,
      scale: 0.96,
      transition: {
        duration: 0.22,
        ease: [0.4, 0, 1, 1] as const,
      },
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
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center"
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
              'bg-[var(--surface-container-low)]',
              // Mobile: full screen
              'h-dvh',
              // Tablet+: floating card
              'sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl',
              'sm:shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]',
            ].join(' ')}>
            {loadState === 'loading' ? (
              <AdSkeleton />
            ) : (
              <>
                {/* ── Top bar ─────────────────────────────────────────── */}
                <div className="flex shrink-0 items-center justify-between px-4 py-3">
                  {/* Sponsor badge */}
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.06] py-1.5 pl-1.5 pr-3">
                    {ad?.icon ? (
                      <Image
                        loader={passthroughLoader}
                        unoptimized
                        src={ad.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="size-[22px] rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-[22px] rounded-md bg-white/10" />
                    )}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                      Спонсор
                    </span>
                  </div>

                  {/* Close / countdown */}
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    disabled={!closeEnabled}
                    whileHover={closeEnabled ? { scale: 1.08 } : {}}
                    whileTap={closeEnabled ? { scale: 0.93 } : {}}
                    className={[
                      'relative flex size-10 shrink-0 items-center justify-center rounded-full',
                      'border-none outline-none',
                      closeEnabled
                        ? 'cursor-pointer bg-white/10 hover:bg-white/15'
                        : 'cursor-not-allowed bg-white/[0.06]',
                    ].join(' ')}
                    aria-label={
                      closeEnabled ? 'Close ad' : `Close in ${remaining}s`
                    }>
                    {!closeEnabled && (
                      <CountdownRing
                        total={totalSeconds}
                        remaining={remaining}
                      />
                    )}
                    <span className="relative z-10 text-[15px] font-bold leading-none text-white/80 select-none">
                      {closeEnabled ? (
                        <X size={16} strokeWidth={2.5} />
                      ) : (
                        remaining
                      )}
                    </span>
                  </motion.button>
                </div>

                {/* ── Media area ──────────────────────────────────────── */}
                <motion.button
                  type="button"
                  onClick={handleOpen}
                  whileTap={{ scale: 0.99 }}
                  className="relative min-h-0 flex-1 cursor-pointer overflow-hidden border-none bg-[var(--surface-container-lowest)] p-0"
                  aria-label={`Открыть: ${title}`}>
                  {ad?.video ? (
                    <video
                      src={ad.video}
                      autoPlay
                      playsInline
                      muted
                      loop
                      className="size-full object-contain"
                    />
                  ) : ad?.image ? (
                    <Image
                      loader={passthroughLoader}
                      unoptimized
                      src={ad.image}
                      alt={title}
                      fill
                      sizes="(max-width: 480px) 100vw, 480px"
                      className="object-contain object-center"
                    />
                  ) : (
                    /* No-media fallback */
                    <div className="flex size-full flex-col items-center justify-center gap-5 px-8 text-center">
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          background:
                            'radial-gradient(ellipse at 50% 40%, var(--primary-container) 0%, transparent 65%)',
                        }}
                      />
                      <div className="relative flex size-[88px] items-center justify-center rounded-[22px] border border-white/[0.08] bg-white/[0.06]">
                        {ad?.icon ? (
                          <Image
                            loader={passthroughLoader}
                            unoptimized
                            src={ad.icon}
                            alt=""
                            width={56}
                            height={56}
                            className="size-14 rounded-xl object-contain"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-[var(--primary)]">
                            Ad
                          </span>
                        )}
                      </div>
                      <span className="relative text-[22px] font-bold text-[var(--on-surface)]">
                        {title}
                      </span>
                    </div>
                  )}

                  {/* Bottom gradient over media */}
                  {hasMedia && (
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
                      style={{
                        background:
                          'linear-gradient(to top, var(--surface-container-low) 0%, rgba(15,13,17,0.75) 40%, transparent 100%)',
                      }}
                    />
                  )}

                  {/* Tap hint */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 py-1 pr-2.5 pl-2 text-[11px] font-medium text-white/50 pointer-events-none">
                    <ArrowRight size={11} strokeWidth={2.5} />
                    <span>Нажмите, чтобы открыть</span>
                  </div>
                </motion.button>

                {/* ── CTA area ────────────────────────────────────────── */}
                <div
                  className="shrink-0 border-t border-white/[0.05] bg-[var(--surface-container-low)] px-4 pt-4"
                  style={{
                    paddingBottom:
                      'max(20px, calc(16px + env(safe-area-inset-bottom)))',
                  }}>
                  {/* Icon + title + description */}
                  <div className="mb-4 flex items-start gap-3">
                    {ad?.icon && (
                      <Image
                        loader={passthroughLoader}
                        unoptimized
                        src={ad.icon}
                        alt=""
                        width={42}
                        height={42}
                        className="size-[42px] shrink-0 rounded-xl border border-white/[0.08] object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-bold leading-snug text-[var(--on-surface)]">
                        {title}
                      </p>
                      {description && (
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--on-surface)]/55">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <motion.button
                    type="button"
                    onClick={handleOpen}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold tracking-[0.15px] outline-none"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      boxShadow: '0 4px 24px rgba(195,166,255,0.28)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}>
                    <span>{buttonText}</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </motion.button>

                  {/* Advertise link */}
                  <Link
                    href="https://taddy.pro/vpnsibcom_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center text-[12px] text-white/30 underline underline-offset-2 transition-colors hover:text-white/55">
                    Разместить рекламу здесь
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
