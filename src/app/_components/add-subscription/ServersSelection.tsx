'use client'

import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansInterface } from '@app/types/plans.interface'
import {
  ServerDataInterface,
  ServersDataInterface,
} from '@app/types/servers-data.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import {
  calculatePremiumServersPrice,
  calculateServersPrice,
} from '@app/utils/calculate-subscription-cost.util'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'
import TgStar from '../Currency'

export // Компонент: Выбор серверов
const ServersSelection = ({
  serversData,
  planSelected,
  serversSelected,
  setServersSelected,
  isAllBaseServers,
  setIsAllBaseServers,
  isAllPremiumServers,
  setIsAllPremiumServers,
  setBaseServersCount,
  setPremiumServersCount,
  premiumServersCount,
  baseServersCount,
  user,
  subscriptions,
		setServerSelected
}: {
  serversData: ServersDataInterface
  planSelected: PlansInterface
  serversSelected: string[]
  setServersSelected: (val: string[]) => void
  isAllBaseServers: boolean
  setIsAllBaseServers: (val: boolean) => void
  isAllPremiumServers: boolean
  setIsAllPremiumServers: (val: boolean) => void
  setBaseServersCount: (val: number) => void
  setPremiumServersCount: (val: number) => void
  premiumServersCount: number
  baseServersCount: number
  user: UserDataInterface
  subscriptions: SubscriptionResponseInterface
		setServerSelected: (val: ServerDataInterface | null) => void
}) => {
  const serversPrice = useMemo(() => {
    if (user.roleDiscount == 0) return 0
    const basePrice =
      calculateServersPrice(
        isAllBaseServers,
        isAllPremiumServers,
        serversData.baseServersCount,
        subscriptions,
      ) +
      calculatePremiumServersPrice(
        isAllBaseServers,
        isAllPremiumServers,
        serversData.premiumServersCount,
        subscriptions,
      )

    return user.isPremium
      ? basePrice * subscriptions.telegramPremiumRatio
      : basePrice
  }, [isAllBaseServers, isAllPremiumServers, serversData, subscriptions, user])

  const handleServerSelect = (server: ServerDataInterface) => {
    const isSelected = serversSelected.includes(server.code)

    if (isSelected) {
      const newSelected = serversSelected.filter((code) => code !== server.code)
      setServersSelected(newSelected)
			setServerSelected(null)

      if (server.isPremium) {
        setPremiumServersCount(Math.max(0, premiumServersCount - 1))
      } else {
        setBaseServersCount(Math.max(0, baseServersCount - 1))
      }
    } else {
      let newSelected: string[]
							setServerSelected(server)

      if (
        planSelected.serversSelectType ===
          PlansServersSelectTypeEnum.ONE_BASE ||
        planSelected.serversSelectType ===
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
      setIsAllBaseServers(false)
      setIsAllPremiumServers(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="flex gap-2 items-end justify-between w-full px-4 ">
        <div className="opacity-50 flex flex-row gap-2 items-center">
          Выберите сервер
        </div>
        {planSelected.serversSelectType ===
          PlansServersSelectTypeEnum.CUSTOM && (
          <div className="flex gap-2 items-center ">
            <TgStar type="star" w={14} />
            {(user.isTgProgramPartner
              ? serversPrice * subscriptions.telegramPartnerProgramRatio
              : serversPrice
            ).toFixed(2)}
          </div>
        )}
      </div>

      <motion.div
        layout
        className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
        {planSelected.serversSelectType ===
          PlansServersSelectTypeEnum.CUSTOM && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAllBaseServers(!isAllBaseServers)
                if (isAllBaseServers) {
                  setBaseServersCount(0)
                  if (isAllPremiumServers) {
                    setIsAllPremiumServers(false)
                  }
                } else {
                  setServersSelected([])
                  setBaseServersCount(serversData.baseServersCount)
                }
              }}
              className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{
                backgroundColor: `rgba(216, 197, 255, ${isAllBaseServers ? 0.3 : 0.15})`,
                border: isAllBaseServers
                  ? `1px solid rgba(216, 197, 255, 0.7)`
                  : '1px solid transparent',
              }}>
              Базовые
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAllPremiumServers(!isAllPremiumServers)
                if (isAllPremiumServers) {
                  setPremiumServersCount(0)
                } else {
                  if (!isAllBaseServers) {
                    setIsAllBaseServers(true)
                  }
                  setServersSelected([])
                  setPremiumServersCount(serversData.premiumServersCount)
                }
              }}
              className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{
                backgroundColor: `rgba(216, 197, 255, ${isAllPremiumServers ? 0.3 : 0.15})`,
                border: isAllPremiumServers
                  ? `1px solid rgba(216, 197, 255, 0.7)`
                  : '1px solid transparent',
              }}>
              Премиум
            </motion.button>

            <div className="w-full flex gap-2 items-center">
              <div className="h-[1px] grow bg-[var(--primary)]"></div>
              <div className="text-[var(--primary)]">или на выбор</div>
              <div className="h-[1px] grow bg-[var(--primary)]"></div>
            </div>
          </>
        )}

        {serversData.servers
          .filter((server) => {
            if (
              planSelected.serversSelectType ===
              PlansServersSelectTypeEnum.ONE_BASE
            ) {
              return !server.isPremium
            }
            return (
              planSelected.serversSelectType !==
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
      </motion.div>
    </div>
  )
}
