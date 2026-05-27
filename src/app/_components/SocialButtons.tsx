'use client'
import { config } from '@app/config/client'
import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { FaAd } from 'react-icons/fa'
import { IoIosArrowDroprightCircle } from 'react-icons/io'
import { RiTelegram2Fill } from 'react-icons/ri'

type ColorKey = 'info' | 'wager' | 'ad'

interface ButtonConfig {
  href: string
  label: string
  description: string
  icon: React.ElementType
  color: ColorKey
}

const colorMap: Record<
  ColorKey,
  { bg: string; text: string; border: string; iconBg: string; glow: string }
> = {
  info: {
    bg: 'linear-gradient(135deg, var(--info-container) 0%, color-mix(in srgb, var(--info-container) 55%, transparent) 100%)',
    text: 'var(--on-info-container)',
    border: 'var(--info)',
    iconBg: 'rgba(89,191,255,0.15)',
    glow: 'var(--info-glow)',
  },
  wager: {
    bg: 'linear-gradient(135deg, var(--wager-container) 0%, color-mix(in srgb, var(--wager-container) 55%, transparent) 100%)',
    text: 'var(--on-wager-container)',
    border: 'var(--wager)',
    iconBg: 'rgba(214,58,58,0.15)',
    glow: 'var(--wager-container-rgba)',
  },
  ad: {
    bg: 'linear-gradient(135deg, var(--ad-container) 0%, color-mix(in srgb, var(--ad-container) 55%, transparent) 100%)',
    text: 'var(--on-ad-container)',
    border: 'var(--ad)',
    iconBg: 'rgba(255,106,0,0.15)',
    glow: 'var(--ad-container-rgba)',
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -14,
    filter: 'blur(4px)',
  },

  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.32,
      ease: [0.2, 0, 0, 1] as const,
    },
  },
}

export default function SocialButtons() {
  const buttons: ButtonConfig[] = [
    {
      href: config.TELEGRAM_CHANNEL_URL || '',
      label: 'Канал',
      description: 'Новости и обновления',
      icon: RiTelegram2Fill,
      color: 'info',
    },
    {
      href: config.TELEGRAM_CHAT_URL || '',
      label: 'Чат и Поддержка',
      description: 'Быстрая помощь онлайн',
      icon: RiTelegram2Fill,
      color: 'info',
    },
    {
      href: 'https://t.me/vpnsibcom?direct',
      label: 'Сотрудничество и Реклама',
      description: 'Партнёрские предложения',
      icon: RiTelegram2Fill,
      color: 'wager',
    },
    {
      href: 'https://taddy.pro/vpnsibcom_bot',
      label: 'Заказать рекламу',
      description: 'Через платформу Taddy',
      icon: FaAd,
      color: 'ad',
    },
  ]

  return (
    <motion.div
      className="flex flex-col gap-2.5 w-full font-mono max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      {buttons.map((btn) => {
        const Icon = btn.icon
        const c = colorMap[btn.color]

        return (
          <motion.div key={btn.href} variants={itemVariants}>
            <Link
              href={btn.href}
              target="_blank"
              style={{
                background: c.bg,
                color: c.text,
                borderLeft: `3px solid ${c.border}`,
                boxShadow: `0 2px 14px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 w-full justify-between
                         backdrop-blur-sm border border-white/[0.05]
                         transition-all duration-200
                         hover:brightness-[1.12] hover:-translate-y-0.5
                         active:scale-[0.975] active:translate-y-0">
              {/* Icon + Labels */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{
                    background: c.iconBg,
                    color: c.border,
                    boxShadow: `0 0 0 1px ${c.border}22`,
                  }}>
                  <Icon size={17} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold leading-snug truncate">
                    {btn.label}
                  </span>
                  <span className="text-[11px] opacity-50 leading-tight truncate">
                    {btn.description}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <IoIosArrowDroprightCircle
                size={19}
                className="shrink-0 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all duration-200"
              />
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
