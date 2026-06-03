'use client'

import { publicApiClient } from '@app/core/publicApiClient'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ExternalLink,
  RefreshCw,
  Sparkles,
  Star,
  XCircle,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type AdData = {
  redirectUrl: string
  rewardStars: number
}

type Phase = 'loading' | 'redirecting' | 'fallback' | 'error'
type ErrorReason = 'not_found' | 'expired' | 'network' | 'unknown'

const CONFIRM_TIMEOUT_MS = 1800

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export default function AdRedirect({ adKey }: { adKey: string }) {
  const [ad, setAd] = useState<AdData | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [errorReason, setErrorReason] = useState<ErrorReason>('unknown')
  const confirmedRef = useRef(false)

  const confirmAd = useCallback(async () => {
    if (confirmedRef.current) return

    confirmedRef.current = true

    try {
      await publicApiClient.confirmAdsIsRedirect(adKey)
    } catch (err) {
      console.error('Failed to confirm ad redirect', err)
    }
  }, [adKey])

  const doRedirect = useCallback(
    (url: string) => {
      let cancelled = false

      const fallbackTimer = window.setTimeout(() => {
        if (!cancelled && document.visibilityState === 'visible') {
          setPhase('fallback')
        }
      }, CONFIRM_TIMEOUT_MS)

      void (async () => {
        try {
          await Promise.race([confirmAd(), sleep(CONFIRM_TIMEOUT_MS)])
        } finally {
          if (!cancelled) {
            window.location.replace(url)
          }
        }
      })()

      return () => {
        cancelled = true
        window.clearTimeout(fallbackTimer)
      }
    },
    [confirmAd],
  )

  const fetchAd = useCallback(async () => {
    try {
      const response = await publicApiClient.getRedirectAd(adKey)

      if (!response.ok) {
        const reason = response.reason as string | undefined
        if (reason === 'not_found' || reason === 'invalid_key') {
          setErrorReason('not_found')
        } else if (reason === 'expired') {
          setErrorReason('expired')
        } else {
          setErrorReason('unknown')
        }
        setPhase('error')
        return
      }

      setAd({
        redirectUrl: response.redirectUrl,
        rewardStars: response.rewardStars,
      })
    } catch (err) {
      console.error('Failed to load ad', err)
      setErrorReason('network')
      setPhase('error')
    }
  }, [adKey])

  useEffect(() => {
    void fetchAd()
  }, [fetchAd])

  useEffect(() => {
    if (!ad) return

    setPhase('redirecting')
    return doRedirect(ad.redirectUrl)
  }, [ad, doRedirect])

  const handleManualRedirect = useCallback(async () => {
    if (!ad) return

    await confirmAd()
    window.location.replace(ad.redirectUrl)
  }, [ad, confirmAd])

  const handleRetry = useCallback(() => {
    setPhase('loading')
    setErrorReason('unknown')
    void fetchAd()
  }, [fetchAd])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 20%, rgba(157,113,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(254,189,4,0.09) 0%, transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(195,166,255,0.35), transparent)',
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 'loading' && <LoadingState key="loading" />}
        {phase === 'redirecting' && <RedirectingState key="redirecting" />}
        {phase === 'fallback' && ad && (
          <FallbackState
            key="fallback"
            ad={ad}
            onRedirect={handleManualRedirect}
          />
        )}
        {phase === 'error' && (
          <ErrorState key="error" reason={errorReason} onRetry={handleRetry} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── Loading ─────────────────────────── */
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 text-center">
      <div className="relative w-14 h-14">
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: 'var(--primary)',
            borderTopColor: 'transparent',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={22} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
      <p style={{ color: 'var(--on-surface-variant)' }} className="text-sm">
        Загружаем предложение…
      </p>
    </motion.div>
  )
}

/* ─────────────────────────── Redirecting ──────────────────────── */
function RedirectingState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-4 text-center">
      <motion.div
        className="relative flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{ background: 'var(--primary-container)' }}
        animate={{
          boxShadow: [
            '0 0 0px var(--primary-glow)',
            '0 0 30px var(--primary-glow)',
            '0 0 0px var(--primary-glow)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity }}>
        <Zap size={28} style={{ color: 'var(--primary)' }} />
      </motion.div>
      <div>
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--on-surface)' }}>
          Переходим…
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--on-surface-variant)' }}>
          Секунду, открываем партнёрскую страницу
        </p>
      </div>
      <motion.div
        className="h-1 rounded-full w-48 overflow-hidden"
        style={{ background: 'var(--surface-container-high)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--primary-gradient)' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  )
}

/* ─────────────────────────── Fallback ─────────────────────────── */
function FallbackState({
  ad,
  onRedirect,
}: {
  ad: AdData
  onRedirect: () => void
}) {
  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
    item: {
      hidden: { opacity: 0, y: 18 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.2, 0, 0, 1] as const },
      },
    },
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm flex flex-col items-center gap-5">
      <motion.div
        variants={stagger.item}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'var(--ad-container-rgba)',
          color: 'var(--ad)',
          border: '1px solid rgba(255,106,0,0.25)',
        }}>
        <Sparkles size={12} />
        Специальное предложение
      </motion.div>

      <motion.div
        variants={stagger.item}
        className="w-full rounded-3xl p-6 flex flex-col items-center gap-3 relative overflow-hidden"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--surface-strong-border)',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
        <div
          aria-hidden
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)',
          }}
        />

        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Ваша награда за переход
        </p>

        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{
              background: 'var(--star-container)',
              boxShadow: '0 0 24px rgba(254,189,4,0.35)',
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            <Star
              size={28}
              fill="var(--star)"
              style={{ color: 'var(--star)' }}
            />
          </motion.div>
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-5xl font-bold leading-none"
                style={{
                  background: 'var(--star-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                {ad.rewardStars}
              </span>
              <span
                className="text-lg font-semibold"
                style={{ color: 'var(--star)' }}>
                ⭐
              </span>
            </div>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--on-surface-variant)' }}>
              звёзд на ваш баланс
            </p>
          </div>
        </div>

        <div
          className="w-full h-px my-1"
          style={{ background: 'var(--surface-strong-border)' }}
        />

        <div className="w-full flex flex-col gap-2">
          {[
            { icon: '🛡️', text: 'Безопасный переход — без вирусов' },
            { icon: '⚡', text: 'Награда зачислится сразу после перехода' },
            { icon: '🔒', text: 'Ваши данные не передаются' },
          ].map((point) => (
            <div key={point.text} className="flex items-center gap-2.5">
              <span className="text-base leading-none">{point.icon}</span>
              <span
                className="text-xs"
                style={{ color: 'var(--on-surface-variant)' }}>
                {point.text}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="w-full">
        <motion.button
          onClick={onRedirect}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-base font-semibold relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ff8c42, #ffab40)',
            color: 'var(--on-cta)',
            boxShadow:
              '0 8px 32px rgba(255,140,66,0.40), 0 2px 8px rgba(0,0,0,0.3)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
          />
          <ExternalLink size={18} />
          Получить награду и перейти
        </motion.button>
      </motion.div>

      <motion.p
        variants={stagger.item}
        className="text-center text-xs px-4 leading-relaxed"
        style={{ color: 'var(--disabled-content)' }}>
        Нажимая кнопку, вы переходите на страницу рекламного партнёра. Звёзды
        начисляются автоматически.
      </motion.p>
    </motion.div>
  )
}

/* ─────────────────────────── Error ─────────────────────────── */

const ERROR_COPY: Record<
  ErrorReason,
  { title: string; description: string; canRetry: boolean }
> = {
  not_found: {
    title: 'Ссылка недействительна',
    description: 'Эта рекламная ссылка не существует или была удалена.',
    canRetry: false,
  },
  expired: {
    title: 'Срок действия истёк',
    description: 'Предложение по этой ссылке уже закончилось.',
    canRetry: false,
  },
  network: {
    title: 'Нет соединения',
    description:
      'Не удалось загрузить предложение. Проверьте интернет и попробуйте снова.',
    canRetry: true,
  },
  unknown: {
    title: 'Что-то пошло не так',
    description:
      'Не удалось загрузить рекламное предложение. Попробуйте позже.',
    canRetry: true,
  },
}

function ErrorState({
  reason,
  onRetry,
}: {
  reason: ErrorReason
  onRetry: () => void
}) {
  const copy = ERROR_COPY[reason]

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
    item: {
      hidden: { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
      },
    },
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm flex flex-col items-center gap-5">
      <motion.div
        variants={stagger.item}
        className="flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{ background: 'var(--error-container)' }}>
        <XCircle size={28} style={{ color: 'var(--error)' }} />
      </motion.div>

      <motion.div
        variants={stagger.item}
        className="flex flex-col items-center gap-2 text-center px-2">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--on-surface)' }}>
          {copy.title}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--on-surface-variant)' }}>
          {copy.description}
        </p>
      </motion.div>

      {copy.canRetry && (
        <motion.div variants={stagger.item} className="w-full">
          <motion.button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-semibold"
            style={{
              background: 'var(--surface-container-high)',
              color: 'var(--on-surface)',
              border: '1px solid var(--surface-strong-border)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}>
            <RefreshCw size={16} />
            Попробовать снова
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
