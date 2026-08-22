import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(cents: number) {
  const value = Math.round(cents / 100)
  return `रू ${new Intl.NumberFormat('en-NP').format(value)}`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NP').format(value)
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return '🏳️'
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

export function countryName(code?: string | null) {
  const names: Record<string, string> = {
    NP: 'Nepal',
    US: 'USA',
    GB: 'UK',
    IN: 'India',
  }
  return names[code ?? ''] ?? code ?? '—'
}
