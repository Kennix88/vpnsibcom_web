'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AdsonarBanner from '@app/app/_components/ads/AdsonarBanner'
import { FreePlanActivated } from '@app/app/_components/FreePlanAtivated'
import GreenCheck from '@app/app/_components/GreenCheck'
import SocialButtons from '@app/app/_components/SocialButtons'
import { Subscriptions } from '@app/app/_components/Subscriptions'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <GreenCheck />
        <AdsonarBanner place={AdsPlaceEnum.BANNER} />
        <FreePlanActivated />
        <Subscriptions />
        <br />
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
