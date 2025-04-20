'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import FriendsBonuses from '@app/app/_components/friends/FriendsBonuses'
import FriendsInviteButtons from '@app/app/_components/friends/FriendsInviteButtons'
import FriendsList from '@app/app/_components/friends/FriendsList'
import FriendsStatistics from '@app/app/_components/friends/FriendsStatistics'
import FriendsTitle from '@app/app/_components/friends/FriendsTitle'
import { authApiClient } from '@app/core/apiClient'
import { useRefferlsStore } from '@app/store/referrals.store'
import { useUserStore } from '@app/store/user.store'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

export default function Page() {
  const { setReferralsData } = useRefferlsStore()
  const { setUser } = useUserStore()

  useEffect(() => {
    const getReferrals = async () => {
      try {
        const updated = await authApiClient.getReferrals()
        setUser(updated.user)
        setReferralsData(updated.referrals)
      } catch {
        toast.error('Error updating data')
      }
    }
    getReferrals()
  }, [])

  return (
    <TmaPage back={false}>
      <div className="flex flex-row gap-4 flex-wrap justify-center">
        <FriendsTitle />
        <FriendsBonuses />
        <FriendsInviteButtons />
        <FriendsStatistics />
        <FriendsList />
      </div>
    </TmaPage>
  )
}
