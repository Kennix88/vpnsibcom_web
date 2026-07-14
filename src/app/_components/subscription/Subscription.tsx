'use client'

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TbClock,
  TbCrown,
  TbGift,
  TbPlus,
  TbRefresh,
  TbWifi,
} from 'react-icons/tb'
import TooltipWrapper from '../TooltipWrapper' // путь скорректируй под реальное расположение
import { AddDeviceModal } from './AddDeviceModal'
import { DayStrip } from './DayStrip'
import { DeviceRow } from './DeviceRow'
import { formatPremiumTimeLeft, formatRelative } from './format.util'
import { TrafficBar } from './TrafficBar'
import { NewEraSubWithTmaInterface, RemnaUserStatus } from './types'

/* ─── status presentation ────────────────────────────────────────── */
const STATUS_CFG: Record<
  RemnaUserStatus,
  { label: string; rgb: string; color: string }
> = {
  ACTIVE: { label: 'Активна', rgb: '55,227,162', color: 'var(--success)' },
  LIMITED: {
    label: 'Лимит исчерпан',
    rgb: '255,171,64',
    color: 'var(--warning)',
  },
  EXPIRED: { label: 'Истекла', rgb: '255,107,102', color: 'var(--error)' },
  DISABLED: { label: 'Отключена', rgb: '158,151,168', color: 'var(--outline)' },
}

/* ─── skeleton shown while first request is in flight ───────────── */
function SubscriptionSkeleton() {
  return (
    <div
      className="rounded-3xl p-5 animate-pulse"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div
        className="h-4 w-32 rounded-full mb-4"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
      <div
        className="h-2 w-full rounded-full mb-2"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      <div
        className="h-2 w-full rounded-full mb-6"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      <div
        className="h-10 w-full rounded-xl"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
    </div>
  )
}

/* ─── empty state — request failed ──────────────────────────────── */
function NoSubscription({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
      <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        Не удалось загрузить подписку
      </span>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onRetry}
        className="px-4 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer"
        style={{
          background: 'rgba(195,166,255,0.12)',
          color: 'var(--primary)',
          border: '1px solid rgba(195,166,255,0.25)',
        }}>
        Повторить попытку
      </motion.button>
    </div>
  )
}

/* ─── first-time state — user has never had a subscription ─────── */
function ActivateFreeSubscription({
  onActivate,
  activating,
}: {
  onActivate: () => void
  activating: boolean
}) {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center gap-3 rounded-3xl p-6 text-center"
      style={{
        background:
          'linear-gradient(160deg, rgba(195,166,255,0.12), var(--surface-container))',
        border: '1px solid rgba(195,166,255,0.22)',
      }}>
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl"
        style={{ background: 'rgba(195,166,255,0.18)' }}
      />
      <div
        className="relative flex items-center justify-center w-14 h-14 rounded-2xl"
        style={{
          background: 'rgba(195,166,255,0.14)',
          color: 'var(--primary)',
        }}>
        <TbGift size={26} />
      </div>
      <div className="relative flex flex-col gap-1">
        <span
          className="text-base font-bold font-mono"
          style={{ color: 'var(--on-surface)' }}>
          Подписки ещё нет
        </span>
        <span
          className="text-sm max-w-[280px]"
          style={{ color: 'var(--on-surface-variant)' }}>
          Активируйте первую подписку бесплатно и подключите устройство прямо
          сейчас
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onActivate}
        disabled={activating}
        className="relative flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold font-mono cursor-pointer disabled:opacity-60"
        style={{
          background:
            'linear-gradient(135deg, var(--primary-deep), var(--primary))',
          color: 'var(--on-primary)',
        }}>
        <motion.span
          animate={activating ? { rotate: 360 } : { rotate: 0 }}
          transition={
            activating
              ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
              : undefined
          }>
          <TbGift size={17} />
        </motion.span>
        {activating ? 'Активируем…' : 'Активировать бесплатно'}
      </motion.button>
    </div>
  )
}

/* ─── main ────────────────────────────────────────────────────────── */
export function Subscription() {
  const { user, setUser } = useUserStore()
  const [subscription, setSubscription] =
    useState<NewEraSubWithTmaInterface | null>(null)
  const [isNoSub, setIsNoSub] = useState(false)
  const [loading, setLoading] = useState(true)
  const [renewing, setRenewing] = useState(false)
  const [activating, setActivating] = useState(false)
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [failed, setFailed] = useState(false)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const response = await authApiClient.getSubscription()
      if (response && response.success) {
        setSubscription(response.subscription)
        setIsNoSub(Boolean(response.subscription.isNoSub))
        setUser(response.user)
      } else {
        setSubscription(null)
        setFailed(true)
      }
    } catch (err) {
      console.error('Failed to load Subscription', err)
      setSubscription(null)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [setUser])

  const renewSubscription = useCallback(async () => {
    if (renewing) return
    setRenewing(true)
    try {
      const response = await authApiClient.renewSubscription()
      if (response && response.success) {
        setSubscription(response.subscription)
        setIsNoSub(Boolean(response.subscription.isNoSub))
        setUser(response.user)
      }
    } catch (err) {
      console.error('Failed to renew Subscription', err)
    } finally {
      setRenewing(false)
    }
  }, [setUser, renewing])

  // Активация первой бесплатной подписки — переиспользует тот же эндпоинт
  // продления: на бэке "продлить, когда подписки ещё нет" == "выдать первую".
  // Если у вас заведён отдельный метод — просто замени вызов здесь.
  const activateFreeSubscription = useCallback(async () => {
    if (activating) return
    setActivating(true)
    try {
      const response = await authApiClient.renewSubscription()
      if (response && response.success) {
        setSubscription(response.subscription)
        setIsNoSub(Boolean(response.subscription.isNoSub))
        setUser(response.user)
      }
    } catch (err) {
      console.error('Failed to activate free subscription', err)
    } finally {
      setActivating(false)
    }
  }, [setUser, activating])

  const deleteDevice = useCallback(
    async (hwid: string) => {
      try {
        const response = await authApiClient.deleteDevice(hwid)
        if (response && response.success) {
          setSubscription(response.subscription)
          setUser(response.user)
        }
      } catch (err) {
        console.error('Failed to delete device', err)
      }
    },
    [setUser],
  )

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const isPremiumActive = useMemo(() => {
    if (!user?.premiumExpiredAt) return false
    return new Date(user.premiumExpiredAt).getTime() > Date.now()
  }, [user?.premiumExpiredAt])

  const premiumTimeLeft = useMemo(() => {
    if (!isPremiumActive || !user?.premiumExpiredAt) return null
    const ms = new Date(user.premiumExpiredAt).getTime() - Date.now()
    return formatPremiumTimeLeft(ms)
  }, [isPremiumActive, user?.premiumExpiredAt])

  if (loading) return <SubscriptionSkeleton />
  if (failed || !subscription)
    return <NoSubscription onRetry={fetchSubscription} />
  if (isNoSub) {
    return (
      <ActivateFreeSubscription
        onActivate={activateFreeSubscription}
        activating={activating}
      />
    )
  }

  const statusCfg = STATUS_CFG[subscription.status]
  const isExpired = subscription.status === 'EXPIRED'
  const accentRgb = isPremiumActive ? '245,166,35' : statusCfg.rgb

  const msLeft = subscription.expiredAt
    ? new Date(subscription.expiredAt).getTime() - Date.now()
    : null
  const isCritical =
    !isExpired && msLeft !== null && msLeft > 0 && msLeft <= 2 * 86_400_000

  const devicesCount = subscription.devices.length
  const devicesFull = devicesCount >= subscription.devicesLimit

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Status card ─────────────────────────────────────────── */}
      <div
        className={clsx(
          'relative overflow-hidden rounded-3xl px-5 pb-5',
          // Премиум-плашка абсолютно спозиционирована в углу — добавляем
          // запас сверху, чтобы она не наезжала на статус и "в сети".
          isPremiumActive ? 'pt-10' : 'pt-5',
        )}
        style={{
          background: isPremiumActive
            ? 'linear-gradient(160deg, rgba(245,166,35,0.1), var(--surface-container))'
            : 'var(--surface-container)',
          border: `1px solid ${
            isPremiumActive ? 'rgba(245,166,35,0.28)' : 'rgba(255,255,255,0.06)'
          }`,
        }}>
        {/* ambient glow */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl"
          style={{ background: `rgba(${accentRgb},0.16)` }}
        />

        {/* premium ribbon */}
        {isPremiumActive && (
          <div
            className="absolute top-0 right-0 flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-bl-2xl font-mono"
            style={{
              background: 'linear-gradient(135deg, #f5a623, #febd04)',
              color: 'var(--on-star, #3a2e00)',
            }}>
            <div className="flex items-center gap-1.5">
              <TbCrown size={15} />
              <span className="text-[13px] font-bold tracking-tight">
                Premium
              </span>
            </div>

            {premiumTimeLeft && (
              <>
                <span
                  className="w-px h-3.5 rounded-full"
                  style={{ background: 'rgba(58,46,0,0.3)' }}
                />
                <div className="flex items-center gap-1">
                  <TbClock size={12} className="opacity-70" />
                  <span className="text-[12px] font-semibold opacity-85 whitespace-nowrap">
                    {premiumTimeLeft}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="relative flex flex-col gap-4">
          {/* header row */}
          <div className="flex items-center justify-between gap-2 pr-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: statusCfg.color,
                  boxShadow: `0 0 8px ${statusCfg.color}`,
                }}
              />
              <span
                className="text-sm font-bold font-mono"
                style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
              <TbWifi size={13} />
              {formatRelative(subscription.onlineAt)}
            </div>
          </div>

          {/* day strip */}
          <DayStrip
            totalDays={subscription.days}
            expiredAt={subscription.expiredAt}
            isExpired={isExpired}
            accentRgb={accentRgb}
          />

          {/* traffic */}
          {(subscription.isUnlimitTraffic || subscription.dataLimitBytes) && (
            <TrafficBar
              isUnlimited={subscription.isUnlimitTraffic}
              usedBytes={subscription.usedTrafficBytes}
              limitBytes={subscription.dataLimitBytes}
              lifetimeUsedBytes={subscription.lifetimeUsedTrafficBytes}
              accentRgb={accentRgb}
            />
          )}

          {/* renew button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={renewSubscription}
            disabled={renewing}
            animate={
              isCritical || isExpired
                ? {
                    boxShadow: [
                      '0 0 0 rgba(255,107,102,0)',
                      '0 0 22px rgba(255,107,102,0.45)',
                      '0 0 0 rgba(255,107,102,0)',
                    ],
                  }
                : {}
            }
            transition={
              isCritical || isExpired
                ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold font-mono cursor-pointer disabled:opacity-60"
            style={{
              background:
                isCritical || isExpired
                  ? 'var(--error)'
                  : isPremiumActive
                    ? 'linear-gradient(135deg, #f5a623, #febd04)'
                    : 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
              color:
                isCritical || isExpired
                  ? 'var(--on-error)'
                  : isPremiumActive
                    ? 'var(--on-star, #3a2e00)'
                    : 'var(--on-primary)',
            }}>
            <motion.span
              animate={renewing ? { rotate: 360 } : { rotate: 0 }}
              transition={
                renewing
                  ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                  : undefined
              }>
              <TbRefresh size={17} />
            </motion.span>
            {renewing ? 'Продлеваем…' : 'Восполнить бесплатно'}
          </motion.button>
        </div>
      </div>

      {/* ── Devices ──────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-5"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold font-mono"
              style={{ color: 'var(--on-surface)' }}>
              Устройства
            </span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                background: devicesFull
                  ? 'rgba(255,171,64,0.14)'
                  : 'rgba(255,255,255,0.06)',
                color: devicesFull
                  ? 'var(--warning)'
                  : 'var(--on-surface-variant)',
              }}>
              {devicesCount}/{subscription.devicesLimit}
            </span>
          </div>

          <TooltipWrapper
            color="default"
            placement="left"
            prompt="При превышении лимита в первую очередь удаляются устройства, которые дольше всех не использовались. Самое первое подключённое устройство удаляется последним.">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-full cursor-help"
              style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
              <TbClock size={14} />
            </div>
          </TooltipWrapper>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <AnimatePresence initial={false}>
            {subscription.devices.map((device, i) => (
              <DeviceRow
                key={device.hwid}
                device={device}
                index={i}
                isOldest={i === 0}
                onDelete={deleteDevice}
              />
            ))}
          </AnimatePresence>

          {devicesCount === 0 && (
            <div
              className="flex flex-col items-center gap-1 py-6 text-center"
              style={{ color: 'var(--on-surface-variant)' }}>
              <span className="text-sm">Пока нет подключённых устройств</span>
              <span className="text-xs opacity-70">
                Нажмите кнопку ниже, чтобы подключить первое
              </span>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setAddDeviceOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold font-mono cursor-pointer"
          style={{
            background: 'rgba(255,140,66,0.12)',
            color: 'var(--cta)',
            border: '1px solid rgba(255,140,66,0.22)',
          }}>
          <TbPlus size={16} />
          Подключить устройство
        </motion.button>

        {devicesFull && (
          <p
            className="text-[11px] text-center mt-2"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.65 }}>
            Лимит устройств достигнут — при подключении нового будет удалено
            самое давно неиспользуемое
          </p>
        )}
      </div>

      <AddDeviceModal
        isOpen={addDeviceOpen}
        onClose={() => setAddDeviceOpen(false)}
        subscriptionUrl={subscription.subscriptionUrl ?? ''}
        isActive={subscription.status === 'ACTIVE'}
      />
    </div>
  )
}
