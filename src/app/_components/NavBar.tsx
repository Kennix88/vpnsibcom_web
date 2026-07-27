'use client'

import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { ListChecks } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import Avatar from './Avatar'
import Currency from './Currency'

/* ─── Floating coin particle ─────────────────────────────────────── */
function CoinParticle({ delay }: { delay: number }) {
  return (
    <motion.div
      aria-hidden
      className="absolute pointer-events-none select-none font-bold text-[10px]"
      style={{
        color: 'var(--usdt)',
        left: `${30 + Math.random() * 40}%`,
        bottom: '100%',
        zIndex: 20,
      }}
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -22, scale: [0.6, 1, 0.9, 0.7] }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}>
      +$
    </motion.div>
  )
}

/* ─── Pulsing notification dot — переиспользуется на нескольких табах ── */
function NotifDot({ colorVar = 'var(--usdt)' }: { colorVar?: string }) {
  return (
    <span className="relative block w-1.5 h-1.5">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: colorVar }}
      />
      <motion.span
        className="absolute inset-0 rounded-full origin-center"
        style={{ background: colorVar }}
        animate={{ scale: [1, 1, 2.2], opacity: [0, 0.6, 0] }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeOut',
          times: [0, 0.15, 1],
        }}
      />
    </span>
  )
}

/* ─── Earn tab icon: animated USDT coin with glow ────────────────── */
function EarnIcon({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<number[]>([])

  useEffect(() => {
    if (isActive) return
    const fire = () => {
      setParticles([Date.now()])
      setTimeout(() => setParticles([]), 1600)
    }
    const init = setTimeout(fire, 3000)
    const interval = setInterval(fire, 5500)
    return () => {
      clearTimeout(init)
      clearInterval(interval)
    }
  }, [isActive])

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {particles.map((id) => (
          <CoinParticle key={id} delay={0} />
        ))}
      </AnimatePresence>

      {!isActive && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(80,175,149,0.28)', filter: 'blur(6px)' }}
          animate={{ opacity: [0.5, 1], scale: [0.9, 1.3] }}
          transition={{
            duration: 1.3,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
      )}

      <Currency w={18} type="usdt" />
    </div>
  )
}

/* ─── Tasks tab icon ─────────────────────────────────────────────── */
function TaskIcon({
  isActive,
  hasPending = true,
}: {
  isActive: boolean
  hasPending?: boolean
}) {
  return (
    <div className="relative flex items-center justify-center">
      {!isActive && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(245,166,35,0.24)', filter: 'blur(5px)' }}
          animate={{ opacity: [0.4, 0.9], scale: [0.85, 1.25] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
      )}
      <ListChecks size={18} strokeWidth={2.3} className="relative z-10" />
      {!isActive && hasPending && (
        <span className="absolute -top-1 -right-1 z-20">
          <NotifDot colorVar="var(--star)" />
        </span>
      )}
    </div>
  )
}

/* ─── Акцентная палитра по табам ─────────────────────────────────── */
const TAB_ACCENT: Record<string, { colorVar: string; rgb: string }> = {
  earn: { colorVar: 'var(--usdt)', rgb: '80,175,149' },
  tasks: { colorVar: 'var(--star)', rgb: '245,166,35' },
}
const DEFAULT_ACCENT = { colorVar: 'var(--primary)', rgb: '195,166,255' }

function accentFor(id: string) {
  return TAB_ACCENT[id] ?? DEFAULT_ACCENT
}

/* ─── NavBar ─────────────────────────────────────────────────────── */
export default function NavBar() {
  const t = useTranslations('navbar')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()

  const isEarnActive = location.includes('/friends')
  const isTasksActive = location.includes('/earning')

  const navItems = [
    {
      id: 'vpn',
      name: 'VPN',
      href: url,
      icon: (
        <Image
          src="/logo.png"
          alt="Logo"
          width={20}
          height={20}
          className="rounded-md"
        />
      ),
    },
    {
      id: 'tasks',
      name: 'Задачи',
      href: url + '/earning',
      icon: (isActive: boolean) => <TaskIcon isActive={isActive} />,
    },
    {
      id: 'earn',
      name: 'Заработать',
      href: url + '/friends',
      icon: (isActive: boolean) => <EarnIcon isActive={isActive} />,
      special: true,
    },
    {
      id: 'profile',
      name: t('profile'),
      href: url + '/profile',
      icon: <Avatar url={user?.photoUrl} w={20} className="cursor-pointer" />,
    },
  ]

  const isMainUrls =
    location.includes('/earning') ||
    location.includes('/tasks') ||
    location.includes('/games') ||
    location.includes('/friends') ||
    location.includes('/billing') ||
    location.includes('/settings') ||
    location.includes('/profile') ||
    location.includes('/subscription') ||
    location.includes('/payment') ||
    location.includes('/add-subscription') ||
    url === location

  if (!isMainUrls) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-2 pointer-events-none"
      style={{
        // safe-area снизу (home indicator) через нативный CSS env(),
        // работает и без tma.js — Telegram WebView его поддерживает
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
      }}>
      {/* Fade gradient */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, var(--background) 0%, transparent 100%)',
          opacity: 0.85,
        }}
      />

      <motion.nav
        className="relative pointer-events-auto flex items-center w-full max-w-md gap-0.5 px-1 py-1.5 rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface-container) 100%)',
          border: '1px solid var(--surface-strong-border)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}>
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.id === 'earn' && isEarnActive) ||
            (item.id === 'tasks' && isTasksActive)
          const isSpecial = item.special && !isActive
          const accent = accentFor(item.id)

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl active:scale-[0.93] overflow-visible"
              style={{
                color: isActive
                  ? 'var(--on-primary-container)'
                  : 'var(--on-surface-variant)',
                transition: 'color 200ms',
              }}>
              {/* ── Active pill ── */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      item.id === 'earn' || item.id === 'tasks'
                        ? `linear-gradient(135deg, rgba(${accent.rgb},0.22) 0%, rgba(${accent.rgb},0.1) 100%)`
                        : 'linear-gradient(135deg, var(--primary-container) 0%, color-mix(in srgb, var(--primary-container) 70%, var(--surface-container-highest)) 100%)',
                    boxShadow:
                      item.id === 'earn' || item.id === 'tasks'
                        ? `0 0 14px rgba(${accent.rgb},0.2)`
                        : '0 0 12px rgba(195,166,255,0.18)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              {/* ── Special earn tab: subtle idle glow border ── */}
              {isSpecial && (
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ border: '1px solid rgba(80,175,149,0.0)' }}
                  animate={{
                    borderColor: [
                      'rgba(80,175,149,0.0)',
                      'rgba(80,175,149,0.35)',
                    ],
                    boxShadow: [
                      '0 0 0px rgba(80,175,149,0)',
                      '0 0 12px rgba(80,175,149,0.18)',
                    ],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* ── Notification dot (earn tab, not active) ── */}
              {isSpecial && (
                <span className="absolute top-1.5 right-1.5 z-20">
                  <NotifDot colorVar="var(--usdt)" />
                </span>
              )}

              {/* ── Icon ── */}
              <div
                className="relative z-10"
                style={{
                  color: isActive
                    ? item.id === 'earn' || item.id === 'tasks'
                      ? accent.colorVar
                      : 'var(--primary)'
                    : 'var(--on-surface-variant)',
                  filter: isActive
                    ? item.id === 'earn' || item.id === 'tasks'
                      ? `drop-shadow(0 0 7px rgba(${accent.rgb},0.55))`
                      : 'drop-shadow(0 0 6px rgba(195,166,255,0.45))'
                    : isSpecial
                      ? 'drop-shadow(0 0 4px rgba(80,175,149,0.3))'
                      : 'none',
                  transition: 'filter 300ms',
                }}>
                {typeof item.icon === 'function'
                  ? item.icon(isActive)
                  : item.icon}
              </div>

              {/* ── Label ── */}
              <span
                className="relative z-10 w-full text-center font-mono text-[8.5px] leading-none font-bold tracking-tight truncate px-0.5"
                style={{
                  color: isActive
                    ? item.id === 'earn' || item.id === 'tasks'
                      ? accent.colorVar
                      : 'var(--on-primary-container)'
                    : isSpecial
                      ? 'var(--usdt)'
                      : 'var(--on-surface-variant)',
                  opacity: isActive ? 1 : isSpecial ? 0.9 : 0.6,
                  transition: 'color 200ms, opacity 200ms',
                }}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
