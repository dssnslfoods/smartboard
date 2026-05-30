import { useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  computeView,
  MONTH_NAMES,
  PAYMENTS_MONTHLY,
  PRODUCT_GROUP_BY_YEAR,
  SALESPERSON_BY_YEAR,
  YEARS,
} from '@/lib/intelligenceData'
import { SmartSalesLayout, YearMonthFilter } from '@/components/smartsales/SmartSalesLayout'

const compact = (n: number) =>
  '฿' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K')
const baht = (n: number) => `฿${Math.round(n).toLocaleString('en-US')}`

const BAR_COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#FBBF24', '#10B981', '#34D399']

function Card({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</div>
          {sub && <div className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function ReportsPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(0)

  const view = useMemo(() => computeView(year, month), [year, month])
  const reps = SALESPERSON_BY_YEAR[year] ?? []
  const groups = PRODUCT_GROUP_BY_YEAR[year] ?? []

  // monthly revenue vs collections for the selected year
  const monthly = useMemo(() => {
    return view.trend.map((t, i) => {
      const pay = PAYMENTS_MONTHLY.find((p) => p.yr === year && p.mo === i + 1)?.payments ?? 0
      return { month: t.month, revenue: t.revenue, payments: pay }
    })
  }, [view.trend, year])

  const repTotal = reps.reduce((a, r) => a + r.revenue, 0)
  const periodLabel = month === 0 ? `Year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`

  const exportSummary = () => {
    const rows: string[] = ['Report,Label,Revenue,Extra']
    reps.forEach((r) => rows.push(`Salesperson,${r.name},${r.revenue},${r.invoices} invoices`))
    groups.forEach((g) => rows.push(`Product Group,"${g.group}",${g.revenue},`))
    monthly.forEach((m) => rows.push(`Monthly,${m.month} ${year},${m.revenue},payments ${m.payments}`))
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `report-${year}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <SmartSalesLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">REPORTS</h1>
            <p className="text-xs text-slate-400">รายงานยอดขาย · พนักงานขาย · กลุ่มสินค้า ({periodLabel})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <YearMonthFilter year={year} month={month} onYear={setYear} onMonth={setMonth} years={YEARS} monthNames={MONTH_NAMES} />
          <button onClick={exportSummary} className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Monthly revenue vs collections */}
      <Card title={`Revenue vs Collections (${year})`} sub="Invoiced revenue compared to payments collected">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => compact(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v: number) => baht(v)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#1E3A8A" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="payments" name="Collections" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#1E3A8A]" /> Revenue (invoiced)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" /> Collections (payments)</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Salesperson leaderboard */}
        <Card title="Salesperson Performance" sub={`Revenue by sales rep · ${year}`}>
          <div className="space-y-3">
            {reps.map((r, i) => (
              <div key={r.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{i + 1}. {r.name}</span>
                  <span className="font-mono font-semibold text-slate-800">{baht(r.revenue)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${repTotal ? (r.revenue / reps[0].revenue) * 100 : 0}%` }} />
                  </div>
                  <span className="w-16 text-right text-[10px] text-slate-400">{r.invoices} inv.</span>
                </div>
              </div>
            ))}
            {!reps.length && <div className="py-6 text-center text-sm text-slate-400">No data for {year}.</div>}
          </div>
        </Card>

        {/* Product group */}
        <Card title="Revenue by Product Group" sub={`Top product categories · ${year}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groups} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => compact(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="group" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={150} />
                <Tooltip formatter={(v: number) => baht(v)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {groups.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top countries / products table */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top Countries" sub={`Export destinations · ${year}`}>
          <table className="w-full text-left text-sm">
            <tbody>
              {view.countries.map((c, i) => (
                <tr key={c.country} className="border-t border-slate-100 first:border-0">
                  <td className="py-2.5 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-700">{c.flag} {c.country}</td>
                  <td className="py-2.5 text-right font-mono text-slate-700">{baht(c.revenue)}</td>
                  <td className="py-2.5 text-right font-bold text-slate-800">{c.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Top Products" sub={`Best-selling items · ${year}`}>
          <table className="w-full text-left text-sm">
            <tbody>
              {view.products.map((p, i) => (
                <tr key={p.item} className="border-t border-slate-100 first:border-0">
                  <td className="py-2.5 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-700">{p.item}</td>
                  <td className="py-2.5 text-right font-mono text-slate-700">{baht(p.revenue)}</td>
                  <td className="py-2.5 text-right font-bold text-slate-800">{p.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </SmartSalesLayout>
  )
}
