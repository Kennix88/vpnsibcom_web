import { ReferralsDataInterface } from '@app/types/referrals-data-interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ReferralsStore {
  referralsData: ReferralsDataInterface | null
  setReferralsData: (referralsData: ReferralsDataInterface) => void
}

export const useRefferlsStore = create<ReferralsStore>()(
  persist(
    (set) => ({
      referralsData: null,
      setReferralsData: (referralsData) => set({ referralsData }),
    }),
    {
      name: 'referrals-storage',
    },
  ),
)
