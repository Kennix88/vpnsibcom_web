import { CurrencyTypeEnum } from '@app/enums/currency-type.enum'
import { CurrencyEnum } from '@app/enums/currency.enum'
import { RatesInterface } from '@app/types/rates.interface'

// Валюты типов CRYPTO и TELEGRAM хранят rate как "кол-во единиц за 1 USD"
// (см. RatesService.updateCoinmarketcapRates / updateStarsRate: rate = 1/price).
// FIAT хранит rate как "USD-стоимость 1 единицы" (updateForexrateapiRates).
// Конвенция определяется типом валюты из БД, а не списком конкретных кодов —
// это и было причиной бага: раньше список был захардкожен и не включал
// часть крипто-валют (DOGS, CATS, NOT, PX, MAJOR, JETTON, CATI, HMSTR),
// для которых конвертация была бы такой же некорректной, как раньше для Stars.
const QUANTITY_PER_USD_TYPES = new Set<CurrencyTypeEnum>([
  CurrencyTypeEnum.CRYPTO,
  CurrencyTypeEnum.TELEGRAM,
])

export function fxUtil(
  value: number,
  from: CurrencyEnum,
  to: CurrencyEnum = CurrencyEnum.USD,
  ratesObj: RatesInterface,
): number {
  if (from == to) return value
  const rates = { ...ratesObj.rates, [ratesObj.base]: 1 }
  const types = ratesObj.types

  const usdValueOfUnit = (code: CurrencyEnum): number => {
    if (code === ratesObj.base) return 1

    const rate = rates[code]
    if (rate === undefined || rate === null) {
      throw new Error(`fxUtil: no rate for currency "${code}"`)
    }
    if (rate === 0) {
      // например XDR в текущих данных — делить нельзя, курс невалиден
      throw new Error(`fxUtil: rate for "${code}" is 0, cannot convert`)
    }

    const type = types[code]
    return QUANTITY_PER_USD_TYPES.has(type) ? 1 / rate : rate
  }

  const usdValueFrom = usdValueOfUnit(from)
  const usdValueTo = usdValueOfUnit(to)

  return Number(((value * usdValueFrom) / usdValueTo).toFixed(15))
}
