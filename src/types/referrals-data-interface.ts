export interface ReferralsDataInterface {
  inviteBotUrl: string
  inviteBotTgDeeplink: string
  inviteTmaUrl: string
  inviteTmaTgDeeplink: string
  inviteAppUrl: string
  inviteAppTgDeeplink: string
  lvl1IsActivated: number
  lvl2IsActivated: number
  lvl3IsActivated: number
  lvl1IsActivatedPremium: number
  lvl2IsActivatedPremium: number
  lvl3IsActivatedPremium: number
  lvl1IsActivatedBase: number
  lvl2IsActivatedBase: number
  lvl3IsActivatedBase: number
  lvl1TotalPaymentsRewarded: number
  lvl2TotalPaymentsRewarded: number
  lvl3TotalPaymentsRewarded: number
  lvl1TotalWithdrawalsRewarded: number
  lvl2TotalWithdrawalsRewarded: number
  lvl3TotalWithdrawalsRewarded: number
  lvl1Percent: number
  lvl2Percent: number
  lvl3Percent: number
  inviteReward: number
  invitePremiumReward: number
  lvl1Count: number
  lvl2Count: number
  lvl3Count: number
  lvl1List: ReferralDataInterface[]
  lvl2List: ReferralDataInterface[]
  lvl3List: ReferralDataInterface[]
}

export interface ReferralDataInterface {
  id: string
  isActivated: boolean
  isPremium: boolean
  fullName: string
  username?: string
  photoUrl?: string
  totalPaymentsRewarded: number
  totalWithdrawalsRewarded: number
}
