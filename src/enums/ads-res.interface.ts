import { AdsNetworkEnum } from './ads-network.enum'
import { AdsPlaceEnum } from './ads-place.enum'
import { AdsTypeEnum } from './ads-type.enum'

export interface AdsResInterface {
  isNoAds: boolean
  ad?: AdsDataInterface
}

export interface AdsDataInterface {
  type: AdsTypeEnum
  place: AdsPlaceEnum
  network: AdsNetworkEnum
  time: Date
  blockId: string
  verifyKey: string
}

export interface TaskRewardResInterface {
  amount: number
}
