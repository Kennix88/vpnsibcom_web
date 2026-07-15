'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TbCheck, TbTrash, TbX } from 'react-icons/tb'
import { PlatformIcon, platformLabel } from './PlatformIcon'
import { HwidDevice } from './types'

export function DeviceRow({
  device,
  isOldest,
  onDelete,
}: {
  device: HwidDevice
  isOldest: boolean
  onDelete: (hwid: string) => Promise<void> | void
  index?: number
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  function requestDelete() {
    if (confirming) return
    setConfirming(true)
    timer.current = setTimeout(() => setConfirming(false), 3200)
  }

  async function confirmDelete() {
    if (timer.current) clearTimeout(timer.current)
    setDeleting(true)
    try {
      await onDelete(device.hwid)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  function cancelDelete() {
    if (timer.current) clearTimeout(timer.current)
    setConfirming(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: 'var(--surface-container)',
        border: `1px solid ${
          confirming ? 'rgba(255,107,102,0.35)' : 'rgba(255,255,255,0.06)'
        }`,
      }}>
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{
          background: 'rgba(195,166,255,0.1)',
          color: 'var(--primary)',
        }}>
        <PlatformIcon platform={device.platform} size={18} />
      </div>

      <div className="flex flex-col min-w-0 grow">
        <span
          className="text-sm font-bold font-mono truncate"
          style={{ color: 'var(--on-surface)' }}>
          {device.deviceModel || platformLabel(device.platform)}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
          {platformLabel(device.platform)}
          {device.osVersion ? ` · ${device.osVersion}` : ''}
          {isOldest ? ' · первое устройство' : ''}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={confirmDelete}
              disabled={deleting}
              aria-label="Подтвердить удаление"
              className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
              style={{
                background: 'rgba(255,107,102,0.16)',
                color: 'var(--error)',
                border: '1px solid rgba(255,107,102,0.3)',
              }}>
              <TbCheck size={16} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={cancelDelete}
              aria-label="Отменить"
              className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--on-surface-variant)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <TbX size={16} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="trash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.9 }}
            onClick={requestDelete}
            aria-label="Удалить устройство"
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer shrink-0"
            style={{
              background: 'rgba(255,107,102,0.08)',
              color: 'var(--error)',
              border: '1px solid rgba(255,107,102,0.15)',
            }}>
            <TbTrash size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
