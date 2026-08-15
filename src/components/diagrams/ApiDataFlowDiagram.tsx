'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `flowchart LR
  Client["Browser / Mobile"]
  LB["Load Balancer"]
  Auth["Auth Middleware\\nvalidate JWT"]
  Valid["Validation MW\\ncheck body"]
  Route["Router\\nmatch POST /posts"]
  Ctrl["PostController\\ncreatePost()"]
  DB[("MongoDB\\nposts collection")]

  Client -- "POST /api/v1/posts\\nAuthorization: Bearer JWT" --> LB
  LB --> Auth
  Auth -- "req.user attached" --> Valid
  Valid -- "validated body" --> Route
  Route --> Ctrl
  Ctrl -- "Post.create()" --> DB
  DB -. "201 + saved doc" .-> Client`

export function ApiDataFlowDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="Request flow for POST /api/v1/posts. Solid lines are the request chain; the dashed line is the 201 response returning to the client. Each middleware layer either passes control to the next layer (next()) or short-circuits with an error response — auth failures return 401, validation failures return 422, before the controller runs."
    />
  )
}
