import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 9)
  const time = Date.now().toString(36)
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`
}

export function formatNumber(
  value: number,
  opts: { compact?: boolean; decimals?: number } = {}
): string {
  if (value == null || Number.isNaN(value)) return '—'
  const { compact, decimals } = opts
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals ?? 2,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/** Coerce arbitrary cell value to a finite number where possible. */
export function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.+-]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export const CHART_PALETTE = [
  '#58A6FF',
  '#3FB950',
  '#BC8CFF',
  '#D29922',
  '#F85149',
  '#39C5CF',
  '#FF7B72',
  '#A5D6FF',
]

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (val: unknown) => {
    const s = val == null ? '' : String(val)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
