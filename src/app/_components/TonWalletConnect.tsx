'use client'

import { authApiClient } from '@app/core/apiClient'
import { useUserStore } from '@app/store/user.store'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

export function TonWalletConnect() {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const { user, setUser } = useUserStore()

  const handleConnect = async () => {
    try {
      await tonConnectUI.openModal()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Ошибка при открытии кошелька')
    }
  }

  useEffect(() => {
    const saveWallet = async () => {
      const address = wallet?.account?.address
      if (!address || user?.tonWallet === address) return

      try {
        const updateUser = await authApiClient.updateWallet(address)
        setUser(updateUser)
        // toast.success('Кошелёк успешно подключён')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        toast.error('Ошибка при сохранении кошелька')
      }
    }

    saveWallet()
  }, [wallet?.account?.address])

  if (user?.tonWallet) return null

  return (
    <button
      onClick={handleConnect}
      className="bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer">
      Подключить TON-кошелёк
    </button>
  )
}
