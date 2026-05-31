/**
 * Live source configuration — sources queried in real-time via Supabase
 * REST API using anon key. Client-side aggregation because PostgREST
 * doesn't support SUM/COUNT/AVG directly.
 *
 * Fallback: if live fetch fails or returns empty → snapshot data is used.
 */

export interface LiveSourceConfig {
  id: string
  url: string
  anonKey: string
  queries: Record<string, LiveQuery>
}

export interface LiveQuery {
  /** Supabase table/view name */
  from: string
  /** PostgREST select columns */
  select: string
  order?: string
  limit?: number
  /**
   * Client-side transform after fetching raw rows:
   * - 'passthrough': return rows as-is (with optional rename)
   * - 'group-sum': GROUP BY first col, SUM second col
   * - 'group-count': GROUP BY a col, COUNT rows per group
   * - 'single-row': take first row only
   * - 'kpi-multi': fetch from multiple endpoints, merge into 1 row
   */
  transform: 'passthrough' | 'group-sum' | 'group-count' | 'group-count-and-sum' | 'single-row' | 'kpi-multi'
  /** Column rename map (REST name → snapshot name) */
  rename?: Record<string, string>
  /** For group-sum: which column to group by, which to sum */
  groupBy?: string
  sumCol?: string
  /** For kpi-multi: additional fetches to merge */
  extraFetches?: Array<{
    from: string
    select: string
    as: Record<string, string> // column → KPI field name
  }>
  /** Filter: limit to latest snapshot_date */
  filterLatestSnapshot?: boolean
}

// ── Smart Inventory ─────────────────────────────────────────────────────────

const INV_URL = 'https://abhrghwszegwgkparkgb.supabase.co'
const INV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaHJnaHdzemVnd2drcGFya2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjcyNTAsImV4cCI6MjA4ODMwMzI1MH0.wvB0ian7MaMp62F_yXIzfmQhGSc2EXRfNH-XPpGupP8'

export const INVENTORY_LIVE: LiveSourceConfig = {
  id: 'inventory-snapshot',
  url: INV_URL,
  anonKey: INV_KEY,
  queries: {
    inv_kpi: {
      from: 'v_login_public_stats',
      select: '*',
      transform: 'kpi-multi',
      rename: {
        warehouse_count: 'warehouses',
        total_sku_count: 'total_skus',
        tx_count: 'transactions',
        expired_lots: 'expired_lots',
        lots_expiring_30d: 'expiring_30d_lots',
      },
      extraFetches: [
        { from: 'v_active_item_count', select: 'active_count', as: { active_count: 'active_skus' } },
        { from: 'v_stock_onhand', select: 'stock_value', as: { _sum_stock_value: 'stock_value' } },
      ],
    },
    inv_group: {
      from: 'v_stock_onhand',
      select: 'group_name,stock_value',
      transform: 'group-sum',
      groupBy: 'group_name',
      sumCol: 'stock_value',
      rename: { group_name: 'group', stock_value: 'value' },
    },
    inv_warehouse: {
      from: 'v_stock_onhand',
      select: 'whs_name,stock_value',
      transform: 'group-sum',
      groupBy: 'whs_name',
      sumCol: 'stock_value',
      rename: { whs_name: 'warehouse', stock_value: 'value' },
    },
    inv_item: {
      from: 'v_stock_onhand',
      select: 'itemname,whs_name,current_stock,stock_value',
      order: 'stock_value.desc',
      limit: 12,
      transform: 'passthrough',
      rename: { itemname: 'item', whs_name: 'warehouse', current_stock: 'qty', stock_value: 'value' },
    },
    inv_monthly: {
      from: 'v_monthly_total',
      select: 'month,in_value,out_value',
      order: 'month.asc',
      transform: 'passthrough',
      rename: { month: 'month', in_value: 'in_value', out_value: 'out_value' },
    },
    inv_aging: {
      from: 'v_lot_aging',
      select: 'aging_bucket,total_value,lot_count',
      transform: 'group-sum',
      groupBy: 'aging_bucket',
      sumCol: 'total_value',
      rename: { aging_bucket: 'bucket', total_value: 'value', lot_count: 'lots' },
    },
    inv_movement: {
      from: 'v_slow_moving',
      select: 'movement_status,stock_value',
      transform: 'group-count-and-sum',
      groupBy: 'movement_status',
      sumCol: 'stock_value',
      rename: { movement_status: 'status', stock_value: 'value', _count: 'items' },
    },
  },
}

// ── Smartcare ────────────────────────────────────────────────────────────────

const SC_URL = 'https://adynnacxcnzlcrcqrqge.supabase.co'
const SC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8'

export const SMARTCARE_LIVE: LiveSourceConfig = {
  id: 'smartcare-snapshot',
  url: SC_URL,
  anonKey: SC_KEY,
  queries: {
    sc_kpi: {
      from: 'complaints',
      select: 'id,status',
      transform: 'kpi-multi',
      extraFetches: [],
    },
    sc_status: {
      from: 'complaints',
      select: 'status',
      transform: 'group-count',
      groupBy: 'status',
      rename: { _count: 'count' },
    },
    sc_priority: {
      from: 'complaints',
      select: 'priority',
      transform: 'group-count',
      groupBy: 'priority',
      rename: { _count: 'count' },
    },
    // category, problem_type, root_cause, branch → NOT live-queried
    // because they require FK joins to resolve names from UUIDs.
    // These use snapshot fallback (names don't change often).
    // sc_monthly → also snapshot (needs date grouping on created_at).
  },
}

// ── SmartSales (jcueieskfvhmrwcmgnyh) ───────────────────────────────────────

const SS_URL = 'https://jcueieskfvhmrwcmgnyh.supabase.co'
const SS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdWVpZXNrZnZobXJ3Y21nbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDk5ODAsImV4cCI6MjA4ODMyNTk4MH0.3Gd5UWGfOgDv59jdL2_NmNjb66g0h-tfg40JGBBo9T8'

export const SMARTSALES_LIVE: LiveSourceConfig = {
  id: 'smartsales-snapshot',
  url: SS_URL,
  anonKey: SS_KEY,
  queries: {
    ss_kpi: {
      from: 'v_boardroom_kpi',
      select: '*',
      transform: 'single-row',
      rename: {},
    },
    ss_monthly: {
      from: 'v_boardroom_monthly',
      select: 'month,revenue,invoices',
      order: 'month.asc',
      transform: 'passthrough',
      // Widget uses 'payments' column — we'll merge from v_boardroom_payments
      extraFetches: [
        { from: 'v_boardroom_payments', select: 'month,payments', as: { _merge_by: 'month' } },
      ],
    },
    ss_salesperson: {
      from: 'v_boardroom_salesperson',
      select: 'salesperson,revenue,invoices',
      order: 'revenue.desc',
      transform: 'passthrough',
    },
    ss_customer: {
      from: 'v_boardroom_customer_top',
      select: 'customer,revenue,invoices',
      order: 'revenue.desc',
      limit: 15,
      transform: 'passthrough',
    },
    ss_item_group: {
      from: 'v_boardroom_item_group',
      select: 'item_group,revenue',
      order: 'revenue.desc',
      transform: 'passthrough',
    },
    ss_quote_status: {
      from: 'v_boardroom_quotations',
      select: 'status,quotes,amount',
      transform: 'passthrough',
    },
    ss_payment_status: {
      from: 'v_boardroom_kpi',
      select: 'collected,ar_balance,unpaid_count',
      transform: 'kpi-multi',
      extraFetches: [],
    },
  },
}

export const LIVE_SOURCES: Record<string, LiveSourceConfig> = {
  [INVENTORY_LIVE.id]: INVENTORY_LIVE,
  [SMARTCARE_LIVE.id]: SMARTCARE_LIVE,
  [SMARTSALES_LIVE.id]: SMARTSALES_LIVE,
}

export function isLiveSource(sourceId: string): boolean {
  return sourceId in LIVE_SOURCES
}

// ── Fetch + transform engine ────────────────────────────────────────────────

async function restFetch(
  url: string,
  key: string,
  from: string,
  select: string,
  order?: string,
  limit?: number
): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ select })
  if (order) params.set('order', order)
  if (limit) params.set('limit', String(limit))
  const res = await fetch(`${url}/rest/v1/${from}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return []
  return res.json()
}

function renameRow(row: Record<string, unknown>, map?: Record<string, string>): Record<string, unknown> {
  if (!map) return row
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[map[k] ?? k] = v
  return out
}

function groupSum(
  rows: Record<string, unknown>[],
  groupBy: string,
  sumCol: string
): Record<string, unknown>[] {
  const groups = new Map<string, number>()
  const extras = new Map<string, Record<string, number>>()
  for (const r of rows) {
    const key = String(r[groupBy] ?? '—')
    groups.set(key, (groups.get(key) ?? 0) + Number(r[sumCol] ?? 0))
    // Also sum any other numeric columns (e.g. lot_count)
    if (!extras.has(key)) extras.set(key, {})
    const ex = extras.get(key)!
    for (const [k, v] of Object.entries(r)) {
      if (k !== groupBy && k !== sumCol && typeof v === 'number') {
        ex[k] = (ex[k] ?? 0) + v
      }
    }
  }
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, val]) => ({
      [groupBy]: key,
      [sumCol]: Math.round(val),
      ...Object.fromEntries(
        Object.entries(extras.get(key) ?? {}).map(([k, v]) => [k, Math.round(v)])
      ),
    }))
}

function groupCount(
  rows: Record<string, unknown>[],
  groupBy: string
): Record<string, unknown>[] {
  const groups = new Map<string, number>()
  for (const r of rows) {
    const key = String(r[groupBy] ?? '—')
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ [groupBy]: key, count }))
}

export async function fetchLive(
  sourceId: string,
  tableName: string
): Promise<Record<string, unknown>[]> {
  const config = LIVE_SOURCES[sourceId]
  if (!config) return []
  const q = config.queries[tableName]
  if (!q) return []

  const raw = await restFetch(config.url, config.anonKey, q.from, q.select, q.order, q.limit)

  switch (q.transform) {
    case 'passthrough': {
      // Format month columns
      let rows2 = raw.map((r) => {
        const out = renameRow(r, q.rename)
        if (out.month && typeof out.month === 'string' && out.month.length > 7) {
          out.month = out.month.slice(0, 7)
        }
        return out
      })

      // Merge extra fetches (e.g. payments into monthly)
      if (q.extraFetches) {
        for (const ef of q.extraFetches) {
          if (ef.as._merge_by) {
            const mergeKey = ef.as._merge_by
            const extra = await restFetch(config.url, config.anonKey, ef.from, ef.select)
            const lookup = new Map<string, Record<string, unknown>>()
            for (const er of extra) {
              let key = String(er[mergeKey] ?? '')
              if (key.length > 7) key = key.slice(0, 7) // normalize month
              lookup.set(key, er)
            }
            rows2 = rows2.map((r) => {
              const key = String(r[mergeKey] ?? '')
              const match = lookup.get(key)
              if (match) {
                return { ...r, ...Object.fromEntries(
                  Object.entries(match).filter(([k]) => k !== mergeKey)
                )}
              }
              return r
            })
          }
        }
      }

      return rows2
    }

    case 'group-sum': {
      if (!q.groupBy || !q.sumCol) return []
      const grouped = groupSum(raw, q.groupBy, q.sumCol)
      return grouped.map((r) => renameRow(r, q.rename))
    }

    case 'group-count': {
      if (!q.groupBy) return []
      const grouped = groupCount(raw, q.groupBy)
      return grouped.map((r) => renameRow(r, q.rename))
    }

    case 'group-count-and-sum': {
      if (!q.groupBy || !q.sumCol) return []
      // Group by key, count items AND sum a value column
      const groups = new Map<string, { count: number; sum: number }>()
      for (const r of raw) {
        const key = String(r[q.groupBy] ?? '—')
        const cur = groups.get(key) ?? { count: 0, sum: 0 }
        cur.count += 1
        cur.sum += Number(r[q.sumCol!] ?? 0)
        groups.set(key, cur)
      }
      const result = [...groups.entries()]
        .sort((a, b) => b[1].sum - a[1].sum)
        .map(([key, { count, sum }]) => ({
          [q.groupBy!]: key,
          [q.sumCol!]: Math.round(sum),
          _count: count,
        }))
      return result.map((r) => renameRow(r, q.rename))
    }

    case 'single-row': {
      const row = raw[0] ? renameRow(raw[0], q.rename) : {}
      // Auto-compute collection_rate if invoiced + collected exist
      if (row.invoiced && row.collected) {
        const inv = Number(row.invoiced)
        const col = Number(row.collected)
        row.collection_rate = inv > 0 ? Math.round((col / inv) * 100 * 10) / 10 : 0
      }
      return [row]
    }

    case 'kpi-multi': {
      // Start with the main fetch row
      const base = raw[0] ? renameRow(raw[0], q.rename) : {}

      // Handle SmartSales payment_status: transform KPI row into status rows
      if (tableName === 'ss_payment_status' && base.collected) {
        return [
          { status: 'Paid', invoices: 711 - Number(base.unpaid_count ?? 0), amount: Math.round(Number(base.collected ?? 0)) },
          { status: 'Unpaid', invoices: Number(base.unpaid_count ?? 0), amount: Math.round(Number(base.ar_balance ?? 0)) },
        ]
      }

      // Handle Smartcare KPI: count complaints from raw rows
      if (tableName === 'sc_kpi') {
        const total = raw.length
        const open = raw.filter((r) => {
          const s = String(r.status ?? '')
          return s === 'Call ขาเข้า' || s.startsWith('คาด')
        }).length
        return [{
          total_complaints: total,
          open_complaints: open,
          closed_complaints: total - open,
          categories: 5, // static — lookup tables don't need live
          branches: 6,
        }]
      }

      // Handle Inventory KPI: merge from multiple endpoints
      if (q.extraFetches) {
        for (const ef of q.extraFetches) {
          const extra = await restFetch(config.url, config.anonKey, ef.from, ef.select)
          // Check for special _sum_ prefix: sum all rows of that column
          const sumKey = Object.keys(ef.as).find((k) => k.startsWith('_sum_'))
          if (sumKey) {
            const srcCol = sumKey.replace('_sum_', '')
            const sum = extra.reduce((a, r) => a + Number(r[srcCol] ?? 0), 0)
            base[ef.as[sumKey]] = Math.round(sum)
          } else {
            // Single-row value copy
            const row = extra[0]
            if (row) {
              for (const [from, to] of Object.entries(ef.as)) {
                base[to] = row[from]
              }
            }
          }
        }
      }

      // Fetch expired value from v_vv_lots (latest snapshot, days_remaining < 0)
      if (tableName === 'inv_kpi') {
        // expired_value, lot aging, movement health values are expensive to
        // aggregate client-side (thousands of rows). Use snapshot fallback.

        // Fill missing KPI fields from snapshot if not populated
        const { INVENTORY_TABLES } = await import('./inventorySnapshot')
        const snapKpi = INVENTORY_TABLES.inv_kpi?.[0]
        if (snapKpi) {
          if (!base.expired_value) base.expired_value = snapKpi.expired_value
          if (!base.expired_lots) base.expired_lots = snapKpi.expired_lots
          if (!base.expiring_30d_value) base.expiring_30d_value = snapKpi.expiring_30d_value
          if (!base.expiring_30d_lots && !base.expiring_30d_lots) base.expiring_30d_lots = snapKpi.expiring_30d_lots
          if (!base.normal_items) base.normal_items = snapKpi.normal_items
          if (!base.slow_moving_items) base.slow_moving_items = snapKpi.slow_moving_items
          if (!base.dead_stock_items) base.dead_stock_items = snapKpi.dead_stock_items
        }
      }

      return [base]
    }

    default:
      return raw
  }
}
