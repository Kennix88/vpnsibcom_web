import { TmaPage } from '@app/app/(tma)/_components/TmaPage'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <TmaPage back={true}>
      <div>Subscription: {id}</div>
    </TmaPage>
  )
}
