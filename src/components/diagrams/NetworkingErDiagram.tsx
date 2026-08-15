'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `erDiagram
  OSI_LAYER {
    int     layer_number
    string  name
    string  pdu_unit
    string  example_protocols
  }
  NETWORK_DEVICE {
    string  type
    int     operates_at_layer
    string  identifier_used
  }
  PROTOCOL {
    string  name
    int     osi_layer
    string  transport_type
    bool    connection_oriented
  }
  NETWORK_PACKET {
    string  source_ip
    string  dest_ip
    int     source_port
    int     dest_port
    string  payload
  }

  OSI_LAYER ||--o{ PROTOCOL : "hosts"
  OSI_LAYER ||--o{ NETWORK_DEVICE : "operated-by"
  PROTOCOL ||--o{ NETWORK_PACKET : "encapsulates"`

export function NetworkingErDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      fullscreen={false}
      caption="Conceptual entity model for networking fundamentals. Each OSI layer hosts one or more protocols and is operated by specific device types. A network packet is the runtime artefact — it carries source/destination IP and port from the Network (Layer 3) and Transport (Layer 4) layers respectively."
    />
  )
}
