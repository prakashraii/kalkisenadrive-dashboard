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

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateTime(value: string | Date) {
  return `${formatDate(value)}, ${formatTime(value)}`
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return '🏳️'
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

export function assetUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3011/api/v1'
  const origin = String(apiBase).replace(/\/api\/v1\/?$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
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
