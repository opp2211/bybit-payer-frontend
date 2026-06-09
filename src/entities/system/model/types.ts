export type SystemStatus = {
  bybitApiAvailable: boolean
  bybitMode: 'LOCAL_NOOP' | 'CONFIG_MISSING' | 'HTTP' | string
  gmailImapsAvailable: boolean
  bybitAdId: string | null
  adPublished: boolean
  currentRate: number | null
  currentMinRub: number | null
  currentMaxRub: number | null
  currentQuantityUsdt: number | null
  currentDescription: string | null
  availableUsdtBalance: number | null
  lastSystemError: string | null
  lastUpdatedAt: string | null
}
