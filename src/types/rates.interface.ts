import { CurrencyEnum } from '@app/enums/currency.enum'

export interface RatesInterface {
  base: CurrencyEnum
  rates: {
    [K in CurrencyEnum]: number
  }
}
