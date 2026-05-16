'use client'

import { config } from '@app/config/client'
import Script from 'next/script'
import { useEffect } from 'react'

export function TmaAdScripts() {
  useEffect(() => {
    type RichadsController = {
      initialize: (params: {
        pubId: string
        appId: string
        debug: boolean
      }) => void
    }

    const w = window as Window & {
      TelegramAdsController?: new () => RichadsController
      richadsController?: RichadsController | null
      Telegram?: { WebApp?: unknown }
    }

    if (w.richadsController) return

    const tryInit = () => {
      if (!w.TelegramAdsController || !w.Telegram?.WebApp || w.richadsController) {
        return false
      }

      w.richadsController = new w.TelegramAdsController()
      w.richadsController.initialize({
        pubId: config.richadsPubId,
        appId: config.richadsAppId,
        debug: process.env.NODE_ENV === 'development',
      })
      return true
    }

    if (tryInit()) return

    const timer = window.setInterval(() => {
      if (tryInit()) {
        window.clearInterval(timer)
      }
    }, 250)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <>
      <Script
        id="adsonar"
        strategy="afterInteractive"
        src={
          'https://static.sonartech.io/lib/1.0.0/sonar.js?appId=app_133d2148' +
          (process.env.NODE_ENV === 'development' ? '&isDebug=true' : '')
        }
      />

      <Script
        id="taddy"
        strategy="afterInteractive"
        src="https://sdk.taddy.pro/web/taddy.min.js?1317"
      />

      <Script
        id="richads-sdk"
        strategy="afterInteractive"
        src="https://richinfo.co/richpartners/telegram/js/tg-ob.js"
      />
    </>
  )
}
