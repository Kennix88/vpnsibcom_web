import { CurrencyEnum } from '@app/enums/currency.enum'
import { UserRolesEnum } from '@app/enums/user-roles.enum'

export interface UserDataInterface {
  id: string
  telegramId: string
  isBanned: boolean
  isDeleted: boolean
  banExpiredAt?: Date
  premiumExpiredAt?: Date
  deletedAt?: Date
  role: UserRolesEnum
  roleName: string
  roleDiscount: number
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
  minPayStars: number
  lastFullscreenViewedAt?: Date
  premium: PremiumStatusInterface
}

export interface UserBalanceInterface {
  payment: number
  hold: number
  usdt: number
}

export interface PremiumStatusInterface {
  methods: PremiumStatusMethodInterface[]
  periods: PremiumStatusPeriodInterface[]
}

export interface PremiumStatusMethodInterface {
  method: PayPremiumMethodsEnum // Стиль кнопки зависит от метода
  price: number // Изначальная цена без скидок
  finalPrice: number // Финальная цена с учетом скидок доступных пользователю (без учета скидки за период) (например за роль или общая скидка для всех на премиум сейчас действует). Нужно визуализировать выгоду
  icon: string // ключ иконки для компонента Currency
}

export interface PremiumStatusPeriodInterface {
  period: PayPremiumPeriodEnum
  name: string
  discount: number // Дополнительный множитель скидки (пример 0,8 - 20% доп. скидки) за период, применить к финальной цене при визуализации (визуализировать скидку на кнопках выбора периода)
}

export enum PayPremiumMethodsEnum {
  BALANCE_STARS = 'BALANCE_STARS', // (STARS это payment баланс) Блокировать кнопку если баланса не достаточно
  BALANCE_USDT = 'BALANCE_USDT', // (USDT это usdt баланс) Блокировать кнопку если баланса не достаточно
}

export enum PayPremiumPeriodEnum {
  MONTH = 'MONTH',
  THREE_MONTH = 'THREE_MONTH',
  SIX_MONTH = 'SIX_MONTH',
  YEAR = 'YEAR',
  TWO_YEAR = 'TWO_YEAR',
  THREE_YEAR = 'THREE_YEAR',
  INDEFINITELY = 'INDEFINITELY', // Пожизненно
}
