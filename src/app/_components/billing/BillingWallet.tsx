'use client'

import TgStar from '@app/app/_components/TgStar'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { fxUtil } from '@app/utils/fx.util'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaCircleInfo, FaPlus, FaRegSnowflake } from 'react-icons/fa6'
import { RiShareBoxFill } from 'react-icons/ri'
import { useTranslations } from 'use-intl'

export default function BillingWallet() {
  const { user } = useUserStore()
  const { rates, currencies } = useCurrencyStore()
  const t = useTranslations('billing.wallet')
  const location = usePathname()
  const url = location === '/app' ? '/app' : '/tma'

  if (!user || !rates || !currencies) return null

  const currency = currencies.find((c) => c.key === user.currencyCode)

  return (
    <div className="flex flex-col gap-1 items-center font-extralight font-mono max-w-[400px] w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full ">
        {t('title')}
      </div>
      <div
        className={
          'text-sm bg-[var(--surface-container-lowest)] rounded-md flex flex-col gap-2 py-4 px-4 max-w-[400px] w-full'
        }>
        <div className={'flex flex-row gap-2 items-center justify-between'}>
          <TooltipWrapper
            prompt={t('paymentInfo')}
            color="info"
            placement="top">
            <FaCircleInfo />
          </TooltipWrapper>
          <div className="relative grow">
            <div
              className={`absolute z-0 top-0 left-0 right-0 bottom-0 border-[2px] border-[var(--tg-star-gold)] bg-gradient-to-r from-[var(--tg-star-gold)] to-[var(--surface-container-low)] rounded-lg opacity-50`}
            />
            <div
              className={`flex flex-row flex-wrap  items-center px-2 py-1 gap-2 rounded-lg relative z-10`}>
              <div className="flex flex-row gap-2 items-center justify-center">
                <TgStar w={15} type={'gold'} />
              </div>
              <div className="font-bold font-mono text-sm">
                {addSuffixToNumberUtil(user.balance.paymentBalance, 2)}
              </div>
              <div className={'text-xs opacity-50 text-right'}>
                ≈{' '}
                {addSuffixToNumberUtil(
                  fxUtil(
                    user.balance.paymentBalance,
                    CurrencyEnum.XCH,
                    user.currencyCode,
                    rates,
                  ),
                  2,
                )}{' '}
                {currency?.key !== currency?.symbol && `${currency?.key}-`}
                {currency?.symbol}
              </div>
            </div>
          </div>
        </div>

        <div className={'flex flex-row gap-2 items-center justify-between'}>
          <TooltipWrapper
            prompt={t('withdrawalInfo')}
            color="info"
            placement="top">
            <FaCircleInfo />
          </TooltipWrapper>
          <div className="relative grow">
            <div
              className={`absolute z-0 top-0 left-0 right-0 bottom-0 border-[2px] border-[var(--tg-star-purple)] bg-gradient-to-r from-[var(--tg-star-purple)] to-[var(--surface-container-low)] rounded-lg opacity-50`}
            />
            <div
              className={`flex flex-row flex-wrap items-center px-2 py-1 gap-2 rounded-lg relative z-10`}>
              <div className="flex flex-row items-center justify-center">
                <TgStar w={15} type={'purple'} />
              </div>
              <div className="font-bold font-mono text-sm">
                {addSuffixToNumberUtil(user.balance.withdrawalBalance, 2)}
              </div>
              <div className={'text-xs opacity-50'}>
                ≈{' '}
                {addSuffixToNumberUtil(
                  fxUtil(
                    user.balance.withdrawalBalance,
                    CurrencyEnum.XCH,
                    user.currencyCode,
                    rates,
                  ),
                  2,
                )}{' '}
                {currency?.key !== currency?.symbol && `${currency?.key}-`}
                {currency?.symbol}
              </div>
            </div>
          </div>
        </div>

        <div className={'flex flex-row gap-2 items-center justify-between'}>
          <TooltipWrapper prompt={t('holdInfo')} color="info" placement="top">
            <FaCircleInfo />
          </TooltipWrapper>
          <div className="relative grow">
            <div
              className={`absolute z-0 top-0 left-0 right-0 bottom-0 border-[2px] border-[var(--tg-star-ice)] bg-gradient-to-r from-[var(--tg-star-ice)] to-[var(--surface-container-low)] rounded-lg opacity-50`}
            />
            <div
              className={`flex flex-row flex-wrap items-center px-2 py-1 gap-2 rounded-lg relative z-10`}>
              <div className="flex flex-row items-center justify-center">
                <FaRegSnowflake className={'text-[var(--tg-star-ice)]'} />
              </div>
              <div className="font-bold font-mono text-sm">
                {addSuffixToNumberUtil(user.balance.holdBalance, 2)}
              </div>
              <div className={'text-xs opacity-50'}>
                ≈{' '}
                {addSuffixToNumberUtil(
                  fxUtil(
                    user.balance.holdBalance,
                    CurrencyEnum.XCH,
                    user.currencyCode,
                    rates,
                  ),
                  2,
                )}{' '}
                {currency?.key !== currency?.symbol && `${currency?.key}-`}
                {currency?.symbol}
              </div>
            </div>
          </div>
          {/*<div className="min-w-[110px]"></div>*/}
        </div>

        <div className={'flex flex-row gap-2 items-center justify-between'}>
          <Link href={`${url}/payment`} className="cursor-pointer grow">
            <div className="bg-[var(--secondary-container)]  py-1 px-2 flex items-center justify-center rounded-md font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] flex-row gap-2">
              <TgStar w={15} type={'gold'} />
              {t('payment')}
              <FaPlus className="text-sm" />
            </div>
          </Link>
          <Link href={`${url}/withdrawal`} className="cursor-pointer grow">
            <div className="bg-[var(--secondary-container)]  py-1 px-2 flex items-center justify-center rounded-md font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] flex-row gap-2">
              <TgStar w={15} type={'purple'} />
              {t('withdrawal')}
              <RiShareBoxFill className="text-sm" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
