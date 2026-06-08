'use client'

import Loader from '@app/app/_components/Loader'
import { authApiClient } from '@app/core/authApiClient'
import { setServerLocale } from '@app/core/i18n/locale.server'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { PropsWithChildren, useEffect } from 'react'

export function InitData({ children }: PropsWithChildren) {
  const { user, accessToken } = useUserStore()
  const { setCurrencies, setRates } = useCurrencyStore()

  useEffect(() => {
    if (!user || !accessToken) return
    authApiClient
      .getCurrency()
      .then(({ currencies, rates }) => {
        setCurrencies(currencies)
        setRates(rates)
      })
      .catch((err) => console.error('Failed to fetch currency rates', err))
  }, [user, accessToken, setCurrencies, setRates])

  // ✅ Fix #3: use Server Action instead of setServerLocale from .server module
  // ✅ Fix #8: this is the API-side locale; TMA.tsx handles SDK-side locale.
  //    Both call setLocale which is idempotent (last write wins).
  useEffect(() => {
    if (user?.languageCode) {
      setServerLocale(user.languageCode).catch(console.error)
    }
  }, [user?.languageCode])

  if (!user || !accessToken) {
    return <Loader />
  }

  return <>{children}</>
}
