import { IconTypeEnum } from './icon-type.enum'
import { PlatformEnum } from './platform.enum'

export interface ClientAppInterface {
  key: string
  name: string
  isPaid: boolean
  isRequired: boolean
  color: string
  icon: string
  deepLink: string
  routing: ClientAppRoutingInterface[]
  platforms: ClientAppPlatformInterface[]
}

export interface ClientAppRoutingInterface {
  countryCode: string
  name: string
  link: string
}

export interface ClientAppPlatformInterface {
  platform: PlatformEnum
  version: string
  downloadLinks: ClientAppDownloadLinkInterface[]
}

export interface ClientAppDownloadLinkInterface {
  iconType: IconTypeEnum
  title: string
  link: string
}
