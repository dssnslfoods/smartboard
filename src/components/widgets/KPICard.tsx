import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { WidgetConfig } from '@/types'
import { aggregate } from '@/lib/aggregate'
import { useCountUp } from '@/hooks/useCountUp'
import { cn, formatNumber, formatPercent, toNumber } from '@/lib/utils'

export function KPICard({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const valueKey = config.mapping?.valueKey ?? config.query.select.split(',')[0].trim()
  const fn = config.query.aggregation ?? 'sum'

  const { value, trend, spark } = useMemo(() => {
    const value = aggregate(rows, valueKey, fn)
    // build a sparkline series and a trend by splitting the series in half
    const series = rows
      .map((r) => toNumber(r[valueKey]))
      .filter((n): n is number => n != null)
    let trend: number | null = null
    if (series.length >= 4) {
      const mid = Math.floor(series.length / 2)
      const first = series.slice(0, mid).reduce((a, b) => a + b, 0)
      const second = series.slice(mid).reduce((a, b) => a + b, 0)
      if (first !== 0) trend = ((second - first) / Math.abs(first)) * 100
    }
    const spark = series.slice(-24).map((v, i) => ({ i, v }))
    return { value, trend, spark }
  }, [rows, valueKey, fn])

  const animated = useCountUp(value)
  const prefix = config.mapping?.prefix ?? ''
  const unit = config.mapping?.unit ?? ''
  const compact = Math.abs(value) >= 10000

  const trendTone =
    trend == null ? 'text-text-secondary' : trend >= 0 ? 'text-accent-green' : 'text-accent-red'
  const TrendIcon = trend == null ? Minus : trend >= 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="font-data text-3xl font-semibold leading-none text-text-primary">
          {prefix}
          {formatNumber(animated, { compact, decimals: compact ? 1 : 0 })}
          {unit && <span className="ml-0.5 text-lg text-text-secondary">{unit}</span>}
        </div>
        <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trendTone)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trend == null ? 'No trend' : formatPercent(trend)}
          <span className="text-text-secondary font-normal">vs prior period</span>
        </div>
      </div>
      {spark.length > 1 && (
        <div className="-mx-1 mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={`spark-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#58A6FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#58A6FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#58A6FF"
                strokeWidth={1.5}
                fill={`url(#spark-${config.id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
