import { CurrencyEnum } from '@app/enums/currency.enum'
import { RatesInterface } from '@app/types/rates.interface'

export function fxUtil(
  value: number,
  from: CurrencyEnum,
  to: CurrencyEnum = CurrencyEnum.USD,
  ratesObj: RatesInterface,
): number {
  const rates = { ...ratesObj.rates, [ratesObj.base]: 1 }

  // Currencies whose `rate` is quoted as "units of the currency per 1 USD"
  // (Telegram Stars + crypto). Every other currency here follows the
  // standard FIAT convention: "USD value of 1 unit". Mixing the two
  // conventions without normalizing first is what produced wrong RUB
  // amounts.
  const QUANTITY_PER_USD = new Set<CurrencyEnum>([
    CurrencyEnum.XTR,
    CurrencyEnum.TON,
    CurrencyEnum.GRAM,
    CurrencyEnum.USDT,
    // + любые другие ваши CRYPTO/TELEGRAM ключи из currencies[].type
  ])

  const usdValueOfUnit = (code: CurrencyEnum): number =>
    QUANTITY_PER_USD.has(code) ? 1 / rates[code] : rates[code]

  const usdValueFrom = usdValueOfUnit(from)
  const usdValueTo = usdValueOfUnit(to)

  return Number(((value * usdValueFrom) / usdValueTo).toFixed(15))
}
