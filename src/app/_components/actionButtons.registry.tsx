import { config } from '@app/config/client'
import {
  HiChatBubbleLeftRight,
  HiDocumentText,
  HiLifebuoy,
  HiLockClosed,
  HiMegaphone,
  HiShieldCheck,
  HiSpeakerWave,
} from 'react-icons/hi2'
import type { AccentKey, BadgeKind, IconComponent } from './ActionButton'

/* ─── MD-документы лежат в /public. Если положишь их в подпапку —
 * поменяй пути только здесь. ── */
export type DocSlug = 'terms' | 'privacy'

export const DOC_MD_PATH: Record<DocSlug, string> = {
  terms: '/terms.md',
  privacy: '/privacy.md',
}

export const DOC_TITLE: Record<DocSlug, string> = {
  terms: 'Пользовательское соглашение',
  privacy: 'Политика конфиденциальности',
}

/* ─── Тип действия кнопки ─────────────────────────────────────────── */
export type ButtonAction =
  | { kind: 'link'; href: string }
  | { kind: 'doc'; slug: DocSlug }

export interface ButtonConfig {
  key: string
  label: string
  description: string
  icon: IconComponent
  accent: AccentKey
  badge: BadgeKind | undefined // не опционально — заставляет явно указать undefined
  action: ButtonAction
}

/* ─── Реестр всех кнопок соц-блока / меню ────────────────────────── *
 * Добавляешь новый пункт (страница, канал, что угодно) — просто новая
 * запись здесь. ActionButton и весь стиль уже готовы, ничего в
 * SocialButtons/BurgerMenu трогать не нужно. */
export const ACTION_BUTTONS_REGISTRY = {
  channel: {
    key: 'channel',
    label: 'Канал',
    description: 'Новости и обновления',
    icon: HiMegaphone,
    accent: 'info',
    badge: undefined,
    action: { kind: 'link', href: config.TELEGRAM_CHANNEL_URL || '' },
  },
  chat: {
    key: 'chat',
    label: 'Чат и поддержка',
    description: 'Быстрая помощь онлайн',
    icon: HiChatBubbleLeftRight,
    accent: 'success',
    badge: 'live',
    action: { kind: 'link', href: config.TELEGRAM_CHAT_URL || '' },
  },
  support: {
    key: 'support',
    label: 'Поддержка',
    description: 'Отдельный аккаунт для вопросов',
    icon: HiLifebuoy,
    accent: 'success',
    badge: undefined,
    action: { kind: 'link', href: 'https://t.me/VPNsibcom_support' },
  },
  personal: {
    key: 'personal',
    label: 'Личные вопросы',
    description: 'Приватная поддержка, реклама и сотрудничество',
    icon: HiLockClosed,
    accent: 'tertiary',
    badge: undefined,
    action: { kind: 'link', href: 'https://t.me/vpnsibcom?direct' },
  },
  ad: {
    key: 'ad',
    label: 'Заказать рекламу',
    description: 'Через платформу Taddy',
    icon: HiSpeakerWave,
    accent: 'ad',
    badge: 'new',
    action: { kind: 'link', href: 'https://taddy.pro/vpnsibcom_bot' },
  },
  terms: {
    key: 'terms',
    label: DOC_TITLE.terms,
    description: 'Условия использования сервиса',
    icon: HiDocumentText,
    accent: 'tertiary',
    badge: undefined,
    action: { kind: 'doc', slug: 'terms' },
  },
  privacy: {
    key: 'privacy',
    label: DOC_TITLE.privacy,
    description: 'Как мы обрабатываем данные',
    icon: HiShieldCheck,
    accent: 'tertiary',
    badge: undefined,
    action: { kind: 'doc', slug: 'privacy' },
  },
} as const satisfies Record<string, ButtonConfig>

export type ButtonKey = keyof typeof ACTION_BUTTONS_REGISTRY
