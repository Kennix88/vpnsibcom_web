'use client'
import { useEffect, useRef } from 'react'

type RichadsControllerInstance = {
  initialize: (params: { pubId: string; appId: string; debug: boolean }) => void
  triggerInterstitialVideo: () => Promise<unknown>
  triggerInterstitialBanner: () => Promise<unknown>
  triggerNativeNotification: () => Promise<unknown>
}

declare global {
  interface Window {
    richadsController?: RichadsControllerInstance | null
    TelegramAdsController?: new () => RichadsControllerInstance
  }
}

export default function RichadsReward({
  onReward,
  onClose,
  onError,
}: {
  onReward: () => void
  onClose: () => void
  onError: (error: unknown) => void
}) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      const controller = window.richadsController
      if (!controller) {
        console.warn('RichAds: controller not initialized')
        onError(new Error('RichAds controller not initialized'))
        return
      }

      try {
        // resolve → реклама показана и досмотрена → награда
        await controller.triggerInterstitialBanner()
        onReward()
      } catch (result) {
        // reject → реклама не показана или закрыта раньше времени
        console.warn('RichAds: ad not shown or dismissed', result)
        onClose()
      }
    }

    run().catch((err) => {
      // непредвиденная ошибка (не reject самого SDK, а исключение в коде выше)
      console.error('RichAds: unexpected error', err)
      onError(err)
    })
  }, [onReward, onClose, onError])

  return null
}
