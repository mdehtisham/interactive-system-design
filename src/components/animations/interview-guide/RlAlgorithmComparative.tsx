'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Comparative } from '../Comparative'
import type { AnimationOptions } from '../AnimationShell'

// ─── Shared constants ─────────────────────────────────────────────────────────

const MAX_TOKENS = 10
const REFILL_RATE_MS = 1200   // 1 token every 1.2s at normal speed
const BURST_EVERY_MS = 8000   // burst of requests every 8s
const BURST_SIZE     = 7

// ─── Left panel — Token Bucket ────────────────────────────────────────────────

function TokenBucketPanel({ options }: { options: AnimationOptions }) {
  const [tokens, setTokens]       = useState(MAX_TOKENS)
  const [lastAction, setLastAction] = useState<'refill' | 'burst' | 'reject' | null>(null)

  useEffect(() => {
    if (options.paused) return

    const refillMs = REFILL_RATE_MS * options.speedMultiplier
    const burstMs  = BURST_EVERY_MS * options.speedMultiplier

    // Refill one token periodically
    const refillInterval = setInterval(() => {
      setTokens((t) => {
        if (t < MAX_TOKENS) {
          setLastAction('refill')
          return t + 1
        }
        return t
      })
    }, refillMs)

    // Simulate a burst of requests periodically
    const burstTimeout = setInterval(() => {
      setTokens((t) => {
        if (t >= BURST_SIZE) {
          setLastAction('burst')
          return t - BURST_SIZE
        } else if (t > 0) {
          setLastAction('burst')
          return 0
        } else {
          setLastAction('reject')
          return 0
        }
      })
    }, burstMs)

    return () => {
      clearInterval(refillInterval)
      clearInterval(burstTimeout)
    }
  }, [options.paused, options.speedMultiplier])

  return (
    <div className="flex h-full flex-col items-center gap-3 py-2 text-xs">
      <p className="text-center font-medium text-foreground/80">
        Token Bucket
      </p>
      <p className="text-center text-[10px] text-muted-foreground leading-snug">
        Refills at 1 token/s · Max capacity 10 · Allows bursts up to capacity
      </p>

      {/* Token grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: MAX_TOKENS }).map((_, i) => {
          const filled = i < tokens
          return (
            <motion.div
              key={i}
              animate={{
                backgroundColor: filled ? '#16a34a' : 'transparent',
                borderColor: filled ? '#16a34a' : '#94a3b8',
                scale: lastAction === 'refill' && i === tokens - 1 ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              className="h-7 w-7 rounded-full border-2"
            />
          )
        })}
      </div>

      {/* Counter */}
      <p className="font-mono text-sm font-bold text-foreground">
        Tokens: {tokens}/{MAX_TOKENS}
      </p>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {lastAction && (
          <motion.div
            key={lastAction + tokens}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`rounded-lg px-3 py-2 text-center text-[10px] font-semibold ${
              lastAction === 'reject'
                ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                : lastAction === 'burst'
                ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {lastAction === 'reject'
              ? `⚠ Bucket empty — burst of ${BURST_SIZE} requests rejected`
              : lastAction === 'burst'
              ? `${BURST_SIZE} requests consumed ${BURST_SIZE} tokens`
              : '+ 1 token refilled'}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-muted-foreground leading-snug">
        Token bucket allows controlled bursts. A full bucket can absorb a spike.
        Empty bucket rejects until refilled. Smooth output, burst-tolerant.
      </p>
    </div>
  )
}

// ─── Right panel — Sliding Window Counter ────────────────────────────────────

const WINDOW_SECONDS = 10
const WINDOW_LIMIT   = 8

function SlidingWindowPanel({ options }: { options: AnimationOptions }) {
  // Each entry is a timestamp (ms since panel mounted)
  const [requestLog, setRequestLog] = useState<number[]>([])
  const [now, setNow]               = useState(0)
  const [tick, setTick]             = useState(0)

  useEffect(() => {
    if (options.paused) return

    const tickMs = 600 * options.speedMultiplier

    // Advance time
    const clockInterval = setInterval(() => {
      setTick((t) => t + 1)
      setNow((n) => n + 600)
    }, tickMs)

    return () => clearInterval(clockInterval)
  }, [options.paused, options.speedMultiplier])

  // Add a new request every ~1.5 ticks
  useEffect(() => {
    if (tick % 2 === 0) {
      const windowStart = now - WINDOW_SECONDS * 1000
      setRequestLog((log) => {
        const active = log.filter((t) => t > windowStart)
        if (active.length < WINDOW_LIMIT) {
          return [...active, now]
        }
        return active // reject — don't add
      })
    } else {
      // Just prune old entries
      const windowStart = now - WINDOW_SECONDS * 1000
      setRequestLog((log) => log.filter((t) => t > windowStart))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const windowStart      = now - WINDOW_SECONDS * 1000
  const activeRequests   = requestLog.filter((t) => t > windowStart)
  const count            = activeRequests.length
  const isAtLimit        = count >= WINDOW_LIMIT

  return (
    <div className="flex h-full flex-col items-center gap-3 py-2 text-xs">
      <p className="text-center font-medium text-foreground/80">
        Sliding Window Counter
      </p>
      <p className="text-center text-[10px] text-muted-foreground leading-snug">
        10-second window · Max {WINDOW_LIMIT} requests · No burst allowance
      </p>

      {/* Timeline bar */}
      <div className="relative w-full">
        <div className="h-8 w-full overflow-hidden rounded-lg bg-muted/40 border border-border">
          {/* Window indicator */}
          <div className="absolute inset-0 flex items-center">
            {/* Request dots along the window */}
            {activeRequests.map((ts, i) => {
              const positionPct = ((ts - windowStart) / (WINDOW_SECONDS * 1000)) * 100
              return (
                <motion.div
                  key={`${ts}-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white ${
                    i >= WINDOW_LIMIT - 1 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ left: `${Math.max(0, Math.min(100, positionPct))}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                />
              )
            })}
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>–{WINDOW_SECONDS}s</span>
          <span>now →</span>
        </div>
      </div>

      {/* Counter */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isAtLimit
          ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
          : 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800'
      }`}>
        <p className={`font-mono text-sm font-bold ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {count}/{WINDOW_LIMIT}
        </p>
        <p className={`text-[10px] font-medium ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isAtLimit ? '⚠ At limit — requests rejected' : '✓ Requests allowed'}
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground leading-snug">
        Sliding window is precise — no bursts beyond the limit.
        Old requests age out of the window automatically.
        Storage: O(1) — just one counter per client.
      </p>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function RlAlgorithmComparative() {
  return (
    <Comparative
      title="Step 6 Deep Dive — Token Bucket vs Sliding Window Counter"
      description="Both algorithms enforce the same rate limit but behave differently under burst traffic. Watch how each handles a sudden spike of requests."
      left={{
        label: 'Token Bucket — allows controlled bursts',
        colour: '#16a34a',
        render: (options) => <TokenBucketPanel options={options} />,
      }}
      right={{
        label: 'Sliding Window Counter — strict, no burst',
        colour: '#3b82f6',
        render: (options) => <SlidingWindowPanel options={options} />,
      }}
    />
  )
}
