import { CurrencyTypeEnum } from '@app/enums/currency-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { PaymentMethodTypeEnum } from '@app/enums/payment-method-type.enum'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PaymentSystemEnum } from '@app/enums/payment-system.enum'

export interface PaymentMethodsDataInterface {
  key: PaymentMethodEnum
  name: string
  isTonBlockchain: boolean
  tonSmartContractAddress?: string
  minAmount: number
  maxAmount: number
  commission: number
  isPlusCommission: boolean
  type: PaymentMethodTypeEnum
  system: PaymentSystemEnum
  currency: CurrencyInterface
}

export interface CurrencyInterface {
  key: CurrencyEnum
  name: string
  symbol: string
  type: CurrencyTypeEnum
  rate: number
}
