import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Check,
  Gauge,
  Grid3x3,
  LineChart,
  PieChart,
  Plus,
  Save,
  Table,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import type {
  Aggregation,
  FilterConfig,
  FilterOperator,
  WidgetConfig,
  WidgetSize,
  WidgetType,
} from '@/types'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import { useSourceActiveStore } from '@/stores/sourceActiveStore'
import { getCatalog } from '@/lib/sourceCatalog'
import { toSQL } from '@/lib/queryEngine'
import { uid } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { cn } from '@/lib/utils'

const VIZ: { type: WidgetType; label: string; icon: typeof LineChart }[] = [
  { type: 'kpi', label: 'KPI Card', icon: TrendingUp },
  { type: 'line', label: 'Line', icon: LineChart },
  { type: 'bar', label: 'Bar', icon: BarChart3 },
  { type: 'pie', label: 'Donut', icon: PieChart },
  { type: 'gauge', label: 'Gauge', icon: Gauge },
  { type: 'heatmap', label: 'Heatmap', icon: Grid3x3 },
  { type: 'table', label: 'Table', icon: Table },
]

const OPERATORS: FilterOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike']

interface BuilderState {
  title: string
  sourceId: string
  table: string
  select: string
  aggregation: '' | Aggregation
  groupBy: string
  orderBy: string
  limit: string
  filters: FilterConfig[]
  visualization: WidgetType
  size: WidgetSize
  refreshInterval: number
  xKey: string
  yKeys: string
  valueKey: string
  labelKey: string
  target: string
  prefix: string
  unit: string
}

export function WidgetBuilderPage() {
  const navigate = useNavigate()
  const sources = useDataSourceStore((s) => s.sources)
  const { dashboards, addWidget } = useDashboardStore()
  const defaultRefresh = useSettingsStore((s) => s.defaultRefreshInterval)
  // Subscribe so the source dropdown re-renders when active toggles change.
  const activeMap = useSourceActiveStore((s) => s.map)
  void activeMap

  const [step, setStep] = useState(1)
  const [targetDashboard, setTargetDashboard] = useState(dashboards[0]?.id ?? '')
  const [saved, setSaved] = useState(false)
  const [st, setSt] = useState<BuilderState>({
    title: 'Untitled widget',
    sourceId: DEMO_SOURCE_ID,
    table: 'revenue',
    select: 'date,revenue,expenses',
    aggregation: '',
    groupBy: '',
    orderBy: 'date',
    limit: '',
    filters: [],
    visualization: 'line',
    size: 'lg',
    refreshInterval: defaultRefresh,
    xKey: 'date',
    yKeys: 'revenue,expenses',
    valueKey: '',
    labelKey: '',
    target: '',
    prefix: '',
    unit: '',
  })

  const set = <K extends keyof BuilderState>(k: K, v: BuilderState[K]) =>
    setSt((s) => ({ ...s, [k]: v }))

  const config: WidgetConfig = useMemo(
    () => ({
      id: 'preview',
      title: st.title || 'Untitled',
      sourceId: st.sourceId,
      query: {
        table: st.table,
        select: st.select,
        aggregation: st.aggregation || undefined,
        groupBy: st.groupBy || undefined,
        orderBy: st.orderBy || undefined,
        limit: st.limit ? Number(st.limit) : undefined,
        filters: st.filters.filter((f) => f.column && f.value),
      },
      visualization: st.visualization,
      size: st.size,
      refreshInterval: st.refreshInterval || undefined,
      mapping: {
        xKey: st.xKey || undefined,
        yKeys: st.yKeys ? st.yKeys.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        valueKey: st.valueKey || undefined,
        labelKey: st.labelKey || undefined,
        target: st.target ? Number(st.target) : undefined,
        prefix: st.prefix || undefined,
        unit: st.unit || undefined,
      },
    }),
    [st]
  )

  const sql = useMemo(() => toSQL(config.query), [config.query])

  // Catalog-driven: tables + columns the system knows for the selected source
  const catalog = useMemo(() => getCatalog(st.sourceId), [st.sourceId])
  const tableOptions = catalog.tables.map((t) => ({ value: t.name, label: t.name }))
  const activeTable = catalog.tables.find((t) => t.name === st.table)
  const columnMeta = activeTable?.columns ?? []
  const metricCols = columnMeta.filter((c) => c.role === 'metric')
  const dimCols = columnMeta.filter((c) => c.role === 'dimension')
  const dateCols = columnMeta.filter((c) => c.role === 'date')

  const addFilter = () =>
    set('filters', [...st.filters, { column: '', operator: 'eq', value: '' }])
  const updateFilter = (i: number, patch: Partial<FilterConfig>) =>
    set('filters', st.filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  const removeFilter = (i: number) =>
    set('filters', st.filters.filter((_, idx) => idx !== i))

  const save = () => {
    if (!targetDashboard) return
    const widget: WidgetConfig = { ...config, id: uid('w') }
    addWidget(targetDashboard, widget)
    setSaved(true)
    setTimeout(() => navigate(`/dashboard/${targetDashboard}`), 600)
  }

  const STEPS = ['Source', 'Table', 'Query', 'Visualization', 'Preview & Save']

  return (
    <div className="pb-10">
      <PageHeader title="Widget Builder" subtitle="Visually compose a query and choose a visualization." />

      {/* Stepper */}
      <div className="flex items-center gap-2 px-6 py-3">
        {STEPS.map((label, i) => {
          const n = i + 1
          return (
            <button
              key={label}
              onClick={() => setStep(n)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                step === n
                  ? 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue'
                  : 'border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <span className="font-data">{n}</span> {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-2 lg:grid-cols-[1fr_1.1fr]">
        {/* Config panel */}
        <div className="card space-y-5 p-5">
          {step === 1 && (
            <div className="space-y-3">
              <Field label="Data source">
                <Select
                  value={st.sourceId}
                  onChange={(e) => { set('sourceId', e.target.value); set('table', ''); set('select', '') }}
                  options={[
                    ...SNAPSHOT_SOURCES.map((s) => ({ value: s.id, label: s.name })),
                    { value: DEMO_SOURCE_ID, label: 'Demo data' },
                    ...sources.map((s) => ({ value: s.id, label: s.name })),
                  ].filter((o) => useSourceActiveStore.getState().isActive(o.value))}
                />
              </Field>
              <div className="rounded-lg border border-border bg-bg-secondary/40 p-3 text-xs">
                {catalog.tables.length ? (
                  <span className="text-accent-green">
                    ✓ ระบบรู้จัก schema นี้ ({catalog.origin === 'handoff' ? 'handoff.md' : 'built-in'}) —
                    {' '}{catalog.tables.length} tables, เลือก table/column ได้จาก dropdown
                  </span>
                ) : (
                  <span className="text-accent-amber">
                    ⚠ ไม่มี schema สำหรับ source นี้ — อัปโหลด handoff.md ที่หน้า Sources เพื่อให้เลือก table/column ได้ถูกต้อง
                    (ระหว่างนี้พิมพ์ชื่อ table/column เองได้)
                  </span>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Table / view" hint={tableOptions.length ? 'เลือกจาก schema ที่ระบบรู้จัก' : 'Type the table name exposed via PostgREST.'}>
                {tableOptions.length ? (
                  <Select value={st.table} onChange={(e) => set('table', e.target.value)} placeholder="Select a table" options={tableOptions} />
                ) : (
                  <Input value={st.table} onChange={(e) => set('table', e.target.value)} placeholder="public_table" />
                )}
              </Field>

              {/* Column picker chips when catalog known */}
              {columnMeta.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-medium text-text-secondary">Columns (คลิกเพื่อเพิ่ม)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {columnMeta.map((col) => {
                      const sel = st.select.split(',').map((s) => s.trim()).includes(col.name)
                      const tone = col.role === 'metric' ? 'text-accent-green border-accent-green/30'
                        : col.role === 'date' ? 'text-accent-blue border-accent-blue/30'
                        : col.role === 'dimension' ? 'text-accent-purple border-accent-purple/30'
                        : 'text-text-secondary border-border'
                      return (
                        <button
                          key={col.name}
                          onClick={() => {
                            const cur = st.select.split(',').map((s) => s.trim()).filter(Boolean)
                            const next = sel ? cur.filter((x) => x !== col.name) : [...cur, col.name]
                            set('select', next.join(','))
                          }}
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-data transition-colors',
                            sel ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : `bg-bg-secondary ${tone} hover:bg-bg-card`
                          )}
                          title={col.role}
                        >
                          {col.name}
                          <span className="ml-1 opacity-50">{col.role[0]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Field label="Select columns" hint="Comma-separated, or * for all.">
                <Input value={st.select} onChange={(e) => set('select', e.target.value)} className="font-data text-xs" placeholder="col1,col2" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Aggregation">
                  <Select
                    value={st.aggregation}
                    onChange={(e) => set('aggregation', e.target.value as Aggregation | '')}
                    options={[
                      { value: '', label: 'None (raw rows)' },
                      { value: 'sum', label: 'Sum' },
                      { value: 'avg', label: 'Average' },
                      { value: 'count', label: 'Count' },
                      { value: 'max', label: 'Max' },
                      { value: 'min', label: 'Min' },
                    ]}
                  />
                </Field>
                <Field label="Group by" hint={dimCols.length ? `dims: ${dimCols.map((c) => c.name).join(', ')}` : undefined}>
                  {dimCols.length ? (
                    <Select
                      value={st.groupBy}
                      onChange={(e) => set('groupBy', e.target.value)}
                      placeholder="(none)"
                      options={[{ value: '', label: '(none)' }, ...dimCols.map((c) => ({ value: c.name, label: c.name }))]}
                    />
                  ) : (
                    <Input value={st.groupBy} onChange={(e) => set('groupBy', e.target.value)} placeholder="region" />
                  )}
                </Field>
                <Field label="Order by" hint={(metricCols.length || dateCols.length) ? 'prefix - for desc' : 'Prefix with - for descending.'}>
                  {(metricCols.length || dateCols.length) ? (
                    <Select
                      value={st.orderBy}
                      onChange={(e) => set('orderBy', e.target.value)}
                      placeholder="(none)"
                      options={[
                        { value: '', label: '(none)' },
                        ...[...dateCols, ...metricCols].flatMap((c) => [
                          { value: c.name, label: `${c.name} ↑` },
                          { value: `-${c.name}`, label: `${c.name} ↓` },
                        ]),
                      ]}
                    />
                  ) : (
                    <Input value={st.orderBy} onChange={(e) => set('orderBy', e.target.value)} placeholder="-amount" />
                  )}
                </Field>
                <Field label="Limit">
                  <Input value={st.limit} onChange={(e) => set('limit', e.target.value)} placeholder="50" inputMode="numeric" />
                </Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Filters</span>
                  <Button variant="ghost" size="sm" onClick={addFilter}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {st.filters.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={f.column}
                        onChange={(e) => updateFilter(i, { column: e.target.value })}
                        placeholder="column"
                        className="h-8 text-xs"
                      />
                      <Select
                        value={f.operator}
                        onChange={(e) => updateFilter(i, { operator: e.target.value as FilterOperator })}
                        options={OPERATORS.map((o) => ({ value: o, label: o }))}
                        className="h-8 w-24 py-1 text-xs"
                      />
                      <Input
                        value={f.value}
                        onChange={(e) => updateFilter(i, { value: e.target.value })}
                        placeholder="value"
                        className="h-8 text-xs"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-accent-red" onClick={() => removeFilter(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {!st.filters.length && (
                    <p className="text-[11px] text-text-secondary">No filters applied.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="mb-2 block text-xs font-medium text-text-secondary">Visualization</span>
                <div className="grid grid-cols-4 gap-2">
                  {VIZ.map((v) => (
                    <button
                      key={v.type}
                      onClick={() => set('visualization', v.type)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-[11px] transition-colors',
                        st.visualization === v.type
                          ? 'border-accent-blue/50 bg-accent-blue/8 text-accent-blue'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <v.icon className="h-4 w-4" />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(st.visualization === 'line') && (
                  <>
                    <Field label="X axis key"><Input value={st.xKey} onChange={(e) => set('xKey', e.target.value)} /></Field>
                    <Field label="Y axis keys" hint="comma-separated"><Input value={st.yKeys} onChange={(e) => set('yKeys', e.target.value)} /></Field>
                  </>
                )}
                {(st.visualization === 'bar' || st.visualization === 'pie') && (
                  <>
                    <Field label="Label key"><Input value={st.labelKey} onChange={(e) => set('labelKey', e.target.value)} placeholder="region" /></Field>
                    <Field label="Value key"><Input value={st.valueKey} onChange={(e) => set('valueKey', e.target.value)} placeholder="amount" /></Field>
                  </>
                )}
                {(st.visualization === 'kpi' || st.visualization === 'gauge') && (
                  <>
                    <Field label="Value key"><Input value={st.valueKey} onChange={(e) => set('valueKey', e.target.value)} placeholder="revenue" /></Field>
                    {st.visualization === 'gauge' && (
                      <Field label="Target"><Input value={st.target} onChange={(e) => set('target', e.target.value)} placeholder="100" /></Field>
                    )}
                    <Field label="Prefix"><Input value={st.prefix} onChange={(e) => set('prefix', e.target.value)} placeholder="$" /></Field>
                    <Field label="Unit"><Input value={st.unit} onChange={(e) => set('unit', e.target.value)} placeholder="%" /></Field>
                  </>
                )}
                {st.visualization === 'heatmap' && (
                  <Field label="Value key" hint="Needs day(0-6) + hour(0-23) columns."><Input value={st.valueKey} onChange={(e) => set('valueKey', e.target.value)} placeholder="count" /></Field>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Field label="Widget title"><Input value={st.title} onChange={(e) => set('title', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Size">
                  <Select
                    value={st.size}
                    onChange={(e) => set('size', e.target.value as WidgetSize)}
                    options={[
                      { value: 'sm', label: 'Small' },
                      { value: 'md', label: 'Medium' },
                      { value: 'lg', label: 'Large' },
                      { value: 'xl', label: 'Extra large' },
                      { value: 'full', label: 'Full width' },
                    ]}
                  />
                </Field>
                <Field label="Refresh interval">
                  <Select
                    value={String(st.refreshInterval)}
                    onChange={(e) => set('refreshInterval', Number(e.target.value))}
                    options={[
                      { value: '0', label: 'Manual' },
                      { value: '30', label: '30s' },
                      { value: '60', label: '60s' },
                      { value: '300', label: '5 min' },
                    ]}
                  />
                </Field>
              </div>
              <Field label="Add to dashboard">
                <Select
                  value={targetDashboard}
                  onChange={(e) => setTargetDashboard(e.target.value)}
                  options={dashboards.map((d) => ({ value: d.id, label: d.name }))}
                />
              </Field>
              <Button variant="primary" className="w-full" onClick={save} disabled={!targetDashboard || saved}>
                {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save widget</>}
              </Button>
            </div>
          )}

          {/* Step nav */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="ghost" size="sm" disabled={step === 1} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button variant="secondary" size="sm" disabled={step === 5} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </div>
        </div>

        {/* Live preview + SQL */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-medium text-text-secondary">
              Live preview
            </div>
            <div className="h-[340px] p-4">
              <WidgetRenderer key={st.visualization + st.table + st.sourceId} config={config} />
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-medium text-text-secondary">
              SQL equivalent
            </div>
            <pre className="overflow-x-auto p-4 font-data text-xs leading-relaxed text-accent-green">{sql}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
