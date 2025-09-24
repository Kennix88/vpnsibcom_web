'use client'

import TgStar from '@app/app/_components/Currency'
import PaymentInvoiceButton from '@app/app/_components/payments/PaymentInvoiceButton'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { fxUtil } from '@app/utils/fx.util'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Suspense, useState } from 'react'
import { useTranslations } from 'use-intl'

const quickAmounts = [50, 100, 500, 700, 1000, 2000, 3000, 5000, 10000, 15000]

const getButtonColor = (amount: number) => {
  if (amount < 1000) return 'var(--color-green)'
  if (amount < 10000) return 'var(--color-gold)'
  return 'var(--color-red)'
}

// Inner component that uses useSearchParams
function PaymentsContent() {
  const t = useTranslations('billing.payment')
  const { user, setUser } = useUserStore()
  const [amount, setAmount] = useState<number>(700)
  const { rates, currencies } = useCurrencyStore()

  // useEffect(() => {
  //   if (!methods) return
  //   if (url == '/tma')
  //     setSelectedMethod(
  //       methods.find((m) => m.type == PaymentMethodTypeEnum.STARS) ||
  //         methods[0],
  //     )
  //   else setSelectedMethod(methods[0])
  //   if (searchParams.has('amount')) {
  //     setAmount(parseInt(searchParams.get('amount') || '700'))
  //   }
  // }, [methods])

  if (!user || !rates || !currencies) return null
  const currency = currencies.find((c) => c.key === user.currencyCode)

  if (!currency) return null

  return (
    <div className={'flex flex-col gap-4 items-center pb-[100px]'}>
      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
          {t('sum')}
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-col gap-4 py-5 px-4 w-full shadow-md">
          <div className="flex flex-row gap-2 items-center justify-center w-full">
            <TgStar w={15} type="star" />
            <input
              type="number"
              placeholder={t('enterSum')}
              value={amount || ''}
              onChange={(e) =>
                setAmount(e.target.value ? parseInt(e.target.value) : 700)
              }
              className="border max-w-[250px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
            />
            <div className={'text-xs opacity-50'}>
              ≈{' '}
              {addSuffixToNumberUtil(
                fxUtil(amount, CurrencyEnum.XTR, user.currencyCode, rates),
                2,
              )}{' '}
              {currency?.key !== currency?.symbol && `${currency?.key}-`}
              {currency?.symbol}
            </div>
          </div>

          <div className="flex flex-row flex-wrap gap-2 items-center w-full">
            {quickAmounts.map((val) => {
              const isActive = amount === val
              const rgb = getButtonColor(val)
              const bgOpacity = isActive ? 0.3 : 0.15
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(val)}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(${rgb}, 0.7)`
                      : '1px solid transparent',
                  }}>
                  <TgStar w={15} type="star" /> {val.toLocaleString('ru-RU')}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>
      {/* {url !== '/tma' && (
        <PaymentMethodSelector
          methods={methods}
          currencies={currencies}
          amount={amount}
          rates={rates}
          isLoading={!methods}
          selectedKey={selectedMethod?.key}
          onSelect={(method) => setSelectedMethod(method)}
          isTma={isTma}
        />
      )} */}

      <PaymentInvoiceButton
        amount={amount}
        rates={rates}
        setUser={(user) => setUser(user)}
      />
    </div>
  )
}

// Main component with Suspense boundary
export default function Payments() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 items-center pb-[100px]">
          Loading...
        </div>
      }>
      <PaymentsContent />
    </Suspense>
  )
}
