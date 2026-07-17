// adDisplayLock.ts

type LockState = { owner: string; expiresAt: number } | null

const DEFAULT_TTL_MS = 30_000 // страховка: если release не вызовется, лок сам протухнет

let lock: LockState = null

export const tryAcquireAdDisplayLock = (
  ownerId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): boolean => {
  const now = Date.now()
  // Лок свободен, либо истёк по TTL, либо уже наш — можно (пере)захватить
  if (lock === null || lock.expiresAt <= now || lock.owner === ownerId) {
    lock = { owner: ownerId, expiresAt: now + ttlMs }
    return true
  }
  return false
}

/** Продлевает TTL, если лок всё ещё наш — вызывать, пока реклама реально показывается. */
export const renewAdDisplayLock = (
  ownerId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): void => {
  if (lock?.owner === ownerId) {
    lock = { owner: ownerId, expiresAt: Date.now() + ttlMs }
  }
}

export const releaseAdDisplayLock = (ownerId: string): void => {
  if (lock?.owner === ownerId) {
    lock = null
  }
}

export const isAdDisplayLocked = (): boolean =>
  lock !== null && lock.expiresAt > Date.now()
