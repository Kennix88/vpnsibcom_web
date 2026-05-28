'use client'
import { authApiClient } from '@app/core/authApiClient'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Loader2, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'

export function FreePlanActivated() {
  const { user, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [activated, setActivated] = useState(false)
  const { setSubscriptions } = useSubscriptionsStore()

  if (!user || !user.isFreePlanAvailable) return null

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const getData = await authApiClient.freePlanActivated()
      if (!getData) return
      setUser(getData.user)
      setSubscriptions(getData.subscriptions)
      setActivated(true)
    } catch {
      toast.error('Не удалось активировать бонус')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="w-full rounded-2xl overflow-hidden font-mono"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(55,227,162,0.2)',
        boxShadow: '0 4px 24px rgba(55,227,162,0.08)',
      }}>
      {/* Header strip */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="block w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--success)' }}
        />
        <span
          className="text-[10px] tracking-widest uppercase"
          style={{ color: 'var(--success)', opacity: 0.8 }}>
          Бонус доступен
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4">
        {/* Promo text */}
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: 'rgba(55,227,162,0.12)',
              border: '1px solid rgba(55,227,162,0.25)',
            }}>
            <Gift size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className="text-sm font-bold leading-snug"
              style={{ color: 'var(--on-background)' }}>
              {user.trialGb ?? 0} ГБ бесплатного трафика
            </span>
            <span
              className="text-xs leading-snug"
              style={{ color: 'var(--on-background)', opacity: 0.5 }}>
              Бессрочно — без оплаты и привязки карты
            </span>
          </div>
        </div>

        {/* CTA button */}
        <motion.button
          onClick={handleClick}
          disabled={isLoading || activated}
          whileHover={isLoading || activated ? {} : { scale: 1.02, y: -1 }}
          whileTap={isLoading || activated ? {} : { scale: 0.97 }}
          className="relative w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold cursor-pointer overflow-hidden"
          style={{
            background: activated
              ? 'rgba(55,227,162,0.15)'
              : 'linear-gradient(135deg, rgba(55,227,162,0.22), rgba(55,227,162,0.12))',
            border: activated
              ? '1px solid rgba(55,227,162,0.4)'
              : '1px solid rgba(55,227,162,0.35)',
            color: 'var(--success)',
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading || activated ? 'not-allowed' : 'pointer',
            boxShadow: activated ? 'none' : '0 4px 18px rgba(55,227,162,0.15)',
            transition: 'opacity 150ms ease, box-shadow 200ms ease',
          }}>
          {/* Sheen */}
          {!activated && (
            <motion.span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  'linear-gradient(110deg, transparent 30%, rgba(55,227,162,0.07) 50%, transparent 70%)',
                  'linear-gradient(110deg, transparent 65%, rgba(55,227,162,0.07) 85%, transparent 105%)',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <Loader2 size={16} className="animate-spin" />
                Активация…
              </motion.span>
            ) : activated ? (
              <motion.span
                key="done"
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400 }}>
                <Zap size={16} />
                Активировано!
              </motion.span>
            ) : (
              <motion.span
                key="cta"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <Zap size={16} />
                Активировать бесплатно
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}
