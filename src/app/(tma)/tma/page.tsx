'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { FreePlanActivated } from '@app/app/_components/FreePlanAtivated'
import GreenCheck from '@app/app/_components/GreenCheck'
import SocialButtons from '@app/app/_components/SocialButtons'
import { Subscriptions } from '@app/app/_components/Subscriptions'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <GreenCheck />
        <FreePlanActivated />
        <Subscriptions />
        <br />
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
