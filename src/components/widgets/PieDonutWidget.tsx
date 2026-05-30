import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { WidgetConfig } from '@/types'
import { groupAndAggregate } from '@/lib/aggregate'
import { CHART_PALETTE, formatNumber, toNumber } from '@/lib/utils'
import { ChartTooltip } from './ChartTheme'

export function PieDonutWidget({
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
        name: d.key,
        value: d.value,
      }))
    }
    return rows.map((r) => ({ name: String(r[labelKey]), value: toNumber(r[valueKey]) ?? 0 }))
  }, [rows, groupBy, labelKey, valueKey, aggregation])

  const total = data.reduce((a, b) => a + b.value, 0)

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8B949E' }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-[11px] uppercase tracking-wide text-text-secondary">Total</span>
        <span className="font-data text-xl font-semibold text-text-primary">
          {formatNumber(total, { compact: true })}
        </span>
      </div>
    </div>
  )
}
