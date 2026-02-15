'use client'

import Currency from '@app/app/_components/Currency'
import { useUserStore } from '@app/store/user.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaPlus, FaRegSnowflake } from 'react-icons/fa6'
import { TiWarning } from 'react-icons/ti'

export default function Balance({
  type = 'payment',
  fixedNumber = 3,
}: {
  type?: 'payment' | 'wager' | 'hold' | 'ticket' | 'traffic' | 'ad'
  fixedNumber?: number
}) {
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()
  // Safely access balance properties with fallback to 0
  const balance =
    user && user.balance
      ? type === 'payment'
        ? user.balance.payment
        : type === 'hold'
          ? user.balance.hold
          : type === 'ticket'
            ? user.balance.tickets
            : type === 'traffic'
              ? user.balance.traffic
              : type === 'ad'
                ? user.balance.ad
                : 0
      : 0

  return (
    <div className="relative">
      <div
        className={`absolute z-0 top-0 left-0 right-0 bottom-0 border-[2px] ${type == 'payment' ? 'border-[var(--star)] from-[var(--star)]' : type == 'wager' ? 'border-[var(--wager)] from-[var(--wager)]' : type == 'ticket' ? 'border-[var(--ticket)] from-[var(--ticket)]' : type == 'traffic' ? 'border-[var(--traffic)] from-[var(--traffic)]' : type == 'ad' ? 'border-[var(--ad)] from-[var(--ad)]' : 'border-[var(--ice)] from-[var(--ice)]'} bg-gradient-to-r to-[var(--surface-container-low)] rounded-lg opacity-50`}
      />
      <div
        className={`flex  items-center pl-1 ${type == 'payment' || type == 'ad' ? 'pr-1' : 'pr-2'} py-1 gap-1.5 rounded-lg relative z-10`}>
        <div className="flex items-center justify-center">
          {type == 'hold' ? (
            <FaRegSnowflake className={'text-[var(--ice)]'} />
          ) : type == 'wager' ? (
            <TiWarning className={'text-[var(--wager)]'} />
          ) : (
            <Currency
              w={18}
              type={
                type == 'payment'
                  ? 'star'
                  : type == 'ticket'
                    ? 'ticket'
                    : type == 'traffic'
                      ? 'traffic'
                      : type == 'ad'
                        ? 'ad'
                        : 'star'
              }
            />
          )}
        </div>
        <div className="font-bold font-mono text-sm">
          {addSuffixToNumberUtil(balance, fixedNumber)}
        </div>
        {type == 'payment' && (
          <Link href={`${url}/payment`} className="cursor-pointer">
            <div className="bg-[var(--secondary-container)] p-1 flex items-center justify-center rounded-md font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
              <FaPlus className="text-sm" />
            </div>
          </Link>
        )}
        {type == 'ad' && (
          <Link href={`${url}/earning`} className="cursor-pointer">
            <div className="bg-[var(--secondary-container)] p-1 flex items-center justify-center rounded-md font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
              <FaPlus className="text-sm" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
