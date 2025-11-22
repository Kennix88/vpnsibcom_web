'use client'
import Loader from '@app/app/_components/Loader'
import { authApiClient } from '@app/core/authApiClient'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'

import { PropsWithChildren, useEffect } from 'react'

export function InitData({ children }: PropsWithChildren) {
  const { user, accessToken, setUser } = useUserStore()
  const { setCurrencies, setRates } = useCurrencyStore()

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

  return <>{children}</>
}
