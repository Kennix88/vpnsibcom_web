import { UserDataInterface } from '@app/types/user-data.interface'
import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  user: UserDataInterface | null
  accessToken: string | null
  setUser: (user: UserDataInterface | null) => void
  setAccessToken: (token: string | null) => void
  reset: () => Promise<void>
}

async function clearAuthCookies() {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      {},
      { withCredentials: true },
    )
  } catch (error) {
    console.error('Failed to clear auth cookies', error)
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      reset: async () => {
        await clearAuthCookies()
        set({ user: null, accessToken: null })
      },
    }),
    {
      name: 'user-storage',
      // Добавляем миграцию на случай изменения структуры хранилища
      version: 1,
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          // Логика миграции если нужно
          return persistedState
        }
        return persistedState
      },
    },
  ),
)
