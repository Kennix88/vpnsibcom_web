import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Subscription from '@app/app/_components/subscription/Subscription'
import TopBar from '@app/app/_components/TopBar'

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
    </TmaPage>
  )
}
