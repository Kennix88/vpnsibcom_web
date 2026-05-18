'use client'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { resetAllStores } from '@app/store/resetAllStores'
import { useUserStore } from '@app/store/user.store'

import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect } from 'react'

let bootstrapAuthPromise: Promise<void> | null = null

export function Auth({ children }: PropsWithChildren) {
  const { user, accessToken, setUser, setAccessToken } = useUserStore()

  // main effect: detect initData change and re-auth
  useEffect(() => {
    const handleInit = async () => {
      if (bootstrapAuthPromise) {
        await bootstrapAuthPromise
        return
      }

      const { retrieveLaunchParams, retrieveRawInitData } = await import(
        '@tma.js/sdk-react'
      )
      const initDataRaw = retrieveRawInitData()
      const launchParams = retrieveLaunchParams()
      const startParam = launchParams.tgWebAppStartParam?.trim()
      // await clearClientPersistence()
      if (!initDataRaw) {
        console.warn('No Telegram initData found')
        return
      }

      // Always force fresh Telegram login for each TMA session entry.
      // This prevents showing stale persisted data from previous TG account.
      resetAllStores()

      bootstrapAuthPromise = (async () => {
        try {
          const { accessToken: newToken, user: newUser } =
            await authApiClient.telegramLogin(initDataRaw, startParam)
          setAccessToken(newToken)
          setUser(newUser)
        } catch (err) {
          console.error('Error during initData handling', err)
        } finally {
          bootstrapAuthPromise = null
        }
      })()

      await bootstrapAuthPromise
    }

    handleInit()
  }, [setAccessToken, setUser])

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
