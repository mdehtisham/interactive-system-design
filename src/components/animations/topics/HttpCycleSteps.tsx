'use client'

import { StepThrough } from '../StepThrough'

const HTTP_STEPS = [
  {
    title: 'DNS Lookup',
    description:
      'Before the browser can connect to anything, it must resolve the domain name to an IP address. It checks its own cache, then the OS cache, then queries the recursive resolver. If cached: <1ms. Cold lookup with a full DNS chain: 300–500ms.',
    colour: 'var(--anim-data)',
  },
  {
    title: 'TCP SYN — "Can we talk?"',
    description:
      'The browser opens a TCP connection to the server\'s IP. Step 1: it sends a SYN (synchronise) packet — essentially saying "I\'d like to connect." The connection is not yet open. This is one half of the first round trip.',
    colour: 'var(--anim-pending)',
  },
  {
    title: 'TCP SYN-ACK — "Yes, I\'m here"',
    description:
      'The server replies with a SYN-ACK (synchronise-acknowledge): "I received your SYN, I\'m ready." One full round trip (RTT) has now elapsed since the browser sent the SYN.',
    colour: 'var(--anim-pending)',
  },
  {
    title: 'TCP ACK — Handshake Complete',
    description:
      'The browser sends a final ACK (acknowledge) confirming it received the SYN-ACK. The TCP connection is now established. This 3-step SYN → SYN-ACK → ACK sequence costs exactly 1 RTT before a single byte of HTTP is sent.',
    colour: 'var(--anim-data)',
  },
  {
    title: 'TLS Handshake — Encryption Negotiation',
    description:
      'For HTTPS (which is everything today), the browser and server negotiate encryption keys. TLS 1.3 (the current standard) needs just 1 additional RTT. TLS 1.2 needs 2. This is why upgrading to TLS 1.3 measurably reduces page load time — it saves one full round trip.',
    colour: 'var(--anim-pending)',
  },
  {
    title: 'HTTP Request — The Actual Ask',
    description:
      'Now the browser sends the real request: GET /path HTTP/2, plus headers like User-Agent, Accept-Encoding, and cookies. For HTTP/2, multiple requests can travel over one TCP connection simultaneously — no more one-at-a-time like HTTP/1.1.',
    colour: 'var(--anim-data)',
  },
  {
    title: 'HTTP Response — The Server Replies',
    description:
      'The server responds with a status code (200 OK, 301 Redirect, 404 Not Found, etc.), headers (Content-Type, Cache-Control, Set-Cookie), and the HTML body. TTFB — Time to First Byte — is measured when the first byte of the response arrives.',
    colour: 'var(--anim-success)',
  },
  {
    title: 'Browser Render — Pixels on Screen',
    description:
      'The browser parses HTML → builds the DOM tree → discovers linked CSS and JavaScript → fetches sub-resources in parallel (HTTP/2 multiplexing) → applies styles → paints pixels. Render-blocking scripts in <head> pause this entire pipeline — hence async and defer attributes.',
    colour: 'var(--anim-success)',
  },
]

export function HttpCycleSteps() {
  return (
    <StepThrough
      title="HTTP Request-Response Cycle"
      description="Step through every phase from URL typed to page rendered. Click Next to advance at your own pace."
      steps={HTTP_STEPS}
    />
  )
}
