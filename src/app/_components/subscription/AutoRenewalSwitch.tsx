'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'react-toastify'

export default function AutoRenewalSwitch({
  subscription,
  size = 1,
}: {
  subscription: SubscriptionDataInterface
  size?: number
}) {
  const t = useTranslations('subscriptions')
  const [isEnabled, setIsEnabled] = useState(subscription.isAutoRenewal)
  const [loading, setLoading] = useState(false)
  const { setSubscriptions } = useSubscriptionsStore()

  /**
   * Toggles auto-renewal status for a subscription
   * @param subscription - Subscription data
   * @returns Promise<void>
   */
  const toggleAutoRenewal = async (subscriptionId: string) => {
    setLoading(true)
    try {
      const data =
        await authApiClient.toggleAutoRenewalSubscription(subscriptionId)

      setSubscriptions(data.subscriptions)
      setIsEnabled(!isEnabled)
      toast.success(
        subscription.isAutoRenewal
          ? t('autoRenewalDisabled')
          : t('autoRenewalEnabled'),
      )
    } catch {
      toast.error(
        subscription.isAutoRenewal
          ? t('errors.disableAutoRenewalFailed')
          : t('errors.enableAutoRenewalFailed'),
      )
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
      onClick={() => toggleAutoRenewal(subscription.id)}
      className="relative inline-flex items-center rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
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
