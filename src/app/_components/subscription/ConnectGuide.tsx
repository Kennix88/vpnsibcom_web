'use client'

/**
 * ConnectGuide — раздел «Подключить устройство».
 * Заменяет AppsList.tsx + AppElement.tsx.
 *
 * Ключевые улучшения:
 *  - Единый компонент — меньше вложенности, легче читать
 *  - Платформы — горизонтальные чипы с авто‑определением
 *  - Чёткие шаги 1‑2‑3 с иконками и пояснениями
 *  - QR‑код: используем hex‑цвета (не CSS‑переменные) — рендерится корректно
 *  - Кнопки «добавить» выделены CTA‑цветом, вторичные — нейтральны
 */

import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { detectPlatform } from '@app/utils/platform-detect.util'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import QRCodeStyling from 'qr-code-styling'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaAppStoreIos, FaGooglePlay } from 'react-icons/fa6'
import { FiCopy, FiExternalLink } from 'react-icons/fi'
import {
  TbCheck,
  TbDeviceMobile,
  TbPlugConnected,
  TbQrcode,
} from 'react-icons/tb'
import Modal from '../Modal'
import { CLIENT_APPS } from './data/client-apps.data'
import { ClientAppsEnum } from './types/client-apps.enum'
import { IconTypeEnum } from './types/icon-type.enum'
import { PlatformEnum } from './types/platform.enum'

/* ─── palette ───────────────────────────────────────────────────────────
   qr-code-styling не резолвит CSS-переменные.
   Все hex взяты из design-tokens (:root CSS).
*/
const QR_HEX = {
  dots: '#c3a6ff', // --primary
  bg: '#080608', // --surface-container-lowest
  csq: '#d6cfe6', // --secondary
  cdot: '#efb8c8', // --tertiary
} as const

/* ─── platform list ─────────────────────────────────────────────────── */
const PLATFORMS: { key: PlatformEnum; label: string; emoji: string }[] = [
  { key: PlatformEnum.ANDROID, label: 'Android', emoji: '🤖' },
  { key: PlatformEnum.IOS, label: 'iOS', emoji: '📱' },
  { key: PlatformEnum.WINDOWS, label: 'Windows', emoji: '🪟' },
  { key: PlatformEnum.MACOS, label: 'macOS', emoji: '🍎' },
  { key: PlatformEnum.IPADOS, label: 'iPad OS', emoji: '📱' },
  { key: PlatformEnum.ANDROID_TV, label: 'Android TV', emoji: '📺' },
  { key: PlatformEnum.APPLE_TV, label: 'Apple TV', emoji: '📺' },
  { key: PlatformEnum.LINUX, label: 'Linux', emoji: '🐧' },
]

/* ─── step card ─────────────────────────────────────────────────────── */
function Step({
  num,
  title,
  children,
}: {
  num: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-container)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
      {/* Step header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'var(--surface-container-high)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
        <div
          className="flex items-center justify-center w-7 h-7 rounded-xl text-sm font-bold font-mono shrink-0"
          style={{
            background: 'rgba(255,140,66,0.15)',
            color: 'var(--cta)',
            border: '1px solid rgba(255,140,66,0.25)',
          }}>
          {num}
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: 'var(--on-surface)' }}>
          {title}
        </span>
      </div>
      {/* Step body */}
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

/* ─── QR modal ──────────────────────────────────────────────────────── */
function QRModal({
  isOpen,
  onClose,
  url,
}: {
  isOpen: boolean
  onClose: () => void
  url: string
}) {
  const qrRef = useRef<HTMLDivElement>(null)

  const render = useCallback(() => {
    if (!qrRef.current || !url) return
    qrRef.current.innerHTML = ''
    const qr = new QRCodeStyling({
      width: 260,
      height: 260,
      type: 'svg',
      data: url,
      image: '/logo.png',
      dotsOptions: { color: QR_HEX.dots, type: 'rounded' },
      backgroundOptions: { color: QR_HEX.bg },
      cornersSquareOptions: { color: QR_HEX.csq, type: 'extra-rounded' },
      cornersDotOptions: { color: QR_HEX.cdot, type: 'dot' },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
        hideBackgroundDots: true,
        imageSize: 0.28,
      },
    })
    qr.append(qrRef.current)
  }, [url])

  useEffect(() => {
    if (!isOpen) return
    // небольшой delay — контейнер должен быть смонтирован в DOM
    const tid = setTimeout(render, 60)
    return () => clearTimeout(tid)
  }, [isOpen, render])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR‑код для подключения">
      <div className="flex flex-col items-center gap-4 p-4">
        <div
          className="rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ width: 260, height: 260, background: QR_HEX.bg }}>
          <div ref={qrRef} />
        </div>
        <p
          className="text-sm text-center max-w-[240px]"
          style={{ color: 'var(--on-surface)', opacity: 0.55 }}>
          Отсканируйте QR‑код в приложении Happ
        </p>
      </div>
    </Modal>
  )
}

/* ─── copy button with ✓ feedback ───────────────────────────────────── */
function CopyBtn({ value }: { value: string }) {
  const copy = useCopyToClipboard()
  const [done, setDone] = useState(false)

  function handleCopy() {
    copy(value)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={handleCopy}
      className="flex grow items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer"
      style={{
        background: done ? 'rgba(55,227,162,0.12)' : 'rgba(255,255,255,0.06)',
        color: done ? 'var(--success)' : 'var(--on-surface-variant)',
        border: `1px solid ${done ? 'rgba(55,227,162,0.22)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span
            key="ok"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}>
            <TbCheck size={14} />
          </motion.span>
        ) : (
          <motion.span
            key="cp"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}>
            <FiCopy size={13} />
          </motion.span>
        )}
      </AnimatePresence>
      {done ? 'Скопировано!' : 'Копировать ссылку'}
    </motion.button>
  )
}

/* ─── main component ────────────────────────────────────────────────── */

export default function ConnectGuide({
  subscriptionUrl,
}: {
  subscriptionUrl: string
}) {
  /* Platform state */
  const [platform, setPlatform] = useState<PlatformEnum>(PlatformEnum.ANDROID)
  const [qrOpen, setQrOpen] = useState(false)

  /* Detect platform on mount */
  useEffect(() => {
    const detected = detectPlatform()
    if (detected) setPlatform(detected)
  }, [])

  /* Find Happ client */
  const happ = useMemo(
    () => CLIENT_APPS.find((a) => a.key === ClientAppsEnum.HAPP),
    [],
  )

  if (!happ) return null

  /* Platform data for current selection */
  const platformData =
    happ.platforms.find((p) => p.platform === platform) ?? happ.platforms[0]

  /* Build deep‑link */
  const encodeLink =
    happ.key === ClientAppsEnum.SHADOWROCKET ||
    happ.key === ClientAppsEnum.FOXRAY
      ? Buffer.from(encodeURI(subscriptionUrl)).toString('base64')
      : encodeURI(subscriptionUrl)
  const deepLink = happ.deepLink.replace('{URL}', encodeLink)

  return (
    <motion.div
      key="connect-guide"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      className="overflow-hidden">
      <div className="flex flex-col gap-4">
        {/* Section label */}
        <div className="flex items-center gap-2">
          <TbDeviceMobile size={14} style={{ color: 'var(--primary)' }} />
          <span
            className="text-xs tracking-widest uppercase font-mono font-bold"
            style={{ color: 'var(--primary)', opacity: 0.7 }}>
            Подключить устройство
          </span>
        </div>

        {/* Platform chips */}
        <div>
          <p
            className="text-xs mb-2"
            style={{ color: 'var(--on-surface-variant)' }}>
            Ваша платформа:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => {
              const active = p.key === platform
              return (
                <motion.button
                  key={p.key}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setPlatform(p.key)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
                  style={{
                    background: active
                      ? 'rgba(195,166,255,0.18)'
                      : 'rgba(255,255,255,0.05)',
                    color: active
                      ? 'var(--primary)'
                      : 'var(--on-surface-variant)',
                    border: `1px solid ${active ? 'rgba(195,166,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <span>{p.emoji}</span> {p.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {/* Step 1 — Установить приложение */}
          <Step num={1} title="Установите приложение «Happ»">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: happ.color }}>
                <Image src={happ.icon} alt="Happ" width={26} height={26} />
              </div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: 'var(--on-surface)' }}>
                  Happ
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--on-surface-variant)' }}>
                  Быстрый и простой VPN‑клиент
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {platformData.downloadLinks.map((dl) => (
                <Link
                  key={dl.title}
                  href={dl.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex grow items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--on-surface)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}>
                  {dl.iconType === IconTypeEnum.APPLE_STORE ? (
                    <FaAppStoreIos size={15} />
                  ) : dl.iconType === IconTypeEnum.PLAY_MARKET ? (
                    <FaGooglePlay size={14} />
                  ) : null}
                  {dl.title}
                </Link>
              ))}
            </div>
          </Step>

          {/* Step 2 — Добавить подписку */}
          <Step num={2} title="Добавьте подписку в приложение">
            <p
              className="text-xs mb-3"
              style={{ color: 'var(--on-surface-variant)' }}>
              Нажмите кнопку ниже — приложение автоматически добавит вашу
              подписку.
            </p>
            {/* Primary CTA */}
            <div className="flex flex-wrap gap-2 mb-2">
              <Link
                href={`${encodeURI(deepLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex grow items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold font-mono"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,140,66,0.9), rgba(255,100,30,0.9))',
                  color: 'var(--on-cta)',
                  boxShadow: '0 2px 14px rgba(255,140,66,0.3)',
                }}>
                <TbPlugConnected size={16} />
                Добавить в Happ
              </Link>
            </div>
            {/* Secondary options */}
            <div className="flex flex-wrap gap-2">
              <CopyBtn value={subscriptionUrl} />
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setQrOpen(true)}
                className="flex grow items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--on-surface-variant)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <TbQrcode size={14} /> QR‑код
              </motion.button>
              <Link
                href={`/deeplink/?link=${encodeURI(deepLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex grow items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--on-surface-variant)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <FiExternalLink size={13} /> Альтернативный способ
              </Link>
            </div>
          </Step>

          {/* Step 3 — Подключиться */}
          <Step num={3} title="Выберите сервер и нажмите «Подключить»">
            <p
              className="text-xs"
              style={{ color: 'var(--on-surface-variant)' }}>
              Откройте приложение Happ, найдите наш сервис в списке и нажмите
              кнопку подключения. Индикатор станет синим — вы в сети!
            </p>
          </Step>
        </div>

        {/* Tip */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs"
          style={{
            background: 'rgba(195,166,255,0.07)',
            border: '1px solid rgba(195,166,255,0.12)',
            color: 'var(--primary)',
          }}>
          <span className="mt-px shrink-0">💡</span>
          <span style={{ opacity: 0.8 }}>
            Если кнопка «Добавить в Happ» не работает — попробуйте
            «Альтернативный способ» или скопируйте ссылку и вставьте её вручную
            через «Добавить подписку» → «Вставить ссылку» внутри приложения.
          </span>
        </div>

        <div
          className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs"
          style={{
            background: 'rgba(195,166,255,0.07)',
            border: '1px solid rgba(195,166,255,0.12)',
            color: 'var(--primary)',
          }}>
          <span className="mt-px shrink-0">❗</span>
          <span style={{ opacity: 0.8 }}>
            Рекомендуем скопировать ссылку на подписку и сохранить её, на
            случай, если Happ случайно удалит подписку.
          </span>
        </div>
      </div>

      {/* QR modal */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        url={subscriptionUrl}
      />
    </motion.div>
  )
}

/* Нужен для SubscriptionCard — реэкспортируем TbPlugConnected */
export { TbPlugConnected as ConnectIcon }
