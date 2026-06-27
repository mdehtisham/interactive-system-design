# REFERENCES.md

Curated, verified learning resources for this project. All entries were adversarially fact-checked (multi-source verification) as of mid-2025. Resources are free or open-source unless noted.

---

## HLD — High-Level Design

### GitHub Repositories

| Repository | Stars | What It Covers |
|---|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 355k+ | The canonical starting point. Scalability, CAP theorem, caching, load balancing, DB sharding, DNS, CDNs. Includes Anki flashcards. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 83.8k | Visual-first explanations of complex distributed systems using diagrams and simple terms. Strong complement to the Primer. |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | Actively maintained | Difficulty-tiered HLD interview problems (Easy / Medium / Hard). Curates real engineering articles from Discord, Netflix, Canva, Airbnb, Stripe. |
| [checkcheckzz/system-design-interview](https://github.com/checkcheckzz/system-design-interview) | Widely referenced | Aggregates 47 company engineering blogs. Primary value: pre-onsite reading list. Advice: *"If you are going to have an onsite with a company, read their engineering blog."* |

> **Note on system-design-primer:** Its OOP/LLD section contains only 6 solutions and is marked *"This section is under development."* Do not rely on it for LLD coverage — use the LLD resources below instead.

---

### FAANG & Big Tech Engineering Blogs

These are primary sources — real production decisions, real scale, real trade-offs. Use them to source topic examples and real-world case studies for the platform.

| Blog | URL | Best For |
|---|---|---|
| Meta Engineering | [engineering.fb.com](https://engineering.fb.com) | Data infrastructure at scale, recommendation systems, distributed storage |
| Google SRE Classroom | [sre.google/classroom](https://sre.google/classroom/) | NALSD (Non-Abstract Large System Design) hands-on workshops. Free, CC-BY-4.0. Bridges theory → practice. |
| Google SRE Workbook | [sre.google/workbook/non-abstract-design](https://sre.google/workbook/non-abstract-design/) | NALSD methodology: feasibility, resilience, efficiency, real-world resource constraints |
| AWS Architecture Blog | [aws.amazon.com/blogs/architecture](https://aws.amazon.com/blogs/architecture/) | Tiered content: Foundational (100) → Intermediate (200) → Advanced (300) |
| Uber Engineering | [eng.uber.com](https://eng.uber.com) | Geospatial systems, distributed workflows, logging at scale |
| Netflix Tech Blog | [netflixtechblog.com](https://netflixtechblog.com) | Streaming infrastructure, ML at scale, resilience patterns |
| LinkedIn Engineering | [engineering.linkedin.com](https://engineering.linkedin.com) | Feed systems, graph databases, large-scale data pipelines |

> **Google SRE Classroom is a standout resource.** The Distributed ImageServer Workshop is directly applicable to this platform — it teaches sharding, replication, latency, and load balancing in a hands-on format that mirrors our HLD → LLD methodology.

---

## LLD — Low-Level Design

### GitHub Repositories

| Repository | Stars | What It Covers |
|---|---|---|
| [ashishps1/awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design) | Actively maintained | The primary LLD interview prep resource. OOP fundamentals, SOLID principles, design patterns, concurrency. Difficulty-tiered problems (Easy 7 / Medium 15 / Hard 11). Includes *"How to Answer a LLD Interview Problem"* guide. |

### Design Pattern Reference

| Resource | URL | Notes |
|---|---|---|
| Refactoring.Guru | [refactoring.guru/design-patterns](https://refactoring.guru/design-patterns) | Catalog of 22 classic patterns: 5 Creational, 7 Structural, 10 Behavioral. Pattern descriptions and UML diagrams are free. TypeScript examples are available and relevant for this stack. |

---

## MERN / MEAN Stack — System Design

| Resource | URL | What It Covers |
|---|---|---|
| MongoDB Schema Design Patterns | [mongodb.com/docs/manual/data-modeling/design-patterns](https://www.mongodb.com/docs/manual/data-modeling/design-patterns/) | Official patterns: Computed Values, Group Data, Polymorphic Data, Versioning, Archive, Single Collection |
| MongoDB Free Skill Badge | [learn.mongodb.com/skills](https://learn.mongodb.com/skills) | *Schema Design Patterns & Antipatterns* — free, intermediate-level, ~60 minutes. Earn a verifiable credential. |
| goldbergyoni/nodebestpractices | [github.com/goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) | 100k+ stars. Node.js production architecture best practices — structure, error handling, security, performance. |

---

## How to Use These Resources

**For topic selection:** Start with `ashishps1/awesome-system-design-resources` (HLD) and `ashishps1/awesome-low-level-design` (LLD). The difficulty tiers map directly to the platform's Easy → Medium → Hard topic progression.

**For real-world examples:** Pull case studies from the FAANG blogs — each topic on this platform should reference at least one real production system by name (e.g., Discord's message storage for sharding, Netflix's CDN for caching).

**For MongoDB schema topics:** The MongoDB Docs design patterns page is the canonical LLD reference for the data modeling sections of this platform.

**For the LLD → HLD bridge:** Google's NALSD methodology (SRE Classroom + Workbook) is the closest publicly available framework that mirrors this platform's core differentiator — every HLD concept grounded in real implementation constraints.

---

## Excluded / Refuted

The following were surfaced during research but **failed adversarial verification** and are excluded:

- `karanpratapsingh/system-design` — star count and maintenance status could not be confirmed (0-3 vote)
- `prasadgujar/low-level-design-primer` — last updated January 2024, maintenance status unconfirmed (0-3 vote)
- Claims that `checkcheckzz/system-design-interview` covers LLD — refuted; it is HLD + blog aggregation only
