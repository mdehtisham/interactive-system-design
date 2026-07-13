'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart TD
  User["End User\\n(Browser)"]
  GeoDNS["GeoDNS\\n(Route 53 / Cloudflare DNS)"]
  PoP["CDN Edge PoP\\n(nearest city — e.g. London)"]
  Shield["Origin Shield\\n(regional tier-2 — e.g. EU-West)"]
  Origin["Origin Server\\n(AWS us-east-1)"]

  User -- "1. DNS query for cdn.example.com" --> GeoDNS
  GeoDNS -- "2. Returns nearest PoP IP\\n(anycast or GeoDNS)" --> User
  User -- "3. HTTPS GET /asset.jpg" --> PoP
  PoP -- "4a. Cache HIT → 200 OK\\n(sub-20ms)" --> User
  PoP -- "4b. Cache MISS → forward request" --> Shield
  Shield -- "5a. Shield HIT → 200 OK" --> PoP
  Shield -- "5b. Shield MISS → fetch from origin" --> Origin
  Origin -- "6. 200 OK\\n+ Cache-Control: s-maxage=86400" --> Shield
  Shield -- "7. Cache + forward to edge" --> PoP
  PoP -- "8. Cache + respond to user" --> User`

export function CdnSystemFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Infrastructure-level CDN request flow. Path 4a is the happy path — a cache hit at the nearest edge PoP adds only 5–20ms. Path 4b→5b→8 is a full cache miss: two serial hops (user→edge→shield→origin) before the response flows back. The origin shield prevents a thundering herd: all edge misses consolidate into a single origin request at the shield layer."
    />
  )
}
