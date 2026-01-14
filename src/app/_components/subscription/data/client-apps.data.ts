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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
            link: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
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
          {
            iconType: IconTypeEnum.OTHER,
            title: 'All installers',
            link: 'https://www.happ.su/main/',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.SHADOWROCKET,
    name: 'ShadowRocket',
    isPaid: true,
    isRequired: false,
    color: '#2473BF',
    icon: '/clients/shadowrocket.svg',
    deepLink: 'sub://{URL}',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.IOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/shadowrocket/id932747118',
          },
        ],
      },
      {
        platform: PlatformEnum.IPADOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/shadowrocket/id932747118',
          },
        ],
      },
      {
        platform: PlatformEnum.MACOS,
        version: '11.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/shadowrocket/id932747118',
          },
        ],
      },
      {
        platform: PlatformEnum.APPLE_TV,
        version: '17.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/shadowrocket/id932747118',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.STREISAND,
    name: 'Streisand',
    isPaid: false,
    isRequired: false,
    color: '#A755F6',
    icon: '/clients/streisand.svg',
    deepLink: 'streisand://import/{URL}#VPNsib',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.IOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/streisand/id6450534064',
          },
        ],
      },
      {
        platform: PlatformEnum.IPADOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/streisand/id6450534064',
          },
        ],
      },
      {
        platform: PlatformEnum.MACOS,
        version: '12.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/streisand/id6450534064',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.FOXRAY,
    name: 'FoxRay',
    isPaid: false,
    isRequired: false,
    color: '#017AFF',
    icon: '/clients/foxray.svg',
    deepLink: 'foxray://yiguo.dev/sub/add/?url={URL}#VPNsib',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.IOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/foxray/id6448898396',
          },
        ],
      },
      {
        platform: PlatformEnum.IPADOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/foxray/id6448898396',
          },
        ],
      },
      {
        platform: PlatformEnum.MACOS,
        version: '12.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/foxray/id6448898396',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.V2RAYNG,
    name: 'v2rayNG',
    isPaid: false,
    isRequired: false,
    color: '#37464f',
    icon: '/clients/v2rayng.svg',
    deepLink: 'v2rayng://install-config?url={URL}',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.ANDROID,
        version: '8.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.PLAY_MARKET,
            title: 'Play Market',
            link: 'https://play.google.com/store/apps/details?id=com.v2ray.ang',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'APK file [Universal]',
            link: 'https://github.com/2dust/v2rayNG/releases/download/1.10.23/v2rayNG_1.10.23_universal.apk',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.V2BOX,
    name: 'V2Box',
    isPaid: false,
    isRequired: false,
    color: '#000000',
    icon: '/clients/v2box.svg',
    deepLink: 'v2box://install-sub?url={URL}&name=VPNsib',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.IOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690',
          },
        ],
      },
      {
        platform: PlatformEnum.IPADOS,
        version: '13.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690',
          },
        ],
      },
      {
        platform: PlatformEnum.MACOS,
        version: '12.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.APPLE_STORE,
            title: 'AppStore',
            link: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690',
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
            link: 'https://play.google.com/store/apps/details?id=dev.hexasoftware.v2box',
          },
        ],
      },
    ],
  },
  {
    key: ClientAppsEnum.HIDDIFY,
    name: 'Hiddify',
    isPaid: false,
    isRequired: false,
    color: '#455fe9',
    icon: '/clients/hiddify.svg',
    deepLink: 'hiddify://install-sub?url={URL}#VPNsib',
    routing: [],
    platforms: [
      {
        platform: PlatformEnum.ANDROID,
        version: '8.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.PLAY_MARKET,
            title: 'Play Market',
            link: 'https://play.google.com/store/apps/details?id=app.hiddify.com',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'APK file [Universal]',
            link: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Android-universal.apk',
          },
        ],
      },
      {
        platform: PlatformEnum.WINDOWS,
        version: '10.0+',
        downloadLinks: [
          {
            iconType: IconTypeEnum.OTHER,
            title: 'OfficialSetup [x64] (.Msix)',
            link: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Windows-Setup-x64.Msix',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Setup [x64] (.exe)',
            link: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Windows-Setup-x64.exe',
          },
          {
            iconType: IconTypeEnum.OTHER,
            title: 'Portable [x64] (.zip)',
            link: 'https://github.com/hiddify/hiddify-next/releases/latest/download/Hiddify-Windows-Portable-x64.zip',
          },
        ],
      },
    ],
  },
]
