'use client'

import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import TgStar from '../TgStar'
import { TRAFFIC_GBS } from './constants'
import { calculateTrafficPrice, getDevicesCountButtonColor } from './functions'

// Компонент: Выбор трафика
export const TrafficSelection = ({
  trafficLimitGb,
  setTrafficLimitGb,
  isUnlimitTraffic,
  setIsUnlimitTraffic,
  user,
  subscriptions,
}: {
  trafficLimitGb: number
  setTrafficLimitGb: (val: number) => void
  isUnlimitTraffic: boolean
  setIsUnlimitTraffic: (val: boolean) => void
  user: UserDataInterface
  subscriptions: SubscriptionResponseInterface
}) => {
  const trafficPrice = calculateTrafficPrice(
    user,
    subscriptions,
    isUnlimitTraffic,
    trafficLimitGb,
  )

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="flex gap-2 items-end justify-between w-full px-4 ">
        <div className="opacity-50 flex flex-row gap-2 items-center">
          Ежедневный трафик ГБ
        </div>
        <div className="flex gap-2 items-center ">
          <TgStar type="gold" w={14} />
          {(user.isTgProgramPartner
            ? trafficPrice * subscriptions.telegramPartnerProgramRatio
            : trafficPrice
          ).toFixed(2)}
        </div>
      </div>

      <motion.div
        layout
        className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
        <button
          onClick={() => {
            setTrafficLimitGb(Math.max(1, trafficLimitGb - 1))
            setIsUnlimitTraffic(false)
          }}
          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
          style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
          -
        </button>
        <input
          type="number"
          value={trafficLimitGb}
          onChange={(e) => {
            setTrafficLimitGb(Math.max(1, parseInt(e.target.value) || 1))
            setIsUnlimitTraffic(false)
          }}
          className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
        />
        <button
          onClick={() => {
            setTrafficLimitGb(trafficLimitGb + 1)
            setIsUnlimitTraffic(false)
          }}
          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
          style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
          +
        </button>

        {TRAFFIC_GBS.map((val) => {
          const isActive = trafficLimitGb === val
          const rgb = getDevicesCountButtonColor(val)
          const bgOpacity = isActive ? 0.3 : 0.15
          return (
            <motion.button
              key={val}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTrafficLimitGb(val)
                setIsUnlimitTraffic(false)
              }}
              className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{
                backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                border: isActive
                  ? `1px solid rgba(${rgb}, 0.7)`
                  : '1px solid transparent',
              }}>
              {val}
            </motion.button>
          )
        })}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setTrafficLimitGb(0)
            setIsUnlimitTraffic(true)
          }}
          className="flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            backgroundColor: `rgba(216, 197, 255, ${isUnlimitTraffic ? 0.3 : 0.15})`,
            border: isUnlimitTraffic
              ? `1px solid rgba(216, 197, 255, 0.7)`
              : '1px solid transparent',
          }}>
          Безлимит
        </motion.button>
      </motion.div>
    </div>
  )
}
