'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimationShell } from '../AnimationShell'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface FrameworkStep {
  id: number
  label: string
  timeBudget: string
  dashed?: boolean
  description: string
  keyQuestions: string[]
}

const STEPS: FrameworkStep[] = [
  {
    id: 1,
    label: 'Requirements',
    timeBudget: '~5 min',
    description:
      'Before drawing any boxes, spend 5 minutes asking clarifying questions. You are not expected to know what to build — you are expected to know what to ask. Split into functional (what the system does) and non-functional (how the system behaves at scale). Close with a scale estimate.',
    keyQuestions: [
      'What must the system DO? (functional requirements)',
      'How must it BEHAVE at scale? (latency, availability, durability)',
      'How many users / requests per second at peak?',
      'What is explicitly OUT of scope for today?',
    ],
  },
  {
    id: 2,
    label: 'Core Entities',
    timeBudget: '~3 min',
    description:
      'Identify the 3–5 main nouns in the system — the things you will store, query, and reason about. For each entity: what data does it hold? For each pair: what is the relationship and cardinality? Sketching this before writing any API forces you to reason about data before behaviour.',
    keyQuestions: [
      'What are the main data objects?',
      'What fields does each entity need?',
      'How do entities relate (1:1, 1:many, many:many)?',
      'Which entity is the hot path for reads and writes?',
    ],
  },
  {
    id: 3,
    label: 'API / Interface',
    timeBudget: '~5 min',
    description:
      'Define how clients interact with your system. For CRUD services: HTTP endpoints, verbs, request/response shapes. For middleware: the function signature and side effects. For message-driven systems: the event schema. Write the API contract before the architecture — it forces you to reason about the contract first.',
    keyQuestions: [
      'What operations does a client need to perform?',
      'What does the request / response shape look like?',
      'What status codes and error shapes are needed?',
      'What authentication or authorization is required?',
    ],
  },
  {
    id: 4,
    label: 'Data Flow',
    timeBudget: '~5 min',
    dashed: true,
    description:
      'Trace a single real request end-to-end through the system you have described. Start at the client, go through every layer, end at the response. Every arrow must have a reason. This step reveals gaps: layers mentioned but not thought through, or data that never arrives at its destination.',
    keyQuestions: [
      'Where does the request enter the system?',
      'What transforms or enriches it at each layer?',
      'Where could it fail, and what happens then?',
      'How does the response get back to the caller?',
    ],
  },
  {
    id: 5,
    label: 'High-Level Design',
    timeBudget: '~10 min',
    description:
      'Now draw the architecture: services, databases, caches, queues. Each box is a component with a clear responsibility. Each arrow has a protocol and a direction. Use your entities (Step 2) to drive storage choices. Use your API (Step 3) to validate that services have the right interfaces. Name real technologies.',
    keyQuestions: [
      'Which services own which domains?',
      'Where is state stored and what consistency model does it need?',
      'Where are the read and write hot paths?',
      'Which real technologies (Redis, Kafka, S3) and why?',
    ],
  },
  {
    id: 6,
    label: 'Deep Dives',
    timeBudget: '~10 min',
    description:
      'Proactively raise the core engineering challenge of the topic — the thing the interviewer is specifically probing for — before they ask. This separates a 7/10 answer from a 10/10. For every system design problem there is one canonical hard problem. Not raising it unprompted signals you do not know where the complexity lives.',
    keyQuestions: [
      'What is the single hardest problem in this design?',
      'What could fail silently at 10× the estimated scale?',
      'What are the trade-offs of your two or three key decisions?',
      'What would you do differently with twice the time?',
    ],
  },
]

// ─── Step box ─────────────────────────────────────────────────────────────────

interface StepBoxProps {
  step: FrameworkStep
  state: 'idle' | 'active' | 'done'
  isSelected: boolean
  onClick: () => void
}

function StepBox({ step, state, isSelected, onClick }: StepBoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Step ${step.id}: ${step.label}`}
      className={cn(
        'relative flex min-h-[72px] min-w-[80px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2',
        'border-2 text-center transition-[colors,transform] active:scale-[0.97]',
        step.dashed ? 'border-dashed' : '',
        state === 'idle'
          ? 'border-border text-muted-foreground hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-foreground'
          : state === 'active'
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 shadow-md shadow-blue-200/50 dark:shadow-blue-900/30'
          : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        isSelected && state === 'idle'
          ? 'border-zinc-400 dark:border-zinc-500 bg-muted/40'
          : ''
      )}
    >
      {/* Number bubble */}
      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
          state === 'active'
            ? 'bg-blue-500 text-white'
            : state === 'done'
            ? 'bg-emerald-500 text-white'
            : 'bg-muted text-muted-foreground border border-border'
        )}
      >
        {step.id}
      </div>

      <span className="mt-1 text-[11px] font-semibold leading-tight">{step.label}</span>
      <span className="text-[9px] opacity-70">{step.timeBudget}</span>
    </button>
  )
}

// ─── Connector ────────────────────────────────────────────────────────────────

function Connector({ active }: { active: boolean }) {
  return (
    <div className="hidden items-center md:flex">
      <div
        className={cn(
          'h-0 w-5 border-t-2 transition-colors duration-500',
          active ? 'border-emerald-400' : 'border-border'
        )}
      />
      <div
        className={cn(
          'border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] transition-colors duration-500',
          active ? 'border-l-emerald-400' : 'border-l-border'
        )}
      />
    </div>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

interface CanvasProps {
  speedMultiplier: number
  paused: boolean
  resetKey: number
}

function FrameworkCanvas({ speedMultiplier, paused, resetKey }: CanvasProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [manuallySelected, setManuallySelected] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Auto-advance through steps
  useEffect(() => {
    if (paused || manuallySelected) {
      clearTimer()
      return
    }
    if (activeIndex >= STEPS.length - 1) return

    const delay = activeIndex === -1 ? 800 : 1800 * speedMultiplier
    timerRef.current = setTimeout(() => {
      setActiveIndex((p) => p + 1)
    }, delay)

    return clearTimer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, paused, speedMultiplier, manuallySelected])

  // Keep selectedIndex in sync with activeIndex when not manually selected
  useEffect(() => {
    if (!manuallySelected && activeIndex >= 0) {
      setSelectedIndex(activeIndex)
    }
  }, [activeIndex, manuallySelected])

  // Reset on resetKey change
  useEffect(() => {
    clearTimer()
    setActiveIndex(-1)
    setSelectedIndex(null)
    setManuallySelected(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const handleStepClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setManuallySelected(true)
  }, [])

  const getState = (index: number): 'idle' | 'active' | 'done' => {
    if (index < activeIndex) return 'done'
    if (index === activeIndex) return 'active'
    return 'idle'
  }

  const displayIndex = selectedIndex ?? (activeIndex >= 0 ? activeIndex : 0)
  const displayStep = STEPS[displayIndex]

  return (
    <div className="flex flex-col gap-5">
      {/* Step boxes row */}
      <div className="flex flex-col items-center gap-4 pt-4 md:flex-row md:justify-center md:gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center gap-2 md:flex-row">
            <StepBox
              step={step}
              state={getState(i)}
              isSelected={selectedIndex === i}
              onClick={() => handleStepClick(i)}
            />
            {i < STEPS.length - 1 && (
              <>
                {/* Mobile: vertical connector */}
                <div className={cn('h-4 w-0.5 border-l-2 transition-colors duration-500 md:hidden', i < activeIndex ? 'border-emerald-400' : 'border-border')} />
                {/* Desktop: horizontal connector */}
                <Connector active={i < activeIndex} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Detail panel for selected/active step */}
      <AnimatePresence mode="wait">
        {displayStep && (
          <motion.div
            key={displayStep.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-500/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shrink-0">
                {displayStep.id}
              </div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                {displayStep.label}
                <span className="ml-2 text-xs font-normal text-blue-600/70 dark:text-blue-400/70">
                  {displayStep.timeBudget}
                </span>
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-foreground/80 mb-3">
              {displayStep.description}
            </p>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1.5">
                Key questions to ask
              </p>
              <ul className="space-y-1">
                {displayStep.keyQuestions.map((q, qi) => (
                  <li key={qi} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <span className="mt-0.5 shrink-0 text-blue-400">›</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {manuallySelected && (
              <p className="mt-2 text-[10px] text-blue-600/60 dark:text-blue-400/60 italic">
                Click another step box to explore it, or Reset to restart the walkthrough.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function InterviewFrameworkSteps() {
  const [resetKey, setResetKey] = useState(0)
  const handleReset = useCallback(() => setResetKey((k) => k + 1), [])

  return (
    <AnimationShell
      title="The 6-Step System Design Framework"
      description="Auto-plays through all 6 steps. Click any step box to jump to it and read the detail. Reset to replay the walkthrough."
      onReset={handleReset}
      minHeight={320}
    >
      {({ speedMultiplier, paused }) => (
        <FrameworkCanvas
          speedMultiplier={speedMultiplier}
          paused={paused}
          resetKey={resetKey}
        />
      )}
    </AnimationShell>
  )
}
