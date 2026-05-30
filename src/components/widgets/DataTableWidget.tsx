import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import type { WidgetConfig } from '@/types'
import { cn, downloadCSV } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const PAGE_SIZE = 8

export function DataTableWidget({
  rows,
  config,
}: {
  rows: Record<string, unknown>[]
  config: WidgetConfig
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows])

  const filtered = useMemo(() => {
    let out = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((r) =>
        Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
      )
    }
    if (sortKey) {
      out = [...out].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const an = typeof av === 'number' ? av : parseFloat(String(av))
        const bn = typeof bv === 'number' ? bv : parseFloat(String(bv))
        let cmp: number
        if (!Number.isNaN(an) && !Number.isNaN(bn)) cmp = an - bn
        else cmp = String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return out
  }, [rows, search, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Search…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadCSV(`${config.title}.csv`, filtered)}
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-bg-secondary">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="cursor-pointer whitespace-nowrap px-3 py-2 font-medium text-text-secondary hover:text-text-primary"
                  onClick={() => toggleSort(c)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c}
                    {sortKey === c &&
                      (sortDir === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-bg-secondary/50">
                {columns.map((c) => (
                  <td key={c} className={cn('whitespace-nowrap px-3 py-1.5', typeof r[c] === 'number' && 'font-data text-text-primary')}>
                    {String(r[c] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary">
        <span>
          {filtered.length} rows{config.query.limit ? ` (limit ${config.query.limit})` : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-data">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
