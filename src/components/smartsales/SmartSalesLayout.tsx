import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  CircleHelp,
  Compass,
  Database,
  FileText,
  LayoutDashboard,
  Map,
  Sparkles,
  Users,
} from 'lucide-react'
import { INTEL_META } from '@/lib/intelligenceData'

const NAV: { label: string; icon: typeof LayoutDashboard; to?: string }[] = [
  { label: 'DASHBOARD', icon: LayoutDashboard, to: '/' },
  { label: 'CUSTOMERS', icon: Users, to: '/customers' },
  { label: 'NBA ENGINE', icon: Sparkles },
  { label: 'ACTIVITIES', icon: Activity },
  { label: 'REPORTS', icon: FileText, to: '/reports' },
  { label: 'TERRITORY MAP', icon: Map },
  { label: 'WHAT-IF', icon: Compass },
  { label: 'DATA MINING', icon: Database },
]

const itemBase =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors'

export function SmartSalesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-[#16223f] text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">SmartSales</div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400">Intelligent</div>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((n) =>
            n.to ? (
              <NavLink
                key={n.label}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `${itemBase} ${
                    isActive
                      ? 'bg-amber-500 text-[#16223f] shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ) : (
              <button
                key={n.label}
                title="Coming soon"
                className={`${itemBase} cursor-default text-slate-500 hover:bg-white/5`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </button>
            )
          )}
        </nav>
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] font-bold tracking-widest text-slate-500">V 1.0.0</div>
          <div className="text-[8px] uppercase tracking-widest text-slate-600">SmartSales Intelligent</div>
          <Link to="/boardroom" className="mt-3 block text-[9px] text-amber-400 hover:underline">
            Boardroom Portal →
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800">{INTEL_META.org}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                {INTEL_META.subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CircleHelp className="h-4 w-4 text-slate-400" />
            <Bell className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{INTEL_META.user}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">
                  ● {INTEL_META.role}
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-auto p-8">{children}</main>

        <footer className="space-y-1 border-t border-slate-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Last sync: {INTEL_META.lastSync} · {INTEL_META.version}</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <Activity className="h-3 w-3" /> Real-time Hub Connected
            </span>
          </div>
          <div className="pt-1 text-center text-[10px] text-slate-400">
            © 2026 SmartSales Intelligent. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}

/** Year + month filter control (shared across pages). */
export function YearMonthFilter({
  year,
  month,
  onYear,
  onMonth,
  years,
  monthNames,
}: {
  year: number
  month: number
  onYear: (y: number) => void
  onMonth: (m: number) => void
  years: number[]
  monthNames: string[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">📅</span>
        <select
          value={month}
          onChange={(e) => onMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-400"
        >
          <option value={0}>ทุกเดือน</option>
          {monthNames.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => onYear(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Filtering for: {month === 0 ? `Year ${year}` : `${monthNames[month - 1]} ${year}`}
        </span>
      </div>
    </div>
  )
}
