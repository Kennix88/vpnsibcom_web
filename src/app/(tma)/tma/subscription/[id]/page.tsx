import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import AdsonarBanner from '@app/app/_components/ads/AdsonarBanner'
import SocialButtons from '@app/app/_components/SocialButtons'
import Subscription from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { AdsPlaceEnum } from '@app/enums/ads-place.enum'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <TmaPage back={true}>
      <TopBar />
      <Subscription token={id} isToken={false} />
      <AdsonarBanner place={AdsPlaceEnum.BANNER_7} />
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
