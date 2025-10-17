'use client'

import { authApiClient } from '@app/core/authApiClient'
import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { useServersStore } from '@app/store/servers.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { ServerDataInterface } from '@app/types/servers-data.interface'
import { SubscriptionDataInterface } from '@app/types/subscription-data.interface'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { BiServer } from 'react-icons/bi'
import { toast } from 'react-toastify'
import Modal from '../Modal'

export default function ChangeServersButton({
  subscription,
}: {
  subscription: SubscriptionDataInterface
}) {
  const { serversData, updateServers } = useServersStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
  const [serversSelected, setServersSelected] = useState<string[]>(
    subscription.servers.map((server) => server.code),
  )
  const [baseServersCount, setBaseServersCount] = useState<number>(
    subscription.baseServersCount,
  )
  const [premiumServersCount, setPremiumServersCount] = useState<number>(
    subscription.premiumServersCount,
  )
  const { setSubscriptions } = useSubscriptionsStore()
  const { setUser } = useUserStore()
  const t = useTranslations('subscriptions')

  const fetchServers = useCallback(async (): Promise<void> => {
    await updateServers()
  }, [updateServers])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  if (
    !serversData ||
    subscription.plan.isAllBaseServers ||
    subscription.plan.isAllPremiumServers
  )
    return null

  const handleServerSelect = (server: ServerDataInterface) => {
    const isSelected = serversSelected.includes(server.code)

    if (isSelected) {
      const newSelected = serversSelected.filter((code) => code !== server.code)
      setServersSelected(newSelected)

      if (server.isPremium) {
        setPremiumServersCount(Math.max(0, premiumServersCount - 1))
      } else {
        setBaseServersCount(Math.max(0, baseServersCount - 1))
      }
    } else {
      let newSelected: string[]

      if (
        subscription.plan.serversSelectType ===
          PlansServersSelectTypeEnum.ONE_BASE ||
        subscription.plan.serversSelectType ===
          PlansServersSelectTypeEnum.ONE_BASE_OR_PREMIUM
      ) {
        newSelected = [server.code]
        if (server.isPremium) {
          setPremiumServersCount(1)
        } else {
          setBaseServersCount(1)
        }
      } else {
        newSelected = [...serversSelected, server.code]
        if (server.isPremium) setPremiumServersCount(premiumServersCount + 1)
        else setBaseServersCount(baseServersCount + 1)
      }

      setServersSelected(newSelected)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setIsOpenModal(false)
      const data = await authApiClient.updateServerSubscription(
        subscription.id,
        serversSelected,
      )

      setUser(data.user)
      setSubscriptions(data.subscriptions)
      toast.success('Subscription servers updated')
    } catch {
      toast.error('Failed to update subscription servers')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpenModal(true)
        }}
        disabled={isLoading}
        className={`grow p-2 rounded-md bg-[var(--secondary-container)] text-[var(--on-secondary-container)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex gap-2 items-center `}>
        <BiServer size={18} />
        {t('changeServer')}
      </button>

      <Modal
        isOpen={isOpenModal}
        actionButtonColor="primary"
        actionText={t('save')}
        onAction={() => {
          handleSave()
        }}
        onClose={() => setIsOpenModal(false)}
        title={t('changeServerTitle')}>
        <motion.div
          layout
          className="text-sm flex flex-row flex-wrap gap-2 items-center w-full shadow-md">
          {serversData.servers
            .filter((server) => {
              if (
                subscription.plan.serversSelectType ===
                PlansServersSelectTypeEnum.ONE_BASE
              ) {
                return !server.isPremium
              }
              return (
                subscription.plan.serversSelectType !==
                PlansServersSelectTypeEnum.NOT_SELECTED
              )
            })
            .map((server) => {
              const isActive = serversSelected.includes(server.code)
              const bgOpacity = isActive ? 0.3 : 0.15

              return (
                <motion.button
                  key={server.code}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleServerSelect(server)}
                  className="flex flex-col gap-0.5 grow items-center justify-center text-white px-2 py-1.5 rounded-md text-[11px] font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                  style={{
                    backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(216, 197, 255, 0.7)`
                      : '1px solid transparent',
                  }}>
                  <div className="flex gap-2 grow flex-wrap">
                    {server.isPremium && (
                      <div className="flex items-center justify-center h-5 w-5 bg-[var(--gold-container)] rounded-md">
                        ⭐
                      </div>
                    )}
                    <Image
                      src={`/flags/${server.flagKey}.svg`}
                      alt="flag"
                      width={20}
                      height={20}
                    />
                    {server.code.toUpperCase()} [{server.network}GBit]
                  </div>
                  <div className="flex gap-2 grow flex-wrap">{server.name}</div>
                </motion.button>
              )
            })}
          <div className="text-xs text-[var(--on-warning-container)] bg-[var(--warning-container)] p-2 w-full rounded-md">
            {t('changeServerWarning')}
          </div>
        </motion.div>
      </Modal>
    </>
  )
}
