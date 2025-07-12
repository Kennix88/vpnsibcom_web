import { CurrencyEnum } from '@app/enums/currency.enum'
import { UserRolesEnum } from '@app/enums/user-roles.enum'

export interface UserDataInterface {
  id: string
  telegramId: string
  isFreePlanAvailable: boolean
  freePlanDays?: number
  isBanned: boolean
  isDeleted: boolean
  banExpiredAt?: Date
  deletedAt?: Date
  role: UserRolesEnum
  roleName: string
  roleDiscount: number
  limitSubscriptions: number
  isPremium: boolean
  fullName: string
  username?: string
  photoUrl?: string
  languageCode: string
  currencyCode: CurrencyEnum
  referralsCount: number
  isTgProgramPartner: boolean
  tgProgramPartnerExpiredAt?: Date
  balance: UserBalanceInterface
}

export interface UserBalanceInterface {
  paymentBalance: number
  holdBalance: number
  totalEarnedWithdrawalBalance: number
  withdrawalBalance: number
  ticketsBalance: number
  isUseWithdrawalBalance: boolean
  exchangeLimit: number
}
