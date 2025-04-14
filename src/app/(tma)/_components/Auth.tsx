'use client'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/apiClient'
import { useUserStore } from '@app/store/user.store'
import { retrieveRawInitData } from '@telegram-apps/sdk-react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect } from 'react'

export function Auth({ children }: PropsWithChildren) {
  const initDataRaw = retrieveRawInitData()
  const { setUser, setAccessToken, reset, user, accessToken } = useUserStore()

  useEffect(() => {
    const authorize = async () => {
      if (!initDataRaw) return

      try {
        const { user, accessToken } =
          await authApiClient.telegramLogin(initDataRaw)
        setUser(user)
        setAccessToken(accessToken)
      } catch (err) {
        console.error('Authorization failed', err)
        reset()
      }
    }

    authorize()
  }, [initDataRaw])

  if (!user || !accessToken) {
    return <div className="loading-screen">TMA Loading...</div>
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
