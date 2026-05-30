import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WidgetConfig } from '@/types'
import { groupAndAggregate } from '@/lib/aggregate'
import { CHART_PALETTE, toNumber } from '@/lib/utils'
import { AXIS_PROPS, ChartTooltip, GRID_PROPS } from './ChartTheme'

export function BarChartWidget({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const { groupBy, aggregation } = config.query
  const labelKey = config.mapping?.labelKey ?? groupBy ?? config.query.select.split(',')[0].trim()
  const valueKey = config.mapping?.valueKey ?? config.query.select.split(',')[1]?.trim() ?? 'value'

  const data = useMemo(() => {
    if (groupBy) {
      return groupAndAggregate(rows, labelKey, valueKey, aggregation ?? 'sum').map((d) => ({
        label: d.key,
        value: d.value,
      }))
    }
    return rows.map((r) => ({ label: String(r[labelKey]), value: toNumber(r[valueKey]) ?? 0 }))
  }, [rows, groupBy, labelKey, valueKey, aggregation])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" {...AXIS_PROPS} minTickGap={8} />
        <YAxis {...AXIS_PROPS} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(88,166,255,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8B949E' }} />
        <Bar dataKey="value" name={valueKey} radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
