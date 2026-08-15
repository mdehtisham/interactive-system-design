'use client'

import { Comparative } from '../Comparative'
import type { AnimationOptions } from '../AnimationShell'
import { cn } from '@/lib/utils'

// ─── Shared scenario ──────────────────────────────────────────────────────────
// A client fetches a user who does not exist.
// Left panel: server returns 404 Not Found — the correct code.
// Right panel: server returns 200 OK with an error in the body — the anti-pattern.

interface Effect {
  system: string
  correct: { ok: boolean; text: string }
  wrong: { ok: boolean; text: string }
}

const EFFECTS: Effect[] = [
  {
    system: 'APM / Error Monitoring',
    correct: { ok: true,  text: '404 logged as client error — alert fires if rate spikes' },
    wrong:   { ok: false, text: '200 OK counted as success — error is invisible in dashboards' },
  },
  {
    system: 'Retry Logic (SDK / Middleware)',
    correct: { ok: true,  text: '4xx is permanent — client does not retry, saves server load' },
    wrong:   { ok: false, text: '200 OK triggers no retry — but if it did, would retry forever' },
  },
  {
    system: 'CDN / Reverse Proxy Cache',
    correct: { ok: true,  text: '404 is not cached (or cached briefly per Cache-Control)' },
    wrong:   { ok: false, text: '200 OK may be cached — every client now gets the stale error body' },
  },
  {
    system: 'SLA Metrics / Uptime',
    correct: { ok: true,  text: 'Error rate accurately reflects actual failures' },
    wrong:   { ok: false, text: 'Error rate shows 0% — SLA looks perfect while users see failures' },
  },
  {
    system: 'Client-side Error Handling',
    correct: { ok: true,  text: 'catch(err) fires — developer handles the 404 specifically' },
    wrong:   { ok: false, text: 'fetch() resolves successfully — client must manually inspect body' },
  },
]

// ─── Response box ─────────────────────────────────────────────────────────────

function ResponseBox({ correct }: { correct: boolean }) {
  return (
    <div className={cn(
      'rounded-lg border-2 p-2 font-mono text-[10px] leading-relaxed',
      correct
        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
        : 'border-rose-400 bg-rose-50 dark:bg-rose-900/10'
    )}>
      {correct ? (
        <>
          <div className="font-bold text-emerald-700 dark:text-emerald-400">HTTP/1.1 404 Not Found</div>
          <div className="text-muted-foreground">Content-Type: application/json</div>
          <div className="mt-1">{`{`}</div>
          <div className="pl-2">&quot;error&quot;: &quot;User not found&quot;</div>
          <div>{`}`}</div>
        </>
      ) : (
        <>
          <div className="font-bold text-rose-700 dark:text-rose-400">HTTP/1.1 200 OK</div>
          <div className="text-muted-foreground">Content-Type: application/json</div>
          <div className="mt-1">{`{`}</div>
          <div className="pl-2">&quot;status&quot;: &quot;error&quot;,</div>
          <div className="pl-2">&quot;message&quot;: &quot;User not found&quot;</div>
          <div>{`}`}</div>
        </>
      )}
    </div>
  )
}

// ─── Effect row ───────────────────────────────────────────────────────────────

function EffectRow({ effect, correct }: { effect: Effect; correct: boolean }) {
  const data = correct ? effect.correct : effect.wrong
  return (
    <div className="flex gap-2 text-[10px]">
      <span
        className="mt-0.5 shrink-0 text-base leading-none"
        aria-hidden
      >
        {data.ok ? '✓' : '✗'}
      </span>
      <div>
        <span className="font-semibold text-foreground">{effect.system}: </span>
        <span
          className={data.ok
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-rose-700 dark:text-rose-400'
          }
        >
          {data.text}
        </span>
      </div>
    </div>
  )
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function CorrectPanel(_options: AnimationOptions) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
        Correct: Use 404 Not Found
      </p>
      <ResponseBox correct={true} />
      <div className="flex flex-col gap-2">
        {EFFECTS.map((e) => (
          <EffectRow key={e.system} effect={e} correct={true} />
        ))}
      </div>
      <p className="rounded border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/10 px-2 py-1.5 text-[10px] text-emerald-800 dark:text-emerald-300">
        HTTP status codes are a machine-readable contract. Every layer in the stack — proxies, SDKs, monitors, browsers — reads the status code to decide what to do next. Use the right code.
      </p>
    </div>
  )
}

function WrongPanel(_options: AnimationOptions) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
        Anti-pattern: 200 OK with error in body
      </p>
      <ResponseBox correct={false} />
      <div className="flex flex-col gap-2">
        {EFFECTS.map((e) => (
          <EffectRow key={e.system} effect={e} correct={false} />
        ))}
      </div>
      <p className="rounded border border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-900/10 px-2 py-1.5 text-[10px] text-rose-800 dark:text-rose-300">
        This pattern comes from SOAP and XML-RPC traditions where the transport layer was always 200. In HTTP REST, the status code IS the signal — never bury it in a body field.
      </p>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function StatusCodeSimulator() {
  return (
    <Comparative
      title="Status Code Failure Mode: 200 OK for Errors"
      description="Scenario: the client requests a user that does not exist. See what breaks when you return 200 OK instead of 404."
      left={{
        label: 'Correct — 404 Not Found',
        colour: 'var(--anim-success)',
        render: (options) => <CorrectPanel {...options} />,
      }}
      right={{
        label: 'Anti-pattern — 200 OK + error body',
        colour: 'var(--anim-error)',
        render: (options) => <WrongPanel {...options} />,
      }}
    />
  )
}
