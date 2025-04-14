'use client'
import { Auth } from '@app/app/(tma)/_components/Auth'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { initTelegramSDK } from '@app/core/initTelegramSDK'
import {
  initData,
  retrieveLaunchParams,
  useSignal,
  viewport,
} from '@telegram-apps/sdk-react'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'

export function TMA({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)
  const launchParams = useMemo(() => retrieveLaunchParams(), [])
  const initDataUser = useSignal(initData.user)

  useEffect(() => {
    const debug =
      (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
      process.env.NODE_ENV === 'development'

    initTelegramSDK({
      debug: true,
      eruda:
        debug && ['ios', 'android'].includes(launchParams.tgWebAppPlatform),
      mockForMacOS: launchParams.tgWebAppPlatform === 'macos',
    })

    if (viewport.expand.isAvailable()) {
      viewport.expand()
    }

    setInitialized(true)
  }, [launchParams])

  useEffect(() => {
    if (initDataUser) {
      setServerLocale(initDataUser.language_code)
    }
  }, [initDataUser])

  if (!initialized) {
    return <div>Loading...</div>
  }

  return <Auth>{children}</Auth>
}
