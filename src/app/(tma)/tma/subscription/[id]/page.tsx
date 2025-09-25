import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import SocialButtons from '@app/app/_components/SocialButtons'
import Subscription from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'

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
      <SocialButtons />
      <Version />
    </TmaPage>
  )
}
