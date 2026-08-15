'use client'

// No React hooks used directly — state is managed by the Interactive base component
import { motion, AnimatePresence } from 'framer-motion'
import { Interactive } from '../Interactive'
import type { ControlValues, ControlDef } from '../Interactive'
import type { AnimationOptions } from '../AnimationShell'

// ─── Controls ─────────────────────────────────────────────────────────────────

function formatTtl(s: number): string {
  if (s < 60)    return `${s}s`
  if (s < 3600)  return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return `${Math.round(s / 86400)}d`
}

const CONTROLS: ControlDef[] = [
  {
    type: 'slider',
    id: 'ttl',
    label: 'TTL (Time to Live)',
    min: 60,
    max: 86400,
    step: 60,
    defaultValue: 3600,
    formatValue: formatTtl,
  },
  {
    type: 'toggle',
    id: 'swr',
    label: 'stale-while-revalidate (60s)',
    defaultValue: false,
  },
  {
    type: 'select',
    id: 'scenario',
    label: 'Simulate time elapsed',
    options: [
      { value: 'fresh',    label: '10% of TTL elapsed (fresh)' },
      { value: 'half',     label: '50% of TTL elapsed (fresh)' },
      { value: 'near',     label: '95% of TTL elapsed (nearly stale)' },
      { value: 'expired',  label: '100% TTL elapsed (stale)' },
      { value: 'far',      label: '200% TTL elapsed (very stale)' },
    ],
    defaultValue: 'fresh',
  },
]

// ─── Canvas ───────────────────────────────────────────────────────────────────

const SCENARIO_ELAPSED: Record<string, number> = {
  fresh:   0.10,
  half:    0.50,
  near:    0.95,
  expired: 1.00,
  far:     2.00,
}

type CacheState = 'fresh' | 'stale-swr' | 'stale' | 'expired'

function deriveCacheState(
  elapsedFraction: number,
  swrEnabled: boolean
): CacheState {
  if (elapsedFraction < 1) return 'fresh'
  if (elapsedFraction < 1 + 60 / 3600 && swrEnabled) return 'stale-swr'
  if (elapsedFraction < 1.5) return 'stale'
  return 'expired'
}

const CACHE_STATE_CONFIG: Record<
  CacheState,
  { label: string; sublabel: string; barColour: string; textColour: string; bgColour: string }
> = {
  fresh: {
    label: 'Cache HIT — FRESH',
    sublabel: 'Served from edge instantly. No origin contact.',
    barColour: '#16a34a',
    textColour: 'text-emerald-700 dark:text-emerald-400',
    bgColour: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800',
  },
  'stale-swr': {
    label: 'Cache HIT — STALE (revalidating in background)',
    sublabel: 'stale-while-revalidate: edge serves stale copy immediately and fetches fresh copy from origin in the background. User sees zero extra latency.',
    barColour: '#d97706',
    textColour: 'text-amber-700 dark:text-amber-400',
    bgColour: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
  },
  stale: {
    label: 'Cache MISS — TTL Expired',
    sublabel: 'TTL elapsed. Edge must fetch from origin before responding. User waits for origin round trip (+150–300ms).',
    barColour: '#dc2626',
    textColour: 'text-red-700 dark:text-red-400',
    bgColour: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  },
  expired: {
    label: 'Cache MISS — TTL Expired',
    sublabel: 'TTL elapsed. Edge must fetch from origin before responding. User waits for origin round trip (+150–300ms).',
    barColour: '#dc2626',
    textColour: 'text-red-700 dark:text-red-400',
    bgColour: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  },
}

function FreshnessBar({ fillFraction, colour }: { fillFraction: number; colour: string }) {
  const pct = Math.min(1, fillFraction) * 100
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
        <span>Cached</span>
        <span>TTL expires</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: colour }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-1 text-center text-[11px] text-muted-foreground">
        {pct.toFixed(0)}% of TTL consumed
      </div>
    </div>
  )
}

function CdnTtlCanvas({
  values,
}: {
  values: ControlValues
  options: AnimationOptions
}) {
  const ttl          = values['ttl'] as number
  const swrEnabled   = values['swr'] as boolean
  const scenarioKey  = values['scenario'] as string

  const elapsedFraction = SCENARIO_ELAPSED[scenarioKey] ?? 0
  const state           = deriveCacheState(elapsedFraction, swrEnabled)
  const config          = CACHE_STATE_CONFIG[state]

  const elapsedSeconds  = Math.round(elapsedFraction * ttl)
  const remainingSeconds = Math.max(0, ttl - elapsedSeconds)

  const cacheControlValue = swrEnabled
    ? `public, s-maxage=${ttl}, stale-while-revalidate=60`
    : `public, s-maxage=${ttl}`

  return (
    <div className="flex flex-col gap-4 py-2">

      {/* Cache-Control header display */}
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          HTTP Response Header
        </p>
        <p className="font-mono text-xs text-foreground break-all">
          <span className="text-blue-600 dark:text-blue-400">Cache-Control: </span>
          {cacheControlValue}
        </p>
      </div>

      {/* Freshness bar */}
      <FreshnessBar
        fillFraction={elapsedFraction}
        colour={config.barColour}
      />

      {/* Time display */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-border bg-muted/20 p-2">
          <p className="text-[10px] text-muted-foreground">Time elapsed</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {formatTtl(elapsedSeconds)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-2">
          <p className="text-[10px] text-muted-foreground">TTL remaining</p>
          <p className="font-mono text-sm font-bold text-foreground">
            {remainingSeconds > 0 ? formatTtl(remainingSeconds) : '0s'}
          </p>
        </div>
      </div>

      {/* Cache state verdict */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className={`rounded-lg border p-3 ${config.bgColour}`}
        >
          <p className={`text-sm font-semibold ${config.textColour}`}>
            {config.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/80">
            {config.sublabel}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* stale-while-revalidate explanation (when toggled on) */}
      {swrEnabled && state === 'stale-swr' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 px-3 py-2.5"
        >
          <p className="text-[11px] text-blue-700 dark:text-blue-300">
            <strong>stale-while-revalidate in action:</strong> The user receives the
            cached (slightly stale) response instantly. In parallel, the edge silently
            fetches a fresh copy from origin. The <em>next</em> request gets the fresh
            copy. Zero extra latency for the current user — at the cost of one brief
            period of staleness.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CdnTtlInteractive() {
  return (
    <Interactive
      title="TTL and Cache Freshness"
      description="Adjust the TTL to see how long content stays fresh at the edge. Change the time-elapsed scenario to see how the cache state transitions. Toggle stale-while-revalidate to eliminate miss latency during revalidation."
      controls={CONTROLS}
      render={(values, options) => (
        <CdnTtlCanvas values={values} options={options} />
      )}
    />
  )
}
