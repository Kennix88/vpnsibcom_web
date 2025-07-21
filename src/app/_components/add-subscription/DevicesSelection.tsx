'use client'

import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { motion } from 'framer-motion'
import TgStar from '../TgStar'
import { DEVICES_COUNTS } from './constants'
import { calculateDevicePrice, getDevicesCountButtonColor } from './functions'

// Компонент: Выбор устройств
export const DevicesSelection = ({
  devicesCount,
  setDevicesCount,
  user,
  subscriptions,
}: {
  devicesCount: number
  setDevicesCount: (val: number) => void
  user: UserDataInterface
  subscriptions: SubscriptionResponseInterface
}) => {
  const devicePrice = calculateDevicePrice(user, subscriptions, devicesCount)

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="flex gap-2 items-end justify-between w-full px-4 ">
        <div className="opacity-50 flex flex-row gap-2 items-center">
          Устройства
        </div>
        <div className="flex gap-2 items-center ">
          <TgStar type="gold" w={14} />
          {(user.isTgProgramPartner
            ? devicePrice * subscriptions.telegramPartnerProgramRatio
            : devicePrice
          ).toFixed(2)}
        </div>
      </div>

      <motion.div
        layout
        className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
        <button
          onClick={() => setDevicesCount(Math.max(1, devicesCount - 1))}
          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
          style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
          -
        </button>
        <input
          type="number"
          value={devicesCount}
          onChange={(e) =>
            setDevicesCount(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
        />
        <button
          onClick={() => setDevicesCount(devicesCount + 1)}
          className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
          style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
          +
        </button>

        {DEVICES_COUNTS.map((val) => {
          const isActive = devicesCount === val
          const rgb = getDevicesCountButtonColor(val)
          const bgOpacity = isActive ? 0.3 : 0.15
          return (
            <motion.button
              key={val}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDevicesCount(val)}
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
      </motion.div>
    </div>
  )
}
