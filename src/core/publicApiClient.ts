import { PlansResponseDataInterface } from '@app/types/plans.interface'
import { GetSubscriptionConfigResponseInterface } from '@app/types/subscription-data.interface'
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios'

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

class PublicApiClient {
  private readonly instance: AxiosInstance
  private readonly baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ''

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 180 * 1000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    })

    // Добавляем интерцептор для обработки ошибок
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleError(error)
        return Promise.reject(error)
      },
    )
  }

  /**
   * Универсальный метод для выполнения GET запросов
   */
  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url, config)
      return response.data.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  /**
   * Обработчик ошибок API
   */
  private handleError(error: AxiosError): Error {
    let errorMessage = 'Unknown public API error'
    let statusCode = 500

    if (error.response) {
      // Ошибка с ответом от сервера
      statusCode = error.response.status
      const responseData = error.response.data as any

      errorMessage =
        responseData?.message ||
        responseData?.error ||
        error.message ||
        `Request failed with status ${statusCode}`
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      errorMessage = 'No response received from server'
    } else {
      // Ошибка при настройке запроса
      errorMessage = error.message
    }

    // Логирование ошибки
    console.error(`[PublicAPI Error] ${statusCode}: ${errorMessage}`, {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
    })

    // Возвращаем понятную ошибку
    return new Error(
      `Public API Error: ${errorMessage} (Status: ${statusCode})`,
    )
  }

  /**
   * Проверка "зеленого" статуса сервера
   */
  async greenCheck(): Promise<{ isGreen: boolean; ip: string }> {
    return this.get('/servers/green-check')
  }

  /**
   * Получение данных подписки по токену
   */
  async getSubscriptionDataByToken(
    token: string,
    agent?: string,
  ): Promise<GetSubscriptionConfigResponseInterface> {
    const headers = new AxiosHeaders()
    if (agent) {
      headers.set('User-Agent', agent)
    }

    return this.get(`/subscriptions/by-token/${token}`, { headers })
  }

  /**
   * Получение данных подписки по ID
   */
  async getSubscriptionDataById(
    id: string,
    agent?: string,
  ): Promise<GetSubscriptionConfigResponseInterface> {
    const headers = new AxiosHeaders()
    if (agent) {
      headers.set('User-Agent', agent)
    }

    return this.get(`/subscriptions/by-id/${id}`, { headers })
  }

  /**
   * Получение списка тарифных планов
   */
  async getPlans(): Promise<PlansResponseDataInterface> {
    return this.get('/plans')
  }

  /**
   * Проверка доступности сервера
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.get('/health')
  }
}

// Создаем и экспортируем единственный экземпляр клиента
export const publicApiClient = new PublicApiClient()
