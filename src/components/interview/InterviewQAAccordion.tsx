'use client'

import { useState } from 'react'

export interface QAItem {
  /** The follow-up question exactly as an interviewer would ask it. */
  question: string
  /** One sentence: what the interviewer is really probing for. */
  intent: string
  /** The model answer — what a 10/10 Big Tech response sounds like. */
  answer: string
  /** The specific mistake most candidates make on this question. */
  trap?: string
}

interface Props {
  items: QAItem[]
}

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function InterviewQAAccordion({ items }: Props) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <div className="my-6 flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = openSet.has(i)

        return (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-border"
          >
            {/* ── Question header (always visible) ──────────────────────── */}
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-3 px-4 py-4 text-left transition-[colors,transform] active:scale-[0.99] hover:bg-gray-100 dark:hover:bg-zinc-700/50 min-h-[44px]"
            >
              {/* Question number badge */}
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900 dark:bg-blue-500/10 dark:text-blue-400">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.question}
                </p>
                <p className="mt-1 text-xs leading-snug">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                    Tests:{' '}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-500">
                    {item.intent}
                  </span>
                </p>
              </div>

              {/* Reveal / Hide label + chevron */}
              <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                <span>{isOpen ? 'Hide' : 'Reveal'}</span>
                <span
                  className={`transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown />
                </span>
              </div>
            </button>

            {/* ── Expandable answer area ──────────────────────────────────── */}
            {isOpen && (
              <div>
                {/* Model answer */}
                <div className="border-t border-border bg-green-50 px-4 py-4 dark:bg-green-500/5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                    Model Answer
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {item.answer}
                  </p>
                </div>

                {/* Common trap */}
                {item.trap && (
                  <div className="border-t border-border bg-amber-50 px-4 py-3 dark:bg-amber-500/5">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      ⚠ Common Trap
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {item.trap}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
