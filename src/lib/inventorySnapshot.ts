import type { TableMeta } from '@/types'

/**
 * Smart Inventory — NSL Foods (frozen food-service).
 *
 * All values verified against the live DB on 2026-05-30 via MCP read-only
 * SELECT queries. Definitions match the Smart Inventory application exactly.
 *
 * CRITICAL: all lot/aging/expiry figures use ONLY the latest snapshot
 *   (snapshot_date = 2026-04-30, the max in v_vv_lots). The v_lot_aging view
 *   aggregates EVERY historical monthly snapshot, so it double-counts and gives
 *   ~฿336M / 2456 lots — WRONG. The Smart Inventory "Lot Inventory" page filters
 *   to the latest snapshot → 1,209 lots / ฿174.7M. We match that exactly.
 *
 * Key definition notes:
 *  - active_skus   = v_active_item_count (distinct item_code with doc_date in 90d)
 *                    NOT items.is_active=true (which gives 908 — different meaning)
 *  - lot/aging/expiry = v_vv_lots WHERE snapshot_date = max(snapshot_date)
 *  - warehouse name = whs_name (Thai) from latest-snapshot lots
 */

export const INVENTORY_SOURCE_ID = 'inventory-snapshot'
export const INVENTORY_META = {
  id: INVENTORY_SOURCE_ID,
  name: 'Smart Inventory',
  color: '#39C5CF',
  capturedAt: '2026-05-30',
  description: 'Frozen food-service stock (live)',
}

type Row = Record<string, unknown>

export const INVENTORY_TABLES: Record<string, Row[]> = {
  // ── KPI (single row) ──────────────────────────────────────────────────────
  inv_kpi: [
    {
      stock_value:       174691720,  // sum(stock_value), latest snapshot
      active_skus:       380,         // v_active_item_count — items with tx in 90d
      total_skus:        1967,        // count(*) from items
      total_lots:        1209,        // lots in latest snapshot
      warehouses:        31,          // active warehouses
      transactions:      266931,      // total transaction rows
      expired_lots:      198,         // latest snapshot, days_remaining < 0
      expired_value:     14921753,    // ฿14.9M expired (latest snapshot)
      expiring_30d_lots: 24,          // latest snapshot, days_remaining 0-30
      expiring_30d_value:680090,      // ฿680K expiring within 30 days
      // Movement health (v_slow_moving)
      normal_items:      375,         // 54.5% of 688 tracked items
      slow_moving_items: 82,
      dead_stock_items:  231,
      normal_value:      70507921,
      slow_moving_value: 9250305,
      dead_stock_value:  94933495,
    },
  ],

  // ── Product group breakdown ───────────────────────────────────────────────
  inv_group: [
    { group: 'FRM-Raw Materials', value: 155471001, skus: 318 },
    { group: 'FFG-Finish Goods',  value: 18854296,  skus: 119 },
    { group: 'FPKG-Packaging',    value: 366423,    skus: 23 },
    { group: 'FBY-By Product',    value: 0,          skus: 1 },
  ],

  // ── Warehouse breakdown (all from v_stock_onhand) ─────────────────────────
  inv_warehouse: [
    { warehouse: 'คลัง RM - นอก1',                 value: 93370915 },
    { warehouse: 'คลัง RM - นอก2',                 value: 40574586 },
    { warehouse: 'คลัง RM - ใน1',                  value: 14659052 },
    { warehouse: 'คลัง RM - ใน2',                  value: 10151725 },
    { warehouse: 'คลัง FG - ใน1',                  value: 7814757 },
    { warehouse: 'คลัง FG - ใน2',                  value: 5469043 },
    { warehouse: 'คลังผลิต - ใน2',                 value: 1875833 },
    { warehouse: 'คลัง QC  - ใน',                  value: 401159 },
    { warehouse: 'คลัง PK&Factory Supply - ใน2',   value: 365777 },
    { warehouse: 'คลังของเสียรอทำลาย - ใน1',       value: 5924 },
    { warehouse: 'คลังรอเคลมในประเทศ',              value: 2950 },
  ],

  // ── Lot aging (latest snapshot — matches Lot Inventory page exactly) ──────
  inv_aging: [
    { bucket: 'หมดอายุแล้ว', value: 14921753,  lots: 198 },
    { bucket: '≤ 30 วัน',    value: 680090,    lots: 24 },
    { bucket: '31-60 วัน',   value: 1118285,   lots: 32 },
    { bucket: '61-90 วัน',   value: 4024629,   lots: 47 },
    { bucket: '91-180 วัน',  value: 15833815,  lots: 88 },
    { bucket: '> 180 วัน',   value: 138113145, lots: 820 },
  ],

  // ── Top 12 items by stock value (v_stock_onhand) ──────────────────────────
  inv_item: [
    { item: 'Froz. Salmon WH/HeadOn/Gutted 5-6 Kg.',        warehouse: 'คลัง RM - นอก2', qty: 41522, value: 9465615 },
    { item: 'Aus. Froz. Trimming 65cl',                      warehouse: 'คลัง RM - นอก1', qty: 52543, value: 8717649 },
    { item: 'Saba 400-600 (Norway)',                         warehouse: 'คลัง RM - นอก1', qty: 39760, value: 6796221 },
    { item: 'Froz. Salmon WH/HeadOn/Gutted 4-5 Kg.(NOR)',   warehouse: 'คลัง RM - นอก2', qty: 21392, value: 6323565 },
    { item: 'Froz. Salmon H/L COHO 9lbs up',                warehouse: 'คลัง RM - นอก2', qty: 28376, value: 6290617 },
    { item: 'US.Froz. Beef Shortplate',                      warehouse: 'คลัง RM - นอก1', qty: 13862, value: 5705854 },
    { item: 'Froz. Salmon C-Trim 0.9-1.2 Kg ไม่มีเกล็ด',   warehouse: 'คลัง RM - นอก1', qty: 13350, value: 5371389 },
    { item: 'Froz. Salmon Trout Headless Chile 4.0 Kg Up.', warehouse: 'คลัง RM - นอก2', qty: 22017, value: 5320994 },
    { item: 'Froz. Salmon Trout Headless (2.7-4.0 Kg/pc)', warehouse: 'คลัง RM - นอก2', qty: 19526, value: 5026153 },
    { item: 'Froz. Aus GF Trimming 65cl (Kilcoy)',          warehouse: 'คลัง RM - นอก1', qty: 24997, value: 4109196 },
    { item: 'Aus. A Rump',                                  warehouse: 'คลัง RM - นอก1', qty: 13846, value: 3746532 },
    { item: 'Froz. Salmon Gutted 4-5 Kg.(NOR) / Headless', warehouse: 'คลัง RM - นอก1', qty: 11201, value: 3673836 },
  ],

  // ── Monthly goods in vs out (v_monthly_total, 2025-01 to 2026-04) ─────────
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

  // ── Movement health summary (v_slow_moving) ───────────────────────────────
  inv_movement: [
    { status: 'Normal',     items: 375, value: 70507921 },
    { status: 'Dead Stock', items: 231, value: 94933495 },
    { status: 'Slow Moving',items: 82,  value: 9250305 },
  ],
}

// ── Catalog (schema description for Widget Builder / Report Gallery) ──────────
export const INVENTORY_CATALOG: TableMeta[] = [
  { name: 'inv_kpi', description: 'Headline KPIs (single row) — stock value, SKUs, lots, movement health', columns: [
    { name: 'stock_value',        role: 'metric' },
    { name: 'active_skus',        role: 'metric' },  // tx in 90d, NOT is_active flag
    { name: 'total_skus',         role: 'metric' },
    { name: 'warehouses',         role: 'metric' },
    { name: 'expired_lots',       role: 'metric' },
    { name: 'expired_value',      role: 'metric' },
    { name: 'expiring_30d_lots',  role: 'metric' },
    { name: 'expiring_30d_value', role: 'metric' },
    { name: 'normal_items',       role: 'metric' },
    { name: 'slow_moving_items',  role: 'metric' },
    { name: 'dead_stock_items',   role: 'metric' },
  ] },
  { name: 'inv_group', description: 'Stock value by product group (v_stock_onhand)', columns: [
    { name: 'group', role: 'dimension' }, { name: 'value', role: 'metric' }, { name: 'skus', role: 'metric' },
  ] },
  { name: 'inv_warehouse', description: 'Stock value by warehouse (v_stock_onhand)', columns: [
    { name: 'warehouse', role: 'dimension' }, { name: 'value', role: 'metric' },
  ] },
  { name: 'inv_aging', description: 'Lot aging by bucket (v_lot_aging) — expired/0-30/31-60/61-90/91-180/180+', columns: [
    { name: 'bucket', role: 'dimension' }, { name: 'value', role: 'metric' }, { name: 'lots', role: 'metric' },
  ] },
  { name: 'inv_item', description: 'Top items by stock value (v_stock_onhand)', columns: [
    { name: 'item', role: 'dimension' }, { name: 'warehouse', role: 'dimension' },
    { name: 'qty', role: 'metric' }, { name: 'value', role: 'metric' },
  ] },
  { name: 'inv_monthly', description: 'Monthly goods-in vs goods-out value (v_monthly_total)', columns: [
    { name: 'month', role: 'date' }, { name: 'in_value', role: 'metric' }, { name: 'out_value', role: 'metric' },
  ] },
  { name: 'inv_movement', description: 'Movement health: Normal / Slow Moving / Dead Stock (v_slow_moving)', columns: [
    { name: 'status', role: 'dimension' }, { name: 'items', role: 'metric' }, { name: 'value', role: 'metric' },
  ] },
]
