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
  giftsCount: number
  referralsCount: number
  balance: UserBalanceInterface
}

export interface UserBalanceInterface {
  paymentBalance: number
  holdBalance: number
  totalEarnedWithdrawalBalance: number
  withdrawalBalance: number
  isUseWithdrawalBalance: boolean
}
