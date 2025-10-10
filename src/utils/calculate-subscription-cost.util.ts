import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { PlansInterface } from '@app/types/plans.interface'

/**
 * Subscription cost calculation settings interface
 */
interface SubscriptionCostSettings {
  devicesPriceStars: number
  serversPriceStars: number
  premiumServersPriceStars: number
  unlimitTrafficPriceStars: number
  trafficGbPriceStars: number
  allBaseServersPriceStars: number
  allPremiumServersPriceStars: number
  hourRatioPayment: number
  dayRatioPayment: number
  weekRatioPayment: number
  threeMouthesRatioPayment: number
  sixMouthesRatioPayment: number
  oneYearRatioPayment: number
  twoYearRatioPayment: number
  threeYearRatioPayment: number
  indefinitelyRatio: number
  telegramPremiumRatio: number
  telegramPartnerProgramRatio: number
}

/**
 * Subscription cost calculation parameters
 */
interface SubscriptionCostParams {
  isPremium: boolean
  isTgProgramPartner: boolean
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  devicesCount: number
  serversCount?: number
  premiumServersCount?: number
  trafficLimitGb: number | null
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  isUnlimitTraffic: boolean
  userDiscount: number
  plan: PlansInterface
  settings: SubscriptionCostSettings
}

export function calculateTrafficPrice(
  trafficLimitGb: number | null,
  isPremium: boolean,
  isTgProgramPartner: boolean,
  userDiscount: number,
  settings: SubscriptionCostSettings,
) {
  if (trafficLimitGb == null || trafficLimitGb <= 0) {
    throw new Error('The traffic must be greater than 0')
  }
  return roundingUpPrice(
    trafficLimitGb *
      roundingUpPrice(settings.trafficGbPriceStars / 30) *
      (isPremium ? settings.telegramPremiumRatio : 1) *
      (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1) *
      userDiscount,
  )
}

/**
 * Calculate subscription cost based on period and user discount
 * @param params - Subscription parameters object
 * @returns Цена в Stars? Всегда целочисленная!
 */
export function calculateSubscriptionCost(
  params: SubscriptionCostParams,
): number {
  const {
    period,
    periodMultiplier,
    isPremium,
    isTgProgramPartner,
    devicesCount,
    serversCount = 0,
    premiumServersCount = 0,
    trafficLimitGb = 0,
    isAllBaseServers,
    isAllPremiumServers,
    isUnlimitTraffic,
    userDiscount = 1,
    plan,
    settings,
  } = params

  // Валидируем скидку
  if (userDiscount < 0 || userDiscount > 1) {
    throw new Error(
      `Unusual user discount value: ${userDiscount}, expected between 0-1`,
    )
  }

  // Дропаем нулевую цену, если скидка 100%
  if (userDiscount == 0) return 0

  // Для Триала и Трафик тарифа считаем сразу цену
  if (plan.key == PlansEnum.TRIAL || plan.key == PlansEnum.TRAFFIC) {
    if (trafficLimitGb == null || trafficLimitGb < 0) {
      throw new Error('The traffic must be greater than 0')
    }
    return roundingUpPrice(
      trafficLimitGb *
        roundingUpPrice(settings.trafficGbPriceStars / 30) *
        (isPremium ? settings.telegramPremiumRatio : 1) *
        (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1) *
        userDiscount,
    )
  }

  // Для остальных кроме кастома, считаем цену
  if (plan.key !== PlansEnum.CUSTOM) {
    if (!plan.priceStars) {
      throw new Error('Plan price Stars is not defined')
    }
    return roundingUpPrice(
      calculatePriceByPeriod(
        period,
        periodMultiplier,
        plan.priceStars,
        settings,
      ) *
        (isPremium ? settings.telegramPremiumRatio : 1) *
        (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1) *
        userDiscount,
    )
  }

  // Validate input parameters
  if (devicesCount < 0) {
    throw new Error('Devices count cannot be negative')
  }

  if (
    (serversCount < 0 && !isAllBaseServers) ||
    (premiumServersCount < 0 && !isAllPremiumServers)
  ) {
    throw new Error('Servers count cannot be negative')
  }

  if (
    (trafficLimitGb == null && !isUnlimitTraffic) ||
    (trafficLimitGb !== null && trafficLimitGb < 0 && !isUnlimitTraffic)
  ) {
    throw new Error('Traffic limit cannot be negative')
  }

  // Calculate device price
  const devicePrice = settings.devicesPriceStars * devicesCount

  // Calculate servers price
  const serversPrice = calculateServersPrice(
    isAllBaseServers,
    isAllPremiumServers,
    serversCount,
    settings,
  )

  // Calculate premium servers price
  const premiumServersPrice = calculatePremiumServersPrice(
    isAllPremiumServers,
    isAllBaseServers,
    premiumServersCount,
    settings,
  )

  // Calculate traffic price
  const trafficPrice =
    isUnlimitTraffic || !trafficLimitGb
      ? settings.unlimitTrafficPriceStars
      : trafficLimitGb * settings.trafficGbPriceStars

  // Calculate base price
  const basePrice =
    devicePrice + serversPrice + premiumServersPrice + trafficPrice

  return roundingUpPrice(
    calculatePriceByPeriod(period, periodMultiplier, basePrice, settings) *
      (isPremium ? settings.telegramPremiumRatio : 1) *
      (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1) *
      userDiscount,
  )
}

/**
 * Calculate subscription cost based on period and user discount
 * @param params - Subscription parameters object
 * @returns Цена в Stars? Всегда целочисленная!
 */
export function calculateSubscriptionCostNoDiscount({
  isPremium,
  isTgProgramPartner,
  period,
  periodMultiplier,
  devicesCount,
  serversCount,
  premiumServersCount,
  trafficLimitGb,
  isAllBaseServers,
  isAllPremiumServers,
  isUnlimitTraffic,
  plan,
  settings,
}: {
  isPremium: boolean
  isTgProgramPartner: boolean
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  devicesCount: number
  serversCount: number
  premiumServersCount: number
  trafficLimitGb: number | null
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  isUnlimitTraffic: boolean
  plan: PlansInterface
  settings: SubscriptionCostSettings
}): number {
  // Для Триала и Трафик тарифа считаем сразу цену
  if (plan.key == PlansEnum.TRIAL || plan.key == PlansEnum.TRAFFIC) {
    if (trafficLimitGb == null || trafficLimitGb < 0) {
      throw new Error('The traffic must be greater than 0')
    }
    return roundingUpPrice(
      trafficLimitGb *
        roundingUpPrice(settings.trafficGbPriceStars / 30) *
        (isPremium ? settings.telegramPremiumRatio : 1) *
        (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1),
    )
  }

  // Для остальных кроме кастома, считаем цену
  if (plan.key !== PlansEnum.CUSTOM) {
    if (!plan.priceStars) {
      throw new Error('Plan price Stars is not defined')
    }
    return roundingUpPrice(
      calculatePriceByPeriod(
        period,
        periodMultiplier,
        plan.priceStars,
        settings,
      ) *
        (isPremium ? settings.telegramPremiumRatio : 1) *
        (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1),
    )
  }

  // Validate input parameters
  if (devicesCount < 0) {
    throw new Error('Devices count cannot be negative')
  }

  if (
    (serversCount < 0 && !isAllBaseServers) ||
    (premiumServersCount < 0 && !isAllPremiumServers)
  ) {
    throw new Error('Servers count cannot be negative')
  }

  if (
    (trafficLimitGb == null && !isUnlimitTraffic) ||
    (trafficLimitGb !== null && trafficLimitGb < 0 && !isUnlimitTraffic)
  ) {
    throw new Error('Traffic limit cannot be negative')
  }

  // Calculate device price
  const devicePrice = settings.devicesPriceStars * devicesCount

  // Calculate servers price
  const serversPrice = calculateServersPrice(
    isAllBaseServers,
    isAllPremiumServers,
    serversCount,
    settings,
  )

  // Calculate premium servers price
  const premiumServersPrice = calculatePremiumServersPrice(
    isAllPremiumServers,
    isAllBaseServers,
    premiumServersCount,
    settings,
  )

  // Calculate traffic price
  const trafficPrice =
    isUnlimitTraffic || !trafficLimitGb
      ? settings.unlimitTrafficPriceStars
      : trafficLimitGb * settings.trafficGbPriceStars

  // Calculate base price
  const basePrice =
    devicePrice + serversPrice + premiumServersPrice + trafficPrice

  return roundingUpPrice(
    calculatePriceByPeriod(
      period,
      periodMultiplier,
      basePrice,
      settings,
      true,
    ) *
      (isPremium ? settings.telegramPremiumRatio : 1) *
      (isTgProgramPartner ? settings.telegramPartnerProgramRatio : 1),
  )
}

export function percentDifference(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : Infinity // чтобы избежать деления на 0
  }
  return ((newValue - oldValue) / oldValue) * 100
}

export function calculateMbPay(
  cost: number,
  trafficGbPriceStars: number,
): number {
  if (cost <= 0) return 0
  return roundingUpPrice(
    (cost / roundingUpPrice(trafficGbPriceStars / 30)) * 1024,
  )
}

export function roundUp(value: number, decimals: number = 5) {
  const factor = Math.pow(10, decimals)
  return Math.ceil(value * factor) / factor
}

export function roundingUpPrice(n: number): number {
  const rounding = Math.ceil(n)
  return rounding < 1 ? 1 : rounding
}

/**
 * Calculate servers price based on configuration
 */
export function calculateServersPrice(
  isAllServers: boolean,
  isAllPremiumServers: boolean,
  serversCount: number,
  settings: SubscriptionCostSettings,
): number {
  if (isAllServers && !isAllPremiumServers) {
    return settings.allBaseServersPriceStars
  } else if (isAllServers && isAllPremiumServers) {
    return 0
  } else {
    return serversCount * settings.serversPriceStars
  }
}

/**
 * Calculate premium servers price based on configuration
 */
export function calculatePremiumServersPrice(
  isAllPremiumServers: boolean,
  isAllServers: boolean,
  premiumServersCount: number,
  settings: SubscriptionCostSettings,
): number {
  if (isAllServers && !isAllPremiumServers) {
    return 0
  } else if (isAllPremiumServers && isAllServers) {
    return settings.allPremiumServersPriceStars
  } else {
    return premiumServersCount * settings.premiumServersPriceStars
  }
}

/**
 * Calculate final price based on subscription period
 */
export function calculatePriceByPeriod(
  period: SubscriptionPeriodEnum,
  periodMultiplier: number,
  basePrice: number,
  settings: SubscriptionCostSettings,
  isNoDiscount: boolean = false,
): number {
  switch (period) {
    case SubscriptionPeriodEnum.HOUR:
      return (
        (basePrice / 30 / 24) * settings.hourRatioPayment * periodMultiplier
      )
    case SubscriptionPeriodEnum.DAY:
      return (basePrice / 30) * settings.dayRatioPayment * periodMultiplier
    case SubscriptionPeriodEnum.WEEK:
      return (basePrice / 4) * settings.weekRatioPayment * periodMultiplier
    case SubscriptionPeriodEnum.MONTH:
      return basePrice * periodMultiplier
    case SubscriptionPeriodEnum.THREE_MONTH:
      return (
        basePrice *
        3 *
        (isNoDiscount ? 1 : settings.threeMouthesRatioPayment) *
        periodMultiplier
      )
    case SubscriptionPeriodEnum.SIX_MONTH:
      return (
        basePrice *
        6 *
        (isNoDiscount ? 1 : settings.sixMouthesRatioPayment) *
        periodMultiplier
      )
    case SubscriptionPeriodEnum.YEAR:
      return (
        basePrice *
        12 *
        (isNoDiscount ? 1 : settings.oneYearRatioPayment) *
        periodMultiplier
      )
    case SubscriptionPeriodEnum.TWO_YEAR:
      return (
        basePrice *
        24 *
        (isNoDiscount ? 1 : settings.twoYearRatioPayment) *
        periodMultiplier
      )
    case SubscriptionPeriodEnum.THREE_YEAR:
      return (
        basePrice *
        36 *
        (isNoDiscount ? 1 : settings.threeYearRatioPayment) *
        periodMultiplier
      )
    case SubscriptionPeriodEnum.INDEFINITELY:
      return basePrice * settings.indefinitelyRatio
    case SubscriptionPeriodEnum.TRIAL:
      return basePrice
    case SubscriptionPeriodEnum.TRAFFIC:
      return basePrice
    default:
      throw new Error(`Некорректный период`)
  }
}

export function calculateDaysByPeriod(
  period: SubscriptionPeriodEnum,
  periodMultiplier: number,
): number | null {
  const baseDays = 30
  switch (period) {
    case SubscriptionPeriodEnum.HOUR:
      return (baseDays / 30 / 24) * periodMultiplier
    case SubscriptionPeriodEnum.DAY:
      return (baseDays / 30) * periodMultiplier
    case SubscriptionPeriodEnum.WEEK:
      return (baseDays / 4) * periodMultiplier
    case SubscriptionPeriodEnum.MONTH:
      return baseDays * periodMultiplier
    case SubscriptionPeriodEnum.THREE_MONTH:
      return baseDays * 3 * periodMultiplier
    case SubscriptionPeriodEnum.SIX_MONTH:
      return baseDays * 6 * periodMultiplier
    case SubscriptionPeriodEnum.YEAR:
      return baseDays * 12 * periodMultiplier
    case SubscriptionPeriodEnum.TWO_YEAR:
      return baseDays * 24 * periodMultiplier
    case SubscriptionPeriodEnum.THREE_YEAR:
      return baseDays * 36 * periodMultiplier
    case SubscriptionPeriodEnum.INDEFINITELY:
      return 9999
    case SubscriptionPeriodEnum.TRIAL:
      return null
    case SubscriptionPeriodEnum.TRAFFIC:
      return null
    default:
      return null
  }
}
