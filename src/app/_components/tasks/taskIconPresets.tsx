'use client'
import {
  Camera,
  Crown,
  Download,
  ExternalLink,
  Gem,
  MessageCircle,
  PlayCircle,
  Rocket,
  Send,
  Share2,
  Sparkle,
  Trophy,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { ComponentType } from 'react'

export type TaskIconPreset =
  | 'channel-subscribe'
  | 'invite-friends'
  | 'visit-link'
  | 'crown'
  | 'diamond'
  | 'chat'
  | 'share'
  | 'achievement'
  | 'boost-channel'
  | 'story-post'
  | 'video-watch'
  | 'app-install'
  | 'default'

export interface TaskColorScheme {
  Icon: LucideIcon | ComponentType<{ size?: number; className?: string }>
  /** Основной акцентный цвет (текст бейджа, иконка при hover) */
  accent: string
  /** Цвет текста поверх accent (при заливке иконки на hover) */
  onAccent: string
  /** Фон "контейнера" иконки в состоянии покоя */
  containerBg: string
  /** Граница карточки/иконки */
  border: string
  /** Цвет свечения (glow blob, pulse) — rgba */
  glow: string
  /** Градиент для залитой иконки на hover */
  gradient: string
}

export const TASK_ICON_PRESETS: Record<TaskIconPreset, TaskColorScheme> = {
  'channel-subscribe': {
    Icon: Send,
    accent: 'var(--info)',
    onAccent: 'var(--on-info)',
    containerBg: 'rgba(89,191,255,0.14)',
    border: 'rgba(89,191,255,0.25)',
    glow: 'rgba(89,191,255,0.22)',
    gradient: 'linear-gradient(135deg, #43a8f5, #59bfff)',
  },
  'invite-friends': {
    Icon: UserPlus,
    accent: 'var(--primary)',
    onAccent: 'var(--on-primary)',
    containerBg: 'rgba(195,166,255,0.14)',
    border: 'rgba(195,166,255,0.25)',
    glow: 'rgba(157,113,255,0.24)',
    gradient: 'var(--primary-gradient)',
  },
  'visit-link': {
    Icon: ExternalLink,
    accent: 'var(--traffic)',
    onAccent: 'var(--on-traffic)',
    containerBg: 'rgba(0,187,212,0.14)',
    border: 'rgba(0,187,212,0.25)',
    glow: 'rgba(0,187,212,0.2)',
    gradient: 'linear-gradient(135deg, #00a2b8, #00bbd4)',
  },
  crown: {
    Icon: Crown,
    accent: 'var(--star)',
    onAccent: 'var(--on-star)',
    containerBg: 'rgba(245,166,35,0.14)',
    border: 'rgba(245,166,35,0.28)',
    glow: 'rgba(245,166,35,0.26)',
    gradient: 'var(--star-gradient)',
  },
  diamond: {
    Icon: Gem,
    accent: 'var(--ton)',
    onAccent: 'var(--on-ton)',
    containerBg: 'rgba(0,136,204,0.14)',
    border: 'rgba(0,136,204,0.25)',
    glow: 'rgba(0,136,204,0.22)',
    gradient: 'linear-gradient(135deg, #0088cc, #30a1f5)',
  },
  chat: {
    Icon: MessageCircle,
    accent: 'var(--success)',
    onAccent: 'var(--on-success)',
    containerBg: 'rgba(55,227,162,0.14)',
    border: 'rgba(55,227,162,0.25)',
    glow: 'rgba(55,227,162,0.22)',
    gradient: 'linear-gradient(135deg, #2fcf90, #37e3a2)',
  },
  share: {
    Icon: Share2,
    accent: 'var(--cta)',
    onAccent: 'var(--on-cta)',
    containerBg: 'rgba(255,140,66,0.14)',
    border: 'rgba(255,140,66,0.25)',
    glow: 'rgba(255,140,66,0.22)',
    gradient: 'linear-gradient(135deg, #ff8c42, #ffab6b)',
  },
  achievement: {
    Icon: Trophy,
    accent: '#efb8c8',
    onAccent: '#4a2532',
    containerBg: 'rgba(239,184,200,0.14)',
    border: 'rgba(239,184,200,0.25)',
    glow: 'rgba(239,184,200,0.22)',
    gradient: 'linear-gradient(135deg, #d98ba0, #efb8c8)',
  },
  'boost-channel': {
    Icon: Rocket,
    accent: 'var(--primary-deep)',
    onAccent: '#fff',
    containerBg: 'rgba(157,113,255,0.16)',
    border: 'rgba(157,113,255,0.28)',
    glow: 'rgba(157,113,255,0.28)',
    gradient: 'linear-gradient(135deg, #7a4de0, #9d71ff)',
  },
  'story-post': {
    Icon: Camera,
    accent: 'var(--ticket)',
    onAccent: 'var(--on-ticket)',
    containerBg: 'rgba(239,100,112,0.14)',
    border: 'rgba(239,100,112,0.25)',
    glow: 'rgba(239,100,112,0.22)',
    gradient: 'linear-gradient(135deg, #d94a56, #ef6470)',
  },
  'video-watch': {
    Icon: PlayCircle,
    accent: 'var(--ad)',
    onAccent: 'var(--on-ad)',
    containerBg: 'rgba(255,106,0,0.14)',
    border: 'rgba(255,106,0,0.25)',
    glow: 'rgba(255,106,0,0.24)',
    gradient: 'linear-gradient(135deg, #e65c00, #ff6a00)',
  },
  'app-install': {
    Icon: Download,
    accent: 'var(--usdt)',
    onAccent: 'var(--on-usdt)',
    containerBg: 'rgba(80,175,149,0.14)',
    border: 'rgba(80,175,149,0.25)',
    glow: 'rgba(80,175,149,0.22)',
    gradient: 'linear-gradient(135deg, #3d9a80, #50af95)',
  },
  default: {
    Icon: Sparkle,
    accent: 'var(--cta)',
    onAccent: 'var(--on-cta)',
    containerBg: 'rgba(255,140,66,0.14)',
    border: 'rgba(255,140,66,0.25)',
    glow: 'rgba(255,140,66,0.22)',
    gradient: 'linear-gradient(135deg, #ff8c42, #ffab6b)',
  },
}
