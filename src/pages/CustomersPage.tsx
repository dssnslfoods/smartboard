import { useMemo, useState } from 'react'
import { Download, Search, Users } from 'lucide-react'
import { CUSTOMERS, TOTAL_CUSTOMERS, type CustomerRow } from '@/lib/intelligenceData'
import { SmartSalesLayout } from '@/components/smartsales/SmartSalesLayout'

const baht = (n: number) => `฿${n.toLocaleString('en-US')}`
const compact = (n: number) =>
  '฿' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K')

const SEGMENT_TONE: Record<string, string> = {
  champions: 'bg-indigo-100 text-indigo-700',
  loyal: 'bg-amber-100 text-amber-700',
  potential: 'bg-emerald-100 text-emerald-700',
  new: 'bg-violet-100 text-violet-700',
  at_risk: 'bg-orange-100 text-orange-700',
  hibernating: 'bg-slate-100 text-slate-500',
}

type SortKey = 'revenue' | 'invoices' | 'balance' | 'name'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('all')
  const [region, setRegion] = useState<'all' | 'Domestic' | 'Overseas'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')

  const segments = useMemo(
    () => ['all', ...Array.from(new Set(CUSTOMERS.map((c) => c.segment)))],
    []
  )

  const rows = useMemo(() => {
    let out: CustomerRow[] = CUSTOMERS.filter((c) => {
      if (segment !== 'all' && c.segment !== segment) return false
      if (region !== 'all' && c.seg !== region) return false
      if (search && !`${c.name} ${c.code} ${c.region}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    out = [...out].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
    return out
  }, [search, segment, region, sortKey])

  const totals = useMemo(
    () => ({
      revenue: rows.reduce((a, c) => a + c.revenue, 0),
      balance: rows.reduce((a, c) => a + c.balance, 0),
      active: rows.filter((c) => c.invoices > 0).length,
    }),
    [rows]
  )

  const exportCsv = () => {
    const headers = ['name', 'code', 'region', 'segment', 'type', 'revenue', 'invoices', 'balance', 'last_order']
    const lines = rows.map((c) =>
      [c.name, c.code, c.region, c.segment, c.seg, c.revenue, c.invoices, c.balance, c.last_order ?? '']
        .map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v))
        .join(',')
    )
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'customers.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const stat = (label: string, value: string, sub: string) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  )

  return (
    <SmartSalesLayout>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">CUSTOMERS</h1>
          <p className="text-xs text-slate-400">ฐานข้อมูลลูกค้า · RFM segments · ยอดค้างชำระ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat('Total Customers', String(TOTAL_CUSTOMERS), 'in master data')}
        {stat('Matching', String(rows.length), `${totals.active} with orders`)}
        {stat('Revenue (filtered)', compact(totals.revenue), 'lifetime invoiced')}
        {stat('Outstanding (filtered)', compact(totals.balance), 'current balance')}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, region…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-amber-400">
            {segments.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All segments' : s}</option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value as never)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-amber-400">
            <option value="all">All regions</option>
            <option value="Domestic">Domestic</option>
            <option value="Overseas">Overseas</option>
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-amber-400">
            <option value="revenue">Sort: Revenue</option>
            <option value="invoices">Sort: Invoices</option>
            <option value="balance">Sort: Balance</option>
            <option value="name">Sort: Name</option>
          </select>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Region</th>
                <th className="px-4 py-3 font-bold">Segment</th>
                <th className="px-4 py-3 text-right font-bold">Revenue</th>
                <th className="px-4 py-3 text-right font-bold">Invoices</th>
                <th className="px-4 py-3 text-right font-bold">Balance</th>
                <th className="px-4 py-3 font-bold">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.code} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-700">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.code} · {c.seg}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{c.region}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEGMENT_TONE[c.segment] ?? 'bg-slate-100 text-slate-500'}`}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">{baht(c.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{c.invoices}</td>
                  <td className={`px-4 py-2.5 text-right font-mono ${c.balance > 0 ? 'font-semibold text-red-500' : 'text-slate-400'}`}>{baht(c.balance)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.last_order ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">No customers match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[11px] text-slate-400">
          Showing top {CUSTOMERS.length} customers by lifetime revenue · {rows.length} matching
        </div>
      </div>
    </SmartSalesLayout>
  )
}
