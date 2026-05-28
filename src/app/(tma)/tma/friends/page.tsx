'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import { useFullscreenAd } from '@app/app/_components/ads/useFullscreenAd'
import FriendsBonuses from '@app/app/_components/friends/FriendsBonuses'
import FriendsHero from '@app/app/_components/friends/FriendsHero'
import FriendsInviteButtons from '@app/app/_components/friends/FriendsInviteButtons'
import FriendsStatistics from '@app/app/_components/friends/FriendsStatistics'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import { authApiClient } from '@app/core/authApiClient'
import { useRefferlsStore } from '@app/store/referrals.store'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.2, 0, 0, 1] as const },
  },
}

export default function Page() {
  useFullscreenAd()
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
      {/* ── Ambient background blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}>
        {/* USDT green — top centre (echoes the referral/earn theme) */}
        <div
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            top: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgba(80,175,149,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Purple — mid right */}
        <div
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            top: '40%',
            right: -80,
            background:
              'radial-gradient(circle, rgba(195,166,255,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Cyan — bottom left */}
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            bottom: 100,
            left: -60,
            background:
              'radial-gradient(circle, rgba(106,227,255,0.05) 0%, transparent 70%)',
            filter: 'blur(38px)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <motion.div
        className="relative flex flex-col gap-5 pb-10 w-full"
        style={{ zIndex: 1 }}
        variants={stagger}
        initial="hidden"
        animate="visible">
        <motion.div variants={fadeUp}>
          <TopBar />
        </motion.div>

        {/* Hero — network tree + headline */}
        <motion.div variants={fadeUp}>
          <FriendsHero />
        </motion.div>

        {/* Level bonus cards */}
        <motion.div variants={fadeUp}>
          <FriendsBonuses />
        </motion.div>

        {/* Primary CTA — invite buttons */}
        <motion.div variants={fadeUp}>
          <FriendsInviteButtons />
        </motion.div>

        {/* Stats dashboard */}
        <motion.div variants={fadeUp}>
          <FriendsStatistics />
        </motion.div>

        {/* Social */}
        <motion.div variants={fadeUp} className="flex justify-center pt-2">
          <SocialButtons />
        </motion.div>
      </motion.div>
    </TmaPage>
  )
}
