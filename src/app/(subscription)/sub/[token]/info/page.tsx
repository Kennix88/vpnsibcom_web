import Subscription from '@app/app/_components/subscription/Subscription'

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <div className="w-full flex justify-center">
      <div className="max-w-md w-full flex flex-col items-stretch ">
        <Subscription token={token} isToken={true} />
      </div>
    </div>
  )
}
