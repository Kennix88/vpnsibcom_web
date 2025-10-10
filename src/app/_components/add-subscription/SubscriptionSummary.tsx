'use client'

import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { ServerDataInterface } from '@app/types/servers-data.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'
import TgStar from '../Currency'
import { PeriodButtonInterface } from './AddSubscription'

// Компонент: Итоговая информация
export const SubscriptionSummary = ({
  planSelected,
  devicesCount,
  isUnlimitTraffic,
  trafficLimitGb,
  isAllBaseServers,
  isAllPremiumServers,
  periodButton,
  periodMultiplier,
  user,
  isAutoRenewal,
  price,
  priceNoDiscount,
  subscriptions,
  name,
  trafficReset,
  serverSelected,
}: {
  planSelected: PlansInterface
  devicesCount: number
  isUnlimitTraffic: boolean
  trafficLimitGb: number
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  periodButton: PeriodButtonInterface
  periodMultiplier: number
  user: UserDataInterface
  isAutoRenewal: boolean
  price: number
  priceNoDiscount: number
  subscriptions: SubscriptionResponseInterface
  name: string
  trafficReset: TrafficResetEnum
  serverSelected: ServerDataInterface | null
}) => {
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  const summaryItems = useMemo(
    () => [
      {
        name: 'Имя',
        value: <div>{name}</div>,
        isVisible: true,
      },
      {
        name: 'Трафик',
        value: (
          <div>
            {isUnlimitTraffic
              ? 'Безлимит'
              : planSelected.key === PlansEnum.TRAFFIC
                ? `${trafficLimitGb} GB`
                : `${trafficReset == TrafficResetEnum.DAY ? `${trafficLimitGb} GB ежедневно` : trafficReset == TrafficResetEnum.WEEK ? `${trafficLimitGb * 7} GB еженедельно` : trafficReset == TrafficResetEnum.MONTH ? `${trafficLimitGb * 30} GB ежемесячно` : `${trafficLimitGb * 365} GB ежегодно`}`}
          </div>
        ),
        isVisible: true,
      },
      {
        name: 'Сервера',
        value: (
          <div className="flex gap-2 items-center">
            {isAllBaseServers && isAllPremiumServers ? (
              'Доступ ко всем'
            ) : isAllBaseServers ? (
              'Все базовые'
            ) : serverSelected ? (
              <div className="flex flex-col gap-0.5 grow items-center justify-center text-white rounded-md text-[11px] font-mono ]">
                <div className="flex gap-2 grow flex-wrap">
                  {serverSelected.isPremium && (
                    <div className="flex items-center justify-center h-5 w-5 bg-[var(--gold-container)] rounded-md">
                      ⭐
                    </div>
                  )}
                  <Image
                    src={`/flags/${serverSelected.flagKey}.svg`}
                    alt="flag"
                    width={20}
                    height={20}
                  />
                  {serverSelected.code.toUpperCase()} [{serverSelected.network}
                  GBit]
                </div>
                <div className="flex gap-2 grow flex-wrap">
                  {serverSelected.name}
                </div>
              </div>
            ) : (
              <>Не задан!</>
            )}
          </div>
        ),
        isVisible: true,
      },
      {
        name: 'Период',
        value: (
          <div className="flex gap-1 items-center">
            <div>{periodButton.label}</div>
            {periodMultiplier > 1 && (
              <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                x{periodMultiplier}
              </div>
            )}
          </div>
        ),
        isVisible: planSelected.key !== PlansEnum.TRAFFIC,
      },
      {
        name: 'Скидка за период',
        value: <div>{getFinalPercent(periodButton.discount)}%</div>,
        isVisible:
          planSelected.key !== PlansEnum.TRAFFIC &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          getFinalPercent(periodButton.discount) > 0,
      },
      {
        name: 'Скидка за роль',
        value: <div>{getFinalPercent(user.roleDiscount)}%</div>,
        isVisible: getFinalPercent(user.roleDiscount) > 0,
      },
      {
        name: 'Авто продление',
        value: (
          <div className="flex flex-row gap-2 items-center">
            {isAutoRenewal ? 'Да' : 'Нет'}
          </div>
        ),
        isVisible:
          planSelected.key !== PlansEnum.TRAFFIC &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isAutoRenewal,
      },
      {
        name: 'К оплате',
        value: (
          <div className="flex gap-2 items-center">
            <TgStar type="star" w={14} />
            <div>
              {price}
              {price !== priceNoDiscount && (
                <span className="opacity-70 text-[12px] line-through">
                  ({priceNoDiscount})
                </span>
              )}
            </div>
          </div>
        ),
        isVisible: true,
      },
    ],
    [
      planSelected,
      devicesCount,
      isUnlimitTraffic,
      trafficLimitGb,
      trafficReset,
      isAllBaseServers,
      isAllPremiumServers,
      serverSelected,
      periodButton,
      periodMultiplier,
      user,
      isAutoRenewal,
      price,
      subscriptions,
      name,
    ],
  )

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
        Итого
      </div>

      <motion.div
        layout
        className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
        {summaryItems.map(
          (item) =>
            item.isVisible && (
              <motion.div
                key={item.name}
                className="flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono">
                <div className="opacity-50">{item.name}:</div>
                {item.value}
              </motion.div>
            ),
        )}
      </motion.div>
    </div>
  )
}
