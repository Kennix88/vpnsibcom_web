'use client'

import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { resetAllStores } from '@app/store/resetAllStores'
import { useUserStore } from '@app/store/user.store'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect, useState } from 'react'

/**
 * ✅ Fix #6: Map-based registry instead of module-level mutable vars.
 * Keyed by initDataRaw — same session reuses the same promise.
 * StrictMode-safe: double effect run finds existing promise and awaits it.
 */
const authCache = new Map<string, Promise<void>>()

async function bootstrapAuth(
  setAccessToken: (t: string) => void,
  setUser: (
    u: Parameters<typeof setAccessToken>[0] extends string
      ? never
      : Parameters<ReturnType<typeof useUserStore.getState>['setUser']>[0],
  ) => void,
): Promise<void> {
  const { retrieveLaunchParams, retrieveRawInitData } =
    await import('@tma.js/sdk-react')

  const initDataRaw = retrieveRawInitData()
  if (!initDataRaw) {
    console.warn('No Telegram initData found')
    return
  }

  // ✅ If already bootstrapping or done with same initData — reuse the promise
  const cached = authCache.get(initDataRaw)
  if (cached) return cached

  // New session: reset all stores to prevent stale data from previous TG account
  resetAllStores()

  const launchParams = retrieveLaunchParams()
  const startParam = launchParams.tgWebAppStartParam?.trim() || undefined

  const promise = authApiClient
    .telegramLogin(initDataRaw, startParam)
    .then(({ accessToken, user }) => {
      setAccessToken(accessToken)
      // @ts-expect-error user type from store
      setUser(user)
    })
    .catch((err) => {
      console.error('Error during Telegram auth', err)
      authCache.delete(initDataRaw) // allow retry on error
      throw err
    })

  authCache.set(initDataRaw, promise)
  return promise
}

export function Auth({ children }: PropsWithChildren) {
  const { user, accessToken, setUser, setAccessToken } = useUserStore()
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await bootstrapAuth(setAccessToken, setUser as never)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setAccessToken, setUser])

  if (isBootstrapping || !user || !accessToken) {
    return <Loader />
  }

  const manifestUrl = config.tonManifestUrl
  if (!manifestUrl) {
    return <div className="error">TON Connect is not configured</div>
  }

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  )
}
