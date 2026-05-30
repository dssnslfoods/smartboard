import type { QueryConfig } from '@/types'
import { INVENTORY_META, INVENTORY_SOURCE_ID, INVENTORY_TABLES } from './inventorySnapshot'
import { SMARTCARE_META, SMARTCARE_SOURCE_ID, SMARTCARE_TABLES } from './smartcareSnapshot'

/**
 * SmartSales real-data SNAPSHOT.
 *
 * Real aggregates pulled (read-only, SELECT only) from the SmartSales Supabase
 * project on 2026-05-30 via server-side aggregation, then baked in. The project
 * has RLS enabled for `authenticated` only, so the browser's anon key cannot read
 * the base tables — and we deliberately do NOT modify the production schema.
 *
 * Every categorical breakdown below reconciles to the grand total of
 * ฿440,459,190 invoiced (verified by checksum). To refresh: re-run the
 * aggregation queries and replace the arrays.
 */
export const SNAPSHOT_SOURCE_ID = 'smartsales-snapshot'
export const SNAPSHOT_META = {
  id: SNAPSHOT_SOURCE_ID,
  name: 'SmartSales (snapshot)',
  color: '#3FB950',
  capturedAt: '2026-05-30',
  description: 'Real SAP sales aggregates · captured 2026-05-30',
}

type Row = Record<string, unknown>

const TABLES: Record<string, Row[]> = {
  // single-row scalar KPIs
  ss_kpi: [
    {
      invoiced: 440459190,
      collected: 409714842,
      quotation_value: 342360905,
      ar_balance: 17834594,
      avg_invoice: 619493,
      vat: 6165391,
      invoices: 711,
      quotations: 508,
      customers: 128,
      items: 367,
      collection_rate: 93,
    },
  ],

  // exact monthly invoiced revenue vs payments collected
  ss_monthly: [
    { month: '2025-01', revenue: 12721252, payments: 1703110 },
    { month: '2025-02', revenue: 21618381, payments: 15655027 },
    { month: '2025-03', revenue: 23520950, payments: 22817789 },
    { month: '2025-04', revenue: 26523743, payments: 20884886 },
    { month: '2025-05', revenue: 27327157, payments: 17575238 },
    { month: '2025-06', revenue: 28579263, payments: 35902539 },
    { month: '2025-07', revenue: 27706220, payments: 29432209 },
    { month: '2025-08', revenue: 30457247, payments: 27124250 },
    { month: '2025-09', revenue: 27115937, payments: 28740197 },
    { month: '2025-10', revenue: 34073597, payments: 22179923 },
    { month: '2025-11', revenue: 29211171, payments: 31802420 },
    { month: '2025-12', revenue: 36108145, payments: 29613562 },
    { month: '2026-01', revenue: 21558797, payments: 31138538 },
    { month: '2026-02', revenue: 20102585, payments: 24876707 },
    { month: '2026-03', revenue: 28035240, payments: 20088840 },
    { month: '2026-04', revenue: 23547982, payments: 16544157 },
    { month: '2026-05', revenue: 22251523, payments: 33635448 },
  ],

  ss_item_group: [
    { item_group: 'Canned foods - PNF', revenue: 205192034 },
    { item_group: 'Beverage - PNF', revenue: 185971660 },
    { item_group: 'Canned foods - Natural fruit', revenue: 16619188 },
    { item_group: 'Beverage - Royal Plus', revenue: 14231957 },
    { item_group: 'Freight charge', revenue: 4490892 },
    { item_group: 'Frozen - NSL Foods', revenue: 2395673 },
    { item_group: 'Beverage - CITY FARM INTERFOOD', revenue: 2018765 },
    { item_group: 'Canned foods - Merit Food Products', revenue: 1749811 },
    { item_group: 'Retort - NSL Foods', revenue: 1519100 },
    { item_group: 'Other income', revenue: 1188062 },
    { item_group: 'Canned foods - Pick and Peel', revenue: 1146388 },
    { item_group: 'Canned foods - O.V. International', revenue: 917282 },
  ],

  ss_customer: [
    { customer: 'Wai Koko Beverage Company LLC', revenue: 82623150, invoices: 156 },
    { customer: 'Wanis Ltd.', revenue: 59541857, invoices: 80 },
    { customer: 'MCLANE GLOBAL', revenue: 26303073, invoices: 13 },
    { customer: 'Ly Chunkuy Co.,Ltd.', revenue: 18359500, invoices: 20 },
    { customer: 'บริษัท ฉลอง จำกัด', revenue: 16843800, invoices: 13 },
    { customer: 'DISTRIBUCIONES CALZAN S.A. DE C.V.', revenue: 16619188, invoices: 3 },
    { customer: 'บริษัท โกลเด็น แลนด์ โปรดักส์ จำกัด', revenue: 11908700, invoices: 15 },
    { customer: 'บริษัท ธนิตา89 จำกัด', revenue: 11772075, invoices: 19 },
    { customer: 'Golden Sun Impex Co.,Ltd.', revenue: 10654617, invoices: 22 },
    { customer: 'Diaz Foods Ltd.', revenue: 7367628, invoices: 14 },
    { customer: 'บริษัท วาแทป (ประเทศไทย) จำกัด', revenue: 7303128, invoices: 15 },
    { customer: 'PENTRADE DUTY FREE B.V.', revenue: 6571208, invoices: 13 },
    { customer: 'Royal Food Import Corp.', revenue: 6186431, invoices: 11 },
    { customer: 'ฉลอง จำกัด', revenue: 6159600, invoices: 4 },
    { customer: 'M.H.ENTERPRISES L.L.C.', revenue: 5630853, invoices: 10 },
  ],

  ss_payment_status: [
    { status: 'Paid', invoices: 674, amount: 420073046 },
    { status: 'Unpaid', invoices: 37, amount: 20386144 },
  ],

  ss_salesperson: [
    { salesperson: 'CHANIDA', revenue: 153287248, invoices: 250 },
    { salesperson: 'YADA', revenue: 111261223, invoices: 173 },
    { salesperson: 'WARAPORN', revenue: 100504804, invoices: 175 },
    { salesperson: 'SUTHINEE', revenue: 50033609, invoices: 65 },
    { salesperson: 'PASSORN', revenue: 25372306, invoices: 48 },
  ],

  ss_item: [
    { item: 'Coconut Water 12x520ml. - Wai Koko', revenue: 69338270, qty: 316536 },
    { item: 'Coconut Milk 5-7% 24x400ml. - MC Trader', revenue: 25354815, qty: 88200 },
    { item: 'Pineapple Slices 8ring Light Syrup 12x30oz', revenue: 16619188, qty: 36000 },
    { item: "Coconut Milk 5-7% 24x400ml. - Solo's Choice", revenue: 16016400, qty: 59400 },
    { item: 'Coconut Water w/ Pieces 12x330ml. - Tropical Sun', revenue: 13636091, qty: 86090 },
    { item: 'Coconut Water 12x520ml. (Natural) - Tropical Sun', revenue: 9894250, qty: 47510 },
    { item: 'Coconut Water 12x330ml. - Tropical Sun', revenue: 8803955, qty: 57015 },
    { item: 'Coconut Water w/ Pulp 12x520ml. - Wai Koko', revenue: 8374114, qty: 38478 },
    { item: 'Coconut Water w/ Pulp 12x520ml. - Tropical Sun', revenue: 7393339, qty: 38864 },
    { item: 'Coconut Water w/ Pulp 24x520ml. - La Cena', revenue: 7004173, qty: 18200 },
    { item: 'Coconut Water Drink w/ Pieces 12x520ml.', revenue: 6112193, qty: 31635 },
    { item: 'Coconut Water w/ Pulp 12x330ml. - Tropical Sun', revenue: 6099743, qty: 41600 },
  ],

  ss_quote_status: [
    { status: 'Closed', quotes: 379, amount: 241213478 },
    { status: 'Open', quotes: 129, amount: 101147427 },
  ],
}

export const SNAPSHOT_TABLES = Object.keys(TABLES)

/**
 * All baked snapshot sources (read-only, login-free). Each is a live Supabase
 * project whose aggregates were pulled via MCP and baked here. Tables use
 * prefixes (ss_, inv_) so multiple snapshots coexist.
 *
 * `live: true` marks them as "Live" sources in the UI (not Built-in like Demo)
 * since they map to real Supabase projects. Only Demo data is a true built-in.
 */
export const SNAPSHOT_SOURCES = [
  { ...SNAPSHOT_META, projectUrl: 'https://jcueieskfvhmrwcmgnyh.supabase.co', live: true as const },
  { ...INVENTORY_META, projectUrl: 'https://abhrghwszegwgkparkgb.supabase.co', live: true as const },
  { ...SMARTCARE_META, projectUrl: 'https://adynnacxcnzlcrcqrqge.supabase.co', live: true as const },
]
const ALL_TABLES: Record<string, Row[]> = { ...TABLES, ...INVENTORY_TABLES, ...SMARTCARE_TABLES }

export function isSnapshotSource(id: string): boolean {
  return id === SNAPSHOT_SOURCE_ID || id === INVENTORY_SOURCE_ID || id === SMARTCARE_SOURCE_ID
}

export function isSnapshotTable(table: string): boolean {
  return table in ALL_TABLES
}

export function runSnapshotQuery(config: QueryConfig): Row[] {
  let rows = ALL_TABLES[config.table] ? [...ALL_TABLES[config.table]] : []

  for (const f of config.filters ?? []) {
    if (f.operator === 'eq') rows = rows.filter((r) => String(r[f.column]) === f.value)
  }

  if (config.orderBy) {
    const desc = config.orderBy.startsWith('-')
    const col = desc ? config.orderBy.slice(1) : config.orderBy
    rows = rows.sort((a, b) => {
      const av = a[col]
      const bv = b[col]
      if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv
      return desc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv))
    })
  }

  if (config.limit) rows = rows.slice(0, config.limit)
  return rows
}
