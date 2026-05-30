import { cn } from '@/lib/utils'
import type { ConnectionState } from '@/types'

const map: Record<ConnectionState | 'demo', { color: string; label: string }> = {
  connected: { color: 'bg-accent-green', label: 'Connected' },
  connecting: { color: 'bg-accent-amber', label: 'Connecting' },
  error: { color: 'bg-accent-red', label: 'Error' },
  idle: { color: 'bg-text-secondary', label: 'Idle' },
  demo: { color: 'bg-accent-purple', label: 'Demo' },
}

export function StatusDot({
  state,
  showLabel = false,
  className,
}: {
  state: ConnectionState | 'demo'
  showLabel?: boolean
  className?: string
}) {
  const cfg = map[state]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        {(state === 'connected' || state === 'connecting') && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', cfg.color)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', cfg.color)} />
      </span>
      {showLabel && <span className="text-xs text-text-secondary">{cfg.label}</span>}
    </span>
  )
}
