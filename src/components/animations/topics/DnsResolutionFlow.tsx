'use client'

import { PassiveFlow } from '../PassiveFlow'

const DNS_NODES = [
  {
    id: 'browser',
    label: 'Browser',
    tooltip:
      'Your browser checks its local DNS cache first. Cached entries are valid for the TTL duration — often just 60–300 seconds.',
  },
  {
    id: 'os-cache',
    label: 'OS Cache',
    tooltip:
      'The operating system keeps its own DNS cache, separate from the browser\'s. On Windows, run ipconfig /flushdns to clear it. On Mac: sudo dscacheutil -flushcache.',
  },
  {
    id: 'resolver',
    label: 'Recursive\nResolver',
    tooltip:
      'Usually your ISP\'s server or a public resolver like Google\'s 8.8.8.8 or Cloudflare\'s 1.1.1.1. It does the legwork on your behalf, querying up the DNS hierarchy so you don\'t have to.',
  },
  {
    id: 'root-ns',
    label: 'Root\nNameserver',
    tooltip:
      '13 root server clusters exist worldwide (operated by ICANN, Verisign, NASA, and others). They don\'t know your IP — they only know which TLD nameserver to ask next.',
  },
  {
    id: 'tld-ns',
    label: 'TLD\nNameserver',
    tooltip:
      'Managed by the TLD registry (Verisign for .com, ICANN for .org). Knows which authoritative nameserver is responsible for your specific domain.',
  },
  {
    id: 'auth-ns',
    label: 'Authoritative\nNS',
    tooltip:
      'Your domain registrar\'s server (e.g., AWS Route 53, Cloudflare DNS, GoDaddy). Has the actual DNS records — A, CNAME, MX — and returns the real IP address.',
  },
  {
    id: 'ip',
    label: 'IP Address',
    tooltip:
      'The numeric address (e.g., 93.184.216.34) the browser uses to open a TCP connection to the web server. Only now can the actual HTTP request begin.',
  },
]

export function DnsResolutionFlow() {
  return (
    <PassiveFlow
      title="DNS Resolution Pipeline"
      description="A DNS query travelling from your browser to the authoritative nameserver and back. Hover or tap any node to learn its role."
      nodes={DNS_NODES}
      stepDurationMs={1200}
      completionMessage="Full resolution: ~300–500ms cold. From OS cache: <1ms."
    />
  )
}
