'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  User["End User\\nBrowser / App"]
  ISP["ISP Router\\nLayer 3 — routes by IP"]
  CDN["CDN PoP\\nAnycast — nearest PoP wins"]
  LB["Load Balancer\\nL4 or L7"]
  API["API Server\\nHTTP application"]
  DB["Database\\nPersistence layer"]

  User -->|"HTTPS request\\n(encrypted, port 443)"| ISP
  ISP -->|"BGP routes to\\nnearest anycast IP"| CDN
  CDN -->|"Cache HIT:\\nrespond immediately"| User
  CDN -->|"Cache MISS:\\nforward to origin"| LB
  LB -->|"L7: routes by\\npath / header"| API
  API -->|"Query"| DB
  DB -->|"Result"| API
  API -->|"HTTP 200 + Cache-Control"| LB
  LB -->|"Response"| CDN
  CDN -->|"Caches + responds\\nto user"| User`

export function NetworkingSystemFlow() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Infrastructure-level request flow showing which OSI layers each component operates at. BGP routing (Layer 3) directs the user to the nearest CDN PoP. The CDN terminates TLS (Layer 6) and serves from cache on a hit. On a miss, the load balancer routes at Layer 7 (reading HTTP path/headers). The API server operates purely at Layer 7 — it never sees IP addresses or TCP segment numbers directly."
    />
  )
}
