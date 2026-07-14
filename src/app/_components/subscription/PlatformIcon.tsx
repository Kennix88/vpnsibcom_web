'use client'

import {
  TbBrandAndroid,
  TbBrandApple,
  TbBrandWindows,
  TbDeviceDesktop,
  TbDeviceImacQuestion,
  TbDeviceIpad,
  TbDeviceLaptop,
  TbDeviceTv,
  TbDeviceUnknown,
} from 'react-icons/tb'

/**
 * Резолвит иконку под платформу устройства.
 * Строка platform приходит с бэкенда в произвольном виде
 * ("Android", "iOS", "iPadOS", "AndroidTV", "Apple TV", "Windows", "macOS", "Linux"),
 * поэтому матчим по подстроке в нижнем регистре, а не строгим enum.
 */
export function PlatformIcon({
  platform,
  size = 20,
}: {
  platform: string | null
  size?: number
}) {
  const p = (platform ?? '').toLowerCase()

  if (!p) return <TbDeviceUnknown size={size} />
  if (p.includes('ipad')) return <TbDeviceIpad size={size} />
  if (
    p.includes('androidtv') ||
    p.includes('android tv') ||
    p.includes('appletv') ||
    p.includes('apple tv')
  )
    return <TbDeviceTv size={size} />
  if (p.includes('android')) return <TbBrandAndroid size={size} />
  if (p.includes('ios') || p.includes('iphone'))
    return <TbBrandApple size={size} />
  if (p.includes('macos') || p.includes('mac os') || p.includes('osx'))
    return <TbDeviceImacQuestion size={size} />
  if (p.includes('windows')) return <TbBrandWindows size={size} />
  if (p.includes('linux')) return <TbDeviceDesktop size={size} />

  return <TbDeviceLaptop size={size} />
}

/** Человекочитаемое имя платформы для подписи под иконкой */
export function platformLabel(platform: string | null): string {
  const p = (platform ?? '').toLowerCase()
  if (!p) return 'Неизвестно'
  if (p.includes('ipad')) return 'iPad OS'
  if (p.includes('androidtv') || p.includes('android tv')) return 'Android TV'
  if (p.includes('appletv') || p.includes('apple tv')) return 'Apple TV'
  if (p.includes('android')) return 'Android'
  if (p.includes('ios') || p.includes('iphone')) return 'iOS'
  if (p.includes('macos') || p.includes('mac os') || p.includes('osx'))
    return 'macOS'
  if (p.includes('windows')) return 'Windows'
  if (p.includes('linux')) return 'Linux'
  return platform ?? 'Устройство'
}
