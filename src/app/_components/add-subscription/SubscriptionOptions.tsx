'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { FaCircleInfo } from 'react-icons/fa6'
import TooltipWrapper from '../TooltipWrapper'

// Компонент: Опции подписки
export const SubscriptionOptions = ({
  isAutoRenewal,
  setIsAutoRenewal,
}: {
  isAutoRenewal: boolean
  setIsAutoRenewal: (val: boolean) => void
}) => {
  const t = useTranslations('billing.subscription.options')
  return (
    <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
      <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
        {t('title')}
      </div>

      <motion.div
        layout
        className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
        <motion.div className="flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono">
          <div className="flex gap-2 items-center">
            <TooltipWrapper prompt={t('info')} color="info" placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
            <div className="opacity-50">{t('autoRenewal')}:</div>
          </div>
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="autoRenewalCheckbox"
              checked={isAutoRenewal}
              onChange={() => setIsAutoRenewal(!isAutoRenewal)}
              className="sr-only peer"
            />
            <label
              htmlFor="autoRenewalCheckbox"
              className="flex items-center justify-center w-5 h-5 bg-transparent border border-[var(--on-surface)]/50 rounded-md cursor-pointer peer-focus:border-[var(--primary)] peer-focus:ring-2 peer-focus:ring-[var(--primary)]/20 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
              {isAutoRenewal && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[var(--on-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </label>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
