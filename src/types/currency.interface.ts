import { CurrencyEnum } from '@app/enums/currency.enum'

export interface CurrencyInterface {
  key: CurrencyEnum
  name: string
  symbol: string
  type: 'FIAT' | 'CRYPTO' | 'TELEGRAM'
  rate: number
}
