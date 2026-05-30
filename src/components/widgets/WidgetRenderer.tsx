import type { WidgetConfig } from '@/types'
import { useWidgetData } from '@/hooks/useWidgetData'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_META, SNAPSHOT_SOURCE_ID } from '@/lib/snapshotData'
import { WidgetFrame } from './WidgetFrame'
import { KPICard } from './KPICard'
import { LineChartWidget } from './LineChartWidget'
import { BarChartWidget } from './BarChartWidget'
import { PieDonutWidget } from './PieDonutWidget'
import { GaugeWidget } from './GaugeWidget'
import { HeatmapWidget } from './HeatmapWidget'
import { DataTableWidget } from './DataTableWidget'

interface Props {
  config: WidgetConfig
  editMode?: boolean
  onEdit?: (config: WidgetConfig) => void
  onRemove?: (id: string) => void
}

export function WidgetRenderer({ config, editMode, onEdit, onRemove }: Props) {
  const { data, isLoading, isFetching, error, refetch } = useWidgetData(config)
  const source = useDataSourceStore((s) =>
    s.sources.find((src) => src.id === config.sourceId)
  )

  const rows = data?.rows ?? []
  const sourceColor =
    config.sourceId === SNAPSHOT_SOURCE_ID
      ? SNAPSHOT_META.color
      : config.sourceId === DEMO_SOURCE_ID
        ? '#BC8CFF'
        : source?.color
  const sourceName =
    config.sourceId === SNAPSHOT_SOURCE_ID
      ? SNAPSHOT_META.name
      : config.sourceId === DEMO_SOURCE_ID
        ? 'Demo data'
        : source?.name

  const inner = () => {
    switch (config.visualization) {
      case 'kpi':
        return <KPICard rows={rows} config={config} />
      case 'line':
        return <LineChartWidget rows={rows} config={config} />
      case 'bar':
        return <BarChartWidget rows={rows} config={config} />
      case 'pie':
        return <PieDonutWidget rows={rows} config={config} />
      case 'gauge':
        return <GaugeWidget rows={rows} config={config} />
      case 'heatmap':
        return <HeatmapWidget rows={rows} config={config} />
      case 'table':
        return <DataTableWidget rows={rows} config={config} />
      default:
        return null
    }
  }

  return (
    <WidgetFrame
      title={config.title}
      sourceColor={sourceColor}
      sourceName={sourceName}
      loading={isLoading}
      error={error ? (error as Error).message : null}
      empty={!isLoading && rows.length === 0}
      onRefresh={() => refetch()}
      onEdit={onEdit ? () => onEdit(config) : undefined}
      onRemove={onRemove ? () => onRemove(config.id) : undefined}
      editMode={editMode}
      footer={
        config.refreshInterval
          ? `Auto-refresh ${config.refreshInterval}s${isFetching ? ' · updating…' : ''}`
          : undefined
      }
    >
      {inner()}
    </WidgetFrame>
  )
}
