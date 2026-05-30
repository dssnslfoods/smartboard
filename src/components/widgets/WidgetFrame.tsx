import type { ReactNode } from 'react'
import { AlertTriangle, MoreVertical, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useState } from 'react'

interface Props {
  title: string
  sourceColor?: string
  sourceName?: string
  loading?: boolean
  error?: string | null
  empty?: boolean
  onRefresh?: () => void
  onEdit?: () => void
  onRemove?: () => void
  editMode?: boolean
  children: ReactNode
  footer?: ReactNode
}

export function WidgetFrame({
  title,
  sourceColor,
  sourceName,
  loading,
  error,
  empty,
  onRefresh,
  onEdit,
  onRemove,
  editMode,
  children,
  footer,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="card card-hover flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {sourceColor && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: sourceColor }}
              title={sourceName}
            />
          )}
          <h3 className="truncate text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              aria-label="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          )}
          {editMode && (onEdit || onRemove) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 widget-no-drag"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Widget menu"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-lg border border-border bg-bg-secondary py-1 shadow-xl animate-fade-in">
                    {onEdit && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-primary hover:bg-bg-card"
                        onClick={() => {
                          setMenuOpen(false)
                          onEdit()
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                    {onRemove && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-accent-red hover:bg-bg-card"
                        onClick={() => {
                          setMenuOpen(false)
                          onRemove()
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden p-4">
        {loading ? (
          <div className="flex h-full flex-col gap-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle className="h-6 w-6 text-accent-red" />
            <p className="text-xs text-accent-red">{error}</p>
          </div>
        ) : empty ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-text-secondary">
            No data returned for this query.
          </div>
        ) : (
          children
        )}
      </div>
      {footer && !loading && !error && (
        <div className="border-t border-border px-4 py-2 text-[11px] text-text-secondary">
          {footer}
        </div>
      )}
    </div>
  )
}
