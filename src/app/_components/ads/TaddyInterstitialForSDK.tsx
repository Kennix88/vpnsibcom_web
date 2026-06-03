'use client'

import { useEffect, useRef } from 'react'

interface TaddyInterstitialProps {
  onShow: (isShow: boolean) => void
  onClosed: () => void
  onError: () => void
  onNoFill: () => void
  onStartFailed: () => void
  payload?: Record<string, unknown>
  // оставлены для совместимости с вызывающим кодом, SDK сам управляет своим UI
  canCloseImmediately?: boolean
  requiredViewSeconds?: number
  autoCloseOnViewed?: boolean
}

export default function TaddyInterstitial({
  onShow,
  onClosed,
  onError,
  onNoFill,
  onStartFailed,
  payload,
}: TaddyInterstitialProps) {
  const calledRef = useRef(false)

  // Стабилизируем коллбэки через рефы, чтобы не перезапускать эффект
  const onShowRef = useRef(onShow)
  const onClosedRef = useRef(onClosed)
  const onErrorRef = useRef(onError)
  const onNoFillRef = useRef(onNoFill)
  const onStartFailedRef = useRef(onStartFailed)

  onShowRef.current = onShow
  onClosedRef.current = onClosed
  onErrorRef.current = onError
  onNoFillRef.current = onNoFill
  onStartFailedRef.current = onStartFailed

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    let cancelled = false

    const tryRun = () => {
      if (cancelled) return

      if (!window.Taddy) {
        onStartFailedRef.current()
        return
      }

      window.Taddy.ads()
        .interstitial({
          payload,
          onClosed: () => onClosedRef.current(),
          onViewThrough: () => onShowRef.current(true),
        })
        .then((shown) => {
          if (!shown) onNoFillRef.current()
        })
        .catch((err: unknown) => {
          // SDK ещё не инициализирован — retry через 100ms
          if (
            err instanceof Error &&
            err.message.toLowerCase().includes('not initialized')
          ) {
            setTimeout(tryRun, 100)
            return
          }
          onErrorRef.current()
        })
    }

    tryRun()

    return () => {
      cancelled = true
    }
  }, [payload])

  return null
}
