import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import {
  ArrowLeft,
  Check,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { DateRangeConfig, GridLayoutItem, WidgetConfig } from '@/types'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

const ResponsiveGrid = WidthProvider(Responsive)

type Preset = NonNullable<DateRangeConfig['preset']>

export function DashboardView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { dashboards, renameDashboard, removeWidget, setLayout } =
    useDashboardStore()
  const isAdmin = useUserStore((s) => s.user.role === 'admin')
  const defaultRange = useSettingsStore((s) => s.defaultDateRange)

  const dashboard = dashboards.find((d) => d.id === id)
  const [editMode, setEditMode] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [range, setRange] = useState<Preset>(defaultRange ?? '30d')

  // Apply global date range to widgets that have a time-series `date` column.
  const widgetsWithRange = useMemo(() => {
    if (!dashboard) return []
    return dashboard.widgets.map((w) => {
      const hasDate = /(^|,)\s*date\s*(,|$)/.test(w.query.select) || w.query.select === '*'
      if (!hasDate) return w
      return {
        ...w,
        query: { ...w.query, dateRange: { column: 'date', preset: range } },
      } as WidgetConfig
    })
  }, [dashboard, range])

  if (!dashboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
        <LayoutGrid className="h-8 w-8" />
        <p className="text-sm">Dashboard not found.</p>
        <Link to="/" className="text-sm text-accent-blue">Back to Hub</Link>
      </div>
    )
  }

  const layouts = {
    lg: dashboard.layout.map((l) => ({ ...l })),
  }

  const onLayoutChange = (current: Layout[]) => {
    if (!editMode) return
    const next: GridLayoutItem[] = current.map((l) => ({
      i: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
    }))
    setLayout(dashboard.id, next)
  }

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['widget'] })

  const commitName = () => {
    if (nameDraft.trim()) renameDashboard(dashboard.id, nameDraft.trim())
    setEditingName(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {editingName ? (
            <input
              autoFocus
              defaultValue={dashboard.name}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && commitName()}
              className="rounded-md border border-accent-blue/50 bg-bg-primary px-2 py-1 text-lg font-semibold text-text-primary focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-text-primary">{dashboard.name}</h1>
              {isAdmin && editMode && (
                <button
                  onClick={() => {
                    setNameDraft(dashboard.name)
                    setEditingName(true)
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <Badge tone="neutral">{dashboard.widgets.length} widgets</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value as Preset)}
            className="h-9 w-40 py-1.5 text-xs"
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'ytd', label: 'Year to date' },
              { value: 'all', label: 'All time' },
            ]}
          />
          <Button variant="secondary" size="md" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" /> Refresh all
          </Button>
          {isAdmin && (
            <>
              <Button variant="secondary" onClick={() => navigate('/widget-builder')}>
                <Plus className="h-4 w-4" /> Add widget
              </Button>
              <Button
                variant={editMode ? 'primary' : 'outline'}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? <><Check className="h-4 w-4" /> Done</> : <><Pencil className="h-4 w-4" /> Edit</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        {dashboard.widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
            <LayoutGrid className="h-10 w-10" />
            <p className="text-sm">This dashboard is empty.</p>
            {isAdmin && (
              <Button variant="primary" onClick={() => navigate('/widget-builder')}>
                <Plus className="h-4 w-4" /> Add your first widget
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveGrid
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 996, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 8, sm: 4 }}
            rowHeight={48}
            margin={[16, 16]}
            isDraggable={editMode}
            isResizable={editMode}
            draggableCancel=".widget-no-drag,button,a,input,select,table"
            onLayoutChange={onLayoutChange}
          >
            {widgetsWithRange.map((w) => (
              <div key={w.id} className={editMode ? 'cursor-move' : ''}>
                <WidgetRenderer
                  config={w}
                  editMode={editMode}
                  onEdit={() => navigate('/widget-builder')}
                  onRemove={(wid) => removeWidget(dashboard.id, wid)}
                />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </div>
  )
}
