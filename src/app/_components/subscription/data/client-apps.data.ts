import { ClientAppInterface } from '../types/client-app.interface'
import { ClientAppsEnum } from '../types/client-apps.enum'
import { IconTypeEnum } from '../types/icon-type.enum'
import { PlatformEnum } from '../types/platform.enum'

export const CLIENT_APPS: ClientAppInterface[] = [
  {
    key: ClientAppsEnum.HAPP,
    name: 'Happ',
    isPaid: false,
    isRequired: true,
    color: '#2b2b2b',
    icon: '/clients/happ.svg',
    deepLink: 'happ://add/{URL}',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.IOS,
        version: '15.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore GLOBAL',
            link: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
          },
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore 🇷🇺',
            link: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Testflight GLOBAL',
            link: 'https://testflight.apple.com/join/XMls6Ckd',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Testflight 🇷🇺',
            link: 'https://testflight.apple.com/join/1bKEcMub',
          },
        ],
      },
      {
        platform: PlatformEnum.IPADOS,
        version: '15.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore GLOBAL',
            link: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
          },
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore 🇷🇺',
            link: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Testflight GLOBAL',
            link: 'https://testflight.apple.com/join/XMls6Ckd',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Testflight 🇷🇺',
            link: 'https://testflight.apple.com/join/1bKEcMub',
          },
        ],
      },
      {
        platform: PlatformEnum.ANDROID,
        version: '8.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.PLAY_MARKET,
            title: 'Play Market',
            link: 'https://play.google.com/store/apps/details?id=com.happproxy',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'APK file',
            link: 'https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ.apk',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'APK Beta file',
            link: 'https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ_beta.apk',
          },
        ],
      },
      {
        platform: PlatformEnum.ANDROID_TV,
        version: '8.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.PLAY_MARKET,
            title: 'Play Market',
            link: 'https://play.google.com/store/apps/details?id=com.happproxy',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'APK file',
            link: 'https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ.apk',
          },
        ],
      },
      {
        platform: PlatformEnum.WINDOWS,
        version: '10.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Installer x86/x64',
            link: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x86.exe',
          },
        ],
      },
      {
        platform: PlatformEnum.MACOS,
        version: '12.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore GLOBAL',
            link: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
          },
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore 🇷🇺',
            link: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
          },
        ],
      },
      {
        platform: PlatformEnum.LINUX,
        version: '?',
        downloadLinks: [
          {
            iconType: IconTypeEnum.OTHER,
            title: 'File',
            link: 'https://github.com/Happ-proxy/happ-desktop/releases/',
          },
        ],
      },
      {
        platform: PlatformEnum.APPLE_TV,
        version: '17.6+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/us/app/happ-proxy-utility-for-tv/id6748297274',
          },
        ],
      },
    ],
  },
]
