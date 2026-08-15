'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `erDiagram
  CLIENT {
    string client_id PK
    string api_key
    string tier
    string ip_address
  }
  RATE_LIMIT_RULE {
    string rule_id PK
    string tier FK
    string endpoint_pattern
    int request_limit
    int window_seconds
    bool enabled
  }
  RATE_COUNTER {
    string counter_id PK
    string client_id FK
    string rule_id FK
    int count
    date window_start
    date expires_at
  }

  CLIENT ||--o{ RATE_COUNTER : "has counters for"
  RATE_LIMIT_RULE ||--o{ RATE_COUNTER : "governs"`

export function RlErDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Rate limiter entity model. Each CLIENT has RATE_COUNTERs — one per active RATE_LIMIT_RULE that applies to it. The counter tracks the request count within the current window. When the window expires, the counter entry is deleted (Redis TTL handles this automatically). In production, RATE_COUNTERs live in Redis, not MongoDB — they are ephemeral state, not business data."
      fullscreen={false}
    />
  )
}
