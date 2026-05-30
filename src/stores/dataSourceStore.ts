import { create } from 'zustand'
import { supabaseManager } from '@/lib/supabaseManager'
import type { ConnectionStatus, DataSource } from '@/types'
import { uid } from '@/lib/utils'

interface DataSourceState {
  sources: DataSource[]
  activeSourceId: string | null
  status: Record<string, ConnectionStatus>
  addSource: (input: Omit<DataSource, 'id' | 'isActive'> & { id?: string }) => DataSource
  updateSource: (id: string, patch: Partial<DataSource>) => void
  removeSource: (id: string) => void
  setActive: (id: string | null) => void
  testConnection: (id: string) => Promise<ConnectionStatus>
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  sources: supabaseManager.listSources(),
  activeSourceId: supabaseManager.listSources()[0]?.id ?? null,
  status: {},

  addSource: (input) => {
    const source: DataSource = {
      id: input.id ?? uid('src'),
      name: input.name,
      url: input.url,
      anonKey: input.anonKey,
      color: input.color,
      description: input.description,
      isActive: true,
    }
    supabaseManager.registerSource(source)
    set((s) => ({
      sources: [...s.sources.filter((x) => x.id !== source.id), source],
      activeSourceId: s.activeSourceId ?? source.id,
    }))
    return source
  },

  updateSource: (id, patch) => {
    const existing = get().sources.find((s) => s.id === id)
    if (!existing) return
    const next = { ...existing, ...patch }
    supabaseManager.registerSource(next)
    set((s) => ({ sources: s.sources.map((x) => (x.id === id ? next : x)) }))
  },

  removeSource: (id) => {
    supabaseManager.removeSource(id)
    set((s) => {
      const sources = s.sources.filter((x) => x.id !== id)
      const status = { ...s.status }
      delete status[id]
      return {
        sources,
        status,
        activeSourceId:
          s.activeSourceId === id ? sources[0]?.id ?? null : s.activeSourceId,
      }
    })
  },

  setActive: (id) => set({ activeSourceId: id }),

  testConnection: async (id) => {
    set((s) => ({ status: { ...s.status, [id]: { state: 'connecting' } } }))
    const cfg = get().sources.find((s) => s.id === id)
    if (!cfg) {
      const result: ConnectionStatus = {
        state: 'error',
        error: 'Source not found',
        checkedAt: Date.now(),
      }
      set((s) => ({ status: { ...s.status, [id]: result } }))
      return result
    }
    const started = performance.now()
    try {
      // PostgREST exposes an OpenAPI document at the REST root. A 200 means the
      // project is reachable and the anon key is valid; `definitions` lists the
      // tables/views the anon role can see.
      const res = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/`, {
        headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
      })
      const latencyMs = Math.round(performance.now() - started)
      if (!res.ok) {
        // Translate common PostgREST failures into actionable guidance.
        const explain: Record<number, string> = {
          401: 'Invalid anon key — copy the correct anon (public) key from Supabase → Settings → API',
          403: 'Forbidden — key valid but blocked (check key role / RLS)',
          404: 'Not found — check the project URL',
        }
        const result: ConnectionStatus = {
          state: 'error',
          error: explain[res.status] ?? `HTTP ${res.status}`,
          latencyMs,
          checkedAt: Date.now(),
        }
        set((s) => ({ status: { ...s.status, [id]: result } }))
        return result
      }
      let tableCount: number | undefined
      try {
        const spec = await res.json()
        tableCount = spec?.definitions ? Object.keys(spec.definitions).length : undefined
      } catch {
        /* spec not JSON — still reachable */
      }
      const result: ConnectionStatus = {
        state: 'connected',
        latencyMs,
        tableCount,
        checkedAt: Date.now(),
      }
      set((s) => ({ status: { ...s.status, [id]: result } }))
      return result
    } catch (err) {
      const result: ConnectionStatus = {
        state: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
        latencyMs: Math.round(performance.now() - started),
        checkedAt: Date.now(),
      }
      set((s) => ({ status: { ...s.status, [id]: result } }))
      return result
    }
  },
}))
