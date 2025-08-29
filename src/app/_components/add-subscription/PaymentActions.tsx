'use client'

import { config } from '@app/config/client'
import { UserDataInterface } from '@app/types/user-data.interface'
import clsx from 'clsx'
import Link from 'next/link'
import { FaCircleInfo } from 'react-icons/fa6'
import TgStar from '../TgStar'

// Компонент: Кнопки оплаты
export const PaymentActions = ({
  user,
  isAllBaseServers,
  isAllPremiumServers,
  serversSelected,
  balance,
  nextFinalPrice,
  isLoading,
  onBalancePayment,
  onInvoicePayment,
  tBill,
}: {
  user: UserDataInterface
  isAllBaseServers: boolean
  isAllPremiumServers: boolean
  serversSelected: string[]
  balance: number
  nextFinalPrice: number
  isLoading: boolean
  onBalancePayment: () => Promise<void>
  onInvoicePayment: () => Promise<void>
  tBill: (key: string) => string
}) => {
  const hasSelectedServers =
    isAllBaseServers || isAllPremiumServers || serversSelected.length > 0

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      {!hasSelectedServers ? (
        <div className="bg-[var(--warning-container)] text-[var(--on-warning-container)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]">
          <div className="flex flex-row gap-2 items-center text-xs">
            <FaCircleInfo />
            Выберите хотя бы один сервер!
          </div>
        </div>
      ) : balance >= nextFinalPrice ? (
        <button
          onClick={onBalancePayment}
          disabled={isLoading}
          className={clsx(
            'flex flex-row gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
            isLoading && 'opacity-50 pointer-events-none',
          )}>
          {isLoading && (
            <div
              className="loader"
              style={{ width: '15px', height: '15px', borderWidth: '2px' }}
            />
          )}
          {user.roleDiscount > 0 ? (
            <>
              Оплатить с баланса <TgStar type="gold" w={15} />{' '}
              {nextFinalPrice.toFixed(2)}
            </>
          ) : (
            <>Добавить БЕСПЛАТНО</>
          )}
        </button>
      ) : (
        <div className="bg-[var(--surface-container)] text-[var(--on-surface)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]">
          <div className="flex flex-row gap-2 items-center text-xs">
            <FaCircleInfo />
            На вашем балансе недостаточно средств
          </div>
          <Link
            className="flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--surface-container-high)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm"
            href={`/tma/payment?amount=${Math.ceil(nextFinalPrice - balance)}`}>
            Пополнить баланс на <TgStar type="gold" w={14} />{' '}
            {Math.ceil(nextFinalPrice - balance)}
          </Link>
        </div>
      )}

      {hasSelectedServers && user.roleDiscount > 0 && (
        <>
          <div className="w-full flex gap-2 items-center px-4">
            <div className="h-[1px] grow bg-[var(--primary)]"></div>
            <div className="text-[var(--primary)]">или</div>
            <div className="h-[1px] grow bg-[var(--primary)]"></div>
          </div>

          <button
            onClick={onInvoicePayment}
            disabled={isLoading}
            className={clsx(
              'flex flex-row gap-2 items-center justify-center bg-[var(--surface-container-lowest)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
              isLoading && 'opacity-50 pointer-events-none',
            )}>
            {isLoading && (
              <div
                className="loader"
                style={{ width: '15px', height: '15px', borderWidth: '2px' }}
              />
            )}
            Оплатить напрямую <TgStar type="original" w={15} />{' '}
            {Math.ceil(nextFinalPrice)}
          </button>

          <div className="bg-[var(--surface-container)] text-[var(--on-surface)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]">
            <div className="flex flex-row gap-2 items-center text-xs">
              <FaCircleInfo className="text-3xl" />
              {tBill('split')}
            </div>
            <Link
              href={config.SPLIT_TG_REF_URL}
              className="flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--surface-container-high)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm"
              target="_blank">
              {tBill('splitBay')} <TgStar type="original" w={15} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
