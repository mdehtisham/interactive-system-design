'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Interactive } from '../Interactive'
import type { ControlValues, ControlDef } from '../Interactive'
import type { AnimationOptions } from '../AnimationShell'

// ─── Data ─────────────────────────────────────────────────────────────────────

type LocationId = 'us-east' | 'uk' | 'japan' | 'australia'
type DcId      = 'us-east' | 'eu-west' | 'apac' | 'australia'

const DCS: Record<DcId, { label: string; flag: string }> = {
  'us-east':   { label: 'US East',   flag: '🇺🇸' },
  'eu-west':   { label: 'EU West',   flag: '🇪🇺' },
  'apac':      { label: 'APAC',      flag: '🇯🇵' },
  'australia': { label: 'Australia', flag: '🇦🇺' },
}

const DC_ORDER: DcId[] = ['us-east', 'eu-west', 'apac', 'australia']

const LOCATIONS: Record<LocationId, { label: string; flag: string; nearestDc: DcId }> = {
  'us-east':   { label: 'New York', flag: '🇺🇸', nearestDc: 'us-east'   },
  'uk':        { label: 'London',   flag: '🇬🇧', nearestDc: 'eu-west'   },
  'japan':     { label: 'Tokyo',    flag: '🇯🇵', nearestDc: 'apac'      },
  'australia': { label: 'Sydney',   flag: '🇦🇺', nearestDc: 'australia' },
}

// Round-trip latency (ms) from each user city to each DC
const LATENCY: Record<LocationId, Record<DcId, number>> = {
  'us-east':   { 'us-east': 5,   'eu-west': 88,  'apac': 168, 'australia': 178 },
  'uk':        { 'us-east': 90,  'eu-west': 12,  'apac': 220, 'australia': 255 },
  'japan':     { 'us-east': 168, 'eu-west': 220, 'apac': 8,   'australia': 88  },
  'australia': { 'us-east': 178, 'eu-west': 255, 'apac': 88,  'australia': 15  },
}

function latencyColor(ms: number) {
  if (ms <= 20)  return '#16a34a'  // green — fast
  if (ms <= 100) return '#d97706'  // amber — ok
  return '#dc2626'                  // red   — slow
}

// ─── Controls ─────────────────────────────────────────────────────────────────

const CONTROLS: ControlDef[] = [
  {
    type: 'select',
    id: 'location',
    label: 'Your location',
    options: [
      { value: 'us-east',   label: '🇺🇸 New York'  },
      { value: 'uk',        label: '🇬🇧 London'    },
      { value: 'japan',     label: '🇯🇵 Tokyo'     },
      { value: 'australia', label: '🇦🇺 Sydney'    },
    ],
    defaultValue: 'us-east',
  },
]

// ─── Animation step types ─────────────────────────────────────────────────────
// 0 → idle
// 1 → DNS query travelling up
// 2 → DNS resolver checking location
// 3 → DC selected, arrow pointing down
// 4 → result card visible

type Step = 0 | 1 | 2 | 3 | 4

// ─── Arrow ────────────────────────────────────────────────────────────────────

function Arrow({ active, label }: { active: boolean; label?: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="w-0.5 rounded"
        style={{ height: 32 }}
        animate={{ backgroundColor: active ? '#3b82f6' : '#cbd5e1' }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        style={{
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
        }}
        animate={{ borderTopColor: active ? '#3b82f6' : '#cbd5e1' }}
        transition={{ duration: 0.3 }}
        className="border-t-[6px]"
      />
      {label && active && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -right-14 top-2 whitespace-nowrap rounded bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300"
        >
          {label}
        </motion.span>
      )}
    </div>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function GeoDnsCanvas({ values }: { values: ControlValues; options: AnimationOptions }) {
  const locationId = (values['location'] ?? 'us-east') as LocationId
  const loc        = LOCATIONS[locationId]
  const nearestDc  = loc.nearestDc
  const [step, setStep] = useState<Step>(0)

  // Re-run animation every time the location changes
  useEffect(() => {
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 150)
    const t2 = setTimeout(() => setStep(2), 750)
    const t3 = setTimeout(() => setStep(3), 1600)
    const t4 = setTimeout(() => setStep(4), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [locationId])

  const bestMs  = LATENCY[locationId][nearestDc]
  const worstDc = DC_ORDER.reduce((w, id) =>
    LATENCY[locationId][id] > LATENCY[locationId][w] ? id : w, DC_ORDER[0])
  const worstMs = LATENCY[locationId][worstDc]
  const speedup = Math.round(worstMs / bestMs)

  return (
    <div className="flex flex-col items-center gap-0 py-2">

      {/* ── User node ── */}
      <div className="flex items-center gap-2 rounded-xl border-2 border-blue-400 px-4 py-2.5 text-sm font-semibold">
        <span className="text-xl">{loc.flag}</span>
        <span>You — {loc.label}</span>
      </div>

      {/* ── Arrow: user → DNS ── */}
      <Arrow active={step >= 1} label="DNS query" />

      {/* ── DNS Resolver node ── */}
      <motion.div
        animate={{
          borderColor: step === 2
            ? '#f59e0b'
            : step >= 3 ? '#10b981' : '#94a3b8',
        }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-xs rounded-xl border-2 px-4 py-3 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          GeoDNS Resolver
        </p>

        <AnimatePresence mode="wait">
          {step < 1 && (
            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-muted-foreground">
              Waiting for query…
            </motion.p>
          )}
          {step === 1 && (
            <motion.p key="received" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              Query received
            </motion.p>
          )}
          {step === 2 && (
            <motion.p key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              Checking origin location… 🔍
            </motion.p>
          )}
          {step >= 3 && (
            <motion.p key="resolved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {loc.label} → nearest is <strong>{DCS[nearestDc].label}</strong> ✓
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Arrow: DNS → DC row ── */}
      <Arrow active={step >= 3} label="IP returned" />

      {/* ── Data centre row ── */}
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        {DC_ORDER.map((dcId) => {
          const dc        = DCS[dcId]
          const ms        = LATENCY[locationId][dcId]
          const isNearest = dcId === nearestDc
          const dimmed    = step >= 3 && !isNearest

          return (
            <motion.div
              key={dcId}
              animate={{
                borderColor: step >= 3 && isNearest ? '#10b981' : '#e2e8f0',
                opacity: dimmed ? 0.4 : 1,
              }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center"
            >
              <span className="text-lg">{dc.flag}</span>
              <span className="text-[11px] font-semibold leading-tight">{dc.label}</span>

              <span
                className="mt-0.5 rounded px-2 py-0.5 text-[11px] font-mono font-bold"
                style={{ color: latencyColor(ms) }}
              >
                ~{ms}ms
              </span>

              {step >= 3 && isNearest && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  ✓ Routed here
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── Result summary ── */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 w-full rounded-xl border border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3 text-xs"
          >
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">
              GeoDNS routed you to {DCS[nearestDc].label} — <span className="font-mono">~{bestMs}ms</span>
            </p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              Without GeoDNS you might land on {DCS[worstDc].label} at <span className="font-mono text-red-600 dark:text-red-400">~{worstMs}ms</span> — that's <strong>{speedup}× slower</strong>. DNS checked your IP, picked the closest server, and returned its address — all before your browser sent a single HTTP request.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function GeoDnsInteractive() {
  return (
    <Interactive
      title="GeoDNS Routing"
      description="Pick your location and watch DNS route you to the nearest data centre. Latency colours: green = fast, amber = ok, red = slow."
      controls={CONTROLS}
      render={(values, options) => <GeoDnsCanvas values={values} options={options} />}
    />
  )
}
