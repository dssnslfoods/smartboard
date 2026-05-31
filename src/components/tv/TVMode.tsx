import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Monitor,
  Mouse,
  Pause,
  Play,
  Settings2,
  Timer,
  X,
} from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useSourceActiveStore } from '@/stores/sourceActiveStore'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import type { WidgetConfig } from '@/types'
import { cn } from '@/lib/utils'

const ResponsiveGrid = WidthProvider(Responsive)

const INTERVALS = [
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
]

function sourceColor(sourceId: string): string {
  const snap = SNAPSHOT_SOURCES.find((s) => s.id === sourceId)
  if (snap) return snap.color
  if (sourceId === DEMO_SOURCE_ID) return '#BC8CFF'
  return '#58A6FF'
}

interface Props {
  onExit: () => void
}

export function TVMode({ onExit }: Props) {
  const { dashboards } = useDashboardStore()
  const isSourceActive = useSourceActiveStore((s) => s.isActive)

  // Filter to active dashboards with widgets
  const tvDashboards = useMemo(
    () =>
      dashboards.filter(
        (d) =>
          d.widgets.length > 0 &&
          d.widgets.every((w) => isSourceActive(w.sourceId))
      ),
    [dashboards, isSourceActive]
  )

  const [currentIdx, setCurrentIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [interval, setInterval_] = useState(30)
  const [showControls, setShowControls] = useState(true)
  const [laserMode, setLaserMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>()
  const progressRef = useRef<HTMLDivElement>(null)

  const current = tvDashboards[currentIdx] ?? tvDashboards[0]

  // Auto-advance slideshow
  useEffect(() => {
    if (!playing || tvDashboards.length <= 1) return
    const id = window.setInterval(() => {
      setCurrentIdx((i) => (i + 1) % tvDashboards.length)
    }, interval * 1000)
    return () => window.clearInterval(id)
  }, [playing, interval, tvDashboards.length])

  // Progress bar animation
  useEffect(() => {
    if (!progressRef.current || !playing) return
    const el = progressRef.current
    el.style.transition = 'none'
    el.style.width = '0%'
    requestAnimationFrame(() => {
      el.style.transition = `width ${interval}s linear`
      el.style.width = '100%'
    })
  }, [currentIdx, playing, interval])

  // Auto-hide controls after 3s of no mouse movement
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    const onMove = () => showControlsTemporarily()
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [showControlsTemporarily])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onExit(); break
        case ' ': e.preventDefault(); setPlaying((p) => !p); break
        case 'ArrowRight': setCurrentIdx((i) => (i + 1) % tvDashboards.length); break
        case 'ArrowLeft': setCurrentIdx((i) => (i - 1 + tvDashboards.length) % tvDashboards.length); break
        case 'l': setLaserMode((l) => !l); break
        case 'f': toggleFullscreen(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvDashboards.length])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const goNext = () => setCurrentIdx((i) => (i + 1) % tvDashboards.length)
  const goPrev = () => setCurrentIdx((i) => (i - 1 + tvDashboards.length) % tvDashboards.length)

  if (!current) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-white">
        <p>No active dashboards to display.</p>
        <button onClick={onExit} className="ml-4 rounded bg-white/20 px-4 py-2">Exit</button>
      </div>
    )
  }

  const layouts = { lg: current.layout.map((l) => ({ ...l })) }
  const srcIds = [...new Set(current.widgets.map((w) => w.sourceId))]

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col bg-[#050608] text-white overflow-hidden',
        laserMode && 'cursor-none'
      )}
      onMouseMove={showControlsTemporarily}
    >
      {/* Laser pointer overlay */}
      {laserMode && <LaserPointer />}

      {/* ── Top bar ────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center justify-between px-6 py-3 transition-opacity duration-500',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Dashboard name + source dots */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-amber-400" />
            <span className="text-lg font-bold tracking-tight">{current.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {srcIds.map((sid) => (
              <span key={sid} className="h-2.5 w-2.5 rounded-full" style={{ background: sourceColor(sid) }} />
            ))}
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/60">
            {currentIdx + 1} / {tvDashboards.length}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Laser toggle */}
          <button
            onClick={() => setLaserMode((l) => !l)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              laserMode ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60 hover:text-white'
            )}
            title="Laser pointer (L)"
          >
            <Mouse className="h-3.5 w-3.5" />
            {laserMode ? 'Laser ON' : 'Laser'}
          </button>

          {/* Slideshow controls */}
          <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1">
            <button onClick={goPrev} className="p-1 text-white/60 hover:text-white" title="Previous (←)">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="p-1 text-white/60 hover:text-white"
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={goNext} className="p-1 text-white/60 hover:text-white" title="Next (→)">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Interval selector */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
            >
              <Timer className="h-3.5 w-3.5" />
              {interval}s
              <Settings2 className="h-3 w-3" />
            </button>
            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
                <div className="absolute right-0 top-10 z-20 rounded-lg border border-white/10 bg-[#111318] p-2 shadow-2xl">
                  <div className="mb-1 text-[10px] uppercase text-white/40">Auto-advance</div>
                  <div className="flex flex-wrap gap-1">
                    {INTERVALS.map((iv) => (
                      <button
                        key={iv.value}
                        onClick={() => { setInterval_(iv.value); setSettingsOpen(false) }}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs transition-colors',
                          interval === iv.value
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-white/10 text-white/60 hover:text-white'
                        )}
                      >
                        {iv.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:text-white"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Exit */}
          <button
            onClick={onExit}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:text-white"
            title="Exit (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      {playing && tvDashboards.length > 1 && (
        <div className="h-0.5 w-full bg-white/5">
          <div ref={progressRef} className="h-full bg-amber-400/60 rounded-full" style={{ width: '0%' }} />
        </div>
      )}

      {/* ── Dashboard slide indicators ─────────────────────── */}
      {tvDashboards.length > 1 && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 py-2 transition-opacity duration-500',
            showControls ? 'opacity-100' : 'opacity-30'
          )}
        >
          {tvDashboards.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all',
                i === currentIdx
                  ? 'bg-amber-500/20 text-amber-400 scale-110'
                  : 'bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
              )}
            >
              {/* Source dots */}
              {[...new Set(d.widgets.map((w) => w.sourceId))].slice(0, 2).map((sid) => (
                <span key={sid} className="h-1.5 w-1.5 rounded-full" style={{ background: sourceColor(sid) }} />
              ))}
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Widget grid (fit to screen — no scroll) ─────────── */}
      <TVGrid layouts={layouts} widgets={current.widgets} />

      {/* ── Keyboard hints ─────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center justify-center gap-6 py-2 text-[10px] text-white/20 transition-opacity duration-500',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span>Space: Play/Pause</span>
        <span>← → : Navigate</span>
        <span>L: Laser</span>
        <span>F: Fullscreen</span>
        <span>Esc: Exit</span>
      </div>
    </div>
  )
}

// ── TV Grid: auto-fit all widgets into viewport (no scroll) ──────────────────

/**
 * TV Grid: compacts the layout to fit all widgets on one screen.
 * KPI widgets → small row at top. Charts/tables → fill remaining space.
 * No scrolling.
 */
function TVGrid({ layouts, widgets }: { layouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>; widgets: WidgetConfig[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Build a compacted TV layout: KPIs get 2 rows, charts get equal share of remaining
  const tvLayout = useMemo(() => {
    const items = layouts.lg ?? []
    if (!items.length) return items

    // Separate KPIs (h<=3 in original) from charts/tables
    const kpis = items.filter((l) => l.h <= 3)
    const charts = items.filter((l) => l.h > 3)

    const kpiRowH = 2 // KPIs are compact (2 grid rows)
    const chartStartY = kpis.length > 0 ? kpiRowH : 0

    // How many chart rows can we stack? Each gets equal height
    // Find distinct Y values among charts to know how many rows of charts
    const chartYs = [...new Set(charts.map((c) => c.y))].sort((a, b) => a - b)
    const chartRowCount = chartYs.length || 1
    const chartH = Math.max(3, Math.floor((20 - chartStartY) / chartRowCount)) // assume ~20 total grid rows

    const compacted: typeof items = []

    // Place KPIs in row 0
    if (kpis.length) {
      const kpiW = Math.floor(12 / kpis.length)
      kpis.forEach((l, i) => {
        compacted.push({ ...l, x: i * kpiW, y: 0, w: kpiW, h: kpiRowH })
      })
    }

    // Place charts/tables in subsequent rows
    const yMap = new Map<number, number>() // original Y → new Y
    chartYs.forEach((origY, idx) => yMap.set(origY, chartStartY + idx * chartH))

    charts.forEach((l) => {
      compacted.push({
        ...l,
        y: yMap.get(l.y) ?? chartStartY,
        h: chartH,
      })
    })

    return compacted
  }, [layouts])

  const maxRow = useMemo(() => tvLayout.reduce((m, l) => Math.max(m, l.y + l.h), 1), [tvLayout])

  const [dims, setDims] = useState({ rh: 40, scale: 1 })

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return
      const availH = containerRef.current.clientHeight
      const gap = 8
      // Try fitting with rowHeight calculation first
      const idealRh = Math.floor((availH - (maxRow + 1) * gap) / maxRow)

      if (idealRh >= 20) {
        // Fits naturally — no scaling needed
        setDims({ rh: idealRh, scale: 1 })
      } else {
        // Too many rows — use a readable rowHeight (32) and scale down
        const naturalH = maxRow * (32 + gap) + gap
        const scale = Math.max(0.5, availH / naturalH)
        setDims({ rh: 32, scale })
      }
    }
    calc()
    window.addEventListener('resize', calc)
    const t = setTimeout(calc, 100)
    return () => { window.removeEventListener('resize', calc); clearTimeout(t) }
  }, [maxRow])

  const gridEl = (
    <ResponsiveGrid
      className="layout"
      layouts={{ lg: tvLayout }}
      breakpoints={{ lg: 996, md: 768, sm: 0 }}
      cols={{ lg: 12, md: 8, sm: 4 }}
      rowHeight={dims.rh}
      margin={[8, 8]}
      isDraggable={false}
      isResizable={false}
    >
      {widgets.map((w: WidgetConfig) => (
        <div key={w.id} className="tv-widget-card">
          <WidgetRenderer config={w} editMode={false} />
        </div>
      ))}
    </ResponsiveGrid>
  )

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden px-2 tv-widgets">
      {dims.scale < 1 ? (
        <div style={{
          transform: `scale(${dims.scale})`,
          transformOrigin: 'top center',
          width: `${100 / dims.scale}%`,
        }}>
          {gridEl}
        </div>
      ) : gridEl}
    </div>
  )
}

// ── Laser pointer component ──────────────────────────────────────────────────

function LaserPointer() {
  const dotRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let x = 0, y = 0
    const onMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = `${x}px`
        dotRef.current.style.top = `${y}px`
      }
      if (trailRef.current) {
        trailRef.current.style.left = `${x}px`
        trailRef.current.style.top = `${y}px`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {/* Glow trail */}
      <div
        ref={trailRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)',
          transition: 'left 0.08s ease-out, top 0.08s ease-out',
        }}
      />
      {/* Laser dot */}
      <div
        ref={dotRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full shadow-[0_0_12px_3px_rgba(239,68,68,0.8)]"
        style={{ background: '#ef4444' }}
      />
    </div>
  )
}
