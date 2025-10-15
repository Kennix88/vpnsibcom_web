// Вспомогательные функции

import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { COLORS } from './constants'

export const getTrafficCountButtonColor = (amount: number) => {
  if (amount <= 10) return COLORS.GREEN
  if (amount <= 50) return COLORS.GOLD
  return COLORS.RED
}

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
  t: any,
) => {
  if (!plan) return ''

  switch (plan.serversSelectType) {
    case PlansServersSelectTypeEnum.CUSTOM:
      return t('subscription.privileges.selectServers')
    case PlansServersSelectTypeEnum.ONE_BASE:
      return t('subscription.privileges.oneBaseServer')
    case PlansServersSelectTypeEnum.ONE_BASE_OR_PREMIUM:
      return t('subscription.privileges.oneBaseOrPremiumServer')
    default:
      if (allBase && allPremium)
        return t('subscription.privileges.accessAllServers')
      if (allBase) return t('subscription.privileges.accessAllBaseServers')
      return premiumCount === 0
        ? t('subscription.privileges.accessBaseServers', { baseCount })
        : t('subscription.privileges.accessBaseAndPremiumServers', {
            baseCount,
            premiumCount,
          })
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
