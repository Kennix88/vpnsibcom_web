'use client'

import TgStar from '@app/app/_components/TgStar'
import { authApiClient } from '@app/core/authApiClient'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { useCurrencyStore } from '@app/store/currency.store'
import { useUserStore } from '@app/store/user.store'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FaCaretDown } from 'react-icons/fa6'
import { toast } from 'react-toastify'

export default function CurrencySwitcher() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const { currencies } = useCurrencyStore()
  const { user, setUser } = useUserStore()

  const selected = currencies.find((c) => c.key === user?.currencyCode)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = async (currencyKey: CurrencyEnum) => {
    try {
      const updated = await authApiClient.updateCurrencyUser(currencyKey)
      setUser(updated)
      setIsOpen(false)
    } catch {
      toast.error('Error during the update')
    }
  }

  if (!selected) return null

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-sm text-left ">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-between w-full px-3 py-2 rounded-md border font-medium font-mono transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer flex-row gap-1 items-center justify-between"
        style={{
          backgroundColor: 'var(--surface-container)',
          color: 'var(--on-surface)',
          borderColor: 'var(--outline)',
        }}>
        <div className={'flex flex-row gap-1 items-center'}>
          <span className="font-mono font-bold">{selected.key}</span> -
          <span className="opacity-80">{selected.symbol}</span>
        </div>
        <FaCaretDown />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-full min-w-[160px] bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface)] rounded-md shadow-xl z-50 overflow-auto max-h-60 divide-y divide-[var(--outline)]">
            {currencies.map((currency) => (
              <li key={currency.key}>
                <button
                  onClick={() => handleChange(currency.key)}
                  className="flex w-full items-center gap-1 px-4 py-2 text-sm text-left transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
                  style={{
                    backgroundColor:
                      currency.key === selected?.key
                        ? 'var(--primary-container)'
                        : 'var(--surface-container)',
                    color: 'var(--on-surface)',
                  }}>
                  <span className="font-mono font-bold">{currency.key}</span>-
                  {currency.key == CurrencyEnum.XCH && (
                    <TgStar type={'gold'} w={15} />
                  )}
                  <span className="opacity-80">{currency.symbol}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
