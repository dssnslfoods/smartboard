import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Database,
  LayoutGrid,
  PanelsTopLeft,
  Settings,
  Sparkles,
  Wrench,
  ShieldCheck,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/stores/userStore'
import { SourceSelector } from './SourceSelector'
import { Badge } from '@/components/ui/Badge'

const NAV = [
  { to: '/', label: 'Hub', icon: PanelsTopLeft, end: true },
  { to: '/sources', label: 'Sources', icon: Database, adminOnly: true },
  { to: '/widget-builder', label: 'Widget Builder', icon: Wrench, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const { user, setRole } = useUserStore()
  const isAdmin = user.role === 'admin'

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-bg-secondary">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 ring-1 ring-accent-blue/30">
            <LayoutGrid className="h-4 w-4 text-accent-blue" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none text-text-primary">Boardroom</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-text-secondary">
              Executive Analytics
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-blue/12 text-accent-blue ring-1 ring-accent-blue/20'
                    : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* SmartSales shortcut */}
        <div className="px-3 pb-1">
          <Link
            to="/smartsales"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            SmartSales
          </Link>
        </div>

        {/* Role switcher */}
        <div className="border-t border-border p-3">
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-text-secondary">
            Access role
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-bg-primary p-1">
            <button
              onClick={() => setRole('admin')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
                isAdmin ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </button>
            <button
              onClick={() => setRole('viewer')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
                !isAdmin ? 'bg-accent-purple/15 text-accent-purple' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Eye className="h-3.5 w-3.5" /> Viewer
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
          <SourceSelector />
          <div className="flex items-center gap-3">
            <Badge tone={isAdmin ? 'blue' : 'purple'}>
              {isAdmin ? 'Admin' : 'Viewer'}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-card text-xs font-semibold text-text-primary ring-1 ring-border">
                {user.name.slice(0, 1)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
