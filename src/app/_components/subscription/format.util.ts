/** Форматирует байты в читаемый вид: 0 Б, 12.4 МБ, 1.2 ГБ и т.д. */
export function formatBytes(bytes: number, digits = 1): string {
  if (!bytes || bytes <= 0) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  )
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : digits)} ${units[i]}`
}

/** "5 мин назад", "2 ч назад", "3 дн назад" — компактный относительный формат */
export function formatRelative(date?: Date | string | null): string {
  if (!date) return 'никогда'
  const d = new Date(date)
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 'только что'

  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`

  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs} ч назад`

  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} дн назад`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} мес назад`

  const years = Math.floor(months / 12)
  return `${years} г назад`
}

/** Плюрализация "1 день / 2 дня / 5 дней" */
export function pluralDays(n: number): string {
  return pluralize(n, 'день', 'дня', 'дней')
}

/** Плюрализация "1 час / 2 часа / 5 часов" */
export function pluralHours(n: number): string {
  return pluralize(n, 'час', 'часа', 'часов')
}

/** Плюрализация "1 минута / 2 минуты / 5 минут" */
export function pluralMinutes(n: number): string {
  return pluralize(n, 'минута', 'минуты', 'минут')
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

/**
 * Компактное представление оставшегося времени.
 * Пока остаётся больше суток — показываем дни ("Осталось 5 из 14 дней").
 * На последние сутки переключаемся на часы/минуты, чтобы человек видел,
 * что подписка вот-вот закончится, а не просто "0 дней".
 */
export function formatTimeLeft(msLeft: number): string {
  if (msLeft <= 0) return 'Истекла'

  const totalMinutes = Math.floor(msLeft / 60_000)
  if (totalMinutes < 60) {
    return `Осталось ${totalMinutes} ${pluralMinutes(totalMinutes)}`
  }

  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) {
    const mins = totalMinutes % 60
    return mins > 0
      ? `Осталось ${totalHours} ${pluralHours(totalHours)} ${mins} ${pluralMinutes(mins)}`
      : `Осталось ${totalHours} ${pluralHours(totalHours)}`
  }

  const days = Math.ceil(msLeft / 86_400_000)
  return `Осталось ${days} ${pluralDays(days)}`
}

export function formatPremiumTimeLeft(ms: number): string {
  if (ms <= 0) return ''
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)

  if (days > 0) return `${days} дн ${hours > 0 ? `${hours} ч` : ''}`.trim()
  if (hours > 0)
    return `${hours} ч ${minutes > 0 ? `${minutes} мин` : ''}`.trim()
  return `${minutes} мин`
}
