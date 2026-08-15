'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

const CHART = `erDiagram
  ORIGIN_SERVER {
    string server_id PK
    string hostname
    string region
    string content_store_path
  }
  EDGE_NODE {
    string node_id PK
    string pop_id
    string region
    int cache_size_gb
    float hit_rate_pct
  }
  CACHED_OBJECT {
    string cache_key PK
    string origin_url
    string content_type
    int size_bytes
    int ttl_seconds
    string etag
    date stale_at
    bool purge_pending
    int hit_count
    date created_at
  }
  END_USER {
    string client_ip PK
    string client_region
    string nearest_pop_id FK
  }

  ORIGIN_SERVER ||--o{ EDGE_NODE : "serves content to"
  EDGE_NODE ||--o{ CACHED_OBJECT : "caches"
  END_USER }o--|| EDGE_NODE : "routed to by GeoDNS"`

export function CdnErDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="CDN entity model. An ORIGIN_SERVER serves many EDGE_NODEs (one per PoP). Each EDGE_NODE maintains its own cache of CACHED_OBJECTs keyed by URL. GeoDNS routes each END_USER to their nearest EDGE_NODE before the first HTTP byte is sent."
      fullscreen={false}
    />
  )
}
