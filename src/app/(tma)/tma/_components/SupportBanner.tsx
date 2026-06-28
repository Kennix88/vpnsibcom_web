'use client'

import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Construction,
  Heart,
  Megaphone,
  Send,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'

const TRIBUTE_URL = 'https://t.me/tribute/app?startapp=dMwf'
const CHANNEL_URL = 'https://t.me/vpnsibcom'
const CHAT_URL = 'https://t.me/vpnsibcom_chat'

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const },
  },
}

type Tone = 'primary' | 'ton' | 'neutral'

const tonePalette: Record<
  Tone,
  { background: string; color: string; border: string }
> = {
  primary: {
    background: 'var(--primary-gradient)',
    color: 'var(--on-primary)',
    border: '1px solid rgba(157,113,255,0.4)',
  },
  ton: {
    background: 'rgba(0,136,204,0.14)',
    color: 'var(--ton)',
    border: '1px solid rgba(0,136,204,0.35)',
  },
  neutral: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--on-surface)',
    border: '1px solid var(--surface-strong-border)',
  },
}

function ActionLink({
  href,
  children,
  tone = 'neutral',
}: {
  href: string
  children: ReactNode
  tone?: Tone
}) {
  const p = tonePalette[tone]

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold font-mono whitespace-nowrap"
      style={{ background: p.background, color: p.color, border: p.border }}>
      {children}
      <ArrowUpRight size={13} />
    </motion.a>
  )
}

function SupportRow({
  icon,
  accentColor,
  accentBg,
  title,
  description,
  actions,
}: {
  icon: ReactNode
  accentColor: string
  accentBg: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl p-3.5"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--surface-border)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
      }}>
      <div className="flex items-center gap-3 sm:flex-1 min-w-0">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{
            background: accentBg,
            color: accentColor,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          {icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="text-[13.5px] font-bold"
            style={{ color: 'var(--on-surface)' }}>
            {title}
          </span>
          <span
            className="text-[12px] leading-snug"
            style={{ color: 'var(--on-surface-variant)' }}>
            {description}
          </span>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </motion.div>
  )
}

export function SupportBanner() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={listVariants}
      className="relative w-full max-w-md mx-auto flex flex-col gap-3">
      {/* Статус сервиса */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid rgba(255,171,64,0.22)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
        }}>
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background:
              'linear-gradient(to bottom, var(--warning), rgba(255,171,64,0.15))',
          }}
        />
        <div className="flex items-start gap-3">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255,171,64,0)',
                '0 0 0 6px rgba(255,171,64,0.16)',
                '0 0 0 0 rgba(255,171,64,0)',
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: 'rgba(255,171,64,0.14)',
              color: 'var(--warning)',
              border: '1px solid rgba(255,171,64,0.28)',
            }}>
            <Construction size={18} />
          </motion.div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3
              className="text-[14px] font-bold"
              style={{ color: 'var(--on-surface)' }}>
              Подписки временно не выдаются
            </h3>
            <p
              className="text-[12.5px] leading-relaxed"
              style={{ color: 'var(--on-surface-variant)' }}>
              Мы перестраиваем инфраструктуру, чтобы VPN стал по-настоящему
              отказоустойчивым: разворачиваем новые сервера, которые сложнее
              заблокировать. Сервис остаётся бесплатным для всех — мы делаем
              всё, чтобы запуск прошёл как можно быстрее.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Заголовок блока поддержки */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 px-1 mt-1">
        <Heart size={15} style={{ color: 'var(--primary)' }} />
        <span
          className="text-[12px] font-bold uppercase tracking-wide"
          style={{ color: 'var(--on-surface)' }}>
          Поддержите VPNsib
        </span>
      </motion.div>

      <SupportRow
        icon={<Megaphone size={17} />}
        accentColor="var(--ad)"
        accentBg="rgba(255,106,0,0.14)"
        title="Смотрите рекламу"
        description="Выполняйте задания выше и переходите по рекламным постам в боте. Если просят подписаться — сделайте это хотя бы на неделю."
      />

      <SupportRow
        icon={<Wallet size={17} />}
        accentColor="var(--primary)"
        accentBg="rgba(157,113,255,0.16)"
        title="Поддержите донатом"
        description="Картой, через СБП или криптовалютой — любая сумма помогает оплачивать сервера."
        actions={
          <ActionLink href={TRIBUTE_URL} tone="primary">
            Tribute
          </ActionLink>
        }
      />

      <SupportRow
        icon={<Send size={16} />}
        accentColor="var(--ton)"
        accentBg="rgba(0,136,204,0.14)"
        title="Будьте на связи"
        description="Узнаете первыми о новых серверах и возобновлении выдачи подписок. Ваша подписка так же помогает в развитии сервиса!"
        actions={
          <>
            <ActionLink href={CHANNEL_URL} tone="ton">
              Канал
            </ActionLink>
            <ActionLink href={CHAT_URL} tone="ton">
              Чат
            </ActionLink>
          </>
        }
      />

      {/* Благодарность */}
      <motion.p
        variants={itemVariants}
        className="text-[11.5px] text-center leading-relaxed px-2 mt-1"
        style={{ color: 'var(--disabled-content)' }}>
        Серверы обходятся недёшево, а оборудование в нынешних условиях
        приходится менять чаще, чем хотелось бы. Спасибо, что помогаете VPNsib
        оставаться бесплатным для всех 💜
      </motion.p>
    </motion.section>
  )
}
