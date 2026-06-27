'use client'

import { useCallback, useState } from 'react'
import { AnimationShell, type AnimationOptions } from './AnimationShell'
import { cn } from '@/lib/utils'

export interface ComparativePanel {
  label: string
  /** CSS colour value for the panel's indicator dot. Defaults below. */
  colour?: string
  /**
   * Render prop that receives animation options (speedMultiplier, paused).
   * Use a render prop here so both panels can independently react to speed
   * and pause changes — crucial when panels contain different animation types.
   */
  render: (options: AnimationOptions) => React.ReactNode
}

interface Props {
  title: string
  description?: string
  left: ComparativePanel
  right: ComparativePanel
}

const PANEL_DEFAULT_COLOURS = {
  left:  'var(--anim-success)',  // green — typically the "happy path"
  right: 'var(--anim-error)',    // red   — typically the failure / slower path
}

// ─── Single panel ─────────────────────────────────────────────────────────────

interface PanelProps {
  panel: ComparativePanel
  defaultColour: string
  options: AnimationOptions
}

function Panel({ panel, defaultColour, options }: PanelProps) {
  const colour = panel.colour ?? defaultColour

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/20">
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
          aria-hidden
        />
        <span className="text-xs font-semibold">{panel.label}</span>
      </div>

      {/* Panel content */}
      <div className="flex-1 p-3">
        {panel.render(options)}
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function Comparative({ title, description, left, right }: Props) {
  const [resetKey, setResetKey] = useState(0)

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  return (
    <AnimationShell title={title} description={description} onReset={handleReset} minHeight={300}>
      {(options) => (
        <div
          key={resetKey}
          className={cn(
            'flex h-full flex-col gap-3',
            'md:flex-row md:gap-4'
          )}
        >
          <Panel
            panel={left}
            defaultColour={PANEL_DEFAULT_COLOURS.left}
            options={options}
          />

          {/* Vertical divider — desktop only; mobile uses flex-col gap instead */}
          <div className="hidden w-px shrink-0 bg-border md:block" aria-hidden />

          <Panel
            panel={right}
            defaultColour={PANEL_DEFAULT_COLOURS.right}
            options={options}
          />
        </div>
      )}
    </AnimationShell>
  )
}
