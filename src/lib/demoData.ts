import { subDays, format, startOfYear } from 'date-fns'
import type { QueryConfig } from '@/types'

export const DEMO_SOURCE_ID = 'demo'

/** Tiny seeded PRNG so demo data is stable across renders for a given seed. */
function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h) || 1
}

interface DemoSchema {
  rows: (rand: () => number) => Record<string, unknown>[]
}

const REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM']
const CHANNELS = ['Direct', 'Partner', 'Online', 'Reseller']
const STATUSES = ['active', 'churned', 'trial', 'paused']

const SCHEMAS: Record<string, DemoSchema> = {
  revenue: {
    rows: (rand) =>
      Array.from({ length: 90 }, (_, i) => {
        const base = 42000 + Math.sin(i / 6) * 9000 + i * 220
        return {
          date: format(subDays(new Date(), 90 - i), 'yyyy-MM-dd'),
          revenue: Math.round(base + rand() * 8000),
          expenses: Math.round(base * 0.62 + rand() * 4000),
          region: REGIONS[Math.floor(rand() * REGIONS.length)],
        }
      }),
  },
  sales: {
    rows: (rand) =>
      Array.from({ length: 120 }, (_, i) => ({
        date: format(subDays(new Date(), 120 - i), 'yyyy-MM-dd'),
        deals: Math.round(8 + rand() * 24),
        amount: Math.round(5000 + rand() * 45000),
        rep: ['A. Chen', 'M. Patel', 'S. Ortiz', 'K. Novak'][Math.floor(rand() * 4)],
        channel: CHANNELS[Math.floor(rand() * CHANNELS.length)],
        region: REGIONS[Math.floor(rand() * REGIONS.length)],
      })),
  },
  customers: {
    rows: (rand) =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        name: `Account ${String.fromCharCode(65 + (i % 26))}${i}`,
        mrr: Math.round(500 + rand() * 9500),
        seats: Math.round(5 + rand() * 200),
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
        region: REGIONS[Math.floor(rand() * REGIONS.length)],
        health: Math.round(40 + rand() * 60),
      })),
  },
  events: {
    rows: (rand) => {
      const out: Record<string, unknown>[] = []
      for (let d = 0; d < 7; d++)
        for (let h = 0; h < 24; h++)
          out.push({
            day: d,
            hour: h,
            count: Math.round(
              (h > 8 && h < 20 ? 50 : 10) * (d < 5 ? 1.4 : 0.6) + rand() * 40
            ),
          })
      return out
    },
  },
  operations: {
    rows: (rand) =>
      Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        uptime: +(99 + rand()).toFixed(2),
        incidents: Math.round(rand() * 4),
        latency_ms: Math.round(120 + rand() * 180),
        throughput: Math.round(8000 + rand() * 4000),
      })),
  },
}

export function isDemoTable(table: string): boolean {
  return table in SCHEMAS
}

export function runDemoQuery(config: QueryConfig): Record<string, unknown>[] {
  const schema = SCHEMAS[config.table]
  const rand = rng(hash(config.table + config.select))
  let rows = schema ? schema.rows(rand) : []

  // apply simple equality filters for realism
  for (const f of config.filters ?? []) {
    if (f.operator === 'eq')
      rows = rows.filter((r) => String(r[f.column]) === f.value)
  }

  // apply date-range preset against a date-ish column
  const dr = config.dateRange
  if (dr?.column && dr.preset && dr.preset !== 'all') {
    const now = new Date()
    const from =
      dr.preset === 'ytd'
        ? startOfYear(now)
        : subDays(now, dr.preset === '7d' ? 7 : dr.preset === '90d' ? 90 : 30)
    rows = rows.filter((r) => {
      const v = r[dr.column]
      const d = v ? new Date(String(v)) : null
      return d ? d >= from : true
    })
  }

  if (config.orderBy) {
    const desc = config.orderBy.startsWith('-')
    const col = desc ? config.orderBy.slice(1) : config.orderBy
    rows = [...rows].sort((a, b) => {
      const av = a[col] as number
      const bv = b[col] as number
      return desc ? Number(bv) - Number(av) : Number(av) - Number(bv)
    })
  }

  if (config.limit) rows = rows.slice(0, config.limit)
  return rows
}

export const DEMO_TABLES = Object.keys(SCHEMAS)
