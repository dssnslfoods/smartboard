import { useEffect, useRef, useState } from 'react'

/** Animate a number from 0 (or previous value) to `target` with easing. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(from + (target - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
