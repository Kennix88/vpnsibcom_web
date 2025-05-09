import { Locale } from 'date-fns'
import {
  af, ar, arDZ, arEG, arMA, arSA, arTN, az, be, beTarask, bg, bn, bs, ca, ckb, cs, cy, da, de, deAT,
  el, enAU, enCA, enGB, enIE, enIN, enNZ, enUS, enZA, eo, es, et, eu, faIR, fi, fr, frCA, frCH, fy,
  gd, gl, gu, he, hi, hr, ht, hu, hy, id, is, it, itCH, ja, jaHira, ka, kk, km, kn, ko, lb, lt, lv,
  mk, mn, ms, mt, nb, nl, nlBE, nn, oc, pl, pt, ptBR, ro, ru, se, sk, sl, sq, sr, srLatn, sv, ta,
  te, th, tr, ug, uk, uz, uzCyrl, vi, zhCN, zhHK, zhTW
} from 'date-fns/locale'

/**
 * Map of locale strings to date-fns locale objects
 * This utility helps with date-fns localization based on next-intl locale
 */
const localeMap: Record<string, Locale> = {
  // Main locales
  'af': af,
  'ar': ar,
  'az': az,
  'be': be,
  'bg': bg,
  'bn': bn,
  'bs': bs,
  'ca': ca,
  'ckb': ckb,
  'cs': cs,
  'cy': cy,
  'da': da,
  'de': de,
  'el': el,
  'en': enUS,
  'eo': eo,
  'es': es,
  'et': et,
  'eu': eu,
  'fa': faIR,
  'fi': fi,
  'fr': fr,
  'fy': fy,
  'gd': gd,
  'gl': gl,
  'gu': gu,
  'he': he,
  'hi': hi,
  'hr': hr,
  'ht': ht,
  'hu': hu,
  'hy': hy,
  'id': id,
  'is': is,
  'it': it,
  'ja': ja,
  'ka': ka,
  'kk': kk,
  'km': km,
  'kn': kn,
  'ko': ko,
  'lb': lb,
  'lt': lt,
  'lv': lv,
  'mk': mk,
  'mn': mn,
  'ms': ms,
  'mt': mt,
  'nb': nb,
  'nl': nl,
  'nn': nn,
  'oc': oc,
  'pl': pl,
  'pt': pt,
  'ro': ro,
  'ru': ru,
  'se': se,
  'sk': sk,
  'sl': sl,
  'sq': sq,
  'sr': sr,
  'sv': sv,
  'ta': ta,
  'te': te,
  'th': th,
  'tr': tr,
  'ug': ug,
  'uk': uk,
  'uz': uz,
  'vi': vi,
  'zh': zhCN,
  
  // Variants
  'ar-DZ': arDZ,
  'ar-EG': arEG,
  'ar-MA': arMA,
  'ar-SA': arSA,
  'ar-TN': arTN,
  'be-tarask': beTarask,
  'de-AT': deAT,
  'en-AU': enAU,
  'en-CA': enCA,
  'en-GB': enGB,
  'en-IE': enIE,
  'en-IN': enIN,
  'en-NZ': enNZ,
  'en-US': enUS,
  'en-ZA': enZA,
  'fa-IR': faIR,
  'fr-CA': frCA,
  'fr-CH': frCH,
  'it-CH': itCH,
  'ja-Hira': jaHira,
  'nl-BE': nlBE,
  'pt-BR': ptBR,
  'sr-Latn': srLatn,
  'uz-Cyrl': uzCyrl,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
}

/**
 * Gets date-fns locale object from locale string
 * @param locale - Locale string (e.g. 'ru', 'en', 'en-US')
 * @returns date-fns locale object or default locale (enUS) if not found
 */
export const getDateFnsLocale = (locale?: string): Locale => {
  if (!locale) return enUS
  
  // Try direct match
  if (locale in localeMap) {
    return localeMap[locale]
  }
  
  // Try base language match (e.g. 'en-US' -> 'en')
  const baseLocale = locale.split('-')[0]
  if (baseLocale in localeMap) {
    return localeMap[baseLocale]
  }
  
  // Default to English
  return enUS
}