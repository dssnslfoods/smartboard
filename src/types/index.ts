export type Role = 'admin' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface DataSource {
  id: string
  name: string
  url: string
  anonKey: string
  color: string
  description: string
  isActive: boolean
  /** Raw handoff.md content uploaded for this source (schema + report hints). */
  handoff?: string
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

export interface ConnectionStatus {
  state: ConnectionState
  latencyMs?: number
  tableCount?: number
  error?: string
  checkedAt?: number
}

export type WidgetType =
  | 'kpi'
  | 'line'
  | 'bar'
  | 'pie'
  | 'table'
  | 'heatmap'
  | 'gauge'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export type Aggregation = 'sum' | 'avg' | 'count' | 'max' | 'min'

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'

export interface FilterConfig {
  column: string
  operator: FilterOperator
  value: string
}

export interface DateRangeConfig {
  column: string
  preset?: '7d' | '30d' | '90d' | 'ytd' | 'all'
  from?: string
  to?: string
}

export interface QueryConfig {
  table: string
  select: string
  filters?: FilterConfig[]
  dateRange?: DateRangeConfig
  aggregation?: Aggregation
  groupBy?: string
  orderBy?: string
  limit?: number
}

export interface WidgetConfig {
  id: string
  title: string
  sourceId: string
  query: QueryConfig
  visualization: WidgetType
  refreshInterval?: number
  size: WidgetSize
  /** optional per-widget realtime subscription */
  realtime?: boolean
  /** mapping hints for visualizations */
  mapping?: {
    xKey?: string
    yKeys?: string[]
    valueKey?: string
    labelKey?: string
    /** KPI / gauge */
    target?: number
    unit?: string
    prefix?: string
  }
}

export interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  template?: string
  widgets: WidgetConfig[]
  layout: GridLayoutItem[]
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: 'dark' | 'darker'
  defaultDateRange: DateRangeConfig['preset']
  defaultRefreshInterval: number
}

// ── Source schema catalog (what the system "knows" about a source) ────────────
export interface ColumnMeta {
  name: string
  /** semantic role inferred from name/type — drives smart report suggestions */
  role: 'metric' | 'dimension' | 'date' | 'id' | 'text'
  type?: string
}

export interface TableMeta {
  name: string
  description?: string
  columns: ColumnMeta[]
}

export interface SourceCatalog {
  sourceId: string
  tables: TableMeta[]
  /** where the catalog came from */
  origin: 'builtin' | 'handoff' | 'introspected'
}

/** A ready-made report idea suggested for a source. */
export interface ReportSuggestion {
  id: string
  title: string
  description: string
  /** why this fits the source — shown to executives */
  rationale: string
  icon: WidgetType
  widgets: Omit<WidgetConfig, 'id' | 'sourceId'>[]
}
