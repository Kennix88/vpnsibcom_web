import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'

export interface SubscriptionResponseInterface {
  telegramPremiumRatio: number
  devicesPriceStars: number
  serversPriceStars: number
  premiumServersPriceStars: number
  allServersPriceStars: number
  allPremiumServersPriceStars: number
  trafficGbPriceStars: number
  unlimitTrafficPriceStars: number
  hourRatioPayment: number
  dayRatioPayment: number
  weekRatioPayment: number
  threeMouthesRatioPayment: number
  sixMouthesRatioPayment: number
  oneYearRatioPayment: number
  twoYearRatioPayment: number
  threeYearRatioPayment: number
  indefinitelyRatio: number
  fixedPriceStars: number
  subscriptions: SubscriptionDataInterface[]
}

export interface SubscriptionDataInterface {
  id: string
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  isActive: boolean
  isAutoRenewal: boolean
  nextRenewalStars?: number
  isFixedPrice: boolean
  fixedPriceStars?: number
  devicesCount: number
  isAllServers: boolean
  isAllPremiumServers: boolean
  trafficLimitGb?: number
  isUnlimitTraffic: boolean

  lastUserAgent?: string
  dataLimit?: number
  usedTraffic: number
  lifeTimeUsedTraffic: number
  links: string[]

  servers: ServerDataInterface[]

  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
  onlineAt?: Date

  token: string
  subscriptionUrl: string
}

export interface ServerDataInterface {
  code: string
  name: string
  flagKey: string
  flagEmoji: string
  network: number
  isActive: boolean
  isPremium: boolean
}
