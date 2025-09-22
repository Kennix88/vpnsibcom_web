'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import TopBar from '@app/app/_components/TopBar'

export default function Page() {
  return (
    <TmaPage back={false}>
      <TopBar />
      <div className="pt-4 px-4 pb-[80px] flex flex-col gap-2">
        <h1 className="text-2xl font-bold uppercase">Games</h1>
        <div className="text-lg font-bold font-mono">Soon...</div>
      </div>
    </TmaPage>
  )
}
