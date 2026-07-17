'use client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { HiShieldCheck } from 'react-icons/hi2'
import SocialButtons from './SocialButtons'

// Rotates through connection-flavored status lines instead of a single
// static "Инициализация..." — ties the wait directly to what a VPN app is
// actually doing, and gives the eye something to read while it waits.
const STATUS_MESSAGES = [
  'Устанавливаем защищённое соединение',
  'Подбираем ближайший сервер',
  'Шифруем канал связи',
  'Почти готово',
]

function useStatusMessage(reduceMotion: boolean) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 1900)
    return () => clearInterval(id)
  }, [reduceMotion])

  return STATUS_MESSAGES[index]
}

function SpinnerRings({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative w-[64px] h-[64px]">
      {/* Radar sweep — the signature element, ties the spinner to "scanning for a server" */}
      {!reduceMotion && (
        <motion.div
          className="absolute inset-[-16px] rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--accent-network) 45%, transparent) 26deg, transparent 58deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'var(--primary)',
          borderRightColor: 'var(--primary-container)',
        }}
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute inset-[11px] rounded-full border-[1.5px] border-transparent"
        style={{
          borderBottomColor: 'var(--accent-network)',
          borderLeftColor: 'var(--accent-network)',
        }}
        animate={reduceMotion ? {} : { rotate: -360 }}
        transition={{ duration: 0.95, repeat: Infinity, ease: 'linear' }}
      />
      {/* Shield glyph at the center — reinforces "secure connection" over a bare dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex items-center justify-center"
          style={{ color: 'var(--primary)' }}
          animate={
            reduceMotion
              ? {}
              : {
                  scale: [1, 1.12, 1],
                  filter: [
                    'drop-shadow(0 0 0px rgba(195,166,255,0))',
                    'drop-shadow(0 0 6px rgba(195,166,255,0.6))',
                    'drop-shadow(0 0 0px rgba(195,166,255,0))',
                  ],
                }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <HiShieldCheck size={20} />
        </motion.div>
      </div>
    </div>
  )
}

const Loader = () => {
  const reduceMotion = useReducedMotion() ?? false
  const status = useStatusMessage(reduceMotion)

  return (
    <div
      className="relative flex flex-col justify-between items-center min-h-screen px-4 pb-4 pt-4 overflow-hidden w-full max-w-full"
      style={{ background: 'var(--background)', color: 'var(--on-surface)' }}>
      {/* ── Background glows ── */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2
                   w-[360px] h-[360px] rounded-full blur-[100px] opacity-[0.18]"
        style={{ background: 'var(--primary)' }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 -right-12
                   w-[220px] h-[220px] rounded-full blur-[70px] opacity-[0.1]"
        style={{ background: 'var(--accent-network)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0
                   w-[180px] h-[180px] rounded-full blur-[60px] opacity-[0.07]"
        style={{ background: 'var(--info)' }}
      />

      {/* ── Logo + Brand ── */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}>
        {/* Glowing logo ring */}
        <motion.div
          className="relative"
          animate={
            reduceMotion
              ? {}
              : {
                  filter: [
                    'drop-shadow(0 0 10px rgba(195,166,255,0.25))',
                    'drop-shadow(0 0 26px rgba(195,166,255,0.55))',
                    'drop-shadow(0 0 10px rgba(195,166,255,0.25))',
                  ],
                }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Decorative ring behind logo */}
          <div
            className="absolute inset-[-6px] rounded-[28px] opacity-30"
            style={{
              background:
                'linear-gradient(135deg, var(--primary-container), transparent 60%)',
              border: '1px solid var(--primary-container)',
            }}
          />
          <Image
            src="/logo.png"
            alt="VPNsib logo"
            width={88}
            height={88}
            priority
            className="relative rounded-2xl"
          />
        </motion.div>

        {/* Brand name */}
        <div className="text-center">
          <motion.div
            className="font-mono font-bold text-[22px] tracking-tight leading-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}>
            VPN
            <span style={{ color: 'var(--primary)' }}>sib</span>
          </motion.div>

          {/* Rotating connection status — replaces the static "Инициализация..." */}
          <div className="h-4 mt-1.5 relative w-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={status}
                className="font-mono text-[10px] tracking-[0.14em] uppercase absolute"
                style={{ color: 'var(--on-surface-variant)' }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}>
                {status}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Spinner ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 0.4, ease: [0.2, 0, 0, 1] }}>
        <SpinnerRings reduceMotion={reduceMotion} />
      </motion.div>

      {/* ── Social buttons ── */}
      <motion.div
        className="w-full flex flex-col items-center max-w-2xl"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5, ease: [0.2, 0, 0, 1] }}>
        <motion.p
          className="text-center font-mono text-[10px] tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--on-surface-variant)' }}
          animate={
            reduceMotion ? { opacity: 0.4 } : { opacity: [0.25, 0.5, 0.25] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          Пока ждёшь
        </motion.p>
        <SocialButtons />
      </motion.div>
    </div>
  )
}

export default Loader
