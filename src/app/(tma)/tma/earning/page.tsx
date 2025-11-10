'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'

export default function Page() {
  return (
    <TmaPage back={false}>
      <TopBar />
      <div className="pt-4 px-4  flex flex-col gap-4">
        <h1 className="text-2xl font-bold uppercase">Earning</h1>
        <div className="text-lg font-bold font-mono">Soon...</div>
      </div>
      <div className="flex flex-col gap-4 mt-4 pb-[80px]">
        {/* <ShowAdButton />
        <AsdgramTask blockId="task-17144" /> */}
      </div>
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
