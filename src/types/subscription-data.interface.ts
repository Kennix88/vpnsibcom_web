import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { ServerDataInterface } from './servers-data.interface'

export interface GetSubscriptionConfigResponseInterface {
  subscription: SubscriptionDataInterface
  marzbanSubRes?: MarzbanResponseInterface
}

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
  baseServersCount: number
  premiumServersCount: number

  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
  onlineAt?: Date

  token: string
  subscriptionUrl: string
}

export interface MarzbanResponseInterface {
  headers: {
    'content-disposition': string
    'content-type': string
  }
  body: any
}

export interface CreateSubscriptionDataInterface {
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  isAutoRenewal: boolean
  isFixedPrice: boolean
  devicesCount: number
  isAllServers: boolean
  isAllPremiumServers: boolean
  servers: string[]
  trafficLimitGb: number
  isUnlimitTraffic: boolean
}
