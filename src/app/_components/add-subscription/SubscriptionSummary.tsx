'use client'

import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { ServerDataInterface } from '@app/types/servers-data.interface'

import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useMemo } from 'react'
import TgStar from '../Currency'
import { PeriodButtonInterface } from './AddSubscription'

// Компонент: Итоговая информация
export const SubscriptionSummary = ({
  planSelected,
  devicesCount, // eslint-disable-line @typescript-eslint/no-unused-vars
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
  subscriptions, // eslint-disable-line @typescript-eslint/no-unused-vars
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
  subscriptions: SubscriptionResponseInterface
  periodButton: PeriodButtonInterface
  periodMultiplier: number
  user: UserDataInterface
  isAutoRenewal: boolean
  price: number
  priceNoDiscount: number
  name: string
  trafficReset: TrafficResetEnum
  serverSelected: ServerDataInterface | null
}) => {
  const t = useTranslations('billing.subscription.summary')
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  const summaryItems = useMemo(
    () => [
      {
        name: t('name'),
        value: <div>{name}</div>,
        isVisible: true,
      },
      {
        name: t('traffic'),
        value: (
          <div>
            {isUnlimitTraffic
              ? t('unlimit')
              : planSelected.key === PlansEnum.TRAFFIC
                ? `${trafficLimitGb} GB`
                : `${trafficReset == TrafficResetEnum.DAY ? `${trafficLimitGb} GB ${t('daily')}` : trafficReset == TrafficResetEnum.WEEK ? `${trafficLimitGb * 7} GB ${t('weekly')}` : trafficReset == TrafficResetEnum.MONTH ? `${trafficLimitGb * 30} GB ${t('monthly')}` : `${trafficLimitGb * 365} GB ${t('yearly')}`}`}
          </div>
        ),
        isVisible: true,
      },
      {
        name: t('servers'),
        value: (
          <div className="flex gap-2 items-center">
            {isAllBaseServers && isAllPremiumServers ? (
              t('fullServers')
            ) : isAllBaseServers ? (
              t('allBase')
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
              <> {t('notServers')}</>
            )}
          </div>
        ),
        isVisible: true,
      },
      {
        name: t('period'),
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
        name: t('periodDiscount'),
        value: <div>{getFinalPercent(periodButton.discount)}%</div>,
        isVisible:
          planSelected.key !== PlansEnum.TRAFFIC &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          getFinalPercent(periodButton.discount) > 0,
      },
      {
        name: t('roleDiscount'),
        value: <div>{getFinalPercent(user.roleDiscount)}%</div>,
        isVisible: getFinalPercent(user.roleDiscount) > 0,
      },
      {
        name: t('autoRenewal'),
        value: (
          <div className="flex flex-row gap-2 items-center">
            {isAutoRenewal ? t('yes') : t('no')}
          </div>
        ),
        isVisible:
          planSelected.key !== PlansEnum.TRAFFIC &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isAutoRenewal,
      },
      {
        name: t('toPaid'),
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
      isUnlimitTraffic,
      trafficLimitGb,
      trafficReset,
      priceNoDiscount,
      t,
      isAllBaseServers,
      isAllPremiumServers,
      serverSelected,
      periodButton,
      periodMultiplier,
      user,
      isAutoRenewal,
      price,
      // subscriptions не используется в useMemo, удаляем
      name,
    ],
  )

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
        {t('title')}
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
