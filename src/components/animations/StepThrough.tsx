'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimationShell } from './AnimationShell'
import { cn } from '@/lib/utils'

export interface Step {
  title: string
  description: string
  /** Optional custom visual rendered in the upper canvas area. */
  visual?: React.ReactNode
  /** Colour token for the step indicator dot. Defaults to anim-data (blue). */
  colour?: string
}

interface Props {
  title: string
  description?: string
  steps: Step[]
}

// Slide direction based on navigation direction
const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
}

// ─── Step content panel ───────────────────────────────────────────────────────

interface StepPanelProps {
  step: Step
  index: number
  total: number
  direction: number
}

function StepPanel({ step, index, total, direction }: StepPanelProps) {
  const colour = step.colour ?? 'var(--anim-data)'

  return (
    <motion.div
      key={index}
      custom={direction}
      variants={SLIDE_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex h-full flex-col gap-4"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: colour }}
          aria-hidden
        >
          {index + 1}
        </div>
        <h3 className="text-sm font-semibold">{step.title}</h3>
      </div>

      {/* Optional custom visual */}
      {step.visual && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-4">
          {step.visual}
        </div>
      )}

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              backgroundColor: i === index ? colour : 'var(--anim-idle)',
              opacity: i < index ? 0.6 : 1,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function StepThrough({ title, description, steps }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [resetKey, setResetKey] = useState(0)

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < steps.length - 1

  const goTo = useCallback((nextIndex: number) => {
    setDirection(nextIndex > currentIndex ? 1 : -1)
    setCurrentIndex(nextIndex)
  }, [currentIndex])

  const handlePrev = useCallback(() => {
    if (canGoPrev) goTo(currentIndex - 1)
  }, [canGoPrev, currentIndex, goTo])

  const handleNext = useCallback(() => {
    if (canGoNext) goTo(currentIndex + 1)
  }, [canGoNext, currentIndex, goTo])

  const handleReset = useCallback(() => {
    setDirection(1)
    setCurrentIndex(0)
    setResetKey((k) => k + 1)
  }, [])

  const currentStep = steps[currentIndex]

  return (
    <AnimationShell title={title} description={description} onReset={handleReset} minHeight={300}>
      {() => (
        <div key={resetKey} className="flex h-full flex-col gap-4">
          {/* Step counter */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentIndex + 1} of {steps.length}
            </span>
          </div>

          {/* Animated step content */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              {currentStep && (
                <StepPanel
                  key={currentIndex}
                  step={currentStep}
                  index={currentIndex}
                  total={steps.length}
                  direction={direction}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Navigation buttons — thumb-reachable at bottom */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={cn('min-h-11 flex-1 gap-1.5', !canGoPrev && 'opacity-40')}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn('min-h-11 flex-1 gap-1.5', !canGoNext && 'opacity-40')}
              aria-label="Next step"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AnimationShell>
  )
}
