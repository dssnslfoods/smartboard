import type { Aggregation } from '@/types'
import { toNumber } from './utils'

export function aggregate(
  rows: Record<string, unknown>[],
  column: string,
  fn: Aggregation
): number {
  if (fn === 'count') return rows.length
  const nums = rows
    .map((r) => toNumber(r[column]))
    .filter((n): n is number => n != null)
  if (!nums.length) return 0
  switch (fn) {
    case 'sum':
      return nums.reduce((a, b) => a + b, 0)
    case 'avg':
      return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'max':
      return Math.max(...nums)
    case 'min':
      return Math.min(...nums)
    default:
      return 0
  }
}

/** Group rows by a key column and aggregate a value column within each group. */
export function groupAndAggregate(
  rows: Record<string, unknown>[],
  groupBy: string,
  valueColumn: string,
  fn: Aggregation
): { key: string; value: number }[] {
  const groups = new Map<string, Record<string, unknown>[]>()
  for (const row of rows) {
    const key = String(row[groupBy] ?? '—')
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }
  return [...groups.entries()].map(([key, bucket]) => ({
    key,
    value: aggregate(bucket, valueColumn, fn),
  }))
}
