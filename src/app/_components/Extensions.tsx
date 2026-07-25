'use client'

/**
 * Extensions — список расширений условий подписки.
 *
 * Показывает пользователю, как бесплатно снять жёсткие лимиты дефолтной
 * подписки: выполнил условие → нажал "Проверить" → получил награду.
 *
 * ЧТО НОВОГО В ЭТОЙ ВЕРСИИ:
 *  1. Реферальные задания (REFERRAL_3..100, REFERRAL_REACTIVATION_10..100)
 *     получили динамические мета-данные, прогресс "X из N" и переход на
 *     /tma/friends вместо статичного списка.
 *  2. Главная карточка прогресса теперь показывает не только дни/устройства/
 *     трафик, но и «качественные» бонусы: автопродление, отключение рекламы,
 *     премиум серверы — и что из этого уже разблокировано.
 *  3. Появился блок "Твои лимиты сейчас", который сравнивает дефолтные
 *     значения подписки (приходят полем `default`) с тем, что пользователь
 *     уже заработал расширениями — наглядное "было → стало".
 *  4. Компонент можно встраивать в mini-варианте (только карточка прогресса)
 *     и переопределять кнопку "Проверить" на переход по произвольному адресу
 *     через проп navigateHref — полезно, если карточка выводится не на
 *     странице заданий, а просто анонсирует прогресс.
 *  5. Точечный рестайлинг: собственная тема на каждое реферальное задание,
 *     мягкое свечение в шапке, более разборчивая типографика.
 *
 * ПРЕДПОЛОЖЕНИЯ, которые стоит проверить под свой проект:
 *  - authApiClient.getExtensions() / checkExtensions() возвращают также
 *    поле `default: NewEraSubWithTmaInterface` (базовые лимиты без бонусов).
 *  - useUserStore().user содержит referralsWeekSubCount, referralReactivations
 *    и reactivationDays (имена взяты из комментариев в new-era.types.ts).
 *    Если имена другие — поправь константы в getReferralProgress().
 *  - Modal лежит в '@app/components/common/Modal' (default export).
 *  - TooltipWrapper лежит в '@app/components/common/TooltipWrapper'.
 *  - config.TELEGRAM_CHANNEL_URL / config.TELEGRAM_CHAT_URL — при отсутствии
 *    подставь свои ссылки на канал/чат.
 *  - '@app/config/client' содержит botUsername, иначе поправь константу
 *    BOT_USERNAME ниже.
 *  - Роутинг через next/navigation (App Router).
 */

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import {
  NewEraSubWithTmaInterface,
  SubscriptionExtensionsEnum,
  SubscriptionExtensionsWithConditionsInterface,
  SubscriptionExtensionsWithConditionsTypeEnum,
} from '@app/types/new-era.types'

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  ExternalLink,
  Gauge,
  Gem,
  HelpCircle,
  InfinityIcon,
  Loader2,
  Lock,
  MessageCircle,
  PartyPopper,
  RefreshCw,
  Send,
  ServerCog,
  Shield,
  Smartphone,
  Sparkles,
  Tag,
  User,
  UserPlus,
  Users,
  VolumeX,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-toastify'
import Modal from './Modal'
import PremiumPurchase from './PremiumPurchase'
import TooltipWrapper from './TooltipWrapper'

/* ────────────────────────────────────────────────────────────────── */
/*  Constants                                                         */
/* ────────────────────────────────────────────────────────────────── */

const CHECK_COOLDOWN_MS = 60_000
const BOT_USERNAME = '@vpnsibcom_bot'
const FRIENDS_PAGE_URL = '/tma/friends'

/* ────────────────────────────────────────────────────────────────── */
/*  Static meta per extension key                                     */
/* ────────────────────────────────────────────────────────────────── */

type ExtMeta = {
  title: string
  description?: string
  icon: ReactNode
  hint?: string
  ctaLabel?: string
}

const EXT_META: Partial<Record<SubscriptionExtensionsEnum, ExtMeta>> = {
  [SubscriptionExtensionsEnum.PREMIUM]: {
    title: 'Premium Status',
    description: 'Оформи Premium Status — получишь расширенную подписку',
    icon: <Crown size={18} />,
    ctaLabel: 'Оформить',
  },
  [SubscriptionExtensionsEnum.CHANNEL]: {
    title: 'Подпишись на канал',
    description: 'Следи за новостями, апдейтами и акциями сервиса',
    icon: <Send size={18} />,
    ctaLabel: 'Подписаться',
  },
  [SubscriptionExtensionsEnum.CHAT]: {
    title: 'Вступи в чат',
    description: 'Общайся с сообществом и получай быструю поддержку',
    icon: <MessageCircle size={18} />,
    ctaLabel: 'Вступить',
  },
  [SubscriptionExtensionsEnum.BIO]: {
    title: 'Укажи бота в описании профиля',
    description: `Добавь «${BOT_USERNAME}» в раздел «О себе» в настройках Telegram`,
    icon: <User size={18} />,
    hint: 'Не сработает, если раздел "О себе" скрыт настройками приватности. После изменения профиля перезайди в приложение — Telegram обновляет данные не мгновенно.',
    ctaLabel: 'Скопировать',
  },
  [SubscriptionExtensionsEnum.NAME]: {
    title: 'Укажи бота в имени профиля',
    description: `Добавь «${BOT_USERNAME}» в имя в Telegram`,
    icon: <User size={18} />,
    hint: 'После изменения имени перезайди в приложение — Telegram обновляет данные не мгновенно.',
    ctaLabel: 'Скопировать',
  },
}

/* ────────────────────────────────────────────────────────────────── */
/*  Referral / reactivation tasks — динамические ключи вида            */
/*  REFERRAL_3..100 и REFERRAL_REACTIVATION_10..100                    */
/* ────────────────────────────────────────────────────────────────── */

function parseReferralTarget(key: string): number | null {
  const m = /^REFERRAL_(\d+)$/.exec(key)
  return m ? parseInt(m[1], 10) : null
}

function parseReactivationTarget(key: string): number | null {
  const m = /^REFERRAL_REACTIVATION_(\d+)$/.exec(key)
  return m ? parseInt(m[1], 10) : null
}

/** Тема на каждый порог — прогрессия от "входного" к "престижному" уровню,
 *  цвета взяты из уже используемой в проекте палитры (см. globals.css). */
const REFERRAL_THEME_BY_TARGET: Record<number, CardTheme> = {
  3: {
    rgb: '89,191,255',
    gradient: 'linear-gradient(135deg, #2f8fd6, #59bfff)',
  },
  5: {
    rgb: '55,227,162',
    gradient: 'linear-gradient(135deg, #189968, #37e3a2)',
  },
  10: {
    rgb: '106,227,255',
    gradient: 'linear-gradient(135deg, #1a8fa3, #6ae3ff)',
  },
  25: {
    rgb: '245,166,35',
    gradient: 'linear-gradient(135deg, #cc7a00, #f5a623)',
  },
  50: {
    rgb: '255,140,66',
    gradient: 'linear-gradient(135deg, #cc5c1a, #ff8c42)',
  },
  100: {
    rgb: '157,113,255',
    gradient: 'linear-gradient(135deg, #6b3fd4, #c3a6ff)',
  },
}

const REACTIVATION_THEME_BY_TARGET: Record<number, CardTheme> = {
  10: {
    rgb: '0,187,212',
    gradient: 'linear-gradient(135deg, #007c8c, #00bbd4)',
  },
  50: {
    rgb: '239,184,200',
    gradient: 'linear-gradient(135deg, #b8637f, #efb8c8)',
  },
  100: {
    rgb: '255,208,0',
    gradient: 'linear-gradient(135deg, #cc9e00, #ffd000)',
  },
}

function referralIconFor(target: number) {
  if (target >= 100) return <Gem size={18} />
  if (target >= 50) return <Award size={18} />
  if (target >= 10) return <UserPlus size={18} />
  return <Users size={18} />
}

function reactivationIconFor(target: number) {
  if (target >= 100) return <Gem size={18} />
  if (target >= 50) return <Award size={18} />
  return <RefreshCw size={18} />
}

/** Текущий прогресс пользователя по реферальным заданиям.
 *  Имена полей — из комментариев в new-era.types.ts; если бэкенд называет
 *  их иначе, поправь только этот хелпер. */
function getReferralProgress(
  ext: SubscriptionExtensionsWithConditionsInterface,
  user: Record<string, unknown> | null | undefined,
): {
  current: number
  target: number
  kind: 'referral' | 'reactivation'
} | null {
  const key = String(ext.key)

  const referralTarget = parseReferralTarget(key)
  if (referralTarget !== null) {
    const current = Number(user?.referralsWeekSubCount ?? 0)
    return { current, target: referralTarget, kind: 'referral' }
  }

  const reactivationTarget = parseReactivationTarget(key)
  if (reactivationTarget !== null) {
    const current = Number(user?.referralReactivations ?? 0)
    return { current, target: reactivationTarget, kind: 'reactivation' }
  }

  return null
}

function referralMetaFor(
  ext: SubscriptionExtensionsWithConditionsInterface,
  user: Record<string, unknown> | null | undefined,
): ExtMeta | null {
  const key = String(ext.key)

  const referralTarget = parseReferralTarget(key)
  if (referralTarget !== null) {
    return {
      title: `Пригласи ${referralTarget} ${pluralFriends(referralTarget)}`,
      description: `Приглашённые должны пользоваться VPN больше 7 дней`,
      icon: referralIconFor(referralTarget),
      ctaLabel: 'Пригласить',
    }
  }

  const reactivationTarget = parseReactivationTarget(key)
  if (reactivationTarget !== null) {
    const reactivationDays = Number(user?.reactivationDays ?? 30)
    return {
      title: `Верни ${reactivationTarget} ${pluralUsers(reactivationTarget)}`,
      description: `Пользователи, которые не заходили больше ${reactivationDays} ${pluralDays(reactivationDays)}, должны вернуться в приложение. В том числе, если они чужие рефералы!`,
      icon: reactivationIconFor(reactivationTarget),
      ctaLabel: 'Пригласить',
    }
  }

  return null
}

function pluralFriends(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'друга'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return 'друзей'
  return 'друзей'
}

function pluralUsers(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователя'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return 'пользователей'
  return 'пользователей'
}

/* ────────────────────────────────────────────────────────────────── */
/*  Per-extension visual theme — каждая карточка получает свой         */
/*  акцентный цвет/градиент, чтобы список не выглядел монотонно        */
/* ────────────────────────────────────────────────────────────────── */

type CardTheme = { rgb: string; gradient: string }

const KEY_THEME: Partial<Record<SubscriptionExtensionsEnum, CardTheme>> = {
  [SubscriptionExtensionsEnum.PREMIUM]: {
    rgb: '245,166,35',
    gradient: 'linear-gradient(135deg, #f5a623, #febd04)',
  },
  [SubscriptionExtensionsEnum.CHANNEL]: {
    rgb: '89,191,255',
    gradient: 'linear-gradient(135deg, #2f8fd6, #59bfff)',
  },
  [SubscriptionExtensionsEnum.CHAT]: {
    rgb: '239,184,200',
    gradient: 'linear-gradient(135deg, #b8637f, #efb8c8)',
  },
  [SubscriptionExtensionsEnum.BIO]: {
    rgb: '0,187,212',
    gradient: 'linear-gradient(135deg, #007c8c, #00bbd4)',
  },
  [SubscriptionExtensionsEnum.NAME]: {
    rgb: '255,140,66',
    gradient: 'linear-gradient(135deg, #cc5c1a, #ff8c42)',
  },
}

const ROLE_THEME: CardTheme = {
  rgb: '157,113,255',
  gradient: 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
}

const FALLBACK_THEME: CardTheme = {
  rgb: '195,166,255',
  gradient: 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
}

function themeFor(
  ext: SubscriptionExtensionsWithConditionsInterface,
): CardTheme {
  if (ext.type === SubscriptionExtensionsWithConditionsTypeEnum.ROLE) {
    return ROLE_THEME
  }

  const key = String(ext.key)
  const referralTarget = parseReferralTarget(key)
  if (referralTarget !== null) {
    return REFERRAL_THEME_BY_TARGET[referralTarget] ?? FALLBACK_THEME
  }
  const reactivationTarget = parseReactivationTarget(key)
  if (reactivationTarget !== null) {
    return REACTIVATION_THEME_BY_TARGET[reactivationTarget] ?? FALLBACK_THEME
  }

  return KEY_THEME[ext.key as SubscriptionExtensionsEnum] ?? FALLBACK_THEME
}

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ────────────────────────────────────────────────────────────────── */

function pluralDays(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня'
  return 'дней'
}

function pluralDevices(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'устройство'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return 'устройства'
  return 'устройств'
}

function bytesToGb(bytes?: number | null): number {
  if (!bytes) return 0
  return Math.round((bytes / 1024 ** 3) * 10) / 10
}

type RewardBadge = { icon: ReactNode; label: string; colorVar: string }

export function buildRewards(
  ext: SubscriptionExtensionsWithConditionsInterface,
): RewardBadge[] {
  const badges: RewardBadge[] = []

  if (ext.days > 0) {
    badges.push({
      icon: <Calendar size={12} />,
      label: `+${ext.days} ${pluralDays(ext.days)}`,
      colorVar: 'var(--star)',
    })
  }
  if (ext.devicesCount > 0) {
    badges.push({
      icon: <Sparkles size={12} />,
      label: `+${ext.devicesCount} ${pluralDevices(ext.devicesCount)}`,
      colorVar: 'var(--info)',
    })
  }
  if (ext.isUnlimitTraffic) {
    badges.push({
      icon: <InfinityIcon size={12} />,
      label: 'Безлимитный трафик',
      colorVar: 'var(--success)',
    })
  } else if (ext.trafficLimitGb > 0) {
    badges.push({
      icon: <Gauge size={12} />,
      label: `+${ext.trafficLimitGb} ГБ/день`,
      colorVar: 'var(--traffic)',
    })
  }
  if (ext.isPremiumServers) {
    badges.push({
      icon: <ServerCog size={12} />,
      label: 'Премиум серверы',
      colorVar: 'var(--primary)',
    })
  }
  if (ext.isNoAds) {
    badges.push({
      icon: <VolumeX size={12} />,
      label: 'Без рекламы',
      colorVar: 'var(--cta)',
    })
  }
  if (ext.isRoleChat) {
    badges.push({
      icon: <Tag size={12} />,
      label: ext.roleName ? `Тег «${ext.roleName}» в чате` : 'Тег в чате',
      colorVar: 'var(--tertiary)',
    })
  }
  if (ext.isAutoRenewing) {
    badges.push({
      icon: <RefreshCw size={12} />,
      label: 'Автопродление',
      colorVar: 'var(--accent-network)',
    })
  }
  return badges
}

function hasAnyReward(ext: SubscriptionExtensionsWithConditionsInterface) {
  return (
    ext.days > 0 ||
    ext.devicesCount > 0 ||
    ext.trafficLimitGb > 0 ||
    ext.isUnlimitTraffic ||
    ext.isPremiumServers ||
    ext.isNoAds ||
    ext.isRoleChat ||
    ext.isAutoRenewing
  )
}

function extUid(ext: SubscriptionExtensionsWithConditionsInterface) {
  return `${ext.type}:${ext.key}`
}

function metaFor(
  ext: SubscriptionExtensionsWithConditionsInterface,
  user: Record<string, unknown> | null | undefined,
): ExtMeta {
  if (ext.type === SubscriptionExtensionsWithConditionsTypeEnum.ROLE) {
    return {
      title: ext.roleName ? `Роль «${ext.roleName}»` : 'Бонус роли',
      description: 'Награда за твою роль в системе — уже активна',
      icon: <Shield size={18} />,
    }
  }

  const referral = referralMetaFor(ext, user)
  if (referral) return referral

  return (
    EXT_META[ext.key as SubscriptionExtensionsEnum] ?? {
      title: String(ext.key),
      description: '',
      icon: <Sparkles size={18} />,
    }
  )
}

/** color-mix хелперы, чтобы не дублировать .replace()×2 в каждом месте */
function tint(colorVar: string, pct: number) {
  return colorVar
    .replace('var(', `color-mix(in srgb, var(`)
    .replace(')', `) ${pct}%, transparent)`)
}

/* ────────────────────────────────────────────────────────────────── */
/*  Extension card                                                     */
/* ────────────────────────────────────────────────────────────────── */

function ExtensionCard({
  ext,
  user,
  onAction,
  onCopy,
}: {
  ext: SubscriptionExtensionsWithConditionsInterface
  user: Record<string, unknown> | null | undefined
  onAction: (ext: SubscriptionExtensionsWithConditionsInterface) => void
  onCopy: (text: string) => void
}) {
  const meta = metaFor(ext, user)
  const rewards = buildRewards(ext)
  const isRole = ext.type === SubscriptionExtensionsWithConditionsTypeEnum.ROLE
  const isCopyAction =
    ext.key === SubscriptionExtensionsEnum.BIO ||
    ext.key === SubscriptionExtensionsEnum.NAME
  const done = ext.conditionMet
  const theme = themeFor(ext)
  const progress = getReferralProgress(ext, user)

  return (
    <motion.div
      layout
      layoutId={extUid(ext)}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={
        !done
          ? {
              y: -2,
              boxShadow: `0 12px 28px rgba(${theme.rgb},0.16), 0 6px 20px rgba(0,0,0,0.24)`,
            }
          : undefined
      }
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: done ? 'rgba(55,227,162,0.05)' : 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: `1px solid ${
          done ? 'rgba(55,227,162,0.22)' : `rgba(${theme.rgb},0.22)`
        }`,
        boxShadow: done
          ? 'none'
          : '0 6px 20px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
      {/* ambient corner glow — тонкий акцент под тему карточки */}
      {!done && (
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl"
          style={{ background: `rgba(${theme.rgb},0.14)` }}
        />
      )}

      {/* left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: done
            ? 'linear-gradient(to bottom, var(--success), rgba(55,227,162,0.15))'
            : `linear-gradient(to bottom, rgba(${theme.rgb},0.9), rgba(${theme.rgb},0.15))`,
        }}
      />

      <div className="relative flex flex-col gap-2.5 p-3.5 pl-4">
        {/* header: icon + title + status */}
        <div className="flex items-start gap-2">
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{
              background: done
                ? 'rgba(55,227,162,0.14)'
                : `rgba(${theme.rgb},0.14)`,
              color: done ? 'var(--success)' : `rgb(${theme.rgb})`,
              border: `1px solid ${
                done ? 'rgba(55,227,162,0.25)' : `rgba(${theme.rgb},0.3)`
              }`,
            }}
            animate={
              !done
                ? {
                    boxShadow: [
                      `0 0 0px rgba(${theme.rgb},0)`,
                      `0 0 14px rgba(${theme.rgb},0.45)`,
                      `0 0 0px rgba(${theme.rgb},0)`,
                    ],
                  }
                : undefined
            }
            transition={
              !done
                ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }>
            {done ? <CheckCircle2 size={18} /> : meta.icon}
          </motion.div>

          <div className="flex items-center gap-1.5 grow min-w-0 pt-1">
            <span
              className="text-[13.5px] font-bold font-mono leading-snug break-words"
              style={{
                color: 'var(--on-surface)',
                opacity: done ? 0.75 : 1,
              }}>
              {meta.title}
            </span>
            {meta.hint && (
              <TooltipWrapper prompt={meta.hint} color="info">
                <HelpCircle
                  size={13}
                  className="shrink-0"
                  style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}
                />
              </TooltipWrapper>
            )}
            {isRole && (
              <span
                className="shrink-0 text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                style={{
                  background: 'rgba(157,113,255,0.14)',
                  color: 'var(--primary)',
                }}>
                РОЛЬ
              </span>
            )}
          </div>

          {/* compact status indicator, always same footprint */}
          <div className="shrink-0 flex items-center justify-center w-7 h-7 mt-0.5">
            {done ? (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="flex items-center justify-center w-7 h-7 rounded-full"
                style={{
                  background: 'var(--success)',
                  color: 'var(--on-success)',
                }}>
                <Check size={14} strokeWidth={3} />
              </motion.div>
            ) : isRole ? (
              <Lock
                size={14}
                style={{ color: 'var(--on-surface-variant)', opacity: 0.4 }}
              />
            ) : null}
          </div>
        </div>

        {/* description */}
        {meta.description && (
          <span
            className="text-[11.5px] font-mono leading-snug break-words"
            style={{
              color: 'var(--on-surface-variant)',
              opacity: done ? 0.65 : 0.9,
            }}>
            {meta.description}
          </span>
        )}

        {/* progress bar — только для реферальных заданий с числовой целью */}
        {progress && !done && (
          <div className="flex flex-col gap-1 ">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-mono font-bold"
                style={{ color: `rgb(${theme.rgb})` }}>
                {Math.min(progress.current, progress.target)} из{' '}
                {progress.target}
              </span>
            </div>
            <div
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: theme.gradient }}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                }}
                transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              />
            </div>
          </div>
        )}

        {/* reward badges */}
        {rewards.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rewards.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold whitespace-nowrap"
                style={{
                  background: tint(r.colorVar, 15),
                  color: r.colorVar,
                  border: `1px solid ${tint(r.colorVar, 30)}`,
                  opacity: done ? 0.7 : 1,
                }}>
                {r.icon}
                {r.label}
              </span>
            ))}
          </div>
        )}

        {/* footer: CTA, right-aligned, sized to content — never dominates the card */}
        {!done && !isRole && (
          <div className="flex justify-end  mt-0.5">
            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: `0 6px 18px rgba(${theme.rgb},0.35)`,
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                isCopyAction ? onCopy(BOT_USERNAME) : onAction(ext)
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold cursor-pointer whitespace-nowrap"
              style={{
                background: theme.gradient,
                color: '#fff',
                boxShadow: `0 4px 14px rgba(${theme.rgb},0.28)`,
              }}>
              {isCopyAction ? <Copy size={12} /> : null}
              {meta.ctaLabel ?? 'Открыть'}
              {!isCopyAction && (
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex items-center">
                  <ChevronRight size={13} />
                </motion.span>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Baseline card — "было / стало"                                     */
/* ────────────────────────────────────────────────────────────────── */

type PerkKey = 'premiumServers' | 'noAds' | 'autoRenewing'

const PERK_META: Record<
  PerkKey,
  { label: string; icon: ReactNode; colorVar: string }
> = {
  premiumServers: {
    label: 'Премиум серверы',
    icon: <ServerCog size={13} />,
    colorVar: 'var(--primary)',
  },
  noAds: {
    label: 'Без рекламы',
    icon: <VolumeX size={13} />,
    colorVar: 'var(--cta)',
  },
  autoRenewing: {
    label: 'Автопродление',
    icon: <RefreshCw size={13} />,
    colorVar: 'var(--accent-network)',
  },
}

function BaselineLimits({
  defaultSub,
  completed,
}: {
  defaultSub: NewEraSubWithTmaInterface
  completed: SubscriptionExtensionsWithConditionsInterface[]
}) {
  const earnedDays = completed.reduce((s, e) => s + (e.days || 0), 0)
  const earnedDevices = completed.reduce((s, e) => s + (e.devicesCount || 0), 0)
  const earnedTrafficGb = completed.reduce(
    (s, e) => s + (e.isUnlimitTraffic ? 0 : e.trafficLimitGb || 0),
    0,
  )
  const unlockedUnlimited = completed.some((e) => e.isUnlimitTraffic)
  const perks: Record<PerkKey, boolean> = {
    premiumServers: completed.some((e) => e.isPremiumServers),
    noAds: completed.some((e) => e.isNoAds),
    autoRenewing:
      defaultSub.isAutoRenewing || completed.some((e) => e.isAutoRenewing),
  }

  const baseDays = defaultSub.days ?? 0
  const totalDays = baseDays + earnedDays

  const baseDevices = defaultSub.devicesLimit ?? 0
  const totalDevices = baseDevices + earnedDevices

  const isUnlimitedNow = defaultSub.isUnlimitTraffic || unlockedUnlimited
  const baseTrafficGb = bytesToGb(defaultSub.dataLimitBytes)
  const totalTrafficGb = baseTrafficGb + earnedTrafficGb

  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-3"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--surface-border)',
      }}>
      <span
        className="text-[11.5px] font-mono font-bold tracking-wide"
        style={{ color: 'var(--on-surface-variant)', opacity: 0.85 }}>
        ТВОИ ЛИМИТЫ СЕЙЧАС
      </span>

      <div className="flex flex-col gap-2.5">
        <BaselineRow
          icon={<Calendar size={14} />}
          label="Срок подписки"
          base={`${baseDays} ${pluralDays(baseDays)}`}
          current={
            earnedDays > 0 ? `${totalDays} ${pluralDays(totalDays)}` : null
          }
          colorVar="var(--star)"
        />
        <BaselineRow
          icon={<Smartphone size={14} />}
          label="Устройства"
          base={`${baseDevices}`}
          current={earnedDevices > 0 ? `${totalDevices}` : null}
          colorVar="var(--info)"
        />
        <BaselineRow
          icon={<Gauge size={14} />}
          label="Трафик/день"
          base={
            defaultSub.isUnlimitTraffic ? 'Безлимит' : `${baseTrafficGb} ГБ`
          }
          current={
            isUnlimitedNow && !defaultSub.isUnlimitTraffic
              ? 'Безлимит'
              : !isUnlimitedNow && earnedTrafficGb > 0
                ? `${totalTrafficGb} ГБ`
                : null
          }
          colorVar="var(--traffic)"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {(Object.keys(PERK_META) as PerkKey[]).map((key) => {
          const meta = PERK_META[key]
          const unlocked = perks[key]
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold"
              style={{
                background: unlocked
                  ? tint(meta.colorVar, 15)
                  : 'rgba(255,255,255,0.04)',
                color: unlocked ? meta.colorVar : 'var(--on-surface-variant)',
                border: `1px solid ${
                  unlocked ? tint(meta.colorVar, 30) : 'var(--surface-border)'
                }`,
                opacity: unlocked ? 1 : 0.55,
              }}>
              {unlocked ? (
                <Check size={11} strokeWidth={3} />
              ) : (
                <Lock size={11} />
              )}
              {meta.icon}
              {meta.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function BaselineRow({
  icon,
  label,
  base,
  current,
  colorVar,
}: {
  icon: ReactNode
  label: string
  base: string
  current: string | null
  colorVar: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{ background: tint(colorVar, 14), color: colorVar }}>
          {icon}
        </span>
        <span
          className="text-[12px] font-mono truncate"
          style={{ color: 'var(--on-surface)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="text-[12px] font-mono font-bold"
          style={{
            color: current ? 'var(--on-surface-variant)' : 'var(--on-surface)',
            opacity: current ? 0.6 : 1,
          }}>
          {base}
        </span>
        {current && (
          <>
            <ArrowRight
              size={12}
              style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}
            />
            <span
              className="text-[12px] font-mono font-bold"
              style={{ color: colorVar }}>
              {current}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ────────────────────────────────────────────────────────────────── */

/** Бэкенд иногда может не отдать extensions как массив (пустой ответ,
 *  ошибка сериализации и т.п.) — на любой другой случай подстраховываемся,
 *  чтобы .filter() ниже никогда не падал. */
function toExtensionsArray(
  value: unknown,
): SubscriptionExtensionsWithConditionsInterface[] {
  return Array.isArray(value) ? value : []
}

export interface ExtensionsProps {
  /** 'mini' — рендерит только карточку прогресса, без списков и модалки.
   *  Удобно встраивать на другие страницы (например, /tma/friends). */
  variant?: 'full' | 'mini'
  /** Если передан — кнопка "Проверить" в шапке заменяется на переход по
   *  этому адресу (кнопка "Выполнить задания"). Полезно, когда карточка
   *  выводится не на странице заданий, а просто анонсирует прогресс. */
  navigateHref?: string
  /** Подпись кнопки перехода, если передан navigateHref. */
  navigateLabel?: string
  className?: string
}

export function Extensions({
  variant = 'full',
  navigateHref,
  navigateLabel = 'Выполнить задания',
  className,
}: ExtensionsProps = {}) {
  const { user, setUser } = useUserStore()
  const router = useRouter()

  const [extensions, setExtensions] = useState<
    SubscriptionExtensionsWithConditionsInterface[]
  >([])
  const [defaultSub, setDefaultSub] =
    useState<NewEraSubWithTmaInterface | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [premiumModalOpen, setPremiumModalOpen] = useState(false)

  const lastCheckedAtRef = useRef(0)
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchExtensions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authApiClient.getExtensions()
      if (response && response.success) {
        setExtensions(toExtensionsArray(response.extensions))
        if (response.default) setDefaultSub(response.default)
        if (response.user) setUser(response.user)
      } else {
        setExtensions([])
      }
    } catch (err) {
      console.error('Failed to load Extensions', err)
      setExtensions([])
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  const startCooldown = useCallback(() => {
    lastCheckedAtRef.current = Date.now()
    setCooldownLeft(Math.ceil(CHECK_COOLDOWN_MS / 1000))
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
    cooldownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastCheckedAtRef.current
      const left = Math.max(0, Math.ceil((CHECK_COOLDOWN_MS - elapsed) / 1000))
      setCooldownLeft(left)
      if (left <= 0 && cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }, 1000)
  }, [])

  const checkExtensions = useCallback(async () => {
    const elapsed = Date.now() - lastCheckedAtRef.current
    if (lastCheckedAtRef.current && elapsed < CHECK_COOLDOWN_MS) {
      toast.info(
        `Проверка уже недавно выполнялась. Подожди ${Math.ceil((CHECK_COOLDOWN_MS - elapsed) / 1000)} сек.`,
      )
      return
    }
    try {
      setIsChecking(true)
      startCooldown()
      const prevCompleted = extensions.filter((e) => e.conditionMet).length
      const response = await authApiClient.checkExtensions()
      if (response && response.success) {
        const nextExtensions = toExtensionsArray(response.extensions)
        setExtensions(nextExtensions)
        if (response.default) setDefaultSub(response.default)
        if (response.user) setUser(response.user)
        const nowCompleted = nextExtensions.filter((e) => e.conditionMet).length
        if (nowCompleted > prevCompleted) {
          toast.success('Отлично! Новые условия засчитаны 🎉')
        } else {
          toast.info('Пока без изменений — попробуй чуть позже')
        }
      } else {
        toast.error('Не удалось проверить условия')
      }
    } catch (err) {
      console.error('Failed to check Extensions', err)
      toast.error('Ошибка при проверке условий')
    } finally {
      setIsChecking(false)
    }
    // extensions читается только для сравнения "было/стало" — намеренно
    // не добавляем в deps, чтобы не пересоздавать колбэк на каждый setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser, startCooldown])

  useEffect(() => {
    fetchExtensions()
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
    }
  }, [fetchExtensions])

  const handleAction = useCallback(
    (ext: SubscriptionExtensionsWithConditionsInterface) => {
      const key = String(ext.key)

      if (
        parseReferralTarget(key) !== null ||
        parseReactivationTarget(key) !== null
      ) {
        router.push(FRIENDS_PAGE_URL)
        return
      }

      switch (ext.key) {
        case SubscriptionExtensionsEnum.PREMIUM:
          setPremiumModalOpen(true)
          break
        case SubscriptionExtensionsEnum.CHANNEL:
          window.open(
            config.TELEGRAM_CHANNEL_URL ?? 'https://t.me/vpnsibcom',
            '_blank',
          )
          break
        case SubscriptionExtensionsEnum.CHAT:
          window.open(
            config.TELEGRAM_CHAT_URL ?? 'https://t.me/vpnsibcom_chat',
            '_blank',
          )
          break
        default:
          break
      }
    },
    [router],
  )

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Скопировано: ${text}`)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }, [])

  /* ── derived lists ── */
  const visible = useMemo(
    () => toExtensionsArray(extensions).filter(hasAnyReward),
    [extensions],
  )
  const pending = useMemo(
    () => visible.filter((e) => !e.conditionMet),
    [visible],
  )
  const completed = useMemo(
    () => visible.filter((e) => e.conditionMet),
    [visible],
  )

  const potential = useMemo(
    () =>
      pending.reduce(
        (acc, e) => {
          acc.days += e.days || 0
          acc.devices += e.devicesCount || 0
          if (e.isUnlimitTraffic) {
            acc.unlimited = true
          } else {
            acc.trafficGb += e.trafficLimitGb || 0
          }
          if (e.isPremiumServers) acc.premiumServers = true
          if (e.isNoAds) acc.noAds = true
          if (e.isAutoRenewing) acc.autoRenewing = true
          return acc
        },
        {
          days: 0,
          devices: 0,
          trafficGb: 0,
          unlimited: false,
          premiumServers: false,
          noAds: false,
          autoRenewing: false,
        },
      ),
    [pending],
  )

  const progress = visible.length > 0 ? completed.length / visible.length : 0
  const allDone = visible.length > 0 && pending.length === 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2
          size={22}
          className="animate-spin"
          style={{ color: 'var(--on-surface-variant)' }}
        />
      </div>
    )
  }

  if (visible.length === 0) return null

  const showNavigateButton = Boolean(navigateHref) && !allDone

  const headerCard = (
    <div
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{
        background: allDone
          ? 'linear-gradient(135deg, rgba(55,227,162,0.16), rgba(106,227,255,0.06))'
          : 'linear-gradient(135deg, rgba(157,113,255,0.14), rgba(106,227,255,0.06))',
        border: `1px solid ${
          allDone ? 'rgba(55,227,162,0.28)' : 'rgba(195,166,255,0.2)'
        }`,
      }}>
      {/* ambient glow signature */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl"
        style={{
          background: allDone
            ? 'rgba(55,227,162,0.18)'
            : 'rgba(157,113,255,0.16)',
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="flex items-center gap-1.5 text-[13.5px] font-bold break-words"
            style={{ color: 'var(--on-surface)' }}>
            {!allDone && (
              <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            )}
            {allDone
              ? 'Все лимиты сняты! 🎉'
              : 'Расширь лимиты подписки бесплатно'}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.85 }}>
            Выполнено {completed.length} из {visible.length}
          </span>
        </div>

        {!allDone && showNavigateButton && (
          <Link
            href={navigateHref!}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold shrink-0"
            style={{
              background:
                'linear-gradient(135deg, var(--primary-deep), var(--primary))',
              color: 'var(--on-primary)',
            }}>
            <ExternalLink size={13} />
            {navigateLabel}
          </Link>
        )}

        {!allDone && !showNavigateButton && (
          <motion.button
            onClick={checkExtensions}
            disabled={isChecking || cooldownLeft > 0}
            whileHover={
              !isChecking && cooldownLeft === 0 ? { scale: 1.03 } : undefined
            }
            whileTap={
              !isChecking && cooldownLeft === 0 ? { scale: 0.96 } : undefined
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold shrink-0"
            style={{
              background:
                isChecking || cooldownLeft > 0
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
              color:
                isChecking || cooldownLeft > 0
                  ? 'var(--on-surface-variant)'
                  : 'var(--on-primary)',
              cursor: isChecking || cooldownLeft > 0 ? 'default' : 'pointer',
              opacity: isChecking || cooldownLeft > 0 ? 0.7 : 1,
            }}>
            {isChecking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            {isChecking
              ? 'Проверяем…'
              : cooldownLeft > 0
                ? `Ждать ${cooldownLeft}с`
                : 'Проверить'}
          </motion.button>
        )}

        {allDone && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{
              background: 'rgba(55,227,162,0.16)',
              color: 'var(--success)',
            }}>
            <PartyPopper size={18} />
          </motion.div>
        )}
      </div>

      {/* progress bar */}
      <div
        className="relative mt-3 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: allDone
              ? 'linear-gradient(90deg, var(--success), #6ae3ff)'
              : 'var(--primary-gradient)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        />
      </div>

      {/* motivational summary of what's still on the table */}
      {pending.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-1.5 mt-2.5">
          <span
            className="text-[11px]"
            style={{ color: 'var(--on-surface-variant)', opacity: 0.8 }}>
            Ещё доступно:
          </span>
          {potential.days > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--star)', 15),
                color: 'var(--star)',
                border: `1px solid ${tint('var(--star)', 30)}`,
              }}>
              <Calendar size={11} />+{potential.days}{' '}
              {pluralDays(potential.days)}
            </span>
          )}
          {potential.devices > 0 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--info)', 15),
                color: 'var(--info)',
                border: `1px solid ${tint('var(--info)', 30)}`,
              }}>
              <Sparkles size={11} />+{potential.devices}{' '}
              {pluralDevices(potential.devices)}
            </span>
          )}
          {potential.trafficGb > 0 && !potential.unlimited && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--traffic)', 15),
                color: 'var(--traffic)',
                border: `1px solid ${tint('var(--traffic)', 30)}`,
              }}>
              <Gauge size={11} />+{potential.trafficGb} ГБ/день
            </span>
          )}
          {potential.unlimited && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--success)', 15),
                color: 'var(--success)',
                border: `1px solid ${tint('var(--success)', 30)}`,
              }}>
              <InfinityIcon size={11} />
              Безлимитный трафик
            </span>
          )}
          {potential.premiumServers && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--primary)', 15),
                color: 'var(--primary)',
                border: `1px solid ${tint('var(--primary)', 30)}`,
              }}>
              <ServerCog size={11} />
              Премиум серверы
            </span>
          )}
          {potential.noAds && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--cta)', 15),
                color: 'var(--cta)',
                border: `1px solid ${tint('var(--cta)', 30)}`,
              }}>
              <VolumeX size={11} />
              Без рекламы
            </span>
          )}
          {potential.autoRenewing && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold"
              style={{
                background: tint('var(--accent-network)', 15),
                color: 'var(--accent-network)',
                border: `1px solid ${tint('var(--accent-network)', 30)}`,
              }}>
              <RefreshCw size={11} />
              Автопродление
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'mini') {
    return (
      <div className={`font-mono w-full ${className ?? ''}`}>{headerCard}</div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 font-mono w-full ${className ?? ''}`}>
      {headerCard}

      {defaultSub && (
        <BaselineLimits defaultSub={defaultSub} completed={completed} />
      )}

      {/* ── Pending extensions ───────────────────────────────────── */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {pending.map((ext) => (
            <ExtensionCard
              key={extUid(ext)}
              ext={ext}
              user={user as unknown as Record<string, unknown>}
              onAction={handleAction}
              onCopy={handleCopy}
            />
          ))}
        </AnimatePresence>

        {/* ── Completed section ──────────────────────────────────── */}
        {completed.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-1 mb-0.5 px-1">
              <div
                className="h-px flex-1"
                style={{ background: 'var(--surface-strong-border)' }}
              />
              <span
                className="text-[10.5px] font-bold tracking-wide flex items-center gap-1"
                style={{ color: 'var(--success)', opacity: 0.85 }}>
                <CheckCircle2 size={12} />
                ВЫПОЛНЕНО ({completed.length})
              </span>
              <div
                className="h-px flex-1"
                style={{ background: 'var(--surface-strong-border)' }}
              />
            </div>
            <AnimatePresence mode="popLayout">
              {completed.map((ext) => (
                <ExtensionCard
                  key={extUid(ext)}
                  ext={ext}
                  user={user as unknown as Record<string, unknown>}
                  onAction={handleAction}
                  onCopy={handleCopy}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </LayoutGroup>

      {/* ── Premium purchase modal ────────────────────────────────── */}
      <Modal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        // title="Telegram Premium"
        variant="premium"
        showCancelButton={false}>
        <PremiumPurchase
          premiumExtension={extensions.find(
            (el) => el.key === SubscriptionExtensionsEnum.PREMIUM,
          )}
          onClose={() => setPremiumModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
