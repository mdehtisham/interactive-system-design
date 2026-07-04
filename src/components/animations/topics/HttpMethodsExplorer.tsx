'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Interactive } from '../Interactive'
import type { ControlDef, ControlValues } from '../Interactive'
import type { AnimationOptions } from '../AnimationShell'

// ─── Data ─────────────────────────────────────────────────────────────────────
// All facts sourced from RFC 9110 (HTTP Semantics, June 2022)

type MethodId = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

interface MethodDef {
  id: MethodId
  safe: boolean
  idempotent: boolean
  hasBody: boolean
  statusCodes: string
  purpose: string
  whenToUse: string
  exampleRequest: string
  exampleResponse: string
  colour: string
}

const METHODS: Record<MethodId, MethodDef> = {
  GET: {
    id: 'GET', safe: true, idempotent: true, hasBody: false,
    statusCodes: '200 OK · 304 Not Modified · 404 Not Found',
    colour: '#3b82f6',
    purpose: 'Retrieve a resource or a list of resources. Never modifies server state.',
    whenToUse: 'Reading data: user profiles, article lists, search results. GET responses are cacheable by default — CDNs and browsers cache them automatically.',
    exampleRequest: `GET /api/v1/posts/507f1f77 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGci...
Accept: application/json`,
    exampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{ "data": { "_id": "507f1f77", "title": "..." } }`,
  },
  POST: {
    id: 'POST', safe: false, idempotent: false, hasBody: true,
    statusCodes: '201 Created · 200 OK · 409 Conflict · 422 Unprocessable',
    colour: '#10b981',
    purpose: 'Create a new resource. Server determines the resource\'s URL (unlike PUT). Each identical POST typically creates a new resource.',
    whenToUse: 'Creating records (new user, new post, new order). Because POST is non-idempotent, sending it twice may create duplicates — use Idempotency-Key headers for financial operations.',
    exampleRequest: `POST /api/v1/posts HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "title": "REST APIs", "body": "..." }`,
    exampleResponse: `HTTP/1.1 201 Created
Location: /api/v1/posts/507f1f77
Content-Type: application/json

{ "data": { "_id": "507f1f77", "title": "REST APIs" } }`,
  },
  PUT: {
    id: 'PUT', safe: false, idempotent: true, hasBody: true,
    statusCodes: '200 OK · 204 No Content · 404 Not Found',
    colour: '#f59e0b',
    purpose: 'Replace a resource entirely. The request body must contain the complete resource. Fields omitted from the body are deleted.',
    whenToUse: 'Full replacements where the client owns the complete state of the resource. Idempotent: sending the same PUT twice leaves the resource in the same state as sending it once.',
    exampleRequest: `PUT /api/v1/posts/507f1f77 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "title": "Updated title",
  "body": "Updated body",
  "status": "published"
}`,
    exampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json

{ "data": { "_id": "507f1f77", "title": "Updated title", "status": "published" } }`,
  },
  PATCH: {
    id: 'PATCH', safe: false, idempotent: false, hasBody: true,
    statusCodes: '200 OK · 204 No Content · 404 Not Found · 422 Unprocessable',
    colour: '#f59e0b',
    purpose: 'Apply a partial update to a resource. Only the fields included in the body are modified — other fields remain unchanged.',
    whenToUse: 'Partial updates: change a user\'s email without touching their password, update a post\'s status without resending the full body. PATCH can be designed to be idempotent (SET field = value) or not (INCREMENT count by 1).',
    exampleRequest: `PATCH /api/v1/posts/507f1f77 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "status": "published" }
// ← only "status" changes; all other fields stay`,
    exampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json

{ "data": { "_id": "507f1f77", "status": "published", "title": "..." } }`,
  },
  DELETE: {
    id: 'DELETE', safe: false, idempotent: true, hasBody: false,
    statusCodes: '204 No Content · 404 Not Found · 200 OK (with body)',
    colour: '#ef4444',
    purpose: 'Remove a resource. Idempotent: deleting a resource that no longer exists should return 404 but not cause an error on the client side — the end state (resource gone) is the same.',
    whenToUse: 'Permanently removing resources. Return 204 with no body on success (nothing left to return). Some APIs return 200 with a confirmation body — valid but less common.',
    exampleRequest: `DELETE /api/v1/posts/507f1f77 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGci...`,
    exampleResponse: `HTTP/1.1 204 No Content
// ← No response body. The resource is gone.
// A subsequent GET /api/v1/posts/507f1f77 → 404 Not Found`,
  },
  HEAD: {
    id: 'HEAD', safe: true, idempotent: true, hasBody: false,
    statusCodes: '200 OK (no body) · 304 Not Modified · 404 Not Found',
    colour: '#6b7280',
    purpose: 'Identical to GET but the server returns headers only — no response body. Used to check if a resource exists or to read its metadata without downloading it.',
    whenToUse: 'Checking if a file exists before downloading (avoid wasting bandwidth). Checking ETag or Last-Modified to decide if a cached copy is stale. Verifying a URL is valid without fetching content.',
    exampleRequest: `HEAD /api/v1/posts/507f1f77 HTTP/1.1
Host: api.example.com
If-None-Match: "abc123etag"`,
    exampleResponse: `HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 842
ETag: "abc123etag"
Last-Modified: Wed, 15 Jan 2025 10:30:00 GMT
// ← No body, despite 200 OK`,
  },
  OPTIONS: {
    id: 'OPTIONS', safe: true, idempotent: true, hasBody: false,
    statusCodes: '200 OK · 204 No Content',
    colour: '#6b7280',
    purpose: 'Describes the communication options for a resource — which HTTP methods are allowed. Used automatically by browsers for CORS preflight checks before cross-origin requests.',
    whenToUse: 'You rarely call OPTIONS manually. Browsers send it automatically before a cross-origin POST or PUT to ask "is this allowed?" If the server does not respond with the right CORS headers, the browser blocks the request.',
    exampleRequest: `OPTIONS /api/v1/posts HTTP/1.1
Host: api.example.com
Origin: https://frontend.example.com
Access-Control-Request-Method: POST`,
    exampleResponse: `HTTP/1.1 204 No Content
Allow: GET, POST, HEAD, OPTIONS
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Max-Age: 86400`,
  },
}

const METHOD_OPTIONS: MethodId[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const CONTROLS: ControlDef[] = [
  {
    type: 'select',
    id: 'method',
    label: 'HTTP Method',
    options: METHOD_OPTIONS.map((m) => ({ value: m, label: m })),
    defaultValue: 'GET',
  },
]

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ yes, label }: { yes: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: yes ? '#16a34a20' : '#dc262620',
        color: yes ? '#16a34a' : '#dc2626',
      }}
    >
      {yes ? '✓' : '✗'} {label}
    </span>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function MethodCanvas({ values }: { values: ControlValues; options: AnimationOptions }) {
  const [tab, setTab] = useState<'request' | 'response'>('request')
  const methodId = (values['method'] ?? 'GET') as MethodId
  const m = METHODS[methodId]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={methodId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3"
      >
        {/* Method badge + properties */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-lg px-3 py-1 font-mono text-base font-bold text-white"
            style={{ backgroundColor: m.colour }}
          >
            {m.id}
          </span>
          <Badge yes={m.safe} label="Safe" />
          <Badge yes={m.idempotent} label="Idempotent" />
          <Badge yes={m.hasBody} label="Request Body" />
        </div>

        {/* Status codes */}
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Typical Status Codes</span>
          <p className="mt-0.5 font-mono text-xs text-foreground">{m.statusCodes}</p>
        </div>

        {/* Purpose + when to use */}
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">What it does:</strong> {m.purpose}</p>
          <p><strong className="text-foreground">When to use:</strong> {m.whenToUse}</p>
        </div>

        {/* Request / Response tabs */}
        <div>
          <div className="mb-1.5 flex gap-1">
            {(['request', 'response'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-md border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors"
                style={{
                  borderColor: tab === t ? m.colour : 'hsl(var(--border))',
                  color: tab === t ? m.colour : undefined,
                  backgroundColor: tab === t ? m.colour + '10' : 'transparent',
                }}
              >
                {t === 'request' ? 'Example Request' : 'Example Response'}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 font-mono text-[10px] leading-relaxed text-foreground">
            {tab === 'request' ? m.exampleRequest : m.exampleResponse}
          </pre>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function HttpMethodsExplorer() {
  return (
    <Interactive
      title="HTTP Methods Explorer"
      description="Select a method to see its properties, when to use it, and a real request/response example. Safe = never modifies state. Idempotent = calling it N times = calling it once."
      controls={CONTROLS}
      render={(values, options) => <MethodCanvas values={values} options={options} />}
    />
  )
}
