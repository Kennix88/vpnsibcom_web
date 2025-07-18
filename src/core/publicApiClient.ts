import { PlansResponseDataInterface } from '@app/types/plans.interface'
import { GetSubscriptionConfigResponseInterface } from '@app/types/subscription-data.interface'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

/**
 * Interface for API response structure
 * @template T Type of data returned by API
 */
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

// --- Создание публичного axios-инстанса
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 180 * 1000,
})

// --- Интерцептор для логов ошибок
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.warn(`[PublicAPI Error] ${error.config?.url}`, error)
    return Promise.reject(error)
  },
)

// --- Универсальная функция для запросов GET
async function getData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const { data } = await api.get<ApiResponse<T>>(url, config)
    return data.data
  } catch (error) {
    throw handlePublicApiError(error)
  }
}

// --- Обработка ошибок публичного API
function handlePublicApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    return new Error(`API Error (${status}): ${message}`)
  }
  return new Error('Unknown public API error')
}

// --- Публичный API клиент
export const publicApiClient = {
  async greenCheck(): Promise<{ isGreen: boolean; ip: string }> {
    return getData('/servers/green-check')
  },

  async getSubscriptionDataByToken(
    token: string,
    agent?: string,
  ): Promise<GetSubscriptionConfigResponseInterface> {
    const config: AxiosRequestConfig = {
      headers: {
        ...(agent && { 'User-Agent': agent }),
      },
    }
    return getData(`/subscriptions/by-token/${token}`, config)
  },

  async getPlans(): Promise<PlansResponseDataInterface> {
    return getData('/plans')
  },
}
