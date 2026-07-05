'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  Browser["Browser / App\\n(Client)"]
  LB["Load Balancer\\n(nginx · :80/:443)"]
  Server["Express Server\\n(Node.js · :3000)"]
  DB[("MongoDB\\nAtlas Cluster")]

  Browser -- "HTTPS POST /api/v1/posts\\n+ JSON body + JWT" --> LB
  LB -- "Reverse proxy\\nto server instance" --> Server
  Server -- "Mongoose\\nPost.create()" --> DB
  DB -. "{ _id, title, slug... }" .-> Server
  Server -. "201 Created\\nLocation: /api/v1/posts/:id" .-> Browser`

export function ApiSystemFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Infrastructure-level view of a POST /api/v1/posts request. Solid lines are the outbound request chain; dashed lines are the return path. The load balancer proxies to whichever Express instance is available — the server is stateless, so any instance can handle any request. MongoDB is the single source of truth for all instances."
    />
  )
}
