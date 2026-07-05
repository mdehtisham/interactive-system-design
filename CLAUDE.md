# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Policy

**Never commit code yourself.** Always provide the commit title and message and let the user commit manually.

---

## Known Issues — Never Repeat

All confirmed bugs and their fixes are tracked in `issues_and_fixes.md` at the
project root. Every rule below was learned the hard way — violating them will
reproduce the exact same bugs in new components.

### CSS Variables and Color Classes

- **Never write** `hsl(var(--anything))` in inline styles — the CSS variables in
  this project are defined as hex values (`--foreground: #111827`), not HSL
  component triplets. `hsl(#111827)` is invalid CSS and the browser silently
  ignores the entire declaration. Use `var(--foreground)` directly (no `hsl()`
  wrapper) when you must use a CSS variable in an inline style.
- **Never rely on `bg-muted`, `text-muted-foreground`, `bg-accent`, `border-border`
  etc. for elements where the Tailwind v4 prose plugin can override them** (table
  cells, headings, etc.). The prose plugin uses high-specificity `:where()` selectors.
  For these elements, use the explicit CSS classes defined in `globals.css`:
  - `ui-table-header` — table `<th>` cells (slate-100 bg + slate-900 text / zinc-800 + zinc-100 dark)
  - `ui-code-label` — code block language label (gray-700 / gray-300 dark)
  Add new `ui-*` classes to `globals.css` with `!important` whenever you need
  a color that must survive prose or other high-specificity overrides.

### Colors

- **Never** use `bg-accent`, `hover:bg-accent`, or `hover:text-accent-foreground`
  for any interactive state — `--accent` resolves to near-white in the default
  shadcn neutral light theme, making hover feedback invisible. This applies to
  **all** components including `Button` variants (outline, ghost), icon buttons,
  tab selectors, and any element with a hover state. Always use explicit Tailwind
  palette classes: `hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900
  dark:hover:text-zinc-100` for hover, `hover:bg-gray-200 dark:hover:bg-zinc-600`
  for more visible emphasis.
- **Never** use `text-muted-foreground` or `color: hsl(var(--muted-foreground))`
  for labels, table headers, button text, or any actionable / important UI text —
  `--muted-foreground` resolves to a very light grey (~46% lightness) that is
  barely readable on white backgrounds. Reserve `text-muted-foreground` for
  truly secondary/decorative text (captions, timestamps, empty-state hints).
  For table headers and button labels always use `text-foreground` or explicit
  palette classes (`text-zinc-700 dark:text-zinc-300`).
- **Always** add `active:scale-[0.97] transition-[colors,transform]` to clickable
  buttons and icon buttons — the press animation provides critical feedback that
  a click registered. Without it, buttons feel broken on both desktop and touch.
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
- **Never** write a Mermaid diagram as a fenced code block (` ```mermaid `) in
  MDX. Fenced code blocks render as a plain `<code>` element — the diagram is
  never parsed or drawn. Every Mermaid diagram must be a named component in
  `src/components/diagrams/` that wraps `<MermaidDiagram chart={CHART} />`,
  with the chart string as a module-level `const`. The component is then
  referenced in MDX as `<MyDiagramName />` with no inline string.
- **Every new diagram or animation component used in MDX must be registered in
  `src/components/mdx/MDXComponents.tsx`** — both an `import` line at the top
  and an entry in the `mdxComponents` object. Omitting either causes a 500
  error: "Expected component `X` to be defined." Always update this file
  immediately after creating a new component, before testing in the browser.

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

3. **`## Implementation`** — the LLD section. Three required sub-sections, always in this order:

   **`### Schema Design`** — Mongoose model with its TypeScript interface (`IModelName extends Document`). Every field explained inline: why it exists, its type, its constraints. Indexes declared at the model level with a one-line comment stating which query they serve. For foundational topics with no application DB model (e.g., How the Web Works), this sub-section is omitted — the Schema section's Entity Relationships diagram serves as the data structure reference instead.

   **LLD layering — always apply this pattern:**
   ```
   Route (express.Router)  →  maps URL + HTTP verb to a controller function
   Controller (thin)       →  parse req, call service, return res; zero business logic
   Service (/lib)          →  business logic, validation, DB calls; testable in isolation
   Model (Mongoose)        →  schema + TypeScript types only; zero business logic
   ```
   Apply Single Responsibility throughout: one file, one concern. Controllers that contain conditional logic or DB calls directly are doing too much — move that to the service layer.

   **`### API Contract`** — Express controller functions (one per HTTP verb) with correct status codes, error branches, and response shapes. Followed by the router file showing the URL → middleware → controller chain.

   **`### Data Flow`** — a Mermaid flowchart component tracing one complete real request (e.g., `POST /api/v1/posts`) through every code layer: client → route → middleware → controller → service → model → DB → response. Every arrow labelled. Shows the happy path and the first failure branch (e.g., 404 on DB miss).

4. **`## Schema`** — visual companions to the Implementation section. Two required sub-sections:

   **`### Entity Relationships`** — Mermaid ER diagram via a named component (e.g., `<ApiErDiagram />`). Every collection, every field, and every relationship shown with cardinality and embed-vs-reference decision annotated.

   **`### Request Data Flow`** — Mermaid data-flow diagram component showing the same request as Implementation's Data Flow, but at the infrastructure level (CDN → LB → service → cache → DB) rather than the code-function level. The two views complement each other: Implementation shows the code path; Schema shows the system path.

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

## Interview Prep Standards

Every Interview Prep section **must** meet these standards before a topic is marked complete. These rules exist because wrong numbers or missing core challenges are immediately disqualifying in a real FAANG interview.

### Back-of-the-Envelope — Math Rules (Non-Negotiable)

**Always verify arithmetic step by step. Never write a storage or bandwidth number from memory.** The Notes column must show the derivation, not just the result.

**Storage estimation template:**

```
writes_per_second × 86,400 s/day × 365 days × years × bytes_per_record
```

**Worked example — URL shortener, 100 writes/s, 5 years, 500 bytes/record:**

```
100 × 86,400 × 365 × 5 = 15,768,000,000 total records
15,768,000,000 × 500 bytes = 7,884,000,000,000 bytes ≈ 7.9 TB
```

The most common error: confusing GB and TB (factor of 1,000). Always compute; never estimate.

### Structured Answer — Core Engineering Challenge

Every FAANG system design answer must proactively address the **core engineering challenge** of the topic — the one thing interviewers always probe — even if the question does not explicitly ask. Raising it unprompted signals depth and separates a 7/10 answer from a 10/10.

**Known core challenges per common design question:**

| Design question | Core challenge to always address |
|---|---|
| URL shortener | Short code generation: base62 + sequential ID vs MD5-truncated; Snowflake IDs for multi-server uniqueness; collision handling |
| Rate limiter | Algorithm choice: token bucket vs sliding window log vs sliding window counter; where state lives (Redis vs in-process); race condition on distributed decrement |
| Chat / messaging | Message delivery guarantee: at-most-once vs at-least-once vs exactly-once; fan-out strategy for group chats; online/offline presence |
| Search autocomplete | Trie vs inverted index; where prefix cache lives; freshness vs latency trade-off; top-K ranking |
| Notification system | Push vs pull; fan-out-on-write vs fan-out-on-read; celebrity problem (a user with 100M followers posts) |
| CDN | Cache invalidation: TTL vs event-driven purge; cache miss thundering herd; origin shield pattern |
| Key-value store | Consistency model: eventual vs strong; conflict resolution (last-write-wins vs vector clocks); partition tolerance |

Expand this table as new topics are implemented.

### "How the Web Works" Type Questions — Four Details That Separate 10/10 Answers

When any interview question involves DNS → TCP → TLS → HTTP → render, always include all four of these — they are the details most candidates miss:

1. **HSTS preload list** — Before DNS, the browser checks a hardcoded list. `google.com`, `youtube.com`, etc. are on it. The browser forces HTTPS and never attempts HTTP — even on first visit. This eliminates the otherwise-inevitable HTTP → 301 round trip.
2. **HTTP/2 stream multiplexing vs HTTP/1.1 head-of-line blocking** — Don't just say "parallel requests." Explain that HTTP/1.1 serialises requests on each TCP connection (browsers open 6–8 connections to compensate), while HTTP/2 multiplexes independent streams over one connection with zero queueing between streams.
3. **TLS 1.3 0-RTT resumption** — Returning visitors with a valid session ticket send application data inside the ClientHello — TLS adds zero extra round trips. Mention this when discussing TTFB optimisation.
4. **Service workers for returning users** — A registered service worker intercepts the fetch before any network contact, serving from Cache Storage API. Zero DNS, zero TCP, zero TTFB. This is why PWAs load in single-digit milliseconds on repeat visits.

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

### LLD Sub-Section Heading Names (enforced across all topics)

Every `## Implementation` section must use exactly these sub-headings, in this order:

| Sub-heading | Content |
|---|---|
| `### Schema Design` | Mongoose model + TypeScript interface + index declarations. Omit only for foundational topics with no DB model. |
| `### API Contract` | Controller functions (one per HTTP verb) + router wiring file |
| `### Data Flow` | Mermaid flowchart component — code-level request path |

Every `## Schema` section must use exactly these sub-headings:

| Sub-heading | Content |
|---|---|
| `### Entity Relationships` | Mermaid ER diagram component |
| `### Request Data Flow` | Mermaid infrastructure-level flow component |

Non-conforming sub-heading names ("The Mongoose Schema", "The Controller", "Entity Relationship Diagram") are wrong. Fix them when you touch a file.
