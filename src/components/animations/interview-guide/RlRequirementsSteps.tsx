'use client'

import { StepThrough, type Step } from '../StepThrough'

const STEPS: Step[] = [
  {
    title: 'Functional Requirements — What must the system DO?',
    description:
      'A rate limiter must: (1) Limit the number of requests per client per time window. The client identifier can be a user ID, API key, or IP address. (2) Return HTTP 429 Too Many Requests when the limit is exceeded, with a Retry-After header telling the client when to try again. (3) Support configurable limits per tier — a free-tier user might get 100 requests/hour; a paid user 10,000/hour. (4) Apply limits per endpoint if needed — the /login endpoint might be stricter than /search.',
    colour: 'var(--anim-data)',
  },
  {
    title: 'Non-Functional Requirements — How must the system BEHAVE?',
    description:
      'Latency: the rate-limiting decision must add fewer than 10ms of overhead to every request. This rules out synchronous DB calls — Redis or in-memory with Redis sync is required. Availability: if the rate limiter fails, fail open (allow traffic through) rather than closed (block everything). A rate limiter outage should not cause a service outage. Distributed: limits must be consistent across all server instances — an in-process counter would be reset on every server restart and would not account for traffic on other instances. Accurate: counts must be real-time, not eventually consistent.',
    colour: '#f59e0b',
  },
  {
    title: 'Scale Estimation — Back-of-the-Envelope',
    description:
      '10M registered users. Average: 100 requests/user/day = 1 billion requests/day ÷ 86,400 seconds = ~11,574 requests/second average. Peak factor 10× = ~115,740 RPS peak. Redis storage for counters: 10M active users × 1 counter per user × ~50 bytes per entry = 500 MB — comfortably fits in a single Redis instance. Redis single-node throughput: ~100,000 operations/second, so a clustered Redis with 2-3 nodes covers the peak load with headroom.',
    colour: '#16a34a',
  },
  {
    title: 'Out of Scope — What are we NOT building?',
    description:
      'Explicitly naming out-of-scope items demonstrates clarity and saves time. For this rate limiter: NOT building authentication or authorization (separate concern). NOT building request logging or analytics (separate pipeline). NOT designing the backend services being protected. NOT handling bot detection or CAPTCHA challenges (separate layer). NOT covering DDoS protection at the network layer (that is a CDN/WAF concern). Stating these aloud signals you understand the system boundaries and will not spend 20 minutes designing things the interviewer does not need.',
    colour: '#8b5cf6',
  },
]

export function RlRequirementsSteps() {
  return (
    <StepThrough
      title="Step 1 Applied — Rate Limiter Requirements"
      description="Step through the four components of a complete requirements answer. Each step is what a 10/10 candidate covers before touching any architecture."
      steps={STEPS}
    />
  )
}
