'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'

import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'

import SubscriptionElement from './subscription/SubscriptionElement'

/**
 * Component for displaying user subscriptions
 * @returns JSX.Element
 */
export function Subscriptions() {
  const t = useTranslations('subscriptions')

  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)

  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  const fetchSubscriptions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await authApiClient.getSubscriptons()
      setSubscriptions(response.subscriptions)
      // setOpenSub(response.subscriptions.subscriptions[0].id)
      console.log('Subscriptions loaded successfully')
    } catch (error) {
      console.error('Failed to load subscriptions', error)
      // toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [setSubscriptions])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  if (!user) return null

  const isDisabledAddSub =
    subscriptions &&
    subscriptions.subscriptions &&
    subscriptions.subscriptions.length < user.limitSubscriptions

  return (
    <div className="flex flex-col gap-4 items-center font-extralight font-mono max-w-[600px] w-full">
      <div className="pl-4 opacity-70 flex flex-row gap-2 items-center justify-between w-full pb-2 border-b border-[var(--outline)]">
        <span>{t('yourSubscriptions')}</span>
        <div className="flex gap-2 items-center">
          <span className="text-sm">
            {subscriptions && subscriptions.subscriptions
              ? subscriptions.subscriptions.length
              : 0}
            /{user?.limitSubscriptions || 0}
          </span>

          {isDisabledAddSub && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center">
              <Link
                href={`${url}/add-subscription`}
                className="flex items-center justify-center w-7 h-7 gap-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)]  transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                <FiPlus size={18} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Loader - Redesigned to match subscription items */}
      {loading && (
        <div className="flex flex-col gap-2 w-full">
          {[1, 2].map((item) => (
            <motion.div
              key={`skeleton-${item}`}
              className="relative bg-[var(--surface-container-lowest)] rounded-md overflow-hidden">
              {/* Skeleton header */}
              <div className="animate-pulse h-10 bg-[var(--primary)] w-full rounded-t-md flex items-center px-4 py-2">
                <div className="h-4 bg-[var(--on-primary)] opacity-30 rounded w-3/4"></div>
              </div>

              {/* Skeleton body */}
              <div className="flex flex-row flex-wrap gap-2 px-2 py-2 items-center justify-between">
                <div className="animate-pulse h-6 bg-[var(--primary-container)] opacity-30 rounded w-1/3"></div>
                <div className="animate-pulse h-5 bg-[var(--primary-container)] opacity-30 rounded w-1/4"></div>
              </div>

              {/* Skeleton footer */}
              <div className="flex flex-wrap justify-between items-center px-2 py-2 border-t border-[var(--outline)]">
                <div className="flex gap-2 items-center">
                  <div className="animate-pulse h-8 w-8 bg-[var(--primary-container)] opacity-30 rounded-md"></div>
                  <div className="h-4 w-[1px] bg-[var(--outline)]"></div>
                  <div className="animate-pulse h-8 w-8 bg-[var(--primary-container)] opacity-30 rounded-md"></div>
                  <div className="h-4 w-[1px] bg-[var(--outline)]"></div>
                  <div className="animate-pulse h-8 w-8 bg-[var(--primary-container)] opacity-30 rounded-md"></div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="animate-pulse h-8 w-8 bg-[var(--primary-container)] opacity-30 rounded-md"></div>
                  <div className="animate-pulse h-8 w-8 bg-[var(--primary-container)] opacity-30 rounded-md"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Subscriptions List */}
      {!loading && (
        <div className="flex flex-col gap-4 w-full">
          <AnimatePresence>
            {subscriptions?.subscriptions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4">
                {t('noSubscriptions')}
              </motion.div>
            ) : (
              <>
                {subscriptions?.subscriptions.map((subscription) => (
                  <SubscriptionElement
                    key={subscription.id}
                    subscription={subscription}
                    isList={true}
                    isPublic={false}
                    isDefaultOpen={false}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      )}
      {isDisabledAddSub && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center">
          <Link
            href={`${url}/add-subscription`}
            className="flex items-center justify-center px-4 py-2 gap-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
            <FiPlus size={18} />
            <span>{t('addSubscription')}</span>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
