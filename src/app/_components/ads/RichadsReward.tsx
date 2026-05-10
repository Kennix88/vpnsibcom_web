'use client'

import { config } from '@app/config/client'
import { useEffect, useRef } from 'react'

type RichadsResult = {
  rewarded?: boolean
  status?: string
}

type TelegramAdsControllerInstance = {
  initialize: (params: {
    pubId: string
    appId: string
    debug?: boolean
  }) => void
  triggerInterstitialVideo: () => Promise<RichadsResult | unknown>
}

type TelegramAdsControllerConstructor = new () => TelegramAdsControllerInstance

export default function RichadsReward({
  onReward,
  onClose,
}: {
  onReward: () => void
  onClose: () => void
}) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const run = async () => {
      const w = window as Window & {
        TelegramAdsController?: TelegramAdsControllerConstructor
        richadsController?: TelegramAdsControllerInstance
      }

      try {
        if (!w.TelegramAdsController) {
          console.warn('RichAds SDK not available on window')
          return
        }

        if (!w.richadsController) {
          const instance = new w.TelegramAdsController()
          instance.initialize({
            pubId: config.richadsPubId,
            appId: config.richadsAppId,
            debug: process.env.NODE_ENV === 'development',
          })
          w.richadsController = instance
        }

        const result = await w.richadsController.triggerInterstitialVideo()
        const status = (
          typeof result === 'string'
            ? result
            : result &&
                typeof result === 'object' &&
                'status' in result &&
                typeof (result as RichadsResult).status === 'string'
              ? (result as RichadsResult).status
              : ''
        ).toLowerCase()
        const rewarded =
          result &&
          typeof result === 'object' &&
          'rewarded' in result &&
          typeof (result as RichadsResult).rewarded === 'boolean'
            ? (result as RichadsResult).rewarded
            : status === 'success' ||
              status.includes('reward') ||
              status.includes('complete')

        if (rewarded) {
          onReward()
        } else {
          console.log('RichAds completed without reward', result)
          onClose()
        }
      } catch (result) {
        console.warn('RichAds trigger rejected', result)
        onClose()
      }
    }

    void run()
  }, [onClose, onReward])

  return null
}
