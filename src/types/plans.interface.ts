import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansEnum } from '@app/enums/plans.enum'

export interface PlansInterface {
  key: PlansEnum
  name: string
  priceStars?: number
  isCustom: boolean
  devicesCount: number
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  trafficLimitGb?: number
  isUnlimitTraffic: boolean
  serversSelectType: PlansServersSelectTypeEnum
}

export interface PlansResponseDataInterface {
  plans: PlansInterface[]
}
