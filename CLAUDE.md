# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Policy

**Never commit code yourself.** Always provide the commit title and message and let the user commit manually.

---

## Known Issues — Never Repeat

All confirmed bugs and their fixes are tracked in `issues_and_fixes.md` at the
project root. Every rule below was learned the hard way — violating them will
reproduce the exact same bugs in new components.

### Colors

- **Never** use `bg-accent` or `hover:bg-accent` for interactive states —
  `--accent` resolves to near-white in the default shadcn neutral light theme
  and produces invisible feedback. Use explicit Tailwind palette classes instead:
  `bg-blue-50 text-blue-700` (active), `hover:bg-gray-50` (hover).
- Badge/tag styles must follow `bg-*-100 text-*-900` (light) /
  `bg-*-500/10 text-*-400` (dark). Never use ring-based badges.
- Always add `prose-p:text-foreground prose-li:text-foreground prose-td:text-foreground`
  to every `<article>` that renders MDX prose — the v4 typography plugin does
  not inherit `--foreground` automatically.

### Mermaid Diagrams

- **Never** set `containerRef.current.innerHTML = svg` directly when React
  manages children of that node. This causes a `removeChild` NotFoundError.
  Always use `dangerouslySetInnerHTML` on a dedicated node that is in an
  exclusive conditional branch (not a sibling of a React-managed loading state).
- **Never** pass Mermaid chart strings as inline props in MDX files when the
  string contains `{` or `}`. MDX's JSX parser treats `{` as a JS expression
  boundary, delivering `undefined` as the prop. Always put chart strings in a
  TypeScript wrapper component as a module-level `const`.

### Tooltips and Popovers

- **Never** use `position: absolute` + `z-index` alone for tooltips inside a
  scroll container or an element with `overflow: hidden/auto`. The ancestor's
  overflow clips the tooltip regardless of z-index.
- Any tooltip that must appear above a scroll container **must** use a React
  portal (`createPortal(..., document.body)`) with `position: fixed` coordinates
  derived from `getBoundingClientRect()` — this escapes all ancestor overflow
  constraints. See `PassiveFlow.tsx` for the reference implementation.

---

## Project Purpose

An open-source, interactive system design learning platform that teaches FAANG-tier distributed systems concepts visually — through live code, production-grade schemas, Mermaid.js diagrams, Framer Motion animations, and interview prep. Built with Next.js, Node.js, Express.js, and MongoDB.

**Primary user:** A Primary user is Fronend/backend developer having 3-5 years of experience transitioning to Full Stack (MERN/MEAN) and targeting FAANG-level roles. Explanations should bridge backend/distributed systems concepts to frontend mental models where possible.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Framer Motion, Tailwind CSS |
| Backend | Node.js, Express.js (API routes or standalone server) |
| Database | MongoDB (Mongoose ODM) |
| Diagrams | Mermaid.js |
| Auth (planned) | NextAuth.js |

---

## Commands

> Commands will be added here as the project is scaffolded. Update this section when `package.json` scripts are defined.

```bash
# Expected conventions — update once confirmed
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Jest / Vitest test runner
npm run test -- --testPathPattern=<file>  # Run a single test file
```

---

## Architecture & Code Structure

> The project is in early setup. This section describes the intended architecture to guide initial scaffolding.

### Planned Directory Layout

```
/app                      # Next.js App Router pages and layouts
  /api                    # API route handlers (Express or Next.js routes)
/components               # Shared UI components
  /diagrams               # Mermaid.js diagram wrappers
  /animations             # Framer Motion animation components
/lib                      # Shared utilities, DB connection, helpers
/models                   # Mongoose schemas
/controllers              # Express route controllers (if using standalone server)
/public                   # Static assets
```

### Key Architectural Decisions

- **Next.js App Router** is the rendering layer. API routes under `/app/api` are preferred for simple endpoints; a standalone Express server is used when advanced middleware (rate limiting, WebSocket, complex auth) is needed.
- **MongoDB via Mongoose** for all persistence. Each system design topic (e.g., caching, sharding) has its own model demonstrating realistic schemas.
- **Mermaid.js** renders data-flow diagrams client-side; diagrams are defined as plain strings in component props, not in static files.
- **Framer Motion** is used exclusively for educational animations (e.g., visualizing queue processing, replication lag, cache hit/miss) — not general UI polish.

---

## Responsive Design & Mobile-First

The platform is **mobile-first**. Every page, component, animation, and layout must be designed for the smallest screen first, then scaled up. Desktop is an enhancement, not the baseline.

### Breakpoint targets

| Device class | Min width | Examples |
|---|---|---|
| Mobile S | 320px | iPhone SE, Galaxy A series |
| Mobile L | 390px | iPhone 14/15, Pixel 7 |
| Tablet | 768px | iPad Mini, Galaxy Tab |
| Laptop | 1024px | MacBook Air, Surface Pro |
| Desktop | 1280px+ | External monitors |

Use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) with **mobile as the default** — no prefix = mobile. Never write desktop-first styles and override downward.

### Layout rules

- Single-column layout on mobile; multi-column only at `md:` and above
- Sidebar navigation collapses to a bottom tab bar or hamburger drawer on mobile
- No horizontal overflow on any screen — code blocks and wide tables must be horizontally scrollable within a contained wrapper (`overflow-x-auto`), not the whole page
- Minimum tap target size: **44×44px** for all interactive elements (buttons, links, animation controls)
- Font size minimum: **16px** body text on mobile to prevent browser zoom on input focus

### Animation & diagram rules on mobile

- All Framer Motion animations must use touch events alongside mouse events — `onTap` not `onClick`-only for interactive elements
- Interactive animation controls (sliders, buttons, reset) must be thumb-reachable — place at the bottom of the animation panel, not the top
- Mermaid diagrams that are wider than the viewport must be wrapped in a horizontally scrollable container with a visible scroll affordance
- Animation canvas must never cause layout shift — use fixed-height containers with `overflow: hidden` and scale content within

### Testing requirement

Before a topic is marked complete, verify it renders correctly on:
- A 390px viewport (mobile)
- A 768px viewport (tablet)
- A 1280px viewport (desktop)

Browser DevTools device emulation is acceptable for development; real device testing is preferred before marking MVP complete.

---

## Design Scope: HLD + LLD

This platform covers **both** High-Level Design and Low-Level Design — in a fixed sequence, at different depths per topic.

**HLD is the primary focus:**
- Distributed systems concepts (caching, sharding, load balancing, rate limiting, CAP theorem)
- System-level Mermaid flowcharts (`Client → CDN → Load Balancer → Microservice → DB`)
- Trade-off tables, back-of-the-envelope estimations (QPS, storage, bandwidth)
- FAANG-style interview answers — the system design interview round tests almost exclusively at HLD level

**LLD follows immediately, grounded in the HLD:**
- The actual Next.js/Node/Express code implementing the concept
- Mongoose schemas with ER diagrams (field-level structure and relationships)
- API controller design and data flow through specific functions

**The platform's differentiator:** most system design resources stop at HLD (boxes and arrows). Here, every HLD concept is immediately followed by working LLD — real schemas, real endpoints, real animations — so learners understand not just what the architecture looks like, but how to build it.

**FAANG interview mapping:**
| Interview Round | Design Type | What This Platform Covers |
|---|---|---|
| System Design Round | HLD | Distributed concepts, trade-offs, estimations |
| Coding / Design Round | LLD | Schemas, controllers, API design, data flow |

---

## Learning Methodology (Core Contract)

Every system design topic added to this platform **must** follow this structure. This is non-negotiable for consistency across contributors:

### Assumptions & Starting Point

- **Always assume zero prior system design knowledge.** Every topic starts from first principles: what is it, why does it exist, what problem does it solve — before any code or architecture.
- **The 10-year-old standard:** Before writing any technical explanation, ask — *could a curious 10-year-old follow this sentence?* If not, rewrite it. This does not mean dumbing down — it means stripping jargon, leading with analogy, and building up to the technical term rather than opening with it. The analogy must come first; the technical name second.
- Use real-world analogies before technical definitions (e.g., explain a load balancer as a traffic cop before drawing the architecture diagram; explain a message queue as a restaurant order ticket rail before mentioning pub/sub).
- Never reference another system design concept without either explaining it inline or linking to its dedicated topic page.
- Every section, every diagram label, every animation tooltip must pass the 10-year-old standard — not just the ELI5 opening.

### Prerequisites Block (required for every topic)

Before any explanation begins, declare prerequisites explicitly:

```
## Prerequisites
- [Concept A](/topics/concept-a) — one sentence on why it's needed here
- [Concept B](/topics/concept-b) — one sentence on why it's needed here
- None — if the topic is foundational (e.g., What is a Database?)
```

If a user lands on a topic they aren't ready for, the prerequisites block is their navigation path back.

### Topic Structure (in order)

1. **ELI5 Foundation** — explain the concept as if explaining to a curious 10-year-old who has never heard of it. Lead with a real-world analogy that is relatable (food, traffic, toys, school) before introducing any technical term. Keep it under 5 sentences. This section exists even for the most advanced topics — if you cannot explain Database Sharding simply, the explanation is not ready. The technical term is introduced at the *end* of the analogy, not the beginning.

2. **FAANG Concept Deep-Dive** — explain the concept in the context of large-scale distributed systems (e.g., how Netflix uses caching, how Google handles sharding). Reference real systems by name.

3. **Next.js Implementation** — working code demonstrating the pattern in this app (API route, server component, or client component as appropriate).

4. **Database & API Schema** — Mongoose model + Express/Next.js controller endpoints, plus:
   - **Mermaid ER diagram** showing all collections/tables involved, their fields, and the relationships between them (foreign keys, embedded docs, references). Example:
     ```
     erDiagram
       USER ||--o{ SESSION : has
       SESSION ||--|{ REQUEST : logs
       USER { string id, string email }
       SESSION { string id, string userId, date createdAt }
     ```
   - **Data flow diagram** — a separate Mermaid flowchart tracing exactly how a request reads/writes through these schemas step by step (e.g., `API Route → check cache → query DB → write result to cache → return response`).

5. **Visual Aids & Animations (maximum coverage required):**

   Every topic must have the maximum practical number of animations. Animations are the primary learning vehicle on this platform — not a supplement. If a concept can be animated, it must be animated.

   **Required for every topic (non-negotiable):**
   - Mermaid.js system-level flowchart (e.g., `Client → CDN → Load Balancer → Microservice → DB`)
   - Markdown trade-off table
   - At minimum **3 Framer Motion animations** per topic: one for the big-picture flow, one for the data/schema level, one for the core concept mechanic

   **Animation types — use the right type per concept:**

   | Type | When to use | Example |
   |---|---|---|
   | **Passive flow** (auto-plays) | One-way sequential processes | HTTP request travelling through DNS → Server → Response |
   | **Step-through** (Next button) | Multi-step processes a learner should pace themselves | TCP handshake, cache lookup steps, index B-tree traversal |
   | **Interactive** (user controls variables) | Concepts with state the learner should explore by changing inputs | Consistent hashing ring (add/remove a node), circuit breaker (simulate failures), token bucket (vary request rate) |
   | **Comparative** (side-by-side) | Trade-off explanations | Cache hit vs cache miss latency, indexed vs unindexed query speed |

   **Interactive animation standard — apply whenever the concept has a controllable variable:**
   - User must be able to change at least one input (speed, node count, request rate, failure rate) and see the system respond in real time
   - Every interactive animation must have a **Reset** button
   - Every interactive animation must have **inline tooltip labels** on every moving element — no unlabelled arrows or boxes
   - Animations must work on mobile (touch events, not mouse-only)
   - Speed control (slow / normal / fast) on all animations that involve timing

   **Deep knowledge standard — animations must teach, not just illustrate:**
   - Every animation frame or state must show *why* something happens, not just *what* happens
   - Example: a cache miss animation must show the miss → DB query → cache write → response sequence with a latency counter, so the learner sees the cost of a miss, not just the path
   - Tooltips on hover/tap for every element: what it is, what it does, why it matters
   - Where a concept has a known failure mode (e.g., cache stampede, hotspot in sharding), animate the failure mode alongside the happy path

   **Colour system (consistent across all topics):**
   | Colour | Meaning |
   |---|---|
   | Green | Success / cache hit / healthy node / data found |
   | Red | Failure / cache miss / dead node / error |
   | Yellow / Amber | Pending / in-transit / waiting / degraded |
   | Blue | Data / request / packet in motion |
   | Grey | Idle / inactive / background system |

   **Minimum animation checklist per topic (must be met before topic is considered complete):**
   - [ ] 1 passive or step-through animation showing the full system-level flow
   - [ ] 1 interactive animation for the topic's core concept mechanic
   - [ ] 1 comparative animation or side-by-side showing the key trade-off
   - [ ] 1 failure-mode animation showing what goes wrong when the concept is misapplied or fails

6. **Common Mistakes** — 3–5 bullet points on what developers get wrong when implementing or designing this concept. Pitched at someone learning it for the first time.

7. **Interview Prep** — FAANG-style answer outline including back-of-the-envelope estimation (QPS, storage, bandwidth). Include a sample question and a structured answer template.

---

## Implementation Workflow (One Topic at a Time)

Topics are implemented sequentially, one at a time, fully completed before the next begins. A topic is not complete until every item in the checklist below is done. Do not start Topic N+1 while any checklist item for Topic N is open.

### Topic Completion Checklist

Before marking a topic as done and moving to the next:

- [ ] **ELI5 section** written and passes the 10-year-old standard
- [ ] **Big Tech Deep-Dive** written with at least one named real-world system (Netflix, Google, Discord, etc.)
- [ ] **Prerequisites block** declared with links to dependency topics
- [ ] **Next.js / Express implementation** is working, not pseudocode
- [ ] **Mongoose schema** defined with TypeScript types
- [ ] **Mermaid ER diagram** showing all collections and relationships
- [ ] **Mermaid data-flow diagram** tracing a real request through the schema
- [ ] **System-level flowchart** (Mermaid)
- [ ] **Minimum 3 Framer Motion animations** implemented (see Animation checklist in step 5)
- [ ] **At least 1 interactive animation** with Reset button, tooltips, speed control
- [ ] **Failure-mode animation** showing what breaks and why
- [ ] **Trade-off table** in Markdown
- [ ] **Common Mistakes** section (3–5 points)
- [ ] **Interview Prep** section with back-of-the-envelope estimation
- [ ] Topic tagged in `TOPICS.md` with all 6 tag fields populated
- [ ] Layout verified at 390px (mobile), 768px (tablet), 1280px (desktop)
- [ ] All animations tested with touch events on mobile viewport
- [ ] No horizontal overflow on any screen size

### Implementation order

Follow the sequence in `TOPICS.md` exactly — the prerequisite chain is the implementation order. Never skip ahead. If a later topic seems simpler, it still waits.

---

## Topic Tagging System

Every topic in `TOPICS.md` carries internal tags. These are the source of truth for generating learning paths — **never hardcode topic lists into UI components**; always derive them from tags at runtime.

### Tag Schema

```ts
{
  cluster: 'web-foundations' | 'storage' | 'scale' | 'reliability'
  difficulty: 'easy' | 'medium' | 'hard'
  interviewFrequency: 'high' | 'medium' | 'low'
  path: Array<'fundamentals-first' | 'interview-critical' | 'complexity-ladder'>
  hldWeight: 'primary' | 'supporting'
  status: 'mvp' | 'backlog'
}
```

### Learning Paths Derived from Tags

| Path ID | Filter logic | Default sort |
|---|---|---|
| `fundamentals-first` | `path includes 'fundamentals-first'` | Cluster order → topic number |
| `interview-critical` | `interviewFrequency === 'high'` | Cluster order → topic number |
| `complexity-ladder` | All topics | `difficulty: easy → medium → hard` |

When adding a new topic, assign all tags before writing any code. The tags in `TOPICS.md` are the contract — UI and API must derive from them, not duplicate them.

---

## Conventions

- MongoDB schemas live in `/models`. Use Mongoose with TypeScript types. Each model file exports a single default model.
- Express controllers in `/controllers` are thin — business logic goes in `/lib` service files.
- Diagram strings follow Mermaid syntax and are co-located with the component that renders them (not in a separate data file).
- Animation components receive plain data props; no animation logic inside page files.
- All trade-off comparisons are rendered as Markdown tables, not as JSX tables, so they remain readable in source.
