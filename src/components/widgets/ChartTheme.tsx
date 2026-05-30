import type { TooltipProps } from 'recharts'
import { formatNumber } from '@/lib/utils'

export const AXIS_PROPS = {
  stroke: '#8B949E',
  tick: { fill: '#8B949E', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: '#21262D' },
}

export const GRID_PROPS = {
  stroke: '#21262D',
  strokeDasharray: '3 3',
  vertical: false,
}

export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-bg-secondary/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label != null && <div className="mb-1 font-medium text-text-primary">{String(label)}</div>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 font-data">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name}</span>
            <span className="ml-auto text-text-primary">
              {typeof p.value === 'number' ? formatNumber(p.value, { compact: true }) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
