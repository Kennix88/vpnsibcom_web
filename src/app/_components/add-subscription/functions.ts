// Вспомогательные функции

import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { COLORS } from './constants'

export const getDevicesCountButtonColor = (amount: number) => {
  if (amount <= 5) return COLORS.GREEN
  if (amount <= 10) return COLORS.GOLD
  return COLORS.RED
}

export const calculateDevicePrice = (
  user: UserDataInterface,
  subscriptions: SubscriptionResponseInterface,
  devicesCount: number,
) => {
  if (user.roleDiscount == 0) return 0
  const basePrice = subscriptions.devicesPriceStars * devicesCount
  return user.isPremium
    ? basePrice * subscriptions.telegramPremiumRatio
    : basePrice
}

export const getServersText = (
  plan: PlansInterface | null,
  allBase: boolean,
  allPremium: boolean,
  baseCount: number,
  premiumCount: number,
) => {
  if (!plan) return ''

  switch (plan.serversSelectType) {
    case PlansServersSelectTypeEnum.CUSTOM:
      return 'Выбирай нужные сервера'
    case PlansServersSelectTypeEnum.ONE_BASE:
      return 'Один базовый сервер на выбор'
    case PlansServersSelectTypeEnum.ONE_BASE_OR_PREMIUM:
      return 'Один базовый или премиум сервер на выбор'
    default:
      if (allBase && allPremium) return 'Доступ ко всем серверам'
      if (allBase) return 'Доступ ко всем базовым серверам'
      return premiumCount === 0
        ? `Доступ к ${baseCount} базовым серверам`
        : `Доступ к ${baseCount} базовым и ${premiumCount} премиум серверам`
  }
}

export const getButtonColor = (amount: number) => {
  if (amount === 1) return COLORS.GREEN
  if (amount <= 5) return COLORS.GOLD
  return COLORS.RED
}

export const calculateTrafficPrice = (
  user: UserDataInterface,
  subscriptions: SubscriptionResponseInterface,
  isUnlimit: boolean,
  limitGb: number,
) => {
  if (user.roleDiscount == 0) return 0
  const basePrice = isUnlimit
    ? subscriptions.unlimitTrafficPriceStars
    : subscriptions.trafficGbPriceStars * limitGb
  return user.isPremium
    ? basePrice * subscriptions.telegramPremiumRatio
    : basePrice
}
