import { default as Currency } from '@app/app/_components/Currency'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { ReactNode } from 'react'
import {
  CardsMark,
  CryptobotMark,
  HeleketMark,
  SbpMark,
  XrocketMark,
} from './payment-method-brand-marks'

/**
 * Категории для группировки способов оплаты в списке.
 * Должно совпадать с `PaymentMethodCategoryEnum` на бэкенде — держим синхронно
 * вручную, т.к. это чисто UI-группировка (заголовки секций).
 */
export enum PaymentMethodCategoryEnum {
  MAIN = 'MAIN',
  RUS = 'RUS',
  CRYPTO = 'CRYPTO',
  RESERVE = 'RESERVE',
}

export const paymentMethodCategoryLabels: Record<
  PaymentMethodCategoryEnum,
  string
> = {
  [PaymentMethodCategoryEnum.MAIN]: 'Основные',
  [PaymentMethodCategoryEnum.RUS]: 'Российские',
  [PaymentMethodCategoryEnum.CRYPTO]: 'Крипто',
  [PaymentMethodCategoryEnum.RESERVE]: 'Резерв',
}

export interface PaymentMethodPreset {
  /** CSS-переменная цвета акцента, например 'var(--tg-star)' */
  colorVar: string
  /** RGB-триплет без пробелов для rgba(), например '255,208,0' */
  glowRgb: string
  icon: ReactNode
  label: string
  sublabel?: string
  badge?: string
  /** Категория по умолчанию — на случай, если бэкенд её не прислал */
  defaultCategory: PaymentMethodCategoryEnum
  /** true — иконка временная (буква-заглушка), нужно заменить на реальную */
  isPlaceholderIcon?: boolean
}

export const paymentMethodPresets: Record<
  PaymentMethodEnum,
  PaymentMethodPreset
> = {
  [PaymentMethodEnum.STARS]: {
    colorVar: 'var(--tg-star)',
    glowRgb: '255,208,0',
    icon: <Currency type="tg-star" w={20} />,
    label: 'Stars',
    sublabel: 'Telegram',
    defaultCategory: PaymentMethodCategoryEnum.MAIN,
  },

  [PaymentMethodEnum.TON_TON]: {
    colorVar: 'var(--gram)',
    glowRgb: '48,161,245',
    icon: <Currency type="gram" w={20} />,
    label: 'GRAM',
    sublabel: 'Ton Open Network',
    badge: 'ex-TON',
    defaultCategory: PaymentMethodCategoryEnum.MAIN,
  },

  [PaymentMethodEnum.USDT_TON]: {
    colorVar: 'var(--usdt)',
    glowRgb: '80,175,149', // из --usdt: #50af95
    // ⚠️ Предполагаю, что у <Currency /> можно завести type="usdt" по аналогии
    // с "gram" (та же механика подстановки токена/сети). Если типа ещё нет —
    // добавь его в компонент Currency, здесь только используем.
    icon: <Currency type="usdt" w={20} />,
    label: 'USDT',
    sublabel: 'TON Network',
    defaultCategory: PaymentMethodCategoryEnum.CRYPTO,
  },

  [PaymentMethodEnum.AURAPAY_SBP]: {
    colorVar: 'var(--sbp)',
    glowRgb: '91,87,162',
    icon: <SbpMark size={20} />,
    label: 'СБП',
    sublabel: 'AuraPay',
    defaultCategory: PaymentMethodCategoryEnum.RUS,
  },

  [PaymentMethodEnum.AURAPAY_CARD]: {
    colorVar: 'var(--mir-card)',
    glowRgb: '77,180,94',
    icon: <CardsMark size={18} />,
    label: 'Карта РФ',
    sublabel: 'AuraPay',
    defaultCategory: PaymentMethodCategoryEnum.RUS,
  },

  // Platega — те же самые методы (СБП / карта), просто другой провайдер-эквайер,
  // поэтому стиль/иконка идентичны AuraPay — отличается только sublabel
  // и категория по умолчанию (резервный рельс на случай проблем с основным).
  [PaymentMethodEnum.PLATEGA_SBP]: {
    colorVar: 'var(--sbp)',
    glowRgb: '91,87,162',
    icon: <SbpMark size={20} />,
    label: 'СБП',
    sublabel: 'Platega',
    defaultCategory: PaymentMethodCategoryEnum.RESERVE,
  },

  [PaymentMethodEnum.PLATEGA_CARD]: {
    colorVar: 'var(--mir-card)',
    glowRgb: '77,180,94',
    icon: <CardsMark size={18} />,
    label: 'Карта РФ',
    sublabel: 'Platega',
    defaultCategory: PaymentMethodCategoryEnum.RESERVE,
  },

  // ── Крипто-эквайринг ────────────────────────────────────────────
  // Своих иконок пока нет — PlaceholderMark. Цвета взяты приблизительно
  // со скринов логов, поправь после добавления реальных SVG/PNG.
  [PaymentMethodEnum.HELEKET]: {
    colorVar: 'var(--heleket)',
    glowRgb: '240,65,58', // из --heleket: #f0413a
    icon: <HeleketMark size={20} />,
    label: 'Heleket',
    sublabel: 'Крипто-эквайринг',
    defaultCategory: PaymentMethodCategoryEnum.CRYPTO,
    isPlaceholderIcon: true,
  },

  [PaymentMethodEnum.CRYPTOBOT]: {
    colorVar: 'var(--cryptobot)',
    glowRgb: '43,182,163', // из --cryptobot: #2bb6a3
    icon: <CryptobotMark size={20} />,
    label: 'Crypto Bot',
    sublabel: '@CryptoBot',
    defaultCategory: PaymentMethodCategoryEnum.CRYPTO,
    isPlaceholderIcon: true,
  },

  [PaymentMethodEnum.XROCKET]: {
    colorVar: 'var(--xrocket)',
    glowRgb: '43,143,224', // из --xrocket: #2b8fe0
    icon: <XrocketMark size={20} />,
    label: 'xRocket',
    sublabel: 'xRocket Pay',
    defaultCategory: PaymentMethodCategoryEnum.CRYPTO,
    isPlaceholderIcon: true,
  },
}

/** Хелпер-геттер, чтобы не тащить весь объект туда, где нужен один метод. */
export function getPaymentMethodPreset(
  method: PaymentMethodEnum,
): PaymentMethodPreset {
  return paymentMethodPresets[method]
}

/*
Пример использования в PaymentInvoiceButton (вместо текущего жёстко зашитого
списка <PayButton />): рендерим методы, которые реально пришли с бэкенда,
группируя по category и учитывая isActive/лимиты.

const methods: PaymentMethodsDataInterface[] = await authApiClient.getPaymentMethods()

const byCategory = methods.reduce<Record<PaymentMethodCategoryEnum, PaymentMethodsDataInterface[]>>(
  (acc, m) => {
    const category = m.category ?? getPaymentMethodPreset(m.key).defaultCategory
    ;(acc[category] ??= []).push(m)
    return acc
  },
  {} as Record<PaymentMethodCategoryEnum, PaymentMethodsDataInterface[]>,
)

{Object.entries(byCategory).map(([category, list]) => (
  <div key={category} className="flex flex-col gap-2">
    <SectionLabel>{paymentMethodCategoryLabels[category as PaymentMethodCategoryEnum]}</SectionLabel>
    {list.map((m) => {
      const preset = getPaymentMethodPreset(m.key)
      const outOfLimits = amount < m.minStars || amount > m.maxStars
      return (
        <PayButton
          key={m.key}
          onClick={() => handleClick(m.key)}
          disabled={!m.isActive || outOfLimits || isLoading}
          isLoading={loadingMethod === m.key}
          isDone={doneMethod === m.key}
          colorVar={preset.colorVar}
          glowRgb={preset.glowRgb}
          icon={preset.icon}
          label={preset.label}
          sublabel={preset.sublabel}
          badge={preset.badge}
          value={formatValueFor(m, amount, rates)} // пересчёт в валюту метода + комиссия, если isPlusCommission
        />
      )
    })}
  </div>
))}
*/
