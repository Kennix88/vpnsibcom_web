'use client'
import { config } from '@app/config/client'
import { setLocale } from '@app/core/i18n/locale'
import { initTelegramSDK } from '@app/core/initTelegramSDK'
import { useClientOnce } from '@app/hooks/useClientOnce'
import { useUserStore } from '@app/store/user.store'
import {
  initData,
  retrieveLaunchParams,
  retrieveRawInitData,
  useSignal,
  viewport,
} from '@telegram-apps/sdk-react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import dynamic from 'next/dynamic'
import { PropsWithChildren, useEffect, useMemo } from 'react'

function _TMA({ children }: PropsWithChildren) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const launchParams = useMemo(() => retrieveLaunchParams(), [])
  const { tgWebAppPlatform: platform } = launchParams
  const debug =
    (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
    process.env.NODE_ENV === 'development'

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const initDataUser = useSignal(initData.user)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isAuth, isLoading, tmaAuth } = useUserStore()
  const initDataRaw = retrieveRawInitData()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useClientOnce(() => {
    initTelegramSDK({
      debug: true,
      eruda: debug && ['ios', 'android'].includes(platform),
      mockForMacOS: platform === 'macos',
    })
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (viewport.expand.isAvailable()) {
      viewport.expand()
    }
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (initDataUser) {
      setLocale(initDataUser.language_code)
    }
  }, [initDataUser])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    console.log('InitDataRaw:', initDataRaw) // Добавьте логирование
    if (initDataRaw && !isAuth) {
      console.log('Calling tmaAuth...')
      tmaAuth(initDataRaw).catch(console.error)
    }
  }, [initDataRaw, isAuth, isLoading, tmaAuth])

  if (isLoading) {
    return <div className="loading-screen">TMA Loading...</div>
  }

  if (!isAuth) {
    return <div className="auth-error">Authentication required</div>
  }

  const manifestUrl = config.tonManifestUrl
  if (!manifestUrl) {
    return <div className="error">TON Connect is not configured</div>
  }

  return (
    <TonConnectUIProvider manifestUrl={config.tonManifestUrl}>
      {children}
    </TonConnectUIProvider>
  )
}

export const TMA = dynamic(() => Promise.resolve(_TMA), { ssr: false })
