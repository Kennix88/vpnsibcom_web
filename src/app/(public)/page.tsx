'use client'

import { motion } from 'framer-motion'
import {
  ChevronRight,
  Crown,
  Flame,
  LogIn,
  LogOut,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PublicUser = {
  id: string
  username: string
  avatar: string
  bestScore: number
  createdAt: string
}

type LeaderboardRow = {
  rank: number
  username: string
  avatar: string
  score: number
  updatedAt: string
}

type TargetKind = 'arcane' | 'bonus' | 'curse'
type Target = {
  cell: number
  rune: string
  kind: TargetKind
}

const BOARD_SIZE = 12
const RUNE_POOL = ['✦', '✧', '✶', '⟡', '☾', '⚝', '✹', '✺', '✪', '✫']

const STAT_CARDS = [
  { icon: <Zap size={16} />, label: 'Раунд', value: '45 сек' },
  { icon: <Trophy size={16} />, label: 'Лидеры', value: 'Топ-10' },
  { icon: <Flame size={16} />, label: 'Темп', value: 'Ускоряется' },
]

const NEWS = [
  {
    title: 'Новая арена открыта',
    text: 'Врата архива теперь доступны всем участникам.',
  },
  {
    title: 'Ежедневный бонус',
    text: 'За лучший раунд дня начисляются дополнительные звёзды.',
  },
  { title: 'Турнир недели', text: 'Идёт отбор в закрытый сезонный чемпионат.' },
]

function kindMeta(kind: TargetKind) {
  if (kind === 'bonus') {
    return {
      label: 'Бонус',
      glow: 'var(--star)',
      ring: 'rgba(245,166,35,0.28)',
    }
  }
  if (kind === 'curse') {
    return {
      label: 'Проклятие',
      glow: 'var(--error)',
      ring: 'rgba(255,107,102,0.28)',
    }
  }
  return {
    label: 'Руна',
    glow: 'var(--primary)',
    ring: 'rgba(195,166,255,0.28)',
  }
}

function scoreLevel(score: number) {
  return Math.max(1, Math.floor(score / 250) + 1)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}

function boardTimeout(kind: TargetKind, score: number, combo: number) {
  const base = kind === 'bonus' ? 1120 : kind === 'curse' ? 820 : 920
  const pressure = Math.min(280, Math.floor(score / 18) * 10 + combo * 8)
  return Math.max(520, base - pressure)
}

function AuthModal({
  open,
  mode,
  busy,
  error,
  onClose,
  onSwitchMode,
  onSubmit,
}: {
  open: boolean
  mode: 'login' | 'register'
  busy: boolean
  error: string | null
  onClose: () => void
  onSwitchMode: (mode: 'login' | 'register') => void
  onSubmit: (payload: {
    mode: 'login' | 'register'
    username: string
    password: string
  }) => Promise<void>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!open) {
      setUsername('')
      setPassword('')
    }
  }, [open])

  if (!open) return null

  return (
    <div className="arc-modal">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        className="arc-modal-card">
        <div className="arc-modal-head">
          <div className="arc-brand">
            <div className="arc-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="arc-title">Арканум</div>
              <div className="arc-subtitle">Вход в демо-арену</div>
            </div>
          </div>

          <button className="arc-x" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="arc-tabs">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onSwitchMode(tab)}
              className={mode === tab ? 'arc-tab active' : 'arc-tab'}>
              {tab === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div className="arc-form">
          <label className="arc-field">
            <span>Логин</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Никнейм"
              autoComplete="username"
            />
          </label>

          <label className="arc-field">
            <span>Пароль</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </label>

          {error && <div className="arc-error">{error}</div>}

          <button
            onClick={() => onSubmit({ mode, username, password })}
            disabled={busy}
            className="arc-primary-btn">
            {busy
              ? 'Подключение…'
              : mode === 'login'
                ? 'Войти'
                : 'Создать аккаунт'}
          </button>

          <div className="arc-note">
            Серверная авторизация через cookie-session
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [me, setMe] = useState<PublicUser | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(45)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [target, setTarget] = useState<Target | null>(null)

  const timeoutRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const finishedRef = useRef(false)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)

  const clearTargetTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const showNotice = useCallback((text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2400)
  }, [])

  const loadMe = useCallback(async () => {
    const res = await fetch('/api/me', { credentials: 'include' })
    const data = (await res.json()) as { user: PublicUser | null }
    setMe(data.user)
  }, [])

  const loadLeaderboard = useCallback(async () => {
    const res = await fetch('/api/leaderboard?limit=10', {
      credentials: 'include',
    })
    const data = (await res.json()) as { leaderboard: LeaderboardRow[] }
    setLeaderboard(data.leaderboard || [])
  }, [])

  useEffect(() => {
    void loadMe()
    void loadLeaderboard()
  }, [loadLeaderboard, loadMe])

  useEffect(() => {
    if (!running) return
    const tick = window.setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [running])

  useEffect(() => {
    if (running && timeLeft <= 0) {
      void finishGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  const spawnTarget = useCallback(() => {
    if (!runningRef.current) return

    const cell = Math.floor(Math.random() * BOARD_SIZE)
    const kindRoll = Math.random()
    const kind: TargetKind =
      kindRoll < 0.14 ? 'bonus' : kindRoll > 0.9 ? 'curse' : 'arcane'

    setTarget({
      cell,
      kind,
      rune: RUNE_POOL[Math.floor(Math.random() * RUNE_POOL.length)],
    })

    clearTargetTimer()
    timeoutRef.current = window.setTimeout(
      () => {
        if (!runningRef.current) return
        setCombo(0)
        setTimeLeft((t) => Math.max(0, t - 1))
        spawnTarget()
      },
      boardTimeout(kind, scoreRef.current, comboRef.current),
    )
  }, [clearTargetTimer])

  const startGame = useCallback(() => {
    clearTargetTimer()
    runningRef.current = true
    finishedRef.current = false

    scoreRef.current = 0
    comboRef.current = 0
    setScore(0)
    setCombo(0)
    setTimeLeft(45)
    setTarget(null)
    setRunning(true)

    window.setTimeout(() => spawnTarget(), 60)
  }, [clearTargetTimer, spawnTarget])

  const finishGame = useCallback(async () => {
    if (finishedRef.current) return
    finishedRef.current = true

    runningRef.current = false
    setRunning(false)
    clearTargetTimer()
    setTarget(null)

    if (!me) {
      showNotice('Войдите, чтобы сохранить рекорд')
      setAuthMode('login')
      setAuthOpen(true)
      return
    }

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })

      if (!res.ok) throw new Error('save failed')

      const data = (await res.json()) as {
        bestScore: number
        leaderboard: LeaderboardRow[]
      }

      setMe((prev) => (prev ? { ...prev, bestScore: data.bestScore } : prev))
      setLeaderboard(data.leaderboard || [])
      showNotice(`Результат сохранён: ${score}`)
    } catch {
      showNotice('Не удалось сохранить результат')
    }
  }, [clearTargetTimer, me, score, showNotice])

  const handleCellClick = useCallback(
    (index: number) => {
      if (!running || !target) return

      if (index !== target.cell) {
        setCombo(0)
        setTimeLeft((t) => Math.max(0, t - 1))
        return
      }

      const meta = kindMeta(target.kind)
      const base =
        target.kind === 'bonus' ? 18 : target.kind === 'curse' ? 8 : 10
      const comboBonus = Math.min(comboRef.current, 8)
      const nextScore = scoreRef.current + base + comboBonus
      const nextCombo = comboRef.current + 1

      scoreRef.current = nextScore
      comboRef.current = nextCombo
      setScore(nextScore)
      setCombo(nextCombo)

      if (target.kind === 'bonus') {
        setTimeLeft((t) => Math.min(60, t + 2))
      } else if (target.kind === 'curse') {
        setTimeLeft((t) => Math.max(0, t - 1))
      }

      clearTargetTimer()
      if (runningRef.current) {
        spawnTarget()
      } else {
        showNotice(meta.label)
      }
    },
    [clearTargetTimer, combo, running, spawnTarget, target, showNotice],
  )

  const handleAuthSubmit = useCallback(
    async (payload: {
      mode: 'login' | 'register'
      username: string
      password: string
    }) => {
      setAuthBusy(true)
      setAuthError(null)

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = (await res.json()) as
          | { user: PublicUser }
          | { error: string }

        if (!res.ok) {
          throw new Error('error' in data ? data.error : 'Не удалось войти')
        }

        setMe((data as { user: PublicUser }).user)
        setAuthOpen(false)
        showNotice(
          payload.mode === 'login' ? 'Вход выполнен' : 'Аккаунт создан',
        )
        await loadLeaderboard()
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : 'Не удалось войти')
      } finally {
        setAuthBusy(false)
      }
    },
    [loadLeaderboard, showNotice],
  )

  const handleLogout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setMe(null)
    showNotice('Вы вышли из аккаунта')
  }, [showNotice])

  const profileLevel = useMemo(() => scoreLevel(me?.bestScore ?? 0), [me])

  return (
    <main className="arc-main">
      <style jsx global>{`
        .arc-main {
          min-height: 100dvh;
          background:
            radial-gradient(
              circle at top,
              rgba(157, 113, 255, 0.16),
              transparent 34%
            ),
            linear-gradient(180deg, var(--background), var(--surface-dim));
          color: var(--on-background);
          overflow-x: hidden;
        }

        .arc-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 18px 16px 28px;
        }

        .arc-header {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(14px);
          background: rgba(21, 20, 23, 0.72);
          border-bottom: 1px solid var(--surface-border);
        }

        .arc-header-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .arc-hero-grid,
        .arc-play-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
          gap: 16px;
          align-items: stretch;
          margin-bottom: 16px;
        }

        .arc-card {
          min-width: 0;
        }

        .arc-game-panel {
          display: grid;
          gap: 14px;
          min-width: 0;
        }

        .arc-board-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          width: 100%;
          max-width: 640px;
          margin-inline: auto;
        }

        .arc-board-grid button {
          aspect-ratio: 1 / 1;
        }

        .arc-news-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .arc-leaderboard-scroll {
          max-height: 560px;
          overflow: auto;
          padding-right: 2px;
        }

        .arc-modal {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.68);
          display: grid;
          place-items: center;
          padding: 16px;
          backdrop-filter: blur(10px);
        }

        .arc-modal-card {
          width: 100%;
          max-width: 420px;
          border-radius: 24px;
          background: var(--surface-container);
          border: 1px solid var(--outline-variant);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.45);
          padding: 24px;
        }

        .arc-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 18px;
        }

        .arc-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .arc-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: var(--primary-container);
          color: var(--on-primary-container);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .arc-title {
          font-weight: 900;
          font-size: 18px;
          color: var(--on-surface);
        }

        .arc-subtitle {
          font-size: 12px;
          color: var(--on-surface-variant);
        }

        .arc-x {
          background: transparent;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        }

        .arc-tabs {
          display: flex;
          padding: 4px;
          background: var(--surface-container-high);
          border-radius: 16px;
          margin-bottom: 18px;
          gap: 4px;
        }

        .arc-tab {
          flex: 1;
          border: none;
          cursor: pointer;
          border-radius: 12px;
          padding: 10px 12px;
          background: transparent;
          color: var(--on-surface-variant);
          font-weight: 700;
          font-size: 14px;
        }

        .arc-tab.active {
          background: var(--primary);
          color: var(--on-primary);
        }

        .arc-form {
          display: grid;
          gap: 12px;
        }

        .arc-field {
          display: grid;
          gap: 6px;
        }

        .arc-field span {
          font-size: 12px;
          color: var(--on-surface-variant);
        }

        .arc-field input {
          width: 100%;
          box-sizing: border-box;
          border-radius: 14px;
          padding: 13px 14px;
          background: var(--surface-container-high);
          border: 1px solid var(--outline-variant);
          color: var(--on-surface);
          outline: none;
        }

        .arc-error {
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(255, 107, 102, 0.12);
          color: var(--error);
          font-size: 13px;
        }

        .arc-primary-btn {
          margin-top: 2px;
          border: none;
          border-radius: 14px;
          padding: 13px 16px;
          cursor: pointer;
          background: var(--primary-gradient);
          color: var(--on-primary);
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .arc-primary-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .arc-note {
          font-size: 12px;
          color: var(--on-surface-variant);
          text-align: center;
        }

        @media (max-width: 1024px) {
          .arc-hero-grid,
          .arc-play-grid,
          .arc-news-grid {
            grid-template-columns: 1fr;
          }

          .arc-page {
            padding: 14px 12px 24px;
          }

          .arc-board-grid {
            max-width: 560px;
          }
        }

        @media (max-width: 720px) {
          .arc-header-inner {
            padding: 12px 12px;
            flex-wrap: wrap;
          }

          .arc-header-inner > div:last-child {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .arc-board-grid {
            gap: 8px;
          }

          .arc-modal-card {
            padding: 20px;
          }
        }

        @media (max-width: 520px) {
          .arc-board-grid {
            max-width: 100%;
            gap: 7px;
          }

          .arc-board-grid button {
            border-radius: 18px;
          }
        }
      `}</style>

      {notice && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 18,
              right: window.innerWidth <= 640 ? 12 : 18,
              left: window.innerWidth <= 640 ? 12 : 'auto',
              zIndex: 90,
              borderRadius: 14,
              background: 'var(--surface-container-high)',
              border: '1px solid var(--outline-variant)',
              padding: '12px 16px',
              color: 'var(--on-surface)',
              boxShadow: '0 12px 34px rgba(0,0,0,0.35)',
              maxWidth: window.innerWidth <= 640 ? 'none' : 320,
            }}>
            {notice}
          </div>
        </>
      )}

      <header className="arc-header">
        <div className="arc-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--primary-container)',
                color: 'var(--on-primary-container)',
                boxShadow: 'var(--elevation-1-glow)',
              }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>
                Арканум
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                Демо-арена
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {me ? (
              <button
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid var(--outline-variant)',
                  background: 'transparent',
                  color: 'var(--on-surface)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}>
                <LogOut size={16} />
                Выйти
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setAuthOpen(true)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--outline-variant)',
                    background: 'transparent',
                    color: 'var(--on-surface)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}>
                  <LogIn size={16} />
                  Войти
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register')
                    setAuthOpen(true)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    border: 'none',
                    background: 'var(--primary-gradient)',
                    color: 'var(--on-primary)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}>
                  Регистрация
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="arc-page">
        <section className="arc-hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="arc-card"
            style={{
              borderRadius: 28,
              border: '1px solid var(--outline-variant)',
              background:
                'linear-gradient(180deg, rgba(30,27,34,0.96), rgba(21,20,23,0.94))',
              padding: 28,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 22px 60px rgba(0,0,0,0.22)',
            }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 30% 0%, rgba(157,113,255,0.14), transparent 30%), radial-gradient(circle at 85% 12%, rgba(106,227,255,0.12), transparent 22%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 999,
                  padding: '8px 12px',
                  background: 'rgba(195,166,255,0.12)',
                  color: 'var(--primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                }}>
                <Flame size={14} />
                Залипательная демо-арена
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(34px, 6vw, 62px)',
                  lineHeight: 0.95,
                  letterSpacing: '-1.6px',
                  fontWeight: 950,
                }}>
                Арканум
              </h1>

              <p
                style={{
                  margin: '14px 0 18px',
                  maxWidth: 620,
                  fontSize: 'clamp(15px, 2vw, 18px)',
                  lineHeight: 1.55,
                  color: 'var(--on-surface-variant)',
                }}>
                Собирай руны, держи комбо и поднимайся в таблице лидеров.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 18,
                }}>
                <button
                  onClick={startGame}
                  style={{
                    border: 'none',
                    borderRadius: 16,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    background: 'var(--primary-gradient)',
                    color: 'var(--on-primary)',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 14px 34px rgba(157,113,255,0.22)',
                  }}>
                  <Sparkles size={16} />
                  Начать раунд
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register')
                    setAuthOpen(true)
                  }}
                  style={{
                    borderRadius: 16,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid var(--outline-variant)',
                    color: 'var(--on-surface)',
                    fontWeight: 800,
                  }}>
                  Создать аккаунт
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 10,
                }}>
                {STAT_CARDS.map((card) => (
                  <div
                    key={card.label}
                    style={{
                      borderRadius: 18,
                      background: 'var(--surface-container)',
                      border: '1px solid var(--outline-variant)',
                      padding: '14px 14px',
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--on-surface-variant)',
                        fontSize: 12,
                      }}>
                      {card.icon}
                      {card.label}
                    </div>
                    <div
                      style={{ marginTop: 6, fontWeight: 900, fontSize: 16 }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="arc-card"
            style={{
              borderRadius: 28,
              border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container)',
              padding: 20,
              boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
              display: 'grid',
              gap: 14,
              alignContent: 'start',
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <div>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Профиль
                </div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  Сессия игрока
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--primary-container)',
                  color: 'var(--on-primary-container)',
                }}>
                <UserRound size={20} />
              </div>
            </div>

            {me ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    borderRadius: 22,
                    padding: 16,
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}>
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: '50%',
                      background: 'var(--primary-container)',
                      border: '2px solid var(--primary)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 28,
                    }}>
                    {me.avatar}
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {me.username}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--on-surface-variant)',
                        marginTop: 4,
                      }}>
                      Уровень {scoreLevel(me.bestScore)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                  }}>
                  <div
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--outline-variant)',
                    }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--on-surface-variant)',
                      }}>
                      Лучший рекорд
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 22,
                        fontWeight: 900,
                        color: 'var(--star)',
                      }}>
                      {me.bestScore}
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--outline-variant)',
                    }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--on-surface-variant)',
                      }}>
                      Текущий уровень
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 22,
                        fontWeight: 900,
                        color: 'var(--primary)',
                      }}>
                      {profileLevel}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 22,
                  padding: 18,
                  background:
                    'linear-gradient(180deg, rgba(59,42,115,0.34), rgba(30,27,34,0.9))',
                  border: '1px solid rgba(195,166,255,0.18)',
                }}>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
                  Войдите или зарегистрируйтесь
                </div>
                <div
                  style={{
                    color: 'var(--on-surface-variant)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    marginBottom: 14,
                  }}>
                  Тогда рекорды будут сохраняться на сервере, а таблица лидеров
                  обновится автоматически.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setAuthMode('login')
                      setAuthOpen(true)
                    }}
                    style={{
                      borderRadius: 14,
                      border: '1px solid var(--outline-variant)',
                      background: 'transparent',
                      color: 'var(--on-surface)',
                      padding: '11px 14px',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}>
                    Войти
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register')
                      setAuthOpen(true)
                    }}
                    style={{
                      borderRadius: 14,
                      border: 'none',
                      background: 'var(--primary-gradient)',
                      color: 'var(--on-primary)',
                      padding: '11px 14px',
                      cursor: 'pointer',
                      fontWeight: 900,
                    }}>
                    Регистрация
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </section>

        <section className="arc-play-grid">
          <motion.div
            id="game"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="arc-card arc-game-panel"
            style={{
              borderRadius: 28,
              border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container)',
              padding: 20,
              boxShadow: '0 22px 60px rgba(0,0,0,0.16)',
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
              <div>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Мини-игра
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Лови руны</div>
              </div>

              <button
                onClick={startGame}
                style={{
                  borderRadius: 14,
                  border: 'none',
                  padding: '11px 14px',
                  cursor: 'pointer',
                  background: 'var(--primary-gradient)',
                  color: 'var(--on-primary)',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Sparkles size={16} />
                {running ? 'Сбросить' : 'Играть'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}>
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                }}>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Счёт
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 950,
                    color: 'var(--star)',
                  }}>
                  {score}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                }}>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Комбо
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 950,
                    color: 'var(--primary)',
                  }}>
                  {combo}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                }}>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Время
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 950,
                    color: timeLeft < 10 ? 'var(--error)' : 'var(--success)',
                  }}>
                  {timeLeft}s
                </div>
              </div>
            </div>

            <div className="arc-board-grid">
              {Array.from({ length: BOARD_SIZE }).map((_, index) => {
                const active = running && target?.cell === index
                const meta = target ? kindMeta(target.kind) : null

                return (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    style={{
                      borderRadius: 22,
                      border: active
                        ? `1px solid ${meta?.glow}`
                        : '1px solid var(--outline-variant)',
                      background: active
                        ? `radial-gradient(circle at top, ${meta?.ring}, rgba(0,0,0,0) 72%), var(--primary-container)`
                        : 'linear-gradient(180deg, var(--surface-container-high), var(--surface-container-low))',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      color: active
                        ? 'var(--on-primary-container)'
                        : 'var(--on-surface)',
                      boxShadow: active
                        ? '0 0 0 1px rgba(255,255,255,0.04) inset'
                        : 'none',
                      minWidth: 0,
                    }}>
                    {active && target && (
                      <motion.div
                        key={`${target.cell}-${target.kind}`}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                        }}>
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 'clamp(24px, 5vw, 38px)',
                              lineHeight: 1,
                            }}>
                            {target.rune}
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              borderRadius: 999,
                              padding: '4px 10px',
                              background: 'rgba(0,0,0,0.18)',
                              fontSize: 11,
                              fontWeight: 800,
                            }}>
                            {target.kind === 'bonus' ? (
                              <Star size={12} />
                            ) : target.kind === 'curse' ? (
                              <Crown size={12} />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            {meta?.label}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!active && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                          opacity: 0.45,
                          fontSize: 18,
                          color: 'var(--on-surface-variant)',
                        }}>
                        ◦
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div
              style={{
                fontSize: 13,
                color: 'var(--on-surface-variant)',
                lineHeight: 1.5,
              }}>
              Нажимайте на светящуюся руну. Бонусы дают больше очков, проклятия
              ускоряют раунд. Чем больше счёт, тем быстрее темп.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="arc-card"
            style={{
              borderRadius: 28,
              border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container)',
              padding: 20,
              boxShadow: '0 22px 60px rgba(0,0,0,0.16)',
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 14,
              }}>
              <div>
                <div
                  style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Лидерборд
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Топ игроков</div>
              </div>
              <Trophy size={18} color="var(--star)" />
            </div>

            <div
              className="arc-leaderboard-scroll"
              style={{ display: 'grid', gap: 10 }}>
              {leaderboard.map((row) => (
                <div
                  key={`${row.username}-${row.rank}`}
                  style={{
                    borderRadius: 18,
                    padding: '12px 14px',
                    background:
                      row.username === me?.username
                        ? 'rgba(195,166,255,0.08)'
                        : 'var(--surface-container-high)',
                    border:
                      row.username === me?.username
                        ? '1px solid rgba(195,166,255,0.26)'
                        : '1px solid var(--outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                  <div
                    style={{
                      width: 32,
                      textAlign: 'center',
                      fontWeight: 900,
                      color:
                        row.rank === 1
                          ? 'var(--star)'
                          : row.rank === 2
                            ? '#c0c0c0'
                            : row.rank === 3
                              ? '#cd7f32'
                              : 'var(--on-surface-variant)',
                    }}>
                    {row.rank}
                  </div>

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--primary-container)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}>
                    {row.avatar}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                      {row.username}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--on-surface-variant)',
                      }}>
                      {timeAgo(row.updatedAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 16,
                        color: 'var(--primary)',
                      }}>
                      {row.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="arc-news-grid">
          {NEWS.map((item) => (
            <div
              key={item.title}
              style={{
                borderRadius: 22,
                padding: 16,
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
              }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--success)',
                  }}
                />
                <div style={{ fontWeight: 900 }}>{item.title}</div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--on-surface-variant)',
                  lineHeight: 1.5,
                }}>
                {item.text}
              </div>
            </div>
          ))}
        </section>
      </div>

      <AuthModal
        open={authOpen}
        mode={authMode}
        busy={authBusy}
        error={authError}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    </main>
  )
}
