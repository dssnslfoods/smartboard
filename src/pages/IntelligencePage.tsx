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
import { InfoTooltip } from '@/components/ui/InfoTooltip'

const baht = (n: number, dec = 2) =>
  `฿ ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
const bahtSigned = (n: number, dec = 2) => `${n < 0 ? '-' : ''}${baht(n, dec)}`
const compact = (n: number) =>
  '฿' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n / 1e3).toFixed(0) + 'K')

// ── Tooltip content library ──────────────────────────────────────────────────
const TT = {
  revenue: [
    'ยอดขายรวม (Invoice) ในช่วงเวลาที่เลือก',
    'คำนวณจากมูลค่า Invoice ทั้งหมดที่ออกในปีนั้น',
    '📌 ใช้วัดขนาดธุรกิจโดยรวม และเปรียบเทียบกับเป้าหมายประจำปี',
  ],
  yoy: [
    'ผลต่างยอดขายเทียบกับช่วงเดียวกันของปีก่อน (Year-over-Year)',
    'ค่าติดลบ = ยอดขายลดลง | ค่าบวก = ยอดขายเติบโต',
    '📌 ใช้ประเมินทิศทางการเติบโตของธุรกิจ',
  ],
  avg: [
    'มูลค่า Invoice เฉลี่ยต่อใบในช่วงเวลาที่เลือก',
    'สูงขึ้น = ดีลมีขนาดใหญ่ขึ้น | ต่ำลง = ดีลเล็กลงหรือจำนวน Invoice มากขึ้น',
    '📌 ใช้ประเมินคุณภาพและขนาดของคำสั่งซื้อ',
  ],
  domestic: [
    'ผลต่างยอดขายลูกค้าในประเทศ (ไทย) เทียบกับช่วงเดียวกันปีก่อน',
    '📌 ค่าติดลบมากบ่งชี้ว่าตลาดในประเทศหดตัว ควรทบทวนกลยุทธ์การขาย',
  ],
  overseas: [
    'ผลต่างยอดขายลูกค้าต่างประเทศ เทียบกับช่วงเดียวกันปีก่อน',
    '📌 ค่าติดลบมากบ่งชี้ว่าตลาดส่งออกหดตัว อาจเกิดจาก demand ลดลงหรือการแข่งขันสูงขึ้น',
  ],
  trend: [
    'กราฟแท่งแสดงยอดขายรายเดือนตลอดปีที่เลือก',
    'เส้นประสีส้ม = ค่าเฉลี่ยต่อเดือน',
    'แท่งสีน้ำเงินเข้ม = เดือนที่ยอดขายสูงสุด | สีเหลือง = เดือนที่เลือก',
    '📌 ใช้ระบุ seasonality และวางแผนสต๊อก/กำลังการผลิต',
  ],
  segment: [
    'แบ่งกลุ่มลูกค้าตามพฤติกรรมการซื้อด้วย RFM Model',
    '🏆 Champions – ซื้อล่าสุด บ่อย และมูลค่าสูง: ลูกค้าVIP',
    '💛 Loyal – ลูกค้าประจำ ซื้อสม่ำเสมอ',
    '🔵 At Risk – เคยดีแต่เริ่มซื้อน้อยลง ต้องรีบ re-engage',
    '🟣 New – เพิ่งเป็นลูกค้าใหม่ ต้องดูแลให้กลายเป็น Loyal',
    '⚪ Hibernating – ไม่มีการซื้อนานแล้ว ยากจะดึงกลับ',
    '📌 ใช้วางแผน retention และ marketing แบบ targeted',
  ],
  mix: [
    'สัดส่วนรายได้ระหว่างลูกค้าในประเทศ vs ต่างประเทศ',
    '📌 ความเสี่ยงสูงหากพึ่งพาตลาดใดตลาดหนึ่งมากเกิน 80%',
    'ใช้วางแผนกระจายตลาดเพื่อลดความเสี่ยง',
  ],
  countries: [
    '5 ประเทศที่สร้างรายได้สูงสุดในช่วงเวลาที่เลือก',
    '📌 ใช้ระบุตลาดส่งออกหลักและวางแผนทรัพยากรทีมขาย',
    'ประเทศที่ % สูงควรได้รับการดูแลพิเศษเพื่อรักษา relationship',
  ],
  products: [
    'สินค้าที่สร้างรายได้สูงสุดในช่วงเวลาที่เลือก',
    '📌 ใช้วางแผนการผลิต จัดสรร stock และ prioritize คำสั่งซื้อ',
    'สินค้า Top 1-3 ควรมี safety stock เพียงพอเสมอ',
  ],
  arOutstanding: [
    'ยอดลูกหนี้การค้าทั้งหมดที่ยังไม่ได้รับชำระ',
    '= มูลค่า Invoice ที่ออกแล้วแต่ยังไม่ได้รับเงิน (ทั้งที่ยังไม่ถึงกำหนดและเกินกำหนด)',
    '📌 ยิ่งสูงยิ่งต้องใช้ Working Capital มากขึ้น',
  ],
  arOverdue: [
    'ยอดลูกหนี้ที่เลยกำหนดชำระแล้ว — ความเสี่ยงสูง',
    '📌 ควรติดตามเร่งด่วน โดยเฉพาะยอดที่เกิน 30 วัน',
    'หากมี Bad Debt สูงจะกระทบ Profit โดยตรง',
  ],
  dso: [
    'Days Sales Outstanding = จำนวนวันเฉลี่ยตั้งแต่ออก Invoice จนได้รับเงิน',
    'ยิ่งน้อยยิ่งดี: เก็บเงินได้เร็ว Cash Flow แข็งแกร่ง',
    '📌 DSO สูง = ลูกค้าจ่ายช้า ต้องทบทวนเงื่อนไขเครดิต',
    'เป้าหมายอุตสาหกรรมอาหารส่งออก: 30–60 วัน',
  ],
  collection: [
    'อัตราการเก็บเงินสำเร็จ = (ยอดรับชำระ ÷ ยอด Invoice) × 100',
    '📌 ค่า > 95% = ดีมาก | 90-95% = พอใช้ | < 90% = น่ากังวล',
    'ค่าต่ำอาจหมายถึงมี Bad Debt หรือเงื่อนไขเครดิตหลวมเกิน',
  ],
  aging: [
    'วิเคราะห์อายุของยอดลูกหนี้ที่ยังค้างชำระ',
    'Not Due – ยังไม่ถึงกำหนด (ปกติ)',
    '1-30 วัน – เกินกำหนดเล็กน้อย ควรส่ง reminder',
    '31-60 วัน – ควรโทรติดตามโดยตรง',
    '60+ วัน – ความเสี่ยงสูง พิจารณาหยุดเครดิต',
    '📌 ยิ่งมี % ใน bucket สูงยิ่งต้องระวัง Bad Debt',
  ],
  overdue: [
    'รายชื่อลูกค้าที่มียอดเกินกำหนดชำระสูงสุด',
    'WATCHING = ต้องจับตา | NORMAL = ยังในเกณฑ์ปกติ',
    '📌 Prioritize ติดตามตามมูลค่า — ลูกค้าอันดับ 1-3 มีผลกระทบมากที่สุด',
  ],
  paid: [
    'ลูกค้าที่มีการชำระเงินล่าสุด เรียงตามวันที่รับชำระ',
    '📌 ใช้ติดตาม Cash Flow รายวัน/สัปดาห์',
    'ลูกค้าที่จ่ายบ่อย (payments สูง) = ลูกค้า Active ที่มีความสัมพันธ์ดี',
  ],
}

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

function KpiCard({
  label, sub, value, pct, tooltip,
}: {
  label: string; sub: string; value: string; pct: number; tooltip: string[]
}) {
  const down = pct < 0
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm ring-1 ring-red-100/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">{label}</span>
            <InfoTooltip content={tooltip} side="bottom" width="lg" />
          </div>
          <div className="text-[10px] text-slate-400">{sub}</div>
        </div>
        <span className={`flex shrink-0 items-center gap-0.5 text-[11px] font-bold ${down ? 'text-red-500' : 'text-emerald-500'}`}>
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

function SectionCard({
  title, sub, tooltip, tooltipSide = 'bottom', icon: Icon, iconBg, children,
}: {
  title: string; sub?: string; tooltip: string[]; tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  icon?: typeof Wallet; iconBg?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: iconBg }}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</span>
            <InfoTooltip content={tooltip} side={tooltipSide} width="lg" />
          </div>
          {sub && <div className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function ArStatCard({
  label, th, value, tone, bg, tooltip,
}: {
  label: string; th: string; value: string; tone: string; bg: string; tooltip: string[]
}) {
  return (
    <div className={`rounded-xl border border-slate-100 ${bg} p-4`}>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <InfoTooltip content={tooltip} side="top" width="lg" />
      </div>
      <div className={`mt-1 font-mono text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[9px] text-slate-400">{th}</div>
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
              INTELLIGENCE<br />DASHBOARD
            </h1>
            <p className="mt-1 text-xs text-slate-400">บริหารจัดการการขายอัจฉริยะ · ADMIN</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <YearMonthFilter year={year} month={month} onYear={setYear} onMonth={setMonth} years={YEARS} monthNames={MONTH_NAMES} />
          <button className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
            <Tv className="h-3.5 w-3.5" /> TV MODE
          </button>
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={`Revenue ${year}`} sub={`ยอดขาย (${periodLabel})`} value={baht(k.revenue)} pct={k.revPct} tooltip={TT.revenue} />
        <KpiCard label="Revenue YoY Diff" sub="เทียบช่วงเดียวกันปีก่อน (YoY)" value={bahtSigned(k.yoyDiff)} pct={k.yoyPct} tooltip={TT.yoy} />
        <KpiCard label="Average Revenue" sub="ค่าเฉลี่ยต่อบิล" value={baht(k.avg)} pct={k.avgPct} tooltip={TT.avg} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Domestic MoM" sub="ส่วนต่างลูกค้าในประเทศ" value={bahtSigned(k.domestic)} pct={k.domesticPct} tooltip={TT.domestic} />
        <KpiCard label="Overseas MoM" sub="ส่วนต่างลูกค้าต่างประเทศ" value={bahtSigned(k.overseas)} pct={k.overseasPct} tooltip={TT.overseas} />
        <div />
      </div>

      {/* Revenue Trend + Segment Velocity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard title={`Revenue Trend (${year})`} sub="Monthly sales for current selected year" tooltip={TT.trend}>
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
        </SectionCard>

        <SectionCard title="Segment Velocity" sub="% of customers by RFM group" tooltip={TT.segment} tooltipSide="left">
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SEGMENTS} dataKey="value" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                    {SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
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
        </SectionCard>
      </div>

      {/* Product Mix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="text-sm font-extrabold uppercase tracking-wide text-slate-800">Product Mix</span>
          <InfoTooltip content={TT.mix} side="bottom" width="lg" />
          <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">Revenue contribution by category · Top countries · Top products</span>
        </div>
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1.2fr_1.2fr]">
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={view.mix} dataKey="value" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {view.mix.map((s, i) => <Cell key={i} fill={s.color} />)}
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
            <div className="mb-2 flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">🌐 Top Countries</span>
              <InfoTooltip content={TT.countries} side="top" width="lg" />
            </div>
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
            <div className="mb-2 flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">📦 Top Products</span>
              <InfoTooltip content={TT.products} side="top" width="lg" />
            </div>
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
      </div>

      {/* AR & Payment Analysis */}
      <SectionCard title="AR & Payment Analysis" sub="Accounts receivable · Collection · Risk" tooltip={TT.arOutstanding} icon={Wallet} iconBg="#EF4444">
        {/* AR stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ArStatCard label="Outstanding AR" th="ยอดค้างรับ" value={baht(AR.outstanding)} tone="text-slate-800" bg="bg-amber-50" tooltip={TT.arOutstanding} />
          <ArStatCard label="Overdue AR" th="ยอดเกินกำหนด" value={baht(AR.overdue)} tone="text-red-600" bg="bg-red-50" tooltip={TT.arOverdue} />
          <ArStatCard label="Avg DSO" th="ระยะเวลาเก็บเงินเฉลี่ย" value={`${AR.avgDso} Days`} tone="text-slate-800" bg="bg-slate-50" tooltip={TT.dso} />
          <ArStatCard label="Collection Rate" th="อัตราการเก็บเงิน" value={`${AR.collectionRate.toFixed(1)}%`} tone="text-emerald-600" bg="bg-emerald-50" tooltip={TT.collection} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* AR Aging */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">AR Aging Breakdown</span>
              <InfoTooltip content={TT.aging} side="top" width="lg" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={AR_AGING} dataKey="amount" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none">
                      {AR_AGING.map((s, i) => <Cell key={i} fill={s.color} />)}
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

          {/* Top Overdue */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Top Overdue Accounts</span>
              <InfoTooltip content={TT.overdue} side="top" width="lg" />
            </div>
            <div className="space-y-2">
              {TOP_OVERDUE.map((o) => (
                <div key={o.rank} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{o.rank}</span>
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
      </SectionCard>

      {/* Customers Paid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="text-sm font-extrabold uppercase tracking-wide text-slate-800">Customers Paid</span>
          <InfoTooltip content={TT.paid} side="bottom" width="lg" />
          <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
            Top customers with recent payments ({periodLabel})
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer…"
          className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
        />
        <div className="space-y-2">
          {filteredPaid.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50">
              <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">#{i + 1}</span>
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
      </div>
    </SmartSalesLayout>
  )
}
