import { useMemo } from 'react'
import type { WidgetConfig } from '@/types'
import { toNumber } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * 7x24 activity heatmap. Expects rows with `day` (0-6), `hour` (0-23) and a
 * value column (default `count`).
 */
export function HeatmapWidget({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const valueKey = config.mapping?.valueKey ?? 'count'

  const { grid, max } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    let max = 0
    for (const r of rows) {
      const d = Number(r.day)
      const h = Number(r.hour)
      const v = toNumber(r[valueKey]) ?? 0
      if (d >= 0 && d < 7 && h >= 0 && h < 24) {
        grid[d][h] = v
        if (v > max) max = v
      }
    }
    return { grid, max: max || 1 }
  }, [rows, valueKey])

  const color = (v: number) => {
    const t = v / max
    if (t === 0) return 'var(--bg-secondary)'
    // interpolate toward accent-blue
    const alpha = 0.15 + t * 0.85
    return `rgba(88, 166, 255, ${alpha.toFixed(3)})`
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="min-w-[640px]">
          <div className="flex pl-10">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-text-secondary">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>
          {grid.map((rowVals, d) => (
            <div key={d} className="flex items-center">
              <div className="w-10 shrink-0 text-[10px] text-text-secondary">{DAYS[d]}</div>
              {rowVals.map((v, h) => (
                <div key={h} className="flex-1 px-px py-px" title={`${DAYS[d]} ${h}:00 — ${v}`}>
                  <div
                    className="h-5 w-full rounded-sm border border-border/40"
                    style={{ background: color(v) }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-text-secondary">
        Less
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span
            key={t}
            className="h-3 w-3 rounded-sm border border-border/40"
            style={{ background: color(t * max) }}
          />
        ))}
        More
      </div>
    </div>
  )
}
