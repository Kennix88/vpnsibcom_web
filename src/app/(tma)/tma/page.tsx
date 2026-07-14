'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { TaskAdsgramTask } from '@app/app/_components/ads/TaskAdsgram'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import { Extensions } from '@app/app/_components/Extensions'
import { PremiumCTA } from '@app/app/_components/PremiumCTA'
import SocialButtons from '@app/app/_components/SocialButtons'
import { Subscription } from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'
import dynamic from 'next/dynamic'

const TaskAdsReward = dynamic(
  () =>
    import('@app/app/_components/ads/TaskAdsReward').then(
      (mod) => mod.TaskAdsReward,
    ),
  {
    ssr: false,
  },
)

export default function Page() {
  useFullscreenAd()
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <PremiumCTA />
        <Subscription />
        <TaskAdsReward />
        <TaskAdsgramTask debug={process.env.NODE_ENV !== 'production'} />
        <Extensions />
        {/*<SupportBanner />*/}
        <br />
        <SocialButtons />
      </div>
    </TmaPage>
  )
}
