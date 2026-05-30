import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DataSource } from '@/types'

const STORAGE_KEY = 'boardroom.sources.v1'

/**
 * Multi-Supabase client manager.
 *
 * Holds a live SupabaseClient per registered source and persists the source
 * *configs* (including anon keys) in localStorage. Anon keys are public by
 * design, but we deliberately never write them to any database — they live
 * only in the browser.
 */
class SupabaseManager {
  private clients = new Map<string, SupabaseClient>()
  private configs = new Map<string, DataSource>()

  constructor() {
    this.hydrate()
  }

  private hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed: DataSource[] = JSON.parse(raw)
      for (const cfg of parsed) {
        this.configs.set(cfg.id, cfg)
        this.instantiate(cfg)
      }
    } catch (err) {
      console.error('Failed to hydrate sources', err)
    }
  }

  private persist() {
    const all = [...this.configs.values()]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  }

  private instantiate(cfg: DataSource): SupabaseClient | null {
    try {
      const client = createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      this.clients.set(cfg.id, client)
      return client
    } catch (err) {
      console.error(`Failed to create client for source ${cfg.id}`, err)
      return null
    }
  }

  registerSource(cfg: DataSource): DataSource {
    this.configs.set(cfg.id, cfg)
    // recreate client to pick up url/key changes
    this.clients.delete(cfg.id)
    this.instantiate(cfg)
    this.persist()
    return cfg
  }

  removeSource(id: string) {
    this.clients.delete(id)
    this.configs.delete(id)
    this.persist()
  }

  getClient(id: string): SupabaseClient | undefined {
    return this.clients.get(id)
  }

  getConfig(id: string): DataSource | undefined {
    return this.configs.get(id)
  }

  listSources(): DataSource[] {
    return [...this.configs.values()]
  }
}

export const supabaseManager = new SupabaseManager()
