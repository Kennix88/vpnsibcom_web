import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'

export interface SubscriptionDataInterface {
  id: string
  period: SubscriptionPeriodEnum
  isActive: boolean
  isAutoRenewal: boolean
  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
  subscriptionUrl: string
}
