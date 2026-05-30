import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-blue text-[#06121f] hover:brightness-110 font-medium shadow-[0_0_0_1px_rgba(88,166,255,0.3)]',
  secondary: 'bg-bg-secondary text-text-primary hover:bg-[#1c2128] border border-border',
  outline: 'border border-border text-text-primary hover:bg-bg-secondary',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
  danger: 'bg-accent-red/15 text-accent-red hover:bg-accent-red/25 border border-accent-red/30',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  icon: 'h-9 w-9 rounded-lg justify-center',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'
