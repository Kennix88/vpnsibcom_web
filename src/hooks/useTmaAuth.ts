import axios from 'axios'
import { deleteCookie, getCookie, setCookie } from 'cookies-next'
import { useCallback, useEffect, useState } from 'react'

export const useTmaAuth = () => {
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<JwtPayload | null>(null)

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // Декодируем JWT токен (клиентская проверка)
  const decodeToken = (token: string): JwtPayload | null => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      return {
        sub: payload.sub,
        telegramId: payload.telegramId,
        role: payload.role,
      }
    } catch (e) {
      return null
    }
  }

  // Проверяем авторизацию при монтировании
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await getCookie('access_token')
        const getRefreshToken = await getCookie('refreshToken')

        if (accessToken) {
          const payload = decodeToken(accessToken)
          if (payload) {
            setUserData(payload)
            setIsAuth(true)
          }
        } else if (getRefreshToken) {
          await refreshToken()
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Авторизация через Telegram InitData
  const signIn = async (initData: string) => {
    if (!initData) {
      setError('InitData is required')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/telegram`,
        {
          initData,
        },
        {
          withCredentials: true,
        },
      )

      const { accessToken } = response.data

      if (!accessToken) {
        throw new Error('No access token received')
      }

      // Сохраняем токен (refreshToken уже установлен сервером в cookies)
      setCookie('access_token', accessToken, {
        path: '/',
        maxAge: 60 * 15, // 15 минут (как access token expiry)
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })

      const payload = decodeToken(accessToken)
      if (payload) {
        setUserData(payload)
        setIsAuth(true)
      }

      return true
    } catch (error) {
      console.error('Auth error:', error)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      setError(error.response?.data?.message || 'Auth failed')
      setIsAuth(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Обновление токенов
  const refreshToken = async () => {
    try {
      const getRefreshToken = getCookie('refreshToken')
      if (!getRefreshToken) return false

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Cookie: `refreshToken=${getRefreshToken}`,
          },
          withCredentials: true,
        },
      )

      const { accessToken } = response.data

      setCookie('access_token', accessToken, {
        path: '/',
        maxAge: 60 * 15,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })

      const payload = decodeToken(accessToken)
      if (payload) {
        setUserData(payload)
        setIsAuth(true)
      }

      return true
    } catch (error) {
      console.error('Refresh token error:', error)
      signOut()
      return false
    }
  }

  // Выход из системы
  const signOut = async () => {
    try {
      const accessToken = getCookie('access_token')
      if (accessToken) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      deleteCookie('access_token')
      deleteCookie('refreshToken')
      setIsAuth(false)
      setUserData(null)
    }
  }

  // Получение авторизационных заголовков
  const getAuthHeaders = useCallback(() => {
    const accessToken = getCookie('access_token')
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }, [])

  // Интерцептор для axios
  const authApiClient = axios.create({
    baseURL: API_BASE_URL,
  })

  authApiClient.interceptors.request.use((config) => {
    const token = getCookie('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  authApiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        const success = await refreshToken()
        if (success) {
          return authApiClient(originalRequest)
        }
      }
      return Promise.reject(error)
    },
  )

  return {
    isAuth,
    isLoading,
    error,
    userData,
    signIn,
    signOut,
    refreshToken,
    getAuthHeaders,
    authApiClient,
  }
}

interface JwtPayload {
  sub: string
  telegramId: string
  role: string
}
