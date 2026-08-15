'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  Req["Incoming Request\\n(API key in header)"]
  Auth["Auth Middleware\\n(validate JWT / API key)"]
  RL["Rate Limiter Middleware\\n(check + increment counter)"]
  Log["Request Logger\\n(structured log entry)"]
  Route["Route Handler\\n(business logic)"]
  Resp200["200 OK\\n+ X-RateLimit-* headers"]
  Resp429["429 Too Many Requests\\n+ Retry-After header"]

  Req --> Auth
  Auth -- "Valid identity" --> RL
  Auth -. "Invalid: 401 Unauthorized" .-> Req
  RL -- "Under limit: allow" --> Log
  RL -. "Over limit: reject" .-> Resp429
  Log --> Route
  Route --> Resp200`

export function RlApiFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Express middleware chain for the rate limiter. Middlewares run in declaration order: auth first (identity must be established before we know which bucket to check), then rate limiting, then logging (no point logging rejected requests in the same way as allowed ones), then the route handler. The dashed lines show early-exit paths — both 401 and 429 terminate the chain without reaching the route handler."
    />
  )
}
