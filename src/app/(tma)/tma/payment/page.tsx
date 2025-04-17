'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'

export default function Page() {
  return (
    <TmaPage back={true}>
      <div className="pt-4 px-4 pb-[80px] flex flex-col gap-4 text-[#fafafa]">
        <h1>Payment</h1>
      </div>
    </TmaPage>
  )
}
