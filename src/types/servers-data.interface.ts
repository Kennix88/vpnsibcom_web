export interface ServersResponseDataInterface {
  baseServersCount: number
  premiumServersCount: number
  servers: ServerDataInterface[]
}

export interface ServerDataInterface {
  code: string
  name: string
  flagKey: string
  flagEmoji: string
  network: number
  isActive: boolean
  isPremium: boolean
}
