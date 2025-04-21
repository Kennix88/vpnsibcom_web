import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

export const publicApiClient = {
  async greenCheck(): Promise<{
    isGreen: boolean
    ip: string
  }> {
    const { data } = await api.get('/xray/green-check')
    return data.data
  },
}
