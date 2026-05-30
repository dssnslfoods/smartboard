import type { ColumnMeta, TableMeta } from '@/types'

/**
 * Handoff parser.
 *
 * A `handoff.md` lets a source author describe its schema so the system (and AI)
 * can understand it without live introspection — which matters here because most
 * Supabase sources have RLS that blocks anon reads.
 *
 * Supported formats (any mix):
 *
 *  ## table: sap_invoices  — Customer invoices
 *  - doc_total (metric) : numeric — invoice grand total
 *  - doc_date (date)
 *  - card_name (dimension)
 *
 *  or markdown tables:
 *  | column | role | description |
 *  |--------|------|-------------|
 *  | amount | metric | deal value |
 *
 * Roles: metric | dimension | date | id | text. If omitted, inferred from name.
 */

const TEMPLATE = `# Source Handoff

Describe each table so Boardroom can suggest reports and build widgets.

## table: orders — Customer orders
- id (id)
- created_at (date)
- amount (metric) : numeric — order total in THB
- status (dimension) — order status
- region (dimension) — sales region
- customer_name (text)

## table: customers — Customer master
- id (id)
- name (text)
- mrr (metric) — monthly recurring revenue
- segment (dimension)
- created_at (date)
`

export function handoffTemplate(): string {
  return TEMPLATE
}

/** Infer a column's semantic role from its name when not declared. */
export function inferRole(name: string): ColumnMeta['role'] {
  const n = name.toLowerCase()
  if (/(^id$|_id$|^uuid|code$|_code$|doc_num|doc_entry)/.test(n)) return 'id'
  if (/(date|_at$|_on$|time|month|year|period|due)/.test(n)) return 'date'
  if (/(amount|total|revenue|sales|price|cost|qty|quantity|count|sum|avg|value|balance|mrr|arr|margin|profit|paid|vat|rate|pct|percent|seats|score|uptime|latency|throughput|deals|incidents|duration)/.test(n))
    return 'metric'
  if (/(name|description|note|comment|remark|email|phone|address|title)/.test(n))
    return 'text'
  return 'dimension'
}

const ROLE_WORDS: Record<string, ColumnMeta['role']> = {
  metric: 'metric',
  measure: 'metric',
  number: 'metric',
  dimension: 'dimension',
  dim: 'dimension',
  category: 'dimension',
  date: 'date',
  datetime: 'date',
  timestamp: 'date',
  id: 'id',
  key: 'id',
  text: 'text',
  string: 'text',
}

function parseColumnLine(line: string): ColumnMeta | null {
  // "- amount (metric) : numeric — order total"
  const m = line.match(/^[-*]\s*([A-Za-z0-9_]+)\s*(?:\(([^)]+)\))?\s*(?::\s*([A-Za-z0-9_ ]+))?\s*(?:[—-]\s*(.+))?$/)
  if (!m) return null
  const [, name, roleRaw, typeRaw] = m
  if (!name) return null
  const declared = roleRaw?.trim().toLowerCase()
  const role = (declared && ROLE_WORDS[declared]) || inferRole(name)
  return { name, role, type: typeRaw?.trim() || undefined }
}

function parseMarkdownTableRow(cells: string[], header: string[]): ColumnMeta | null {
  const idx = (k: string) => header.findIndex((h) => h.includes(k))
  const ci = idx('column') >= 0 ? idx('column') : idx('field') >= 0 ? idx('field') : idx('name')
  if (ci < 0) return null
  const name = cells[ci]?.trim()
  if (!name) return null
  const ri = idx('role') >= 0 ? idx('role') : idx('type')
  const declared = ri >= 0 ? cells[ri]?.trim().toLowerCase() : undefined
  const role = (declared && ROLE_WORDS[declared]) || inferRole(name)
  return { name, role }
}

/** Parse a handoff.md string into table metadata. */
export function parseHandoff(md: string): TableMeta[] {
  const lines = md.split(/\r?\n/)
  const tables: TableMeta[] = []
  let current: TableMeta | null = null
  let mdHeader: string[] | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      mdHeader = null
      continue
    }

    // ## table: name — description    (also accepts "### table name")
    const t = line.match(/^#{1,4}\s*(?:table\s*[:#]?\s*)?([A-Za-z0-9_]+)\s*(?:[—-]\s*(.+))?$/i)
    if (line.toLowerCase().includes('table') && t) {
      current = { name: t[1], description: t[2]?.trim(), columns: [] }
      tables.push(current)
      mdHeader = null
      continue
    }

    if (!current) continue

    // markdown table header
    if (line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim().toLowerCase()).filter(Boolean)
      if (/^[-: |]+$/.test(line.replace(/\|/g, ''))) continue // separator row
      if (!mdHeader && cells.some((c) => /column|field|name/.test(c))) {
        mdHeader = cells
        continue
      }
      if (mdHeader) {
        const rawCells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length)
        const col = parseMarkdownTableRow(rawCells, mdHeader)
        if (col) current.columns.push(col)
        continue
      }
    }

    // bullet column line
    if (/^[-*]\s/.test(line)) {
      const col = parseColumnLine(line)
      if (col) current.columns.push(col)
    }
  }

  return tables.filter((t) => t.columns.length > 0)
}

/** Quick validation summary for the upload UI. */
export function summarizeHandoff(md: string): { tables: number; columns: number; ok: boolean } {
  const t = parseHandoff(md)
  const columns = t.reduce((a, x) => a + x.columns.length, 0)
  return { tables: t.length, columns, ok: t.length > 0 }
}
