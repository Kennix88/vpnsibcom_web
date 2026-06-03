interface TaddyAdsInstance {
  interstitial: (opts?: {
    payload?: Record<string, unknown>
    onClosed?: () => void
    onViewThrough?: (id: string) => void
  }) => Promise<boolean>
}

interface TaddyInstance {
  ads: () => TaddyAdsInstance
}

interface Window {
  Taddy?: TaddyInstance
}
