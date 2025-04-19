import { CurrencyEnum } from '@app/enums/currency.enum'
import { useUserStore } from '@app/store/user.store'
import { CurrencyInterface } from '@app/types/currency.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { ReferralsDataInterface } from '@app/types/referrals-data-interface'
import { UserDataInterface } from '@app/types/user-data.interface'
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
  async telegramLogin(initData: string): Promise<{
    accessToken: string
    user: UserDataInterface
  }> {
    const { data } = await api.post('/auth/telegram', { initData })
    return data.data
  },

  async refresh(): Promise<{
    accessToken: string
    user: UserDataInterface
  }> {
    const { data } = await api.post('/auth/refresh', {})
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
    useUserStore.getState().reset()
  },

  async getMe(): Promise<UserDataInterface> {
    const { data } = await api.get('/user/me')
    return data.data.user
  },

  async updateWallet(address: string): Promise<UserDataInterface> {
    const { data } = await api.post('/user/wallet', { address })
    return data.data.user
  },

  async unlinkWallet(): Promise<UserDataInterface> {
    const { data } = await api.delete('/user/wallet')
    return data.data.user
  },

  async updateWithdrawalBalanceUsage(
    isUse: boolean,
  ): Promise<UserDataInterface> {
    const { data } = await api.post('/user/withdrawal-usage', { isUse })
    return data.data.user
  },

  async updateCurrencyUser(code: CurrencyEnum): Promise<UserDataInterface> {
    const { data } = await api.post('/user/currency', { code })
    return data.data.user
  },

  async updateLanguageUser(code: string): Promise<UserDataInterface> {
    const { data } = await api.post('/user/language', { code })
    return data.data.user
  },

  async getCurrency(): Promise<{
    currencies: CurrencyInterface
    rates: RatesInterface
  }> {
    const { data } = await api.get('/currency')
    return {
      currencies: data.data.currencies,
      rates: data.data.rates,
    }
  },

  async getReferrals(): Promise<{
    user: UserDataInterface
    referrals: ReferralsDataInterface
  }> {
    const { data } = await api.get('/user/referrals')
    return data.data
  },
}
