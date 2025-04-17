import { useUserStore } from '@app/store/user.store'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // для отправки httpOnly куки (refresh)
})

// 👉 Интерцептор запроса: подставляем accessToken
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 👉 Интерцептор ответа: пробуем refresh если 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const store = useUserStore.getState()

    // Если уже пробовали refresh или не 401 — выходим
    if (originalRequest._retry || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )

      const newAccessToken = data.data.accessToken
      useUserStore.getState().setAccessToken(newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      store.reset()
      return Promise.reject(refreshError)
    }
  },
)

export const authApiClient = {
  async telegramLogin(initData: string) {
    const { data } = await api.post('/auth/telegram', { initData })
    return data.data
  },

  async refresh() {
    const { data } = await api.post('/auth/refresh', {})
    return data.data
  },

  async logout() {
    await api.post('/auth/logout')
    useUserStore.getState().reset()
  },

  async getMe() {
    const { data } = await api.get('/user/me')
    return data.data.user
  },

  async updateWallet(address: string) {
    const { data } = await api.post('/user/wallet', { address })
    return data.data.user
  },

  async unlinkWallet() {
    const { data } = await api.delete('/user/wallet')
    return data.data.user
  },
}
