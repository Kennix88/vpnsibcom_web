import Subscription from '@app/app/_components/subscription/Subscription'

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <Subscription token={token} isToken={true} />
}
