import type {
  ColumnMeta,
  ReportSuggestion,
  SourceCatalog,
  TableMeta,
  WidgetConfig,
} from '@/types'
import { DEMO_SOURCE_ID, DEMO_TABLES } from './demoData'
import { SNAPSHOT_SOURCE_ID, SNAPSHOT_TABLES } from './snapshotData'
import { parseHandoff, inferRole } from './handoff'
import { useDataSourceStore } from '@/stores/dataSourceStore'

// ── Built-in catalogs (the system already understands these) ──────────────────

const c = (name: string, role: ColumnMeta['role']): ColumnMeta => ({ name, role })

const DEMO_CATALOG: TableMeta[] = [
  { name: 'revenue', description: 'Daily revenue & expenses', columns: [c('date', 'date'), c('revenue', 'metric'), c('expenses', 'metric'), c('region', 'dimension')] },
  { name: 'sales', description: 'Sales deals', columns: [c('date', 'date'), c('deals', 'metric'), c('amount', 'metric'), c('rep', 'dimension'), c('channel', 'dimension'), c('region', 'dimension')] },
  { name: 'customers', description: 'Customer accounts', columns: [c('id', 'id'), c('name', 'text'), c('mrr', 'metric'), c('seats', 'metric'), c('status', 'dimension'), c('region', 'dimension'), c('health', 'metric')] },
  { name: 'events', description: '7x24 activity', columns: [c('day', 'dimension'), c('hour', 'dimension'), c('count', 'metric')] },
  { name: 'operations', description: 'Ops metrics', columns: [c('date', 'date'), c('uptime', 'metric'), c('incidents', 'metric'), c('latency_ms', 'metric'), c('throughput', 'metric')] },
]

const SNAPSHOT_CATALOG: TableMeta[] = [
  { name: 'ss_kpi', description: 'Headline KPIs (single row)', columns: [c('invoiced', 'metric'), c('collected', 'metric'), c('quotation_value', 'metric'), c('ar_balance', 'metric'), c('avg_invoice', 'metric'), c('collection_rate', 'metric'), c('invoices', 'metric'), c('customers', 'metric')] },
  { name: 'ss_monthly', description: 'Monthly revenue vs payments', columns: [c('month', 'date'), c('revenue', 'metric'), c('payments', 'metric')] },
  { name: 'ss_item_group', description: 'Revenue by product group', columns: [c('item_group', 'dimension'), c('revenue', 'metric')] },
  { name: 'ss_customer', description: 'Top customers', columns: [c('customer', 'dimension'), c('revenue', 'metric'), c('invoices', 'metric')] },
  { name: 'ss_payment_status', description: 'Invoices by payment status', columns: [c('status', 'dimension'), c('invoices', 'metric'), c('amount', 'metric')] },
  { name: 'ss_salesperson', description: 'Revenue by salesperson', columns: [c('salesperson', 'dimension'), c('revenue', 'metric'), c('invoices', 'metric')] },
  { name: 'ss_item', description: 'Top items', columns: [c('item', 'dimension'), c('revenue', 'metric'), c('qty', 'metric')] },
  { name: 'ss_quote_status', description: 'Quotations by status', columns: [c('status', 'dimension'), c('quotes', 'metric'), c('amount', 'metric')] },
]

void DEMO_TABLES
void SNAPSHOT_TABLES

/** Resolve the catalog the system knows for a given source. */
export function getCatalog(sourceId: string): SourceCatalog {
  if (sourceId === DEMO_SOURCE_ID) return { sourceId, tables: DEMO_CATALOG, origin: 'builtin' }
  if (sourceId === SNAPSHOT_SOURCE_ID) return { sourceId, tables: SNAPSHOT_CATALOG, origin: 'builtin' }

  // user source — parse its uploaded handoff if any
  const src = useDataSourceStore.getState().sources.find((s) => s.id === sourceId)
  if (src?.handoff) {
    const tables = parseHandoff(src.handoff)
    if (tables.length) return { sourceId, tables, origin: 'handoff' }
  }
  return { sourceId, tables: [], origin: 'introspected' }
}

// ── Smart report suggestion engine ────────────────────────────────────────────

type W = Omit<WidgetConfig, 'id' | 'sourceId'>

function firstMetric(t: TableMeta) { return t.columns.find((x) => x.role === 'metric') }
function firstDate(t: TableMeta) { return t.columns.find((x) => x.role === 'date') }
function firstDim(t: TableMeta) { return t.columns.find((x) => x.role === 'dimension') }

/**
 * Generate ready-made report ideas tailored to a source's schema.
 * Pure heuristics over column roles — no LLM needed, deterministic & instant.
 */
export function suggestReports(sourceId: string): ReportSuggestion[] {
  const cat = getCatalog(sourceId)
  if (!cat.tables.length) return []

  const out: ReportSuggestion[] = []

  // 1) KPI scorecard — pick metric tables
  const metricTables = cat.tables.filter((t) => t.columns.some((c2) => c2.role === 'metric'))
  if (metricTables.length) {
    const kpis: W[] = metricTables.slice(0, 4).map((t) => {
      const m = firstMetric(t)!
      return {
        title: `${t.name} · ${m.name}`,
        query: { table: t.name, select: m.name, aggregation: 'sum' },
        visualization: 'kpi',
        size: 'sm',
        mapping: { valueKey: m.name },
      }
    })
    out.push({
      id: 'kpi-scorecard',
      title: 'Executive Scorecard',
      description: 'หน้าสรุป KPI หลักจากทุกตารางที่มีตัวเลข',
      rationale: `พบ ${metricTables.length} ตารางที่มี metric — เหมาะทำ KPI cards สรุปภาพรวม`,
      icon: 'kpi',
      widgets: kpis,
    })
  }

  // 2) Trend over time — needs a date + metric in the same table
  const tsTable = cat.tables.find((t) => firstDate(t) && firstMetric(t))
  if (tsTable) {
    const date = firstDate(tsTable)!
    const metrics = tsTable.columns.filter((x) => x.role === 'metric').slice(0, 2)
    out.push({
      id: 'time-trend',
      title: 'Trend Analysis',
      description: `แนวโน้ม ${metrics.map((m) => m.name).join(' & ')} ตามช่วงเวลา`,
      rationale: `ตาราง "${tsTable.name}" มีคอลัมน์วันที่ (${date.name}) + ตัวเลข — เหมาะทำกราฟเส้น`,
      icon: 'line',
      widgets: [
        {
          title: `${tsTable.name} trend`,
          query: { table: tsTable.name, select: [date.name, ...metrics.map((m) => m.name)].join(','), orderBy: date.name },
          visualization: 'line',
          size: 'lg',
          mapping: { xKey: date.name, yKeys: metrics.map((m) => m.name) },
        },
      ],
    })
  }

  // 3) Breakdown by dimension — dimension + metric
  const dimTable = cat.tables.find((t) => firstDim(t) && firstMetric(t))
  if (dimTable) {
    const dim = firstDim(dimTable)!
    const metric = firstMetric(dimTable)!
    out.push({
      id: 'breakdown',
      title: 'Category Breakdown',
      description: `สัดส่วน ${metric.name} แยกตาม ${dim.name}`,
      rationale: `ตาราง "${dimTable.name}" มีมิติ (${dim.name}) + ตัวเลข — เหมาะทำ bar/donut`,
      icon: 'bar',
      widgets: [
        {
          title: `${metric.name} by ${dim.name}`,
          query: { table: dimTable.name, select: `${dim.name},${metric.name}`, groupBy: dim.name, aggregation: 'sum', orderBy: `-${metric.name}` },
          visualization: 'bar',
          size: 'lg',
          mapping: { labelKey: dim.name, valueKey: metric.name },
        },
        {
          title: `${metric.name} share`,
          query: { table: dimTable.name, select: `${dim.name},${metric.name}`, groupBy: dim.name, aggregation: 'sum' },
          visualization: 'pie',
          size: 'md',
          mapping: { labelKey: dim.name, valueKey: metric.name },
        },
      ],
    })
  }

  // 4) Detail table — any table with several columns
  const detailTable = cat.tables.find((t) => t.columns.length >= 3)
  if (detailTable) {
    const cols = detailTable.columns.slice(0, 6).map((x) => x.name).join(',')
    const sortMetric = firstMetric(detailTable)
    out.push({
      id: 'detail-table',
      title: 'Detail Explorer',
      description: `ตารางรายละเอียดของ ${detailTable.name} พร้อมค้นหา/ส่งออก CSV`,
      rationale: `ตาราง "${detailTable.name}" มีหลายคอลัมน์ — เหมาะดูแบบ data table`,
      icon: 'table',
      widgets: [
        {
          title: `${detailTable.name} records`,
          query: { table: detailTable.name, select: cols, orderBy: sortMetric ? `-${sortMetric.name}` : undefined, limit: 50 },
          visualization: 'table',
          size: 'full',
        },
      ],
    })
  }

  return out
}

/** Build full WidgetConfig list from a suggestion, ready to add to a dashboard. */
export function materializeSuggestion(
  sourceId: string,
  s: ReportSuggestion,
  makeId: () => string
): WidgetConfig[] {
  return s.widgets.map((w) => ({ ...w, id: makeId(), sourceId }))
}

/** Re-export role inference for builder UI. */
export { inferRole }
