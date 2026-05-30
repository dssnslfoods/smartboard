import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'neutral'

const tones: Record<Tone, string> = {
  blue: 'bg-accent-blue/12 text-accent-blue border-accent-blue/25',
  green: 'bg-accent-green/12 text-accent-green border-accent-green/25',
  red: 'bg-accent-red/12 text-accent-red border-accent-red/25',
  amber: 'bg-accent-amber/12 text-accent-amber border-accent-amber/25',
  purple: 'bg-accent-purple/12 text-accent-purple border-accent-purple/25',
  neutral: 'bg-bg-secondary text-text-secondary border-border',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
