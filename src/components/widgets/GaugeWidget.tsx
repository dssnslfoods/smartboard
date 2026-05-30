import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'
import { aggregate } from '@/lib/aggregate'
import { formatNumber } from '@/lib/utils'

export function GaugeWidget({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const valueKey = config.mapping?.valueKey ?? config.query.select.split(',')[0].trim()
  const fn = config.query.aggregation ?? 'sum'
  const target = config.mapping?.target ?? 100
  const unit = config.mapping?.unit ?? ''
  const prefix = config.mapping?.prefix ?? ''

  const value = useMemo(() => aggregate(rows, valueKey, fn), [rows, valueKey, fn])
  const pct = Math.max(0, Math.min(100, (value / target) * 100))
  const color = pct >= 90 ? '#3FB950' : pct >= 60 ? '#D29922' : '#F85149'

  const data = [
    { name: 'value', value: pct },
    { name: 'rest', value: 100 - pct },
  ]

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={210}
            endAngle={-30}
            innerRadius="64%"
            outerRadius="92%"
            stroke="none"
            cornerRadius={6}
          >
            <Cell fill={color} />
            <Cell fill="#21262D" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data text-2xl font-semibold" style={{ color }}>
          {pct.toFixed(0)}%
        </span>
        <span className="mt-0.5 font-data text-xs text-text-secondary">
          {prefix}
          {formatNumber(value, { compact: true })} / {prefix}
          {formatNumber(target, { compact: true })}
          {unit}
        </span>
      </div>
    </div>
  )
}
