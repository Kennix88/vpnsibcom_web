'use client'

import { authApiClient } from '@app/core/authApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { copyToClipboard } from '@app/utils/copy-to-clipboard.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaClockRotateLeft, FaCopy, FaRotate } from 'react-icons/fa6'
import { FiExternalLink, FiPlus } from 'react-icons/fi'
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5'
import { MdAutoMode } from 'react-icons/md'
import { SiAdobeindesign } from 'react-icons/si'
import { TbPlugConnected } from 'react-icons/tb'

/**
 * Component for displaying user subscriptions
 * @returns JSX.Element
 */
export function Subscriptions() {
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [updatingAutoRenewal, setUpdatingAutoRenewal] = useState<string | null>(
    null,
  )
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  // Функция для получения данных о подписках
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

  // Загрузка данных при первой отрисовке
  useEffect(() => {
    fetchSubscriptions()
  }, [])

  // Функция для форматирования периода подписки
  const formatPeriod = (period: SubscriptionPeriodEnum): string => {
    switch (period) {
      case SubscriptionPeriodEnum.TRIAL:
        return 'Пробный период'
      case SubscriptionPeriodEnum.HOUR:
        return '1 час'
      case SubscriptionPeriodEnum.DAY:
        return '1 день'
      case SubscriptionPeriodEnum.MONTH:
        return '1 месяц'
      case SubscriptionPeriodEnum.THREE_MONTH:
        return '3 месяца'
      case SubscriptionPeriodEnum.SIX_MONTH:
        return '6 месяцев'
      case SubscriptionPeriodEnum.YEAR:
        return '1 год'
      case SubscriptionPeriodEnum.TWO_YEAR:
        return '2 года'
      case SubscriptionPeriodEnum.THREE_YEAR:
        return '3 года'
      default:
        return period
    }
  }

  // Функция для форматирования даты истечения
  const formatExpiredDate = (date: Date): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ru })
  }

  // Функция для переключения автопродления (заглушка)
  const toggleAutoRenewal = async (subscription: SubscriptionDataInterface) => {
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

  // Функция для добавления новой подписки (заглушка)
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

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono max-w-[600px] w-full">
      {/* Add Subscription Button */}
      {user && subscriptions.length < user.limitSubscriptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center">
          <button
            onClick={addSubscription}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
            <FiPlus size={18} />
            <span>Добавить подписку</span>
          </button>
        </motion.div>
      )}
      <div className="px-4 opacity-70 flex flex-row gap-2 items-center justify-between w-full">
        <span>Ваши подписки</span>
        <span className="text-sm">
          {subscriptions.length}/{user?.limitSubscriptions || 0}
        </span>
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center py-8 w-full">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-[var(--primary-container)] h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-[var(--primary-container)] rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-[var(--primary-container)] rounded"></div>
                <div className="h-4 bg-[var(--primary-container)] rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {!loading && (
        <div className="flex flex-col gap-2 w-full">
          <AnimatePresence>
            {subscriptions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4">
                У вас пока нет подписок
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {subscriptions.map((subscription) => (
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
                        className={`text-xl rounded-full ${
                          subscription.isActive
                            ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                            : 'bg-[var(--error-container)] text-[var(--on-error-container)]'
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

                    <div className="flex flex-row flex-wrap gap-2 px-4 py-2 items-center justify-between">
                      <div className="text-sm mt-1 flex gap-2 items-center">
                        <FaRotate />
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

                    <div className="flex justify-between items-center px-2 py-2 border-t border-[var(--outline)]">
                      {/* Кнопка автопродления */}
                      <button
                        onClick={() => toggleAutoRenewal(subscription)}
                        disabled={updatingAutoRenewal === subscription.id}
                        className={`p-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer ${
                          updatingAutoRenewal === subscription.id
                            ? 'animate-spin'
                            : subscription.isAutoRenewal
                              ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                              : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)]'
                        }`}
                        title={
                          subscription.isAutoRenewal
                            ? 'Автопродление включено'
                            : 'Автопродление выключено'
                        }>
                        <MdAutoMode size={18} />
                      </button>

                      <div className="flex gap-2 items-center ">
                        <div className="flex gap-2 items-center ">
                          <button
                            onClick={() =>
                              copyToClipboard(subscription.subscriptionUrl)
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
