'use client'

import { authApiClient } from '@app/core/authApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import {
  SubscriptionDataInterface,
  SubscriptionDataListInterface,
} from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
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
import { toast } from 'react-toastify'
import Modal from './Modal'
import TgStar from './TgStar'

/**
 * Component for displaying user subscriptions
 * @returns JSX.Element
 */
export function Subscriptions() {
  const t = useTranslations('subscriptions')
  const copyToClipboard = useCopyToClipboard()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [updatingButtons, setUpdatingButtons] = useState<string | null>(null)
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const [isOpenModalDelete, setIsOpenModalDelete] = useState<string | null>(
    null,
  )
  const [isOpenModalRefresh, setIsOpenModalRefresh] = useState<string | null>(
    null,
  )
  const [isOpenModalAutoPay, setIsOpenModalAutoPay] = useState<string | null>(
    null,
  )
  const [isOpenModalBuy, setIsOpenModalBuy] = useState<string | null>(null)

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

  const getPrice = (
    period: SubscriptionPeriodEnum,
    data: SubscriptionDataInterface,
    user: UserDataInterface,
  ) => {
    switch (period) {
      case SubscriptionPeriodEnum.TRIAL:
        return data.priceSubscriptionStars * user.roleDiscount
      case SubscriptionPeriodEnum.HOUR:
        return (
          data.priceSubscriptionStars *
          data.hourRatioPayment *
          user.roleDiscount
        )
      case SubscriptionPeriodEnum.DAY:
        return (
          data.priceSubscriptionStars * data.dayRatioPayment * user.roleDiscount
        )
      case SubscriptionPeriodEnum.MONTH:
        return data.priceSubscriptionStars * user.roleDiscount
      case SubscriptionPeriodEnum.THREE_MONTH:
        return (
          data.priceSubscriptionStars *
          data.threeMouthesRatioPayment *
          user.roleDiscount
        )
      case SubscriptionPeriodEnum.SIX_MONTH:
        return (
          data.priceSubscriptionStars *
          data.sixMouthesRatioPayment *
          user.roleDiscount
        )
      case SubscriptionPeriodEnum.YEAR:
        return (
          data.priceSubscriptionStars *
          data.oneYearRatioPayment *
          user.roleDiscount
        )
      case SubscriptionPeriodEnum.TWO_YEAR:
        return (
          data.priceSubscriptionStars *
          data.twoYearRatioPayment *
          user.roleDiscount
        )
      case SubscriptionPeriodEnum.THREE_YEAR:
        return (
          data.priceSubscriptionStars *
          data.threeYearRatioPayment *
          user.roleDiscount
        )
      default:
        return data.priceSubscriptionStars
    }
  }

  const getDiscountPeriod = (
    period: SubscriptionPeriodEnum,
    data: SubscriptionDataInterface,
  ) => {
    switch (period) {
      case SubscriptionPeriodEnum.TRIAL:
        return 1
      case SubscriptionPeriodEnum.HOUR:
        return data.hourRatioPayment
      case SubscriptionPeriodEnum.DAY:
        return data.dayRatioPayment
      case SubscriptionPeriodEnum.MONTH:
        return 1
      case SubscriptionPeriodEnum.THREE_MONTH:
        return data.threeMouthesRatioPayment
      case SubscriptionPeriodEnum.SIX_MONTH:
        return data.sixMouthesRatioPayment
      case SubscriptionPeriodEnum.YEAR:
        return data.oneYearRatioPayment
      case SubscriptionPeriodEnum.TWO_YEAR:
        return data.twoYearRatioPayment
      case SubscriptionPeriodEnum.THREE_YEAR:
        return data.threeYearRatioPayment
      default:
        return 1
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
      setIsOpenModalAutoPay(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.toggleAutoRenewalSubscription(
        subscription.id,
      )

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(
        `Auto renewal ${subscription.isAutoRenewal ? 'disabled' : 'enabled'}`,
      )
    } catch {
      toast.error(
        `Ошибка ${subscription.isAutoRenewal ? 'отключения' : 'включения'} автопродления!`,
      )
    } finally {
      setUpdatingButtons(null)
    }
  }

  const deleteSubscription = async (
    subscription: SubscriptionDataListInterface,
  ) => {
    try {
      setIsOpenModalDelete(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.deleteSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(`Подписка была успешно удалена`)
    } catch {
      toast.error(`Ошибка удаления подписки!`)
    } finally {
      setUpdatingButtons(null)
    }
  }

  const resetSubscriptionToken = async (
    subscription: SubscriptionDataListInterface,
  ) => {
    try {
      setIsOpenModalRefresh(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.resetSubscriptionToken(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(`Данные подписки были успешно обновлены!`)
    } catch {
      toast.error(`Ошибка сброса данных подписки!`)
    } finally {
      setUpdatingButtons(null)
    }
  }

  const renewSubscription = async (
    subscription: SubscriptionDataListInterface,
  ) => {
    try {
      setIsOpenModalBuy(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.renewSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(`Подписка успешно продлена!`)
    } catch {
      toast.error(`Неудалось продлить подписку!`)
    } finally {
      setUpdatingButtons(null)
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

  if (!user) return null

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
            <Link
              href={`${url}/add-subscription`}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
              <FiPlus size={18} />
              <span>{t('addSubscription')}</span>
            </Link>
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
                          onClick={() => setIsOpenModalDelete(subscription.id)}
                          disabled={updatingButtons === subscription.id}
                          className={`p-2 rounded-md bg-[var(--error)] text-[var(--on-error)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer `}>
                          <IoClose size={18} />
                        </button>

                        <Modal
                          isOpen={isOpenModalDelete === subscription.id}
                          onClose={() => setIsOpenModalDelete(null)}
                          title="Предупреждение!"
                          variant="error"
                          actionText="Удалить"
                          onAction={() => deleteSubscription(subscription)}>
                          Вы точно хотите безвратно удалить подписку? Ее
                          невозможно будет восстановить! Компенсация не
                          предусмотрена!
                        </Modal>

                        <div className="h-4 w-[1px] bg-[var(--outline)]"></div>

                        <button
                          onClick={() => setIsOpenModalRefresh(subscription.id)}
                          disabled={updatingButtons === subscription.id}
                          className={`p-2 rounded-md bg-[var(--warning)] text-[var(--on-warning)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer`}>
                          <FaArrowsRotate size={18} />
                        </button>

                        <Modal
                          isOpen={isOpenModalRefresh === subscription.id}
                          onClose={() => setIsOpenModalRefresh(null)}
                          title="Предупреждение!"
                          variant="warning"
                          actionText="Сбросить"
                          onAction={() => resetSubscriptionToken(subscription)}>
                          Вы точно хотите сделать сброс данных подписки? После
                          этого ключи и адрес подписки поменяются на новые!
                          Необходимо будет заново добавить подписку в
                          приложение! Обычно сброс делают, если ваша подписка
                          утекала в сеть или кто-то получил доступ к ней!
                        </Modal>

                        <div className="h-4 w-[1px] bg-[var(--outline)]"></div>

                        <button
                          onClick={() => setIsOpenModalAutoPay(subscription.id)}
                          disabled={updatingButtons === subscription.id}
                          className={`p-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer ${
                            updatingButtons === subscription.id
                              ? 'animate-spin'
                              : subscription.isAutoRenewal
                                ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                                : 'bg-[var(--warning-container)] text-[var(--on-warning-container)]'
                          }`}>
                          <MdAutoMode size={18} />
                        </button>

                        <Modal
                          isOpen={isOpenModalAutoPay === subscription.id}
                          onClose={() => setIsOpenModalAutoPay(null)}
                          title="Предупреждение!"
                          variant="warning"
                          actionText={
                            subscription.isAutoRenewal
                              ? 'Отключить'
                              : 'Включить'
                          }
                          onAction={() => toggleAutoRenewal(subscription)}>
                          Вы точно хотите{' '}
                          {subscription.isAutoRenewal
                            ? 'отключить'
                            : 'включить'}{' '}
                          автопродление?
                        </Modal>

                        <button
                          onClick={() => setIsOpenModalBuy(subscription.id)}
                          disabled={
                            updatingButtons === subscription.id ||
                            getPrice(
                              subscription.period,
                              subscriptions,
                              user!,
                            ) > user?.balance.paymentBalance
                          }
                          className={`p-2 rounded-md bg-[var(--gold-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                            getPrice(
                              subscription.period,
                              subscriptions,
                              user!,
                            ) > user?.balance.paymentBalance
                              ? 'opacity-50 cursor-not-allowed'
                              : ' cursor-pointer'
                          }`}>
                          <TgStar type={'gold'} w={18} />
                        </button>

                        <Modal
                          isOpen={isOpenModalBuy === subscription.id}
                          onClose={() => setIsOpenModalBuy(null)}
                          title="Предупреждение!"
                          variant="warning"
                          actionText="Продлить"
                          onAction={() => renewSubscription(subscription)}>
                          <div>
                            Вы действительно хотите продлить подписку? <br />
                            Срок продления:{' '}
                            {formatPeriod(
                              subscription.period ==
                                SubscriptionPeriodEnum.TRIAL
                                ? SubscriptionPeriodEnum.MONTH
                                : subscription.period,
                            )}
                            . <br />C вашего баланса будет списано{' '}
                            <b className="font-bold">
                              {getPrice(
                                subscription.period,
                                subscriptions,
                                user!,
                              )}{' '}
                              STARS
                            </b>{' '}
                            (с учетом скидок{' '}
                            {100 -
                              getDiscountPeriod(
                                subscription.period,
                                subscriptions,
                              ) *
                                100}
                            % и {user ? 100 - user.roleDiscount * 100 : 0}%)!
                          </div>
                        </Modal>
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
