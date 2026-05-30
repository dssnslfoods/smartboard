import { create } from 'zustand'
import type { AppSettings } from '@/types'

const STORAGE_KEY = 'boardroom.settings.v1'

const defaults: AppSettings = {
  theme: 'dark',
  defaultDateRange: '30d',
  defaultRefreshInterval: 0,
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch {
    /* noop */
  }
  return defaults
}

function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement
  root.classList.toggle('theme-darker', theme === 'darker')
}

interface SettingsState extends AppSettings {
  update: (patch: Partial<AppSettings>) => void
}

const initial = load()
applyTheme(initial.theme)

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initial,
  update: (patch) =>
    set((s) => {
      const next = { ...s, ...patch }
      const { update: _omit, ...persistable } = next
      void _omit
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
      if (patch.theme) applyTheme(patch.theme)
      return next
    }),
}))
