'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import FriendsBonuses from '@app/app/_components/friends/FriendsBonuses'
import FriendsInviteButtons from '@app/app/_components/friends/FriendsInviteButtons'
import FriendsList from '@app/app/_components/friends/FriendsList'
import FriendsStatistics from '@app/app/_components/friends/FriendsStatistics'
import FriendsTitle from '@app/app/_components/friends/FriendsTitle'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import Version from '@app/app/_components/Version'
import { authApiClient } from '@app/core/authApiClient'
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
  }, [setUser, setReferralsData])

  return (
    <TmaPage back={false}>
      <TopBar />
      <div className="flex flex-row gap-4 my-4 flex-wrap justify-center">
        <FriendsTitle />
        <FriendsBonuses />
        <FriendsInviteButtons />
        <FriendsStatistics />
        <FriendsList />
      </div>
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <Version />
      </div>
    </TmaPage>
  )
}
