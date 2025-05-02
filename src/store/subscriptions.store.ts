import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubscriptionsStore {
  subscriptions: SubscriptionDataInterface[]
  setSubscriptions: (subscriptions: SubscriptionDataInterface[]) => void
}

export const useSubscriptionsStore = create<SubscriptionsStore>()(
  persist(
    (set) => ({
      subscriptions: [],
      setSubscriptions: (subscriptions) => set({ subscriptions }),
    }),
    {
      name: 'subscriptions-storage',
    },
  ),
)
