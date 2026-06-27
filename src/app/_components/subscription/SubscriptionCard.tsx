'use client'

/**
 * SubscriptionCard — карточка подписки.
 * Заменяет SubscriptionElement.tsx.
 *
 * Изменения:
 *  - Исправлен рендер QR‑кода (CSS‑переменные → hex‑цвета)
 *  - Переработан раздел «Подключить» → вынесен в <ConnectGuide />
 *  - Упрощён и визуально улучшен header / body / footer
 *  - Добавлена секция «Действия» в виде bottom‑sheet модала
 */

import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { useLocale } from '@app/hooks/useLocale'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { formatBytes } from '@app/utils/format-bytes.util'
import limitLengthString from '@app/utils/limit-length-string.util'
import { differenceInMinutes, intlFormat } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Copy, ExternalLink, Smartphone, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import QRCodeStyling from 'qr-code-styling'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BiServer } from 'react-icons/bi'
import { FaArrowRotateRight, FaClockRotateLeft } from 'react-icons/fa6'
import { SiAdobeindesign } from 'react-icons/si'
import { TbPlugConnected, TbQrcode } from 'react-icons/tb'
import Modal from '../Modal'
import ConnectGuide from './ConnectGuide'
import EditName from './EditName'
import FormatPeriod from './FromatPeriod'
import HappDeepLinkButton from './HappDeepLinkButton'

/* ─────────────────────────── palette helpers ───────────────────────────
   QR‑библиотека не умеет резолвить CSS‑переменные — передаём hex напрямую.
   Цвета взяты из design‑tokens (:root).
*/
const QR_COLORS = {
  dots: '#c3a6ff', // --primary
  background: '#080608', // --surface-container-lowest
  cornerSquare: '#d6cfe6', // --secondary
  cornerDot: '#efb8c8', // --tertiary
} as const

/* ───────────────────────────── sub‑components ───────────────────────── */

function OnlinePulse({ online }: { online: boolean }) {
  const color = online ? 'var(--success)' : 'var(--error)'
  return (
    <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
      <span
        className="w-2 h-2 rounded-full block"
        style={{ background: color }}
      />
      {online && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
          animate={{ scale: [1, 2.4, 2.4], opacity: [0.5, 0.08, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-2.5 px-4 text-xs"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span
        className="flex items-center gap-1.5"
        style={{ color: 'var(--on-surface-variant)' }}>
        <Icon size={12} />
        {label}
      </span>
      <span
        className="font-mono font-medium"
        style={{ color: 'var(--on-surface)' }}>
        {value}
      </span>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  tone = 'neutral',
  disabled,
  fullWidth,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'neutral' | 'primary' | 'warning' | 'error' | 'success'
  disabled?: boolean
  fullWidth?: boolean
}) {
  const s = {
    primary: {
      bg: 'rgba(195,166,255,0.12)',
      border: 'rgba(195,166,255,0.22)',
      color: 'var(--primary)',
    },
    warning: {
      bg: 'rgba(255,171,64,0.12)',
      border: 'rgba(255,171,64,0.25)',
      color: 'var(--warning)',
    },
    error: {
      bg: 'rgba(255,107,102,0.12)',
      border: 'rgba(255,107,102,0.25)',
      color: 'var(--error)',
    },
    success: {
      bg: 'rgba(55,227,162,0.10)',
      border: 'rgba(55,227,162,0.20)',
      color: 'var(--success)',
    },
    neutral: {
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      color: 'var(--on-surface-variant)',
    },
  }[tone]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer${fullWidth ? ' w-full justify-center' : ''}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        opacity: disabled ? 0.45 : 1,
      }}>
      {children}
    </motion.button>
  )
}

/* ──────────────────────────── QR modal ─────────────────────────────── */

function QRModal({
  isOpen,
  onClose,
  url,
  title,
  description,
}: {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
  description?: string
}) {
  const qrRef = useRef<HTMLDivElement>(null)

  /* Рендерим QR только когда модал открыт и контейнер смонтирован */
  const renderQR = useCallback(() => {
    if (!qrRef.current || !url) return
    qrRef.current.innerHTML = ''
    const qr = new QRCodeStyling({
      width: 260,
      height: 260,
      type: 'svg',
      data: url,
      image: '/logo.png',
      dotsOptions: { color: QR_COLORS.dots, type: 'rounded' },
      backgroundOptions: { color: QR_COLORS.background },
      cornersSquareOptions: {
        color: QR_COLORS.cornerSquare,
        type: 'extra-rounded',
      },
      cornersDotOptions: { color: QR_COLORS.cornerDot, type: 'dot' },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
        hideBackgroundDots: true,
        imageSize: 0.28,
      },
    })
    qr.append(qrRef.current)
  }, [url])

  /* Небольшой delay чтобы DOM‑контейнер точно был прикреплён */
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(renderQR, 50)
    return () => clearTimeout(t)
  }, [isOpen, renderQR])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-4 p-4">
        {/* QR wrapper — фиксированный размер предотвращает прыжки */}
        <div
          className="flex items-center justify-center rounded-2xl overflow-hidden"
          style={{ width: 260, height: 260, background: QR_COLORS.background }}>
          <div ref={qrRef} />
        </div>
        {description && (
          <p
            className="text-sm text-center"
            style={{ color: 'var(--on-surface)', opacity: 0.55 }}>
            {description}
          </p>
        )}
      </div>
    </Modal>
  )
}

/* ─────────────────────────── main component ─────────────────────────── */

export default function SubscriptionCard({
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
  const copy = useCopyToClipboard()

  /* ── UI state ── */
  const [expanded, setExpanded] = useState(isDefaultOpen)
  const [connectOpen, setConnectOpen] = useState(isDefaultOpen)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  /* ── derived ── */
  const isOnline = subscription.onlineAt
    ? differenceInMinutes(new Date(), new Date(subscription.onlineAt)) < 2
    : false

  const isActive = subscription.isActive
  const activeRgb = isActive ? '55,227,162' : '255,107,102'
  const activeVar = isActive ? 'var(--success)' : 'var(--error)'

  const trafficPct = useMemo(() => {
    if (!subscription.dataLimit) return 0
    return Math.min(
      100,
      (subscription.usedTraffic / subscription.dataLimit) * 100,
    )
  }, [subscription.dataLimit, subscription.usedTraffic])

  const trafficColor =
    trafficPct > 85
      ? 'var(--error)'
      : trafficPct > 60
        ? 'var(--warning)'
        : 'var(--primary)'

  const resetLabel =
    (
      {
        [TrafficResetEnum.DAY]: t('trafficReset.daily'),
        [TrafficResetEnum.WEEK]: t('trafficReset.weekly'),
        [TrafficResetEnum.MONTH]: t('trafficReset.monthly'),
        [TrafficResetEnum.YEAR]: t('trafficReset.yearly'),
      } as Partial<Record<TrafficResetEnum, string>>
    )[subscription.trafficReset as TrafficResetEnum] ?? ''

  const hasPeriodInfo =
    subscription.period !== SubscriptionPeriodEnum.INDEFINITELY &&
    subscription.period !== SubscriptionPeriodEnum.TRIAL &&
    subscription.period !== SubscriptionPeriodEnum.TRAFFIC &&
    subscription.plan.key !== PlansEnum.TRAFFIC &&
    subscription.plan.key !== PlansEnum.TRIAL

  /* ── render ── */
  return (
    <motion.div
      key={subscription.id}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: `1px solid rgba(${activeRgb},0.14)`,
        boxShadow: `0 4px 24px rgba(${activeRgb},0.06)`,
      }}>
      {/* ─────── Header ─────── */}
      <div
        className="flex items-center gap-3 px-3 py-3"
        style={{
          background: `rgba(${activeRgb},0.05)`,
          borderBottom: `1px solid rgba(${activeRgb},0.10)`,
        }}>
        {/* Status dot */}
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `rgba(${activeRgb},0.12)`,
            border: `1px solid rgba(${activeRgb},0.2)`,
          }}>
          <OnlinePulse online={isOnline} />
        </div>

        {/* Name + badges */}
        <div className="grow min-w-0">
          <EditName
            name={limitLengthString(subscription.name, 24)}
            isEdit={!isPublic}
            subscriptionId={subscription.id}
            isPublic={isPublic}
          />
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-px rounded"
              style={{
                background: 'var(--tertiary-container)',
                color: 'var(--on-tertiary-container)',
              }}>
              {subscription.plan.name}
            </span>
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-px rounded"
              style={{
                background: isActive
                  ? 'rgba(55,227,162,0.12)'
                  : 'rgba(255,107,102,0.12)',
                color: activeVar,
              }}>
              {isActive ? 'Активна' : 'Не активна'}
            </span>
          </div>
        </div>

        {/* Expand toggle (list mode) */}
        {!isPublic && isList && (
          <motion.button
            onClick={() => {
              const next = !expanded
              setExpanded(next)
              setConnectOpen(next)
            }}
            whileTap={{ scale: 0.92 }}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--on-surface-variant)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22 }}>
              <ChevronDown size={15} />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* ─────── Body (collapsible) ─────── */}
      <AnimatePresence initial={false}>
        {(isPublic || expanded) && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden">
            {/* Copy ID */}
            <button
              onClick={() => copy(subscription.id)}
              className="flex items-center justify-between gap-2 w-full px-4 py-2.5 text-xs cursor-pointer"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span
                className="flex items-center gap-1.5"
                style={{ color: 'var(--on-surface-variant)' }}>
                <SiAdobeindesign size={11} /> ID
              </span>
              <span
                className="flex items-center gap-1.5 font-mono"
                style={{ color: 'var(--on-surface)', opacity: 0.6 }}>
                {limitLengthString(subscription.id, 38)}
                <Copy size={10} />
              </span>
            </button>

            {/* Traffic section */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--on-surface-variant)' }}>
                  <Zap size={12} />
                  {t('traffic')}
                </span>
                {(subscription.dataLimit ?? 0) > 0 &&
                  !subscription.isUnlimitTraffic &&
                  trafficPct > 0 && (
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: trafficColor }}>
                      {Math.round(trafficPct)}%
                    </span>
                  )}
              </div>

              {/* Bar */}
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${trafficPct}%` }}
                  transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
                  style={{ background: trafficColor }}
                />
              </div>

              <div
                className="flex justify-between mt-1.5 text-[11px] font-mono"
                style={{ color: 'var(--on-surface)', opacity: 0.4 }}>
                <span className="truncate">
                  {subscription.dataLimit && !subscription.isUnlimitTraffic
                    ? `${formatBytes(subscription.usedTraffic)} / ${formatBytes(subscription.dataLimit)} · ${resetLabel}`
                    : 'Безлимит'}
                </span>
                <span className="shrink-0 ml-3">
                  {t('inTotal')}:{' '}
                  {formatBytes(subscription.lifeTimeUsedTraffic)}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <Row
              icon={BiServer}
              label={t('servers')}
              value={
                subscription.isAllBaseServers &&
                !subscription.isAllPremiumServers
                  ? t('allBase')
                  : subscription.isAllBaseServers &&
                      subscription.isAllPremiumServers
                    ? t('fullServers')
                    : `${t('base')} ${subscription.baseServersCount}${subscription.premiumServersCount > 0 ? ` / ${t('premium')} ${subscription.premiumServersCount}` : ''}`
              }
            />
            <Row
              icon={Smartphone}
              label={t('devices')}
              value={subscription.devicesCount}
            />

            {hasPeriodInfo && (
              <>
                <Row
                  icon={FaArrowRotateRight}
                  label={t('period')}
                  value={
                    <span className="flex items-center gap-1.5">
                      <FormatPeriod period={subscription.period} />
                      {subscription.periodMultiplier > 1 && (
                        <span
                          className="px-1.5 py-px rounded text-[10px] font-bold"
                          style={{
                            background: 'rgba(195,166,255,0.15)',
                            color: 'var(--primary)',
                          }}>
                          ×{subscription.periodMultiplier}
                        </span>
                      )}
                    </span>
                  }
                />
                {isActive && subscription.expiredAt && (
                  <Row
                    icon={FaClockRotateLeft}
                    label={t('expires')}
                    value={intlFormat(
                      new Date(subscription.expiredAt),
                      {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      },
                      { locale },
                    )}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Footer ─────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
        style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        {/* Left: actions menu (private only) */}
        {!isPublic && (
          <div className="flex items-center gap-2">
            {/* Actions modal trigger */}
            <ActionBtn tone="neutral" onClick={() => setActionsOpen(true)}>
              ⠿ {t('actions')}
            </ActionBtn>

            <Modal
              isOpen={actionsOpen}
              onClose={() => setActionsOpen(false)}
              title={t('actions')}>
              <div className="flex flex-col gap-3 p-1">
                {/* URL actions */}
                <div
                  className="rounded-2xl p-3 flex flex-wrap gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <ActionBtn
                    tone="primary"
                    onClick={() => {
                      setActionsOpen(false)
                      setQrOpen(true)
                    }}>
                    <TbQrcode size={15} /> QR‑код
                  </ActionBtn>
                  <ActionBtn
                    tone="primary"
                    onClick={() => copy(subscription.subscriptionUrl)}>
                    <Copy size={13} /> Копировать ссылку
                  </ActionBtn>
                  <Link
                    href={subscription.subscriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold font-mono"
                    style={{
                      background: 'rgba(195,166,255,0.1)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(195,166,255,0.2)',
                    }}>
                    <ExternalLink size={13} /> Открыть в браузере
                  </Link>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* Right: public quick actions */}
        {!isList && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setQrOpen(true)}
              className="p-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--on-surface-variant)',
              }}>
              <TbQrcode size={17} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => copy(subscription.subscriptionUrl)}
              className="p-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--on-surface-variant)',
              }}>
              <Copy size={15} />
            </motion.button>
            <Link
              href={subscription.subscriptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--on-surface-variant)',
              }}>
              <ExternalLink size={17} />
            </Link>
          </div>
        )}

        {/* Right: connect button (list mode, private) */}
        {!isPublic && isList && (
          <div className="flex gap-2 items-center">
            <HappDeepLinkButton
              subscriptionUrl={subscription.subscriptionUrl}
            />
            {!connectOpen && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setExpanded(true)
                  setConnectOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold font-mono cursor-pointer"
                style={{
                  background: 'var(--primary-gradient)',
                  color: 'var(--on-primary)',
                  boxShadow: '0 2px 14px var(--primary-glow)',
                }}>
                <TbPlugConnected size={15} />
                {t('connection')}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* ─────── QR modal ─────── */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        url={subscription.subscriptionUrl}
        title={t('modals.qr.title')}
        description="Отсканируйте QR‑код в приложении Happ"
      />

      {/* ─────── Connect guide ─────── */}
      <AnimatePresence initial={false}>
        {(isPublic || connectOpen) && (
          <ConnectGuide
            subscriptionUrl={subscription.subscriptionUrl}
            isActive={subscription.isActive}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
