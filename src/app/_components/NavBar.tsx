'use client'

import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
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

/* ─── Pulsing notification dot ───────────────────────────────────── */
function NotifDot() {
  return (
    <span className="relative block w-2 h-2">
      {/* center dot */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: 'var(--usdt)' }}
      />

      {/* pulse */}
      <motion.span
        className="absolute inset-0 rounded-full origin-center"
        style={{ background: 'var(--usdt)' }}
        animate={{
          scale: [1, 2.2],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    </span>
  )
}

/* ─── Earn tab icon: animated USDT coin with glow ────────────────── */
function EarnIcon({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<number[]>([])

  /* Выстреливаем монетки каждые ~4 с, только если таб не активен */
  useEffect(() => {
    if (isActive) return
    const fire = () => {
      setParticles([Date.now()])
      setTimeout(() => setParticles([]), 1600)
    }
    // первый залп через 3 с после монтирования
    const init = setTimeout(fire, 3000)
    const interval = setInterval(fire, 5500)
    return () => {
      clearTimeout(init)
      clearInterval(interval)
    }
  }, [isActive])

  return (
    <div className="relative flex items-center justify-center">
      {/* Частицы */}
      <AnimatePresence>
        {particles.map((id) => (
          <CoinParticle key={id} delay={0} />
        ))}
      </AnimatePresence>

      {/* Coin ring glow — только не-активное состояние */}
      {!isActive && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(80,175,149,0.28)', filter: 'blur(6px)' }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.3, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <Currency w={20} type="usdt" />
    </div>
  )
}

/* ─── NavBar ─────────────────────────────────────────────────────── */
export default function NavBar() {
  const t = useTranslations('navbar')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()

  const isEarnActive =
    location.includes('/friends') || location.includes('/earning')

  const navItems = [
    {
      id: 'vpn',
      name: 'VPN',
      href: url,
      icon: (
        <Image
          src="/logo.png"
          alt="Logo"
          width={22}
          height={22}
          className="rounded-md"
        />
      ),
    },
    {
      id: 'earn',
      name: 'Заработать',
      href: url + '/friends',
      icon: <EarnIcon isActive={isEarnActive} />,
      special: true, // маркетинговый акцент
    },
    {
      id: 'profile',
      name: t('profile'),
      href: url + '/profile',
      icon: <Avatar url={user?.photoUrl} w={22} className="cursor-pointer" />,
    },
  ]

  const isMainUrls =
    location.includes('/earning') ||
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
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
        className="relative pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl"
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
            location === item.href || (item.id === 'earn' && isEarnActive)
          const isSpecial = item.special && !isActive

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-xl active:scale-[0.93] min-w-[72px] overflow-visible"
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
                      item.id === 'earn'
                        ? 'linear-gradient(135deg, rgba(80,175,149,0.22) 0%, rgba(80,175,149,0.1) 100%)'
                        : 'linear-gradient(135deg, var(--primary-container) 0%, color-mix(in srgb, var(--primary-container) 70%, var(--surface-container-highest)) 100%)',
                    boxShadow:
                      item.id === 'earn'
                        ? '0 0 14px rgba(80,175,149,0.2)'
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
                      'rgba(80,175,149,0.0)',
                    ],
                    boxShadow: [
                      '0 0 0px rgba(80,175,149,0)',
                      '0 0 12px rgba(80,175,149,0.18)',
                      '0 0 0px rgba(80,175,149,0)',
                    ],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* ── Notification dot (earn tab, not active) ── */}
              {isSpecial && (
                <span className="absolute top-2 right-2 z-20">
                  <NotifDot />
                </span>
              )}

              {/* ── Icon ── */}
              <div
                className="relative z-10"
                style={{
                  color: isActive
                    ? item.id === 'earn'
                      ? 'var(--usdt)'
                      : 'var(--primary)'
                    : 'var(--on-surface-variant)',
                  filter: isActive
                    ? item.id === 'earn'
                      ? 'drop-shadow(0 0 7px rgba(80,175,149,0.55))'
                      : 'drop-shadow(0 0 6px rgba(195,166,255,0.45))'
                    : isSpecial
                      ? 'drop-shadow(0 0 4px rgba(80,175,149,0.3))'
                      : 'none',
                  transition: 'filter 300ms',
                }}>
                {item.icon}
              </div>

              <div className="flex items-center gap-2">
                {/* ── Label ── */}
                <span
                  className="relative z-10 font-mono text-[10px] font-bold tracking-wide leading-none"
                  style={{
                    color: isActive
                      ? item.id === 'earn'
                        ? 'var(--usdt)'
                        : 'var(--on-primary-container)'
                      : isSpecial
                        ? 'var(--usdt)'
                        : 'var(--on-surface-variant)',
                    opacity: isActive ? 1 : isSpecial ? 0.9 : 0.6,
                    transition: 'color 200ms, opacity 200ms',
                  }}>
                  {item.name}
                </span>

                {/* ── "Доход" micro-badge под лейблом ── */}
                {/*{isSpecial && (
                  <motion.span
                    className="relative z-10 font-mono font-bold rounded-sm px-1"
                    style={{
                      fontSize: 8,
                      letterSpacing: '0.04em',
                      background: 'rgba(80,175,149,0.15)',
                      color: 'var(--usdt)',
                      border: '1px solid rgba(80,175,149,0.25)',
                      lineHeight: '14px',
                    }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.2, repeat: Infinity }}>
                    USDT
                  </motion.span>
                )}*/}
              </div>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
