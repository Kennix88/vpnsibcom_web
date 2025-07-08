'use client'
import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useLocale } from '@app/hooks/useLocale'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { formatBytes } from '@app/utils/format-bytes.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { differenceInMinutes, formatDistanceToNow, intlFormat } from 'date-fns'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BiServer } from 'react-icons/bi'
import { FaArrowRotateRight, FaClockRotateLeft, FaCopy } from 'react-icons/fa6'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { MdDevices } from 'react-icons/md'
import { PiSpeedometerBold } from 'react-icons/pi'
import { SiAdobeindesign } from 'react-icons/si'
import { toast } from 'react-toastify'
import LanguageSwitcher from '../LanguageSwitcher'

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
  const [subscription, setSubscription] =
    useState<SubscriptionDataInterface | null>(null)
  const copyToClipboard = useCopyToClipboard()

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

  return (
    <div className="w-full flex justify-center font-mono">
      <div className="max-w-lg flex w-full flex-col gap-4 p-4">
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
            <div className="text-sm flex flex-wrap gap-2 items-center justify-between px-4 ">
              <div className="flex gap-2 items-center">
                <BiServer size={16} />
                Доступные сервера:
              </div>
              <div className="flex gap-1 items-center">
                Обычные {subscription.baseServersCount}{' '}
                {subscription.premiumServersCount > 0 &&
                  `/ Премиум ${subscription.premiumServersCount}`}
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="text-sm flex items-center justify-between px-4 ">
              <div className="flex gap-2 items-center">
                <MdDevices size={16} /> Устройства:{' '}
              </div>
              <div className="flex gap-1 items-center">
                Онлайн 0 из {subscription.devicesCount} доступных
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="flex gap-2 text-sm flex-wrap justify-between items-center px-4">
              <div className=" mt-1 flex gap-2 items-center">
                <FaArrowRotateRight size={14} />
                Переодичность оплаты:
              </div>
              <div className="flex gap-1 items-center">
                <div>{formatPeriod(subscription.period)}</div>
                {subscription.periodMultiplier > 1 && (
                  <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                    x{subscription.periodMultiplier}
                  </div>
                )}
              </div>
            </div>

            <hr className="w-full rounded-full bg-[var(--outline)] border-[var(--outline)] opacity-70" />
            <div className="flex gap-2 text-sm flex-wrap justify-between items-center px-4">
              <div className=" mt-1 flex gap-2 items-center">
                <FaClockRotateLeft size={14} />
                Истекает:
              </div>
              <div className="flex gap-1 items-center">
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
          </div>
        </div>
      </div>
    </div>
  )
}
