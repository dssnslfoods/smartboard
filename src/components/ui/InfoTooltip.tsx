import { Info } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  content: string | string[]
  side?: 'top' | 'bottom' | 'left' | 'right'
  width?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'w-48', md: 'w-64', lg: 'w-80' }

const positionClass = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClass = {
  top: 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700',
  bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700',
  left: 'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-700',
  right: 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700',
}

export function InfoTooltip({ content, side = 'top', width = 'md' }: Props) {
  const [show, setShow] = useState(false)
  const lines = Array.isArray(content) ? content : [content]

  return (
    <span
      className="relative inline-flex shrink-0 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="h-3.5 w-3.5 text-slate-400 hover:text-amber-500 transition-colors" />

      {show && (
        <span
          className={cn(
            'absolute z-50 pointer-events-none animate-fade-in',
            positionClass[side],
            widths[width]
          )}
        >
          <span className="block rounded-lg bg-slate-700 px-3 py-2.5 text-left shadow-xl">
            {lines.map((line, i) => (
              <span key={i} className={cn('block text-[11px] leading-relaxed text-slate-100', i > 0 && 'mt-1.5')}>
                {line}
              </span>
            ))}
          </span>
          <span className={arrowClass[side]} />
        </span>
      )}
    </span>
  )
}
