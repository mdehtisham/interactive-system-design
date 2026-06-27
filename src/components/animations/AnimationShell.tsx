'use client'

import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export type AnimationSpeed = 'slow' | 'normal' | 'fast'

/** Duration multipliers: slow plays at 2× wall-clock, fast at 0.5×. */
export const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  slow:   2,
  normal: 1,
  fast:   0.5,
}

export interface AnimationOptions {
  /** Multiply all durations by this factor. > 1 = slower, < 1 = faster. */
  speedMultiplier: number
  /** True when animations should be frozen (reduced-motion or manual pause). */
  paused: boolean
}

interface Props {
  title: string
  description?: string
  onReset: () => void
  /** Minimum canvas height. Defaults to 280px. */
  minHeight?: number
  children: (options: AnimationOptions) => React.ReactNode
}

/**
 * Shared wrapper for all animation types (PassiveFlow, StepThrough, Interactive, Comparative).
 *
 * Responsibilities:
 * - Signals pageHasAnimations = true to the Zustand store on mount so the
 *   Navbar shows the pause/play toggle. Cleans up on unmount.
 * - Reads the paused state from useReducedMotion (OS preference + manual toggle).
 * - Renders speed controls (Slow / Normal / Fast) and a Reset button at the
 *   bottom of the panel — thumb-reachable on mobile per CLAUDE.md spec.
 * - Passes { speedMultiplier, paused } to children via render prop.
 */
export function AnimationShell({
  title,
  description,
  onReset,
  minHeight = 280,
  children,
}: Props) {
  const setPageHasAnimations = useUIStore((s) => s.setPageHasAnimations)
  const paused = useReducedMotion()
  const [speed, setSpeed] = useState<AnimationSpeed>('normal')

  useEffect(() => {
    setPageHasAnimations(true)
    return () => setPageHasAnimations(false)
  }, [setPageHasAnimations])

  const handleSpeedChange = useCallback((next: AnimationSpeed) => {
    setSpeed(next)
  }, [])

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-card">
      {/* Header — title and description only, no controls here */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Animation canvas */}
      <div
        className="relative overflow-hidden p-4"
        style={{ minHeight }}
      >
        {/* Reduced-motion / paused overlay */}
        {paused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground select-none">
              Animations paused
            </p>
          </div>
        )}

        {children({ speedMultiplier: SPEED_MULTIPLIERS[speed], paused })}
      </div>

      {/* Controls — pinned to bottom for thumb-reachability on mobile */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2">
        {/* Speed selector */}
        <div
          className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
          role="group"
          aria-label="Animation speed"
        >
          {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              aria-pressed={speed === s}
              className={cn(
                'min-h-9 min-w-[52px] rounded-md px-2 text-xs font-medium capitalize transition-colors',
                speed === s
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          aria-label="Reset animation"
          className="min-h-11 min-w-11 gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Reset</span>
        </Button>
      </div>
    </div>
  )
}
