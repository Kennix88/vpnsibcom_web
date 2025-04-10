import { JwtPayload } from '@app/types/jwt-payload.interface'

export const decodeToken = (token: string): JwtPayload | null => {
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
