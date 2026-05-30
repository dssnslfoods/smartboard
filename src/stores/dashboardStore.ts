import { create } from 'zustand'
import type { Dashboard, GridLayoutItem, WidgetConfig } from '@/types'
import { uid } from '@/lib/utils'
import { seedDashboards } from '@/lib/templates'

const STORAGE_KEY = 'boardroom.dashboards.v1'

function load(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored: Dashboard[] = JSON.parse(raw)
      // Migration: ensure newly-shipped seed dashboards (e.g. the real-data
      // SmartSales report) are present for users who already have storage.
      const haveIds = new Set(stored.map((d) => d.id))
      // Seed any missing canonical dashboards (SmartSales, Inventory, Group Exec)
      // and remove old Report-Gallery-created inventory dashboards that have
      // auto-generated titles (not from the template).
      const SEED_IDS = ['dash_smartsales', 'dash_inventory', 'dash_group-exec', 'dash_smartcare']
      const allSeeded = seedDashboards()
      const missing = allSeeded.filter((d) => !haveIds.has(d.id) && SEED_IDS.includes(d.id))
      // Drop Gallery-created dashboards that use inventory-snapshot but aren't the
      // canonical template (their ids won't match dash_inventory / dash_group-exec).
      const cleaned = stored.filter((d) => {
        const usesInv = d.widgets?.some((w) => w.sourceId === 'inventory-snapshot')
        if (!usesInv) return true
        return SEED_IDS.includes(d.id) // keep canonical ones, drop Gallery copies
      })
      return [...missing, ...cleaned]
    }
  } catch {
    /* noop */
  }
  return seedDashboards()
}

function persist(dashboards: Dashboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
}

interface DashboardState {
  dashboards: Dashboard[]
  createDashboard: (input: { name: string; template?: string }) => Dashboard
  renameDashboard: (id: string, name: string) => void
  duplicateDashboard: (id: string) => Dashboard | undefined
  deleteDashboard: (id: string) => void
  getDashboard: (id: string) => Dashboard | undefined
  addWidget: (dashboardId: string, widget: WidgetConfig) => void
  updateWidget: (dashboardId: string, widget: WidgetConfig) => void
  removeWidget: (dashboardId: string, widgetId: string) => void
  setLayout: (dashboardId: string, layout: GridLayoutItem[]) => void
  importDashboards: (incoming: Dashboard[]) => void
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  const initial = load()
  persist(initial)

  const commit = (dashboards: Dashboard[]) => {
    persist(dashboards)
    set({ dashboards })
  }

  const touch = (d: Dashboard): Dashboard => ({ ...d, updatedAt: Date.now() })

  return {
    dashboards: initial,

    createDashboard: ({ name, template }) => {
      const seeded = template
        ? seedDashboards().find((d) => d.template === template)
        : undefined
      const now = Date.now()
      const dashboard: Dashboard = {
        id: uid('dash'),
        name,
        description: seeded?.description,
        template,
        widgets: seeded ? structuredClone(seeded.widgets) : [],
        layout: seeded ? structuredClone(seeded.layout) : [],
        createdAt: now,
        updatedAt: now,
      }
      commit([...get().dashboards, dashboard])
      return dashboard
    },

    renameDashboard: (id, name) =>
      commit(get().dashboards.map((d) => (d.id === id ? touch({ ...d, name }) : d))),

    duplicateDashboard: (id) => {
      const src = get().dashboards.find((d) => d.id === id)
      if (!src) return undefined
      const now = Date.now()
      const copy: Dashboard = {
        ...structuredClone(src),
        id: uid('dash'),
        name: `${src.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      }
      commit([...get().dashboards, copy])
      return copy
    },

    deleteDashboard: (id) =>
      commit(get().dashboards.filter((d) => d.id !== id)),

    getDashboard: (id) => get().dashboards.find((d) => d.id === id),

    addWidget: (dashboardId, widget) =>
      commit(
        get().dashboards.map((d) => {
          if (d.id !== dashboardId) return d
          const span = { sm: 3, md: 4, lg: 6, xl: 8, full: 12 }[widget.size]
          const maxY = d.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0)
          const layoutItem: GridLayoutItem = {
            i: widget.id,
            x: 0,
            y: maxY,
            w: span,
            h: widget.visualization === 'kpi' ? 3 : 6,
          }
          return touch({
            ...d,
            widgets: [...d.widgets, widget],
            layout: [...d.layout, layoutItem],
          })
        })
      ),

    updateWidget: (dashboardId, widget) =>
      commit(
        get().dashboards.map((d) =>
          d.id === dashboardId
            ? touch({
                ...d,
                widgets: d.widgets.map((w) => (w.id === widget.id ? widget : w)),
              })
            : d
        )
      ),

    removeWidget: (dashboardId, widgetId) =>
      commit(
        get().dashboards.map((d) =>
          d.id === dashboardId
            ? touch({
                ...d,
                widgets: d.widgets.filter((w) => w.id !== widgetId),
                layout: d.layout.filter((l) => l.i !== widgetId),
              })
            : d
        )
      ),

    setLayout: (dashboardId, layout) =>
      commit(
        get().dashboards.map((d) =>
          d.id === dashboardId ? { ...d, layout } : d
        )
      ),

    importDashboards: (incoming) => {
      const existing = get().dashboards
      const byId = new Map(existing.map((d) => [d.id, d]))
      for (const d of incoming) byId.set(d.id, d)
      commit([...byId.values()])
    },
  }
})
