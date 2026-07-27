'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import { PremiumCTA } from '@app/app/_components/PremiumCTA'
import { Subscription } from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'

export default function Page() {
  useFullscreenAd()
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <PremiumCTA />
        <Subscription />
      </div>
    </TmaPage>
  )
}
