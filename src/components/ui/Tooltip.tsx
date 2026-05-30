import { type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            'absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-secondary px-2 py-1 text-[11px] text-text-primary shadow-lg animate-fade-in',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
