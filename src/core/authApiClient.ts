import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useUserStore } from '@app/store/user.store'
import { CurrencyInterface } from '@app/types/currency.interface'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { ReferralsDataInterface } from '@app/types/referrals-data-interface'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from 'axios'

/**
 * Interface for API response structure
 * @template T Type of data returned by API
 */
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

/**
 * Creates and configures Axios instance for API requests
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // для отправки httpOnly куки (refresh)
    timeout: 15000, // 15 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Request interceptor: add authorization token
  instance.interceptors.request.use(
    (config) => {
      try {
        const token = useUserStore.getState().accessToken
        if (token && config.headers) {
          // Безопасное обновление заголовков
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          } as AxiosRequestHeaders
        }
        return config
      } catch (error) {
        console.error('Request interceptor error:', error)
        return config
      }
    },
    (error: AxiosError): Promise<AxiosError> => {
      console.error('Request interceptor rejection:', error)
      return Promise.reject(error)
    },
  )

  // Response interceptor: handle 401 errors with token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError): Promise<any> => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean
      }
      const store = useUserStore.getState()

      // Exit if already tried refresh or not 401
      if (originalRequest._retry || error.response?.status !== 401) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        // Attempt to refresh token
        const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )

        const newAccessToken = data.data.accessToken

        // Update token in store
        store.setAccessToken(newAccessToken)

        // Update authorization header and retry request
        if (originalRequest.headers) {
          // Безопасное обновление заголовков
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          } as AxiosRequestHeaders
        } else {
          // Создание заголовков, если их нет
          originalRequest.headers = {
            Authorization: `Bearer ${newAccessToken}`,
          } as AxiosRequestHeaders
        }

        return instance(originalRequest)
      } catch (refreshError) {
        // Reset user state on refresh failure
        console.error('Token refresh failed:', refreshError)
        store.reset()
        return Promise.reject(refreshError)
      }
    },
  )

  return instance
}

// Create API instance
const api = createApiInstance()

/**
 * Handles API errors consistently
 * @param error Error from API request
 * @returns Rejected promise with formatted error
 */
const handleApiError = (error: unknown): Promise<never> => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    console.error(`API Error (${status}): ${message}`, error)

    // Handle specific error codes
    if (status === 429) {
      return Promise.reject(
        new Error('Слишком много запросов. Пожалуйста, попробуйте позже.'),
      )
    }

    return Promise.reject(
      new Error(message || 'Произошла ошибка при обращении к серверу'),
    )
  }

  console.error('Unexpected API error:', error)
  return Promise.reject(new Error('Неизвестная ошибка при обращении к серверу'))
}

/**
 * Authentication and API client for application
 */
export const authApiClient = {
  /**
   * Login with Telegram data
   * @param initData Telegram auth data
   * @returns Access token and user data
   */
  async telegramLogin(initData: string): Promise<{
    accessToken: string
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          accessToken: string
          user: UserDataInterface
        }>
      >('/auth/telegram', { initData })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Refresh authentication token
   * @returns New access token and user data
   */
  async refresh(): Promise<{
    accessToken: string
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          accessToken: string
          user: UserDataInterface
        }>
      >('/auth/refresh', {})

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
      useUserStore.getState().reset()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get current user data
   * @returns User data
   */
  async getMe(): Promise<UserDataInterface> {
    try {
      const { data } =
        await api.get<ApiResponse<{ user: UserDataInterface }>>('/user/me')
      return data.data.user
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Update withdrawal balance usage setting
   * @param isUse Whether to use withdrawal balance
   * @returns Updated user data
   */
  async updateWithdrawalBalanceUsage(
    isUse: boolean,
  ): Promise<UserDataInterface> {
    try {
      const { data } = await api.post<ApiResponse<{ user: UserDataInterface }>>(
        '/user/withdrawal-usage',
        { isUse },
      )
      return data.data.user
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Update user currency preference
   * @param code Currency code
   * @returns Updated user data
   */
  async updateCurrencyUser(code: CurrencyEnum): Promise<UserDataInterface> {
    try {
      const { data } = await api.post<ApiResponse<{ user: UserDataInterface }>>(
        '/user/currency',
        { code },
      )
      return data.data.user
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Update user language preference
   * @param code Language code
   * @returns Updated user data
   */
  async updateLanguageUser(code: string): Promise<UserDataInterface> {
    try {
      const { data } = await api.post<ApiResponse<{ user: UserDataInterface }>>(
        '/user/language',
        { code },
      )
      return data.data.user
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get available currencies and exchange rates
   * @returns Currencies and rates data
   */
  async getCurrency(): Promise<{
    currencies: CurrencyInterface[]
    rates: RatesInterface
  }> {
    try {
      const { data } = await api.get<
        ApiResponse<{
          currencies: CurrencyInterface[]
          rates: RatesInterface
        }>
      >('/currency')

      return {
        currencies: data.data.currencies,
        rates: data.data.rates,
      }
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get user referrals data
   * @returns User and referrals data
   */
  async getReferrals(): Promise<{
    user: UserDataInterface
    referrals: ReferralsDataInterface
  }> {
    try {
      const { data } = await api.get<
        ApiResponse<{
          user: UserDataInterface
          referrals: ReferralsDataInterface
        }>
      >('/referrals/my')

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get available payment methods
   * @param isTma Whether request is from Telegram Mini App
   * @returns User and payment methods data
   */
  async getPaymentMethods(isTma?: boolean): Promise<{
    user: UserDataInterface
    methods: PaymentMethodsDataInterface[]
  }> {
    try {
      const { data } = await api.get<
        ApiResponse<{
          user: UserDataInterface
          methods: PaymentMethodsDataInterface[]
        }>
      >('/payments/methods', {
        params: { isTma },
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Create payment invoice
   * @param params Payment method and amount
   * @returns User data, payment link and TMA invoice flag
   */
  async createInvoice({
    method,
    amount,
  }: {
    method: PaymentMethodEnum
    amount: number
  }): Promise<{
    user: UserDataInterface
    linkPay: string
    isTmaIvoice: boolean
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          user: UserDataInterface
          linkPay: string
          isTmaIvoice: boolean
        }>
      >('/payments/invoice', {
        method,
        amount,
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Activate free plan
   * @returns Subscriptions and user data
   */
  async freePlanActivated(): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/free-plan-activated')

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get user subscriptions
   * @returns Subscriptions and user data
   */
  async getSubscriptons(): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.get<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions')

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Purchase subscription with specified parameters
   * @param params Subscription purchase parameters
   * @param params.period Subscription period
   * @param params.periodMultiplier Optional multiplier for subscription period (default: 1)
   * @param params.isFixedPrice Optional flag for fixed price (default: false)
   * @param params.devicesCount Number of devices for subscription
   * @param params.isAllServers Optional flag to include all servers (default: false)
   * @param params.isAllPremiumServers Optional flag to include all premium servers (default: false)
   * @param params.trafficLimitGb Optional traffic limit in GB
   * @param params.isUnlimitTraffic Optional flag for unlimited traffic (default: false)
   * @param params.servers Optional array of server IDs (default: [])
   * @param params.isAutoRenewal Optional flag for auto renewal (default: true)
   * @returns Subscriptions and user data
   */
  async purchaseSubscription(params: {
    period: SubscriptionPeriodEnum
    periodMultiplier?: number
    isFixedPrice?: boolean
    devicesCount: number
    isAllServers?: boolean
    isAllPremiumServers?: boolean
    trafficLimitGb?: number
    isUnlimitTraffic?: boolean
    servers?: string[]
    isAutoRenewal?: boolean
  }): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/purchase', {
        period: params.period,
        periodMultiplier: params.periodMultiplier,
        isFixedPrice: params.isFixedPrice,
        devicesCount: params.devicesCount,
        isAllServers: params.isAllServers,
        isAllPremiumServers: params.isAllPremiumServers,
        trafficLimitGb: params.trafficLimitGb,
        isUnlimitTraffic: params.isUnlimitTraffic,
        servers: params.servers || [],
        isAutoRenewal: params.isAutoRenewal,
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  async deleteSubscription(subscriptionId: string): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/delete', {
        subscriptionId,
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  async renewSubscription(subscriptionId: string): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          message: string
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/renew', {
        subscriptionId,
      })

      console.log(data.data.message)

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  async resetSubscriptionToken(subscriptionId: string): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/reset-token', {
        subscriptionId,
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },

  async toggleAutoRenewalSubscription(subscriptionId: string): Promise<{
    subscriptions: SubscriptionDataInterface
    user: UserDataInterface
  }> {
    try {
      const { data } = await api.post<
        ApiResponse<{
          subscriptions: SubscriptionDataInterface
          user: UserDataInterface
        }>
      >('/subscriptions/toggle-auto-renewal', {
        subscriptionId,
      })

      return data.data
    } catch (error) {
      return handleApiError(error)
    }
  },
}
