'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Comparative } from '../Comparative'
import type { AnimationOptions } from '../AnimationShell'

// ─── Shared types and constants ───────────────────────────────────────────────

const EDGE_NODES = ['PoP A', 'PoP B', 'PoP C', 'PoP D', 'PoP E', 'PoP F', 'PoP G', 'PoP H']

type Phase =
  | 'idle'
  | 'cache-hit'     // content fresh — no origin contact
  | 'ttl-expires'   // key expires simultaneously
  | 'hammering'     // all PoPs hit origin / shield simultaneously
  | 'origin-overload'
  | 'shield-single' // shield coalesces all misses into one origin request
  | 'done'

// ─── Left panel — Thundering Herd (no origin shield) ─────────────────────────

function ThunderingHerdPanel({ options }: { options: AnimationOptions }) {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (options.paused) return

    const base = 600 * options.speedMultiplier
    setPhase('idle')

    const timers = [
      setTimeout(() => setPhase('cache-hit'),      base * 1),
      setTimeout(() => setPhase('ttl-expires'),     base * 2.5),
      setTimeout(() => setPhase('hammering'),       base * 3.5),
      setTimeout(() => setPhase('origin-overload'), base * 4.8),
      setTimeout(() => setPhase('done'),            base * 7),
      // loop
      setTimeout(() => setPhase('idle'),            base * 9),
    ]
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.paused, options.speedMultiplier])

  const originLoad   = phase === 'hammering' || phase === 'origin-overload'
  const originStatus = phase === 'origin-overload' ? '🔴 Overloaded' : phase === 'done' ? '🟢 Recovered' : '🟢 OK'

  return (
    <div className="flex h-full flex-col items-center gap-3 py-2 text-xs">

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          {phase === 'idle' && (
            <p className="text-muted-foreground">Waiting for cache expiry…</p>
          )}
          {phase === 'cache-hit' && (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Content cached — all PoPs serving from edge ✓
            </p>
          )}
          {phase === 'ttl-expires' && (
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              TTL expired — cache key evicted from all PoPs simultaneously
            </p>
          )}
          {phase === 'hammering' && (
            <p className="font-semibold text-red-600 dark:text-red-400">
              All 8 PoPs miss simultaneously — all fire requests to origin
            </p>
          )}
          {phase === 'origin-overload' && (
            <p className="font-bold text-red-600 dark:text-red-400">
              ⚠ Origin overloaded — 8 simultaneous fetches of the same file
            </p>
          )}
          {phase === 'done' && (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Origin recovered — edge caches repopulated
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edge nodes */}
      <div className="grid w-full grid-cols-4 gap-1.5">
        {EDGE_NODES.map((pop) => (
          <motion.div
            key={pop}
            animate={{
              borderColor:
                phase === 'cache-hit' || phase === 'done'
                  ? '#16a34a'
                  : phase === 'ttl-expires'
                  ? '#d97706'
                  : phase === 'hammering' || phase === 'origin-overload'
                  ? '#dc2626'
                  : '#94a3b8',
              scale: phase === 'hammering' ? [1, 1.06, 1] : 1,
            }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-center rounded-lg border-2 py-2 text-[10px] font-semibold text-foreground"
          >
            {pop}
          </motion.div>
        ))}
      </div>

      {/* Arrow group from PoPs to Origin */}
      <div className="flex w-full items-center justify-center gap-0.5">
        {EDGE_NODES.map((_, i) => (
          <motion.div
            key={i}
            className="h-6 w-0.5 rounded"
            animate={{
              backgroundColor:
                phase === 'hammering' || phase === 'origin-overload'
                  ? '#dc2626'
                  : '#e2e8f0',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Origin Server */}
      <motion.div
        animate={{
          borderColor: originLoad ? '#dc2626' : '#94a3b8',
          backgroundColor: originLoad ? 'rgba(220,38,38,0.05)' : 'transparent',
        }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-xl border-2 px-3 py-3 text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Origin Server
        </p>
        <p className="mt-1 font-semibold">{originStatus}</p>
        {(phase === 'hammering' || phase === 'origin-overload') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[10px] text-red-600 dark:text-red-400"
          >
            Receiving {EDGE_NODES.length} duplicate requests for the same file
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}

// ─── Right panel — Origin Shield (thundering herd prevented) ──────────────────

function OriginShieldPanel({ options }: { options: AnimationOptions }) {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (options.paused) return

    const base = 600 * options.speedMultiplier
    setPhase('idle')

    const timers = [
      setTimeout(() => setPhase('cache-hit'),      base * 1),
      setTimeout(() => setPhase('ttl-expires'),     base * 2.5),
      setTimeout(() => setPhase('hammering'),       base * 3.5),
      setTimeout(() => setPhase('shield-single'),   base * 4.8),
      setTimeout(() => setPhase('done'),            base * 7),
      // loop
      setTimeout(() => setPhase('idle'),            base * 9),
    ]
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.paused, options.speedMultiplier])

  const shieldActive = phase === 'hammering' || phase === 'shield-single'
  const shieldSingleRequest = phase === 'shield-single'

  return (
    <div className="flex h-full flex-col items-center gap-3 py-2 text-xs">

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          {phase === 'idle' && (
            <p className="text-muted-foreground">Waiting for cache expiry…</p>
          )}
          {phase === 'cache-hit' && (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Content cached — all PoPs serving from edge ✓
            </p>
          )}
          {phase === 'ttl-expires' && (
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              TTL expired — cache key evicted from all PoPs simultaneously
            </p>
          )}
          {phase === 'hammering' && (
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              All 8 PoPs miss — all route to Origin Shield (not origin)
            </p>
          )}
          {phase === 'shield-single' && (
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              Shield coalesces 8 misses → 1 origin request. Origin protected.
            </p>
          )}
          {phase === 'done' && (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Shield populated — fans out to all edge PoPs ✓
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edge nodes → Shield */}
      <div className="grid w-full grid-cols-4 gap-1.5">
        {EDGE_NODES.map((pop) => (
          <motion.div
            key={pop}
            animate={{
              borderColor:
                phase === 'cache-hit' || phase === 'done'
                  ? '#16a34a'
                  : phase === 'ttl-expires'
                  ? '#d97706'
                  : phase === 'hammering'
                  ? '#f59e0b'
                  : phase === 'shield-single'
                  ? '#3b82f6'
                  : '#94a3b8',
            }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-center rounded-lg border-2 py-2 text-[10px] font-semibold text-foreground"
          >
            {pop}
          </motion.div>
        ))}
      </div>

      {/* Arrows to shield */}
      <div className="flex w-full items-center justify-center gap-0.5">
        {EDGE_NODES.map((_, i) => (
          <motion.div
            key={i}
            className="h-5 w-0.5 rounded"
            animate={{
              backgroundColor:
                phase === 'hammering' || phase === 'shield-single'
                  ? '#f59e0b'
                  : '#e2e8f0',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Origin Shield */}
      <motion.div
        animate={{
          borderColor: shieldActive ? '#3b82f6' : '#94a3b8',
          backgroundColor: shieldActive ? 'rgba(59,130,246,0.05)' : 'transparent',
        }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-xl border-2 px-3 py-2.5 text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Origin Shield
        </p>
        {!shieldActive && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Regional tier-2 cache
          </p>
        )}
        {phase === 'hammering' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium"
          >
            Receiving 8 misses — coalescing into 1 origin request
          </motion.p>
        )}
        {shieldSingleRequest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            ↓ Sending 1 request to origin ↓
          </motion.p>
        )}
      </motion.div>

      {/* Arrow shield → origin (single) */}
      <motion.div
        className="h-5 w-0.5 rounded"
        animate={{
          backgroundColor: shieldSingleRequest ? '#16a34a' : '#e2e8f0',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Origin Server */}
      <motion.div
        animate={{
          borderColor:
            phase === 'shield-single' || phase === 'done'
              ? '#16a34a'
              : '#94a3b8',
        }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-xl border-2 px-3 py-3 text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Origin Server
        </p>
        <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
          🟢 Healthy
        </p>
        {(phase === 'shield-single' || phase === 'done') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400"
          >
            Received 1 request (not 8) — origin protected
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CdnThunderingHerd() {
  return (
    <Comparative
      title="Thundering Herd vs Origin Shield"
      description="Both panels simulate 8 edge PoPs experiencing a simultaneous cache expiry — the most dangerous CDN failure mode. Watch what happens to the origin server in each case."
      left={{
        label: 'No Origin Shield — Thundering Herd',
        colour: '#dc2626',
        render: (options) => <ThunderingHerdPanel options={options} />,
      }}
      right={{
        label: 'With Origin Shield — Protected',
        colour: '#16a34a',
        render: (options) => <OriginShieldPanel options={options} />,
      }}
    />
  )
}
