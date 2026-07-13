'use client'

import { PassiveFlow } from '../PassiveFlow'

const RL_NODES = [
  {
    id: 'client',
    label: 'Client\nRequest',
    tooltip:
      'The client sends an HTTP request. The identifier extracted from this request — API key, user ID from JWT, or source IP — becomes the key for the rate limit counter lookup.',
  },
  {
    id: 'gateway',
    label: 'API\nGateway',
    tooltip:
      'The API gateway receives the request first. In most architectures, rate limiting runs as middleware here — before the request reaches any application server. This means even rejected requests consume no backend compute.',
  },
  {
    id: 'middleware',
    label: 'Rate Limiter\nMiddleware',
    tooltip:
      'The rate limiter middleware extracts the client identifier, looks up the applicable rule (by tier or endpoint), and queries Redis for the current counter value.',
  },
  {
    id: 'redis',
    label: 'Redis\nCounter',
    tooltip:
      'Redis stores the counter as a key: rate:{client_id}:{window_key}. The INCR command atomically increments the counter and returns the new value in a single operation — avoiding the read-then-write race condition of GET + SET.',
  },
  {
    id: 'decision',
    label: 'Decision\n(Allow / Deny)',
    tooltip:
      'If the returned counter value is ≤ the limit: the request is allowed forward. The middleware adds X-RateLimit-Remaining and X-RateLimit-Reset headers to inform the client of its remaining quota. If the counter exceeds the limit: a 429 Too Many Requests response is returned immediately, with a Retry-After header.',
  },
  {
    id: 'backend',
    label: 'Backend\nService',
    tooltip:
      'Only allowed requests reach the backend. The backend never sees rejected requests — it is shielded from burst traffic. This is why rate limiting at the gateway layer is far more cost-effective than at the application layer.',
  },
  {
    id: 'response',
    label: '200 OK\n+ Headers',
    tooltip:
      'The response includes rate limit headers so the client can self-throttle before hitting the limit: X-RateLimit-Limit: 1000, X-RateLimit-Remaining: 847, X-RateLimit-Reset: 1719436800 (Unix timestamp when the window resets).',
  },
]

export function RlTokenBucketFlow() {
  return (
    <PassiveFlow
      title="Step 4 Applied — Rate Limiter Data Flow (Allow Path)"
      description="A single request flowing through the token bucket rate limiter. Hover or tap any node to see what it does and why it is placed where it is."
      nodes={RL_NODES}
      stepDurationMs={1200}
      completionMessage="Full flow: ~2–5ms overhead at the gateway layer. The backend sees only allowed requests."
    />
  )
}
