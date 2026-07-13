'use client'

import { PassiveFlow } from '../PassiveFlow'

const CDN_NODES = [
  {
    id: 'browser',
    label: 'User\nBrowser',
    tooltip:
      'The browser first checks its own DNS cache. On a miss it sends a DNS query — GeoDNS returns the IP of the nearest CDN edge PoP, not the origin server.',
  },
  {
    id: 'geodns',
    label: 'GeoDNS',
    tooltip:
      'GeoDNS inspects the source IP of the DNS query and returns the IP address of the CDN PoP that is geographically closest. This routing decision happens before any HTTP byte is sent.',
  },
  {
    id: 'edge-pop',
    label: 'CDN Edge\nPoP (London)',
    tooltip:
      'The edge server is physically located in the user\'s city. It holds a local cache of previously requested content. A cache lookup takes microseconds — far faster than a cross-continent origin round trip.',
  },
  {
    id: 'cache-check',
    label: 'Cache\nLookup',
    tooltip:
      'The edge checks its in-memory and on-disk cache using the URL as the cache key. If the entry exists and has not passed its TTL, this is a cache hit. Hit rate for popular static content typically exceeds 90%.',
  },
  {
    id: 'cache-hit',
    label: 'Cache HIT\n✓ Green',
    tooltip:
      'The cached response is returned directly from the edge — no origin contact needed. Typical latency: 5–20ms from the user\'s city. Compare this to 150–300ms for a cross-continent origin round trip.',
  },
  {
    id: 'response',
    label: 'Response\nto User',
    tooltip:
      'The browser receives the response from the nearby edge server. The ETag and Cache-Control headers in the response let the browser cache the asset locally for subsequent page loads.',
  },
]

export function CdnRequestFlow() {
  return (
    <PassiveFlow
      title="CDN Request Flow — Cache Hit Path"
      description="A user request travelling from browser to the nearest edge PoP. Green path = cache hit — the edge responds without contacting the origin. Hover or tap any node to see its role."
      nodes={CDN_NODES}
      stepDurationMs={1400}
      completionMessage="Cache hit: ~5–20ms edge latency vs ~150–300ms origin round trip."
    />
  )
}
