/**
 * Utility for formatting bytes into human-readable string
 * @param bytes - Number of bytes to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string (e.g. 10 B, 14.3 KB, 1.32 GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  // Calculate the appropriate unit
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

  // Format the number with the specified decimals
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))

  return `${formattedValue} ${sizes[i]}`
}

/**
 * Utility for formatting bytes into human-readable string with localization support
 * @param bytes - Number of bytes to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @param t - Translation function that accepts a key
 * @returns Formatted string with localized units
 */
export function formatBytesLocalized(
  bytes: number,
  decimals: number = 2,
  t: (key: string) => string,
): string {
  if (bytes === 0) return `0 ${t('units.bytes')}`

  const k = 1024
  const sizeKeys = [
    'units.bytes',
    'units.kilobytes',
    'units.megabytes',
    'units.gigabytes',
    'units.terabytes',
    'units.petabytes',
    'units.exabytes',
    'units.zettabytes',
    'units.yottabytes',
  ]

  // Calculate the appropriate unit
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

  // Format the number with the specified decimals
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))

  return `${formattedValue} ${t(sizeKeys[i])}`
}
