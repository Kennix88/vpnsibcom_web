'use client'

import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

export function TonWalletConnect() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const t = useTranslations('wallet')

  const handleConnect = async () => {
    try {
      await tonConnectUI.openModal()
    } catch {
      toast.error('Error when opening a wallet')
    }
  }

  if (wallet?.account?.address) return null

  return (
    <button
      onClick={handleConnect}
      className="bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer font-mono w-full max-w-[400px]">
      {t('connect')}
    </button>
  )
}
