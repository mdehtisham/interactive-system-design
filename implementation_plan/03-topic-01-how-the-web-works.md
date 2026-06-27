# 03 — Topic 01: How the Web Works

## Goal

Implement the first complete topic end-to-end, passing all 19 items in the topic completion checklist. This is the **reference implementation** — every subsequent topic follows the exact same pattern, component structure, and MDX conventions established here.

After this phase:
- `/topics/how-the-web-works` is fully complete with all 7 sections
- 4 Framer Motion animations are live and interactive
- All Mermaid diagrams render correctly
- The page passes mobile/tablet/desktop viewport checks
- The completion checklist is 19/19

---

## Topic Summary

| Field | Value |
|---|---|
| Slug | `how-the-web-works` |
| Cluster | Web Foundations |
| Difficulty | Easy |
| Interview Frequency | Low |
| Prerequisites | None |

**Core concepts:** DNS resolution pipeline, TCP/IP, HTTP request-response cycle, Client-Server model, IP addresses, packets. DNS as a routing layer (GeoDNS, anycast, TTL implications).

**LLD angle:** A Next.js API route that logs and returns request metadata (headers, IP, method, resolved hostname) — makes the HTTP cycle tangible.

---

## Content Sections

### Section 1 — ELI5 Foundation

**10-year-old standard check:** Every sentence must be understandable without prior technical knowledge. Technical terms appear only after the analogy.

**Analogy to lead with:** The "library card catalogue" — when you want a book (a website), you first look up its shelf location (DNS lookup), then walk to that shelf (TCP connection), then open the book and read it (HTTP request-response). The book doesn't move to you; you reach it using an address.

**Draft structure:**
1. Open with the library analogy (3 sentences max)
2. Introduce: "In computing, this process is called DNS resolution…"
3. Explain what a URL is vs what an IP address is (using the analogy)
4. One sentence on TCP: "Before you can read anything, the library needs to know you're there — that handshake is called TCP"
5. One sentence on HTTP: "The actual 'give me this page' request is sent over HTTP"

**Word budget:** Under 200 words. No lists — flowing prose only.

---

### Section 2 — FAANG Deep-Dive

**Real systems to reference by name:**
- **Google** — operates its own global DNS (8.8.8.8), uses anycast routing so the nearest Google server answers
- **Netflix** — uses AWS Route 53 with GeoDNS to route users to the nearest AWS region (reduces latency from ~200ms to ~20ms)
- **Cloudflare** — 1.1.1.1 resolver, 300+ PoPs worldwide, processes 1 trillion DNS queries/day

**Key technical points to cover:**
1. DNS hierarchy: Recursive resolver → Root nameserver (13 clusters worldwide) → TLD nameserver (`.com`, `.org`) → Authoritative nameserver → IP returned
2. TTL and caching: why a low TTL (60s) costs more DNS queries but enables faster failover; why a high TTL (86400s = 24h) means a DNS change takes a day to propagate
3. GeoDNS: the authoritative nameserver returns a different IP depending on where the query originates — how Netflix routes UK users to EU servers
4. TCP vs UDP for DNS: most queries use UDP (faster, stateless); TCP fallback for responses > 512 bytes

**Back-of-the-envelope (preview for Interview Prep section):**
- A single DNS lookup: ~20-120ms (varies by cache level hit)
- Recursive resolution (full chain, cold cache): ~300-500ms total (4 round trips)
- Cached (OS or browser): < 1ms

---

### Section 3 — Implementation (LLD)

**Build:** A Next.js App Router API route that reflects request metadata back to the caller. Demonstrates concretely what the server "sees" in an HTTP request.

**File:** `src/app/api/request-echo/route.ts`

```ts
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'

  return NextResponse.json({
    method:    req.method,
    url:       req.url,
    ip,
    host:      req.headers.get('host'),
    userAgent: req.headers.get('user-agent'),
    headers:   Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  })
}
```

**Explanation to include in MDX:**
- `x-forwarded-for` is the real client IP when behind a proxy/CDN — `req.ip` alone is unreliable
- `host` header is what the client thinks it's calling — relevant for virtual hosting (multiple domains on one server)
- The JSON response IS the HTTP response — status 200, `Content-Type: application/json`, body serialized

**Screenshot/output block:** Include an example JSON response in a fenced code block so learners see exactly what the endpoint returns.

---

### Section 4 — Database & API Schema

**No Mongoose model needed for this topic** — the concept is networking, not data storage.

**ER Diagram:** Show the DNS record types as an entity-relationship style structure:

```
erDiagram
  DOMAIN {
    string name
    string registrar
  }
  DNS_RECORD {
    string type "A | CNAME | MX | TXT | NS"
    string name
    string value
    int ttl
  }
  DOMAIN ||--o{ DNS_RECORD : has
```

Caption: "DNS records are the database rows of the internet — each maps a domain name to a value with an expiry (TTL)."

**Data flow diagram:** Trace a DNS resolution from the user's browser to the authoritative nameserver:

```
flowchart LR
  Browser["Browser\n(checks cache)"]
  OS["OS DNS Cache\n(checks /etc/hosts)"]
  Recursive["Recursive Resolver\n(ISP or 8.8.8.8)"]
  Root["Root Nameserver\n(13 clusters)"]
  TLD["TLD Nameserver\n(.com / .org)"]
  Auth["Authoritative NS\n(your domain registrar)"]
  IP["IP Address\nreturned"]

  Browser -->|"cache miss"| OS
  OS -->|"cache miss"| Recursive
  Recursive -->|"cache miss"| Root
  Root -->|"who handles .com?"| TLD
  TLD -->|"who handles example.com?"| Auth
  Auth -->|"93.184.216.34"| Recursive
  Recursive -->|"cached + returned"| Browser
  Browser --> IP
```

---

## Animations (4 Required)

### Animation 1 — Passive Flow: DNS Resolution Pipeline

**Type:** `PassiveFlow` (auto-playing)

**What it shows:** A DNS query travelling step-by-step from the browser to the authoritative nameserver and back, with each node lighting up in sequence and the returned IP appearing at the end.

**Nodes (7):**

| Node | Label | Tooltip | Colour when active |
|---|---|---|---|
| Browser | Browser | "Your browser checks its local DNS cache first — cached entries last for the TTL duration" | Blue (in transit) |
| OS Cache | OS Cache | "The operating system keeps its own DNS cache. `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac) clears it" | Blue |
| Recursive Resolver | Recursive Resolver | "Usually your ISP's server or a public resolver like 8.8.8.8. It does the legwork on your behalf" | Blue |
| Root NS | Root Nameserver | "13 root server clusters worldwide. They don't know your IP — they know who to ask next (the TLD nameserver)" | Blue |
| TLD NS | TLD Nameserver | "Managed by the TLD registry (Verisign for .com). Knows which authoritative nameserver handles your domain" | Blue |
| Authoritative NS | Authoritative NS | "Your domain registrar's server. Has the actual DNS records — returns the real IP address" | Green (resolved) |
| IP | IP Address | "The numeric address (e.g. 93.184.216.34) the browser uses to open a TCP connection" | Green |

**Step timing:** 1200ms per step at normal speed. Arrow between nodes animates as a moving dot (Framer Motion `x` keyframe).

**After all nodes light up:** Show a small banner: "Full resolution: ~300-500ms cold. From OS cache: <1ms."

**Reset:** All nodes return to idle (grey), counter resets.

**Implementation notes:**
- Use `AnimationShell` wrapper
- Node component: rounded rect, 80px wide, 48px tall, label below, tooltip on hover/tap
- Arrow: SVG path with a `motion.circle` travelling along it
- Colour tokens: `--anim-data` (blue) for in-transit, `--anim-success` (green) for resolved, `--anim-idle` (grey) for pending

---

### Animation 2 — Step-Through: HTTP Request-Response Cycle

**Type:** `StepThrough` (Next/Prev buttons, 8 steps)

**What it shows:** Every step from URL typed to page rendered. Learner clicks "Next" to advance. Each step shows a labelled diagram of what's happening at the network level.

**Steps:**

| # | Title | What to show | Tooltip / explanation |
|---|---|---|---|
| 1 | DNS Lookup | Browser → DNS cloud → IP returned | "Before anything else, the browser must turn the domain name into an IP address. If cached, this is instant." |
| 2 | TCP SYN | Client → Server: SYN packet | "Client says 'can we talk?' — sends a SYN (synchronise) packet" |
| 3 | TCP SYN-ACK | Server → Client: SYN-ACK | "Server replies 'yes, ready' — sends SYN-ACK" |
| 4 | TCP ACK | Client → Server: ACK | "Client confirms: 'got it'. TCP connection is now open. This 3-step dance is the TCP handshake." |
| 5 | TLS Handshake | Client ↔ Server: 2 round trips | "For HTTPS, client and server negotiate encryption. Adds ~1-2 round trips (TLS 1.3 reduces to 1)." |
| 6 | HTTP Request | Client → Server: GET /path | "Client sends the actual request: method, path, headers, optional body" |
| 7 | HTTP Response | Server → Client: 200 OK + body | "Server sends back: status code, headers (Content-Type, Cache-Control), and the HTML body" |
| 8 | Browser Render | Browser parses HTML → DOM | "Browser parses HTML → builds DOM → fetches CSS/JS → paints pixels. TTFB (Time to First Byte) ends at step 7." |

**Controls:** Previous / Next buttons (44×44px), step counter "3 / 8", Reset.

**Visual:** Left panel = client (browser icon), right panel = server (server icon), centre = network. Arrows animate between panels for each step. Current step highlighted in a description card below the diagram.

---

### Animation 3 — Interactive: GeoDNS Routing

**Type:** `Interactive` (user changes variables, system responds)

**What it shows:** How GeoDNS routes users to the nearest data centre, and how TTL affects propagation speed.

**Controls:**

| Control | Type | Options / Range | Effect |
|---|---|---|---|
| Your location | Select | 🇺🇸 US East, 🇬🇧 UK, 🇯🇵 Japan, 🇦🇺 Australia | Changes which data centre is selected by DNS |
| TTL | Slider | 60s – 86400s (log scale) | Shows estimated propagation time if a DC goes down |

**Visual:**
- World map (simplified SVG, no external dependency) with 4 data centre dots: US East, EU West, APAC, AU
- User's location shown as a pulsing dot
- Active data centre highlighted green, others grey
- Arrow from user to selected DC, labelled with example latency (e.g., "US→US: ~5ms", "AU→US: ~180ms")
- TTL panel below: "If this DC fails, DNS update takes [TTL value] to propagate to all resolvers. Low TTL = faster failover but more DNS queries."

**Tooltip on TTL slider:** "Netflix uses TTL of 20-60 seconds for critical services. Your ISP's resolver ignores TTLs below its minimum (usually 30s)."

---

### Animation 4 — Comparative / Failure Mode: DNS Failure Scenarios

**Type:** `Comparative` (side-by-side) with a failure mode twist

**What it shows:** Left panel = happy path (DNS resolves correctly). Right panel = failure scenarios (toggleable).

**Failure modes (toggle between them):**

| Mode | What happens | Visual |
|---|---|---|
| NXDOMAIN | Domain doesn't exist | DNS returns NXDOMAIN error, browser shows "DNS_PROBE_FINISHED_NXDOMAIN" |
| Timeout | Resolver unreachable | Query times out after 5s, browser shows "ERR_CONNECTION_TIMED_OUT" |
| Stale cache | DNS changed but cache not expired | User gets old IP (old server), which may return 404 or be totally offline |
| DNS poisoning | Malicious resolver returns wrong IP | User is routed to attacker's server (man-in-the-middle). DNSSEC prevents this. |

**Controls:** Radio buttons to select failure mode (right panel updates). Left panel always shows the happy path for comparison.

**Colour coding:**
- Left (happy path): green nodes, green arrows
- Right (failure): red nodes, red arrows, error message displayed

**Why this matters:** "This is the failure mode animation — every animation on this platform includes one. System design interviews often ask 'what happens when X fails?' — you need to know."

---

## Common Mistakes (Section 6)

1. **"DNS is just a phonebook"** — Stops at the analogy. DNS is also a routing layer (GeoDNS), a load balancer, and a failover mechanism. The TTL is a critical operational parameter, not a footnote.

2. **Ignoring TTL in incident response** — Changing a DNS record and assuming it propagates instantly. If TTL was 86400s before the incident, it takes up to 24 hours for all resolvers to update. Set a low TTL _before_ planned changes, not during.

3. **Conflating HTTP and TCP** — HTTP runs _over_ TCP. TCP handles reliable delivery (retransmission, ordering). HTTP handles application semantics (methods, status codes, headers). They are separate layers.

4. **Assuming the client IP is always `req.ip`** — Behind a load balancer or CDN, `req.ip` is the proxy's IP. Real client IP is in `x-forwarded-for` or `cf-connecting-ip` (Cloudflare). Always sanitize and validate these headers.

5. **Not understanding the TCP handshake cost** — Each new TCP connection costs 1.5 round trips _before_ a single byte of HTTP is sent. HTTP/2 (persistent connections) and HTTP/3 (QUIC) exist specifically to eliminate this cost. In a latency-sensitive system, the number of new connections matters.

---

## Interview Prep (Section 7)

### Sample FAANG Question

> "Walk me through what happens when a user types `google.com` into their browser and hits Enter."

### Structured Answer Template

**1. DNS Resolution (15 seconds)**
"The browser first resolves the domain to an IP address. It checks its own cache, then the OS cache, then sends a recursive query to the configured resolver — usually 8.8.8.8 or the ISP's resolver. The resolver walks the DNS hierarchy: root → TLD → authoritative nameserver. The authoritative NS returns Google's IP. The whole chain takes 20–300ms cold, <1ms cached."

**2. TCP + TLS Handshake (15 seconds)**
"With the IP, the browser opens a TCP connection — 3-way handshake (SYN, SYN-ACK, ACK), 1 RTT. For HTTPS, a TLS handshake follows — 1 additional RTT for TLS 1.3, 2 for TLS 1.2. Total: ~2–3 RTTs before a byte of HTTP is exchanged."

**3. HTTP Request/Response (15 seconds)**
"Browser sends `GET / HTTP/2` with headers (User-Agent, Accept-Encoding, cookies). Google's load balancer routes to an application server. Server returns 200 OK with HTML. TTFB (Time to First Byte) is the latency from request to first response byte — Google targets <200ms."

**4. Browser Render (10 seconds)**
"Browser parses HTML, builds DOM, fetches CSS/JS in parallel (HTTP/2 multiplexing), applies styles, paints pixels. Critical Rendering Path — blocking scripts delay the first paint."

### Back-of-the-Envelope

| Metric | Value | Notes |
|---|---|---|
| DNS cold resolution | 300–500ms | 4 round trips, each ~50–100ms |
| DNS cached (OS) | < 1ms | Memory lookup |
| TCP handshake | 1 RTT ≈ 10–200ms | Depends on distance to server |
| TLS 1.3 handshake | 1 RTT ≈ 10–200ms | Additional to TCP |
| HTTP round trip | 1 RTT + server processing | Server processing goal < 50ms |
| **Total (cold, same continent)** | ~500ms–1s | First load, uncached |
| **Total (warm, CDN hit)** | ~50–200ms | Cached DNS + edge server |

### Follow-up Questions to Expect

- "What is anycast routing and how does Google use it for DNS?"
- "Why does DNS use UDP instead of TCP?"
- "What is DNSSEC and what problem does it solve?"
- "What's the difference between HTTP/1.1, HTTP/2, and HTTP/3?"
- "How does a CDN reduce TTFB?"

---

## Phase 03 Completion Checklist

Use the standard 19-item checklist from CLAUDE.md:

- [ ] **ELI5 section** written, passes 10-year-old standard, uses library analogy, < 200 words, no jargon before the analogy
- [ ] **FAANG Deep-Dive** written, references Google (DNS 8.8.8.8 anycast), Netflix (GeoDNS Route 53), Cloudflare (1.1.1.1, 300+ PoPs)
- [ ] **Prerequisites block** — "None — start here" rendered in TopicHeader
- [ ] **Next.js implementation** working — `src/app/api/request-echo/route.ts` returns live request metadata, code block rendered with Shiki highlighting
- [ ] **Mongoose schema** — N/A for this topic (noted in section); ER diagram shows DNS record types instead
- [ ] **Mermaid ER diagram** — DNS record entity diagram rendered via `<Mermaid>` component
- [ ] **Mermaid data-flow diagram** — DNS resolution chain rendered via `<Mermaid>` component
- [ ] **System-level flowchart** — DNS + TCP + HTTP full request lifecycle in Mermaid
- [ ] **Animation 1 (PassiveFlow)** — DNS resolution pipeline, 7 nodes, auto-plays, speed control works
- [ ] **Animation 2 (StepThrough)** — HTTP request-response, 8 steps, Next/Prev buttons, Reset works
- [ ] **Animation 3 (Interactive)** — GeoDNS routing, location selector + TTL slider, system responds in real time, Reset works
- [ ] **Animation 4 (Comparative/Failure)** — DNS failure modes, 4 scenarios toggleable, left=happy path always visible
- [ ] **All animations** have inline tooltips on every element, colour system applied (green/red/amber/blue/grey)
- [ ] **All animations** tested with touch events on mobile viewport (390px)
- [ ] **Trade-off table** — DNS TTL trade-offs (low vs high), HTTP vs HTTPS overhead, TCP vs QUIC (Markdown table)
- [ ] **Common Mistakes** — 5 points written, each practical and grounded in a real scenario
- [ ] **Interview Prep** — structured answer template + back-of-the-envelope table + 5 follow-up questions
- [ ] **Topic tagged in `TOPICS.md`** — all 6 tag fields already populated ✓
- [ ] **Layout verified** at 390px (mobile), 768px (tablet), 1280px (desktop) — no horizontal overflow, all animations work, TOC visible on desktop only
- [ ] **Pause animations toggle** appears in Navbar when visiting this page, disappears when navigating away

---

## What Comes Next

**`04-topic-02-apis-and-rest.md`** — APIs & REST (prerequisite: `how-the-web-works`). Follows the same structure as this document. Shorter ramp-up since the reference pattern is established.

After Topics 01–03 (Web Foundations cluster) are complete, create **`05-cluster-2-storage-plan.md`** to plan the Storage cluster (Topics 04–08) before starting Topic 04.
