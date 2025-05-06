import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubscriptionsStore {
  subscriptions: SubscriptionDataInterface | null
  setSubscriptions: (subscriptions: SubscriptionDataInterface) => void
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
