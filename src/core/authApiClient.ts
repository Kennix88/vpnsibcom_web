import { AdsPlaceEnum } from '@app/enums/ads-place.enum'
import { AdsResInterface } from '@app/enums/ads-res.interface'
import { AdsTaskTypeEnum } from '@app/enums/ads-task-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { useUserStore } from '@app/store/user.store'
import { CurrencyInterface } from '@app/types/currency.interface'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { ReferralsDataInterface } from '@app/types/referrals-data-interface'
import { ServersResponseDataInterface } from '@app/types/servers-data.interface'
import {
  CreateSubscriptionDataInterface,
  GetSubscriptionConfigResponseInterface,
  SubscriptionResponseInterface,
} from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { retrieveRawInitData } from '@tma.js/sdk-react'

import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

type FailedRequest = {
  resolve: (value: AxiosResponse) => void
  reject: (reason?: any) => void
}

interface ApiClientConfig {
  baseURL: string
  withCredentials: boolean
  timeout: number
}

interface RefreshTokenResponse {
  accessToken: string
}

interface SilentAuthOptions {
  redirectTo?: string
}

class ApiClient {
  private instance: AxiosInstance
  private isRefreshing = false
  private failedQueue: FailedRequest[] = []
  private readonly config: ApiClientConfig

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

    // Исправление типов для интерцепторов
    instance.interceptors.request.use((config) => this.handleRequest(config))
    instance.interceptors.response.use(
      (response) => response,
      (error) => this.handleResponseError(error),
    )

    return instance
  }

  // Исправленный тип для параметра config
  private handleRequest(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    const token = useUserStore.getState().accessToken
    if (token) {
      // Создаем экземпляр AxiosHeaders если нужно
      if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers)
      }

      // Устанавливаем заголовок с использованием AxiosHeaders
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  }

  private async handleResponseError(error: AxiosError) {
    // Исправленный тип для originalRequest
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/telegram')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const newToken = await this.refreshToken()
      const store = useUserStore.getState()
      store.setAccessToken(newToken)

      // Исправление: правильная установка заголовка
      if (originalRequest.headers) {
        if (!(originalRequest.headers instanceof AxiosHeaders)) {
          originalRequest.headers = new AxiosHeaders(originalRequest.headers)
        }
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
      } else {
        originalRequest.headers = new AxiosHeaders({
          Authorization: `Bearer ${newToken}`,
        })
      }

      return this.instance(originalRequest)
    } catch (refreshError) {
      return this.handleRefreshError(refreshError as Error, {
        redirectTo: originalRequest.url?.includes('/app')
          ? '/app/login'
          : '/tma',
      })
    } finally {
      this.isRefreshing = false
      this.processQueue(null)
    }
  }

  private async refreshToken(): Promise<string> {
    const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
      `${this.config.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    return response.data.data.accessToken
  }

  private async handleRefreshError(
    error: Error,
    options: SilentAuthOptions = {},
  ) {
    const store = useUserStore.getState()
    store.reset()

    if (typeof window !== 'undefined') {
      try {
        const initData = retrieveRawInitData()
        if (initData) {
          const { accessToken, user } = await this.telegramLogin(initData)
          store.setAccessToken(accessToken)
          store.setUser(user)
          throw error
        }
      } catch (silentAuthError) {
        console.error('Silent re-auth failed:', silentAuthError)
      }
    }

    if (typeof window !== 'undefined' && options.redirectTo) {
      window.location.replace(options.redirectTo)
    }

    throw error
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ reject }) => {
      reject(error)
    })
    this.failedQueue = []
  }

  private async handleApiError(error: unknown): Promise<never> {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      console.error(`API Error (${status}): ${message}`, error)

      if (status === 401) {
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

  /**
   * Обертка для безопасного выполнения запросов
   */
  private async safeRequest<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      return this.handleApiError(error) as never
    }
  }

  // Authentication methods
  async telegramLogin(initData: string) {
    return this.safeRequest<{ accessToken: string; user: UserDataInterface }>(
      async () => {
        const { data } = await this.instance.post<
          ApiResponse<{ accessToken: string; user: UserDataInterface }>
        >('/auth/telegram', { initData })

        const { accessToken, user } = data.data
        const store = useUserStore.getState()
        store.setAccessToken(accessToken)
        store.setUser(user)

        return { accessToken, user }
      },
    )
  }

  async refresh() {
    return this.safeRequest<{ accessToken: string; user: UserDataInterface }>(
      async () => {
        const { data } = await this.instance.post<
          ApiResponse<{ accessToken: string; user: UserDataInterface }>
        >('/auth/refresh', {})
        return data.data
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

  // Subscription methods
  async freePlanActivated() {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/free-plan-activated')
      return data.data
    })
  }

  async getSubscriptons() {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.get<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions')
      return data.data
    })
  }

  async purchaseSubscription(params: CreateSubscriptionDataInterface) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
      invoice?: {
        linkPay: string
        isTonPayment: boolean
        amountTon: number
        token: string
      }
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
          invoice?: {
            linkPay: string
            isTonPayment: boolean
            amountTon: number
            token: string
          }
        }>
      >('/subscriptions/purchase', params)
      return data.data
    })
  }

  async editSubscriptionName(subscriptionId: string, name: string) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/edit-name/' + subscriptionId, { name })
      return data.data
    })
  }

  async updateServerSubscription(subscriptionId: string, servers: string[]) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/update-server/' + subscriptionId, { servers })
      return data.data
    })
  }

  async addTrafficSubscription(
    subscriptionId: string,
    traffic: number,
    method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC',
  ) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
      invoice?: {
        linkPay: string
        isTonPayment: boolean
        amountTon: number
        token: string
      }
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
          invoice?: {
            linkPay: string
            isTonPayment: boolean
            amountTon: number
            token: string
          }
        }>
      >('/subscriptions/add-traffic/' + subscriptionId, { traffic, method })
      return data.data
    })
  }

  async deleteSubscription(subscriptionId: string) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/delete', { subscriptionId })
      return data.data
    })
  }

  async renewSubscription(
    subscriptionId: string,
    method: PaymentMethodEnum | 'BALANCE',
    isSavePeriod: boolean,
    period: SubscriptionPeriodEnum,
    periodMultiplier: number,
    trafficReset: TrafficResetEnum,
  ) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
      invoice?: {
        linkPay: string
        isTonPayment: boolean
        amountTon: number
        token: string
      }
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
          invoice?: {
            linkPay: string
            isTonPayment: boolean
            amountTon: number
            token: string
          }
        }>
      >('/subscriptions/renew/' + subscriptionId, {
        method,
        isSavePeriod,
        period,
        periodMultiplier,
        trafficReset,
      })
      return data.data
    })
  }

  async resetSubscriptionToken(subscriptionId: string) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/reset-token', { subscriptionId })
      return data.data
    })
  }

  async toggleAutoRenewalSubscription(subscriptionId: string) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/toggle-auto-renewal', { subscriptionId })
      return data.data
    })
  }

  async getSubscriptionDataById(id: string, agent?: string) {
    return this.safeRequest<GetSubscriptionConfigResponseInterface>(
      async () => {
        const { data } = await this.instance.get<
          ApiResponse<GetSubscriptionConfigResponseInterface>
        >(`/subscriptions/by-id/${id}`, {
          headers: agent ? { 'User-Agent': agent } : undefined,
        })
        return data.data
      },
    )
  }

  async getAds(place: AdsPlaceEnum, type: AdsTaskTypeEnum) {
    return this.safeRequest<AdsResInterface>(async () => {
      const { data } = await this.instance.get(`/ads/${place}/${type}`)
      return data
    })
  }

  async confirmAds(verifyKey: string, verificationCode?: string) {
    return this.safeRequest<{
      success: boolean
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post(`/ads/confirm`, {
        verifyKey,
        verificationCode,
      })

      return data
    })
  }

  async getServers() {
    return this.safeRequest<ServersResponseDataInterface>(async () => {
      const { data } =
        await this.instance.get<ApiResponse<ServersResponseDataInterface>>(
          '/servers',
        )
      return data.data
    })
  }

  /**
   * Updates the servers for a subscription
   * @param subscriptionId - ID of the subscription to update
   * @param serverCodes - Array of server codes to assign to the subscription
   * @returns Promise with updated subscriptions and user data
   */
  async updateSubscriptionServers(
    subscriptionId: string,
    serverCodes: string[],
  ) {
    return this.safeRequest<{
      subscriptions: SubscriptionResponseInterface
      user: UserDataInterface
    }>(async () => {
      const { data } = await this.instance.post<
        ApiResponse<{
          subscriptions: SubscriptionResponseInterface
          user: UserDataInterface
        }>
      >('/subscriptions/update-servers', { subscriptionId, serverCodes })
      return data.data
    })
  }
}

// Создаем экземпляр API клиента
export const authApiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  withCredentials: true,
  timeout: 180 * 1000,
})
