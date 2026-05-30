import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WidgetConfig } from '@/types'
import { CHART_PALETTE, toNumber } from '@/lib/utils'
import { AXIS_PROPS, ChartTooltip, GRID_PROPS } from './ChartTheme'

export function LineChartWidget({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const cols = config.query.select.split(',').map((c) => c.trim())
  const xKey = config.mapping?.xKey ?? cols[0]
  const yKeys = config.mapping?.yKeys ?? cols.slice(1)
  const dualAxis = yKeys.length === 2

  const data = useMemo(
    () =>
      rows.map((r) => {
        const out: Record<string, unknown> = { [xKey]: r[xKey] }
        for (const k of yKeys) out[k] = toNumber(r[k]) ?? 0
        return out
      }),
    [rows, xKey, yKeys]
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} minTickGap={32} />
        <YAxis yAxisId="left" {...AXIS_PROPS} width={48} />
        {dualAxis && <YAxis yAxisId="right" orientation="right" {...AXIS_PROPS} width={48} />}
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8B949E' }} iconType="line" />
        {yKeys.map((k, i) => (
          <Line
            key={k}
            yAxisId={dualAxis && i === 1 ? 'right' : 'left'}
            type="monotone"
            dataKey={k}
            stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
