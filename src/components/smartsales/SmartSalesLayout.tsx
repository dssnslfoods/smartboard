import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, BarChart3, Bell, CircleHelp, FileText, LayoutDashboard, Users } from 'lucide-react'
import { INTEL_META } from '@/lib/intelligenceData'

// Top nav items (no sidebar — compact top-only navigation)
const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Customers', icon: Users, to: '/customers' },
  { label: 'Reports', icon: FileText, to: '/reports' },
]

export function SmartSalesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top header — org + nav + user */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-0 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <div className="text-sm font-extrabold leading-none text-slate-800">{INTEL_META.org}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">
              {INTEL_META.subtitle}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </NavLink>
          ))}
          <Link
            to="/boardroom"
            className="ml-3 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700 transition-colors"
          >
            Boardroom →
          </Link>
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 py-3">
          <CircleHelp className="h-4 w-4 text-slate-400" />
          <Bell className="h-4 w-4 text-slate-400" />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{INTEL_META.user}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">
              ● {INTEL_META.role}
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
            A
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 py-7 space-y-6">{children}</main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-4 text-[10px] text-slate-400">
        <span>Last sync: {INTEL_META.lastSync} · {INTEL_META.version}</span>
        <span className="flex items-center gap-1 text-emerald-500">
          <Activity className="h-3 w-3" /> Real-time Hub Connected
        </span>
      </footer>
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
