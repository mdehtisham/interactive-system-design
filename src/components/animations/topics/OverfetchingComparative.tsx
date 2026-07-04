'use client'

import { motion } from 'framer-motion'
import { Comparative } from '../Comparative'
import type { AnimationOptions } from '../AnimationShell'

// ─── Data ─────────────────────────────────────────────────────────────────────
// Scenario: "Render a navbar — I only need name and avatarUrl."

interface Field {
  key: string
  value: string
  bytes: number
  needed: boolean
}

const ALL_FIELDS: Field[] = [
  { key: 'id',             value: '"64a7e2f1c3d4e5f6a7b8c9d0"', bytes: 36, needed: false },
  { key: 'name',           value: '"Sarah Connor"',              bytes: 15, needed: true  },
  { key: 'avatarUrl',      value: '"https://cdn.../avatar.jpg"', bytes: 42, needed: true  },
  { key: 'email',          value: '"s.connor@skynet.io"',        bytes: 22, needed: false },
  { key: 'bio',            value: '"Resistance fighter..."',     bytes: 28, needed: false },
  { key: 'location',       value: '"Los Angeles, CA"',           bytes: 18, needed: false },
  { key: 'website',        value: '"https://resistance.org"',    bytes: 26, needed: false },
  { key: 'joinDate',       value: '"1984-05-12T00:00:00.000Z"', bytes: 26, needed: false },
  { key: 'followersCount', value: '1284',                         bytes: 4,  needed: false },
  { key: 'followingCount', value: '47',                           bytes: 2,  needed: false },
  { key: 'postsCount',     value: '312',                          bytes: 3,  needed: false },
  { key: 'role',           value: '"user"',                       bytes: 6,  needed: false },
]

const TOTAL_BYTES = ALL_FIELDS.reduce((s, f) => s + f.bytes + f.key.length + 8, 0) // ~420B with JSON overhead
const NEEDED_BYTES = ALL_FIELDS.filter((f) => f.needed).reduce((s, f) => s + f.bytes + f.key.length + 8, 0) // ~80B

// ─── REST Panel ───────────────────────────────────────────────────────────────

function RestPanel(_options: AnimationOptions) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
          GET /api/v1/users/123
        </p>
        <p className="text-[10px] text-muted-foreground">
          Returns the entire user object — always.
        </p>
      </div>

      {/* Field list */}
      <div className="rounded-lg border border-border bg-muted/40 p-2 font-mono text-[10px] space-y-0.5">
        <div className="text-muted-foreground">{`{`}</div>
        {ALL_FIELDS.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5 pl-2">
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: f.needed ? '#16a34a' : '#f59e0b' }}
            />
            <span className={f.needed ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-amber-700 dark:text-amber-400'}>
              &quot;{f.key}&quot;: {f.value},
            </span>
          </div>
        ))}
        <div className="text-muted-foreground">{`}`}</div>
      </div>

      {/* Payload bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Payload</span>
          <span className="font-mono font-semibold text-foreground">~{TOTAL_BYTES}B</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber-400" style={{ width: '100%' }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px]">
          <span className="text-emerald-600 dark:text-emerald-400">● needed: {NEEDED_BYTES}B</span>
          <span className="text-amber-600 dark:text-amber-400">● wasted: {TOTAL_BYTES - NEEDED_BYTES}B ({Math.round((1 - NEEDED_BYTES / TOTAL_BYTES) * 100)}%)</span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Overfetching:</strong> the client needed 2 fields for the navbar, but the API always returns all 12. The extra 10 fields are parsed, allocated in memory, and discarded — wasting bandwidth and CPU, especially on mobile.
      </p>
    </div>
  )
}

// ─── GraphQL Panel ────────────────────────────────────────────────────────────

function GraphQLPanel(_options: AnimationOptions) {
  const neededFields = ALL_FIELDS.filter((f) => f.needed)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 font-mono text-[10px] text-purple-600 dark:text-purple-400">
          POST /graphql
        </p>
        <p className="text-[10px] text-muted-foreground">
          Client declares exactly the fields it needs.
        </p>
      </div>

      {/* GraphQL query */}
      <div className="rounded-lg border border-border bg-muted/40 p-2 font-mono text-[10px]">
        <div className="text-purple-600 dark:text-purple-400">query GetNavbarUser {'{'}  </div>
        <div className="pl-2 text-purple-600 dark:text-purple-400">  user(id: &quot;123&quot;) {'{'}</div>
        {neededFields.map((f) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="pl-4 text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            {f.key}
          </motion.div>
        ))}
        <div className="pl-2 text-purple-600 dark:text-purple-400">  {'}'}</div>
        <div className="text-purple-600 dark:text-purple-400">{'}'}</div>
      </div>

      {/* Response */}
      <div className="rounded-lg border border-border bg-muted/40 p-2 font-mono text-[10px] space-y-0.5">
        <div className="text-muted-foreground">{`{`}</div>
        {neededFields.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5 pl-2">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              &quot;{f.key}&quot;: {f.value},
            </span>
          </div>
        ))}
        <div className="text-muted-foreground">{`}`}</div>
      </div>

      {/* Payload bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Payload</span>
          <span className="font-mono font-semibold text-foreground">~{NEEDED_BYTES}B</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: '100%' }}
            animate={{ width: `${Math.round((NEEDED_BYTES / TOTAL_BYTES) * 100)}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
        <div className="mt-1 text-[10px]">
          <span className="text-emerald-600 dark:text-emerald-400">● all data used: {NEEDED_BYTES}B (0% waste)</span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        <strong className="text-foreground">No overfetching:</strong> the GraphQL server resolves only the requested fields, the response contains only those fields, and the client parses only those fields. Payload is {Math.round((1 - NEEDED_BYTES / TOTAL_BYTES) * 100)}% smaller.
      </p>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function OverfetchingComparative() {
  return (
    <Comparative
      title="Overfetching: REST vs GraphQL"
      description="Scenario: render a navbar that needs only name and avatarUrl. See how much data each protocol transfers."
      left={{
        label: 'REST — always returns full resource',
        colour: '#f59e0b',
        render: (options) => <RestPanel {...options} />,
      }}
      right={{
        label: 'GraphQL — client requests exact fields',
        colour: '#8b5cf6',
        render: (options) => <GraphQLPanel {...options} />,
      }}
    />
  )
}
