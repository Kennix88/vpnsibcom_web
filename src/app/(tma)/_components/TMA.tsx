'use client'

import { Auth } from '@app/app/(tma)/_components/Auth'
import { TmaAdScripts } from '@app/app/(tma)/_components/TmaAdScripts'
import AnalyticsInit from '@app/app/_components/AnalyticsInit'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { initTelegramSDK } from '@app/core/initTelegramSDK'
import { initData, useSignal } from '@tma.js/sdk-react'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

function getTelegramAnalyticsHost(token?: string): string | undefined {
  if (!token) return undefined
  try {
    const [payload] = token.split('!')
    if (!payload) return undefined
    const decoded = JSON.parse(window.atob(payload)) as { app_domain?: string }
    return decoded.app_domain ? new URL(decoded.app_domain).hostname : undefined
  } catch {
    return undefined
  }
}

export function TMA({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)
  const analyticsInitRef = useRef(false)

  // ✅ Fix #1: SDK init runs first, no retrieveLaunchParams in useMemo
  // ✅ Fix #12: initTelegramSDK is idempotent — safe for StrictMode double-invoke
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await initTelegramSDK({
          debug: false,
          eruda: false,
          mockForMacOS: false,
        })
        if (!cancelled) setInitialized(true)
      } catch (err) {
        console.error('Failed to init Telegram SDK', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, []) // ✅ empty deps — no launchParams dep loop

  // Telegram Analytics — only after SDK is ready, only once
  useEffect(() => {
    if (!initialized || analyticsInitRef.current) return
    analyticsInitRef.current = true
    ;(async () => {
      try {
        const w = window as Window & {
          TelegramGameProxy?: { receiveEvent?: (...args: unknown[]) => void }
        }
        if (!w.TelegramGameProxy) w.TelegramGameProxy = {}
        if (typeof w.TelegramGameProxy.receiveEvent !== 'function') {
          w.TelegramGameProxy.receiveEvent = () => {}
        }

        const analyticsHost = getTelegramAnalyticsHost(config.TMA_TOKEN)
        if (analyticsHost && analyticsHost !== window.location.hostname) return

        const { default: TelegramAnalytics } =
          await import('@telegram-apps/analytics')
        TelegramAnalytics.init({
          token: config.TMA_TOKEN,
          appName: config.TMA_IDENTIFIER,
        })
      } catch (err) {
        console.error('Failed to init TelegramAnalytics', err)
      }
    })()
  }, [initialized])

  // ✅ Fix #2: languageCode (camelCase), not language_code
  // ✅ Fix #3: setLocale is a Server Action — safe to call from 'use client'
  // ✅ Fix #8: single source of locale from SDK signal (API user locale is set in InitData)
  const initDataUser = useSignal(initData.user)
  useEffect(() => {
    if (initDataUser?.language_code) {
      setServerLocale(initDataUser.language_code).catch(console.error)
    }
  }, [initDataUser?.language_code])

  if (!initialized) return <Loader />

  return (
    <>
      <TmaAdScripts />
      <AnalyticsInit />
      <Auth>{children}</Auth>
    </>
  )
}
