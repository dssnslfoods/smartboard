import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import {
  ChevronDown,
  Copy,
  ExternalLink,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { TEMPLATES } from '@/lib/templates'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_META } from '@/lib/snapshotData'
import type { WidgetConfig } from '@/types'
import { cn } from '@/lib/utils'

const ResponsiveGrid = WidthProvider(Responsive)

function SourceDot({ color, name }: { color: string; name: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {name}
    </span>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { dashboards, createDashboard, duplicateDashboard, deleteDashboard, removeWidget } =
    useDashboardStore()
  const sources = useDataSourceStore((s) => s.sources)
  const isAdmin = useUserStore((s) => s.user.role === 'admin')

  const [activeDashId, setActiveDashId] = useState(dashboards[0]?.id ?? '')
  const [createOpen, setCreateOpen] = useState(false)
  const [dashMenuOpen, setDashMenuOpen] = useState(false)
  const [name, setName] = useState('')
  const [template, setTemplate] = useState('')

  const activeDash = useMemo(
    () => dashboards.find((d) => d.id === activeDashId) ?? dashboards[0],
    [dashboards, activeDashId]
  )

  const allSources = useMemo(() => {
    const snap = { id: SNAPSHOT_META.id, name: SNAPSHOT_META.name, color: SNAPSHOT_META.color }
    const demo = { id: DEMO_SOURCE_ID, name: 'Demo data', color: '#BC8CFF' }
    const live = sources.map((s) => ({ id: s.id, name: s.name, color: s.color }))
    return [snap, demo, ...live]
  }, [sources])

  const usedSources = useMemo(() => {
    if (!activeDash) return []
    const ids = new Set(activeDash.widgets.map((w) => w.sourceId))
    return allSources.filter((s) => ids.has(s.id))
  }, [activeDash, allSources])

  const submit = () => {
    if (!name.trim()) return
    const d = createDashboard({ name: name.trim(), template: template || undefined })
    setCreateOpen(false)
    setName('')
    setTemplate('')
    setActiveDashId(d.id)
  }

  const onLayoutChange = (current: Layout[]) => {
    // read-only in Hub — layout not persisted here
    void current
  }

  if (!activeDash) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
        <LayoutGrid className="h-10 w-10" />
        <p className="text-sm">No dashboards yet.</p>
        {isAdmin && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create your first dashboard
          </Button>
        )}
      </div>
    )
  }

  const layouts = { lg: activeDash.layout.map((l) => ({ ...l })) }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        {/* Dashboard selector */}
        <div className="relative">
          <button
            onClick={() => setDashMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm font-semibold text-text-primary hover:border-[#30363d] transition-colors"
          >
            <LayoutGrid className="h-4 w-4 text-accent-blue" />
            {activeDash.name}
            <Badge tone="neutral">{activeDash.widgets.length} widgets</Badge>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </button>

          {dashMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDashMenuOpen(false)} />
              <div className="absolute left-0 top-11 z-20 w-72 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl animate-fade-in">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary">
                  Switch dashboard
                </div>
                <div className="max-h-64 overflow-y-auto pb-1">
                  {dashboards.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setActiveDashId(d.id); setDashMenuOpen(false) }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-bg-card',
                        d.id === activeDashId && 'bg-bg-card text-accent-blue'
                      )}
                    >
                      <span className="truncate font-medium">{d.name}</span>
                      <span className="shrink-0 text-[11px] text-text-secondary">
                        {d.widgets.length}w
                      </span>
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { setDashMenuOpen(false); setCreateOpen(true) }}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-accent-blue hover:bg-bg-card"
                  >
                    <Plus className="h-4 w-4" /> New dashboard
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Source dots */}
        <div className="flex flex-wrap items-center gap-3">
          {usedSources.map((s) => (
            <SourceDot key={s.id} color={s.color} name={s.name} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['widget'] })}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(`/dashboard/${activeDash.id}`)}
          >
            <ExternalLink className="h-4 w-4" /> Full view
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Duplicate"
                onClick={() => {
                  const copy = duplicateDashboard(activeDash.id)
                  if (copy) setActiveDashId(copy.id)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-accent-red"
                title="Delete"
                onClick={() => {
                  const next = dashboards.find((d) => d.id !== activeDash.id)
                  deleteDashboard(activeDash.id)
                  if (next) setActiveDashId(next.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/widget-builder')}>
                <Pencil className="h-4 w-4" /> Add widget
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Widget grid ─────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
        {activeDash.widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
            <LayoutGrid className="h-10 w-10" />
            <p className="text-sm">This dashboard is empty.</p>
            {isAdmin && (
              <Button variant="primary" onClick={() => navigate('/widget-builder')}>
                <Plus className="h-4 w-4" /> Add widget
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
            margin={[14, 14]}
            isDraggable={false}
            isResizable={false}
            onLayoutChange={onLayoutChange}
          >
            {activeDash.widgets.map((w: WidgetConfig) => (
              <div key={w.id}>
                <WidgetRenderer
                  config={w}
                  editMode={false}
                  onRemove={
                    isAdmin ? (wid) => removeWidget(activeDash.id, wid) : undefined
                  }
                />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>

      {/* ── Create dashboard dialog ─────────────────────────── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create dashboard"
        description="Start blank or from a curated executive template."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit} disabled={!name.trim()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Dashboard name">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q3 Executive Review"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <Field label="Template" hint="Templates pre-load widgets wired to demo data.">
            <Select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Blank dashboard"
              options={[
                { value: '', label: 'Blank dashboard' },
                ...TEMPLATES.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
