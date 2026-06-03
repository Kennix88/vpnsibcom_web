'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Clock, WifiOff, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// ─── Типы ────────────────────────────────────────────────────────────────────

interface ShowPromiseResult {
  done: boolean
  description: string
  state: 'load' | 'render' | 'playing' | 'destroy'
  error: boolean
}

interface AdController {
  show: () => Promise<ShowPromiseResult>
  destroy: () => void
  addEventListener: (
    event: AdsgramEvent,
    callback: (result?: ShowPromiseResult) => void,
  ) => void
  removeEventListener: (
    event: AdsgramEvent,
    callback: (result?: ShowPromiseResult) => void,
  ) => void
}

type AdsgramEvent =
  | 'onStart'
  | 'onSkip'
  | 'onReward'
  | 'onComplete'
  | 'onError'
  | 'onBannerNotFound'
  | 'onNonStopShow'
  | 'onTooLongSession'

declare global {
  interface Window {
    Adsgram?: {
      init: (params: {
        blockId: string
        debug?: boolean
        debugConsole?: boolean
        debugBannerType?: 'FullscreenMedia' | 'RewardedVideo'
      }) => AdController
    }
  }
}

// ─── Типы ошибок ─────────────────────────────────────────────────────────────

type ErrorKind =
  | 'no_fill' // onBannerNotFound
  | 'non_stop' // onNonStopShow
  | 'too_long' // onTooLongSession
  | 'play_error' // onError во время воспроизведения
  | 'load_failed' // window.Adsgram недоступен
  | 'unknown'

interface ErrorState {
  kind: ErrorKind
  title: string
  hint: string
}

const ERROR_MAP: Record<ErrorKind, ErrorState> = {
  no_fill: {
    kind: 'no_fill',
    title: 'Нет рекламы',
    hint: 'Попробуй чуть позже',
  },
  non_stop: {
    kind: 'non_stop',
    title: 'Слишком часто',
    hint: 'Подожди немного перед следующим просмотром',
  },
  too_long: {
    kind: 'too_long',
    title: 'Сессия устарела',
    hint: 'Перезапусти приложение',
  },
  play_error: {
    kind: 'play_error',
    title: 'Ошибка воспроизведения',
    hint: 'Что-то пошло не так',
  },
  load_failed: {
    kind: 'load_failed',
    title: 'Реклама не загрузилась',
    hint: 'Проверь соединение',
  },
  unknown: {
    kind: 'unknown',
    title: 'Что-то пошло не так',
    hint: 'Попробуй ещё раз',
  },
}

function ErrorIcon({ kind }: { kind: ErrorKind }) {
  const props = { size: 20 }
  switch (kind) {
    case 'no_fill':
      return <AlertCircle {...props} />
    case 'non_stop':
      return <Zap {...props} />
    case 'too_long':
      return <Clock {...props} />
    case 'load_failed':
      return <WifiOff {...props} />
    default:
      return <AlertCircle {...props} />
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdsgramAdProps {
  blockId: `${number}` | `int-${number}`
  /**
   * Rewarded-режим: вызывается когда пользователь досмотрел рекламу.
   * Если не передан — оба исхода (просмотр + skip) ведут к onClose (Fullscreen-режим).
   */
  onReward?: () => void
  onClose: () => void
  /** Тип баннера для debug-режима */
  debugBannerType?: 'FullscreenMedia' | 'RewardedVideo'
  isDebug?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdsgramAd({
  blockId,
  onReward,
  onClose,
  debugBannerType = 'FullscreenMedia',
  isDebug = false,
}: AdsgramAdProps) {
  const [error, setError] = useState<ErrorState | null>(null)
  const controllerRef = useRef<AdController | null>(null)
  const calledRef = useRef(false)
  const closedRef = useRef(false) // предотвращаем двойной вызов onClose

  const safeClose = () => {
    if (closedRef.current) return
    closedRef.current = true
    onClose()
  }

  const showError = (kind: ErrorKind, autoCloseMs = 2500) => {
    setError(ERROR_MAP[kind])
    setTimeout(safeClose, autoCloseMs)
  }

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!window.Adsgram) {
      showError('load_failed')
      return
    }

    const controller = window.Adsgram.init({
      blockId,
      debug: isDebug,
      debugConsole: isDebug,
      debugBannerType,
    })
    controllerRef.current = controller

    // ── Гранулярные события ───────────────────────────────────────────────
    // Пользователь досмотрел Rewarded до конца
    const handleReward = () => {
      if (onReward) {
        onReward()
      } else {
        safeClose()
      }
    }

    // Interstitial: досмотрел ИЛИ пропустил — оба ведут к завершению
    const handleComplete = () => safeClose()

    // Пользователь закрыл Rewarded (skip) — без награды
    const handleSkip = () => safeClose()

    // Нет инвентаря
    const handleBannerNotFound = () => showError('no_fill')

    // Слишком частые показы
    const handleNonStop = () => showError('non_stop', 3000)

    // Слишком долгая сессия
    const handleTooLong = () => showError('too_long', 3500)

    // Ошибка воспроизведения
    const handleError = () => showError('play_error')

    controller.addEventListener('onReward', handleReward)
    controller.addEventListener('onComplete', handleComplete)
    controller.addEventListener('onSkip', handleSkip)
    controller.addEventListener('onBannerNotFound', handleBannerNotFound)
    controller.addEventListener('onNonStopShow', handleNonStop)
    controller.addEventListener('onTooLongSession', handleTooLong)
    controller.addEventListener('onError', handleError)

    // Запускаем показ
    controller.show().catch(() => {
      // .catch срабатывает при skip/error — события уже обработаны выше,
      // здесь только подавляем unhandled rejection
    })

    return () => {
      controller.removeEventListener('onReward', handleReward)
      controller.removeEventListener('onComplete', handleComplete)
      controller.removeEventListener('onSkip', handleSkip)
      controller.removeEventListener('onBannerNotFound', handleBannerNotFound)
      controller.removeEventListener('onNonStopShow', handleNonStop)
      controller.removeEventListener('onTooLongSession', handleTooLong)
      controller.removeEventListener('onError', handleError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          key="adsgram-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100000,
          }}>
          <motion.div
            initial={{ scale: 0.88, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '24px 28px',
              borderRadius: 20,
              background: 'var(--surface-container-high)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              maxWidth: 280,
              width: '100%',
              textAlign: 'center',
            }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,107,102,0.12)',
                color: 'var(--error)',
                border: '1px solid rgba(255,107,102,0.22)',
              }}>
              <ErrorIcon kind={error.kind} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--on-surface)',
                  fontFamily: 'monospace',
                }}>
                {error.title}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--on-surface-variant)',
                  lineHeight: 1.4,
                }}>
                {error.hint}
              </span>
            </div>

            {/* Прогресс-бар автозакрытия */}
            <motion.div
              style={{
                width: '100%',
                height: 2,
                borderRadius: 2,
                background: 'var(--outline-variant)',
                overflow: 'hidden',
              }}>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
                style={{
                  height: '100%',
                  background: 'var(--error)',
                  borderRadius: 2,
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
