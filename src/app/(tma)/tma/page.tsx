'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { TaskAdsReward } from '@app/app/_components/ads/TaskAdsReward'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import { FreePlanActivated } from '@app/app/_components/FreePlanAtivated'
import GreenCheck from '@app/app/_components/GreenCheck'
import SocialButtons from '@app/app/_components/SocialButtons'
import { Subscriptions } from '@app/app/_components/Subscriptions'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'

export default function Page() {
  useFullscreenAd()
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <GreenCheck />
        <FreePlanActivated />
        <TaskAdsReward />

        <Subscriptions />
        <br />
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
