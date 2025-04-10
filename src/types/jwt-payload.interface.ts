import { UserRolesEnum } from '@app/enums/user-roles.enum'

export interface JwtPayload {
  sub: string
  telegramId: string
  role: UserRolesEnum
  iat?: number
  exp?: number
}
