import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `₹${amount.toFixed(2)}`
  }
}

export function formatDate(date: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(new Date(date))
}

export function formatDateTime(date: string | number | Date) {
  return formatDate(date, { hour: '2-digit', minute: '2-digit' })
}

export function maskAccountNumber(num: string) {
  if (!num) return ''
  const last4 = num.slice(-4)
  return `•••• •••• ${last4}`
}

export function maskCardNumber(num: string) {
  if (!num) return '•••• •••• •••• ••••'
  const last4 = num.slice(-4)
  return `•••• •••• •••• ${last4}`
}

export function initials(name?: string | null) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
