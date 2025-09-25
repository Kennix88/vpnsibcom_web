import SocialButtons from '@app/app/_components/SocialButtons'
import Subscription from '@app/app/_components/subscription/Subscription'
import Version from '@app/app/_components/Version'

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <div className="flex flex-col gap-4 items-center font-extralight font-mono w-full">
      <Subscription token={token} isToken={true} />
      <SocialButtons />
      <Version />
    </div>
  )
}
