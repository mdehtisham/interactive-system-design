'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart TD
  Client["Client\\n(Browser / Mobile / Server)"]
  LB["Load Balancer\\n(nginx · Layer 4/7)"]
  GW["API Gateway\\n(Rate Limiter Middleware)"]
  Redis["Redis Cluster\\n(Rate Counters · TTL-keyed)"]
  RuleDB["Rules Store\\n(MongoDB — rate limit rules)"]
  SvcA["Service A\\n(Posts API)"]
  SvcB["Service B\\n(Search API)"]
  SvcC["Service C\\n(Auth API)"]
  AppDB[("Application DB\\n(MongoDB)")]

  Client -- "HTTPS Request\\n+ API key header" --> LB
  LB -- "Proxy to gateway" --> GW
  GW -- "INCR rate:{client_id}:{window}\\n(atomic, with TTL)" --> Redis
  GW -- "Load rules on startup\\ncache in memory" --> RuleDB
  Redis -. "Counter value" .-> GW
  GW -- "Allowed: forward request" --> SvcA
  GW -- "Allowed: forward request" --> SvcB
  GW -- "Allowed: forward request" --> SvcC
  GW -. "Rejected: 429 + Retry-After\\n(never reaches services)" .-> Client
  SvcA & SvcB & SvcC -- "Read / write" --> AppDB
  SvcA & SvcB & SvcC -. "200 OK + rate headers" .-> Client`

export function RlSystemDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Rate limiter high-level design. The API Gateway is the single enforcement point — all traffic passes through it. Redis holds the rate counters (ephemeral, TTL-keyed). MongoDB holds the rate limit rules (durable, admin-configurable). Rejected requests never reach backend services. Rules are cached in gateway memory to avoid a Redis round trip per request — they are refreshed periodically."
    />
  )
}
