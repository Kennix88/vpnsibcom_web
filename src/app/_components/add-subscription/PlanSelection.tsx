'use client'

import { PlansEnum } from '@app/enums/plans.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import TgStar from '../TgStar'

export const PlanSelection = ({
  plans,
  planSelected,
  onSelect,
  user,
  subscriptions,
  price,
}: {
  plans: PlansInterface[]
  planSelected: PlansInterface | null
  onSelect: (plan: PlansInterface) => void
  user: UserDataInterface
  subscriptions: SubscriptionResponseInterface
  price: number
}) => (
  <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
    <div className="flex gap-2 items-end justify-between w-full px-4 ">
      <div className="opacity-50 flex flex-row gap-2 items-center">Тариф</div>
      <div className="flex gap-2 items-center ">
        <TgStar type="gold" w={14} />
        {(user.isTgProgramPartner
          ? price * subscriptions.telegramPartnerProgramRatio
          : price
        ).toFixed(2)}
      </div>
    </div>

    <motion.div
      layout
      className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
      {plans
        .sort((a, b) => {
          const indexA = Object.values(PlansEnum).indexOf(a.key)
          const indexB = Object.values(PlansEnum).indexOf(b.key)

          const safeIndexA = indexA === -1 ? Infinity : indexA
          const safeIndexB = indexB === -1 ? Infinity : indexB

          return safeIndexA - safeIndexB
        })
        .map((btn) => {
          const isActive = btn.key === planSelected?.key
          const bgOpacity = isActive ? 0.3 : 0.15
          return (
            <motion.button
              key={btn.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(btn)}
              className={clsx(
                'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
              )}
              style={{
                backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                border: isActive
                  ? `1px solid rgba(216, 197, 255, 0.7)`
                  : '1px solid transparent',
              }}>
              {btn.name}
            </motion.button>
          )
        })}
    </motion.div>
  </div>
)
