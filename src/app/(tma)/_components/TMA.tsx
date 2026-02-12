'use client'
import { Auth } from '@app/app/(tma)/_components/Auth'
import AnalyticsInit from '@app/app/_components/AnalyticsInit'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { initTelegramSDK } from '@app/core/initTelegramSDK'
import { initData, retrieveLaunchParams, useSignal } from '@tma.js/sdk-react'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'

export function TMA({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)
  const launchParams = useMemo(() => retrieveLaunchParams(), [])
  const initDataUser = useSignal(initData.user)

  useEffect(() => {
    // const debug =
    //   (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
    //   process.env.NODE_ENV === 'development'

    initTelegramSDK({
      // debug,
      // eruda:
      //   debug && ['ios', 'android'].includes(launchParams.tgWebAppPlatform),
      // mockForMacOS: launchParams.tgWebAppPlatform === 'macos',
      debug: false,
      eruda: false,
      mockForMacOS: false,
    })

    setInitialized(true)
  }, [launchParams])

  useEffect(() => {
    const initAnalytics = async () => {
      try {
        const { default: TelegramAnalytics } =
          await import('@telegram-apps/analytics')
        TelegramAnalytics.init({
          token: config.TMA_TOKEN,
          appName: config.TMA_IDENTIFIER,
        })
      } catch (err) {
        console.error('Failed to init TelegramAnalytics', err)
      }
    }
    initAnalytics()
  }, [])

  useEffect(() => {
    if (initDataUser) {
      setServerLocale(initDataUser.language_code)
    }
  }, [initDataUser])

  if (!initialized) {
    return <Loader />
  }

  return (
    <Auth>
      {children}
      <AnalyticsInit />
    </Auth>
  )
}
