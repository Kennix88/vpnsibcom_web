'use client'
import { EnvUnsupported } from '@app/app/(tma)/_components/EnvUnsupported'
import { setLocale } from '@app/core/i18n/locale'
import { initTelegramSDK } from '@app/core/initTelegramSDK'
import { useClientOnce } from '@app/hooks/useClientOnce'
import { useTmaAuth } from '@app/hooks/useTmaAuth'
import {
  initData,
  retrieveLaunchParams,
  retrieveRawInitData,
  useSignal,
  viewport,
} from '@telegram-apps/sdk-react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect, useMemo } from 'react'

export function TMA({ children }: PropsWithChildren) {
  try {
    const launchParams = useMemo(() => retrieveLaunchParams(), [])
    const { tgWebAppPlatform: platform } = launchParams
    const debug =
      (launchParams.tgWebAppStartParam || '').includes('platformer_debug') ||
      process.env.NODE_ENV === 'development'
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const initDataUser = useSignal(initData.user)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isAuth, isLoading, signIn } = useTmaAuth()
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      initDataUser && setLocale(initDataUser.language_code)
    }, [initDataUser])

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (initDataRaw && !isAuth && !isLoading) {
        signIn(initDataRaw)
      }
    }, [initDataRaw, isAuth, isLoading, signIn])

    return isAuth ? (
      <TonConnectUIProvider
        manifestUrl={process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL}>
        {children}
      </TonConnectUIProvider>
    ) : (
      <>Not auth</>
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return (
      <>
        <EnvUnsupported />
      </>
    )
  }
}
