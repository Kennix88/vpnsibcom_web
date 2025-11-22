'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AdsonarBanner from '@app/app/_components/ads/AdsonarBanner'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'

export default function Page() {
  return (
    <TmaPage back={false}>
      <TopBar />
      <div className="pt-4 px-4 pb-[80px] flex flex-col gap-2">
        <h1 className="text-2xl font-bold uppercase">Games</h1>
        <div className="text-lg font-bold font-mono">Soon...</div>
        <AdsonarBanner place={AdsPlaceEnum.BANNER_4} />
      </div>
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
