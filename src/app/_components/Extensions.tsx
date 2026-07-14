'use client'

/**
 * Extensions — список расширений условий подписки.
 *
 * Показывает пользователю, как бесплатно снять жёсткие лимиты дефолтной
 * подписки: выполнил условие → нажал "Проверить" → получил награду.
 *
 * Подключи компонент рядом с Task-компонентами на той же странице —
 * стилистика (font-mono, glass, --surface-* токены) уже согласована с
 * TaskAdsReward / Modal / TooltipWrapper.
 *
 * Каждый тип расширения (PREMIUM/CHANNEL/CHAT/BIO/NAME/ROLE) получил свою
 * акцентную тему (см. KEY_THEME/ROLE_THEME) — карточки визуально различимы,
 * а не выглядят как повторяющийся шаблон.
 *
 * ПРЕДПОЛОЖЕНИЯ, которые стоит проверить под свой проект:
 *  - authApiClient.getExtensions() / checkExtensions() уже существуют
 *    (сигнатура взята из твоего черновика).
 *  - Modal лежит в '@app/components/common/Modal' (default export).
 *  - TooltipWrapper лежит в '@app/components/common/TooltipWrapper'.
 *  - config.channelUrl / config.chatUrl — при отсутствии подставь свои
 *    ссылки на канал/чат (или добавь эти поля в client.config).
 *  - '@app/config/client' содержит botUsername, иначе поправь константу
 *    BOT_USERNAME ниже.
 */

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { useUserStore } from '@app/store/user.store'
import {
  SubscriptionExtensionsEnum,
  SubscriptionExtensionsWithConditionsInterface,
  SubscriptionExtensionsWithConditionsTypeEnum,
} from '@app/types/new-era.types'

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Gauge,
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
  Sparkles,
  Tag,
  User,
  VolumeX,
} from 'lucide-react'
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

/* ────────────────────────────────────────────────────────────────── */
/*  Static meta per extension key                                     */
/* ────────────────────────────────────────────────────────────────── */

type ExtMeta = {
  title: string
  description: string
  icon: ReactNode
  hint?: string
  ctaLabel?: string
}

const EXT_META: Record<SubscriptionExtensionsEnum, ExtMeta> = {
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
/*  Per-extension visual theme — каждая карточка получает свой         */
/*  акцентный цвет/градиент, чтобы список не выглядел монотонно        */
/* ────────────────────────────────────────────────────────────────── */

type CardTheme = { rgb: string; gradient: string }

const KEY_THEME: Record<SubscriptionExtensionsEnum, CardTheme> = {
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

function metaFor(ext: SubscriptionExtensionsWithConditionsInterface): ExtMeta {
  if (ext.type === SubscriptionExtensionsWithConditionsTypeEnum.ROLE) {
    return {
      title: ext.roleName ? `Роль «${ext.roleName}»` : 'Бонус роли',
      description: 'Награда за твою роль в системе — уже активна',
      icon: <Shield size={18} />,
    }
  }
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
  onAction,
  onCopy,
}: {
  ext: SubscriptionExtensionsWithConditionsInterface
  onAction: (ext: SubscriptionExtensionsWithConditionsInterface) => void
  onCopy: (text: string) => void
}) {
  const meta = metaFor(ext)
  const rewards = buildRewards(ext)
  const isRole = ext.type === SubscriptionExtensionsWithConditionsTypeEnum.ROLE
  const isCopyAction =
    ext.key === SubscriptionExtensionsEnum.BIO ||
    ext.key === SubscriptionExtensionsEnum.NAME
  const done = ext.conditionMet
  const theme = themeFor(ext)

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
        <span
          className="text-[11.5px] font-mono leading-snug pl-[52px] break-words"
          style={{
            color: 'var(--on-surface-variant)',
            opacity: done ? 0.65 : 0.9,
          }}>
          {meta.description}
        </span>

        {/* reward badges */}
        {rewards.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-[52px]">
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
          <div className="flex justify-end pl-[52px] mt-0.5">
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

export function Extensions() {
  const { setUser } = useUserStore()

  const [extensions, setExtensions] = useState<
    SubscriptionExtensionsWithConditionsInterface[]
  >([])
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
    [],
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
          return acc
        },
        { days: 0, devices: 0, trafficGb: 0, unlimited: false },
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

  return (
    <div className="flex flex-col gap-3 font-mono w-full">
      {/* ── Header / progress card ───────────────────────────────── */}
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="text-[13.5px] font-bold break-words"
              style={{ color: 'var(--on-surface)' }}>
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

          {!allDone && (
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
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
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
          </div>
        )}
      </div>

      {/* ── Pending extensions ───────────────────────────────────── */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {pending.map((ext) => (
            <ExtensionCard
              key={extUid(ext)}
              ext={ext}
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
