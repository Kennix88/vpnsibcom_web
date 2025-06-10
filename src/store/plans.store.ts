import { PlansResponseDataInterface } from '@app/types/plans.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlansStore {
  plansData: PlansResponseDataInterface | null
  setPlansData: (data: PlansResponseDataInterface) => void
}

export const usePlansStore = create<PlansStore>()(
  persist(
    (set) => ({
      plansData: null,
      setPlansData: (data) => set({ plansData: data }),
    }),
    {
      name: 'plans-storage',
    },
  ),
)
