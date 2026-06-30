'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

// Chart string is defined in TypeScript (not MDX) to avoid MDX's JSX parser
// mis-treating the `{` characters inside erDiagram attribute blocks.
const CHART = `erDiagram
  DOMAIN {
    string name
    string registrar
    date expiresAt
  }
  DNS_RECORD {
    string type
    string name
    string value
    int ttl
  }
  DOMAIN ||--o{ DNS_RECORD : has`

export function DnsErDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="DNS records are the rows of the internet's distributed database — each maps a name to a value with an expiry (TTL). The type field holds A, AAAA, CNAME, MX, TXT, or NS."
    />
  )
}
