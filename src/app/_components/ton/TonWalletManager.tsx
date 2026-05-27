'use client'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

export function TonWalletManager() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const handleReplace = async () => {
    try {
      await tonConnectUI.disconnect()
      await tonConnectUI.openModal()
    } catch {
      toast.error('Failed to connect wallet')
    }
  }

  const handleUnlink = async () => {
    try {
      await tonConnectUI.disconnect()
    } catch {
      toast.error("Couldn't unlink wallet")
    }
  }

  if (!wallet?.account.address) return null

  return (
    <motion.div
      className="flex gap-2 w-full"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}>
      {/* Disconnect */}
      <motion.button
        onClick={handleUnlink}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-mono font-bold text-sm cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, var(--error-container) 0%, color-mix(in srgb, var(--error-container) 65%, transparent) 100%)',
          color: 'var(--on-error-container)',
          border: '1px solid rgba(255,107,102,0.2)',
          boxShadow: '0 2px 10px var(--error-glow)',
        }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Отвязать
      </motion.button>

      {/* Replace */}
      <motion.button
        onClick={handleReplace}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-mono font-bold text-sm cursor-pointer"
        style={{
          background:
            'linear-gradient(135deg, var(--ton) 0%, color-mix(in srgb, var(--ton) 70%, var(--primary)) 100%)',
          color: 'var(--on-ton)',
          border: '1px solid rgba(0,136,204,0.3)',
          boxShadow: '0 2px 12px var(--ton-container-rgba)',
        }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-3.49" />
        </svg>
        Заменить
      </motion.button>
    </motion.div>
  )
}
