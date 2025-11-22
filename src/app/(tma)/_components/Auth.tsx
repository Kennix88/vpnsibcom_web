'use client'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { retrieveRawInitData } from '@tma.js/sdk-react'

import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect } from 'react'

export function Auth({ children }: PropsWithChildren) {
  const initDataRaw = retrieveRawInitData()
  const { user, accessToken, setUser, setAccessToken } = useUserStore()
  const { setCurrencies, setRates } = useCurrencyStore()

  // // helper: sha256 hex of string
  // async function sha256Hex(str: string) {
  //   const enc = new TextEncoder()
  //   const data = enc.encode(str)
  //   const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  //   return Array.from(new Uint8Array(hashBuffer))
  //     .map((b) => b.toString(16).padStart(2, '0'))
  //     .join('')
  // }

  // // helper: clear client-side persisted data (best-effort)
  // async function clearClientPersistence() {
  //   try {
  //     // 1) reset zustand stores (public reset function)
  //     try {
  //       await reset()
  //     } catch (e) {
  //       console.warn('User store reset failed', e)
  //     }

  //     // 2) clear selected zustand-like persisted keys (tune patterns for your project)
  //     const patterns = ['user', 'currency', 'persist:', 'zustand', 'app:']
  //     for (let i = localStorage.length - 1; i >= 0; i--) {
  //       const k = localStorage.key(i)
  //       if (!k) continue
  //       if (patterns.some((p) => k.startsWith(p) || k.includes(p))) {
  //         localStorage.removeItem(k)
  //       }
  //     }

  //     // 3) clear caches (service worker / fetch caches)
  //     if ('caches' in window) {
  //       const names = await caches.keys()
  //       await Promise.all(names.map((n) => caches.delete(n)))
  //     }

  //     // 4) try to clear IndexedDB (best-effort — API not available everywhere)
  //     try {
  //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //       // @ts-ignore indexedDB.databases exists in some browsers
  //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       if (indexedDB && (indexedDB as any).databases) {
  //         // modern API
  //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //         // @ts-ignore
  //         const dbs = await indexedDB.databases()
  //         await Promise.all(
  //           // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //           dbs.map((db: any) => db.name && indexedDB.deleteDatabase(db.name)),
  //         )
  //       } else {
  //         // fallback: attempt to open a known DB and delete (no-op if none)
  //       }
  //     } catch {
  //       // ignore
  //     }

  //     // 5) clear in-memory currency store
  //     try {
  //       setCurrencies([])
  //       setRates(null)
  //     } catch (e) {
  //       console.warn('Currency reset failed', e)
  //     }
  //   } catch (e) {
  //     console.warn('Failed to clear client persistence', e)
  //   }
  // }

  // main effect: detect initData change and re-auth
  useEffect(() => {
    const handleInit = async () => {
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
        // const currentHash = await sha256Hex(initDataRaw)
        // const prevHash = sessionStorage.getItem('tma_initDataHash')

        // if (prevHash && prevHash !== currentHash) {
        //   // account changed -> wipe client state and re-login
        //   console.info(
        //     'InitData changed: clearing client persistence and re-authenticating',
        //   )
        //   await clearClientPersistence()

        //   try {
        //     const { accessToken: newToken, user: newUser } =
        //       await authApiClient.telegramLogin(initDataRaw)
        //     // ensure local store updated
        //     setAccessToken(newToken)
        //     setUser(newUser)
        //     sessionStorage.setItem('tma_initDataHash', currentHash)
        //     return
        //   } catch (loginErr) {
        //     console.error(
        //       'telegramLogin after initData change failed:',
        //       loginErr,
        //     )
        //     // fallback -> full reload to force clean state in WebView
        //     if (typeof window !== 'undefined') {
        //       // replace to avoid stacking history
        //       window.location.replace(
        //         window.location.pathname + window.location.search,
        //       )
        //       return
        //     }
        //   }
        // }

        // // no previous hash or same hash -> normal login flow (first visit)
        // // Ensure we save hash so future changes are detected
        // sessionStorage.setItem('tma_initDataHash', currentHash)

        // // If not authenticated yet - try to login (silent)
        // const store = useUserStore.getState()
        // if (!store.user || !store.accessToken) {
        //   try {
        //     await authApiClient.telegramLogin(initDataRaw)
        //   } catch (err) {
        //     console.error('Authorization failed', err)
        //     // keep client reset to avoid stale stale data
        //     try {
        //       await reset()
        //     } catch (e) {
        //       console.warn('reset after failed login failed', e)
        //     }
        //   }
        // }
      } catch (err) {
        console.error('Error during initData handling', err)
      }
    }

    handleInit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initDataRaw])

  useEffect(() => {
    const getRates = async () => {
      try {
        if (user && accessToken) {
          const data = await authApiClient.getCurrency()
          setCurrencies(data.currencies)
          setRates(data.rates)
        }
      } catch (error) {
        console.error('Failed to fetch currency rates', error)
      }
    }

    getRates()
  }, [user, accessToken, setCurrencies, setRates])

  useEffect(() => {
    if (user) {
      setServerLocale(user.languageCode)
    }
  }, [user])

  useEffect(() => {
    const getMe = async () => {
      try {
        const data = await authApiClient.getMe()
        setUser(data)
      } catch (error) {
        console.error('Failed to fetch user data', error)
      }
    }
    getMe()
  }, [setUser])

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
