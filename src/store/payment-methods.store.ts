import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PaymentMethodsStore {
  methods: PaymentMethodsDataInterface[]
  setMethods: (methods: PaymentMethodsDataInterface[]) => void
}

export const usePaymentMethodsStore = create<PaymentMethodsStore>()(
  persist(
    (set) => ({
      methods: [],
      setMethods: (methods) => set({ methods }),
    }),
    {
      name: 'payment-methods-storage',
    },
  ),
)
