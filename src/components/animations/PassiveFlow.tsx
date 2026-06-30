'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { AnimationShell } from './AnimationShell'
import { cn } from '@/lib/utils'

export interface FlowNode {
  id: string
  label: string
  /** Text shown on hover/tap as a tooltip. Explains WHY the node exists. */
  tooltip: string
}

interface Props {
  title: string
  description?: string
  nodes: FlowNode[]
  /** Duration per step in ms at normal speed. Defaults to 1200ms. */
  stepDurationMs?: number
  /** Message shown when the last node completes. */
  completionMessage?: string
}

type NodeState = 'idle' | 'active' | 'done'

const NODE_COLOUR_CLASSES: Record<NodeState, string> = {
  idle:   'border-border bg-transparent text-muted-foreground',
  active: 'border-[var(--anim-data)] bg-transparent text-blue-700 dark:text-blue-300 shadow-md shadow-blue-200/50 dark:shadow-blue-900/30',
  done:   'border-[var(--anim-success)] bg-transparent text-green-700 dark:text-green-300',
}

const CONNECTOR_COLOUR_CLASSES: Record<'active' | 'idle', string> = {
  active: 'border-[var(--anim-success)]',
  idle:   'border-border',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NodeBoxProps {
  node: FlowNode
  state: NodeState
}

function NodeBox({ node, state }: NodeBoxProps) {
  const { resolvedTheme } = useTheme()
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const isDark = resolvedTheme === 'dark'
  const bg     = isDark ? '#18181b' : '#ffffff'
  const color  = isDark ? '#f4f4f5' : '#111111'
  const border = isDark ? '#3f3f46' : '#e5e7eb'

  const openTooltip = useCallback(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      // Place tooltip above the node: bottom of tooltip = top of node - 12px gap
      setTooltipPos({ top: rect.top - 12, left: rect.left + rect.width / 2 })
    }
    setShowTooltip(true)
  }, [])

  const closeTooltip = useCallback(() => setShowTooltip(false), [])

  return (
    <div className="flex flex-col items-center">
      <motion.div
        ref={nodeRef}
        animate={{ scale: state === 'active' ? [1, 1.06, 1] : 1 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className={cn(
          'flex min-h-[52px] w-[100px] cursor-pointer items-center justify-center rounded-lg border-2 px-2 py-2 text-center text-xs font-medium transition-colors duration-300',
          NODE_COLOUR_CLASSES[state]
        )}
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
        onTouchStart={openTooltip}
        onTouchEnd={closeTooltip}
        role="listitem"
        aria-label={`${node.label}: ${node.tooltip}`}
      >
        {node.label}
      </motion.div>

      {showTooltip && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          role="tooltip"
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            backgroundColor: bg,
            color,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            lineHeight: '1.5',
            width: '208px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          {node.tooltip}
          {/* Arrow pointing down toward the node */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${border}`,
          }} />
        </motion.div>,
        document.body
      )}
    </div>
  )
}

interface ConnectorProps {
  done: boolean
  direction: 'horizontal' | 'vertical'
  className?: string
}

function Connector({ done, direction, className }: ConnectorProps) {
  return (
    <div
      className={cn(
        'transition-colors duration-500',
        direction === 'horizontal'
          ? 'h-0 w-6 border-t-2'
          : 'h-6 w-0 border-l-2',
        done ? CONNECTOR_COLOUR_CLASSES.active : CONNECTOR_COLOUR_CLASSES.idle,
        className
      )}
      aria-hidden
    />
  )
}

// ─── Auto-player logic ────────────────────────────────────────────────────────

interface PlayerProps {
  nodes: FlowNode[]
  stepDurationMs: number
  paused: boolean
  completionMessage: string
}

function FlowPlayer({ nodes, stepDurationMs, paused, completionMessage }: PlayerProps) {
  // -1 = not started; 0..n-1 = active node index
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (paused) {
      clearTimer()
      return
    }

    if (activeIndex >= nodes.length - 1) {
      // Animation complete — do not schedule another step.
      return
    }

    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => prev + 1)
    }, activeIndex === -1 ? 600 : stepDurationMs)

    return clearTimer
  }, [activeIndex, paused, stepDurationMs, nodes.length])

  const getState = (index: number): NodeState => {
    if (index < activeIndex) return 'done'
    if (index === activeIndex) return 'active'
    return 'idle'
  }

  const isComplete = activeIndex === nodes.length - 1

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-6 py-4"
      role="list"
    >
      {/* Desktop layout: horizontal row. Mobile: vertical column. */}
      <div className="flex flex-col items-center gap-1 md:flex-row md:flex-wrap md:justify-center md:gap-1">
        {nodes.map((node, i) => {
          const state = getState(i)
          const connectorDone = i < activeIndex

          return (
            <div
              key={node.id}
              className="flex flex-col items-center gap-1 md:flex-row"
            >
              <NodeBox node={node} state={state} />

              {i < nodes.length - 1 && (
                <>
                  {/* Horizontal connector — desktop */}
                  <Connector
                    done={connectorDone}
                    direction="horizontal"
                    className="hidden md:block"
                  />
                  {/* Vertical connector — mobile */}
                  <Connector
                    done={connectorDone}
                    direction="vertical"
                    className="block md:hidden"
                  />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion message */}
      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs font-medium text-[var(--anim-success)]"
        >
          {completionMessage}
        </motion.p>
      )}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function PassiveFlow({
  title,
  description,
  nodes,
  stepDurationMs = 1200,
  completionMessage = 'Complete',
}: Props) {
  // resetKey forces FlowPlayer to remount, which resets all its internal state.
  const [resetKey, setResetKey] = useState(0)

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  return (
    <AnimationShell title={title} description={description} onReset={handleReset}>
      {({ speedMultiplier, paused }) => (
        <FlowPlayer
          key={resetKey}
          nodes={nodes}
          stepDurationMs={stepDurationMs * speedMultiplier}
          paused={paused}
          completionMessage={completionMessage}
        />
      )}
    </AnimationShell>
  )
}
