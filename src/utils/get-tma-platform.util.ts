/**
 * Возвращает платформу из Telegram WebApp если запущено в TMA,
 * иначе null. Безопасно для SSR.
 */
export function getTmaPlatform(): string | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp?.platform ?? null
}

export function isInTma(): boolean {
  return getTmaPlatform() !== null
}
