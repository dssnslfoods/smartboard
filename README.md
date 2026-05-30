# Boardroom — Executive Analytics Dashboard Portal

A multi-source analytics portal that connects to multiple Supabase projects and
renders executive-grade dashboards. Dark "Bloomberg-terminal-meets-SaaS" UI.

## Stack

React 18 · TypeScript (strict) · Tailwind CSS · Supabase JS v2 · Recharts ·
TanStack Query · React Router v6 · Zustand · react-grid-layout · date-fns ·
lucide-react.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production bundle
npm run preview  # serve the build
```

No environment variables are required — the app ships with a built-in **Demo
data** source so every page is functional out of the box. Add real Supabase
projects from the **Sources** page.

## Architecture

| Concern | Location |
| --- | --- |
| Multi-Supabase client manager | `src/lib/supabaseManager.ts` |
| Query engine + SQL preview | `src/lib/queryEngine.ts` |
| Aggregation helpers | `src/lib/aggregate.ts` |
| Demo data generator | `src/lib/demoData.ts` |
| Dashboard templates / seeds | `src/lib/templates.ts` |
| State (Zustand) | `src/stores/*` |
| Data fetching (React Query + Realtime) | `src/hooks/useWidgetData.ts` |
| Widgets | `src/components/widgets/*` |
| UI primitives | `src/components/ui/*` |
| Pages | `src/pages/*` |

### Data sources
- Multiple Supabase clients held in a `Map<string, SupabaseClient>`.
- Source configs (incl. **anon keys**) persist to `localStorage` only — never to
  a database. Anon keys are public by design, but they stay in the browser.
- `testConnection()` probes the PostgREST root for reachability, latency, and
  the visible table count.

### Widgets
`KPICard` (count-up + sparkline + trend), `LineChartWidget` (dual Y-axis),
`BarChartWidget`, `PieDonutWidget`, `GaugeWidget`, `HeatmapWidget` (7×24),
`DataTableWidget` (sort / search / paginate / CSV export). Each is driven by a
`WidgetConfig` (`src/types/index.ts`) and rendered through `WidgetRenderer`,
which handles loading skeletons, error and empty states, refresh intervals, and
optional Supabase Realtime subscriptions.

### Dashboards
- Drag-and-drop, resizable grid (`react-grid-layout`), 12-column responsive.
- Layouts persist per dashboard in `localStorage`.
- Templates: Executive Overview, Sales Performance, Operations, Finance.
- CRUD: create / rename / duplicate / delete; JSON export & import in Settings.

### Pages
`/` Hub · `/dashboard/:id` view + edit mode · `/sources` manager ·
`/widget-builder` 5-step visual builder with live preview & SQL · `/settings`.

### Roles
Toggle **Admin / Viewer** in the sidebar. Viewers can read dashboards; source
management and the widget builder are admin-only.

## Notes
- The Recharts-heavy bundle is ~320 kB gzipped; acceptable for an internal
  portal. Code-split per route if you need a smaller initial payload.
