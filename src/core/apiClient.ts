import { config } from '@app/config/client'
import { useUserStore } from '@app/store/user.store'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { getCookie } from 'cookies-next'

const API_BASE_URL = config.apiUrl || 'http://localhost:4000'

// Базовый инстанс без авторизации
export const baseApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Авторизованный инстанс с интерцепторами
export const authApiClient = (() => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  })

  // Интерцептор запросов
  instance.interceptors.request.use((config) => {
    const accessToken = getCookie('access_token')

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })

  // Интерцептор ответов
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any

      // Обрабатываем только 401 ошибки
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Пытаемся обновить токен
          const refreshToken = getCookie('refreshToken')
          if (!refreshToken) throw error

          const refreshResponse = await baseApiClient.post(
            '/auth/refresh',
            {},
            {
              headers: {
                Cookie: `refreshToken=${refreshToken}`,
              },
            },
          )

          const newAccessToken = refreshResponse.data.accessToken
          document.cookie = `access_token=${newAccessToken}; path=/; max-age=900` // 15 минут

          // Повторяем оригинальный запрос
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return instance(originalRequest)
        } catch (refreshError) {
          // При неудачном обновлении делаем логаут
          await useUserStore.getState().logout()
          throw refreshError
        }
      }

      throw error
    },
  )

  return instance
})()
