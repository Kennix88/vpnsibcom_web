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
    let cancelled = false

    const init = async () => {
      try {
        // const debug =
        //   (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
        //   process.env.NODE_ENV === 'development'

        await initTelegramSDK({
          // debug,
          // eruda:
          //   debug && ['ios', 'android'].includes(launchParams.tgWebAppPlatform),
          // mockForMacOS: launchParams.tgWebAppPlatform === 'macos',
          debug: false,
          eruda: false,
          mockForMacOS: false,
        })

        if (!cancelled) {
          setInitialized(true)
        }
      } catch (err) {
        console.error('Failed to init Telegram SDK', err)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [launchParams])

  useEffect(() => {
    if (!initialized) return

    const initAnalytics = async () => {
      try {
        const w = window as Window & {
          TelegramGameProxy?: { receiveEvent?: (...args: unknown[]) => void }
        }
        if (!w.TelegramGameProxy) {
          w.TelegramGameProxy = {}
        }
        if (typeof w.TelegramGameProxy.receiveEvent !== 'function') {
          w.TelegramGameProxy.receiveEvent = () => {}
        }

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
  }, [initialized])

  useEffect(() => {
    if (initDataUser) {
      setServerLocale(initDataUser.language_code)
    }
  }, [initDataUser])

  if (!initialized) {
    return <Loader />
  }

  return (
    <>
      <AnalyticsInit />
      <Auth>{children}</Auth>
    </>
  )
}
