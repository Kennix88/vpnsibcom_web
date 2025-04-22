export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '')

  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16)
    const g = parseInt(cleaned[1] + cleaned[1], 16)
    const b = parseInt(cleaned[2] + cleaned[2], 16)
    return { r, g, b }
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r, g, b }
  }

  return null
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (val: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(val)))
    return clamped.toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
