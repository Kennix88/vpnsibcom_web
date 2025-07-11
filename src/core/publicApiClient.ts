import { PlansResponseDataInterface } from '@app/types/plans.interface'
import { GetSubscriptionConfigResponseInterface } from '@app/types/subscription-data.interface'
import axios from 'axios'

/**
 * Interface for API response structure
 * @template T Type of data returned by API
 */
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

export const publicApiClient = {
  async greenCheck(): Promise<{
    isGreen: boolean
    ip: string
  }> {
    const { data } = await api.get('/servers/green-check')
    return data.data
  },

  async getSubscriptionDataByToken(
    token: string,
    agent?: string,
  ): Promise<GetSubscriptionConfigResponseInterface> {
    const { data } = await api.get<
      ApiResponse<GetSubscriptionConfigResponseInterface>
    >(`/subscriptions/by-token/${token}`, {
      headers: {
        ...(agent && {
          'User-Agent': agent,
        }),
      },
    })
    return data.data
  },

  async getPlans(): Promise<PlansResponseDataInterface> {
    const { data } =
      await api.get<ApiResponse<PlansResponseDataInterface>>(`/plans`)
    return data.data
  },
}
