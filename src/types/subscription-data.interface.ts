import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'

export interface SubscriptionDataInterface {
  priceSubscriptionStars: number
  hourRatioPayment: number
  dayRatioPayment: number
  threeMouthesRatioPayment: number
  sixMouthesRatioPayment: number
  oneYearRatioPayment: number
  twoYearRatioPayment: number
  threeYearRatioPayment: number
  list: SubscriptionDataListInterface[]
}

export interface SubscriptionDataListInterface {
  id: string
  period: SubscriptionPeriodEnum
  isActive: boolean
  isAutoRenewal: boolean
  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
  subscriptionUrl: string
}
