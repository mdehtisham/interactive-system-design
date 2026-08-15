'use client'

import { InterviewQAAccordion, type QAItem } from '@/components/interview/InterviewQAAccordion'

const ITEMS: QAItem[] = [
  {
    question: 'What is anycast routing and how does Google use it for 8.8.8.8?',
    intent: 'Whether you understand how Google operates DNS at global scale — not just that 8.8.8.8 exists.',
    answer:
      'Anycast routing announces the same IP address from hundreds of locations simultaneously. When your device sends a query to 8.8.8.8, BGP automatically routes it to the nearest Point of Presence — no explicit steering, no DNS-based load balancing. Google runs 8.8.8.8 from 300+ PoPs worldwide. Your query reaches the nearest one in ~5–10ms regardless of where you are. This is fundamentally different from unicast (one IP → one server) and from DNS-based GeoDNS (which still requires a DNS lookup to route traffic). With anycast, the routing decision happens at the IP layer before any application-level protocol is involved.',
    trap:
      'Saying "anycast is a type of DNS." Anycast is a BGP-level routing strategy, not a DNS feature. DNS can use anycast for its resolver infrastructure, but anycast operates at the IP routing layer independently of any application protocol. Conflating the two shows a gap in networking fundamentals.',
  },
  {
    question: 'Why does DNS use UDP instead of TCP for most queries?',
    intent: 'Transport layer trade-offs — the precise reasons UDP fits DNS\'s latency and size constraints.',
    answer:
      'DNS queries are typically under 512 bytes and require the lowest possible latency. UDP is connectionless — one packet out, one packet back, no handshake. TCP\'s 3-way handshake costs 1 RTT before a single byte of application data is sent. For DNS, that would double query latency. UDP also has lower per-packet overhead. DNS does fall back to TCP automatically in two scenarios: (1) responses over 512 bytes, which occurs frequently with DNSSEC because cryptographic signatures significantly expand record size; (2) zone transfers between authoritative nameservers, which are large bulk operations where reliability matters more than latency. DNS clients implement their own retry logic at the application layer, so UDP\'s lack of guaranteed delivery is handled explicitly.',
    trap:
      'Saying "UDP is unreliable so DNS queries sometimes fail silently." DNS clients implement application-level retry with configurable timeouts — typically 3 retries at 1-second intervals before failing over to a secondary resolver. Reliability is handled by the DNS client, not the transport. This is intentional architecture, not a weakness.',
  },
  {
    question: 'What is DNSSEC and what problem does it solve?',
    intent: 'DNS security depth — specifically the Kaminsky attack and why cryptographic signing prevents cache poisoning.',
    answer:
      'DNSSEC adds cryptographic signatures to DNS records so resolvers can verify that a response came from the legitimate authoritative nameserver and was not tampered with in transit. The problem it solves is DNS cache poisoning — the Kaminsky attack (2008) demonstrated that an attacker could inject forged DNS responses into a resolver\'s cache at scale, silently redirecting all users of that resolver to malicious servers. DNSSEC establishes a chain of trust from the root zone down: the root signs TLD keys, TLDs sign domain keys, domains sign their records. A DNSSEC-aware resolver validates the entire chain before accepting a response. If any signature is invalid, the response is rejected.',
    trap:
      'Confusing DNSSEC with DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT). DNSSEC solves data integrity — was this record tampered with? DoH/DoT solve transport privacy — can my ISP or a network observer see which domains I am querying? They are complementary, not interchangeable. A DNSSEC-signed record delivered over plain UDP is authentic but not private. A DoH query is private but does not verify the record was signed by the authoritative nameserver.',
  },
  {
    question: 'What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?',
    intent: 'Whether you understand head-of-line blocking precisely — the core engineering problem each version addresses differently.',
    answer:
      'HTTP/1.1: text-based, one outstanding request per TCP connection. Browsers open 6–8 parallel connections per origin to compensate, but each connection serialises internally. HTTP/2: binary framing, stream multiplexing over one TCP connection. Multiple request/response pairs interleave as frames — no HTTP-level head-of-line blocking. Critical caveat: TCP-level HOL blocking remains. One lost TCP packet stalls ALL HTTP/2 streams until retransmission completes, because TCP guarantees ordered delivery and the streams share a single byte stream. HTTP/3: replaces TCP with QUIC (UDP-based). Each stream is independent at the transport layer — one lost packet blocks only its own stream. TLS 1.3 is built into QUIC, and the combined handshake takes 1 RTT on first connection versus TCP+TLS\'s 2 RTTs.',
    trap:
      'Saying HTTP/2 "solves" head-of-line blocking. HTTP/2 eliminates HOL blocking at the HTTP application layer but introduces it at the TCP transport layer. A single dropped packet causes all concurrent streams to pause. This is a well-documented HTTP/2 weakness that QUIC was specifically designed to eliminate. Candidates who stop at "HTTP/2 uses multiplexing" miss the deeper tradeoff.',
  },
  {
    question: 'How does a CDN reduce TTFB, and what happens on a cache miss?',
    intent: 'Whether you have thought beyond the happy path — specifically the cache miss cost and the origin shield pattern.',
    answer:
      'On a cache HIT: the edge server in the user\'s city responds directly, reducing a 200ms cross-continent round trip to a 5–20ms nearby hop. On a cache MISS: the edge must fetch from origin. This is actually slower than a direct origin request — the user incurs two serial round trips (user → edge → origin) plus edge processing overhead. The fix is an origin shield: a second-tier cache between edge nodes and origin. When multiple edge servers simultaneously miss on the same key, they all hit the shield instead of the origin. The shield makes at most one request to origin. Without origin shield, a cache expiry on a popular asset triggers a thundering herd: thousands of edge servers simultaneously hitting origin.',
    trap:
      'Assuming CDN always reduces latency. Cache hit rate is a function of TTL, request volume, and content uniqueness. A low-traffic, personalised, or short-TTL page might have a 10–20% hit rate — the CDN adds two hops of latency instead of removing one. A CDN is only net-positive when cache hit rate × (origin latency − edge latency) > cache miss overhead. Candidates who say "CDN always makes things faster" have not debugged a production CDN configuration.',
  },
  {
    question: 'If you were designing a high-availability service, what TTL would you set and why?',
    intent: 'Operational judgment — the failover speed vs. query volume tradeoff, and pre-emptive TTL reduction before risk events.',
    answer:
      'For a HA service: 60 seconds during normal operation — fast enough to fail over within one minute if a data centre goes down, at an acceptable increase in DNS query volume. Before any planned migration or deployment: lower to 30 seconds at least 24 hours in advance. This is the critical non-obvious step: TTL changes only take effect after the current TTL expires. If your TTL was 86,400 when the incident started, resolvers worldwide will cache the broken record for up to 24 hours and you cannot flush external caches. The operational rule: lower TTL before the risk window opens, raise it again after the migration is stable.',
    trap:
      'Setting TTL to 0 for "instant failover." TTL=0 means every DNS query hits your authoritative nameserver — no caching at all. At scale, this is effectively a DDoS on your own DNS infrastructure. Most public resolvers also enforce a minimum TTL (commonly 30–60 seconds) and ignore TTL=0 as a self-protection measure. Zero-TTL is not a valid HA strategy.',
  },
]

export function HowTheWebWorksQA() {
  return <InterviewQAAccordion items={ITEMS} />
}
