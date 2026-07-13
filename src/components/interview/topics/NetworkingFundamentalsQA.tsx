'use client'

import { InterviewQAAccordion, type QAItem } from '@/components/interview/InterviewQAAccordion'

const ITEMS: QAItem[] = [
  {
    question:
      'When would you choose UDP over TCP? Give me a concrete real-world example.',
    intent:
      'Whether you understand the reliability vs speed trade-off beyond surface-level answers — specifically what makes a use case tolerant of packet loss.',
    answer:
      'UDP over TCP when: (1) latency matters more than reliability, and (2) the application handles its own recovery or tolerates loss. Concrete examples: Video/audio streaming (Netflix, YouTube live, Zoom) — a dropped frame causes a brief quality dip, acceptable; waiting for TCP retransmission would cause visible freeze. DNS queries — tiny request/response that fits in one packet; if it fails, the client simply retries the DNS query. Online games — sending player position 60× per second; a stale position is less harmful than delayed position. QUIC (the protocol under HTTP/3) — runs over UDP but implements its own per-stream reliability, giving you TCP-level guarantees without TCP head-of-line blocking. The wrong answer: "UDP when you don\'t care about the data" — the application almost always cares about the data; the key is whether the application can tolerate loss or handle recovery itself better than TCP\'s generic retransmission.',
    trap:
      'Saying "UDP for anything real-time" without explaining why. Zoom uses UDP for video frames but uses a reliability layer on top for signalling messages (call setup, codec negotiation). The choice is granular — not "use UDP for the whole application" but "use UDP for the high-frequency, loss-tolerant stream."',
  },
  {
    question:
      'Explain the TCP 3-way handshake. Why does it require exactly 3 steps and not 2?',
    intent:
      "Whether you understand WHY the handshake has 3 steps — testing that you've reasoned through the protocol, not just memorised it.",
    answer:
      'SYN → SYN-ACK → ACK. Step 1: Client sends SYN with its initial sequence number (ISN). Step 2: Server sends SYN-ACK — it acknowledges the client\'s ISN (ACK=client_ISN+1) and introduces its own ISN (SEQ=server_ISN). Step 3: Client sends ACK acknowledging the server\'s ISN (ACK=server_ISN+1). Why 3 steps and not 2: a 2-way handshake would only confirm the server heard the client — but the client would never confirm it heard the server\'s ISN. TCP is bidirectional: both sides must prove they can receive from the other before data flows. 2 steps prove one direction. 3 steps prove both. The cost: 1.5 RTT of pure overhead before any application data. At 70ms RTT (US to Europe): 105ms of handshake. This is why HTTP/2 keep-alive (reuse the connection for multiple requests) and QUIC 0-RTT (skip handshake for returning clients) are meaningful performance wins — they eliminate this 105ms per connection.',
    trap:
      '"TCP handshake is SYN → SYN-ACK → ACK" without explaining what each step accomplishes or why it takes 1.5 RTT. Interviewers follow up with "why not 4 steps?" or "why not 2?" — knowing the answer demonstrates you understand TCP, not just its name.',
  },
  {
    question:
      'What is the difference between a Layer 4 and a Layer 7 load balancer? When would you use each?',
    intent:
      'Whether you can apply OSI layer knowledge to a concrete system design decision — this is one of the most common networking questions in design rounds.',
    answer:
      'Layer 4 LB operates on TCP/UDP headers (IP + port). It forwards packets without reading HTTP — it sees "TCP connection from 10.0.0.5:52341 to :443" and routes to a backend based on IP hash or round-robin. Faster (less parsing), stateful TCP connections persist to the same backend. Layer 7 LB reads HTTP/HTTPS content — it terminates TLS, parses HTTP headers, and can route based on URL path, Host header, cookies, or JWT claims. It can do: /api/* → backend pool A, /static/* → CDN, /admin/* → backend pool B with auth check. Use Layer 4: raw performance is critical (millions of short-lived TCP connections), application-level routing is not needed, or you\'re forwarding non-HTTP protocols (database proxies, game servers). Use Layer 7: you need path-based routing, A/B testing, canary deployments, header injection, or TLS termination. In practice at Big Tech scale: both are often layered — a Layer 4 LB at the network edge distributes across regions or availability zones, then Layer 7 LBs (nginx, Envoy, AWS ALB) within a region handle application routing.',
    trap:
      '"Layer 7 is better because it can do more." Layer 4 is not inferior — it is deliberately simpler. A Layer 4 load balancer can handle 10× more connections per second than L7 because it does no SSL termination, no HTTP parsing, no header inspection. For database load balancing (pgBouncer, ProxySQL) you often want L4 to preserve TCP connection semantics rather than L7\'s request-response model.',
  },
  {
    question:
      'What is TCP head-of-line blocking and how does QUIC (HTTP/3) solve it?',
    intent:
      'Whether you understand the specific failure mode of HTTP/2 multiplexing over TCP — this separates candidates who know "HTTP/3 is faster" from those who understand why.',
    answer:
      'TCP delivers bytes in order. If a TCP segment is lost, TCP stalls delivery of everything received after that segment until the lost segment is retransmitted and arrives — even if those later segments are complete and independent. In HTTP/2 over TCP, multiple request streams share a single TCP connection via multiplexing. A single lost TCP segment stalls ALL streams simultaneously — even streams that have nothing to do with the lost segment. This is head-of-line blocking at the TCP layer. On reliable wired networks it is rare. On mobile networks with 1–5% packet loss, it causes visible stalling even with good bandwidth. QUIC (the transport for HTTP/3) runs over UDP and implements its own reliability per stream. If a QUIC packet for stream A is lost, stream B keeps flowing — QUIC\'s reliability mechanism is stream-scoped, not connection-scoped. Additionally, QUIC encrypts stream metadata (which stream, sequence number) — an observer cannot tell which application data belongs to which stream. Netflix measured a 9% reduction in rebuffering after enabling QUIC on mobile networks.',
    trap:
      '"HTTP/3 is faster because UDP is faster than TCP." This is not precise. QUIC-over-UDP is not faster in ideal conditions — TCP and QUIC have comparable throughput on a reliable network. The improvement is specifically on lossy networks (mobile, Wi-Fi) where TCP\'s in-order delivery requirement becomes a throughput bottleneck. On a wired connection with <0.01% packet loss, HTTP/2 and HTTP/3 are approximately equivalent.',
  },
  {
    question:
      'Why is connection pooling critical at scale, and what problems does it solve?',
    intent:
      'Whether you understand the operational cost of TCP handshakes and can translate that into a concrete architectural pattern — comes up in API server and database design discussions.',
    answer:
      'TCP 3-way handshake = 1.5 RTT per new connection. If your API server makes a new TCP connection to the database on every request: at 1,000 RPS and 5ms database RTT, you are doing 1,000 handshakes/second × 7.5ms = 7,500ms of pure overhead per second — plus TLS if the connection is encrypted (+7.5ms more per connection). Connection pooling maintains a pre-established pool of open TCP connections. Incoming requests borrow an available connection (no handshake), use it (query), and return it to the pool. For PostgreSQL behind an API server at 1,000 RPS: without pooling = 1,000 new TCP+TLS connections/second, each consuming ~5ms overhead = 5s of wasted CPU and latency per second. With a pool of 20 connections: 20 handshakes total, amortised across the entire lifetime of the server. The production implementation: PgBouncer (PostgreSQL connection pool), HikariCP (Java), or connection pool settings in your ORM (Mongoose, Sequelize). Configure: min pool size (keep-warm connections), max pool size (prevent DB exhaustion), and idle timeout (close connections inactive for >N minutes).',
    trap:
      '"Just increase the max connections on the database" as the scaling strategy. Most databases (PostgreSQL especially) are limited to ~300–500 concurrent connections before performance degrades. With 10 API servers × 100 max connections = 1,000 connections — far exceeding PostgreSQL\'s healthy limit. PgBouncer or RDS Proxy sits between the API servers and the DB, maintaining a small pool of real database connections while handling thousands of application-side connections.',
  },
  {
    question:
      'How does anycast routing work? Where is it used in system design?',
    intent:
      'Whether you understand the Layer 3 mechanism behind CDN PoP selection and DDoS mitigation — candidates who know system design but not networking often cannot explain how Cloudflare\'s 1.1.1.1 works.',
    answer:
      'Anycast assigns the same IP address to multiple servers in different geographic locations. Each location announces that IP to the internet via BGP. BGP\'s shortest-path routing algorithm then directs each user to the "nearest" (fewest BGP hops) location automatically — without any application-level DNS redirect or geolocation logic. Example: Cloudflare announces 1.1.1.1 from 330+ data centres. A user in Tokyo hits Tokyo\'s Cloudflare PoP; a user in London hits London\'s. Neither user knows this is happening — they both connect to the same IP (1.1.1.1). System design applications: (1) CDN PoP selection — every CDN (Cloudflare, Akamai, Fastly) uses anycast to route users to the nearest edge without DNS round-robin (which has TTL and caching issues). (2) DDoS absorption — a volumetric DDoS attack targeting one anycast IP is automatically distributed across all 330 PoPs. No single location receives the full flood — each location absorbs a fraction. A 500 Gbps attack becomes ~1.5 Gbps per PoP on a 330-PoP network. (3) DNS resolver infrastructure — Google\'s 8.8.8.8 and Cloudflare\'s 1.1.1.1 are anycast IPs served from hundreds of locations.',
    trap:
      'Confusing anycast with GeoDNS. GeoDNS uses DNS to return different IP addresses based on the user\'s location — it operates at Layer 7 and has TTL-related latency (the user must re-resolve DNS to switch PoPs after a failure). Anycast operates at Layer 3 via BGP — failover is automatic within seconds when a PoP withdraws its BGP announcement, without any DNS TTL delay. For systems requiring fast failover (sub-second), anycast is the correct mechanism.',
  },
]

export function NetworkingFundamentalsQA() {
  return <InterviewQAAccordion items={ITEMS} />
}
