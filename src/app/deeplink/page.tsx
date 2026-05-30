'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import {
  TbAlertTriangle,
  TbCheck,
  TbCopy,
  TbExternalLink,
  TbPlugConnected,
  TbRefresh,
} from 'react-icons/tb'

/* ─── Types ──────────────────────────────────────────────────────────── */
type Phase =
  | 'init' // монтирование, пробуем auto-redirect
  | 'waiting' // показываем кнопку (auto не сработал или страница осталась)
  | 'success' // deeplink открыт
  | 'error' // нет ссылки / невалидная

/* ─── Animated orbital ring ──────────────────────────────────────────── */
function Ring({
  size,
  duration,
  delay,
  opacity,
  color,
}: {
  size: number
  duration: number
  delay: number
  opacity: number
  color: string
}) {
  return (
    <motion.div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width: size,
        height: size,
        borderColor: color,
        opacity,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      animate={{
        scale: [1, 1.06, 1],
        opacity: [opacity, opacity * 0.4, opacity],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* ─── Copy button ────────────────────────────────────────────────────── */
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-mono font-bold cursor-pointer transition-all"
      style={{
        background: copied ? 'rgba(55,227,162,0.1)' : 'rgba(255,255,255,0.05)',
        color: copied ? 'var(--success)' : 'var(--on-surface-variant)',
        border: `1px solid ${copied ? 'rgba(55,227,162,0.25)' : 'rgba(255,255,255,0.09)'}`,
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="ok"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}>
            <TbCheck size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="cp"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}>
            <TbCopy size={16} />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? 'Скопировано' : 'Скопировать ссылку'}
    </button>
  )
}

/* ─── Inner page ─────────────────────────────────────────────────────── */
function DeeplinkContent() {
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('init')
  const [url, setUrl] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const raw = searchParams.get('link')

    /* Нет ссылки — сразу ошибка */
    if (!raw) {
      setPhase('error')
      return
    }

    let decoded: string
    try {
      decoded = decodeURIComponent(raw)
    } catch {
      setPhase('error')
      return
    }

    setUrl(decoded)

    /* Пробуем тихий редирект */
    try {
      window.location.href = decoded
    } catch {
      /* ignore */
    }

    /*
     * Если страница всё ещё активна через 1.8 с — значит auto-redirect
     * не сработал (Telegram заблокировал или схема не открылась).
     * Показываем кнопку вручную.
     */
    timerRef.current = setTimeout(() => setPhase('waiting'), 1800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [searchParams])

  function handleOpen() {
    if (!url) return
    window.location.href = url
    setPhase('success')
  }

  /* ── Background ambient blobs ── */
  const blobs = [
    { x: '10%', y: '15%', w: 320, color: 'rgba(157,113,255,0.06)', blur: 80 },
    { x: '60%', y: '60%', w: 280, color: 'rgba(106,227,255,0.05)', blur: 70 },
    { x: '35%', y: '80%', w: 200, color: 'rgba(255,140,66,0.04)', blur: 60 },
  ]

  /* ── Orbital ring colors by phase ── */
  const ringColor =
    phase === 'success'
      ? 'var(--success)'
      : phase === 'error'
        ? 'var(--error)'
        : phase === 'waiting'
          ? 'var(--primary)'
          : 'rgba(195,166,255,0.4)'

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-5 py-10"
      style={{ background: 'var(--background)' }}>
      {/* Ambient background */}
      {blobs.map((b, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.w,
            background: b.color,
            filter: `blur(${b.blur}px)`,
          }}
        />
      ))}

      {/* Grid texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(195,166,255,0.03) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(195,166,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Orb + rings ── */}
      <div
        className="relative flex items-center justify-center mb-10"
        style={{ width: 160, height: 160 }}>
        {/* Rings */}
        <Ring
          size={160}
          duration={3.5}
          delay={0}
          opacity={0.18}
          color={ringColor}
        />
        <Ring
          size={130}
          duration={3.0}
          delay={0.4}
          opacity={0.22}
          color={ringColor}
        />
        <Ring
          size={100}
          duration={2.6}
          delay={0.8}
          opacity={0.28}
          color={ringColor}
        />

        {/* Orb */}
        <motion.div
          key={phase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 76,
            height: 76,
            background:
              phase === 'success'
                ? 'rgba(55,227,162,0.12)'
                : phase === 'error'
                  ? 'rgba(255,107,102,0.10)'
                  : 'rgba(195,166,255,0.10)',
            border: `1px solid ${
              phase === 'success'
                ? 'rgba(55,227,162,0.28)'
                : phase === 'error'
                  ? 'rgba(255,107,102,0.25)'
                  : 'rgba(195,166,255,0.22)'
            }`,
            boxShadow:
              phase === 'success'
                ? '0 0 32px rgba(55,227,162,0.15)'
                : phase === 'error'
                  ? '0 0 32px rgba(255,107,102,0.12)'
                  : '0 0 32px rgba(157,113,255,0.15)',
          }}>
          <AnimatePresence mode="wait">
            {phase === 'success' ? (
              <motion.span
                key="ok"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                <TbCheck size={34} style={{ color: 'var(--success)' }} />
              </motion.span>
            ) : phase === 'error' ? (
              <motion.span
                key="err"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                <TbAlertTriangle size={32} style={{ color: 'var(--error)' }} />
              </motion.span>
            ) : (
              <motion.span
                key="plug"
                animate={phase === 'init' ? { rotate: [0, 8, -8, 0] } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}>
                <TbPlugConnected
                  size={34}
                  style={{ color: 'var(--primary)' }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Text + CTA ── */}
      <AnimatePresence mode="wait">
        {/* Loading / auto-redirecting */}
        {phase === 'init' && (
          <motion.div
            key="init"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3 text-center">
            <h1
              className="text-xl font-bold font-mono"
              style={{ color: 'var(--on-surface)' }}>
              Открываем приложение…
            </h1>
            <p
              className="text-sm max-w-[280px]"
              style={{ color: 'var(--on-surface-variant)' }}>
              Пробуем запустить Happ автоматически
            </p>
            {/* Dots loader */}
            <div className="flex gap-2 mt-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full block"
                  style={{ background: 'var(--primary)' }}
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Manual button */}
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-5 w-full max-w-sm">
            {/* Title */}
            <div className="text-center">
              <h1
                className="text-xl font-bold font-mono mb-1.5"
                style={{ color: 'var(--on-surface)' }}>
                Нажмите, чтобы открыть
              </h1>
              <p
                className="text-sm"
                style={{ color: 'var(--on-surface-variant)' }}>
                Если автоматический переход не сработал — нажмите кнопку ниже
              </p>
            </div>

            {/* Primary CTA */}
            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl text-base font-bold font-mono cursor-pointer justify-center"
              style={{
                background: 'linear-gradient(135deg, #ff8c42, #ff6a10)',
                color: '#1a0a00',
                boxShadow: '0 4px 24px rgba(255,140,66,0.35)',
              }}>
              <TbPlugConnected size={22} />
              Открыть в Happ
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div
                className="flex-1 h-px"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
              <span
                className="text-xs font-mono"
                style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}>
                или
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
            </div>

            {/* Secondary actions */}
            {url && (
              <div className="flex flex-wrap gap-2 w-full justify-center">
                <CopyBtn value={url} />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-mono font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--on-surface-variant)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}>
                  <TbExternalLink size={16} /> Открыть в браузере
                </a>
              </div>
            )}

            {/* Help tip */}
            <div
              className="w-full rounded-2xl px-4 py-3 text-xs text-center leading-relaxed"
              style={{
                background: 'rgba(195,166,255,0.06)',
                border: '1px solid rgba(195,166,255,0.10)',
                color: 'var(--primary)',
                opacity: 0.8,
              }}>
              💡 Если приложение не открывается — скопируйте ссылку и вставьте
              её вручную через «Добавить подписку» → «Вставить ссылку» в Happ
            </div>
          </motion.div>
        )}

        {/* Success */}
        {phase === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-[300px]">
            <h1
              className="text-xl font-bold font-mono"
              style={{ color: 'var(--success)' }}>
              Готово!
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--on-surface-variant)' }}>
              Приложение Happ должно открыться. Выберите сервер и нажмите
              «Подключить».
            </p>
            {url && (
              <motion.button
                onClick={handleOpen}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-mono font-bold cursor-pointer mt-1"
                style={{
                  background: 'rgba(55,227,162,0.10)',
                  color: 'var(--success)',
                  border: '1px solid rgba(55,227,162,0.22)',
                }}>
                <TbRefresh size={15} /> Открыть снова
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 text-center max-w-[300px]">
            <h1
              className="text-xl font-bold font-mono"
              style={{ color: 'var(--error)' }}>
              Ссылка недействительна
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--on-surface-variant)' }}>
              Не удалось прочитать параметры ссылки. Вернитесь назад и
              попробуйте ещё раз.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
        <p
          className="text-[11px] font-mono"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.35 }}>
          Страница-помощник для добавления VPN‑конфигурации
        </p>
        <p
          className="text-[10px] font-mono"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.2 }}>
          Можно закрыть после открытия приложения
        </p>
      </motion.footer>
    </div>
  )
}

/* ─── Fallback ───────────────────────────────────────────────────────── */
function LoadingFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4"
      style={{ background: 'var(--background)' }}>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full block"
            style={{ background: 'var(--primary)' }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Export ─────────────────────────────────────────────────────────── */
export default function DeeplinkPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DeeplinkContent />
    </Suspense>
  )
}
