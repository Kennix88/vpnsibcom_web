'use client'

import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { FaCircleInfo } from 'react-icons/fa6'
import TgStar from '../TgStar'
import TooltipWrapper from '../TooltipWrapper'
import { PeriodButtonInterface } from './AddSubscription'

// Компонент: Итоговая информация
export const SubscriptionSummary = ({
  planSelected,
  devicesCount,
  isUnlimitTraffic,
  trafficLimitGb,
  isAllBaseServers,
  isAllPremiumServers,
  baseServersCount,
  premiumServersCount,
  periodButton,
  periodMultiplier,
  user,
  isFixedPrice,
  isAutoRenewal,
  price,
  nextFinalPrice,
  subscriptions,
}: {
  planSelected: PlansInterface
  devicesCount: number
  isUnlimitTraffic: boolean
  trafficLimitGb: number
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  baseServersCount: number
  premiumServersCount: number
  periodButton: PeriodButtonInterface
  periodMultiplier: number
  user: UserDataInterface
  isFixedPrice: boolean
  isAutoRenewal: boolean
  price: number
  nextFinalPrice: number
  subscriptions: SubscriptionResponseInterface
}) => {
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  const summaryItems = useMemo(
    () => [
      {
        name: 'Устройства',
        value: <div>{devicesCount} шт.</div>,
        isVisible:
          planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM,
      },
      {
        name: 'Трафик',
        value: (
          <div>{isUnlimitTraffic ? 'Безлимит' : `${trafficLimitGb} ГБ.`}</div>
        ),
        isVisible:
          planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM,
      },
      {
        name: 'Сервера',
        value: (
          <div className="flex gap-2 items-center">
            {isAllBaseServers && isAllPremiumServers ? (
              'Все базовые + премиум'
            ) : isAllBaseServers ? (
              'Все базовые'
            ) : (
              <>
                <TooltipWrapper
                  prompt={'Базовые/Премиум сервера'}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
                {baseServersCount}/{premiumServersCount} шт.
              </>
            )}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM,
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
        isVisible: true,
      },
      {
        name: 'Скидка за период',
        value: <div>{getFinalPercent(periodButton.discount)}%</div>,
        isVisible:
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
          planSelected.serversSelectType ===
            PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isAutoRenewal,
      },
      {
        name: 'К оплате за период',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {price}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType ===
            PlansServersSelectTypeEnum.CUSTOM &&
          isFixedPrice &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY,
      },
      {
        name: 'Фиксация цены',
        value: (
          <div className="flex flex-row gap-2 items-center">
            {isFixedPrice ? 'Да' : 'Нет'}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType ===
            PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isFixedPrice,
      },
      {
        name: 'К оплате разово',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {subscriptions.fixedPriceStars}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType ===
            PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isFixedPrice,
      },
      {
        name: 'Всего к оплате',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {nextFinalPrice.toFixed(2)}
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
      isAllBaseServers,
      isAllPremiumServers,
      baseServersCount,
      premiumServersCount,
      periodButton,
      periodMultiplier,
      user,
      isFixedPrice,
      isAutoRenewal,
      price,
      nextFinalPrice,
      subscriptions,
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
