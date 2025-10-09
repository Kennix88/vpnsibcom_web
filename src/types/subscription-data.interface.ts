import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { PlansInterface } from './plans.interface'
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
  allBaseServersPriceStars: number
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
  telegramPartnerProgramRatio: number
  subscriptions: SubscriptionDataInterface[]
}

export interface SubscriptionDataInterface {
  id: string
  name: string
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  plan: PlansInterface
  isActive: boolean
  isAutoRenewal: boolean
  nextRenewalStars?: number
  devicesCount: number
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  trafficLimitGb?: number
  isUnlimitTraffic: boolean
  trafficReset: TrafficResetEnum

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

  announce?: string
}

export interface MarzbanResponseInterface {
  headers: {
    'content-disposition': string
    'content-type': string
  }
  body: any
}

export interface CreateSubscriptionDataInterface {
  planKey: PlansEnum
  method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC'
  name: string
  period: SubscriptionPeriodEnum
  periodMultiplier: number
  isAutoRenewal?: boolean
  devicesCount: number
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  trafficReset: TrafficResetEnum
  servers?: string[]
  trafficLimitGb?: number
  isUnlimitTraffic: boolean
}
