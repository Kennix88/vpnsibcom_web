'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import SubscriptionCard from './subscription/SubscriptionCard'

/* ─── Skeleton card ──────────────────────────────────────────────── */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      {/* Header skeleton */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="w-8 h-8 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <div className="flex-1 space-y-1.5">
          <div
            className="h-3 rounded-lg animate-pulse"
            style={{ background: 'rgba(255,255,255,0.07)', width: '55%' }}
          />
          <div
            className="h-2.5 rounded-lg animate-pulse"
            style={{ background: 'rgba(255,255,255,0.05)', width: '30%' }}
          />
        </div>
        <div
          className="w-7 h-7 rounded-full animate-pulse"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
      </div>
      {/* Body skeleton */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg animate-pulse"
              style={{
                background: 'rgba(255,255,255,0.05)',
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
        <div
          className="w-20 h-8 rounded-xl animate-pulse"
          style={{ background: 'rgba(195,166,255,0.08)' }}
        />
      </div>
    </motion.div>
  )
}

/* ─── Component ──────────────────────────────────────────────────── */
export function Subscriptions() {
  const t = useTranslations('subscriptions')
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authApiClient.getSubscriptons()
      setSubscriptions(response.subscriptions)
    } catch (err) {
      console.error('Failed to load subscriptions', err)
    } finally {
      setLoading(false)
    }
  }, [setSubscriptions])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  if (!user) return null

  const count = subscriptions?.subscriptions?.length ?? 0
  const limit = user.limitSubscriptions ?? 0

  return (
    <div className="flex flex-col gap-3 w-full font-mono">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: 'var(--on-background)', opacity: 0.42 }}>
            {t('yourSubscriptions')}
          </span>
        </div>
        {/* Count badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background:
              count >= limit
                ? 'rgba(255,107,102,0.1)'
                : 'rgba(195,166,255,0.1)',
            color: count >= limit ? 'var(--error)' : 'var(--primary)',
            border: `1px solid ${count >= limit ? 'rgba(255,107,102,0.2)' : 'rgba(195,166,255,0.2)'}`,
          }}>
          <Layers size={11} aria-hidden />
          {count}/{limit}
        </div>
      </div>

      {/* Skeletons */}
      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard delay={0} />
          <SkeletonCard delay={0.08} />
        </div>
      )}

      {/* List */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {count === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-10 rounded-2xl"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(195,166,255,0.1)',
                  color: 'var(--primary)',
                }}>
                <Layers size={22} />
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--on-background)', opacity: 0.45 }}>
                {t('noSubscriptions')}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {subscriptions!.subscriptions.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.32,
                    ease: [0.2, 0, 0, 1],
                  }}>
                  <SubscriptionCard
                    subscription={sub}
                    isList={true}
                    isPublic={false}
                    isDefaultOpen={i === 0}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
