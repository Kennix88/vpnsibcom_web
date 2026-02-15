'use client'

import TgStar from '@app/app/_components/Currency'
import PaymentInvoiceButton from '@app/app/_components/payments/PaymentInvoiceButton'
import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { BonusesInterface } from '@app/types/bonuses.interface'
import addSuffixToNumberUtil from '@app/utils/add-suffix-to-number.util'
import { fxUtil } from '@app/utils/fx.util'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Suspense, useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

const quickAmounts = [
  50, 100, 500, 700, 1000, 2000, 3000, 5000, 10000, 25000, 50000,
]

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
  const [bonuses, setBonuses] = useState<BonusesInterface>()

  useEffect(() => {
    const getBonuses = async () => {
      try {
        const bonuses = await authApiClient.getPaymentBonuses()
        setBonuses(bonuses)
      } catch {
        // toast.error('Error updating data')
      }
    }
    getBonuses()
  }, [setUser, user])

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

  if (!currency || !bonuses) return null

  const bonusStarsAmount =
    amount < 250
      ? 0
      : amount >= 250 && amount < 500
        ? amount * bonuses!.bonusPayment250
        : amount >= 500 && amount < 1000
          ? amount * bonuses!.bonusPayment500
          : amount >= 1000 && amount < 2500
            ? amount * bonuses!.bonusPayment1000
            : amount >= 2500 && amount < 5000
              ? amount * bonuses!.bonusPayment2500
              : amount >= 5000 && amount < 10000
                ? amount * bonuses!.bonusPayment5000
                : amount >= 10000 && amount < 20000
                  ? amount * bonuses!.bonusPayment10000
                  : amount >= 20000 && amount < 50000
                    ? amount * bonuses!.bonusPayment20000
                    : amount * bonuses!.bonusPayment50000

  return (
    <div className={'flex flex-col gap-4 items-center pb-[100px]'}>
      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
          {t('sum')}
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-col gap-4 py-5 px-4 w-full shadow-md">
          <div className="flex flex-row gap-2 items-center justify-center w-full relative">
            <TgStar w={18} type="star" />
            <input
              type="number"
              placeholder={t('enterSum')}
              min={user.minPayStars}
              max={5000000}
              value={amount || ''}
              onChange={(e) =>
                setAmount(
                  e.target.value
                    ? parseInt(e.target.value) > 5000000
                      ? 5000000
                      : parseInt(e.target.value) < user.minPayStars
                        ? user.minPayStars
                        : parseInt(e.target.value)
                    : user.minPayStars,
                )
              }
              className="border grow max-w-[250px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 font-bold bg-transparent focus:border-[var(--primary)] focus:outline-none"
            />
            {bonusStarsAmount > 0 && (
              <div className="absolute top-[-10px] right-[-7px] text-xs bg-[var(--secondary-container)] text-[var(--on-secondary-container)] px-1 py-0.1 rounded-md">
                🎁+{bonusStarsAmount.toFixed(0)}
              </div>
            )}
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

          <div className="flex flex-row flex-wrap gap-3 items-center w-full">
            {quickAmounts.map((val) => {
              const isActive = amount === val
              const rgb = getButtonColor(val)
              const bgOpacity = isActive ? 0.3 : 0.15

              const bonusStars =
                val < 250
                  ? 0
                  : val >= 250 && val < 500
                    ? val * bonuses!.bonusPayment250
                    : val >= 500 && val < 1000
                      ? val * bonuses!.bonusPayment500
                      : val >= 1000 && val < 2500
                        ? val * bonuses!.bonusPayment1000
                        : val >= 2500 && val < 5000
                          ? val * bonuses!.bonusPayment2500
                          : val >= 5000 && val < 10000
                            ? val * bonuses!.bonusPayment5000
                            : val >= 10000 && val < 20000
                              ? val * bonuses!.bonusPayment10000
                              : val >= 20000 && val < 50000
                                ? val * bonuses!.bonusPayment20000
                                : val * bonuses!.bonusPayment50000

              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAmount(val)}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-2.5 rounded-md text-sm font-bold font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] relative',
                  )}
                  style={{
                    backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(${rgb}, 0.7)`
                      : '1px solid transparent',
                  }}>
                  <TgStar w={18} type="star" /> {val}{' '}
                  {bonusStars > 0 && (
                    <div className="absolute top-[-7px] right-[-7px] text-xs bg-[var(--secondary-container)] text-[var(--on-secondary-container)] px-1 py-0.1 rounded-md">
                      🎁+{bonusStars.toFixed(0)}
                    </div>
                  )}
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
