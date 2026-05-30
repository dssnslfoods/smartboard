import { subDays, startOfYear } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseManager } from './supabaseManager'
import type { QueryConfig, DateRangeConfig } from '@/types'

export interface QueryResult {
  rows: Record<string, unknown>[]
  count: number | null
}

function resolveDateRange(dr: DateRangeConfig): { from?: string; to?: string } {
  if (dr.from || dr.to) return { from: dr.from, to: dr.to }
  const now = new Date()
  switch (dr.preset) {
    case '7d':
      return { from: subDays(now, 7).toISOString() }
    case '30d':
      return { from: subDays(now, 30).toISOString() }
    case '90d':
      return { from: subDays(now, 90).toISOString() }
    case 'ytd':
      return { from: startOfYear(now).toISOString() }
    default:
      return {}
  }
}

/**
 * Build the PostgREST query from a QueryConfig and execute it against the
 * chosen source's client. Returns rows + optional count.
 */
export async function runQuery(config: QueryConfig, sourceId: string): Promise<QueryResult> {
  const client: SupabaseClient | undefined = supabaseManager.getClient(sourceId)
  if (!client) throw new Error(`Source "${sourceId}" is not connected`)

  let q = client.from(config.table).select(config.select || '*', { count: 'exact' })

  for (const f of config.filters ?? []) {
    // @ts-expect-error dynamic operator dispatch is intentional
    q = q[f.operator](f.column, castFilterValue(f.value))
  }

  if (config.dateRange?.column) {
    const { from, to } = resolveDateRange(config.dateRange)
    if (from) q = q.gte(config.dateRange.column, from)
    if (to) q = q.lte(config.dateRange.column, to)
  }

  if (config.orderBy) {
    const desc = config.orderBy.startsWith('-')
    const col = desc ? config.orderBy.slice(1) : config.orderBy
    q = q.order(col, { ascending: !desc })
  }

  if (config.limit) q = q.limit(config.limit)

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { rows: (data as unknown as Record<string, unknown>[]) ?? [], count }
}

function castFilterValue(value: string): string | number | boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  const n = Number(value)
  if (value.trim() !== '' && !Number.isNaN(n)) return n
  return value
}

/**
 * Human-readable SQL approximation of a QueryConfig — shown in the builder so
 * users understand what the visual config maps to.
 */
export function toSQL(config: QueryConfig): string {
  const parts: string[] = []
  const cols = config.aggregation
    ? `${config.aggregation.toUpperCase()}(${config.select || '*'})${
        config.groupBy ? `, ${config.groupBy}` : ''
      }`
    : config.select || '*'
  parts.push(`SELECT ${cols}`)
  parts.push(`FROM ${config.table || '<table>'}`)

  const where: string[] = []
  for (const f of config.filters ?? []) {
    const opMap: Record<string, string> = {
      eq: '=',
      neq: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      like: 'LIKE',
      ilike: 'ILIKE',
      is: 'IS',
    }
    where.push(`${f.column} ${opMap[f.operator] ?? f.operator} '${f.value}'`)
  }
  if (config.dateRange?.column && config.dateRange.preset !== 'all') {
    where.push(`${config.dateRange.column} >= now() - interval '${config.dateRange.preset}'`)
  }
  if (where.length) parts.push(`WHERE ${where.join(' AND ')}`)

  if (config.groupBy) parts.push(`GROUP BY ${config.groupBy}`)
  if (config.orderBy) {
    const desc = config.orderBy.startsWith('-')
    parts.push(`ORDER BY ${desc ? config.orderBy.slice(1) : config.orderBy}${desc ? ' DESC' : ''}`)
  }
  if (config.limit) parts.push(`LIMIT ${config.limit}`)

  return parts.join('\n')
}
