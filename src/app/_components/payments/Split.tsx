'use client'

import { config } from '@app/config/client'
import { motion } from 'framer-motion'
import { ExternalLink, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Currency from '../Currency'

/**
 * Split — альтернативный способ оплаты через Telegram-бот-сплит
 * (реферальная ссылка на оплату частями / через партнёра).
 */
export default function Split() {
  const t = useTranslations('billing.payment')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
      {/* Header strip */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Info
          size={16}
          aria-hidden
          style={{ color: 'var(--primary)', opacity: 0.8 }}
        />
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--on-background)', opacity: 0.5 }}>
          {t('split')}
        </span>
      </div>

      {/* CTA */}
      <div className="p-3">
        <Link
          href={config.SPLIT_TG_REF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block">
          <motion.div
            whileHover={{
              scale: 1.015,
              backgroundColor: 'rgba(195,166,255,0.16)',
            }}
            whileTap={{ scale: 0.975 }}
            initial={{ backgroundColor: 'rgba(195,166,255,0.09)' }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold font-mono"
            style={{
              color: 'var(--on-primary-container)',
              border: '1px solid rgba(195,166,255,0.2)',
            }}>
            {t('splitBay')}
            <Currency type="tg-star" w={16} />
            <ExternalLink size={11} aria-hidden style={{ opacity: 0.45 }} />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  )
}
