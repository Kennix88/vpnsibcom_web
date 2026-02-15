import { CurrencyInterface } from '@app/types/currency.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrencyStore {
  currencies: CurrencyInterface[]
  rates: RatesInterface | null
  setCurrencies: (currencies: CurrencyInterface[]) => void
  setRates: (rates: RatesInterface | null) => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currencies: [],
      rates: null,
      setCurrencies: (currencies) => set({ currencies }),
      setRates: (rates: RatesInterface | null) => set({ rates }),
    }),
    {
      name: 'currency-storage',
    },
  ),
)
