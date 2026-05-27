// 'use client'

// import TgStar from '@app/app/_components/Currency'
// import Loader from '@app/app/_components/Loader'
// import { PaymentMethodIcons } from '@app/app/_components/payments/payment-method-icons'
// import { TonWalletConnect } from '@app/app/_components/ton/TonWalletConnect'
// import TooltipWrapper from '@app/app/_components/TooltipWrapper'
// import { config } from '@app/config/client'
// import { CurrencyEnum } from '@app/enums/currency.enum'
// import { PaymentMethodTypeEnum } from '@app/enums/payment-method-type.enum'
// import { PaymentSystemEnum } from '@app/enums/payment-system.enum'
// import { useUserStore } from '@app/store/user.store'
// import { CurrencyInterface } from '@app/types/currency.interface'
// import { PaymentMethodsDataInterface } from '@app/types/payment-methods-data.interface'
// import { RatesInterface } from '@app/types/rates.interface'
// import { fxUtil } from '@app/utils/fx.util'
// import { useTonWallet } from '@tonconnect/ui-react'
// import { AnimatePresence, motion } from 'framer-motion'
// import { CheckCircle2, Info } from 'lucide-react'
// import Image from 'next/image'
// import Link from 'next/link'
// import { useEffect, useMemo, useState } from 'react'
// import { useTranslations } from 'use-intl'

// type Props = {
//   methods?: PaymentMethodsDataInterface[]
//   currencies: CurrencyInterface[]
//   amount: number
//   rates: RatesInterface
//   isLoading?: boolean
//   selectedKey?: string
//   onSelect: (method: PaymentMethodsDataInterface) => void
//   isTma?: boolean
// }

// /* ─── System icon map — avoids a giant if/else ────────────────────── */
// const SYSTEM_ICONS: Partial<Record<PaymentSystemEnum, string>> = {
//   [PaymentSystemEnum.TELEGRAM]: '/icons/telegram.svg',
//   [PaymentSystemEnum.TON_BLOCKCHAIN]: '/icons/TON.svg',
//   [PaymentSystemEnum.PAYEER]: '/icons/payeer.svg',
//   [PaymentSystemEnum.VOLET]: '/icons/volet.svg',
//   [PaymentSystemEnum.WATA]: '/icons/wata.svg',
//   [PaymentSystemEnum.CRYPTOMUS]: '/icons/cryptomus.svg',
//   [PaymentSystemEnum.PAYPALYCH]: '/icons/paypalych.svg',
//   [PaymentSystemEnum.SKINSBACK]: '/icons/skinsback.svg',
//   [PaymentSystemEnum.TOME]: '/icons/tome.svg',
// }

// /* ─── Filter pill ─────────────────────────────────────────────────── */
// function FilterPill({
//   label,
//   active,
//   onClick,
// }: {
//   label: string
//   active: boolean
//   onClick: () => void
// }) {
//   return (
//     <motion.button
//       onClick={onClick}
//       whileHover={{ scale: 1.04 }}
//       whileTap={{ scale: 0.94 }}
//       className="relative px-3 py-1.5 rounded-full text-xs font-mono font-bold cursor-pointer"
//       style={{
//         background: active
//           ? 'rgba(195,166,255,0.18)'
//           : 'rgba(255,255,255,0.05)',
//         color: active ? 'var(--primary)' : 'var(--on-surface)',
//         border: active
//           ? '1px solid rgba(195,166,255,0.4)'
//           : '1px solid rgba(255,255,255,0.07)',
//         transition: 'all 150ms ease',
//         opacity: active ? 1 : 0.65,
//       }}>
//       {label}
//       {active && (
//         <motion.span
//           layoutId="pill-active"
//           className="absolute inset-0 rounded-full pointer-events-none"
//           style={{ boxShadow: '0 0 10px rgba(195,166,255,0.18)' }}
//         />
//       )}
//     </motion.button>
//   )
// }

// /* ─── Method card ─────────────────────────────────────────────────── */
// interface MethodCardProps {
//   method: PaymentMethodsDataInterface
//   currency: CurrencyInterface
//   convertedAmount: number
//   disabled: boolean
//   isSelected: boolean
//   onSelect: () => void
//   t: ReturnType<typeof useTranslations>
// }

// function MethodCard({
//   method,
//   currency,
//   convertedAmount,
//   disabled,
//   isSelected,
//   onSelect,
//   t,
// }: MethodCardProps) {
//   const systemIcon = SYSTEM_ICONS[method.system as PaymentSystemEnum]
//   const hasCommission = method.commission * 100 - 100 > 0
//   const currencyLabel =
//     currency.key !== currency.symbol
//       ? `${currency.key}-${currency.symbol}`
//       : currency.symbol

//   const card = (
//     <motion.button
//       disabled={disabled}
//       whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
//       whileTap={disabled ? {} : { scale: 0.975 }}
//       onClick={onSelect}
//       className="relative flex flex-col gap-2 p-3 rounded-2xl text-left w-full"
//       style={{
//         background: isSelected
//           ? 'rgba(55,227,162,0.09)'
//           : 'rgba(255,255,255,0.04)',
//         border: isSelected
//           ? '1px solid rgba(55,227,162,0.4)'
//           : '1px solid rgba(255,255,255,0.07)',
//         boxShadow: isSelected ? '0 0 18px rgba(55,227,162,0.1)' : 'none',
//         opacity: disabled ? 0.45 : 1,
//         cursor: disabled ? 'not-allowed' : 'pointer',
//         transition: 'all 160ms ease',
//       }}>
//       {/* Top row: icon + name + currency badge */}
//       <div className="flex items-center gap-2.5 w-full">
//         <Image
//           src={PaymentMethodIcons[method.key] || '/icons/cards.svg'}
//           alt={method.name}
//           width={36}
//           height={36}
//           className="rounded-lg shrink-0"
//         />

//         <div className="flex flex-col min-w-0 flex-1">
//           <span
//             className="text-sm font-bold font-mono truncate"
//             style={{ color: 'var(--on-surface)' }}>
//             {method.name}
//           </span>

//           {/* System label */}
//           {systemIcon && (
//             <span
//               className="flex items-center gap-1 text-[11px] font-mono"
//               style={{ color: 'var(--on-surface)', opacity: 0.45 }}>
//               <Image
//                 src={systemIcon}
//                 alt={method.system}
//                 width={12}
//                 height={12}
//               />
//               {method.system.replace(/_/g, ' ').toLowerCase()}
//             </span>
//           )}
//         </div>

//         {/* Currency pill */}
//         <span
//           className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shrink-0"
//           style={{
//             background: 'var(--tertiary-container)',
//             color: 'var(--on-tertiary-container)',
//           }}>
//           {currencyLabel}
//         </span>
//       </div>

//       {/* Commission row */}
//       {hasCommission && (
//         <div
//           className="text-[11px] font-mono"
//           style={{ color: 'var(--error)', opacity: 0.85 }}>
//           {t('commission')}: +{(method.commission * 100 - 100).toFixed(2)}%
//         </div>
//       )}

//       {/* Selected checkmark */}
//       <AnimatePresence>
//         {isSelected && (
//           <motion.span
//             key="check"
//             initial={{ scale: 0, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             exit={{ scale: 0, opacity: 0 }}
//             transition={{ type: 'spring', stiffness: 500 }}
//             className="absolute -top-2.5 -right-2.5">
//             <CheckCircle2
//               size={20}
//               style={{
//                 color: 'var(--success)',
//                 fill: 'var(--success-container)',
//               }}
//             />
//           </motion.span>
//         )}
//       </AnimatePresence>
//     </motion.button>
//   )

//   return disabled ? (
//     <TooltipWrapper
//       prompt={t('limitMessage', {
//         min: method.minAmount,
//         max: method.maxAmount,
//         symbol: currency.symbol,
//         convertedAmount: convertedAmount.toFixed(2),
//       })}
//       placement="top">
//       {card}
//     </TooltipWrapper>
//   ) : (
//     card
//   )
// }

// /* ─── Main component ──────────────────────────────────────────────── */
// export const PaymentMethodSelector = ({
//   methods = [],
//   currencies,
//   amount,
//   rates,
//   isLoading,
//   selectedKey,
//   onSelect,
//   isTma = false,
// }: Props) => {
//   const t = useTranslations('billing.payment')
//   const [mounted, setMounted] = useState(false)
//   useEffect(() => setMounted(true), [])
//   const [type, setType] = useState<PaymentMethodTypeEnum | 'ALL'>('ALL')
//   const { user } = useUserStore()
//   const wallet = useTonWallet()

//   const methodsWithLimits = useMemo(() => {
//     return methods.map((method) => {
//       const convertedAmount = fxUtil(
//         amount,
//         CurrencyEnum.XTR,
//         method.currency.key,
//         rates,
//       )
//       const disabled =
//         convertedAmount < method.minAmount || convertedAmount > method.maxAmount
//       return { method, disabled, convertedAmount }
//     })
//   }, [methods, amount, rates])

//   const filterButtons: { name: string; type: PaymentMethodTypeEnum | 'ALL' }[] =
//     [
//       { name: t('sort.all'), type: 'ALL' },
//       { name: t('sort.crypto'), type: PaymentMethodTypeEnum.CRYPTOCURRENCY },
//       { name: t('sort.card'), type: PaymentMethodTypeEnum.CARD },
//       { name: t('sort.sbp'), type: PaymentMethodTypeEnum.SBP },
//       { name: t('sort.wallets'), type: PaymentMethodTypeEnum.WALLET },
//       { name: t('sort.skins'), type: PaymentMethodTypeEnum.SKINS },
//     ]

//   if (!mounted || isLoading || !user) {
//     return (
//       <div className="flex justify-center items-center h-32">
//         <Loader />
//       </div>
//     )
//   }

//   const visible = methodsWithLimits
//     .sort((a, b) => a.method.system.localeCompare(b.method.system))
//     .sort((a, b) => {
//       if (a.method.type === PaymentMethodTypeEnum.STARS) return -2
//       if (b.method.type === PaymentMethodTypeEnum.STARS) return 2
//       if (a.method.type === PaymentMethodTypeEnum.CRYPTOCURRENCY) return -1
//       if (b.method.type === PaymentMethodTypeEnum.CRYPTOCURRENCY) return 1
//       return a.method.type.localeCompare(b.method.type)
//     })
//     .filter((el) =>
//       !wallet?.account.address
//         ? el.method.system !== PaymentSystemEnum.TON_BLOCKCHAIN
//         : true,
//     )
//     .filter((el) => type === 'ALL' || el.method.type === type)

//   return (
//     <div className="flex flex-col gap-3 w-full">
//       {/* Label */}
//       <div className="px-1 flex items-center gap-2">
//         <span
//           className="block w-1 h-1 rounded-full"
//           style={{ background: 'var(--primary)' }}
//         />
//         <span
//           className="text-xs font-mono"
//           style={{ color: 'var(--on-background)', opacity: 0.42 }}>
//           {t('method')}
//         </span>
//       </div>

//       {/* Glass wrapper */}
//       <div
//         className="rounded-2xl overflow-hidden flex flex-col gap-0"
//         style={{
//           background: 'var(--glass-bg)',
//           backdropFilter: 'blur(var(--glass-blur))',
//           WebkitBackdropFilter: 'blur(var(--glass-blur))',
//           border: '1px solid rgba(255,255,255,0.07)',
//           boxShadow: '0 6px 28px rgba(0,0,0,0.28)',
//         }}>
//         {/* Filter pills */}
//         {!isTma && (
//           <div
//             className="flex flex-wrap gap-2 px-4 py-3"
//             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
//             {filterButtons.map((f) => (
//               <FilterPill
//                 key={f.type}
//                 label={f.name}
//                 active={type === f.type}
//                 onClick={() => setType(f.type)}
//               />
//             ))}
//           </div>
//         )}

//         {/* Split info banner */}
//         <div
//           className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap"
//           style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
//           <div className="flex items-center gap-2">
//             <Info
//               size={13}
//               aria-hidden
//               style={{ color: 'var(--primary)', opacity: 0.7 }}
//             />
//             <span
//               className="text-xs font-mono"
//               style={{ color: 'var(--on-surface)', opacity: 0.55 }}>
//               {t('split')}
//             </span>
//           </div>
//           <Link
//             href={config.SPLIT_TG_REF_URL}
//             target="_blank"
//             className="flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-xl"
//             style={{
//               background: 'rgba(195,166,255,0.09)',
//               color: 'var(--primary)',
//               border: '1px solid rgba(195,166,255,0.2)',
//             }}>
//             {t('splitBay')} <TgStar type="tg-star" w={13} />
//           </Link>
//         </div>

//         {/* Method cards */}
//         <motion.div
//           className="grid grid-cols-2 gap-3 p-3"
//           initial="hidden"
//           animate="visible"
//           variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
//           {visible.map(({ method, disabled, convertedAmount }, i) => {
//             const currency = currencies.find(
//               (c) => c.key === method.currency.key,
//             )
//             if (!currency) return null
//             return (
//               <motion.div
//                 key={method.key}
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { duration: 0.28, ease: [0.2, 0, 0, 1] },
//                   },
//                 }}>
//                 <MethodCard
//                   method={method}
//                   currency={currency}
//                   convertedAmount={convertedAmount}
//                   disabled={disabled}
//                   isSelected={method.key === selectedKey}
//                   onSelect={() => onSelect(method)}
//                   t={t}
//                 />
//               </motion.div>
//             )
//           })}
//         </motion.div>

//         {/* Wallet connect prompt */}
//         {!isTma && !wallet?.account.address && (
//           <div
//             className="flex flex-col gap-2 p-4"
//             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//             <p
//               className="text-xs font-mono"
//               style={{ color: 'var(--on-surface)', opacity: 0.55 }}>
//               {t('walletInfo')}
//             </p>
//             <TonWalletConnect />
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
