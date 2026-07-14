import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import {
  AdsResInterface,
  TaskRewardResInterface,
} from '@app/enums/ads-res.interface'
import { AdsTypeEnum } from '@app/enums/ads-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { useUserStore } from '@app/store/user.store'
import { BonusesInterface } from '@app/types/bonuses.interface'
import { CurrencyInterface } from '@app/types/currency.interface'
import {
  NewEraSubWithTmaInterface,
  SubscriptionExtensionsWithConditionsInterface,
} from '@app/types/new-era.types'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { ReferralsDataInterface } from '@app/types/referrals-data-interface'
import {
  PayPremiumMethodsEnum,
  PayPremiumPeriodEnum,
  UserDataInterface,
} from '@app/types/user-data.interface'
import { getTmaPlatform } from '@app/utils/get-tma-platform.util'

import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

interface ApiClientConfig {
  baseURL: string
  withCredentials: boolean
  timeout: number
}

interface SilentAuthOptions {
  redirectTo?: string
}

class ApiClient {
  private instance: AxiosInstance
  private readonly config: ApiClientConfig
  private reauthPromise: Promise<void> | null = null

  constructor(config: ApiClientConfig) {
    this.config = config
    this.instance = this.createInstance()
  }

  private createInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.config.baseURL,
      withCredentials: this.config.withCredentials,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    // Платформа TMA
    instance.interceptors.request.use((config) => {
      const platform = getTmaPlatform()
      if (platform) {
        if (!(config.headers instanceof AxiosHeaders)) {
          config.headers = new AxiosHeaders(config.headers)
        }
        config.headers.set('X-Platform', platform)
      }
      return config
    })

    instance.interceptors.request.use((config) => this.handleRequest(config))
    instance.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error),
    )

    return instance
  }

  private handleRequest(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    const token = useUserStore.getState().accessToken
    if (token) {
      if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers)
      }
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  }

  private async handleResponseError(error: AxiosError) {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
      _skipAuthRetry?: boolean
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest._skipAuthRetry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    await this.handleAuthError(error, {
      redirectTo: originalRequest.url?.includes('/app')
        ? '/app/login'
        : undefined,
    })

    const token = useUserStore.getState().accessToken
    if (token) {
      if (!(originalRequest.headers instanceof AxiosHeaders)) {
        originalRequest.headers = new AxiosHeaders(originalRequest.headers)
      }
      originalRequest.headers.set('Authorization', `Bearer ${token}`)
    }

    return this.instance.request(originalRequest)
  }

  private async handleAuthError(error: Error, options: SilentAuthOptions = {}) {
    if (!this.reauthPromise) {
      this.reauthPromise = this.reauthenticate()
    }

    try {
      await this.reauthPromise
      return
    } catch (silentAuthError) {
      console.error('Silent re-auth failed:', silentAuthError)
    } finally {
      this.reauthPromise = null
    }

    await useUserStore.getState().reset()
    if (typeof window !== 'undefined' && options.redirectTo) {
      const current = `${window.location.pathname}${window.location.search}`
      if (current !== options.redirectTo) {
        window.location.replace(options.redirectTo)
      }
    }

    throw error
  }

  private async reauthenticate(): Promise<void> {
    if (typeof window === 'undefined') return

    const loginViaTelegram = async (initData: string, startParam?: string) => {
      const { data } = await this.instance.post<
        ApiResponse<{ accessToken: string; user: UserDataInterface }>
      >('/auth/telegram', { initData, ...(startParam ? { startParam } : {}) }, {
        _skipAuthRetry: true,
      } as InternalAxiosRequestConfig & { _skipAuthRetry: boolean })

      const { accessToken, user } = data.data
      const store = useUserStore.getState()
      store.setAccessToken(accessToken)
      store.setUser(user)
    }

    try {
      const { retrieveLaunchParams, retrieveRawInitData } =
        await import('@tma.js/sdk-react')
      const initData = retrieveRawInitData()
      if (initData) {
        const launchParams = retrieveLaunchParams()
        const startParam = launchParams.tgWebAppStartParam?.trim()
        await loginViaTelegram(initData, startParam)
        return
      }
    } catch {
      // Not in TMA context, continue with refresh flow.
    }

    const { data } = await this.instance.post<
      ApiResponse<{ accessToken: string; user: UserDataInterface }>
    >('/auth/refresh', {}, {
      _skipAuthRetry: true,
    } as InternalAxiosRequestConfig & { _skipAuthRetry: boolean })

    const { accessToken, user } = data.data
    const store = useUserStore.getState()
    store.setAccessToken(accessToken)
    store.setUser(user)
  }

  private async handleApiError(error: unknown): Promise<never> {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      console.error(`API Error (${status}): ${message}`, error)

      if (status === 401) {
        // This is now handled by handleResponseError, but as a fallback
        useUserStore.getState().reset()
      }

      if (status === 429) {
        throw new Error('Слишком много запросов. Пожалуйста, попробуйте позже.')
      }

      throw new Error(message || 'Произошла ошибка при обращении к серверу')
    }

    console.error('Unexpected API error:', error)
    throw new Error('Неизвестная ошибка при обращении к серверу')
  }

  private async safeRequest<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      return this.handleApiError(error) as never
    }
  }

  // Authentication methods
  async telegramLogin(initData: string, startParam?: string) {
    return this.safeRequest<{ accessToken: string; user: UserDataInterface }>(
      async () => {
        const { data } = await this.instance.post<
          ApiResponse<{ accessToken: string; user: UserDataInterface }>
        >('/auth/telegram', {
          initData,
          ...(startParam?.trim() ? { startParam: startParam.trim() } : {}),
        })

        const { accessToken, user } = data.data
        const store = useUserStore.getState()
        store.setAccessToken(accessToken)
        store.setUser(user)

        return { accessToken, user }
      },
    )
  }

  async logout() {
    return this.safeRequest<void>(async () => {
      await this.instance.post('/auth/logout')
      useUserStore.getState().reset()
    })
  }

  // User methods
  async getMe() {
    return this.safeRequest<UserDataInterface>(async () => {
      const { data } =
        await this.instance.get<ApiResponse<{ user: UserDataInterface }>>(
          '/user/me',
        )
      return data.data.user
    })
  }

  async updateCurrencyUser(code: CurrencyEnum) {
    return this.safeRequest<UserDataInterface>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{ user: UserDataInterface }>
      >('/user/currency', { code })
      return data.data.user
    })
  }

  async updateLanguageUser(code: string) {
    return this.safeRequest<UserDataInterface>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{ user: UserDataInterface }>
      >('/user/language', { code })
      return data.data.user
    })
  }

  // Currency methods
  async getCurrency() {
    return this.safeRequest<{
      currencies: CurrencyInterface[]
      rates: RatesInterface
    }>(async () => {
      const { data } = await this.instance.get<
        ApiResponse<{
          currencies: CurrencyInterface[]
          rates: RatesInterface
        }>
      >('/currency')
      return data.data
    })
  }

  // Referrals methods
  async getReferrals() {
    return this.safeRequest<{
      user: UserDataInterface
      referrals: ReferralsDataInterface
    }>(async () => {
      const { data } = await this.instance.get<
        ApiResponse<{
          user: UserDataInterface
          referrals: ReferralsDataInterface
        }>
      >('/referrals/my')
      return data.data
    })
  }

  // Payment methods
  async getPaymentMethods(isTma?: boolean) {
    return this.safeRequest<{
      user: UserDataInterface
      methods: PaymentMethodsDataInterface[]
    }>(async () => {
      const { data } = await this.instance.get<
        ApiResponse<{
          user: UserDataInterface
          methods: PaymentMethodsDataInterface[]
        }>
      >('/payments/methods', { params: { isTma } })
      return data.data
    })
  }

  async getPaymentBonuses() {
    return this.safeRequest<BonusesInterface>(async () => {
      const { data } = await this.instance.get<
        ApiResponse<{
          bonuses: BonusesInterface
        }>
      >('/payments/bonuses')
      return data.data.bonuses
    })
  }

  async createInvoice(params: { method: PaymentMethodEnum; amount: number }) {
    return this.safeRequest<{
      user: UserDataInterface
      linkPay: string
      isTonPayment: boolean
      amountTon: number
      token: string
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          user: UserDataInterface
          linkPay: string
          isTonPayment: boolean
          amountTon: number
          token: string
        }>
      >('/payments/invoice', params)
      return data.data
    })
  }

  async getAdTaskReward(place: 'adsgram' | 'reward') {
    return this.safeRequest<TaskRewardResInterface>(async () => {
      const { data } = await this.instance.get(`/ads/task-reward/${place}`)
      return data
    })
  }

  async getAds(place: AdsPlaceEnum, type: AdsTypeEnum) {
    return this.safeRequest<AdsResInterface>(async () => {
      const { data } = await this.instance.get(`/ads/get/${place}/${type}`)
      return data
    })
  }

  async confirmAds(
    verifyKey: string,
    verificationCode?: string,
    isTaddy?: boolean,
  ) {
    return this.safeRequest<{
      success: boolean
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post(`/ads/confirm`, {
        verifyKey,
        verificationCode,
        isTaddy,
      })

      return data
    })
  }

  // new-era
  async getExtensions() {
    return this.safeRequest<{
      success: boolean
      extensions: SubscriptionExtensionsWithConditionsInterface[]
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.get(`/new-era/extensions`)

      return data
    })
  }

  async checkExtensions() {
    return this.safeRequest<{
      success: boolean
      extensions: SubscriptionExtensionsWithConditionsInterface[]
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post(`/new-era/extensions`)

      return data
    })
  }

  async payPremium(
    method: PayPremiumMethodsEnum,
    period: PayPremiumPeriodEnum,
  ) {
    return this.safeRequest<{ success: boolean; user: UserDataInterface }>(
      async () => {
        const { data } = await this.instance.post('/user/pay-premium', {
          method,
          period,
        })
        return data
      },
    )
  }

  async getSubscription() {
    return this.safeRequest<{
      success: boolean
      subscription: NewEraSubWithTmaInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.get(`/new-era/sub`)

      return data
    })
  }

  async renewSubscription() {
    return this.safeRequest<{
      success: boolean
      subscription: NewEraSubWithTmaInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post(`/new-era/sub`)

      return data
    })
  }

  async deleteDevice(hwid: string) {
    return this.safeRequest<{
      success: boolean
      subscription: NewEraSubWithTmaInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.delete(`/new-era/device/` + hwid)

      return data
    })
  }
}

export const authApiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  withCredentials: true,
  timeout: 180 * 1000,
})
