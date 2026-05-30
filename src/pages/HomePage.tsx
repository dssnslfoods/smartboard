import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import {
  Check,
  Copy,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { useUserStore } from '@/stores/userStore'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TEMPLATES } from '@/lib/templates'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import type { GridLayoutItem, WidgetConfig } from '@/types'
import { cn } from '@/lib/utils'

const ResponsiveGrid = WidthProvider(Responsive)

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    dashboards,
    createDashboard,
    duplicateDashboard,
    deleteDashboard,
    removeWidget,
    setLayout,
    renameDashboard,
  } = useDashboardStore()
  const sources = useDataSourceStore((s) => s.sources)
  const isAdmin = useUserStore((s) => s.user.role === 'admin')

  const [activeDashId, setActiveDashId] = useState(dashboards[0]?.id ?? '')
  const [editMode, setEditMode] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState('')

  const isSourceActive = useSourceActiveStore((s) => s.isActive)
  // We resubscribe to the active map so the dashboard list re-renders on toggle.
  const activeMap = useSourceActiveStore((s) => s.map)

  /** A dashboard is "available" if every widget's source is active. */
  const availableDashboards = useMemo(
    () =>
      dashboards.filter((d) =>
        d.widgets.every((w) => isSourceActive(w.sourceId)) && d.widgets.length > 0
          ? true
          : d.widgets.length === 0
          ? true
          : false
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dashboards, activeMap]
  )

  const activeDash = useMemo(
    () =>
      availableDashboards.find((d) => d.id === activeDashId) ?? availableDashboards[0] ?? dashboards[0],
    [availableDashboards, activeDashId, dashboards]
  )

  // Source color lookup
  const allSources = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {
      [DEMO_SOURCE_ID]: { name: 'Demo data', color: '#BC8CFF' },
    }
    for (const s of SNAPSHOT_SOURCES) map[s.id] = { name: s.name, color: s.color }
    for (const s of sources) map[s.id] = { name: s.name, color: s.color }
    return map
  }, [sources])

  const usedSources = useMemo(() => {
    if (!activeDash) return []
    const ids = new Set(activeDash.widgets.map((w) => w.sourceId))
    return [...ids].map((id) => allSources[id]).filter(Boolean)
  }, [activeDash, allSources])

  const submitCreate = () => {
    if (!newName.trim()) return
    const d = createDashboard({ name: newName.trim(), template: newTemplate || undefined })
    setCreateOpen(false)
    setNewName('')
    setNewTemplate('')
    setActiveDashId(d.id)
  }

  const commitName = () => {
    if (nameDraft.trim() && activeDash) renameDashboard(activeDash.id, nameDraft.trim())
    setEditingName(false)
  }

  const onLayoutChange = (current: Layout[]) => {
    if (!editMode || !activeDash) return
    const next: GridLayoutItem[] = current.map((l) => ({
      i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
    }))
    setLayout(activeDash.id, next)
  }

  if (dashboards.length === 0) {
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

  const layouts = activeDash
    ? { lg: activeDash.layout.map((l) => ({ ...l })) }
    : { lg: [] }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex items-end gap-0 border-b border-border bg-bg-secondary px-4 pt-3 overflow-x-auto">
        {availableDashboards.map((d) => {
          const isActive = d.id === activeDash?.id
          return (
            <button
              key={d.id}
              onClick={() => { setActiveDashId(d.id); setEditMode(false) }}
              className={cn(
                'group relative flex items-center gap-2 whitespace-nowrap rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-medium transition-colors select-none',
                isActive
                  ? 'border-border bg-bg-primary text-text-primary z-10 -mb-px'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-card'
              )}
            >
              <LayoutGrid className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-accent-blue' : 'text-text-secondary')} />

              {/* Editable name inline */}
              {isActive && editingName ? (
                <input
                  autoFocus
                  defaultValue={d.name}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => e.key === 'Enter' && commitName()}
                  className="w-32 rounded border border-accent-blue/50 bg-bg-secondary px-1.5 py-0.5 text-sm text-text-primary outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{d.name}</span>
              )}

              <span className="text-[10px] text-text-secondary opacity-60">{d.widgets.length}w</span>

              {/* Close/delete tab (admin only, not last tab) */}
              {isAdmin && dashboards.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = dashboards.find((x) => x.id !== d.id)
                    deleteDashboard(d.id)
                    if (next) setActiveDashId(next.id)
                  }}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-accent-red transition-opacity"
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}

        {/* New tab button */}
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="mb-0 flex items-center gap-1 rounded-t-lg px-3 py-2.5 text-sm text-text-secondary hover:text-accent-blue transition-colors"
            title="New dashboard"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        {/* Spacer + right-side controls */}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 pb-2">
          {/* Source dots */}
          {usedSources.map((s, i) => (
            <span key={i} title={s.name} className="flex items-center gap-1 text-[11px] text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="hidden sm:inline">{s.name}</span>
            </span>
          ))}
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['widget'] })}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && activeDash && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const copy = duplicateDashboard(activeDash.id)
                  if (copy) setActiveDashId(copy.id)
                }}
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setNameDraft(activeDash.name); setEditingName(true) }}
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/widget-builder')}>
                    <Plus className="h-3.5 w-3.5" /> Add widget
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setEditMode(false)}>
                    <Check className="h-3.5 w-3.5" /> Done
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Edit mode banner ─────────────────────────────────── */}
      {editMode && (
        <div className="flex items-center justify-between border-b border-accent-amber/30 bg-accent-amber/8 px-6 py-1.5">
          <span className="text-xs font-medium text-accent-amber">
            Edit mode — drag to reorder, resize widgets
          </span>
          <Badge tone="amber">Editing</Badge>
        </div>
      )}

      {/* ── Widget grid ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
        {!activeDash || activeDash.widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
            <LayoutGrid className="h-10 w-10" />
            <p className="text-sm">This dashboard is empty.</p>
            {isAdmin && (
              <Button variant="primary" onClick={() => navigate('/widget-builder')}>
                <Plus className="h-4 w-4" /> Add first widget
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
            isDraggable={editMode}
            isResizable={editMode}
            draggableCancel=".widget-no-drag,button,a,input,select,table"
            onLayoutChange={onLayoutChange}
          >
            {activeDash.widgets.map((w: WidgetConfig) => (
              <div key={w.id} className={editMode ? 'cursor-move' : ''}>
                <WidgetRenderer
                  config={w}
                  editMode={editMode}
                  onEdit={() => navigate('/widget-builder')}
                  onRemove={isAdmin ? (wid) => removeWidget(activeDash.id, wid) : undefined}
                />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>

      {/* ── Create dialog ────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create dashboard"
        description="Start blank or pick a curated executive template."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitCreate} disabled={!newName.trim()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Dashboard name">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Q3 Executive Review"
              onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
            />
          </Field>
          <Field label="Template" hint="Templates pre-load widgets wired to demo data.">
            <Select
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
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
