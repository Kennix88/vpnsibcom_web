import { CurrencyEnum } from '@app/enums/currency.enum'

export interface UserDataInterface {
  id: string
  telegramId: string
  tonWallet?: string
  isFreePlanAvailable: boolean
  isBanned: boolean
  isDeleted: boolean
  banExpiredAt?: Date
  deletedAt?: Date
  roleDiscount: number
  limitSubscriptions: number
  isPremium: boolean
  fullName: string
  username?: string
  photoUrl?: string
  languageCode: string
  currencyCode: CurrencyEnum
}
