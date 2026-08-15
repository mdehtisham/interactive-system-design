'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart TD
  App["Node.js: fetch('https://api.example.com/data')\\nApplication Layer 7 — HTTP request constructed"]
  DNS["DNS Resolution\\n8.8.8.8 resolver: api.example.com → 93.184.216.34\\nLayer 7 (DNS over UDP/53)"]
  TCP["TCP 3-Way Handshake\\nSYN → SYN-ACK → ACK  (+1.5 RTT)\\nLayer 4 — connection established"]
  TLS["TLS 1.3 Handshake\\nClientHello → ServerHello → Certificate → Finished\\nLayer 6 — encrypted channel open"]
  HTTP["HTTP/2 Request\\nGET /data  Host: api.example.com  Headers...\\nLayer 7 — multiplexed stream"]
  Server["Server processes request\\nController → Service → MongoDB query\\nLayer 7"]
  Response["HTTP/2 Response\\n200 OK  Content-Type: application/json\\nCache-Control: public, s-maxage=3600"]
  Client["Node.js receives response\\nJSON.parse(body) — application data"]

  App --> DNS
  DNS --> TCP
  TCP --> TLS
  TLS --> HTTP
  HTTP --> Server
  Server --> Response
  Response --> Client

  style DNS fill:#fef3c7,stroke:#d97706,color:#92400e
  style TCP fill:#d1fae5,stroke:#059669,color:#064e3b
  style TLS fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  style HTTP fill:#dbeafe,stroke:#2563eb,color:#1e3a8a`

export function NetworkingDataFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Code-level request flow for a Node.js fetch() call to an HTTPS API. Each coloured step corresponds to an OSI layer: amber = DNS (Layer 7), green = TCP handshake (Layer 4), purple = TLS (Layer 6), blue = HTTP (Layer 7). The total overhead before the first byte of application data: DNS lookup (~20ms) + TCP handshake (~70ms at cross-continent RTT) + TLS 1.3 handshake (~70ms, 1 RTT) = ~160ms of pure connection overhead. HTTP/2 keep-alive and TLS session resumption eliminate most of this on subsequent requests."
    />
  )
}
