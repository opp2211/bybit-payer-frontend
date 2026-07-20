export type AdminBank = {
  id: number
  code: string
  title: string
  enabled: boolean
  sortOrder: number
  aliases: string[]
}

export type AdminBankPayload = {
  code: string
  title: string
  enabled: boolean
  sortOrder: number
  aliases: string[]
}
