'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import { PremiumCTA } from '@app/app/_components/PremiumCTA'
import SocialButtons from '@app/app/_components/SocialButtons'
import { Subscription } from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'
import { Users2 } from 'lucide-react'
import { SectionHeading } from './earning/_components/SectionHeading'

export default function Page() {
  useFullscreenAd()
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <PremiumCTA />
        <Subscription />

        {/*<SupportBanner />*/}
        <br />
        <div className="flex flex-col gap-2.5">
          <SectionHeading
            icon={<Users2 size={14} />}
            title="Сообщество"
            hint="Будь на связи с VPNsib"
          />
          <SocialButtons />
        </div>
      </div>
    </TmaPage>
  )
}
