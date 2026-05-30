/**
 * NSL INTERTRADE — Intelligence Dashboard dataset.
 *
 * Real aggregates pulled read-only (SELECT only) from the SmartSales Supabase
 * project on 2026-05-30. No schema changes were made. Figures reconcile to the
 * live database. Year/month filtering is computed client-side from the monthly
 * series below.
 */

export const INTEL_META = {
  org: 'NSL INTERTRADE',
  subtitle: 'INTERTRADE · CONNECTED',
  user: 'ARNON',
  role: 'ADMIN',
  lastSync: '30/05/2026 02:00',
  version: 'SYSTEM V2.4.0',
}

export const YEARS = [2026, 2025]
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthRow {
  yr: number
  mo: number
  revenue: number
  invoices: number
  domestic: number
  overseas: number
}

export const MONTHLY: MonthRow[] = [
  { yr: 2025, mo: 1, revenue: 12721252, invoices: 25, domestic: 1720060, overseas: 11001192 },
  { yr: 2025, mo: 2, revenue: 21618381, invoices: 35, domestic: 1710196, overseas: 19908185 },
  { yr: 2025, mo: 3, revenue: 23520950, invoices: 40, domestic: 7131471, overseas: 16389479 },
  { yr: 2025, mo: 4, revenue: 26523743, invoices: 44, domestic: 1391610, overseas: 25132133 },
  { yr: 2025, mo: 5, revenue: 27327157, invoices: 49, domestic: 3141685, overseas: 24185472 },
  { yr: 2025, mo: 6, revenue: 28579263, invoices: 41, domestic: 8480937, overseas: 20098326 },
  { yr: 2025, mo: 7, revenue: 27706220, invoices: 47, domestic: 5926053, overseas: 21780167 },
  { yr: 2025, mo: 8, revenue: 30457247, invoices: 53, domestic: 5588495, overseas: 24868752 },
  { yr: 2025, mo: 9, revenue: 27115937, invoices: 47, domestic: 7816210, overseas: 19299727 },
  { yr: 2025, mo: 10, revenue: 34073597, invoices: 42, domestic: 8082211, overseas: 25991386 },
  { yr: 2025, mo: 11, revenue: 29211171, invoices: 42, domestic: 6802132, overseas: 22409039 },
  { yr: 2025, mo: 12, revenue: 36108145, invoices: 40, domestic: 10911900, overseas: 25196245 },
  { yr: 2026, mo: 1, revenue: 21558797, invoices: 35, domestic: 6299000, overseas: 15259797 },
  { yr: 2026, mo: 2, revenue: 20102585, invoices: 30, domestic: 2591150, overseas: 17511435 },
  { yr: 2026, mo: 3, revenue: 28035240, invoices: 53, domestic: 7858787, overseas: 20176454 },
  { yr: 2026, mo: 4, revenue: 23547982, invoices: 42, domestic: 2483980, overseas: 21064002 },
  { yr: 2026, mo: 5, revenue: 22251523, invoices: 46, domestic: 3355285, overseas: 18896238 },
]

export const PAYMENTS_MONTHLY: { yr: number; mo: number; payments: number }[] = [
  { yr: 2025, mo: 1, payments: 1703110 }, { yr: 2025, mo: 2, payments: 15655027 },
  { yr: 2025, mo: 3, payments: 22817789 }, { yr: 2025, mo: 4, payments: 20884886 },
  { yr: 2025, mo: 5, payments: 17575238 }, { yr: 2025, mo: 6, payments: 35902539 },
  { yr: 2025, mo: 7, payments: 29432209 }, { yr: 2025, mo: 8, payments: 27124250 },
  { yr: 2025, mo: 9, payments: 28740197 }, { yr: 2025, mo: 10, payments: 22179923 },
  { yr: 2025, mo: 11, payments: 31802420 }, { yr: 2025, mo: 12, payments: 29613562 },
  { yr: 2026, mo: 1, payments: 31138538 }, { yr: 2026, mo: 2, payments: 24876707 },
  { yr: 2026, mo: 3, payments: 20088840 }, { yr: 2026, mo: 4, payments: 16544157 },
  { yr: 2026, mo: 5, payments: 33635448 },
]

interface CountryRow { country: string; flag: string; revenue: number; pct: number }
const FLAG: Record<string, string> = {
  USA: '🇺🇸', Thailand: '🇹🇭', 'United Kingdom': '🇬🇧', China: '🇨🇳', 'U.A.E.': '🇦🇪',
  'The Netherland': '🇳🇱', Cambodia: '🇰🇭', MEXICO: '🇲🇽', Taiwan: '🇹🇼', POLAND: '🇵🇱',
  'New Zealand': '🇳🇿', Japan: '🇯🇵', Iraq: '🇮🇶', ITALY: '🇮🇹', CANADA: '🇨🇦',
  FRANCE: '🇫🇷', INDIA: '🇮🇳', GERMANY: '🇩🇪', PAKISTAN: '🇵🇰',
}
const flag = (c: string) => FLAG[c.trim()] ?? '🌐'

export const COUNTRIES_BY_YEAR: Record<number, CountryRow[]> = {
  2026: [
    { country: 'United States', flag: flag('USA'), revenue: 41043847.63, pct: 36 },
    { country: 'Thailand', flag: flag('Thailand'), revenue: 22588201.0, pct: 20 },
    { country: 'United Kingdom', flag: flag('United Kingdom'), revenue: 19148399.44, pct: 17 },
    { country: 'China', flag: flag('China'), revenue: 5152550, pct: 4 },
    { country: 'U.A.E.', flag: flag('U.A.E.'), revenue: 4462679, pct: 4 },
  ],
  2025: [
    { country: 'United States', flag: flag('USA'), revenue: 102258987, pct: 31 },
    { country: 'Thailand', flag: flag('Thailand'), revenue: 68702959, pct: 21 },
    { country: 'United Kingdom', flag: flag('United Kingdom'), revenue: 46019881, pct: 14 },
    { country: 'Cambodia', flag: flag('Cambodia'), revenue: 19175480, pct: 6 },
    { country: 'Mexico', flag: flag('MEXICO'), revenue: 16619188, pct: 5 },
  ],
}

interface ProductRow { item: string; revenue: number; pct: number }
export const PRODUCTS_BY_YEAR: Record<number, ProductRow[]> = {
  2026: [
    { item: 'Coconut Water 12x520ml. - Wai Koko', revenue: 22620407, pct: 20 },
    { item: 'Coconut Milk 5-7% fat 24x400ml. - MC Trader', revenue: 5087625, pct: 4 },
    { item: "Coconut Milk 5-7% fat 24x400ml. - Solo's Choice", revenue: 4325400, pct: 4 },
  ],
  2025: [
    { item: 'Coconut Water 12x520ml. - Wai Koko', revenue: 46717863, pct: 14 },
    { item: 'Coconut Milk 5-7% fat 24x400ml. - MC Trader', revenue: 20267190, pct: 6 },
    { item: 'Pineapple Std. Slices 8ring Light Syrup 12x30oz', revenue: 16619188, pct: 5 },
  ],
}

export const MIX_BY_YEAR: Record<number, { domestic: number; overseas: number }> = {
  2026: { domestic: 20, overseas: 80 },
  2025: { domestic: 21, overseas: 79 },
}

interface PaidRow { name: string; total: number; payments: number; last: string }
export const CUSTOMERS_PAID_BY_YEAR: Record<number, PaidRow[]> = {
  2026: [
    { name: 'บริษัท วินดีสส์ ฟู้ด จำกัด', total: 1683000.0, payments: 3, last: '28 May 2026' },
    { name: 'D&A Marketing Limited', total: 1021575.45, payments: 2, last: '26 May 2026' },
    { name: 'บริษัท หงซิน จำกัด', total: 349802.6, payments: 2, last: '26 May 2026' },
    { name: 'Diaz Foods Ltd.', total: 1589236.16, payments: 3, last: '25 May 2026' },
    { name: 'Wai Koko Beverage Company.LLC', total: 31710617.74, payments: 61, last: '22 May 2026' },
    { name: 'บริษัท ธนิตา89 จำกัด', total: 3089700.0, payments: 3, last: '22 May 2026' },
    { name: 'PENTRADE DUTY FREE B.V.', total: 2556442.62, payments: 5, last: '22 May 2026' },
    { name: 'CAMARGUE PRODUCTION', total: 724984.78, payments: 1, last: '22 May 2026' },
  ],
  2025: [
    { name: 'บริษัท ฉลอง จำกัด', total: 15402000.0, payments: 12, last: '26 Dec 2025' },
    { name: 'บริษัท ซุปเปอร์ เจ อินเตอร์เนชั่นแนล จำกัด', total: 1878400.0, payments: 4, last: '25 Dec 2025' },
    { name: 'บริษัท แมส ช้อยส์ คอร์ปอเรชั่น จำกัด', total: 1549800.0, payments: 3, last: '24 Dec 2025' },
    { name: 'บริษัท เอ บี ดี กาญจน์ จำกัด', total: 3466450.0, payments: 12, last: '23 Dec 2025' },
    { name: 'Wanis Ltd.', total: 37620485.42, payments: 50, last: '22 Dec 2025' },
    { name: 'AEGEAN IMPORT/EXPORT', total: 1407502.76, payments: 2, last: '22 Dec 2025' },
    { name: 'Wacca Store', total: 601104.93, payments: 1, last: '22 Dec 2025' },
    { name: 'Wai Koko Beverage Company.LLC', total: 49857961.49, payments: 93, last: '18 Dec 2025' },
  ],
}

// RFM segments — current snapshot (not year-specific)
export const SEGMENTS = [
  { name: 'HIBERNATING', value: 66, color: '#9CA3AF' },
  { name: 'AT RISK', value: 10, color: '#38BDF8' },
  { name: 'NEW', value: 8, color: '#8B5CF6' },
  { name: 'LOYAL', value: 7, color: '#F59E0B' },
  { name: 'CHAMPIONS', value: 5, color: '#1E3A8A' },
  { name: 'POTENTIAL', value: 4, color: '#10B981' },
]

// AR snapshot (current, matches source dashboard)
export const AR = { outstanding: 17401643.98, overdue: 15680578.98, avgDso: 251, collectionRate: 96.0 }
export const AR_AGING = [
  { bucket: 'NOT DUE', amount: 1721065.0, color: '#10B981' },
  { bucket: '1-30 DAYS', amount: 10904779.5, color: '#F59E0B' },
  { bucket: '31-60 DAYS', amount: 4775799.48, color: '#F97316' },
]
export const TOP_OVERDUE = [
  { rank: 1, customer: 'Wanis Ltd.', code: 'EU-006WAN', amount: 3089369.45, days: 25, risk: 'NORMAL' },
  { rank: 2, customer: 'MCLANE GLOBAL', code: 'US-006MCL', amount: 2587600.07, days: 32, risk: 'WATCHING' },
  { rank: 3, customer: 'Green Tower Emirates Trading Co. (L.L.C)', code: 'AS-037GRE', amount: 1200058.73, days: 20, risk: 'NORMAL' },
  { rank: 4, customer: 'Sun Fat Trading Company', code: 'US-008SUN', amount: 1133814.45, days: 24, risk: 'NORMAL' },
  { rank: 5, customer: 'Alsarim General Trading Ltd Co.', code: 'AS-029ALS', amount: 1133796.56, days: 34, risk: 'WATCHING' },
]

// ---- Reports data ----
interface RepRow { name: string; revenue: number; invoices: number }
export const SALESPERSON_BY_YEAR: Record<number, RepRow[]> = {
  2026: [
    { name: 'CHANIDA', revenue: 45136859, invoices: 78 },
    { name: 'YADA', revenue: 25798952, invoices: 43 },
    { name: 'WARAPORN', revenue: 23976434, invoices: 57 },
    { name: 'SUTHINEE', revenue: 16166648, invoices: 19 },
    { name: 'PASSORN', revenue: 4417233, invoices: 9 },
  ],
  2025: [
    { name: 'CHANIDA', revenue: 108150389, invoices: 172 },
    { name: 'YADA', revenue: 85462271, invoices: 130 },
    { name: 'WARAPORN', revenue: 76528370, invoices: 118 },
    { name: 'SUTHINEE', revenue: 33866962, invoices: 46 },
    { name: 'PASSORN', revenue: 20955073, invoices: 39 },
  ],
}

interface GroupRow { group: string; revenue: number }
export const PRODUCT_GROUP_BY_YEAR: Record<number, GroupRow[]> = {
  2026: [
    { group: 'Beverage - PNF', revenue: 56853273 },
    { group: 'Canned foods - PNF', revenue: 52232834 },
    { group: 'Beverage - Royal Plus', revenue: 2813885 },
    { group: 'Freight charge', revenue: 1261324 },
    { group: 'Beverage - Boon Tree Food', revenue: 807006 },
    { group: 'Other income', revenue: 554431 },
    { group: 'Beverage - Trading APlus', revenue: 516552 },
    { group: 'Beverage - City Farm Interfood', revenue: 418832 },
  ],
  2025: [
    { group: 'Canned foods - PNF', revenue: 152959200 },
    { group: 'Beverage - PNF', revenue: 129118387 },
    { group: 'Canned foods - Natural fruit', revenue: 16619188 },
    { group: 'Beverage - Royal Plus', revenue: 11418072 },
    { group: 'Freight charge', revenue: 3229568 },
    { group: 'Frozen - NSL Foods', revenue: 2395673 },
    { group: 'Canned foods - Merit Food', revenue: 1749811 },
    { group: 'Beverage - City Farm Interfood', revenue: 1599933 },
  ],
}

// ---- Customer master (for Customers page) ----
export interface CustomerRow {
  name: string
  code: string
  region: string
  segment: string
  revenue: number
  invoices: number
  balance: number
  last_order: string | null
  seg: 'Domestic' | 'Overseas'
}
export const CUSTOMERS: CustomerRow[] = [
  { name: 'Wai Koko Beverage Company.LLC', code: 'US-011WAI', region: 'USA', segment: 'champions', revenue: 82623150, invoices: 156, balance: 1054571, last_order: '21 May 2026', seg: 'Overseas' },
  { name: 'Wanis Ltd.', code: 'EU-006WAN', region: 'United Kingdom', segment: 'champions', revenue: 59541857, invoices: 80, balance: 3089369, last_order: '23 May 2026', seg: 'Overseas' },
  { name: 'MCLANE GLOBAL', code: 'US-006MCL', region: 'USA', segment: 'loyal', revenue: 26303073, invoices: 13, balance: 2587600, last_order: '22 May 2026', seg: 'Overseas' },
  { name: 'บริษัท ฉลอง จำกัด', code: 'TH-018CHA', region: 'นนทบุรี', segment: 'at_risk', revenue: 23003400, invoices: 17, balance: 0, last_order: '14 Mar 2026', seg: 'Domestic' },
  { name: 'Ly Chunkuy Co.,Ltd.', code: 'AS-013LYC', region: 'Cambodia', segment: 'hibernating', revenue: 18359500, invoices: 20, balance: 0, last_order: '02 Jan 2026', seg: 'Overseas' },
  { name: 'DISTRIBUCIONES CALZAN S.A. DE C.V.', code: 'NA-002DIS', region: 'MEXICO', segment: 'hibernating', revenue: 16619188, invoices: 3, balance: 0, last_order: '21 Dec 2025', seg: 'Overseas' },
  { name: 'บริษัท โกลเด็น แลนด์ โปรดักส์ จำกัด', code: 'TH-004GDL', region: 'กรุงเทพมหานคร', segment: 'champions', revenue: 12532300, invoices: 16, balance: 688224, last_order: '19 May 2026', seg: 'Domestic' },
  { name: 'บริษัท ธนิตา89 จำกัด', code: 'TH-010TAN', region: 'กรุงเทพมหานคร', segment: 'at_risk', revenue: 12447075, invoices: 20, balance: 0, last_order: '19 Mar 2026', seg: 'Domestic' },
  { name: 'Golden Sun Impex Co.,Ltd.', code: 'CN-002GOL', region: 'China', segment: 'loyal', revenue: 10654617, invoices: 22, balance: 967586, last_order: '12 May 2026', seg: 'Overseas' },
  { name: 'Diaz Foods Ltd.', code: 'US-001DIA', region: 'USA', segment: 'champions', revenue: 7367628, invoices: 14, balance: 531333, last_order: '17 May 2026', seg: 'Overseas' },
  { name: 'บริษัท วาแทป (ประเทศไทย) จำกัด', code: 'TH-015WAT', region: 'ระยอง', segment: 'hibernating', revenue: 7303128, invoices: 15, balance: 0, last_order: '29 Oct 2025', seg: 'Domestic' },
  { name: 'PENTRADE DUTY FREE B.V.', code: 'EU-003PEN', region: 'The Netherland', segment: 'loyal', revenue: 6571208, invoices: 13, balance: 523258, last_order: '17 May 2026', seg: 'Overseas' },
  { name: 'Royal Food Import Corp.', code: 'US-007ROY', region: 'USA', segment: 'loyal', revenue: 6186431, invoices: 11, balance: 507409, last_order: '05 May 2026', seg: 'Overseas' },
  { name: 'M.H.ENTERPRISES L.L.C.', code: 'AS-016MHE', region: 'U.A.E.', segment: 'hibernating', revenue: 5630853, invoices: 10, balance: 0, last_order: '25 Jan 2026', seg: 'Overseas' },
  { name: 'บริษัท วินดีสส์ ฟู้ด จำกัด', code: 'TH-014WDF', region: 'กรุงเทพมหานคร', segment: 'loyal', revenue: 5012800, invoices: 9, balance: 0, last_order: '12 May 2026', seg: 'Domestic' },
  { name: 'บริษัท วาลาไทยฟู้ด จำกัด', code: 'TH-027VTF', region: 'นนทบุรี', segment: 'hibernating', revenue: 4744825, invoices: 3, balance: 635391, last_order: '04 Dec 2025', seg: 'Domestic' },
  { name: 'Simple Mart Plus Co.,Ltd.', code: 'AS-023SIM', region: 'Taiwan', segment: 'loyal', revenue: 4314989, invoices: 6, balance: 0, last_order: '04 May 2026', seg: 'Overseas' },
  { name: 'Golden Gate Sales Development,Inc.', code: 'US-002GOL', region: 'USA', segment: 'at_risk', revenue: 3975626, invoices: 6, balance: 0, last_order: '13 Apr 2026', seg: 'Overseas' },
  { name: 'บริษัท เอ บี ดี กาญจน์ จำกัด', code: 'TH-001ABD', region: 'กาญจนบุรี', segment: 'hibernating', revenue: 3813325, invoices: 16, balance: 0, last_order: '31 Mar 2026', seg: 'Domestic' },
  { name: 'บริษัท โปรแพลน อุตสาหกรรม จำกัด', code: 'TH-025PRO', region: 'นนทบุรี', segment: 'champions', revenue: 3792886, invoices: 8, balance: 167894, last_order: '26 May 2026', seg: 'Domestic' },
  { name: 'BEDESSEE IMPORTS, LTD.', code: 'NA-001BED', region: 'CANADA', segment: 'at_risk', revenue: 3769360, invoices: 6, balance: 0, last_order: '07 Apr 2026', seg: 'Overseas' },
  { name: 'TOP-OP (FOODS) LTD.', code: 'EU-009TOP', region: 'United Kingdom', segment: 'hibernating', revenue: 3402027, invoices: 5, balance: 0, last_order: '04 Jan 2026', seg: 'Overseas' },
  { name: 'Sun Fat Trading Company', code: 'US-008SUN', region: 'USA', segment: 'loyal', revenue: 3374516, invoices: 6, balance: 1133814, last_order: '13 May 2026', seg: 'Overseas' },
  { name: 'บริษัท ดีพอที่จะกิน จำกัด', code: 'TH-003DPT', region: 'กรุงเทพมหานคร', segment: 'at_risk', revenue: 3129500, invoices: 5, balance: 0, last_order: '01 Apr 2026', seg: 'Domestic' },
  { name: 'MARHUB TRADING FZC', code: 'AS-020MAR', region: 'U.A.E.', segment: 'at_risk', revenue: 3104103, invoices: 4, balance: 649922, last_order: '13 Apr 2026', seg: 'Overseas' },
  { name: 'AL RHEA GENERAL TRADING L.L.C.', code: 'AS-001ALR', region: 'U.A.E.', segment: 'hibernating', revenue: 2920224, invoices: 5, balance: 0, last_order: '21 Dec 2025', seg: 'Overseas' },
  { name: 'CONEXUS FOOD SOLUTIONS LLC', code: 'US-013CON', region: 'USA', segment: 'hibernating', revenue: 2882959, invoices: 6, balance: 0, last_order: '17 Jan 2026', seg: 'Overseas' },
  { name: 'ALQAEM GENERAL TRADING & CONT.CO.W.L.L.', code: 'AS-028ALQ', region: 'KUWAIT', segment: 'hibernating', revenue: 2876725, invoices: 2, balance: 0, last_order: '22 Dec 2025', seg: 'Overseas' },
  { name: 'KENJO ENTERPRISE COMPANY LIMITED', code: 'CN-007KEN', region: 'China', segment: 'hibernating', revenue: 2870123, invoices: 5, balance: 0, last_order: '21 Jan 2026', seg: 'Overseas' },
  { name: 'บริษัท เค.อาร์.เอส.สไปร์ซี่ ฟู้ดส์ จำกัด', code: 'TH-006KRS', region: 'ปทุมธานี', segment: 'champions', revenue: 2617380, invoices: 22, balance: 1737204, last_order: '26 May 2026', seg: 'Domestic' },
  { name: 'SAJJAN FOODS DMCC', code: 'AS-035SAJ', region: 'U.A.E.', segment: 'loyal', revenue: 2572426, invoices: 6, balance: 543615, last_order: '20 May 2026', seg: 'Overseas' },
  { name: 'D&A Marketing Limited', code: 'AU-001D&A', region: 'New Zealand', segment: 'loyal', revenue: 2559104, invoices: 5, balance: 0, last_order: '24 May 2026', seg: 'Overseas' },
  { name: 'K.Industry Co.,Ltd.', code: 'AS-012KIN', region: 'Japan', segment: 'at_risk', revenue: 2288423, invoices: 4, balance: 0, last_order: '01 Apr 2026', seg: 'Overseas' },
  { name: 'Interstate Beverage Corporation', code: 'US-003INT', region: 'USA', segment: 'hibernating', revenue: 2284230, invoices: 4, balance: 0, last_order: '22 Feb 2026', seg: 'Overseas' },
  { name: 'Alsarim General Trading Ltd Co.', code: 'AS-029ALS', region: 'Iraq', segment: 'potential', revenue: 2184503, invoices: 2, balance: 1133797, last_order: '26 Apr 2026', seg: 'Overseas' },
  { name: 'บริษัท ไทยโบแนนซ่าอินเตอร์เนชั่นแนล จำกัด', code: 'TH-011TBN', region: 'กรุงเทพมหานคร', segment: 'hibernating', revenue: 2150888, invoices: 5, balance: 0, last_order: '16 Aug 2025', seg: 'Domestic' },
  { name: 'CAMARGUE PRODUCTION', code: 'EU-008CAM', region: 'FRANCE', segment: 'potential', revenue: 2084667, invoices: 3, balance: 0, last_order: '04 May 2026', seg: 'Overseas' },
  { name: 'AL MAYA INTERNATIONAL W.L.L.', code: 'AS-003ALM', region: 'Qatar', segment: 'hibernating', revenue: 1915990, invoices: 6, balance: 0, last_order: '31 Jan 2026', seg: 'Overseas' },
  { name: 'บริษัท หงซิน จำกัด', code: 'TH-005HON', region: 'กรุงเทพมหานคร', segment: 'potential', revenue: 1295104, invoices: 5, balance: 0, last_order: '12 May 2026', seg: 'Domestic' },
  { name: 'Green Tower Emirates Trading Co. (L.L.C)', code: 'AS-037GRE', region: 'Saudi Arabia', segment: 'new', revenue: 1200059, invoices: 1, balance: 1002425, last_order: '10 May 2026', seg: 'Overseas' },
]

export const TOTAL_CUSTOMERS = 128

// ---- Compute ----
export interface ComputedKpis {
  revenue: number
  invoices: number
  yoyDiff: number
  yoyPct: number
  revPct: number
  avg: number
  avgPct: number
  domestic: number
  domesticPct: number
  overseas: number
  overseasPct: number
}

export interface ComputedView {
  kpis: ComputedKpis
  trend: { month: string; revenue: number }[]
  trendAvg: number
  countries: CountryRow[]
  products: ProductRow[]
  mix: { name: string; value: number; color: string }[]
  customersPaid: PaidRow[]
}

function sumRows(year: number, month: number) {
  const rows = MONTHLY.filter((r) => r.yr === year && (month === 0 || r.mo === month))
  return rows.reduce(
    (a, r) => ({
      revenue: a.revenue + r.revenue,
      invoices: a.invoices + r.invoices,
      domestic: a.domestic + r.domestic,
      overseas: a.overseas + r.overseas,
    }),
    { revenue: 0, invoices: 0, domestic: 0, overseas: 0 }
  )
}

const pct = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : 0)

/** Compute the full dashboard view for a year + month (0 = all months). */
export function computeView(year: number, month: number): ComputedView {
  const cur = sumRows(year, month)
  const prev = sumRows(year - 1, month)

  const avg = cur.invoices ? cur.revenue / cur.invoices : 0
  const prevAvg = prev.invoices ? prev.revenue / prev.invoices : 0

  const kpis: ComputedKpis = {
    revenue: cur.revenue,
    invoices: cur.invoices,
    yoyDiff: cur.revenue - prev.revenue,
    yoyPct: pct(cur.revenue, prev.revenue),
    revPct: pct(cur.revenue, prev.revenue),
    avg,
    avgPct: pct(avg, prevAvg),
    domestic: cur.domestic - prev.domestic,
    domesticPct: pct(cur.domestic, prev.domestic),
    overseas: cur.overseas - prev.overseas,
    overseasPct: pct(cur.overseas, prev.overseas),
  }

  const trend = MONTHLY.filter((r) => r.yr === year)
    .sort((a, b) => a.mo - b.mo)
    .map((r) => ({ month: MONTH_NAMES[r.mo - 1], revenue: r.revenue }))
  const trendAvg = trend.length ? trend.reduce((a, b) => a + b.revenue, 0) / trend.length : 0

  const mixSrc = MIX_BY_YEAR[year] ?? { domestic: 0, overseas: 0 }
  const mix = [
    { name: 'ลูกค้าต่างประเทศ', value: mixSrc.overseas, color: '#EF4444' },
    { name: 'ลูกค้าในประเทศ', value: mixSrc.domestic, color: '#8B5CF6' },
  ]

  return {
    kpis,
    trend,
    trendAvg,
    countries: COUNTRIES_BY_YEAR[year] ?? [],
    products: PRODUCTS_BY_YEAR[year] ?? [],
    mix,
    customersPaid: CUSTOMERS_PAID_BY_YEAR[year] ?? [],
  }
}
