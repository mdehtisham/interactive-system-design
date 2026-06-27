# TOPICS.md

Topic registry for the interactive system design platform. Covers the MVP set (14 topics) and the post-MVP backlog. Every topic follows the 7-step methodology defined in CLAUDE.md.

---

## Tagging System

Each topic carries internal tags that power learning paths without restructuring the topic list. Tags are defined here and must be applied consistently when adding new topics.

| Tag | Values | Purpose |
|---|---|---|
| `cluster` | `web-foundations` `storage` `scale` `reliability` | The 4 MVP cluster a topic belongs to |
| `difficulty` | `easy` `medium` `hard` | Difficulty tier (maps to ashishps1 difficulty scale) |
| `interview-frequency` | `high` `medium` `low` | How often this appears in real FAANG system design rounds |
| `path` | `fundamentals-first` `interview-critical` `complexity-ladder` | Which learning paths include this topic |
| `hld-weight` | `primary` `supporting` | Whether the topic is predominantly HLD or leans toward LLD grounding |
| `status` | `mvp` `backlog` | Whether the topic is in the MVP or post-MVP backlog |

### Learning Paths (driven by tags)

| Path ID | Filter logic | Default sort |
|---|---|---|
| `fundamentals-first` | `path includes 'fundamentals-first'` | Cluster order → topic number |
| `interview-critical` | `interviewFrequency === 'high'` | Cluster order → topic number |
| `complexity-ladder` | All topics | `difficulty: easy → medium → hard` |

---

## MVP Topics (14)

### Cluster 1 — Web Foundations

> Start here. No prerequisites. Covers how the internet works before any distributed systems concepts.

---

#### 1. How the Web Works

| Field | Value |
|---|---|
| Slug | `how-the-web-works` |
| Cluster | `web-foundations` |
| Difficulty | `easy` |
| Interview Frequency | `low` |
| Path | `fundamentals-first` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | None |

**Covers:** DNS resolution pipeline (recursive resolver → root → TLD → authoritative), TCP/IP, HTTP request-response cycle, Client-Server model, IP addresses, packets. **DNS as a routing layer:** GeoDNS (routing users to the nearest data center by geography), anycast routing, DNS-based load balancing, TTL implications for failover — not just "DNS is a phonebook."

**LLD angle:** Build a minimal Next.js route that logs and returns request metadata (headers, IP, method, resolved hostname) — making the HTTP cycle tangible.

---

#### 2. APIs & REST

| Field | Value |
|---|---|
| Slug | `apis-and-rest` |
| Cluster | `web-foundations` |
| Difficulty | `easy` |
| Interview Frequency | `medium` |
| Path | `fundamentals-first` `interview-critical` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `how-the-web-works` |

**Covers:** REST principles, HTTP methods, status codes, request/response structure, idempotency, statelessness, API versioning, trade-off table: REST vs GraphQL vs gRPC.

**LLD angle:** Design and implement a RESTful Express API with proper status codes, versioning, and a Mongoose model. ER diagram showing the resource and its relationships.

---

#### 3. Content Delivery Networks (CDN)

| Field | Value |
|---|---|
| Slug | `cdn` |
| Cluster | `web-foundations` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `how-the-web-works` `apis-and-rest` |

**Covers:** Edge nodes, Points of Presence (PoPs), cache-hit vs cache-miss at the edge, pull vs push CDNs, static vs dynamic content delivery, TTL, origin server offloading, CDN as a DDoS mitigation layer.

**LLD angle:** Next.js `Cache-Control` headers and static asset optimization. Mermaid flowchart tracing a request: User → DNS (GeoDNS routes to nearest PoP) → Edge Cache → Origin Server.

---

### Cluster 2 — Storage

> How data is stored, retrieved, replicated, and partitioned at scale. Replication must be understood before CAP Theorem; Sharding builds on both.

---

#### 4. Databases 101

| Field | Value |
|---|---|
| Slug | `databases-101` |
| Cluster | `storage` |
| Difficulty | `easy` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `apis-and-rest` |

**Covers:** SQL vs NoSQL, ACID properties, BASE model, when to choose relational vs document vs key-value vs columnar, normalization vs denormalization basics.

**LLD angle:** Mongoose schema for a real-world entity (e.g., a URL shortener). ER diagram showing collections and relationships. Markdown trade-off table: MongoDB vs PostgreSQL by use case.

---

#### 5. Database Indexing

| Field | Value |
|---|---|
| Slug | `database-indexing` |
| Cluster | `storage` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `supporting` |
| Status | `mvp` |
| Prerequisites | `databases-101` |

**Covers:** B-tree indexes, composite indexes, covered indexes, index selectivity, the read-speed vs write-overhead trade-off, query explain plans.

**LLD angle:** MongoDB index creation on a Mongoose model with a before/after query performance diagram. Show explain plan output in a real Express route.

---

#### 6. Replication Strategies

| Field | Value |
|---|---|
| Slug | `replication-strategies` |
| Cluster | `storage` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `databases-101` |

**Covers:** Why replication exists (durability, read throughput, fault tolerance). Leader-follower (primary-replica) replication, replication lag, synchronous vs asynchronous replication, multi-leader replication, leaderless (Dynamo-style) replication. **This topic is a mandatory prerequisite for CAP Theorem** — replication lag is what creates the consistency/availability tension that CAP describes.

**LLD angle:** MongoDB replica set configuration. Mermaid diagram showing a write to the primary propagating asynchronously to replicas, with a timeline showing the lag window where a read from a replica returns stale data.

---

#### 7. CAP Theorem

| Field | Value |
|---|---|
| Slug | `cap-theorem` |
| Cluster | `storage` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `databases-101` `replication-strategies` |

**Covers:** Consistency, Availability, Partition Tolerance — the theorem grounded in what replication lag actually causes, real-world examples (Cassandra = AP, HBase = CP), PACELC extension, when to prioritize each axis. Trade-off table: CA vs CP vs AP systems by use case.

**LLD angle:** Mermaid diagram showing a network partition scenario — primary and replica separated, reads diverging. A concrete MongoDB read preference example (`primary` vs `secondaryPreferred`) showing the CAP trade-off in code.

---

#### 8. Database Sharding

| Field | Value |
|---|---|
| Slug | `database-sharding` |
| Cluster | `storage` |
| Difficulty | `hard` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `database-indexing` `cap-theorem` `scalability` |

**Covers:** Horizontal partitioning, shard keys, range-based vs hash-based vs directory-based sharding, consistent hashing applied to sharding, the hotspot problem, cross-shard queries, resharding challenges.

**LLD angle:** MongoDB sharded cluster configuration. Mermaid diagram showing a sharded cluster with config servers and mongos router. ER diagram showing how a sharded collection is partitioned across shards.

> **Note:** `scalability` (Cluster 3, Topic 9) is a prerequisite — this topic appears in Cluster 2 but cannot be unlocked until Cluster 3 Topic 9 is completed. Treat as the capstone of the storage cluster.

---

### Cluster 3 — Scale

> How systems grow to handle more users, more data, and more traffic.

---

#### 9. Scalability

| Field | Value |
|---|---|
| Slug | `scalability` |
| Cluster | `scale` |
| Difficulty | `easy` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `databases-101` `apis-and-rest` |

**Covers:** Vertical vs horizontal scaling, stateless vs stateful services, replication for read scale (connects back to Cluster 2), latency vs throughput, back-of-the-envelope estimation introduction (QPS, storage, bandwidth).

**LLD angle:** Stateless Next.js API route design. Mermaid diagram showing a single server evolving to a horizontally scaled fleet behind a load balancer.

---

#### 10. Load Balancing

| Field | Value |
|---|---|
| Slug | `load-balancing` |
| Cluster | `scale` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `scalability` |

**Covers:** Round-robin, least connections, IP hash algorithms, L4 vs L7 load balancers, health checks, sticky sessions and why to avoid them.

**Consistent Hashing — heavy sub-section (visual required):** Consistent hashing is not just a load balancing algorithm — it is a foundational distributed systems concept used in Redis Cluster, DynamoDB partitioning, CDN edge routing, and Database Sharding. This sub-section must include: the hash ring diagram, virtual nodes, how adding/removing a node affects only adjacent keys (vs full rehash in modular hashing). A Framer Motion animation showing a node being added to the ring and only a fraction of keys remapping is required here.

**LLD angle:** Framer Motion animation showing requests distributed across server instances. Mermaid flowchart: Client → Load Balancer → Server Pool → DB.

---

#### 11. Caching

| Field | Value |
|---|---|
| Slug | `caching` |
| Cluster | `scale` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `scalability` `databases-101` |

**Covers:** Cache-aside, write-through, write-back, read-through strategies, TTL, cache invalidation problem, Redis vs Memcached, CDN caching vs application caching vs database query caching.

**LLD angle:** Redis integration with a Next.js API route — cache-aside pattern in Express middleware. ER diagram showing the cache layer sitting between the API and MongoDB.

---

### Cluster 4 — Reliability

> How systems stay up, handle failures, protect themselves, and degrade gracefully.

---

#### 12. Message Queues

| Field | Value |
|---|---|
| Slug | `message-queues` |
| Cluster | `reliability` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `scalability` `databases-101` |

**Covers:** Synchronous vs asynchronous processing, pub/sub pattern, at-least-once vs exactly-once delivery, dead-letter queues, backpressure, Kafka vs RabbitMQ vs SQS trade-offs.

**LLD angle:** A Node.js producer/consumer example with a Mongoose job schema. Framer Motion animation showing queue fill, processing, and drain cycles.

---

#### 13. Rate Limiting & API Gateways

| Field | Value |
|---|---|
| Slug | `rate-limiting-api-gateways` |
| Cluster | `reliability` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `apis-and-rest` `load-balancing` |

**Covers:** Rate limiting algorithms (token bucket, sliding window, fixed window, leaky bucket). API Gateway scoped to **traffic control concerns**: rate limiting enforcement, request throttling, per-client quota management, and where in the stack rate limiting lives (API Gateway vs application layer vs CDN). Full API Gateway features (auth enforcement, service mesh, protocol translation) are covered in the post-MVP backlog.

**LLD angle:** Express middleware implementing token bucket rate limiting with a Redis counter. Mongoose schema for tracking request counts per user/IP. Mermaid diagram: Client → API Gateway (rate limit check) → Application Server.

---

#### 14. Resilience Patterns

| Field | Value |
|---|---|
| Slug | `resilience-patterns` |
| Cluster | `reliability` |
| Difficulty | `medium` |
| Interview Frequency | `high` |
| Path | `fundamentals-first` `interview-critical` `complexity-ladder` |
| HLD Weight | `primary` |
| Status | `mvp` |
| Prerequisites | `message-queues` `load-balancing` `caching` |

**Covers:** Circuit Breaker (open/half-open/closed states), Retry with Exponential Backoff + Jitter, Bulkhead pattern, Timeout patterns, Graceful Degradation, serving stale cache during outages. **Callbacks to prior topics:** async decoupling via Message Queues is itself a resilience pattern; health checks in Load Balancing are circuit breaking at the infrastructure layer; serving stale cache (Caching topic) is graceful degradation in practice.

**LLD angle:** Circuit breaker implementation in a Node.js Express service. Framer Motion animation showing a circuit transitioning from closed → open → half-open states under failure load.

---

## Post-MVP Backlog

Topics to be added progressively after the MVP ships. All follow the same 7-step methodology and tagging system.

### Cluster 1 — Web Foundations (additions)

| Topic | Difficulty | Interview Frequency |
|---|---|---|
| WebSockets & Real-Time Communication | medium | high |
| HTTP/2 vs HTTP/3 | medium | medium |
| DNS Deep Dive (anycast, propagation, GeoDNS advanced) | medium | medium |
| Authentication & Authorization (OAuth2, JWT, sessions) | medium | high |

### Cluster 2 — Storage (additions)

| Topic | Difficulty | Interview Frequency |
|---|---|---|
| Data Modeling Patterns (embedding vs referencing, denormalization) | medium | high |
| Time-Series Databases | hard | medium |
| Search Engines & Inverted Index (Elasticsearch) | hard | high |

### Cluster 3 — Scale (additions)

| Topic | Difficulty | Interview Frequency |
|---|---|---|
| Consistent Hashing (standalone deep dive, post Load Balancing sub-section) | hard | high |
| API Gateway (full: auth, routing, protocol translation, service mesh) | medium | high |
| Service Discovery & Mesh | hard | medium |
| Microservices vs Monolith | medium | high |

### Cluster 4 — Reliability (additions)

| Topic | Difficulty | Interview Frequency |
|---|---|---|
| Distributed Transactions (Saga, 2PC) | hard | high |
| Event Sourcing & CQRS | hard | medium |
| Observability (Logging, Metrics, Distributed Tracing) | medium | high |

### Cluster 5 — Advanced Distributed Systems (new post-MVP cluster)

| Topic | Difficulty | Interview Frequency |
|---|---|---|
| Consensus Algorithms (Raft, Paxos) | hard | medium |
| Distributed Caching (Redis Cluster) | hard | high |
| Distributed Locks | hard | medium |
| Bloom Filters & Probabilistic Data Structures | hard | medium |
