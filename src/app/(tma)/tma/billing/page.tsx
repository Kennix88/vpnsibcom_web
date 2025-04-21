'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import BillingTitle from '@app/app/_components/billing/BillingTitle'
import BillingWallet from '@app/app/_components/billing/BillingWallet'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-row gap-4 flex-wrap justify-center">
        <BillingTitle />
        <BillingWallet />
      </div>
    </TmaPage>
  )
}
