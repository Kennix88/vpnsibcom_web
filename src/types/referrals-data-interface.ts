export interface ReferralsDataInterface {
  lvl1TotalUsdtRewarded: number
  lvl2TotalUsdtRewarded: number
  lvl3TotalUsdtRewarded: number
  lvl1Percent: number
  lvl2Percent: number
  lvl3Percent: number
  lvl1Count: number
  lvl2Count: number
  lvl3Count: number
}

export interface ReferralDataInterface {
  id: string
  isActivated: boolean
  isPremium: boolean
  fullName: string
  username?: string
  photoUrl?: string
  totalUsdtRewarded: number
}
