'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import FriendsTitle from '@app/app/_components/friends/FriendsTitle'

export default function Page() {
  return (
    <TmaPage back={false}>
      <div className="flex flex-col gap-4">
        <FriendsTitle />
      </div>
    </TmaPage>
  )
}
