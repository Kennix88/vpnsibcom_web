import { CurrencyEnum } from '@app/enums/currency.enum'
import { UserRolesEnum } from '@app/enums/user-roles.enum'

export interface UserDataInterface {
  id: string
  telegramId: string
  isFreePlanAvailable: boolean
  trialGb?: number
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
  inviteUrl: string
  inviteMessageId: string
  nextAdsRewardAt?: Date
  nextAdsgramTaskAt?: Date
}

export interface UserBalanceInterface {
  payment: number
  hold: number
  totalEarned: number
  tickets: number
  traffic: number
  wager: number
}
