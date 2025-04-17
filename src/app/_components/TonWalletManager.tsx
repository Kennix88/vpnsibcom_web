'use client'

import { authApiClient } from '@app/core/apiClient'
import { useUserStore } from '@app/store/user.store'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { toast } from 'react-toastify'
import { useTranslations } from 'use-intl'

export function TonWalletManager() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const { user, setUser } = useUserStore()
  const t = useTranslations('wallet')

  const saveWallet = async () => {
    if (!wallet?.account?.address) return

    try {
      const updateUser = await authApiClient.updateWallet(
        wallet.account.address,
      )
      setUser(updateUser)
    } catch {
      toast.error('Error saving the wallet')
    }
  }

  const handleReplace = async () => {
    try {
      await tonConnectUI.disconnect()
      await tonConnectUI.openModal()
      await saveWallet()
    } catch {
      toast.error('Failed to connect wallet')
    }
  }

  const handleUnlink = async () => {
    try {
      // await tonConnectUI.disconnect().catch()
      const updateUser = await authApiClient.unlinkWallet()
      setUser(updateUser)
    } catch {
      toast.error("Couldn't unlink wallet")
    }
  }

  return (
    <div className="w-full font-bold justify-center items-center flex flex-col">
      {user?.tonWallet && (
        <div className={'flex flex-row gap-2 w-full'}>
          <button
            onClick={handleUnlink}
            className="bg-[var(--error-container)] text-[var(--on-error-container)] px-4 py-2 rounded-md text-sm w-full max-w-xs cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] font-mono">
            {t('disconnect')}
          </button>
          <button
            onClick={handleReplace}
            className="bg-[var(--primary)] text-[var(--on-primary)] px-4 py-2 rounded-md text-sm w-full max-w-xs cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] font-mono">
            {t('replace')}
          </button>
        </div>
      )}
    </div>
  )
}
