'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  URL["User types URL"]
  DNS["DNS Resolution\n~300ms cold"]
  TCP["TCP Handshake\n1 RTT"]
  TLS["TLS 1.3 Handshake\n1 RTT"]
  REQ["HTTP GET Request"]
  SRV["Web Server\nprocesses request"]
  RES["HTTP 200 Response\nplus HTML body"]
  RENDER["Browser renders\nDOM to Paint"]

  URL --> DNS
  DNS --> TCP
  TCP --> TLS
  TLS --> REQ
  REQ --> SRV
  SRV --> RES
  RES --> RENDER`

export function WebRequestLifecycle() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="The complete path from URL to rendered page. Each arrow is a network hop; each box is a phase that adds latency."
    />
  )
}
