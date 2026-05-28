'use client'
import { TmaPage } from '@app/app/(tma)/_components/TmaPage'
import Payments from '@app/app/_components/payments/Payments'
import SocialButtons from '@app/app/_components/SocialButtons'
import TopBar from '@app/app/_components/TopBar'
import { authApiClient } from '@app/core/authApiClient'
import { usePaymentMethodsStore } from '@app/store/payment-methods.store'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
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
  const t = useTranslations('billing.payment')
  const { setUser } = useUserStore()
  const { setMethods } = usePaymentMethodsStore()

  useEffect(() => {
    const getMethods = async () => {
      try {
        const updated = await authApiClient.getPaymentMethods(true)
        setMethods(updated.methods)
        setUser(updated.user)
      } catch {
        toast.error('Error updating data')
      }
    }
    getMethods()
  }, [setMethods, setUser])

  return (
    <TmaPage back={true}>
      {/* Ambient background blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 360,
            height: 360,
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgba(254,189,4,0.06) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            bottom: 120,
            right: -80,
            background:
              'radial-gradient(circle, rgba(0,136,204,0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            bottom: 200,
            left: -60,
            background:
              'radial-gradient(circle, rgba(195,166,255,0.05) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        className="relative flex flex-col gap-5 pb-6"
        style={{ zIndex: 1 }}
        variants={stagger}
        initial="hidden"
        animate="visible">
        {/* Top bar */}
        <motion.div variants={fadeUp}>
          <TopBar />
        </motion.div>

        {/* Page header */}
        <motion.div variants={fadeUp} className="flex flex-col gap-1 mt-1">
          <h1 className="flex items-center gap-2">
            <span
              className="block w-2 h-2 rounded-full"
              style={{ background: 'var(--cta)' }}
            />
            <span
              className="text-2xl font-bold font-mono leading-tight"
              style={{ color: 'var(--cta)', opacity: 0.8 }}>
              {t('title')}
            </span>
          </h1>
        </motion.div>

        {/* Payment form */}
        <motion.div variants={fadeUp}>
          <Payments />
        </motion.div>

        {/* Social links */}
        <motion.div variants={fadeUp} className="flex justify-center pt-2">
          <SocialButtons />
        </motion.div>
      </motion.div>
    </TmaPage>
  )
}
