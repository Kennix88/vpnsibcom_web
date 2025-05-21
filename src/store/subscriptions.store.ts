import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubscriptionsStore {
  subscriptions: SubscriptionResponseInterface | null
  setSubscriptions: (subscriptions: SubscriptionResponseInterface) => void
}

export const useSubscriptionsStore = create<SubscriptionsStore>()(
  persist(
    (set) => ({
      subscriptions: null,
      setSubscriptions: (subscriptions) => set({ subscriptions }),
    }),
    {
      name: 'subscriptions-storage',
    },
  ),
)
