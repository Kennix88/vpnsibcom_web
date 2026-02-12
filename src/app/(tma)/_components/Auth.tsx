'use client'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'

import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect } from 'react'

export function Auth({ children }: PropsWithChildren) {
  const { user, accessToken, setUser, setAccessToken } = useUserStore()

  // main effect: detect initData change and re-auth
  useEffect(() => {
    const handleInit = async () => {
      const { retrieveRawInitData } = await import('@tma.js/sdk-react')
      const initDataRaw = retrieveRawInitData()
      // await clearClientPersistence()
      if (!initDataRaw) {
        console.warn('No Telegram initData found')
        return
      }

      try {
        const { accessToken: newToken, user: newUser } =
          await authApiClient.telegramLogin(initDataRaw)
        // ensure local store updated
        setAccessToken(newToken)
        setUser(newUser)
      } catch (err) {
        console.error('Error during initData handling', err)
      }
    }

    handleInit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user || !accessToken) {
    return <Loader />
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
