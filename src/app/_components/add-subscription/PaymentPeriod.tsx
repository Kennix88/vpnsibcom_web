'use client'

import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import TgStar from '../TgStar'
import { PeriodButtonInterface } from './AddSubscription'
import { PERIOD_MULTIPLIERS } from './constants'
import { getButtonColor } from './functions'

// Компонент: Периодичность оплаты
export const PaymentPeriod = ({
  periodButtons,
  periodButton,
  setPeriodButton,
  periodMultiplier,
  setPeriodMultiplier,
  planSelected,
  user,
  subscriptions,
  price,
}: {
  periodButtons: PeriodButtonInterface[]
  periodButton: PeriodButtonInterface
  setPeriodButton: (val: PeriodButtonInterface) => void
  periodMultiplier: number
  setPeriodMultiplier: (val: number) => void
  planSelected: PlansInterface
  user: UserDataInterface
  subscriptions: SubscriptionResponseInterface
  price: number
}) => {
  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="flex gap-2 items-end justify-between w-full px-4 ">
        <div className="opacity-50 flex flex-row gap-2 items-center">
          Периодичность оплаты
        </div>
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
        {periodButtons.map((btn) => {
          const isActive = btn.key === periodButton.key
          const bgOpacity = isActive ? 0.3 : 0.15
          return (
            <motion.button
              key={btn.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (btn.key === SubscriptionPeriodEnum.INDEFINITELY) {
                  setPeriodMultiplier(1)
                }
                setPeriodButton(btn)
              }}
              className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{
                backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                border: isActive
                  ? `1px solid rgba(216, 197, 255, 0.7)`
                  : '1px solid transparent',
              }}>
              {btn.label}{' '}
              {btn.discount < 1 && `(-${getFinalPercent(btn.discount)}%)`}
            </motion.button>
          )
        })}

        {planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY && (
            <>
              <div className="w-full flex flex-col gap-1 opacity-50">
                Множитель периода
              </div>
              <button
                onClick={() =>
                  setPeriodMultiplier(Math.max(1, periodMultiplier - 1))
                }
                className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                -
              </button>
              <input
                type="number"
                value={periodMultiplier}
                onChange={(e) =>
                  setPeriodMultiplier(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                onClick={() => setPeriodMultiplier(periodMultiplier + 1)}
                className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                +
              </button>

              {PERIOD_MULTIPLIERS.map((val) => {
                const isActive = periodMultiplier === val
                const rgb = getButtonColor(val)
                const bgOpacity = isActive ? 0.3 : 0.15
                return (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPeriodMultiplier(val)}
                    className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                    style={{
                      backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                      border: isActive
                        ? `1px solid rgba(${rgb}, 0.7)`
                        : '1px solid transparent',
                    }}>
                    x{val}
                  </motion.button>
                )
              })}
            </>
          )}
      </motion.div>
    </div>
  )
}
