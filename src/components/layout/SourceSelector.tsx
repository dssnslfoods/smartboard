import { useState } from 'react'
import { ChevronDown, Database, Layers, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataSourceStore } from '@/stores/dataSourceStore'
import { DEMO_SOURCE_ID } from '@/lib/demoData'
import { SNAPSHOT_SOURCES } from '@/lib/snapshotData'
import { useSourceActiveStore } from '@/stores/sourceActiveStore'
import { StatusDot } from '@/components/ui/StatusDot'
import { cn } from '@/lib/utils'

/** Special sentinel for "show all sources" mode. */
export const ALL_SOURCES_ID = '__all__'

export function SourceSelector() {
  const { sources, activeSourceId, setActive, status } = useDataSourceStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const isSourceActive = useSourceActiveStore((s) => s.isActive)

  const activeSources = [
    ...SNAPSHOT_SOURCES.map((s) => ({ id: s.id, name: s.name, color: s.color, isDemo: true })),
    { id: DEMO_SOURCE_ID, name: 'Demo data', color: '#BC8CFF', isDemo: true },
    ...sources.map((s) => ({ id: s.id, name: s.name, color: s.color, isDemo: false })),
  ].filter((s) => isSourceActive(s.id))

  const isAll = activeSourceId === ALL_SOURCES_ID || !activeSourceId
  const active = isAll ? null : activeSources.find((s) => s.id === activeSourceId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-sm transition-colors hover:border-[#30363d]"
      >
        <Database className="h-4 w-4 text-text-secondary" />
        <span className="flex items-center gap-2">
          {active ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: active.color }} />
              <span className="font-medium text-text-primary">{active.name}</span>
            </>
          ) : (
            <>
              <Layers className="h-3.5 w-3.5 text-accent-blue" />
              <span className="font-medium text-accent-blue">All Sources</span>
            </>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-20 w-72 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl animate-fade-in">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary">
              แสดง Dashboard ของ Source
            </div>
            <div className="max-h-72 overflow-y-auto pb-1">
              {/* All Sources option */}
              <button
                onClick={() => { setActive(ALL_SOURCES_ID); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-bg-card',
                  isAll && 'bg-bg-card text-accent-blue'
                )}
              >
                <Layers className="h-3.5 w-3.5 text-accent-blue" />
                <span className="flex-1 text-text-primary font-medium">All Sources</span>
                <span className="text-[10px] text-text-secondary">แสดงทั้งหมด</span>
              </button>

              <div className="mx-3 my-1 border-t border-border" />

              {activeSources.map((s) => {
                const st = status[s.id]?.state ?? (s.isDemo ? 'demo' : 'idle')
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActive(s.id); setOpen(false) }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-bg-card',
                      s.id === activeSourceId && 'bg-bg-card'
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
              onClick={() => { setOpen(false); navigate('/sources') }}
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
