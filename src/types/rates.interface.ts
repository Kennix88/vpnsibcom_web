import { CurrencyTypeEnum } from '@app/enums/currency-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'

export interface RatesInterface {
  base: CurrencyEnum
  rates: Record<CurrencyEnum, number>
  types: Record<CurrencyEnum, CurrencyTypeEnum>
}
