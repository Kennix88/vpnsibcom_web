import { UserDataInterface } from '@app/types/user-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  user: UserDataInterface | null
  accessToken: string | null
  setUser: (user: UserDataInterface | null) => void
  setAccessToken: (token: string | null) => void
  reset: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      reset: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
)
