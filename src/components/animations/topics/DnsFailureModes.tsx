'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Comparative } from '../Comparative'
import type { AnimationOptions } from '../AnimationShell'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type FailureMode = 'nxdomain' | 'timeout' | 'stale' | 'poisoning'

interface FailureDef {
  id: FailureMode
  label: string
  errorText: string
  description: string
  tip: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAILURE_MODES: FailureDef[] = [
  {
    id: 'nxdomain',
    label: 'NXDOMAIN',
    errorText: 'DNS_PROBE_FINISHED_NXDOMAIN',
    description:
      'The domain does not exist in DNS. The authoritative nameserver returns NXDOMAIN ("Non-Existent Domain"). The browser gets no IP — it cannot even attempt a connection.',
    tip: 'Common cause: typo in the domain name, or the domain registration expired.',
  },
  {
    id: 'timeout',
    label: 'Timeout',
    errorText: 'ERR_CONNECTION_TIMED_OUT',
    description:
      'The recursive resolver is unreachable — maybe the ISP\'s DNS server is down, or the request is being dropped by a firewall. After ~5 seconds with no response, the browser shows a timeout error.',
    tip: 'Fix: switch to a public resolver like 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).',
  },
  {
    id: 'stale',
    label: 'Stale Cache',
    errorText: '404 or Connection Refused',
    description:
      'The DNS record changed (e.g., a server migration) but the old record is still cached by resolvers — because the TTL hasn\'t expired yet. Users reach the old server, which may be offline or returning errors.',
    tip: 'Prevention: lower the TTL to 60–300s at least 24h before a planned migration.',
  },
  {
    id: 'poisoning',
    label: 'DNS Poisoning',
    errorText: 'Silently wrong server',
    description:
      'A malicious resolver injects a fake IP — the user\'s request is routed to an attacker\'s server with no browser warning. The attacker can intercept credentials or serve malware.',
    tip: 'DNSSEC cryptographically signs DNS records, making forged responses detectable. HTTPS also mitigates this via certificate validation.',
  },
]

// ─── Happy-path panel ─────────────────────────────────────────────────────────

const HAPPY_NODES = [
  { label: 'Browser',      colour: 'success' },
  { label: 'Resolver',     colour: 'success' },
  { label: 'Auth NS',      colour: 'success' },
  { label: 'IP returned',  colour: 'success' },
  { label: 'Web Server',   colour: 'success' },
]

function HappyPath() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 py-2">
      <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        DNS resolves correctly
      </p>
      {HAPPY_NODES.map((node, i) => (
        <div key={node.label} className="flex flex-col items-center">
          <div className="flex min-w-[100px] items-center justify-center rounded-md border-2 border-emerald-400 bg-transparent px-3 py-1.5 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {node.label}
          </div>
          {i < HAPPY_NODES.length - 1 && (
            <div className="h-3 w-0.5 bg-emerald-400" aria-hidden />
          )}
        </div>
      ))}
      <div className="mt-2 rounded-md border border-emerald-400 bg-transparent px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        200 OK ✓
      </div>
    </div>
  )
}

// ─── Failure-mode panel ───────────────────────────────────────────────────────

// Nodes shown differ per failure mode — the chain breaks at different points.
const FAILURE_CHAINS: Record<FailureMode, string[]> = {
  nxdomain:  ['Browser', 'Resolver', '✕ NXDOMAIN'],
  timeout:   ['Browser', '✕ Timeout', '(no response)'],
  stale:     ['Browser', 'Resolver', 'Old IP cached', 'Old Server'],
  poisoning: ['Browser', 'Resolver', '✕ Fake IP', 'Attacker server'],
}

function FailureChain({ mode }: { mode: FailureDef }) {
  const chain = FAILURE_CHAINS[mode.id]
  const breakIndex = chain.findIndex((n) => n.startsWith('✕'))

  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {chain.map((label, i) => {
        const isBroken = label.startsWith('✕') || (breakIndex >= 0 && i > breakIndex)
        const isNoResponse = label === '(no response)'
        return (
          <div key={label} className="flex flex-col items-center">
            <div
              className={cn(
                'flex min-w-[100px] items-center justify-center rounded-md border-2 px-3 py-1.5 text-center text-xs font-medium',
                isBroken || isNoResponse
                  ? 'border-rose-400 bg-transparent text-rose-700 dark:text-rose-300'
                  : 'border-border bg-transparent text-muted-foreground'
              )}
            >
              {label}
            </div>
            {i < chain.length - 1 && (
              <div
                className={cn(
                  'h-3 w-0.5',
                  i >= breakIndex && breakIndex >= 0
                    ? 'bg-rose-400'
                    : 'bg-border'
                )}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FailureModePanel(_options: AnimationOptions) {
  const [selected, setSelected] = useState<FailureMode>('nxdomain')
  const mode = FAILURE_MODES.find((m) => m.id === selected) ?? FAILURE_MODES[0]!

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Mode selector tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FAILURE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={cn(
              'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors min-h-[36px]',
              selected === m.id
                ? 'border-rose-400 bg-transparent text-rose-700 dark:text-rose-300'
                : 'border-border text-muted-foreground hover:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chain diagram + description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2"
        >
          <FailureChain mode={mode} />

          <div className="rounded-md border border-rose-400 bg-transparent px-2 py-1 text-center text-xs font-semibold text-rose-700 dark:text-rose-300">
            {mode.errorText}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {mode.description}
          </p>

          <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
            💡 {mode.tip}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function DnsFailureModes() {
  return (
    <Comparative
      title="DNS Failure Modes"
      description="Left: the happy path. Right: select a failure mode to see what breaks and why."
      left={{
        label: 'Happy Path',
        colour: 'var(--anim-success)',
        render: () => <HappyPath />,
      }}
      right={{
        label: 'Failure Mode',
        colour: 'var(--anim-error)',
        render: (options) => <FailureModePanel {...options} />,
      }}
    />
  )
}
