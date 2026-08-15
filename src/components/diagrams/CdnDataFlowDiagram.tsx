'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  Client["Next.js Client\\n(Browser)"]
  CDNEdge["CDN Edge\\n(Cloudflare / Vercel)"]
  Route["Next.js API Route\\n/api/v1/cdn/..."]
  DB[("MongoDB\\nCdnCacheEntry")]

  Client -- "HTTPS GET + If-None-Match: etag" --> CDNEdge
  CDNEdge -- "Cache HIT: 304 / 200 from edge" --> Client
  CDNEdge -- "Cache MISS: proxy to origin" --> Route
  Route -- "Mongoose CdnCacheEntry.findOne()" --> DB
  DB -. "{ cacheKey, staleAt, hitCount... }" .-> Route
  Route -. "200 OK\\nCache-Control: s-maxage=604800, stale-while-revalidate=60" .-> CDNEdge
  CDNEdge -. "Store in edge cache, serve subsequent hits" .-> Client`

export function CdnDataFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Code-level request path. The CDN edge is the first layer — on a cache hit it responds without touching the origin. On a miss it proxies to the Next.js API route, which reads CdnCacheEntry metadata from MongoDB. The Cache-Control response header instructs the edge how long to retain the response (s-maxage) and whether to serve stale while revalidating."
    />
  )
}
