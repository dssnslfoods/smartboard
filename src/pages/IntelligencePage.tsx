import { useMemo, useState } from 'react'
import { Tv, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AR,
  AR_AGING,
  computeView,
  MONTH_NAMES,
  SEGMENTS,
  TOP_OVERDUE,
  YEARS,
} from '@/lib/intelligenceData'
import { SmartSalesLayout, YearMonthFilter } from '@/components/smartsales/SmartSalesLayout'

const baht = (n: number, dec = 2) =>
  `฿ ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
const bahtSigned = (n: number, dec = 2) => `${n < 0 ? '-' : ''}${baht(n, dec)}`
const compact = (n: number) =>
  '฿' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K')

function Sparkline({ down }: { down: boolean }) {
  const data = down
    ? [{ v: 8 }, { v: 6 }, { v: 7 }, { v: 4 }, { v: 5 }, { v: 2 }]
    : [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 5 }, { v: 8 }]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line type="monotone" dataKey="v" stroke={down ? '#EF4444' : '#10B981'} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function KpiCard({ label, sub, value, pct }: { label: string; sub: string; value: string; pct: number }) {
  const down = pct < 0
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm ring-1 ring-red-100/50">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-400">{sub}</div>
        </div>
        <span className={`flex items-center gap-0.5 text-[11px] font-bold ${down ? 'text-red-500' : 'text-emerald-500'}`}>
          {down ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className={`font-mono text-2xl font-bold ${down ? 'text-red-600' : 'text-slate-800'}`}>{value}</div>
        <div className="h-9 w-24 shrink-0">
          <Sparkline down={down} />
        </div>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        vs previous period
      </div>
    </div>
  )
}

function Card({ title, sub, icon: Icon, iconBg, children }: { title: string; sub?: string; icon?: typeof Wallet; iconBg?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: iconBg }}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <div className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</div>
          {sub && <div className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function IntelligencePage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(0)
  const [search, setSearch] = useState('')

  const view = useMemo(() => computeView(year, month), [year, month])
  const k = view.kpis
  const maxRev = Math.max(...view.trend.map((t) => t.revenue), 0)
  const agingTotal = AR_AGING.reduce((a, b) => a + b.amount, 0)
  const periodLabel = month === 0 ? `Year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`

  const filteredPaid = view.customersPaid.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SmartSalesLayout>
      {/* Title + filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black leading-none tracking-tight text-slate-800">
              INTELLIGENCE
              <br />
              DASHBOARD
            </h1>
            <p className="mt-1 text-xs text-slate-400">บริหารจัดการการขายอัจฉริยะ · ADMIN</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <YearMonthFilter
            year={year}
            month={month}
            onYear={setYear}
            onMonth={setMonth}
            years={YEARS}
            monthNames={MONTH_NAMES}
          />
          <button className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
            <Tv className="h-3.5 w-3.5" /> TV MODE
          </button>
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={`Revenue ${year}`} sub={`ยอดขาย (${periodLabel})`} value={baht(k.revenue)} pct={k.revPct} />
        <KpiCard label="Revenue YoY Diff" sub="เทียบช่วงเดียวกันปีก่อน (YoY)" value={bahtSigned(k.yoyDiff)} pct={k.yoyPct} />
        <KpiCard label="Average Revenue" sub="ค่าเฉลี่ยต่อบิล" value={baht(k.avg)} pct={k.avgPct} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Domestic MoM" sub="ส่วนต่างลูกค้าในประเทศ" value={bahtSigned(k.domestic)} pct={k.domesticPct} />
        <KpiCard label="Overseas MoM" sub="ส่วนต่างลูกค้าต่างประเทศ" value={bahtSigned(k.overseas)} pct={k.overseasPct} />
        <div />
      </div>

      {/* Revenue trend + segment velocity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title={`Revenue Trend (${year})`} sub="Monthly sales for current selected year">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={view.trend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => compact(v)} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v: number) => baht(v, 0)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {view.trend.map((d, i) => {
                    const isPeak = d.revenue === maxRev
                    const isSel = month !== 0 && i === month - 1
                    return <Cell key={i} fill={isSel ? '#F59E0B' : isPeak ? '#1E3A8A' : '#94A3B8'} />
                  })}
                </Bar>
                <Line type="monotone" dataKey={() => view.trendAvg} stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Segment Velocity" sub="% of customers by RFM group">
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SEGMENTS} dataKey="value" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                    {SEGMENTS.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2">
              {SEGMENTS.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-500">{s.name}</span>
                  <span className="ml-auto font-bold text-slate-700">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Product mix */}
      <Card title="Product Mix" sub="Revenue contribution by category · Top countries · Top products">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1.2fr_1.2fr]">
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={view.mix} dataKey="value" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {view.mix.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-[11px]">
              {view.mix.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-500">{s.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">🌐 Top Countries</div>
            <div className="space-y-3">
              {view.countries.map((c) => (
                <div key={c.country}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{c.flag} {c.country}</span>
                    <span className="font-bold text-slate-800">{c.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.pct}%` }} />
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-400">{baht(c.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">📦 Top Products</div>
            <div className="space-y-3">
              {view.products.map((p) => (
                <div key={p.item}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-slate-700">{p.item}</span>
                    <span className="shrink-0 font-bold text-slate-800">{p.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, p.pct * 4)}%` }} />
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-400">{baht(p.revenue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* AR & Payment */}
      <Card title="AR & Payment Analysis" sub="Accounts receivable · Collection · Risk" icon={Wallet} iconBg="#EF4444">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Outstanding AR', th: 'ยอดค้างรับ', value: baht(AR.outstanding), tone: 'text-slate-800', bg: 'bg-amber-50' },
            { label: 'Overdue AR', th: 'ยอดเกินกำหนด', value: baht(AR.overdue), tone: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Avg DSO', th: 'ระยะเวลาเก็บเงินเฉลี่ย', value: `${AR.avgDso} Days`, tone: 'text-slate-800', bg: 'bg-slate-50' },
            { label: 'Collection Rate', th: 'อัตราการเก็บเงิน', value: `${AR.collectionRate.toFixed(1)}%`, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-100 ${s.bg} p-4`}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</div>
              <div className={`mt-1 font-mono text-lg font-bold ${s.tone}`}>{s.value}</div>
              <div className="text-[9px] text-slate-400">{s.th}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">AR Aging Breakdown</div>
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={AR_AGING} dataKey="amount" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none">
                      {AR_AGING.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => baht(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {AR_AGING.map((s) => (
                  <div key={s.bucket} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-500">{s.bucket}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">{baht(s.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className="font-semibold text-slate-500">Total</span>
                  <span className="font-mono font-bold text-slate-800">{baht(agingTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Top Overdue Accounts</div>
            <div className="space-y-2">
              {TOP_OVERDUE.map((o) => (
                <div key={o.rank} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {o.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-700">{o.customer}</div>
                    <div className="text-[10px] text-slate-400">{o.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-slate-800">{baht(o.amount)}</div>
                    <div className="text-[10px] text-slate-400">{o.days}d overdue</div>
                  </div>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${o.risk === 'WATCHING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {o.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Customers paid */}
      <Card title="Customers Paid" sub={`Top customers with recent payments (${periodLabel})`}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer…"
          className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
        />
        <div className="space-y-2">
          {filteredPaid.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50">
              <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-700">{c.name}</div>
                <div className="text-[10px] text-slate-400">Last payment: {c.last}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-emerald-600">{baht(c.total)}</div>
                <div className="text-[10px] text-slate-400">{c.payments} payments</div>
              </div>
            </div>
          ))}
          {!filteredPaid.length && <div className="py-6 text-center text-sm text-slate-400">No customers found.</div>}
        </div>
      </Card>
    </SmartSalesLayout>
  )
}
