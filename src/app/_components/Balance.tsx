'use client'

import TgStar from '@app/app/_components/TgStar'
import { useUserStore } from '@app/store/user.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaPlus, FaRegSnowflake } from 'react-icons/fa6'

export default function Balance({
  type = 'payment',
  isAdd = false,
}: {
  type?: 'payment' | 'withdraw' | 'hold' | 'total'
  isAdd?: boolean
}) {
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'
  const { user } = useUserStore()
  const balance = user
    ? type == 'payment'
      ? user.balance.isUseWithdrawalBalance && isAdd
        ? user.balance.withdrawalBalance + user.balance.paymentBalance
        : user.balance.paymentBalance
      : type == 'withdraw'
        ? user.balance.withdrawalBalance
        : type == 'hold'
          ? user.balance.holdBalance
          : user.balance.totalEarnedWithdrawalBalance
    : 0

  return (
    <div className="relative">
      <div
        className={`absolute z-0 top-0 left-0 right-0 bottom-0 border-[2px] ${type == 'payment' ? 'border-[var(--tg-star-gold)]' : type == 'withdraw' || type == 'total' ? 'border-[var(--tg-star-purple)]' : 'border-[var(--tg-star-ice)]'} bg-gradient-to-r ${type == 'payment' ? 'from-[var(--tg-star-gold)]' : type == 'withdraw' || type == 'total' ? 'from-[var(--tg-star-purple)]' : 'from-[var(--tg-star-ice)]'} to-[var(--surface-container-low)] rounded-lg opacity-50`}
      />
      <div
        className={`flex flex-row items-center pl-2 ${type == 'payment' ? 'pr-1' : 'pr-2'} py-1 gap-2 rounded-lg relative z-10`}>
        <div className="flex flex-row items-center justify-center">
          {type == 'hold' ? (
            <FaRegSnowflake className={'text-[var(--tg-star-ice)]'} />
          ) : (
            <TgStar
              w={15}
              type={
                type == 'payment'
                  ? 'gold'
                  : type == 'withdraw' || type == 'total'
                    ? 'purple'
                    : 'ice'
              }
            />
          )}
        </div>
        <div className="font-bold font-mono text-sm">
          {addSuffixToNumberUtil(balance, 2)}
        </div>
        {type == 'payment' && (
          <Link href={`${url}/payment`} className="cursor-pointer">
            <div className="bg-[var(--secondary-container)] p-1 flex items-center justify-center rounded-md font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
              <FaPlus className="text-sm" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
