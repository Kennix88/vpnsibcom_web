'use client'
import { config } from '@app/config/client'
import { useUserStore } from '@app/store/user.store'
import { useCopyToClipboard } from '@app/utils/copy-to-clipboard.util'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Copy, Link2, Share2 } from 'lucide-react'
import { useState } from 'react'
import { RiTelegram2Fill } from 'react-icons/ri'

/* ─── Copy-feedback hook ─────────────────────────────────────────── */
function useCopyFeedback(value: string) {
  const copy = useCopyToClipboard()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return { copied, handleCopy }
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function FriendsInviteButtons() {
  const { user } = useUserStore()
  const { copied: urlCopied, handleCopy: handleCopyUrl } = useCopyFeedback(
    user?.inviteUrl ?? '',
  )
  const { copied: btnCopied, handleCopy: handleCopyBtn } = useCopyFeedback(
    user?.inviteUrl ?? '',
  )

  const handleShareMessage = async () => {
    try {
      const { shareMessage } = await import('@tma.js/sdk-react')
      shareMessage(user?.inviteMessageId || '')
    } catch (err) {
      console.error('Failed to share message', err)
    }
  }

  const handleShareStory = async () => {
    try {
      const { shareStory } = await import('@tma.js/sdk-react')
      shareStory.ifAvailable(`${config.appUrl}/story.png`, {
        text: 'Use a VPN and play games in one place! The bonus is already waiting for you! @vpnsibcom_bot',
        widgetLink: {
          url: user?.inviteUrl || '',
          name: 'VPN&GAMES',
        },
      })
    } catch (err) {
      console.error('Failed to share story', err)
    }
  }

  if (!user) return null

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Section label */}
      <div className="px-1 flex items-center gap-2">
        <span
          className="block w-1 h-1 rounded-full"
          style={{ background: 'var(--primary)' }}
        />
        <span
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: 'var(--on-background)', opacity: 0.42 }}>
          Пригласить друга
        </span>
      </div>

      {/* Link preview chip */}
      <motion.button
        onClick={handleCopyUrl}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl font-mono text-xs cursor-pointer"
        style={{
          background: urlCopied
            ? 'rgba(55,227,162,0.09)'
            : 'rgba(255,255,255,0.04)',
          border: urlCopied
            ? '1px solid rgba(55,227,162,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
          transition: 'all 180ms ease',
        }}>
        <AnimatePresence mode="wait" initial={false}>
          {urlCopied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              style={{ color: 'var(--success)' }}
              className="shrink-0">
              <CheckCheck size={14} />
            </motion.span>
          ) : (
            <motion.span
              key="link"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              style={{ color: 'var(--primary)', opacity: 0.7 }}
              className="shrink-0">
              <Link2 size={14} />
            </motion.span>
          )}
        </AnimatePresence>

        <span
          className="truncate flex-1 text-left"
          style={{
            color: urlCopied ? 'var(--success)' : 'var(--on-background)',
            opacity: urlCopied ? 1 : 0.5,
          }}>
          {urlCopied ? 'Скопировано!' : user.inviteUrl || '—'}
        </span>

        <Copy
          size={12}
          aria-hidden
          style={{ color: 'var(--on-background)', opacity: 0.3, flexShrink: 0 }}
        />
      </motion.button>

      {/* Primary action — Telegram share */}
      <motion.button
        onClick={handleShareMessage}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold font-mono text-base cursor-pointer relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, var(--primary-container), rgba(195,166,255,0.25))',
          border: '1px solid rgba(195,166,255,0.35)',
          color: 'var(--on-primary-container)',
          boxShadow: '0 4px 24px rgba(195,166,255,0.2)',
        }}>
        {/* Animated sheen */}
        <motion.span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'linear-gradient(105deg, transparent 30%, rgba(195,166,255,0.08) 50%, transparent 70%)',
              'linear-gradient(105deg, transparent 60%, rgba(195,166,255,0.08) 80%, transparent 100%)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <Share2 size={18} aria-hidden />
        Пригласить в Telegram
      </motion.button>

      {/* Secondary row */}
      <div className="flex gap-2">
        {/* Copy link */}
        <motion.button
          onClick={handleCopyBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-mono text-sm cursor-pointer"
          style={{
            background: btnCopied
              ? 'rgba(55,227,162,0.1)'
              : 'rgba(255,255,255,0.05)',
            border: btnCopied
              ? '1px solid rgba(55,227,162,0.3)'
              : '1px solid rgba(255,255,255,0.09)',
            color: btnCopied ? 'var(--success)' : 'var(--on-surface)',
            transition: 'all 180ms ease',
          }}>
          <AnimatePresence mode="wait" initial={false}>
            {btnCopied ? (
              <motion.span
                key="done"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <CheckCheck size={15} /> Скопировано
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <Copy size={15} /> Ссылка
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Story */}
        <motion.button
          onClick={handleShareStory}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-mono text-sm cursor-pointer"
          style={{
            background: 'rgba(0,136,204,0.1)',
            border: '1px solid rgba(0,136,204,0.22)',
            color: 'var(--ton)',
          }}>
          <RiTelegram2Fill size={16} aria-hidden />
          Сторис
        </motion.button>
      </div>
    </div>
  )
}
