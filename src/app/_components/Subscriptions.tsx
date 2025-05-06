'use client'

import { authApiClient } from '@app/core/authApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataListInterface } from '@app/types/subscription-data.interface'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaArrowsRotate, FaClockRotateLeft, FaCopy } from 'react-icons/fa6'
import { FiExternalLink, FiPlus } from 'react-icons/fi'
import { IoCheckmarkCircle, IoClose, IoCloseCircle } from 'react-icons/io5'
import { MdAutoMode, MdRotateRight } from 'react-icons/md'
import { SiAdobeindesign } from 'react-icons/si'
import { TbPlugConnected } from 'react-icons/tb'
import TgStar from './TgStar'

/**
 * Component for displaying user subscriptions
 * @returns JSX.Element
 */
export function Subscriptions() {
  const t = useTranslations('subscriptions')
  const copyToClipboard = useCopyToClipboard()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [updatingAutoRenewal, setUpdatingAutoRenewal] = useState<string | null>(
    null,
  )
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  /**
   * Fetches subscription data from the API
   * @returns Promise<void>
   */
  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await authApiClient.getSubscriptons()
      setSubscriptions(response.subscriptions)
      console.log('Subscriptions loaded successfully')
    } catch (error) {
      console.error('Failed to load subscriptions', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data on initial render
  useEffect(() => {
    fetchSubscriptions()
  }, [])

  /**
   * Formats subscription period to human-readable string
   * @param period - Subscription period enum value
   * @returns Formatted period string
   */
  const formatPeriod = (period: SubscriptionPeriodEnum): string => {
    switch (period) {
      case SubscriptionPeriodEnum.TRIAL:
        return t('periods.trial')
      case SubscriptionPeriodEnum.HOUR:
        return t('periods.hour')
      case SubscriptionPeriodEnum.DAY:
        return t('periods.day')
      case SubscriptionPeriodEnum.MONTH:
        return t('periods.month')
      case SubscriptionPeriodEnum.THREE_MONTH:
        return t('periods.threeMonth')
      case SubscriptionPeriodEnum.SIX_MONTH:
        return t('periods.sixMonth')
      case SubscriptionPeriodEnum.YEAR:
        return t('periods.year')
      case SubscriptionPeriodEnum.TWO_YEAR:
        return t('periods.twoYear')
      case SubscriptionPeriodEnum.THREE_YEAR:
        return t('periods.threeYear')
      default:
        return period
    }
  }

  /**
   * Formats expiration date to human-readable string
   * @param date - Expiration date
   * @returns Formatted date string
   */
  const formatExpiredDate = (date: Date): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ru })
  }

  /**
   * Toggles auto-renewal status for a subscription
   * @param subscription - Subscription data
   * @returns Promise<void>
   */
  const toggleAutoRenewal = async (
    subscription: SubscriptionDataListInterface,
  ) => {
    try {
      setUpdatingAutoRenewal(subscription.id)
      // Здесь должен быть запрос к API для изменения статуса автопродления
      // await authApiClient.toggleAutoRenewal(subscription.id, !subscription.isAutoRenewal)

      // Временная имитация запроса
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Обновляем список подписок
      await fetchSubscriptions()
      console.log(
        `Auto renewal ${subscription.isAutoRenewal ? 'disabled' : 'enabled'} for subscription ${subscription.id}`,
      )
    } catch (error) {
      console.error('Failed to toggle auto renewal', error)
    } finally {
      setUpdatingAutoRenewal(null)
    }
  }

  /**
   * Adds a new subscription
   * @returns Promise<void>
   */
  const addSubscription = async () => {
    try {
      setLoading(true)
      // Здесь должен быть запрос к API для добавления подписки
      // await authApiClient.addSubscription()

      // Временная имитация запроса
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Обновляем список подписок
      await fetchSubscriptions()
      console.log('Subscription added successfully')
    } catch (error) {
      console.error('Failed to add subscription', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handles copying subscription URL to clipboard
   * @param url - URL to copy
   */
  const handleCopyUrl = (url: string) => {
    copyToClipboard(url)
    console.log('Subscription URL copied to clipboard')
  }

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono max-w-[600px] w-full">
      {/* Add Subscription Button */}
      {user &&
        subscriptions &&
        subscriptions.list &&
        subscriptions.list.length < user.limitSubscriptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center">
            <button
              onClick={addSubscription}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
              <FiPlus size={18} />
              <span>{t('addSubscription')}</span>
            </button>
          </motion.div>
        )}
      <div className="px-4 opacity-70 flex flex-row gap-2 items-center justify-between w-full">
        <span>{t('yourSubscriptions')}</span>
        <span className="text-sm">
          {subscriptions && subscriptions.list ? subscriptions.list.length : 0}/
          {user?.limitSubscriptions || 0}
        </span>
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
        <div className="flex flex-col gap-2 w-full">
          <AnimatePresence>
            {subscriptions?.list.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4">
                {t('noSubscriptions')}
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {subscriptions?.list.map((subscription) => (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-[var(--surface-container-lowest)] rounded-md ">
                    <div className="absolute z-10 -top-2 -right-2 flex items-center gap-2">
                      {/* Статус активности */}
                      <div
                        className={`text-xl rounded-full flex items-center justify-center bg-[var(--surface-container)] ${
                          subscription.isActive
                            ? 'text-[var(--success-container)]'
                            : 'text-[var(--error-container)]'
                        }`}>
                        {subscription.isActive ? (
                          <IoCheckmarkCircle />
                        ) : (
                          <IoCloseCircle />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(subscription.id)}
                      className="flex items-center gap-2 cursor-pointer px-4 py-2 text-[var(--on-primary)] bg-[var(--primary)] w-full rounded-t-md">
                      <span className="text-xs opacity-70">
                        <SiAdobeindesign />
                      </span>
                      <span className="font-mono text-sm">
                        {limitLengthString(subscription.id, 26)}
                      </span>
                      <span className="p-1 rounded-full">
                        <FaCopy size={14} />
                      </span>
                    </button>

                    <div className="flex flex-row flex-wrap gap-2 px-2 py-2 items-center justify-between">
                      <div className="text-sm mt-1 flex gap-2 items-center">
                        <MdRotateRight size={18} />
                        <span>{formatPeriod(subscription.period)}</span>
                      </div>
                      {subscription.expiredAt && (
                        <div className="text-xs mt-1 flex gap-2 items-center ">
                          <FaClockRotateLeft />
                          <span>
                            {formatExpiredDate(subscription.expiredAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between items-center px-2 py-2 border-t border-[var(--outline)]">
                      <div className="flex gap-2 items-center ">
                        <button
                          onClick={() =>
                            handleCopyUrl(subscription.subscriptionUrl)
                          }
                          className="p-2 rounded-md bg-[var(--error)] text-[var(--on-error)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                          <IoClose size={18} />
                        </button>

                        <div className="h-4 w-[1px] bg-[var(--outline)]"></div>

                        <button
                          onClick={() =>
                            handleCopyUrl(subscription.subscriptionUrl)
                          }
                          className="p-2 rounded-md bg-[var(--warning)] text-[var(--on-warning)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                          <FaArrowsRotate size={18} />
                        </button>

                        <div className="h-4 w-[1px] bg-[var(--outline)]"></div>

                        <button
                          onClick={() => toggleAutoRenewal(subscription)}
                          disabled={updatingAutoRenewal === subscription.id}
                          className={`p-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer ${
                            updatingAutoRenewal === subscription.id
                              ? 'animate-spin'
                              : subscription.isAutoRenewal
                                ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                                : 'bg-[var(--warning-container)] text-[var(--on-warning-container)]'
                          }`}>
                          <MdAutoMode size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleCopyUrl(subscription.subscriptionUrl)
                          }
                          className="p-2 rounded-md bg-[var(--gold-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                          <TgStar type={'gold'} w={18} />
                        </button>
                      </div>

                      <div className="flex gap-2 items-center ">
                        <div className="flex gap-2 items-center ">
                          <button
                            onClick={() =>
                              handleCopyUrl(subscription.subscriptionUrl)
                            }
                            className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                            <FaCopy size={18} />
                          </button>

                          <Link
                            href={subscription.subscriptionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] ">
                            <FiExternalLink size={18} />
                          </Link>
                        </div>
                        <div className="h-4 w-[1px] bg-[var(--outline)]"></div>
                        <Link
                          href={`${url}/subscription/${subscription.id}`}
                          className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] ">
                          <TbPlugConnected size={18} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
