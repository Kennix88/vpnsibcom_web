import { PlatformEnum } from '@app/app/_components/subscription/types/platform.enum'

export function detectPlatform(): PlatformEnum {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // SSR
    return PlatformEnum.ANDROID
  }

  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('android')) {
    if (userAgent.includes('tv')) {
      return PlatformEnum.ANDROID_TV
    }
    return PlatformEnum.ANDROID
  }

  if (userAgent.includes('iphone')) return PlatformEnum.IOS

  if (
    userAgent.includes('ipad') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    // iPadOS иногда маскируется под Mac
    return PlatformEnum.IPADOS
  }

  if (userAgent.includes('mac')) {
    return PlatformEnum.MACOS
  }

  if (userAgent.includes('apple tv')) return PlatformEnum.APPLE_TV

  if (userAgent.includes('win')) return PlatformEnum.WINDOWS

  if (userAgent.includes('linux')) return PlatformEnum.LINUX

  return PlatformEnum.ANDROID
}
