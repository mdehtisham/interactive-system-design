'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  Browser["Browser\n(local cache)"]
  OS["OS Cache\n(/etc/hosts)"]
  Resolver["Recursive Resolver\n(8.8.8.8 or ISP)"]
  Root["Root Nameserver\n(13 clusters)"]
  TLD["TLD Nameserver\n(.com registry)"]
  Auth["Authoritative NS\n(Route 53 or Cloudflare)"]
  IP["IP Address\n93.184.216.34"]

  Browser -->|cache miss| OS
  OS -->|cache miss| Resolver
  Resolver -->|cache miss| Root
  Root -->|who handles .com?| TLD
  TLD -->|who handles example.com?| Auth
  Auth -->|A record returned| Resolver
  Resolver -->|cached and returned| Browser
  Browser --> IP`

export function DnsResolutionDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="DNS resolution chain — a cold lookup walks all four servers. A cache hit at any level short-circuits the chain."
    />
  )
}
