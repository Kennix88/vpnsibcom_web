'use client'
import Loader from '@app/app/_components/Loader'
import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { retrieveRawInitData } from '@telegram-apps/sdk-react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { PropsWithChildren, useEffect } from 'react'

export function Auth({ children }: PropsWithChildren) {
  const initDataRaw = retrieveRawInitData()
  const { reset, user, accessToken } = useUserStore()

  const { setCurrencies, setRates } = useCurrencyStore()

  useEffect(() => {
    const initialize = async () => {
      await reset()
    }
    initialize()
  }, [reset])

  useEffect(() => {
    const initAuth = async () => {
      if (!initDataRaw) {
        console.warn('No Telegram initData found')
        return
      }

      try {
        await authApiClient.telegramLogin(initDataRaw)
      } catch (err) {
        console.error('Authorization failed', err)
        await reset()
      }
    }

    initAuth()
  }, [initDataRaw, reset])

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
