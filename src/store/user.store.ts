import { authApiClient } from '@app/core/apiClient'
import { JwtPayload } from '@app/types/jwt-payload.interface'
import { decodeToken } from '@app/utils/decode-token.util'
import { create, StateCreator } from 'zustand'
import { persist, PersistOptions } from 'zustand/middleware'

type UserStore = {
  jwtData: JwtPayload | null
  user: object | null
  isAuth: boolean
  isLoading: boolean
  error: string | null
  tmaAuth: (initData: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  reset: () => void
}

type PersistType = (
  config: StateCreator<UserStore>,
  options: PersistOptions<UserStore>,
) => StateCreator<UserStore>

export const useUserStore = create<UserStore>(
  (persist as PersistType)(
    (set, get) => ({
      jwtData: null,
      user: null,
      isAuth: false,
      isLoading: false,
      error: null,

      tmaAuth: async (initData) => {
        try {
          console.log('start tmaAuth - initData: ', initData)
          set({ isLoading: true, error: null })
          const response = await authApiClient.post('/auth/telegram', {
            initData,
          })

          const payload = decodeToken(response.data.accessToken)

          set({
            jwtData: payload,
            isAuth: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true })
          await authApiClient.post('/auth/logout')
        } finally {
          set({
            jwtData: null,
            user: null,
            isAuth: false,
            isLoading: false,
          })
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true })
          const response = await authApiClient.get('/users/me')
          set({ user: response.data })
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          set({ error: error.response?.data?.message, isAuth: false })
        } finally {
          set({ isLoading: false })
        }
      },

      reset: () => {
        set({
          jwtData: null,
          user: null,
          isAuth: false,
          isLoading: false,
          error: null,
        })
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        ...state,
      }),
      // getStorage: () => localStorage,
    },
  ),
)
