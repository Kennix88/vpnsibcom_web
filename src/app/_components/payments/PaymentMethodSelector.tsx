'use client'

import Loader from '@app/app/_components/Loader'
import { PaymentMethodIcons } from '@app/app/_components/payments/payment-method-icons'
import TgStar from '@app/app/_components/TgStar'
import { TonWalletConnect } from '@app/app/_components/ton/TonWalletConnect'
import TooltipWrapper from '@app/app/_components/TooltipWrapper'
import { config } from '@app/config/client'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodTypeEnum } from '@app/enums/payment-method-type.enum'
import { PaymentSystemEnum } from '@app/enums/payment-system.enum'
import { useUserStore } from '@app/store/user.store'
import { CurrencyInterface } from '@app/types/currency.interface'
import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
import { RatesInterface } from '@app/types/rates.interface'
import { hexToRgb } from '@app/utils/color.util'
import { fxUtil } from '@app/utils/fx.util'
import { useTonWallet } from '@tonconnect/ui-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FaCircleInfo } from 'react-icons/fa6'
import { TbCheck } from 'react-icons/tb'
import { useTranslations } from 'use-intl'

type Props = {
  methods?: PaymentMethodsDataInterface[]
  currencies: CurrencyInterface[]
  amount: number
  rates: RatesInterface
  isLoading?: boolean
  selectedKey?: string
  onSelect: (method: PaymentMethodsDataInterface) => void
  isTma?: boolean
}

export const PaymentMethodSelector = ({
  methods = [],
  currencies,
  amount,
  rates,
  isLoading,
  selectedKey,
  onSelect,
  isTma = false,
}: Props) => {
  const t = useTranslations('billing.payment')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [type, setType] = useState<PaymentMethodTypeEnum | 'ALL'>('ALL')
  const { user } = useUserStore()
  const wallet = useTonWallet()

  const methodsWithLimits = useMemo(() => {
    return methods.map((method) => {
      const convertedAmount = fxUtil(
        amount,
        CurrencyEnum.XTR,
        method.currency.key,
        rates,
      )
      const disabled =
        convertedAmount < method.minAmount || convertedAmount > method.maxAmount

      return { method, disabled, convertedAmount }
    })
  }, [methods, amount, rates])

  if (!mounted || isLoading || !user) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader />
      </div>
    )
  }

  const filterButtons: {
    name: string
    type: PaymentMethodTypeEnum | 'ALL'
  }[] = [
    {
      name: t('sort.all'),
      type: 'ALL',
    },
    {
      name: t('sort.crypto'),
      type: PaymentMethodTypeEnum.CRYPTOCURRENCY,
    },
    {
      name: t('sort.card'),
      type: PaymentMethodTypeEnum.CARD,
    },
    {
      name: t('sort.sbp'),
      type: PaymentMethodTypeEnum.SBP,
    },
    {
      name: t('sort.wallets'),
      type: PaymentMethodTypeEnum.WALLET,
    },
    {
      name: t('sort.skins'),
      type: PaymentMethodTypeEnum.SKINS,
    },
  ]

  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
        {t('method')}
      </div>
      <div className="flex flex-wrap gap-2 w-full justify-center bg-[var(--surface-container-lowest)] p-4 rounded-md">
        {!isTma && (
          <div
            className={
              'flex flex-row gap-2 flex-wrap items-center w-full pb-2 border-b-2 border-[var(--on-surface)]/50'
            }>
            {filterButtons.map((el) => (
              <button
                key={el.type}
                onClick={() => setType(el.type)}
                className={clsx(
                  'relative grow gap-2 rounded-md py-1 px-2 text-sm text-center cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  el.type === type
                    ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'bg-[var(--surface-container)] text-[var(--on-surface)]',
                )}>
                {el.name}
              </button>
            ))}
          </div>
        )}
        <div
          className={
            'bg-[var(--warning-container)] text-[var(--on-warning-container)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]'
          }>
          <div className={'flex flex-row gap-2 items-center text-xs'}>
            <FaCircleInfo className={'text-3xl'} />
            {t('split')}
          </div>
          <Link
            href={config.SPLIT_TG_REF_URL}
            className={
              'flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--warning)] text-[var(--on-warning)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm'
            }
            target={'_blank'}>
            {t('splitBay')} <TgStar type={'gold'} w={15} />
          </Link>
        </div>

        {methodsWithLimits
          .sort((a, b) => a.method.system.localeCompare(b.method.system))
          .sort((a, b) => {
            if (a.method.type == PaymentMethodTypeEnum.STARS) return -2
            if (b.method.type == PaymentMethodTypeEnum.STARS) return 2
            if (a.method.type == PaymentMethodTypeEnum.CRYPTOCURRENCY) return -1
            if (b.method.type == PaymentMethodTypeEnum.CRYPTOCURRENCY) return 1
            return a.method.type.localeCompare(b.method.type)
          })
          .filter((el) =>
            !wallet?.account.address
              ? el.method.system != PaymentSystemEnum.TON_BLOCKCHAIN
              : true,
          )
          .filter((el) => type === 'ALL' || el.method.type === type)
          .map(({ method, disabled, convertedAmount }) => {
            const currency = currencies.find(
              (c) => c.key === method.currency.key,
            )
            if (!currency) return null

            const isSelected = method.key === selectedKey

            const card = (
              <motion.button
                key={method.key}
                disabled={disabled}
                whileTap={{ scale: disabled ? 1 : 0.97 }}
                onClick={() => onSelect(method)}
                className={clsx(
                  'relative grow flex flex-col items-start justify-between gap-1 rounded-md p-2 shadow-sm text-left transition',
                  disabled
                    ? 'opacity-50 pointer-events-none grow'
                    : 'cursor-pointer',
                  isSelected && 'border-2 border-[var(--primary)]',
                )}
                style={{
                  backgroundColor: isSelected
                    ? `rgba(${hexToRgb('#005138')?.r}, ${hexToRgb('#005138')?.g}, ${hexToRgb('#005138')?.b}, 0.3)`
                    : `var(--surface-container-low)`,
                  border: isSelected
                    ? `2px solid rgba(${hexToRgb('#005138')?.r}, ${hexToRgb('#005138')?.g}, ${hexToRgb('#005138')?.b}, 0.7)`
                    : 'none',
                }}>
                <div className="flex gap-2 items-start w-full justify-between">
                  <div className="flex gap-2 items-center ">
                    <Image
                      src={PaymentMethodIcons[method.key] || '/icons/cards.svg'}
                      alt=""
                      width={40}
                      height={40}
                    />
                    <div>
                      <div className="font-extrabold text-sm">
                        {method.name}
                      </div>
                      <div
                        className={'text-xs flex flex-row gap-1 items-center'}>
                        {method.system == PaymentSystemEnum.TELEGRAM ? (
                          <>
                            <span className={'opacity-70'}>Telegram</span>
                            <Image
                              src={'/icons/telegram.svg'}
                              alt="Telegram"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system ==
                          PaymentSystemEnum.TON_BLOCKCHAIN ? (
                          <>
                            <span className={'opacity-70'}>TON on-chain</span>
                            <Image
                              src={'/icons/TON.svg'}
                              alt="TON"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.PAYEER ? (
                          <>
                            <span className={'opacity-70'}>Payeer</span>
                            <Image
                              src={'/icons/payeer.svg'}
                              alt="Payeer"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.VOLET ? (
                          <>
                            <span className={'opacity-70'}>Volet</span>
                            <Image
                              src={'/icons/volet.svg'}
                              alt="Volet"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.WATA ? (
                          <>
                            <span className={'opacity-70'}>Wata</span>
                            <Image
                              src={'/icons/wata.svg'}
                              alt="Wata"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.CRYPTOMUS ? (
                          <>
                            <span className={'opacity-70'}>Cryptomus</span>
                            <Image
                              src={'/icons/cryptomus.svg'}
                              alt="Cryptomus"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.PAYPALYCH ? (
                          <>
                            <span className={'opacity-70'}>Paypalych</span>
                            <Image
                              src={'/icons/paypalych.svg'}
                              alt="Paypalych"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : method.system == PaymentSystemEnum.SKINSBACK ? (
                          <>
                            <span className={'opacity-70'}>Skinsback</span>
                            <Image
                              src={'/icons/skinsback.svg'}
                              alt="Skinsback"
                              width={15}
                              height={15}
                            />
                          </>
                        ) : (
                          method.system == PaymentSystemEnum.TOME && (
                            <>
                              <span className={'opacity-70'}>Tome</span>
                              <Image
                                src={'/icons/tome.svg'}
                                alt="Tome"
                                width={15}
                                height={15}
                              />
                            </>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 text-[var(--on-tertiary-container)] bg-[var(--tertiary-container)] text-center rounded-md writespace-nowrap">
                    {currency?.key !== currency?.symbol
                      ? `${currency?.key}-${currency?.symbol}`
                      : `${currency?.symbol}`}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-[-10px] right-[-10px] text-xs z-10 w-5 h-5 text-center rounded-full flex items-center justify-center bg-[var(--success-container)] text-[var(--on-success-container)]">
                    <TbCheck />
                  </div>
                )}
                <div className="text-xs flex gap-1 items-center opacity-80 flex-row justify-end w-full">
                  {/*<span>{method.type}</span>*/}
                  {method.commission * 100 - 100 > 0 && (
                    <div className="text-xs text-[var(--error)]">
                      {t('commission')}:{' '}
                      {(method.commission * 100 - 100).toFixed(2)}%{' '}
                      {currency?.key !== currency?.symbol &&
                        `${currency?.key}-`}
                      {currency?.symbol}
                    </div>
                  )}
                </div>
              </motion.button>
            )

            return disabled ? (
              <TooltipWrapper
                key={method.key}
                prompt={t('limitMessage', {
                  min: method.minAmount,
                  max: method.maxAmount,
                  symbol: currency.symbol,
                  convertedAmount: convertedAmount.toFixed(2),
                })}
                placement="top">
                {card}
              </TooltipWrapper>
            ) : (
              card
            )
          })}

        {!isTma && !wallet?.account.address && (
          <div className={'flex flex-col gap-2 w-full max-w-[400px]'}>
            <div>{t('walletInfo')}</div>
            <TonWalletConnect />
          </div>
        )}
      </div>
    </div>
  )
}
