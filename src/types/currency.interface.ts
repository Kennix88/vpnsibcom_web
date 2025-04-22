import { CurrencyTypeEnum } from '@app/enums/currency-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'

export interface CurrencyInterface {
  key: CurrencyEnum
  name: string
  symbol: string
  type: CurrencyTypeEnum
  rate: number
}
