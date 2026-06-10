export type SystemStatus = {
  bybitApiAvailable: boolean
  bybitMode: 'LOCAL_NOOP' | 'CONFIG_MISSING' | 'HTTP' | string
  gmailImapsAvailable: boolean
  bybitAdId: string | null
  adPublished: boolean
  currentRate: number | null
  currentRateSourcePosition: number | null
  referenceRate7: number | null
  referenceRate7WithFee: number | null
  referenceRate15: number | null
  currentMinRub: number | null
  currentMaxRub: number | null
  currentQuantityUsdt: number | null
  currentDescription: string | null
  availableUsdtBalance: number | null
  availableRubBalance: number | null
  lastSystemError: string | null
  bybitLastCheckedAt: string | null
  lastUpdatedAt: string | null
}
