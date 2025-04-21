'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export default function WithdrawalSwitch({ size = 1 }: { size?: number }) {
  const { user, setUser } = useUserStore()
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.balance?.isUseWithdrawalBalance != null) {
      setIsEnabled(user.balance.isUseWithdrawalBalance)
    }
  }, [user])

  const toggle = async () => {
    setLoading(true)
    try {
      const updated =
        await authApiClient.updateWithdrawalBalanceUsage(!isEnabled)
      setUser(updated)
      setIsEnabled(!isEnabled)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      toast.error('Error during the update')
    } finally {
      setLoading(false)
    }
  }

  const trackWidth = 64 * size
  const trackHeight = 32 * size
  const thumbSize = 24 * size
  const padding = (trackHeight - thumbSize) / 2
  const translateX = trackWidth - thumbSize - padding * 2

  return (
    <button
      disabled={loading}
      onClick={toggle}
      className="relative inline-flex items-center rounded-full transition-colors"
      style={{
        width: trackWidth,
        height: trackHeight,
        padding: padding,
        backgroundColor: isEnabled
          ? 'var(--success-container)'
          : 'var(--surface-container-high)',
        border: '1px solid var(--outline)',
      }}>
      <motion.div
        className="rounded-full shadow-md"
        style={{
          width: thumbSize,
          height: thumbSize,
          backgroundColor: isEnabled
            ? 'var(--on-success-container)'
            : 'var(--on-surface)',
        }}
        layout
        animate={{ x: isEnabled ? translateX : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}
