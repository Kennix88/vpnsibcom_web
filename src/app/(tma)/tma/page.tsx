'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import GreenCheck from '@app/app/_components/GreenCheck'
import { TonWalletConnect } from '@app/app/_components/ton/TonWalletConnect'
import TopBar from '@app/app/_components/TopBar'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4 items-center">
        <TopBar />
        <GreenCheck />
        <TonWalletConnect />
      </div>
    </TmaPage>
  )
}
