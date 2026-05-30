import type { TableMeta } from '@/types'

/**
 * Smart Inventory (NSL Foods) real-data snapshot.
 *
 * Real aggregates pulled read-only via MCP on 2026-05-30 from the inventory
 * Supabase project (ref abhrghwszegwgkparkgb). Frozen food-service business
 * (salmon, beef, saba). The project exposes public views (RLS off) the anon key
 * CAN read — but we bake a snapshot for instant, login-free dashboards.
 */
export const INVENTORY_SOURCE_ID = 'inventory-snapshot'
export const INVENTORY_META = {
  id: INVENTORY_SOURCE_ID,
  name: 'Smart Inventory',
  color: '#39C5CF',
  capturedAt: '2026-05-30',
  description: 'Frozen food-service stock · captured 2026-05-30',
}

type Row = Record<string, unknown>

export const INVENTORY_TABLES: Record<string, Row[]> = {
  inv_kpi: [
    {
      stock_value: 174691720,
      active_skus: 908,
      total_skus: 1967,
      warehouses: 31,
      transactions: 266931,
      expired_lots: 417,
      expired_value: 31300872,
      expiring_30d: 51,
    },
  ],

  inv_group: [
    { group: 'FRM-Raw Materials', value: 155471001, skus: 318 },
    { group: 'FFG-Finish Goods', value: 18854296, skus: 119 },
    { group: 'FPKG-Packaging', value: 366423, skus: 23 },
    { group: 'FBY-By Product', value: 0, skus: 1 },
  ],

  // monthly stock movement: goods in (received) vs out (consumed)
  inv_monthly: [
    { month: '2025-01', in_value: 35788045, out_value: 62686464 },
    { month: '2025-02', in_value: 31221036, out_value: 39357651 },
    { month: '2025-03', in_value: 37570038, out_value: 44965875 },
    { month: '2025-04', in_value: 52927059, out_value: 40110884 },
    { month: '2025-05', in_value: 80713328, out_value: 43459191 },
    { month: '2025-06', in_value: 22170921, out_value: 41477311 },
    { month: '2025-07', in_value: 35195071, out_value: 42092654 },
    { month: '2025-08', in_value: 56079593, out_value: 44306775 },
    { month: '2025-09', in_value: 47440372, out_value: 44994596 },
    { month: '2025-10', in_value: 54505179, out_value: 36128069 },
    { month: '2025-11', in_value: 41104306, out_value: 33958016 },
    { month: '2025-12', in_value: 19336507, out_value: 47495004 },
    { month: '2026-01', in_value: 17405846, out_value: 35742476 },
    { month: '2026-02', in_value: 40711572, out_value: 64239281 },
    { month: '2026-03', in_value: 47497110, out_value: 57851049 },
    { month: '2026-04', in_value: 45406014, out_value: 38076008 },
  ],

  inv_warehouse: [
    { warehouse: 'คลัง RM - นอก1', value: 93370915 },
    { warehouse: 'คลัง RM - นอก2', value: 40574586 },
    { warehouse: 'คลัง RM - ใน1', value: 14659052 },
    { warehouse: 'คลัง RM - ใน2', value: 10151725 },
    { warehouse: 'คลัง FG - ใน1', value: 7814757 },
    { warehouse: 'คลัง FG - ใน2', value: 5469043 },
    { warehouse: 'คลังผลิต - ใน2', value: 1875833 },
    { warehouse: 'คลัง QC - ใน', value: 401159 },
  ],

  // lot-age basis (total ฿336M across lots)
  inv_aging: [
    { bucket: '0-30 days', value: 1379469, lots: 51 },
    { bucket: '31-60 days', value: 2680991, lots: 67 },
    { bucket: '61-90 days', value: 8459082, lots: 98 },
    { bucket: '91-180 days', value: 32517496, lots: 181 },
    { bucket: '180+ days', value: 260148394, lots: 1642 },
    { bucket: 'Expired', value: 31300872, lots: 417 },
  ],

  inv_item: [
    { item: 'Froz. Salmon WH/HeadOn/Gutted 5-6 Kg.', warehouse: 'FS-RM04', qty: 41522, value: 9465615 },
    { item: 'Aus. Froz. Trimming 65cl', warehouse: 'FS-RM03', qty: 52543, value: 8717649 },
    { item: 'Saba 400-600 (Norway)', warehouse: 'FS-RM03', qty: 39760, value: 6796221 },
    { item: 'Froz. Salmon WH/HeadOn/Gutted 4-5 Kg.(NOR)', warehouse: 'FS-RM04', qty: 21392, value: 6323565 },
    { item: 'Froz. Salmon H/L COHO 9lbs up', warehouse: 'FS-RM04', qty: 28376, value: 6290617 },
    { item: 'US. Froz. Beef Shortplate', warehouse: 'FS-RM03', qty: 13862, value: 5705854 },
    { item: 'Froz. Salmon C-Trim 0.9-1.2 Kg', warehouse: 'FS-RM03', qty: 13350, value: 5371389 },
    { item: 'Froz. Salmon Trout Headless Chile 4.0 Kg Up', warehouse: 'FS-RM04', qty: 22017, value: 5320994 },
    { item: 'Froz. Salmon Trout Headless 2.7-4.0 Kg', warehouse: 'FS-RM04', qty: 19526, value: 5026153 },
    { item: 'Froz. Aus GF Trimming 65cl (Kilcoy)', warehouse: 'FS-RM03', qty: 24997, value: 4109196 },
    { item: 'Aus. A Rump', warehouse: 'FS-RM03', qty: 13846, value: 3746532 },
    { item: 'Froz. Salmon Gutted 4-5 Kg.(NOR)/Headless', warehouse: 'FS-RM03', qty: 11201, value: 3673836 },
  ],
}

export const INVENTORY_CATALOG: TableMeta[] = [
  { name: 'inv_kpi', description: 'Headline stock KPIs (single row)', columns: [
    { name: 'stock_value', role: 'metric' }, { name: 'active_skus', role: 'metric' },
    { name: 'total_skus', role: 'metric' }, { name: 'warehouses', role: 'metric' },
    { name: 'expired_value', role: 'metric' }, { name: 'expiring_30d', role: 'metric' },
  ] },
  { name: 'inv_group', description: 'Stock value by product group', columns: [
    { name: 'group', role: 'dimension' }, { name: 'value', role: 'metric' }, { name: 'skus', role: 'metric' },
  ] },
  { name: 'inv_monthly', description: 'Monthly goods in vs out', columns: [
    { name: 'month', role: 'date' }, { name: 'in_value', role: 'metric' }, { name: 'out_value', role: 'metric' },
  ] },
  { name: 'inv_warehouse', description: 'Stock value by warehouse', columns: [
    { name: 'warehouse', role: 'dimension' }, { name: 'value', role: 'metric' },
  ] },
  { name: 'inv_aging', description: 'Stock value by lot age', columns: [
    { name: 'bucket', role: 'dimension' }, { name: 'value', role: 'metric' }, { name: 'lots', role: 'metric' },
  ] },
  { name: 'inv_item', description: 'Top items by stock value', columns: [
    { name: 'item', role: 'dimension' }, { name: 'warehouse', role: 'dimension' },
    { name: 'qty', role: 'metric' }, { name: 'value', role: 'metric' },
  ] },
]
