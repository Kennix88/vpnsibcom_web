'use client'
import { useEffect, useRef } from 'react'

interface TaddyInterstitialProps {
  /** Вызывается, когда объявление закрыто (onClosed SDK) */
  onClosed?: () => void
  /** Вызывается при полном просмотре (onViewThrough SDK), передаёт id объявления */
  onViewThrough?: (id: string) => void
  /** success=false из промиса — объявление не было показано (нет заполнения) */
  onNoFill?: () => void
  /** Промис завершился с ошибкой */
  onError?: (err: unknown) => void
  payload?: Record<string, unknown>
}

export default function TaddyInterstitial({
  onClosed,
  onViewThrough,
  onNoFill,
  onError,
  payload,
}: TaddyInterstitialProps) {
  const calledRef = useRef(false)

  // Стабилизируем коллбэки через рефы
  const onClosedRef = useRef(onClosed)
  const onViewThroughRef = useRef(onViewThrough)
  const onNoFillRef = useRef(onNoFill)
  const onErrorRef = useRef(onError)
  onClosedRef.current = onClosed
  onViewThroughRef.current = onViewThrough
  onNoFillRef.current = onNoFill
  onErrorRef.current = onError

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!window.Taddy) {
      // SDK не загружен — это ошибка окружения, не событие SDK
      onErrorRef.current?.(new Error('Taddy SDK not available'))
      return
    }

    window.Taddy.ads()
      .interstitial({
        payload,
        onClosed: () => onClosedRef.current?.(),
        onViewThrough: (id: string) => onViewThroughRef.current?.(id),
      })
      .then((success: boolean) => {
        if (!success) onNoFillRef.current?.()
      })
      .catch((err: unknown) => {
        onErrorRef.current?.(err)
      })
  }, [payload])

  return null
}
