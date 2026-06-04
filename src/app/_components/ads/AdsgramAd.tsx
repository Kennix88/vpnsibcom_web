'use client'

import { useEffect, useRef } from 'react'

interface ShowPromiseResult {
  done: boolean
  description: string
  state: 'load' | 'render' | 'playing' | 'destroy'
  error: boolean
}

interface AdController {
  show: () => Promise<ShowPromiseResult>
  destroy: () => void
}

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

interface AdsgramAdProps {
  blockId: string
  /** Вызывается при успешном просмотре. AdsgramAd сам вызовет onClose после. */
  onReward?: () => void
  /** Вызывается при ошибке или пропуске (необязательно). */
  onError?: (result?: ShowPromiseResult) => void
  /** Вызывается всегда по завершении (просмотр / пропуск / ошибка). */
  onClose: () => void
  isDebug?: boolean
  debugBannerType?: 'FullscreenMedia' | 'RewardedVideo'
}

/**
 * Невидимый компонент-обёртка над Adsgram SDK.
 * Не рендерит ничего — SDK сам создаёт свой оверлей поверх страницы.
 */
export default function AdsgramAd({
  blockId,
  onReward,
  onError,
  onClose,
  isDebug = false,
  debugBannerType = 'FullscreenMedia',
}: AdsgramAdProps) {
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    console.log('[AdsgramAd] mounted', {
      blockId,
      isDebug,
      debugBannerType,
    })

    if (!window.Adsgram) {
      console.warn('[AdsgramAd] Adsgram script not loaded')

      const result: ShowPromiseResult = {
        error: true,
        done: false,
        state: 'load',
        description: 'Adsgram script not loaded',
      }

      onError?.(result)
      onClose()
      return
    }

    console.log('[AdsgramAd] init SDK')

    const controller = window.Adsgram.init({
      blockId,
      debug: isDebug,
      debugConsole: isDebug,
      debugBannerType,
    })

    console.log('[AdsgramAd] show() called')

    controller
      .show()
      .then((result) => {
        console.log('[AdsgramAd] show resolved', result)
        onReward?.()
      })
      .catch((result: ShowPromiseResult) => {
        console.error('[AdsgramAd] show rejected', result)
        onError?.(result)
      })
      .finally(() => {
        console.log('[AdsgramAd] close')
        onClose()
      })

    return () => {
      console.log('[AdsgramAd] cleanup -> destroy')
      controller.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
