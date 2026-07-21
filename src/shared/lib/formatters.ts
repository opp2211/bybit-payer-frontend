const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 4,
})

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const fullDateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function formatRub(value: number | null | undefined): string {
  return value == null ? '—' : rubFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : numberFormatter.format(value)
}

export function formatDateTime(value: string | null | undefined, full = false): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return (full ? fullDateTimeFormatter : dateTimeFormatter).format(date)
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits

  if (normalized.length !== 11 || !normalized.startsWith('7')) return value

  return `+7 ${normalized.slice(1, 4)} ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9)}`
}

export function formatCardNumber(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 16) return value
  return digits.match(/.{1,4}/g)?.join(' ') ?? value
}

export function formatAccountNumber(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 20) return value
  return digits.match(/.{1,4}/g)?.join(' ') ?? value
}

export function compactId(value: string | null | undefined): string {
  if (!value) return '—'
  if (value.length <= 14) return value
  return `${value.slice(0, 7)}…${value.slice(-5)}`
}
