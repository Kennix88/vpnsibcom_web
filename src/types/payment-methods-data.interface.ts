import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'

export interface PaymentMethodsDataInterface {
  key: PaymentMethodEnum
  isActive: boolean
  name: string
  description?: string
  bridge?: string
  minStars: number
  maxStars: number
  commission: number
  isPlusCommission: boolean
  currency: CurrencyInterface
  category: PaymentMethodCategoryEnum
  isTonBlockchain: boolean
  tonSmartContractAddress?: string
}

export enum PaymentMethodCategoryEnum {
  MAIN = 'MAIN',
  RUS = 'RUS',
  CRYPTO = 'CRYPTO',
  RESERVE = 'RESERVE',
}

export interface CurrencyInterface {
  key: CurrencyEnum
  symbol: string
}
