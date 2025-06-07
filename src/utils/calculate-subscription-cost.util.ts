import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'

/**
 * Subscription cost calculation settings interface
 */
interface SubscriptionCostSettings {
  devicesPriceStars: number
  serversPriceStars: number
  premiumServersPriceStars: number
  unlimitTrafficPriceStars: number
  trafficGbPriceStars: number
  allServersPriceStars: number
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
}

/**
 * Subscription cost calculation parameters
 */
interface SubscriptionCostParams {
  isPremium: boolean
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  devicesCount: number
  serversCount: number
  premiumServersCount: number
  trafficLimitGb: number
  isAllServers: boolean
  isAllPremiumServers: boolean
  isUnlimitTraffic: boolean
  userDiscount: number
  settings: SubscriptionCostSettings
}

/**
 * Calculate subscription cost based on period and user discount
 * @param params - Subscription parameters object
 * @returns Cost in Stars
 */
export function calculateSubscriptionCost(
  params: SubscriptionCostParams,
): number {
  const {
    period,
    periodMultiplier,
    isPremium,
    devicesCount,
    serversCount = 0,
    premiumServersCount = 0,
    trafficLimitGb = 0,
    isAllServers,
    isAllPremiumServers,
    isUnlimitTraffic,
    userDiscount = 1,
    settings,
  } = params

  // Validate input parameters
  if (devicesCount < 0) {
    throw new Error('Devices count cannot be negative')
  }

  if (
    (serversCount < 0 && !isAllServers) ||
    (premiumServersCount < 0 && !isAllPremiumServers)
  ) {
    throw new Error('Servers count cannot be negative')
  }

  if (trafficLimitGb < 0 && !isUnlimitTraffic) {
    throw new Error('Traffic limit cannot be negative')
  }

  if (userDiscount <= 0 || userDiscount > 1) {
    console.warn(
      `Unusual user discount value: ${userDiscount}, expected between 0-1`,
    )
  }

  // Calculate device price
  const devicePrice = settings.devicesPriceStars * devicesCount

  // Calculate servers price
  const serversPrice = calculateServersPrice(
    isAllServers,
    isAllPremiumServers,
    serversCount,
    settings,
  )

  // Calculate premium servers price
  const premiumServersPrice = calculatePremiumServersPrice(
    isAllPremiumServers,
    isAllServers,
    premiumServersCount,
    settings,
  )

  // Calculate traffic price
  const trafficPrice = isUnlimitTraffic
    ? settings.unlimitTrafficPriceStars * devicesCount
    : trafficLimitGb * settings.trafficGbPriceStars

  // Apply premium ratio if applicable
  const premiumRatio = isPremium ? settings.telegramPremiumRatio : 1

  // Calculate base price
  const basePrice =
    (devicePrice + serversPrice + premiumServersPrice + trafficPrice) *
    premiumRatio

  // Calculate final price based on subscription period
  const finalPrice = calculatePriceByPeriod(
    period,
    periodMultiplier,
    basePrice,
    userDiscount,
    settings,
  )

  return finalPrice
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
    return serversCount * settings.serversPriceStars
  } else if (isAllServers && isAllPremiumServers) {
    return serversCount * settings.serversPriceStars
  } else {
    return 0
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
  if (isAllPremiumServers && isAllServers) {
    return premiumServersCount * settings.premiumServersPriceStars
  } else {
    return 0
  }
}

/**
 * Calculate final price based on subscription period
 */
function calculatePriceByPeriod(
  period: SubscriptionPeriodEnum,
  periodMultiplier: number,
  basePrice: number,
  userDiscount: number,
  settings: SubscriptionCostSettings,
): number {
  let price: number

  switch (period) {
    case SubscriptionPeriodEnum.HOUR:
      price =
        (basePrice / 30 / 24) *
        settings.hourRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.DAY:
      price =
        (basePrice / 30) *
        settings.dayRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.WEEK:
      price =
        (basePrice / 4) *
        settings.weekRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.MONTH:
      price = basePrice * userDiscount * periodMultiplier
      break
    case SubscriptionPeriodEnum.THREE_MONTH:
      price =
        basePrice *
        3 *
        settings.threeMouthesRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.SIX_MONTH:
      price =
        basePrice *
        6 *
        settings.sixMouthesRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.YEAR:
      price =
        basePrice *
        12 *
        settings.oneYearRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.TWO_YEAR:
      price =
        basePrice *
        24 *
        settings.twoYearRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.THREE_YEAR:
      price =
        basePrice *
        36 *
        settings.threeYearRatioPayment *
        userDiscount *
        periodMultiplier
      break
    case SubscriptionPeriodEnum.INDEFINITELY:
      price = basePrice * settings.indefinitelyRatio * userDiscount
      break
    case SubscriptionPeriodEnum.TRIAL:
      return 1 // Trial period is free (minimum 1 Star)
    default:
      price = basePrice * userDiscount * periodMultiplier
  }

  // Ensure minimum price is 0.01 Stars
  return Number((price < 0.01 ? 0.01 : price).toFixed(2))
}
