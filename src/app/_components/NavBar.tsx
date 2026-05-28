'use client'
import { useUserStore } from '@app/store/user.store'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaMoneyBill1Wave } from 'react-icons/fa6'
import { useTranslations } from 'use-intl'
import Avatar from './Avatar'

export default function NavBar() {
  const t = useTranslations('navbar')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  const { user } = useUserStore()

  const navItems = [
    {
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
      name: 'Заработать',
      href: url + '/friends',
      icon: <FaMoneyBill1Wave size={20} />,
    },
    {
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
      {/* Fade-out gradient above the bar */}
      <div
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
          const isActive = location === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.93] min-w-[72px]"
              style={{
                color: isActive
                  ? 'var(--on-primary-container)'
                  : 'var(--on-surface-variant)',
              }}>
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--primary-container) 0%, color-mix(in srgb, var(--primary-container) 70%, var(--surface-container-highest)) 100%)',
                    boxShadow: '0 0 12px rgba(195,166,255,0.18)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              )}

              {/* Icon */}
              <div
                className="relative z-10 transition-transform duration-200"
                style={{
                  color: isActive
                    ? 'var(--primary)'
                    : 'var(--on-surface-variant)',
                  filter: isActive
                    ? 'drop-shadow(0 0 6px rgba(195,166,255,0.45))'
                    : 'none',
                }}>
                {item.icon}
              </div>

              {/* Label */}
              <span
                className="relative z-10 font-mono text-[10px] font-bold tracking-wide leading-none transition-all duration-200"
                style={{
                  color: isActive
                    ? 'var(--on-primary-container)'
                    : 'var(--on-surface-variant)',
                  opacity: isActive ? 1 : 0.6,
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
