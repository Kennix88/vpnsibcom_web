'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import TopBar from '@app/app/_components/TopBar'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4">
        <TopBar />
      </div>
    </TmaPage>
  )
}
