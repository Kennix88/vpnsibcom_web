'use client'

/**
 * PremiumCTA — премиальный CTA-баннер для покупки/продления Telegram Premium.
 *
 * Разместить над <Subscription /> или над блоком "Устройства" в TMA.
 * Сам подтягивает нужный extension (authApiClient.getExtensions()) и сам
 * управляет модалкой оплаты — просто вставь <PremiumCTA /> куда нужно.
 *
 * Никаких преимуществ на самой кнопке не показываем намеренно — это зона
 * PremiumPurchase (модалка), кнопка только призывает к действию.
 */

import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import {
  SubscriptionExtensionsEnum,
  SubscriptionExtensionsWithConditionsInterface,
} from '@app/types/new-era.types'
import { motion } from 'framer-motion'
import { ChevronRight, Crown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import PremiumPurchase from './PremiumPurchase'

function toExtensionsArray(
  value: unknown,
): SubscriptionExtensionsWithConditionsInterface[] {
  return Array.isArray(value) ? value : []
}

/* skeleton, пока грузим extension — держит место, не мигает пусто/контент */
function PremiumCTASkeleton() {
  return (
    <div
      className="rounded-3xl h-[76px] animate-pulse"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  )
}

export function PremiumCTA() {
  const { user, setUser } = useUserStore()

  const [premiumExtension, setPremiumExtension] =
    useState<SubscriptionExtensionsWithConditionsInterface | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchPremiumExtension = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authApiClient.getExtensions()
      if (response && response.success) {
        const list = toExtensionsArray(response.extensions)
        const premium =
          list.find((e) => e.key === SubscriptionExtensionsEnum.PREMIUM) ?? null
        setPremiumExtension(premium)
        if (response.user) setUser(response.user)
      } else {
        setPremiumExtension(null)
      }
    } catch (err) {
      console.error('Failed to load premium extension', err)
      setPremiumExtension(null)
    } finally {
      setLoading(false)
    }
  }, [setUser])

  useEffect(() => {
    fetchPremiumExtension()
  }, [fetchPremiumExtension])

  const isPremiumActive = useMemo(() => {
    if (!user?.premiumExpiredAt) return false
    return new Date(user.premiumExpiredAt).getTime() > Date.now()
  }, [user?.premiumExpiredAt])

  if (loading) return <PremiumCTASkeleton />
  // Если по каким-то причинам условие PREMIUM не пришло с бэка — баннер лучше
  // не показывать, чем открыть модалку без данных о ценах/периодах.
  if (!premiumExtension) return null

  return (
    <>
      <motion.button
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.012 }}
        whileTap={{ scale: 0.98 }}
        className="group relative w-full overflow-hidden rounded-3xl p-[1.5px] cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, #febd04, #f5a623, #febd04, #ffd76a)',
          backgroundSize: '300% 300%',
        }}>
        {/* animated gradient border glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              'linear-gradient(135deg, #febd04, #f5a623, #febd04, #ffd76a)',
            backgroundSize: '300% 300%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />

        {/* inner surface */}
        <div
          className="relative flex items-center gap-3 rounded-[22px] px-4 py-3.5 overflow-hidden"
          style={{
            background:
              'linear-gradient(160deg, rgba(38,30,10,0.94), rgba(20,17,10,0.96))',
          }}>
          {/* ambient glow blob */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl"
            style={{ background: 'rgba(245,166,35,0.22)' }}
          />

          {/* shimmer sweep — soft, blurred, no hard diagonal edges */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
            <motion.div
              className="absolute top-1/2 left-0 w-[55%] aspect-square -translate-y-1/2"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 35%, transparent 68%)',
                filter: 'blur(10px)',
                transform: 'skewX(-20deg)',
              }}
              animate={{ x: ['-60%', '260%'] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                repeatDelay: 1.6,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* icon badge */}
          <motion.div
            className="relative flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
            style={{
              background: 'var(--star-gradient)',
              boxShadow: '0 0 0 rgba(245,166,35,0)',
            }}
            animate={{
              boxShadow: [
                '0 0 0px rgba(245,166,35,0.0)',
                '0 0 18px rgba(245,166,35,0.55)',
                '0 0 0px rgba(245,166,35,0.0)',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
            <motion.div
              style={{ color: 'var(--on-star)' }}
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                repeatDelay: 1.8,
                ease: 'easeInOut',
              }}>
              <Crown size={22} strokeWidth={2.2} />
            </motion.div>
          </motion.div>

          {/* text block */}
          <div className="relative flex flex-col gap-0.5 min-w-0 text-left grow">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[14px] font-bold font-mono tracking-tight truncate"
                style={{ color: '#ffe9b8' }}>
                {isPremiumActive ? 'Продлить Premium' : 'Оформить Premium'}
              </span>
              {/*{isPremiumActive && (
                <span
                  className="shrink-0 flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md"
                  style={{
                    background: 'rgba(55,227,162,0.16)',
                    color: 'var(--success)',
                  }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--success)',
                      boxShadow: '0 0 6px var(--success)',
                    }}
                  />
                  АКТИВЕН
                </span>
              )}*/}
            </div>
            <span
              className="text-[11px] font-mono"
              style={{ color: 'rgba(255,233,184,0.6)' }}>
              {isPremiumActive
                ? 'Продли, чтобы не потерять бонусы'
                : 'Сними лимиты подписки одним оформлением'}
            </span>
          </div>

          {/* CTA arrow */}
          <motion.div
            className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffe9b8',
            }}
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
            <ChevronRight size={16} strokeWidth={2.5} />
          </motion.div>
        </div>
      </motion.button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        // title="Premium Статус"
        variant="premium"
        showCancelButton={false}>
        <PremiumPurchase
          premiumExtension={premiumExtension}
          onSuccess={fetchPremiumExtension}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}
