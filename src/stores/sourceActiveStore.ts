import { create } from 'zustand'

const STORAGE_KEY = 'boardroom.sourceActive.v1'

function load(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* noop */
  }
  return {}
}

function persist(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

interface SourceActiveState {
  /** id -> active flag. Missing entry = active by default. */
  map: Record<string, boolean>
  isActive: (id: string) => boolean
  setActive: (id: string, active: boolean) => void
  toggle: (id: string) => void
}

/**
 * Per-source active/inactive toggle. Inactive sources are hidden from the
 * source selector, dashboard tabs, and widget builder — but their config and
 * data remain so they can be re-enabled instantly.
 */
export const useSourceActiveStore = create<SourceActiveState>((set, get) => ({
  map: load(),
  isActive: (id) => get().map[id] !== false,
  setActive: (id, active) =>
    set((s) => {
      const next = { ...s.map, [id]: active }
      persist(next)
      return { map: next }
    }),
  toggle: (id) => {
    const cur = get().isActive(id)
    get().setActive(id, !cur)
  },
}))
