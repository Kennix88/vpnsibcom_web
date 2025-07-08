'use client'
import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useLocale } from '@app/hooks/useLocale'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { formatBytes } from '@app/utils/format-bytes.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { differenceInMinutes, formatDistanceToNow, intlFormat } from 'date-fns'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import QRCodeStyling from 'qr-code-styling'
import { useEffect, useRef, useState } from 'react'
import { BiServer } from 'react-icons/bi'
import {
  FaArrowRotateRight,
  FaArrowsRotate,
  FaClockRotateLeft,
  FaCopy,
} from 'react-icons/fa6'
import { FiExternalLink } from 'react-icons/fi'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { MdAutoMode, MdDevices } from 'react-icons/md'
import { PiSpeedometerBold } from 'react-icons/pi'
import { SiAdobeindesign } from 'react-icons/si'
import { TbDotsVertical, TbQrcode } from 'react-icons/tb'
import { toast } from 'react-toastify'
import LanguageSwitcher from '../LanguageSwitcher'
import Modal from '../Modal'
import TgStar from '../TgStar'

export default function Subscription({
  token,
  isToken,
}: {
  token: string
  isToken: boolean
}) {
  const location = usePathname()
  const { locale, dateFnsLocale } = useLocale()
  const t = useTranslations('subscriptions')
  const url = location.includes('/tma') ? '/tma' : '/app'
  const isTma = location.includes('/tma')
  const { user, setUser } = useUserStore()
  const [updatingButtons, setUpdatingButtons] = useState<boolean>(false)
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const [subscription, setSubscription] =
    useState<SubscriptionDataInterface | null>(null)
  const copyToClipboard = useCopyToClipboard()
  const [isOpenAction, setIsOpenAction] = useState<boolean>(false)
  const [isOpenModalDelete, setIsOpenModalDelete] = useState<boolean>(false)
  const [isOpenModalRefresh, setIsOpenModalRefresh] = useState<boolean>(false)
  const [isOpenModalAutoPay, setIsOpenModalAutoPay] = useState<boolean>(false)
  const [isOpenModalBuy, setIsOpenModalBuy] = useState<boolean>(false)
  const [isOpenModalQR, setIsOpenModalQR] = useState<boolean>(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const [tab, setTab] = useState<'apps' | 'links'>('apps')

  useEffect(() => {
    const getSubscription = async () => {
      try {
        if (isTma) {
          const get = await authApiClient.getSubscriptionDataById(token)
          setSubscription(get.subscription)
        } else {
          const get = await publicApiClient.getSubscriptionDataByToken(token)
          setSubscription(get.subscription)
        }
      } catch {
        toast.error('Error updating data')
      }
    }
    getSubscription()
  }, [isTma, token])

  if (!subscription) {
    return null
  }

  qrCodeRef.current = new QRCodeStyling({
    width: 250,
    height: 250,
    type: 'svg',
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
    data: subscription.subscriptionUrl || '',
  })

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
      setIsOpenModalAutoPay(false)
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
      setUpdatingButtons(false)
    }
  }

  const deleteSubscription = async (
    subscription: SubscriptionDataInterface,
  ) => {
    try {
      setIsOpenModalDelete(false)
      const data = await authApiClient.deleteSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionDeleted'))
    } catch {
      toast.error(t('errors.deleteSubscriptionFailed'))
    } finally {
      setUpdatingButtons(false)
    }
  }

  const resetSubscriptionToken = async (
    subscription: SubscriptionDataInterface,
  ) => {
    try {
      setIsOpenModalRefresh(false)
      const data = await authApiClient.resetSubscriptionToken(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionDataUpdated'))
    } catch {
      toast.error(t('errors.resetSubscriptionFailed'))
    } finally {
      setUpdatingButtons(false)
    }
  }

  const renewSubscription = async (subscription: SubscriptionDataInterface) => {
    try {
      setIsOpenModalBuy(false)
      const data = await authApiClient.renewSubscription(subscription.id)

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success(t('subscriptionRenewed'))
    } catch {
      toast.error(t('errors.renewSubscriptionFailed'))
    } finally {
      setUpdatingButtons(false)
    }
  }

  const balance = user
    ? user.balance.isUseWithdrawalBalance
      ? user.balance.paymentBalance + user.balance.withdrawalBalance
      : user.balance.paymentBalance
    : 0

  return (
    <div className="w-full flex justify-center font-mono">
      <div className="max-w-lg flex w-full flex-col gap-4 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="text-lg">Подписка</h3>
          {!isTma && <LanguageSwitcher isPublic={true} />}
        </div>
        <div className="flex w-full flex-col gap-4 bg-[var(--surface-container-lowest)] rounded-md ">
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
          <div className="pb-4 flex flex-col gap-2">
            <div className="flex gap-2 items-center justify-between px-4 ">
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
              differenceInMinutes(new Date(), new Date(subscription.onlineAt)) <
                2 ? (
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

            <div className="flex flex-row flex-wrap items-start justify-between text-xs py-2 px-4 ">
              <div className="flex flex-col gap-1 w-full text-xs">
                <div className="flex gap-2 items-center">
                  <PiSpeedometerBold size={16} />
                  <div>Трафик</div>
                </div>
                {subscription.dataLimit && !subscription.isUnlimitTraffic ? (
                  <>
                    <div className="w-full h-2 flex items-center rounded-full bg-[var(--on-secondary)]">
                      <div
                        className={`h-2 rounded-full bg-[var(--secondary)]`}
                        style={{
                          width: `${
                            (subscription.usedTraffic /
                              (subscription.dataLimit || 1)) *
                            100
                          }%`,
                        }}></div>
                    </div>
                    <div className="flex px-2 items-center gap-2 justify-between ">
                      <div>
                        {formatBytes(subscription.usedTraffic)} /{' '}
                        {formatBytes(subscription.dataLimit || 0)} ежедневно
                      </div>
                      <div>
                        Всего: {formatBytes(subscription.lifeTimeUsedTraffic)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex px-2 items-center gap-2 justify-between text-xs">
                    <div>Безлимит</div>
                    <div>
                      Всего: {formatBytes(subscription.lifeTimeUsedTraffic)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="text-xs flex flex-wrap gap-2 items-center justify-between px-4 ">
              <div className="flex gap-2 items-center">
                <BiServer size={16} />
                Доступные сервера:
              </div>
              <div className="text-xs flex gap-1 items-center">
                Обычные {subscription.baseServersCount}{' '}
                {subscription.premiumServersCount > 0 &&
                  `/ Премиум ${subscription.premiumServersCount}`}
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="text-xs flex items-center justify-between px-4 ">
              <div className="flex gap-2 items-center">
                <MdDevices size={16} /> Устройства:{' '}
              </div>
              <div className="text-xs flex gap-1 items-center">
                Онлайн 0 из {subscription.devicesCount} доступных
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="flex gap-2 text-xs flex-wrap justify-between items-center px-4">
              <div className=" mt-1 flex gap-2 items-center">
                <FaArrowRotateRight size={14} />
                Переодичность оплаты:
              </div>
              <div className="text-xs flex gap-1 items-center">
                <div>{formatPeriod(subscription.period)}</div>
                {subscription.periodMultiplier > 1 && (
                  <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                    x{subscription.periodMultiplier}
                  </div>
                )}
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="flex gap-2 text-xs flex-wrap justify-between items-center px-4">
              <div className=" mt-1 flex gap-2 items-center">
                <FaClockRotateLeft size={14} />
                Истекает:
              </div>
              <div className="text-xs flex gap-1 items-center">
                {subscription.isActive && subscription.expiredAt ? (
                  <div className="flex gap-2 items-center">
                    Через {formatExpiredDate(subscription.expiredAt)} -{' '}
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
                  </div>
                ) : (
                  subscription.isActive &&
                  subscription.period ==
                    SubscriptionPeriodEnum.INDEFINITELY && <div>Безсрочно!</div>
                )}
              </div>
            </div>
            {isTma && (
              <>
                <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
                <div className="flex flex-wrap items-center justify-between px-4 pt-2">
                  <button
                    onClick={() => setIsOpenAction(true)}
                    className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center text-xs">
                    <TbDotsVertical size={18} />
                    Действия
                  </button>
                  <Modal
                    isOpen={isOpenAction}
                    onClose={() => setIsOpenAction(false)}
                    title={'Действия'}
                    variant="default">
                    <div className="flex flex-wrap gap-2">
                      {subscription.period !== SubscriptionPeriodEnum.TRIAL &&
                        subscription.period !==
                          SubscriptionPeriodEnum.INDEFINITELY &&
                        subscription.nextRenewalStars && (
                          <>
                            <button
                              onClick={() => {
                                setIsOpenModalBuy(true)
                              }}
                              disabled={
                                updatingButtons ||
                                subscription.nextRenewalStars > balance
                              }
                              className={`flex-grow p-2 rounded-md bg-[var(--gold-container)] text-[var(--tg-star-gold)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                                subscription.nextRenewalStars > balance
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ' cursor-pointer'
                              } flex gap-2 items-center `}>
                              <TgStar type={'gold'} w={18} />
                              Продлить с баланса
                            </button>
                            <Modal
                              isOpen={isOpenModalBuy}
                              onClose={() => setIsOpenModalBuy(false)}
                              title={t('modals.renew.title')}
                              variant="warning"
                              actionText={t('modals.renew.action')}
                              onAction={() => renewSubscription(subscription)}>
                              <div>
                                {t('modals.renew.message', {
                                  price: subscription.nextRenewalStars,
                                })}
                              </div>
                            </Modal>
                          </>
                        )}

                      {subscription.period !== SubscriptionPeriodEnum.TRIAL &&
                        subscription.period !==
                          SubscriptionPeriodEnum.INDEFINITELY && (
                          <>
                            <button
                              onClick={() => {
                                setIsOpenModalAutoPay(true)
                              }}
                              disabled={updatingButtons}
                              className={`flex-grow p-2 rounded-md ${
                                subscription.isAutoRenewal
                                  ? 'bg-[var(--success)] text-[var(--on-success)]'
                                  : 'bg-[var(--surface-container-high)] text-[var(--on-surface)]'
                              } transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                              <MdAutoMode size={18} />
                              Автопродление
                            </button>

                            <Modal
                              isOpen={isOpenModalAutoPay}
                              onClose={() => setIsOpenModalAutoPay(false)}
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
                                  ? t('modals.autoRenewal.disableAction')
                                  : t('modals.autoRenewal.enableAction')
                              }
                              onAction={() => toggleAutoRenewal(subscription)}>
                              {subscription.isAutoRenewal
                                ? t('modals.autoRenewal.disableMessage')
                                : t('modals.autoRenewal.enableMessage')}
                            </Modal>
                          </>
                        )}

                      <button
                        onClick={() => {
                          setIsOpenModalRefresh(true)
                        }}
                        disabled={updatingButtons}
                        className={`flex-grow p-2 rounded-md bg-[var(--warning)] text-[var(--on-warning)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                        <FaArrowsRotate size={18} />
                        Сбросить данные
                      </button>

                      <Modal
                        isOpen={isOpenModalRefresh}
                        onClose={() => setIsOpenModalRefresh(false)}
                        title={t('modals.refresh.title')}
                        variant="warning"
                        actionText={t('modals.refresh.action')}
                        onAction={() => resetSubscriptionToken(subscription)}>
                        {t('modals.refresh.message')}
                      </Modal>

                      <button
                        onClick={() => {
                          setIsOpenModalDelete(true)
                        }}
                        disabled={updatingButtons}
                        className={`flex-grow p-2 rounded-md bg-[var(--error)] text-[var(--on-error)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                        <IoClose size={18} />
                        Удалить
                      </button>

                      <Modal
                        isOpen={isOpenModalDelete}
                        onClose={() => setIsOpenModalDelete(false)}
                        title={t('modals.delete.title')}
                        variant="error"
                        actionText={t('modals.delete.action')}
                        onAction={() => deleteSubscription(subscription)}>
                        {t('modals.delete.message')}
                      </Modal>
                    </div>
                  </Modal>
                  <div className="flex gap-2 items-center ">
                    <div className="flex gap-2 items-center ">
                      <button
                        onClick={() => setIsOpenModalQR(true)}
                        className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
                        <TbQrcode size={18} />
                      </button>

                      <Modal
                        isOpen={isOpenModalQR}
                        onClose={() => setIsOpenModalQR(false)}
                        title={'QR-код подписки'}
                        variant="default">
                        <div className="flex flex-col items-center gap-4 p-4">
                          <div ref={qrRef} className="qr-code-container"></div>
                          <div className="text-sm text-center">
                            Отсканируйте в клиентском приложении (Happ,
                            Straisand, ShadowRocket, v2rayNG, FoXray и др.)
                          </div>
                        </div>
                      </Modal>

                      <button
                        onClick={() =>
                          copyToClipboard(subscription.subscriptionUrl)
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
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
