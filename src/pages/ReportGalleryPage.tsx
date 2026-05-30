import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Check,
  Gauge,
  Grid3x3,
  LayoutGrid,
  LineChart,
  PieChart,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useUserStore } from '@/stores/userStore'
import { getCatalog, suggestReports } from '@/lib/sourceCatalog'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import { uid } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { WidgetType } from '@/types'

const VIZ_ICON: Record<WidgetType, typeof LineChart> = {
  kpi: TrendingUp, line: LineChart, bar: BarChart3, pie: PieChart,
  gauge: Gauge, heatmap: Grid3x3, table: TableIcon,
}

function sourceMeta(id: string, sources: { id: string; name: string; color: string }[]) {
  const snap = SNAPSHOT_SOURCES.find((s) => s.id === id)
  if (snap) return { name: snap.name, color: snap.color }
  if (id === DEMO_SOURCE_ID) return { name: 'Demo data', color: '#BC8CFF' }
  return sources.find((s) => s.id === id) ?? { name: id, color: '#58A6FF' }
}

export function ReportGalleryPage() {
  const { sourceId = '' } = useParams()
  const navigate = useNavigate()
  const sources = useDataSourceStore((s) => s.sources)
  const { createDashboard, addWidget } = useDashboardStore()
  const isAdmin = useUserStore((s) => s.user.role === 'admin')

  const meta = sourceMeta(sourceId, sources)
  const catalog = useMemo(() => getCatalog(sourceId), [sourceId])
  const suggestions = useMemo(() => suggestReports(sourceId), [sourceId])
  const [created, setCreated] = useState<string | null>(null)

  const useReport = (sid: string) => {
    const s = suggestions.find((x) => x.id === sid)
    if (!s) return
    const dash = createDashboard({ name: `${meta.name} · ${s.title}` })
    for (const w of s.widgets) {
      addWidget(dash.id, { ...w, id: uid('w'), sourceId })
    }
    setCreated(dash.id)
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Suggested Reports"
        subtitle={`Smart report ideas tailored to "${meta.name}" — built from its schema.`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/sources')}>
            <ArrowLeft className="h-4 w-4" /> Back to Sources
          </Button>
        }
      />

      {/* Source summary */}
      <div className="px-6 py-3">
        <div className="card flex flex-wrap items-center gap-4 p-4">
          <span className="h-3 w-3 rounded-full" style={{ background: meta.color }} />
          <span className="font-semibold text-text-primary">{meta.name}</span>
          <Badge tone={catalog.origin === 'handoff' ? 'green' : catalog.origin === 'builtin' ? 'blue' : 'neutral'}>
            {catalog.origin === 'handoff' ? 'From handoff.md' : catalog.origin === 'builtin' ? 'Built-in schema' : 'No schema'}
          </Badge>
          <span className="text-xs text-text-secondary">
            {catalog.tables.length} tables ·{' '}
            {catalog.tables.reduce((a, t) => a + t.columns.length, 0)} columns
          </span>
        </div>
      </div>

      {/* No schema state */}
      {catalog.tables.length === 0 && (
        <div className="px-6 py-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-text-secondary" />
          <p className="mt-3 text-sm text-text-secondary">
            ระบบยังไม่รู้จัก schema ของ source นี้ — อัปโหลด <span className="text-accent-blue">handoff.md</span> ที่หน้า Sources
            เพื่อให้แนะนำรายงานได้
          </p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/sources')}>
            Go to Sources
          </Button>
        </div>
      )}

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 gap-4 px-6 py-2 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => {
          const Icon = VIZ_ICON[s.icon]
          return (
            <div key={s.id} className="card card-hover flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/12">
                  <Icon className="h-5 w-5 text-accent-blue" />
                </div>
                <Badge tone="neutral">{s.widgets.length} widgets</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-1 text-xs text-text-secondary">{s.description}</p>

              {/* Widget chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.widgets.map((w, i) => {
                  const WI = VIZ_ICON[w.visualization]
                  return (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                      <WI className="h-3 w-3" /> {w.title}
                    </span>
                  )
                })}
              </div>

              {/* Rationale */}
              <div className="mt-3 rounded-lg border border-accent-purple/20 bg-accent-purple/5 p-2.5 text-[11px] text-text-secondary">
                <span className="font-medium text-accent-purple">ทำไมเหมาะ: </span>
                {s.rationale}
              </div>

              {isAdmin && (
                <Button
                  variant={created ? 'secondary' : 'primary'}
                  className="mt-4 w-full"
                  onClick={() => useReport(s.id)}
                >
                  {created ? <><Check className="h-4 w-4" /> Created — add another?</> : <><LayoutGrid className="h-4 w-4" /> Create dashboard</>}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Created banner */}
      {created && (
        <div className="px-6 py-4">
          <div className="card flex items-center justify-between gap-4 border-accent-green/30 bg-accent-green/8 p-4">
            <span className="flex items-center gap-2 text-sm text-accent-green">
              <Check className="h-4 w-4" /> สร้าง dashboard เรียบร้อย
            </span>
            <Button variant="primary" onClick={() => navigate('/')}>
              <LayoutGrid className="h-4 w-4" /> ดูใน Hub
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
