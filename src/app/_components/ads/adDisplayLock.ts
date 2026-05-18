let currentAdOwner: string | null = null

export const tryAcquireAdDisplayLock = (ownerId: string): boolean => {
  if (currentAdOwner !== null) return false
  currentAdOwner = ownerId
  return true
}

export const releaseAdDisplayLock = (ownerId: string): void => {
  if (currentAdOwner === ownerId) {
    currentAdOwner = null
  }
}

export const isAdDisplayLocked = (): boolean => currentAdOwner !== null
