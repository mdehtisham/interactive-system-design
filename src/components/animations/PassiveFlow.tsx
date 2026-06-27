'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  idle:   'border-border bg-muted text-muted-foreground',
  active: 'border-[var(--anim-data)] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shadow-md shadow-blue-200/50 dark:shadow-blue-900/30',
  done:   'border-[var(--anim-success)] bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
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
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        animate={{
          scale: state === 'active' ? [1, 1.06, 1] : 1,
        }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
        className={cn(
          'flex min-h-[52px] w-[100px] cursor-pointer items-center justify-center rounded-lg border-2 px-2 py-2 text-center text-xs font-medium transition-colors duration-300',
          NODE_COLOUR_CLASSES[state]
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
        role="listitem"
        aria-label={`${node.label}: ${node.tooltip}`}
      >
        {node.label}
      </motion.div>

      {/* Tooltip — appears above the node */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 z-20 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
          role="tooltip"
        >
          {node.tooltip}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
        </motion.div>
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
