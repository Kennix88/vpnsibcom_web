'use client'

import { authApiClient } from '@app/core/authApiClient'
import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { useLocale } from '@app/hooks/useLocale'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { formatBytes } from '@app/utils/format-bytes.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import clsx from 'clsx'
import { differenceInMinutes, intlFormat } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
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
import { HiTrash } from 'react-icons/hi'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { MdAutoMode, MdDevices } from 'react-icons/md'
import { PiSpeedometerBold } from 'react-icons/pi'
import { SiAdobeindesign } from 'react-icons/si'
import { TbDotsVertical, TbPlugConnected, TbQrcode } from 'react-icons/tb'
import { toast } from 'react-toastify'
import Modal from '../Modal'
import AddTrafficButton from './AddTrafficButton'
import AutoRenewalSwitch from './AutoRenewalSwitch'
import ChangeServersButton from './ChangeServersButton'
import EditName from './EditName'
import FormatPeriod from './FromatPeriod'
import HappDeepLinkButton from './HappDeepLinkButton'
import RenewButton from './RenewButton'

export default function SubscriptionElement({
  subscription,
  isList,
  isPublic,
  isDefaultOpen,
}: {
  subscription: SubscriptionDataInterface
  isList: boolean
  isPublic: boolean
  isDefaultOpen: boolean
}) {
  const { locale } = useLocale()

  const t = useTranslations('subscriptions')
  const copyToClipboard = useCopyToClipboard()
  const { setSubscriptions } = useSubscriptionsStore()
  const { setUser } = useUserStore()
  const [isOpen, setIsOpen] = useState<boolean>(isDefaultOpen)

  const [updatingButtons, setUpdatingButtons] = useState<string | null>(null)
  const [isOpenAction, setIsOpenAction] = useState<string | null>(null)
  const [isOpenModalDelete, setIsOpenModalDelete] = useState<string | null>(
    null,
  )
  const [isOpenModalRefresh, setIsOpenModalRefresh] = useState<string | null>(
    null,
  )
  const [isOpenModalQR, setIsOpenModalQR] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!isOpenModalQR || !qrRef.current) return

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
  }, [isOpenModalQR, subscription])

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

  /**
   * Handles copying subscription URL to clipboard
   * @param url - URL to copy
   */
  const handleCopyUrl = (url: string) => {
    copyToClipboard(url)
  }

  return (
    <motion.div
      key={subscription.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--surface-container-lowest)] rounded-md ">
      <div
        className={`flex justify-between items-center gap-2 w-full rounded-t-md bg-[var(--surface-container-highest)] text-[var(--on-surface-container)]`}>
        <div className="flex gap-2 items-center grow">
          <div
            className={`p-3 rounded-tl-md flex items-center justify-center ${
              subscription.isActive
                ? 'bg-[var(--success-container)] text-[var(--on-success-container)]'
                : 'bg-[var(--error-container)] text-[var(--on-error-container)]'
            }`}>
            <div className="opacity-70">
              {subscription.isActive ? (
                <IoCheckmark size={18} />
              ) : (
                <IoClose size={18} />
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center grow">
            <div>
              {subscription.onlineAt &&
              differenceInMinutes(new Date(), new Date(subscription.onlineAt)) <
                2 ? (
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
              ) : (
                <div className="flex w-4 h-4 items-center justify-center">
                  <div className="relative w-2 h-2 bg-[var(--error)] rounded-full ">
                    <div className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-[var(--error)] w-4 h-4 opacity-50" />
                  </div>
                </div>
              )}
            </div>
            <EditName
              name={limitLengthString(subscription.name, 25)}
              isEdit={true}
              subscriptionId={subscription.id}
              isPublic={isPublic}
            />
          </div>
        </div>
        <button
          className="transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer rounded-full bg-[var(--surface-container)] text-[var(--on-surface-container)] p-1 mr-2"
          onClick={() => setIsOpen(!isOpen)}>
          <ChevronDown
            className={clsx(
              'transition-transform duration-300',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* {subscription.announce && (
        <div className="w-full text-xs opacity-80 bg-[var(--warning)] text-[var(--on-warning)] px-4 py-2">
          {subscription.announce}
        </div>
      )} */}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="flex flex-col pb-2 divide-y divide-[var(--outline)] ">
              <div className="flex gap-2 py-3 px-3 items-center justify-between">
                <div className="rounded-md px-2 py-1 bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)] text-sm font-bold">
                  {subscription.plan.name}
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
                    {subscription.isActive ? t('active') : t('notActive')}
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
                    <div className="text-sm">{t('online')}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="flex w-4 h-4 items-center justify-center">
                      <div className="relative w-2 h-2 bg-[var(--error)] rounded-full ">
                        <div className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-[var(--error)] w-4 h-4 opacity-50" />
                      </div>
                    </div>
                    <div className="text-sm">{t('offline')}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => copyToClipboard(subscription.id)}
                className="flex items-center justify-between gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer px-3 py-3">
                <span className="flex items-center gap-2 text-xs">
                  <SiAdobeindesign size={16} /> ID:
                </span>
                <span className="flex items-center gap-2 font-mono text-xs">
                  {limitLengthString(subscription.id, 50)}
                  <FaCopy size={14} />
                </span>
              </button>

              <div className="flex flex-row flex-wrap items-start justify-between text-xs py-3 px-3 ">
                <div className="flex flex-col gap-1 w-full text-xs">
                  <div className="flex gap-2 items-center">
                    <PiSpeedometerBold size={16} />
                    <div>{t('traffic')}:</div>
                  </div>

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
                      {subscription.dataLimit &&
                      !subscription.isUnlimitTraffic ? (
                        <div>
                          {formatBytes(subscription.usedTraffic)} /{' '}
                          {formatBytes(subscription.dataLimit || 0)}{' '}
                          {subscription.trafficReset == TrafficResetEnum.DAY
                            ? t('trafficReset.daily')
                            : subscription.trafficReset == TrafficResetEnum.WEEK
                              ? t('trafficReset.weekly')
                              : subscription.trafficReset ==
                                  TrafficResetEnum.MONTH
                                ? t('trafficReset.monthly')
                                : subscription.trafficReset ==
                                    TrafficResetEnum.YEAR
                                  ? t('trafficReset.yearly')
                                  : ''}
                        </div>
                      ) : (
                        <div>{t('trafficReset.unlimit')}</div>
                      )}

                      <div>
                        {t('inTotal')}:{' '}
                        {formatBytes(subscription.lifeTimeUsedTraffic)}
                      </div>
                    </div>
                  </>
                </div>
              </div>

              <div className="text-xs flex flex-wrap gap-2 py-3 px-3  items-center justify-between ">
                <div className="flex gap-2 items-center">
                  <BiServer size={16} />
                  {t('servers')}:
                </div>
                <div className="text-xs flex gap-1 items-center">
                  {subscription.isAllBaseServers &&
                  !subscription.isAllPremiumServers
                    ? t('allBase')
                    : subscription.isAllBaseServers &&
                        subscription.isAllPremiumServers
                      ? t('fullServers')
                      : `${t('base')} ${subscription.baseServersCount} ${
                          subscription.premiumServersCount > 0
                            ? `/${t('premium')} ${subscription.premiumServersCount}`
                            : ''
                        }`}
                </div>
              </div>

              <div className="text-xs flex items-center justify-between py-3 px-3 ">
                <div className="flex gap-2 items-center">
                  <MdDevices size={16} /> {t('devices')}:{' '}
                </div>
                <div className="text-xs flex gap-1 items-center">
                  {subscription.devicesCount}
                </div>
              </div>

              {subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
                subscription.period !== SubscriptionPeriodEnum.TRIAL &&
                subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRIAL && (
                  <div className="flex gap-2 text-xs flex-wrap justify-between items-center py-3 px-3 ">
                    <div className="flex gap-2 items-center">
                      <FaArrowRotateRight size={14} />
                      {t('period')}:
                    </div>
                    <div className="text-xs flex gap-1 items-center">
                      <div>
                        <FormatPeriod period={subscription.period} />
                      </div>
                      {subscription.periodMultiplier > 1 && (
                        <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                          x{subscription.periodMultiplier}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
                subscription.period !== SubscriptionPeriodEnum.TRIAL &&
                subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRIAL && (
                  <div className="flex gap-2 text-xs flex-wrap justify-between items-center py-3 px-3 ">
                    <div className="flex gap-2 items-center">
                      <FaClockRotateLeft size={14} />
                      {t('expires')}:
                    </div>
                    <div className="text-xs flex gap-1 items-center">
                      {subscription.isActive && subscription.expiredAt && (
                        <div className="flex gap-2 items-center">
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
                      )}
                    </div>
                  </div>
                )}

              {!isPublic &&
                subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
                subscription.period !== SubscriptionPeriodEnum.TRIAL &&
                subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRAFFIC &&
                subscription.plan.key !== PlansEnum.TRIAL && (
                  <div className="text-xs flex items-center justify-between py-3 px-3 ">
                    <div className="flex gap-2 items-center">
                      <MdAutoMode size={16} /> {t('autoRenewal')}:{' '}
                    </div>
                    <AutoRenewalSwitch subscription={subscription} size={0.6} />
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`flex flex-wrap justify-between items-center px-2 py-2  ${isOpen && 'border-t border-[var(--outline)]'}`}>
        {!isPublic && (
          <div className="flex gap-2 items-center ">
            <button
              onClick={() => setIsOpenAction(subscription.id)}
              className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center text-xs">
              <TbDotsVertical size={18} />
              {t('actions')}
            </button>
            <Modal
              isOpen={isOpenAction === subscription.id}
              onClose={() => setIsOpenAction(null)}
              title={t('actions')}
              variant="default">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2 items-center ">
                  <button
                    onClick={() => setIsOpenModalQR(subscription.id)}
                    className="p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center text-xs">
                    <TbQrcode size={18} /> QR
                  </button>

                  <Modal
                    isOpen={isOpenModalQR === subscription.id}
                    onClose={() => setIsOpenModalQR(null)}
                    title={t('modals.qr.title')}
                    variant="default">
                    <div className="flex flex-col items-center gap-4 p-4">
                      <div ref={qrRef} className="qr-code-container"></div>
                      <div className="text-sm text-center">
                        {t('modals.qr.description')} (Happ, Straisand,
                        ShadowRocket, v2rayNG, FoXray...)
                      </div>
                    </div>
                  </Modal>

                  <button
                    onClick={() => handleCopyUrl(subscription.subscriptionUrl)}
                    className="p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer  flex gap-2 items-center text-xs">
                    <FaCopy size={16} /> Copy
                  </button>

                  <Link
                    href={subscription.subscriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]  flex gap-2 items-center text-xs">
                    <FiExternalLink size={18} /> Open
                  </Link>
                </div>

                <hr className="w-full border-none h-[1px] bg-[var(--surface-container-highest)] my-2" />
                <RenewButton subscription={subscription} />
                <AddTrafficButton subscription={subscription} />
                <ChangeServersButton subscription={subscription} />

                <hr className="w-full border-none h-[1px] bg-[var(--surface-container-highest)] my-2" />

                <button
                  onClick={() => {
                    setIsOpenModalRefresh(subscription.id)
                  }}
                  disabled={updatingButtons === subscription.id}
                  className={`grow p-2 rounded-md bg-[var(--warning)] text-[var(--on-warning)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                  <FaArrowsRotate size={18} />
                  {t('modals.refresh.button')}
                </button>

                <Modal
                  isOpen={isOpenModalRefresh === subscription.id}
                  onClose={() => setIsOpenModalRefresh(null)}
                  title={t('modals.refresh.title')}
                  variant="warning"
                  actionText={t('modals.refresh.action')}
                  onAction={() => resetSubscriptionToken(subscription)}>
                  {t('modals.refresh.message')}
                </Modal>

                <button
                  onClick={() => {
                    setIsOpenModalDelete(subscription.id)
                  }}
                  disabled={updatingButtons === subscription.id}
                  className={`grow p-2 rounded-md bg-[var(--error)] text-[var(--on-error)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
                  <HiTrash size={18} />
                  {t('modals.delete.button')}
                </button>

                <Modal
                  isOpen={isOpenModalDelete === subscription.id}
                  onClose={() => setIsOpenModalDelete(null)}
                  title={t('modals.delete.title')}
                  variant="error"
                  actionText={t('modals.delete.action')}
                  onAction={() => deleteSubscription(subscription)}>
                  {t('modals.delete.message')}
                </Modal>
              </div>
            </Modal>
          </div>
        )}

        {!isList && (
          <div className="flex gap-2 items-center ">
            <button
              onClick={() => setIsOpenModalQR(subscription.id)}
              className="p-2 rounded-md bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
              <TbQrcode size={18} />
            </button>

            <Modal
              isOpen={isOpenModalQR === subscription.id}
              onClose={() => setIsOpenModalQR(null)}
              title={t('modals.qr.title')}
              variant="default">
              <div className="flex flex-col items-center gap-4 p-4">
                <div ref={qrRef} className="qr-code-container"></div>
                <div className="text-sm text-center">
                  {t('modals.qr.description')} (Happ, Straisand, ShadowRocket,
                  v2rayNG, FoXray...)
                </div>
              </div>
            </Modal>

            <button
              onClick={() => handleCopyUrl(subscription.subscriptionUrl)}
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
        )}

        {!isPublic && isList && (
          <div className="flex gap-2 items-center ">
            <HappDeepLinkButton
              subscriptionUrl={subscription.subscriptionUrl}
            />
            <Link
              href={`/tma/subscription/${subscription.id}`}
              className="flex gap-2 items-center justify-center p-2 rounded-md bg-[var(--primary)] text-[var(--on-primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] text-sm font-extrabold tracking-wider  ">
              <TbPlugConnected size={18} /> {t('connection')}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
