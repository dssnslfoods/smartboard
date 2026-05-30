import { useState } from 'react'
import { ChevronDown, Database, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_META } from '@/lib/snapshotData'
import { StatusDot } from '@/components/ui/StatusDot'
import { cn } from '@/lib/utils'

export function SourceSelector() {
  const { sources, activeSourceId, setActive, status } = useDataSourceStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const all = [
    { id: SNAPSHOT_META.id, name: SNAPSHOT_META.name, color: SNAPSHOT_META.color, isDemo: true },
    { id: DEMO_SOURCE_ID, name: 'Demo data', color: '#BC8CFF', isDemo: true },
    ...sources.map((s) => ({ id: s.id, name: s.name, color: s.color, isDemo: false })),
  ]
  const active = all.find((s) => s.id === activeSourceId) ?? all[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm transition-colors hover:border-[#30363d]"
      >
        <Database className="h-4 w-4 text-text-secondary" />
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: active.color }} />
          <span className="font-medium text-text-primary">{active.name}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-20 w-72 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl animate-fade-in">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary">
              Active data source
            </div>
            <div className="max-h-72 overflow-y-auto pb-1">
              {all.map((s) => {
                const st = status[s.id]?.state ?? (s.isDemo ? 'demo' : 'idle')
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActive(s.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-bg-card',
                      s.id === active.id && 'bg-bg-card'
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate text-text-primary">{s.name}</span>
                    <StatusDot state={st as never} />
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/boardroom/sources')
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-accent-blue hover:bg-bg-card"
            >
              <Plus className="h-4 w-4" /> Manage sources
            </button>
          </div>
        </>
      )}
    </div>
  )
}
