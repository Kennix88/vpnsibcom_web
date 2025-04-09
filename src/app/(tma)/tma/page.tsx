'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { initData } from '@telegram-apps/sdk-react'
import { useTonWallet } from '@tonconnect/ui-react'

export default function Page() {
  const wallet = useTonWallet()
  const user = initData.user()

  return (
    <TmaPage back={false}>
      <div className="pt-4 px-4 pb-[80px] flex flex-col gap-4 text-[#fafafa]">
        <div className="text-lg font-bold">Hello, {user?.id}</div>
        <div className="text-sm text-gray-500">
          Wallet: {wallet ? 'yes' : 'no'}
        </div>
      </div>
    </TmaPage>
  )
}
