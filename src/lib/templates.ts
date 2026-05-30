import type { Dashboard, GridLayoutItem, WidgetConfig } from '@/types'
import { DEMO_SOURCE_ID } from './demoData'
import { SNAPSHOT_SOURCE_ID, SNAPSHOT_SOURCE_ID as SS } from './snapshotData'
import { INVENTORY_SOURCE_ID } from './inventorySnapshot'

let counter = 0
const wid = (s: string) => `w_${s}_${counter++}`

function widget(w: Omit<WidgetConfig, 'sourceId'>): WidgetConfig {
  return { sourceId: DEMO_SOURCE_ID, ...w }
}

interface Template {
  template: string
  name: string
  description: string
  widgets: WidgetConfig[]
  layout: GridLayoutItem[]
}

function buildExecutive(): Template {
  const kpiRevenue = widget({
    id: wid('kpi'),
    title: 'Total Revenue',
    query: { table: 'revenue', select: 'revenue', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'revenue', prefix: '$', unit: '' },
  })
  const kpiDeals = widget({
    id: wid('kpi'),
    title: 'Deals Closed',
    query: { table: 'sales', select: 'deals', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'deals' },
  })
  const kpiCustomers = widget({
    id: wid('kpi'),
    title: 'Active Accounts',
    query: { table: 'customers', select: 'id', aggregation: 'count' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'id' },
  })
  const gauge = widget({
    id: wid('gauge'),
    title: 'Quarterly Target',
    query: { table: 'revenue', select: 'revenue', aggregation: 'sum' },
    visualization: 'gauge',
    size: 'sm',
    mapping: { valueKey: 'revenue', target: 5000000, prefix: '$' },
  })
  const line = widget({
    id: wid('line'),
    title: 'Revenue vs Expenses',
    query: { table: 'revenue', select: 'date,revenue,expenses', orderBy: 'date' },
    visualization: 'line',
    size: 'lg',
    mapping: { xKey: 'date', yKeys: ['revenue', 'expenses'] },
  })
  const pie = widget({
    id: wid('pie'),
    title: 'Revenue by Region',
    query: { table: 'sales', select: 'region,amount', groupBy: 'region', aggregation: 'sum' },
    visualization: 'pie',
    size: 'md',
    mapping: { labelKey: 'region', valueKey: 'amount' },
  })
  const table = widget({
    id: wid('table'),
    title: 'Top Accounts',
    query: { table: 'customers', select: 'name,mrr,seats,status,region', orderBy: '-mrr', limit: 25 },
    visualization: 'table',
    size: 'full',
  })

  const widgets = [kpiRevenue, kpiDeals, kpiCustomers, gauge, line, pie, table]
  const layout: GridLayoutItem[] = [
    { i: kpiRevenue.id, x: 0, y: 0, w: 3, h: 3 },
    { i: kpiDeals.id, x: 3, y: 0, w: 3, h: 3 },
    { i: kpiCustomers.id, x: 6, y: 0, w: 3, h: 3 },
    { i: gauge.id, x: 9, y: 0, w: 3, h: 3 },
    { i: line.id, x: 0, y: 3, w: 8, h: 7 },
    { i: pie.id, x: 8, y: 3, w: 4, h: 7 },
    { i: table.id, x: 0, y: 10, w: 12, h: 8 },
  ]
  return {
    template: 'executive',
    name: 'Executive Overview',
    description: 'High-level company health across revenue, sales and accounts.',
    widgets,
    layout,
  }
}

function buildSales(): Template {
  const kpi = widget({
    id: wid('kpi'),
    title: 'Pipeline Value',
    query: { table: 'sales', select: 'amount', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'amount', prefix: '$' },
  })
  const kpiAvg = widget({
    id: wid('kpi'),
    title: 'Avg Deal Size',
    query: { table: 'sales', select: 'amount', aggregation: 'avg' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'amount', prefix: '$' },
  })
  const bar = widget({
    id: wid('bar'),
    title: 'Deals by Channel',
    query: { table: 'sales', select: 'channel,amount', groupBy: 'channel', aggregation: 'sum' },
    visualization: 'bar',
    size: 'lg',
    mapping: { labelKey: 'channel', valueKey: 'amount' },
  })
  const bar2 = widget({
    id: wid('bar'),
    title: 'Pipeline by Region',
    query: { table: 'sales', select: 'region,amount', groupBy: 'region', aggregation: 'sum' },
    visualization: 'bar',
    size: 'md',
    mapping: { labelKey: 'region', valueKey: 'amount' },
  })
  const table = widget({
    id: wid('table'),
    title: 'Recent Deals',
    query: { table: 'sales', select: 'date,rep,channel,region,amount', orderBy: '-date', limit: 50 },
    visualization: 'table',
    size: 'full',
  })
  const widgets = [kpi, kpiAvg, bar, bar2, table]
  const layout: GridLayoutItem[] = [
    { i: kpi.id, x: 0, y: 0, w: 3, h: 3 },
    { i: kpiAvg.id, x: 3, y: 0, w: 3, h: 3 },
    { i: bar.id, x: 0, y: 3, w: 7, h: 7 },
    { i: bar2.id, x: 7, y: 3, w: 5, h: 7 },
    { i: table.id, x: 0, y: 10, w: 12, h: 8 },
  ]
  return {
    template: 'sales',
    name: 'Sales Performance',
    description: 'Pipeline, channel mix and rep activity.',
    widgets,
    layout,
  }
}

function buildOperations(): Template {
  const heat = widget({
    id: wid('heat'),
    title: 'Activity Heatmap',
    query: { table: 'events', select: 'day,hour,count' },
    visualization: 'heatmap',
    size: 'full',
    mapping: { valueKey: 'count' },
  })
  const line = widget({
    id: wid('line'),
    title: 'Latency & Throughput',
    query: { table: 'operations', select: 'date,latency_ms,throughput', orderBy: 'date' },
    visualization: 'line',
    size: 'lg',
    mapping: { xKey: 'date', yKeys: ['latency_ms', 'throughput'] },
  })
  const gauge = widget({
    id: wid('gauge'),
    title: 'Avg Uptime %',
    query: { table: 'operations', select: 'uptime', aggregation: 'avg' },
    visualization: 'gauge',
    size: 'md',
    mapping: { valueKey: 'uptime', target: 100, unit: '%' },
  })
  const widgets = [heat, line, gauge]
  const layout: GridLayoutItem[] = [
    { i: heat.id, x: 0, y: 0, w: 12, h: 8 },
    { i: line.id, x: 0, y: 8, w: 8, h: 7 },
    { i: gauge.id, x: 8, y: 8, w: 4, h: 7 },
  ]
  return {
    template: 'operations',
    name: 'Operations',
    description: 'Operational throughput, latency and reliability.',
    widgets,
    layout,
  }
}

function buildFinance(): Template {
  const kpi = widget({
    id: wid('kpi'),
    title: 'Net Margin',
    query: { table: 'revenue', select: 'revenue', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'revenue', prefix: '$' },
  })
  const line = widget({
    id: wid('line'),
    title: 'Revenue vs Expenses',
    query: { table: 'revenue', select: 'date,revenue,expenses', orderBy: 'date' },
    visualization: 'line',
    size: 'lg',
    mapping: { xKey: 'date', yKeys: ['revenue', 'expenses'] },
  })
  const pie = widget({
    id: wid('pie'),
    title: 'Spend by Region',
    query: { table: 'revenue', select: 'region,expenses', groupBy: 'region', aggregation: 'sum' },
    visualization: 'pie',
    size: 'md',
    mapping: { labelKey: 'region', valueKey: 'expenses' },
  })
  const widgets = [kpi, line, pie]
  const layout: GridLayoutItem[] = [
    { i: kpi.id, x: 0, y: 0, w: 3, h: 3 },
    { i: line.id, x: 0, y: 3, w: 8, h: 7 },
    { i: pie.id, x: 8, y: 3, w: 4, h: 7 },
  ]
  return {
    template: 'finance',
    name: 'Finance',
    description: 'Revenue, expense and margin tracking.',
    widgets,
    layout,
  }
}

function buildSmartSales(): Template {
  const ss = (w: Omit<WidgetConfig, 'sourceId'>): WidgetConfig => ({
    sourceId: SNAPSHOT_SOURCE_ID,
    ...w,
  })

  const kRevenue = ss({
    id: wid('kpi'),
    title: 'Total Revenue (Invoiced)',
    query: { table: 'ss_kpi', select: 'invoiced', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'invoiced', prefix: '฿' },
  })
  const kCollected = ss({
    id: wid('kpi'),
    title: 'Collected (Payments)',
    query: { table: 'ss_kpi', select: 'collected', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'collected', prefix: '฿' },
  })
  const kQuote = ss({
    id: wid('kpi'),
    title: 'Quotation Pipeline',
    query: { table: 'ss_kpi', select: 'quotation_value', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'quotation_value', prefix: '฿' },
  })
  const kAR = ss({
    id: wid('kpi'),
    title: 'A/R Outstanding',
    query: { table: 'ss_kpi', select: 'ar_balance', aggregation: 'sum' },
    visualization: 'kpi',
    size: 'sm',
    mapping: { valueKey: 'ar_balance', prefix: '฿' },
  })
  const line = ss({
    id: wid('line'),
    title: 'Monthly Revenue vs Collections',
    query: { table: 'ss_monthly', select: 'month,revenue,payments', orderBy: 'month' },
    visualization: 'line',
    size: 'lg',
    mapping: { xKey: 'month', yKeys: ['revenue', 'payments'] },
  })
  const gauge = ss({
    id: wid('gauge'),
    title: 'Collection Rate',
    query: { table: 'ss_kpi', select: 'collection_rate', aggregation: 'sum' },
    visualization: 'gauge',
    size: 'md',
    mapping: { valueKey: 'collection_rate', target: 100, unit: '%' },
  })
  const groupBar = ss({
    id: wid('bar'),
    title: 'Revenue by Product Group',
    query: { table: 'ss_item_group', select: 'item_group,revenue', orderBy: '-revenue' },
    visualization: 'bar',
    size: 'lg',
    mapping: { labelKey: 'item_group', valueKey: 'revenue' },
  })
  const statusPie = ss({
    id: wid('pie'),
    title: 'Invoices by Payment Status',
    query: { table: 'ss_payment_status', select: 'status,amount' },
    visualization: 'pie',
    size: 'md',
    mapping: { labelKey: 'status', valueKey: 'amount' },
  })
  const repBar = ss({
    id: wid('bar'),
    title: 'Revenue by Salesperson',
    query: { table: 'ss_salesperson', select: 'salesperson,revenue', orderBy: '-revenue' },
    visualization: 'bar',
    size: 'lg',
    mapping: { labelKey: 'salesperson', valueKey: 'revenue' },
  })
  const quotePie = ss({
    id: wid('pie'),
    title: 'Quotation Pipeline by Status',
    query: { table: 'ss_quote_status', select: 'status,amount' },
    visualization: 'pie',
    size: 'md',
    mapping: { labelKey: 'status', valueKey: 'amount' },
  })
  const custTable = ss({
    id: wid('table'),
    title: 'Top Customers',
    query: { table: 'ss_customer', select: 'customer,revenue,invoices', orderBy: '-revenue' },
    visualization: 'table',
    size: 'lg',
  })
  const itemTable = ss({
    id: wid('table'),
    title: 'Top Items',
    query: { table: 'ss_item', select: 'item,revenue,qty', orderBy: '-revenue' },
    visualization: 'table',
    size: 'lg',
  })

  const widgets = [
    kRevenue, kCollected, kQuote, kAR, line, gauge,
    groupBar, statusPie, repBar, quotePie, custTable, itemTable,
  ]
  const layout: GridLayoutItem[] = [
    { i: kRevenue.id, x: 0, y: 0, w: 3, h: 3 },
    { i: kCollected.id, x: 3, y: 0, w: 3, h: 3 },
    { i: kQuote.id, x: 6, y: 0, w: 3, h: 3 },
    { i: kAR.id, x: 9, y: 0, w: 3, h: 3 },
    { i: line.id, x: 0, y: 3, w: 8, h: 7 },
    { i: gauge.id, x: 8, y: 3, w: 4, h: 7 },
    { i: groupBar.id, x: 0, y: 10, w: 8, h: 7 },
    { i: statusPie.id, x: 8, y: 10, w: 4, h: 7 },
    { i: repBar.id, x: 0, y: 17, w: 8, h: 7 },
    { i: quotePie.id, x: 8, y: 17, w: 4, h: 7 },
    { i: custTable.id, x: 0, y: 24, w: 6, h: 8 },
    { i: itemTable.id, x: 6, y: 24, w: 6, h: 8 },
  ]
  return {
    template: 'smartsales',
    name: 'SmartSales Executive',
    description: 'Real SAP sales report — revenue, collections, products & customers (snapshot 2026-05-30).',
    widgets,
    layout,
  }
}


function buildInventory(): Template {
  const iv = (w: Omit<WidgetConfig, "sourceId">): WidgetConfig => ({ sourceId: INVENTORY_SOURCE_ID, ...w })
  const kStock = iv({ id: wid('kpi'), title: 'Total Stock Value', query: { table: 'inv_kpi', select: 'stock_value', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'stock_value', prefix: '฿' } })
  const kSku = iv({ id: wid('kpi'), title: 'Active SKUs', query: { table: 'inv_kpi', select: 'active_skus', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'active_skus' } })
  const kExpired = iv({ id: wid('kpi'), title: 'Expired Value', query: { table: 'inv_kpi', select: 'expired_value', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'expired_value', prefix: '฿' } })
  const kExpiring = iv({ id: wid('kpi'), title: 'Lots Expiring 30d', query: { table: 'inv_kpi', select: 'expiring_30d', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'expiring_30d' } })
  const line = iv({ id: wid('line'), title: 'Monthly Goods In vs Out', query: { table: 'inv_monthly', select: 'month,in_value,out_value', orderBy: 'month' }, visualization: 'line', size: 'lg', mapping: { xKey: 'month', yKeys: ['in_value','out_value'] } })
  const groupPie = iv({ id: wid('pie'), title: 'Stock by Product Group', query: { table: 'inv_group', select: 'group,value' }, visualization: 'pie', size: 'md', mapping: { labelKey: 'group', valueKey: 'value' } })
  const whBar = iv({ id: wid('bar'), title: 'Stock Value by Warehouse', query: { table: 'inv_warehouse', select: 'warehouse,value', orderBy: '-value' }, visualization: 'bar', size: 'lg', mapping: { labelKey: 'warehouse', valueKey: 'value' } })
  const agingBar = iv({ id: wid('bar'), title: 'Stock Value by Lot Age', query: { table: 'inv_aging', select: 'bucket,value' }, visualization: 'bar', size: 'md', mapping: { labelKey: 'bucket', valueKey: 'value' } })
  const itemTable = iv({ id: wid('table'), title: 'Top Items by Value', query: { table: 'inv_item', select: 'item,warehouse,qty,value', orderBy: '-value' }, visualization: 'table', size: 'full' })
  const widgets: WidgetConfig[] = [kStock, kSku, kExpired, kExpiring, line, groupPie, whBar, agingBar, itemTable]
  const layout: GridLayoutItem[] = [
    { i: kStock.id, x: 0, y: 0, w: 3, h: 3 },
    { i: kSku.id, x: 3, y: 0, w: 3, h: 3 },
    { i: kExpired.id, x: 6, y: 0, w: 3, h: 3 },
    { i: kExpiring.id, x: 9, y: 0, w: 3, h: 3 },
    { i: line.id, x: 0, y: 3, w: 8, h: 7 },
    { i: groupPie.id, x: 8, y: 3, w: 4, h: 7 },
    { i: whBar.id, x: 0, y: 10, w: 8, h: 7 },
    { i: agingBar.id, x: 8, y: 10, w: 4, h: 7 },
    { i: itemTable.id, x: 0, y: 17, w: 12, h: 8 },
  ]
  return { template: 'inventory', name: 'Inventory Overview', description: 'Frozen food-service stock value, movement, aging and expiry (snapshot 2026-05-30).', widgets, layout }
}

function buildGroupExecutive(): Template {
  const rev = { sourceId: SS, id: wid('kpi'), title: 'Sales Revenue', query: { table: 'ss_kpi', select: 'invoiced', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'invoiced', prefix: '฿' } } as WidgetConfig
  const ar = { sourceId: SS, id: wid('kpi'), title: 'A/R Outstanding', query: { table: 'ss_kpi', select: 'ar_balance', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'ar_balance', prefix: '฿' } } as WidgetConfig
  const stock = { sourceId: INVENTORY_SOURCE_ID, id: wid('kpi'), title: 'Stock Value', query: { table: 'inv_kpi', select: 'stock_value', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'stock_value', prefix: '฿' } } as WidgetConfig
  const expired = { sourceId: INVENTORY_SOURCE_ID, id: wid('kpi'), title: 'Expired Stock', query: { table: 'inv_kpi', select: 'expired_value', aggregation: 'sum' }, visualization: 'kpi', size: 'sm', mapping: { valueKey: 'expired_value', prefix: '฿' } } as WidgetConfig
  const salesLine = { sourceId: SS, id: wid('line'), title: 'Sales: Revenue vs Collections', query: { table: 'ss_monthly', select: 'month,revenue,payments', orderBy: 'month' }, visualization: 'line', size: 'lg', mapping: { xKey: 'month', yKeys: ['revenue','payments'] } } as WidgetConfig
  const invLine = { sourceId: INVENTORY_SOURCE_ID, id: wid('line'), title: 'Inventory: Goods In vs Out', query: { table: 'inv_monthly', select: 'month,in_value,out_value', orderBy: 'month' }, visualization: 'line', size: 'lg', mapping: { xKey: 'month', yKeys: ['in_value','out_value'] } } as WidgetConfig
  const salesGroup = { sourceId: SS, id: wid('bar'), title: 'Sales by Product Group', query: { table: 'ss_item_group', select: 'item_group,revenue', orderBy: '-revenue' }, visualization: 'bar', size: 'md', mapping: { labelKey: 'item_group', valueKey: 'revenue' } } as WidgetConfig
  const invGroup = { sourceId: INVENTORY_SOURCE_ID, id: wid('pie'), title: 'Stock by Group', query: { table: 'inv_group', select: 'group,value' }, visualization: 'pie', size: 'md', mapping: { labelKey: 'group', valueKey: 'value' } } as WidgetConfig
  const widgets: WidgetConfig[] = [rev, ar, stock, expired, salesLine, invLine, salesGroup, invGroup]
  const layout: GridLayoutItem[] = [
    { i: rev.id, x: 0, y: 0, w: 3, h: 3 },
    { i: ar.id, x: 3, y: 0, w: 3, h: 3 },
    { i: stock.id, x: 6, y: 0, w: 3, h: 3 },
    { i: expired.id, x: 9, y: 0, w: 3, h: 3 },
    { i: salesLine.id, x: 0, y: 3, w: 6, h: 7 },
    { i: invLine.id, x: 6, y: 3, w: 6, h: 7 },
    { i: salesGroup.id, x: 0, y: 10, w: 6, h: 7 },
    { i: invGroup.id, x: 6, y: 10, w: 6, h: 7 },
  ]
  return { template: 'group-exec', name: 'Group Executive (Cross-Source)', description: 'Sales (SmartSales) + Inventory combined — one board, two data sources.', widgets, layout }
}

export const TEMPLATES = [
  { id: 'smartsales', name: 'SmartSales Executive', build: buildSmartSales },
  { id: 'executive', name: 'Executive Overview', build: buildExecutive },
  { id: 'sales', name: 'Sales Performance', build: buildSales },
  { id: 'operations', name: 'Operations', build: buildOperations },
  { id: 'finance', name: 'Finance', build: buildFinance },
  { id: 'inventory', name: 'Inventory Overview', build: buildInventory },
  { id: 'group-exec', name: 'Group Executive (Cross-Source)', build: buildGroupExecutive },
] as const

/** Seed the initial dashboard set (used on first load / when storage empty). */
export function seedDashboards(): Dashboard[] {
  const now = Date.now()
  return TEMPLATES.map((t, idx) => {
    counter = idx * 1000 // keep ids stable & unique per template
    const built = t.build()
    return {
      id: `dash_${t.id}`,
      name: built.name,
      description: built.description,
      template: built.template,
      widgets: built.widgets,
      layout: built.layout,
      createdAt: now,
      updatedAt: now,
    }
  })
}
