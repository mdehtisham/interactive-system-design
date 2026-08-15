'use client'

import { useCallback, useState } from 'react'
import { AnimationShell } from '@/components/animations/AnimationShell'
import type { AnimationOptions } from '@/components/animations/AnimationShell'

interface OsiLayer {
  number: number
  name: string
  pdu: string
  protocols: string[]
  BigTechRelevance: string
  devices: string[]
  interviewTip: string
  bgClass: string
  textClass: string
  borderClass: string
  darkBgClass: string
  darkTextClass: string
}

const LAYERS: OsiLayer[] = [
  {
    number: 7,
    name: 'Application',
    pdu: 'Data',
    protocols: ['HTTP/HTTPS', 'DNS', 'WebSocket', 'gRPC', 'REST/GraphQL', 'SMTP'],
    BigTechRelevance:
      'Your API lives here. REST vs GraphQL vs gRPC is an Application Layer decision. HTTP/2 and HTTP/3 improvements (stream multiplexing, QUIC) live here. A Layer 7 load balancer reads HTTP headers to route /api/* to backend A and /static/* to a CDN — impossible for a Layer 4 LB which sees only IP and port.',
    devices: ['Web browsers', 'API servers', 'Layer 7 load balancers', 'CDN edge nodes', 'WAF'],
    interviewTip:
      'When asked about CDNs, API design, DNS, or WebSockets — you are operating at Layer 7. A WAF (web application firewall) inspects Layer 7 payloads for SQL injection, XSS, etc.',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-900',
    borderClass: 'border-sky-400',
    darkBgClass: 'dark:bg-sky-500/15',
    darkTextClass: 'dark:text-sky-200',
  },
  {
    number: 6,
    name: 'Presentation',
    pdu: 'Data',
    protocols: ['TLS/SSL', 'JPEG/PNG/WebP', 'JSON/XML encoding', 'gzip/brotli compression'],
    BigTechRelevance:
      'TLS termination — converting HTTPS to plaintext HTTP inside the data centre — happens here. When your load balancer holds the TLS certificate, it terminates Layer 6 and forwards plain HTTP to backends, saving CPU on every app server. TLS 1.3 0-RTT allows repeat visitors to send application data in the first packet — zero extra handshake round trips.',
    devices: ['TLS termination proxies', 'Compression gateways', 'CDN edge (TLS)'],
    interviewTip:
      'Know why TLS is terminated at the load balancer: CPU cost of TLS decryption is significant; centralising it means app servers receive pre-decrypted HTTP. Know TLS 1.3 0-RTT: returning users add zero handshake latency.',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-900',
    borderClass: 'border-indigo-400',
    darkBgClass: 'dark:bg-indigo-500/15',
    darkTextClass: 'dark:text-indigo-200',
  },
  {
    number: 5,
    name: 'Session',
    pdu: 'Data',
    protocols: ['TLS session tickets', 'WebSocket sessions', 'RPC sessions'],
    BigTechRelevance:
      'Largely absorbed by TLS (Layer 6) and TCP (Layer 4) in modern systems. Resurfaces with WebSockets — a WebSocket is a persistent Layer 5 session that upgrades from HTTP. TLS session resumption (session tickets) is a Layer 5 optimisation: the server sends a ticket the client presents on reconnect, skipping the full handshake.',
    devices: ['API gateways (session state)', 'WebSocket servers', 'TLS session cache'],
    interviewTip:
      'Session Layer is rarely tested in isolation. Key fact: WebSockets maintain a persistent Layer 5 session over a single TCP connection — no new handshake per message, unlike HTTP polling. TLS 0-RTT session resumption is a Layer 5 optimisation that eliminates reconnect overhead.',
    bgClass: 'bg-violet-100',
    textClass: 'text-violet-900',
    borderClass: 'border-violet-400',
    darkBgClass: 'dark:bg-violet-500/15',
    darkTextClass: 'dark:text-violet-200',
  },
  {
    number: 4,
    name: 'Transport',
    pdu: 'Segment',
    protocols: ['TCP', 'UDP', 'QUIC (UDP-based)', 'SCTP'],
    BigTechRelevance:
      "The most interview-critical networking layer. TCP's 3-way handshake adds 1.5 RTT before data flows — this motivates connection pooling, keep-alive, and QUIC. HTTP/3 runs over QUIC (UDP) to eliminate TCP head-of-line blocking. A Layer 4 load balancer routes on IP+port without reading HTTP — faster but blind to application context. AWS Security Groups are stateful Layer 4 firewalls; NACLs are stateless Layer 3/4.",
    devices: ['Stateful firewalls', 'Layer 4 load balancers', 'NAT gateways', 'TCP proxies'],
    interviewTip:
      'Know the 3-way handshake: SYN → SYN-ACK → ACK. Know TCP head-of-line blocking: one lost packet stalls all HTTP/2 streams on that TCP connection. Know why QUIC/HTTP3 fixes it: independent streams, no shared blocking. L4 vs L7 load balancer is a very common follow-up.',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-400',
    darkBgClass: 'dark:bg-emerald-500/15',
    darkTextClass: 'dark:text-emerald-200',
  },
  {
    number: 3,
    name: 'Network',
    pdu: 'Packet',
    protocols: ['IPv4', 'IPv6', 'ICMP (ping/traceroute)', 'BGP', 'OSPF'],
    BigTechRelevance:
      'IP addressing and routing live here. Anycast routing — how Cloudflare routes users to the nearest PoP by announcing the same IP from 300+ data centres — is a Layer 3 BGP technique. Volumetric DDoS attacks (flood the network with packets) operate at Layer 3. AWS NACLs are stateless Layer 3/4 packet filters. CDN PoP selection is Layer 3 geography.',
    devices: ['Routers', 'Layer 3 switches', 'Stateless firewalls / ACLs', 'CDN PoPs (anycast)'],
    interviewTip:
      'Key distinction: routers (Layer 3, IP decisions) vs switches (Layer 2, MAC decisions). Know anycast: one IP announced from many locations, BGP routes each user to the nearest one — this is how CDN PoP selection works at the network level. AWS VPC route tables are Layer 3 constructs.',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-900',
    borderClass: 'border-orange-400',
    darkBgClass: 'dark:bg-orange-500/15',
    darkTextClass: 'dark:text-orange-200',
  },
  {
    number: 2,
    name: 'Data Link',
    pdu: 'Frame',
    protocols: ['Ethernet (IEEE 802.3)', 'Wi-Fi (802.11)', 'ARP', 'VLAN (802.1Q)'],
    BigTechRelevance:
      'MAC addresses and switches operate here. ARP resolves IP addresses to MAC addresses for local delivery. VLANs (network segmentation in data centres) are Layer 2. In system design, this layer surfaces when discussing data centre topology: spine-leaf architecture separates Layer 2 (leaf switches to servers) from Layer 3 (spine switches for cross-rack routing) to enable east-west traffic at scale.',
    devices: ['Network switches', 'Wi-Fi access points', 'Network bridges'],
    interviewTip:
      'Know: switches use MAC addresses (Layer 2); routers use IP (Layer 3). Know ARP: before your machine can send an IP packet to the next hop (usually the gateway router), it ARPs to find the router\'s MAC address. Spine-leaf data centre topology is a Layer 2/3 design pattern worth knowing.',
    bgClass: 'bg-zinc-100',
    textClass: 'text-zinc-800',
    borderClass: 'border-zinc-400',
    darkBgClass: 'dark:bg-zinc-700/30',
    darkTextClass: 'dark:text-zinc-200',
  },
  {
    number: 1,
    name: 'Physical',
    pdu: 'Bits',
    protocols: ['Ethernet cable (RJ45)', 'Fiber optic', 'Wi-Fi (radio)', 'USB'],
    BigTechRelevance:
      'The physical medium sets the absolute latency floor. Fiber optic signals travel at ~200,000 km/s (2/3 the speed of light). NYC to London is ~5,570 km — minimum one-way latency is 28ms regardless of any software optimisation. Real RTT is ~70ms due to routing, switching, and processing overhead. No amount of caching or CDN placement can beat the speed of light — which is why CDN PoPs exist geographically close to users.',
    devices: ['Network cables', 'Fiber optic cables', 'Network interface cards (NIC)', 'Hubs (legacy)'],
    interviewTip:
      '"Why can\'t you have zero latency between NYC and London?" → fiber optic at ~200,000 km/s → 5,570 km / 200,000 km/s ≈ 28ms one-way. Real RTT ≈ 70ms. This number is load-bearing in back-of-envelope calculations for global services.',
    bgClass: 'bg-zinc-200',
    textClass: 'text-zinc-700',
    borderClass: 'border-zinc-500',
    darkBgClass: 'dark:bg-zinc-600/30',
    darkTextClass: 'dark:text-zinc-300',
  },
]

const DEFAULT_INDEX = 3 // Transport — most interview-critical

interface CanvasProps {
  options: AnimationOptions
  selectedIndex: number
  onSelect: (i: number) => void
}

function OsiCanvas({ selectedIndex, onSelect }: CanvasProps) {
  // selectedIndex is always 0–6 (controlled by the button clicks below)
  const layer = LAYERS[selectedIndex] as OsiLayer

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* Pyramid stack */}
      <div className="flex flex-col items-center gap-1.5 md:w-[46%]">
        <p className="mb-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Click any layer to explore
        </p>
        {LAYERS.map((l, index) => {
          const widthPct = [72, 77, 82, 87, 92, 96, 100][index]
          const isSelected = index === selectedIndex
          return (
            <button
              key={l.number}
              onClick={() => onSelect(index)}
              style={{ width: `${widthPct}%` }}
              className={[
                'flex min-h-[44px] items-center justify-between rounded px-3 py-2',
                'border-2 text-sm font-medium',
                'transition-[colors,transform] active:scale-[0.97]',
                l.bgClass, l.textClass, l.darkBgClass, l.darkTextClass,
                isSelected
                  ? `${l.borderClass} shadow-md`
                  : 'border-transparent opacity-75 hover:opacity-100',
              ].join(' ')}
            >
              <span className="w-5 shrink-0 text-xs font-bold opacity-60">{l.number}</span>
              <span className="flex-1 text-center font-semibold">{l.name}</span>
              <span className="font-mono text-xs opacity-60">{l.pdu}</span>
            </button>
          )
        })}
        <p className="mt-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Sender encapsulates ↓ &nbsp;·&nbsp; Receiver decapsulates ↑
        </p>
      </div>

      {/* Detail panel */}
      <div
        className={[
          'flex-1 rounded-lg border-2 p-4',
          layer.bgClass, layer.darkBgClass, layer.borderClass,
        ].join(' ')}
      >
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <span className={`text-lg font-bold ${layer.textClass} ${layer.darkTextClass}`}>
            Layer {layer.number} — {layer.name}
          </span>
          <span
            className={`ml-auto rounded bg-black/10 dark:bg-white/10 px-2 py-0.5 font-mono text-xs ${layer.textClass} ${layer.darkTextClass}`}
          >
            PDU: {layer.pdu}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          {/* Protocols */}
          <div>
            <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wider opacity-60 ${layer.textClass} ${layer.darkTextClass}`}>
              Protocols &amp; Technologies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {layer.protocols.map((p) => (
                <span
                  key={p}
                  className={`rounded bg-black/10 dark:bg-white/10 px-2 py-0.5 font-mono text-xs ${layer.textClass} ${layer.darkTextClass}`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Devices */}
          <div>
            <p className={`mb-1 text-xs font-semibold uppercase tracking-wider opacity-60 ${layer.textClass} ${layer.darkTextClass}`}>
              Devices at this Layer
            </p>
            <p className={`opacity-90 ${layer.textClass} ${layer.darkTextClass}`}>
              {layer.devices.join(' · ')}
            </p>
          </div>

          {/* Why Big Tech care */}
          <div className="border-t border-black/10 dark:border-white/10 pt-3">
            <p className={`mb-1 text-xs font-semibold uppercase tracking-wider opacity-60 ${layer.textClass} ${layer.darkTextClass}`}>
              Why Big Tech Interviewers Care
            </p>
            <p className={`leading-relaxed opacity-90 ${layer.textClass} ${layer.darkTextClass}`}>
              {layer.BigTechRelevance}
            </p>
          </div>

          {/* Interview tip */}
          <div className="rounded-md bg-black/10 dark:bg-white/10 px-3 py-2.5">
            <p className={`text-xs font-semibold ${layer.textClass} ${layer.darkTextClass}`}>
              Interview tip:
            </p>
            <p className={`mt-0.5 text-xs leading-relaxed opacity-90 ${layer.textClass} ${layer.darkTextClass}`}>
              {layer.interviewTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OsiModelInteractive() {
  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX)
  const [resetKey, setResetKey] = useState(0)

  const handleReset = useCallback(() => {
    setSelectedIndex(DEFAULT_INDEX)
    setResetKey((k) => k + 1)
  }, [])

  return (
    <AnimationShell
      title="OSI Model — 7-Layer Interactive Explorer"
      description="Every protocol, device, and system design concept maps to one of these 7 layers. Click a layer to see what lives there and why it matters in Big Tech interviews. Transport (4) is pre-selected — the most interview-critical layer."
      onReset={handleReset}
      minHeight={440}
    >
      {(options) => (
        <OsiCanvas
          key={resetKey}
          options={options}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}
    </AnimationShell>
  )
}
