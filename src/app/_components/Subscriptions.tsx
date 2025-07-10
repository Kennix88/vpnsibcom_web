'use client'

import { authApiClient } from '@app/core/authApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'

import { useLocale } from '@app/hooks/useLocale'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import limitLengthString from '@app/utils/limit-length-string.util'
import { differenceInMinutes, formatDistanceToNow, intlFormat } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import QRCodeStyling from 'qr-code-styling'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaArrowsRotate, FaClockRotateLeft, FaCopy } from 'react-icons/fa6'
import { FiExternalLink, FiPlus } from 'react-icons/fi'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { MdAutoMode, MdRotateRight } from 'react-icons/md'
import { SiAdobeindesign } from 'react-icons/si'
import { TbDotsVertical, TbPlugConnected, TbQrcode } from 'react-icons/tb'
import { toast } from 'react-toastify'
import Modal from './Modal'
import TgStar from './TgStar'
import HappDeepLinkButton from './subscription/HappDeepLinkButton'

/**
 * Component for displaying user subscriptions
 * @returns JSX.Element
 */
export function Subscriptions() {
  const { locale, dateFnsLocale } = useLocale()
  const t = useTranslations('subscriptions')
  const copyToClipboard = useCopyToClipboard()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [updatingButtons, setUpdatingButtons] = useState<string | null>(null)
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const [isOpenAction, setIsOpenAction] = useState<string | null>(null)
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
  const [isOpenModalQR, setIsOpenModalQR] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!isOpenModalQR || !qrRef.current) return

    // Находим подписку по ID
    const subscription = subscriptions?.subscriptions.find(
      (sub) => sub.id === isOpenModalQR,
    )
    if (!subscription) return

    // Создаем новый QR-код
    qrCodeRef.current = new QRCodeStyling({
      width: 250,
      height: 250,
      type: 'svg',
      data: subscription.subscriptionUrl || '',
      image: '/logo.png', // Путь к вашему логотипу
      dotsOptions: {
        color: 'var(--primary)',
        type: 'rounded', // 'rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'
      },
      backgroundOptions: {
        color: 'var(--surface-container-lowest)',
      },
      cornersSquareOptions: {
        color: 'var(--secondary)',
        type: 'extra-rounded', // 'dot', 'square', 'extra-rounded', 'rounded'
      },
      cornersDotOptions: {
        color: 'var(--tertiary)',
        type: 'dot', // 'dot', 'square'
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
        hideBackgroundDots: true,
        imageSize: 0.3,
      },
    })

    // Очищаем контейнер перед добавлением нового QR-кода
    qrRef.current.innerHTML = ''
    qrCodeRef.current.append(qrRef.current)
  }, [isOpenModalQR, subscriptions])

  const fetchSubscriptions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await authApiClient.getSubscriptons()
      setSubscriptions(response.subscriptions)
      console.log('Subscriptions loaded successfully')
    } catch (error) {
      console.error('Failed to load subscriptions', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [setSubscriptions, t])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

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
      case SubscriptionPeriodEnum.WEEK:
        return '1 неделя'
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
      case SubscriptionPeriodEnum.INDEFINITELY:
        return 'Безсрочно'
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
    return formatDistanceToNow(new Date(date), {
      addSuffix: false,
      locale: dateFnsLocale,
    })
  }

  /**
   * Toggles auto-renewal status for a subscription
   * @param subscription - Subscription data
   * @returns Promise<void>
   */
  const toggleAutoRenewal = async (subscription: SubscriptionDataInterface) => {
    try {
      setIsOpenModalAutoPay(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.toggleAutoRenewalSubscription(
        subscription.id,
      )

      setUser(data.user)
      setSubscriptions(data.subscriptions)
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
      setUpdatingButtons(null)
    }
  }

  const deleteSubscription = async (
    subscription: SubscriptionDataInterface,
  ) => {
    try {
      setIsOpenModalDelete(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.deleteSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionDeleted'))
    } catch {
      toast.error(t('errors.deleteSubscriptionFailed'))
    } finally {
      setUpdatingButtons(null)
    }
  }

  const resetSubscriptionToken = async (
    subscription: SubscriptionDataInterface,
  ) => {
    try {
      setIsOpenModalRefresh(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.resetSubscriptionToken(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionDataUpdated'))
    } catch {
      toast.error(t('errors.resetSubscriptionFailed'))
    } finally {
      setUpdatingButtons(null)
    }
  }

  const renewSubscription = async (subscription: SubscriptionDataInterface) => {
    try {
      setIsOpenModalBuy(null)
      setUpdatingButtons(subscription.id)
      const data = await authApiClient.renewSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionRenewed'))
    } catch {
      toast.error(t('errors.renewSubscriptionFailed'))
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
  }

  if (!user) return null

  const balance = user.balance.isUseWithdrawalBalance
    ? user.balance.paymentBalance + user.balance.withdrawalBalance
    : user.balance.paymentBalance

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono max-w-[600px] w-full">
      {/* Add Subscription Button */}
      {user &&
        subscriptions &&
        subscriptions.subscriptions &&
        subscriptions.subscriptions.length < user.limitSubscriptions && (
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
          {subscriptions && subscriptions.subscriptions
            ? subscriptions.subscriptions.length
            : 0}
          /{user?.limitSubscriptions || 0}
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
                {subscriptions?.subscriptions
                  .sort((a, b) => {
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    )
                  })
                  .map((subscription) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[var(--surface-container-lowest)] rounded-md ">
                      <button
                        onClick={() => copyToClipboard(subscription.id)}
                        className="flex items-center gap-2 cursor-pointer px-4 py-2 text-[var(--on-primary)] bg-[var(--primary)] w-full rounded-t-md">
                        <span className="text-xs opacity-70">
                          <SiAdobeindesign />
                        </span>
                        <span className="font-mono text-xs">
                          {limitLengthString(subscription.id, 50)}
                        </span>
                        <span className="p-1 rounded-full">
                          <FaCopy size={14} />
                        </span>
                      </button>

                      <div className="flex flex-col gap-2 px-2 py-2">
                        <div className="flex gap-2 items-center justify-between">
                          <div className="rounded-md px-2 py-1 bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)] text-sm font-bold">
                            {subscription.planKey}
                          </div>
                          <div
                            className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                              subscription.isActive
                                ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                                : 'bg-[var(--error-container)] text-[var(--on-error-container)]'
                            }`}>
                            {subscription.isActive ? (
                              <IoCheckmark size={16} />
                            ) : (
                              <IoClose size={16} />
                            )}
                            <div className="text-sm">
                              {subscription.isActive ? 'Активна' : 'Не активна'}
                            </div>
                          </div>
                          {subscription.onlineAt &&
                          differenceInMinutes(
                            new Date(),
                            new Date(subscription.onlineAt),
                          ) < 2 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex w-4 h-4 items-center justify-center">
                                <div className="relative w-2 h-2 bg-[var(--success)] rounded-full ">
                                  <motion.div
                                    className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-[var(--success)]"
                                    initial={{ scale: 1, opacity: 0 }}
                                    animate={{
                                      scale: [1, 1, 2, 2],
                                      opacity: [0, 0.2, 0.5, 0],
                                    }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 3,
                                      ease: 'easeInOut',
                                      times: [0, 0.2, 0.5, 1],
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                  />
                                </div>
                              </div>
                              <div className="text-sm">Онлайн</div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="flex w-4 h-4 items-center justify-center">
                                <div className="relative w-2 h-2 bg-[var(--error)] rounded-full ">
                                  <div className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-[var(--error)] w-4 h-4 opacity-50" />
                                </div>
                              </div>
                              <div className="text-sm">Офлайн</div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-between items-center ">
                          <div className="text-xs mt-1 flex gap-2 items-center">
                            <MdRotateRight size={18} />
                            <div className="flex gap-1 items-center">
                              <div>{formatPeriod(subscription.period)}</div>
                              {subscription.periodMultiplier > 1 && (
                                <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                                  x{subscription.periodMultiplier}
                                </div>
                              )}
                            </div>
                          </div>
                          {subscription.isActive && subscription.expiredAt && (
                            <div className="text-xs mt-1 flex gap-2 items-center ">
                              <FaClockRotateLeft size={14} />
                              <span>
                                {formatExpiredDate(subscription.expiredAt)} -{' '}
                                {subscription.expiredAt &&
                                  intlFormat(
                                    new Date(subscription.expiredAt),
                                    {
                                      year: 'numeric',
                                      month: 'numeric',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric',
                                    },
                                    {
                                      locale: locale,
                                    },
                                  )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-between items-center px-2 py-2 border-t border-[var(--outline)]">
                        <div className="flex gap-2 items-center ">
                          <button
                            onClick={() => setIsOpenAction(subscription.id)}
                            className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center text-xs">
                            <TbDotsVertical size={18} />
                            Действия
                          </button>
                          <Modal
                            isOpen={isOpenAction === subscription.id}
                            onClose={() => setIsOpenAction(null)}
                            title={'Действия'}
                            variant="default">
                            <div className="flex flex-col-reverse gap-2">
                              <button
                                onClick={() => {
                                  setIsOpenModalDelete(subscription.id)
                                }}
                                disabled={updatingButtons === subscription.id}
                                className={`p-2 rounded-md bg-[var(--error)] text-[var(--on-error)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                                <IoClose size={18} />
                                Удалить
                              </button>

                              <Modal
                                isOpen={isOpenModalDelete === subscription.id}
                                onClose={() => setIsOpenModalDelete(null)}
                                title={t('modals.delete.title')}
                                variant="error"
                                actionText={t('modals.delete.action')}
                                onAction={() =>
                                  deleteSubscription(subscription)
                                }>
                                {t('modals.delete.message')}
                              </Modal>

                              <button
                                onClick={() => {
                                  setIsOpenModalRefresh(subscription.id)
                                }}
                                disabled={updatingButtons === subscription.id}
                                className={`p-2 rounded-md bg-[var(--warning)] text-[var(--on-warning)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                                <FaArrowsRotate size={18} />
                                Сбросить данные
                              </button>

                              <Modal
                                isOpen={isOpenModalRefresh === subscription.id}
                                onClose={() => setIsOpenModalRefresh(null)}
                                title={t('modals.refresh.title')}
                                variant="warning"
                                actionText={t('modals.refresh.action')}
                                onAction={() =>
                                  resetSubscriptionToken(subscription)
                                }>
                                {t('modals.refresh.message')}
                              </Modal>

                              {subscription.period !==
                                SubscriptionPeriodEnum.TRIAL &&
                                subscription.period !==
                                  SubscriptionPeriodEnum.INDEFINITELY && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setIsOpenModalAutoPay(subscription.id)
                                      }}
                                      disabled={
                                        updatingButtons === subscription.id
                                      }
                                      className={`p-2 rounded-md ${
                                        subscription.isAutoRenewal
                                          ? 'bg-[var(--success)] text-[var(--on-success)]'
                                          : 'bg-[var(--surface-container-high)] text-[var(--on-surface)]'
                                      } transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                                      <MdAutoMode size={18} />
                                      Автопродление
                                    </button>

                                    <Modal
                                      isOpen={
                                        isOpenModalAutoPay === subscription.id
                                      }
                                      onClose={() =>
                                        setIsOpenModalAutoPay(null)
                                      }
                                      title={
                                        subscription.isAutoRenewal
                                          ? t('modals.autoRenewal.disableTitle')
                                          : t('modals.autoRenewal.enableTitle')
                                      }
                                      variant={
                                        subscription.isAutoRenewal
                                          ? 'warning'
                                          : 'success'
                                      }
                                      actionText={
                                        subscription.isAutoRenewal
                                          ? t(
                                              'modals.autoRenewal.disableAction',
                                            )
                                          : t('modals.autoRenewal.enableAction')
                                      }
                                      onAction={() =>
                                        toggleAutoRenewal(subscription)
                                      }>
                                      {subscription.isAutoRenewal
                                        ? t('modals.autoRenewal.disableMessage')
                                        : t('modals.autoRenewal.enableMessage')}
                                    </Modal>
                                  </>
                                )}

                              {subscription.period !==
                                SubscriptionPeriodEnum.TRIAL &&
                                subscription.period !==
                                  SubscriptionPeriodEnum.INDEFINITELY &&
                                subscription.nextRenewalStars && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setIsOpenModalBuy(subscription.id)
                                      }}
                                      disabled={
                                        updatingButtons === subscription.id ||
                                        subscription.nextRenewalStars > balance
                                      }
                                      className={`p-2 rounded-md bg-[var(--gold-container)] text-[var(--tg-star-gold)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                                        subscription.nextRenewalStars > balance
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ' cursor-pointer'
                                      } flex gap-2 items-center `}>
                                      <TgStar type={'gold'} w={18} />
                                      Продлить с баланса
                                    </button>
                                    <Modal
                                      isOpen={
                                        isOpenModalBuy === subscription.id
                                      }
                                      onClose={() => setIsOpenModalBuy(null)}
                                      title={t('modals.renew.title')}
                                      variant="warning"
                                      actionText={t('modals.renew.action')}
                                      onAction={() =>
                                        renewSubscription(subscription)
                                      }>
                                      <div>
                                        {t('modals.renew.message', {
                                          price: subscription.nextRenewalStars,
                                        })}
                                      </div>
                                    </Modal>
                                  </>
                                )}
                            </div>
                          </Modal>
                        </div>

                        <div className="flex gap-2 items-center ">
                          <div className="flex gap-2 items-center ">
                            <HappDeepLinkButton
                              subscriptionUrl={subscription.subscriptionUrl}
                            />
                            <button
                              onClick={() => setIsOpenModalQR(subscription.id)}
                              className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                              <TbQrcode size={18} />
                            </button>

                            <Modal
                              isOpen={isOpenModalQR === subscription.id}
                              onClose={() => setIsOpenModalQR(null)}
                              title={'QR-код подписки'}
                              variant="default">
                              <div className="flex flex-col items-center gap-4 p-4">
                                <div
                                  ref={qrRef}
                                  className="qr-code-container"></div>
                                <div className="text-sm text-center">
                                  Отсканируйте в клиентском приложении (Happ,
                                  Straisand, ShadowRocket, v2rayNG, FoXray и
                                  др.)
                                </div>
                              </div>
                            </Modal>

                            <button
                              onClick={() =>
                                handleCopyUrl(subscription.subscriptionUrl)
                              }
                              className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                              <FaCopy size={16} />
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
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
