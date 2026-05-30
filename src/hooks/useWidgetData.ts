import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { runQuery } from '@/lib/queryEngine'
import { DEMO_SOURCE_ID, isDemoTable, runDemoQuery } from '@/lib/demoData'
import {
  isSnapshotSource,
  isSnapshotTable,
  runSnapshotQuery,
} from '@/lib/snapshotData'
import { isLiveSource, fetchLive } from '@/lib/liveSourceConfig'
import { supabaseManager } from '@/lib/supabaseManager'
import type { WidgetConfig } from '@/types'

export interface WidgetData {
  rows: Record<string, unknown>[]
  count: number | null
}

async function fetchWidget(config: WidgetConfig): Promise<WidgetData> {
  // 1. Live sources — fetch real-time from Supabase REST API
  //    Falls back to snapshot if live fails or returns empty
  if (isLiveSource(config.sourceId)) {
    try {
      const rows = await fetchLive(config.sourceId, config.query.table)
      if (rows.length > 0) return { rows, count: rows.length }
    } catch {
      // Live fetch failed — fall through to snapshot
    }
    // Fallback to snapshot
    if (isSnapshotTable(config.query.table)) {
      const rows = runSnapshotQuery(config.query)
      return { rows, count: rows.length }
    }
  }

  // 2. Snapshot (baked aggregates)
  if (isSnapshotSource(config.sourceId) || isSnapshotTable(config.query.table)) {
    const rows = runSnapshotQuery(config.query)
    return { rows, count: rows.length }
  }

  // 3. Demo source
  if (config.sourceId === DEMO_SOURCE_ID || isDemoTable(config.query.table)) {
    const rows = runDemoQuery(config.query)
    return { rows, count: rows.length }
  }

  // 4. User-added live Supabase sources (via supabaseManager)
  const { rows, count } = await runQuery(config.query, config.sourceId)
  return { rows, count }
}

export function useWidgetData(config: WidgetConfig) {
  const queryClient = useQueryClient()
  const key = ['widget', config.sourceId, config.query, config.visualization]

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchWidget(config),
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
    staleTime: isLiveSource(config.sourceId) ? 30_000 : 15_000, // live sources: 30s stale
  })

  // Optional Supabase Realtime subscription -> invalidate on change.
  useEffect(() => {
    if (!config.realtime || config.sourceId === DEMO_SOURCE_ID) return
    const client = supabaseManager.getClient(config.sourceId)
    if (!client) return
    const channel = client
      .channel(`rt_${config.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: config.query.table },
        () => queryClient.invalidateQueries({ queryKey: key })
      )
      .subscribe()
    return () => {
      client.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.realtime, config.sourceId, config.query.table, config.id])

  return query
}
