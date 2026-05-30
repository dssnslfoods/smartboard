import { create } from 'zustand'
import type { Role, User } from '@/types'

const STORAGE_KEY = 'boardroom.user.v1'

function load(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* noop */
  }
  return { id: 'local', name: 'Executive', email: '', role: 'admin' }
}

interface UserState {
  user: User
  setRole: (role: Role) => void
  setUser: (patch: Partial<User>) => void
  isAdmin: () => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  user: load(),
  setRole: (role) =>
    set((s) => {
      const user = { ...s.user, role }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      return { user }
    }),
  setUser: (patch) =>
    set((s) => {
      const user = { ...s.user, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      return { user }
    }),
  isAdmin: () => get().user.role === 'admin',
}))
