import { AdsNetworkEnum } from './ads-network.enum'
import { AdsPlaceEnum } from './ads-place.enum'
import { AdsTaskTypeEnum } from './ads-task-type.enum'

export interface AdsResInterface {
  type: AdsTaskTypeEnum
  place: AdsPlaceEnum
  network: AdsNetworkEnum
  blockId: string
  time: Date
  rewards: AdsTaskRewardsInterface
  limit: number
  verifyKey: string
}

export interface AdsTaskRewardsInterface {
  traffic: number
  stars: number
  tickets: number
}
