'use client'

import { PassiveFlow } from '@/components/animations/PassiveFlow'

const NODES = [
  {
    id: 'browser',
    label: 'Your Browser',
    tooltip: 'Application Layer (7). Generates HTTP request: GET /page HTTP/1.1. This is the raw data before any networking headers are added.',
  },
  {
    id: 'tcp',
    label: 'TCP Layer',
    tooltip: 'Transport Layer (4). Wraps data in a TCP segment: adds source port (e.g. 52341), destination port (443), sequence number, and checksum. Enables reliable ordered delivery.',
  },
  {
    id: 'ip',
    label: 'IP Layer',
    tooltip: 'Network Layer (3). Wraps TCP segment in an IP packet: adds source IP (192.168.1.5), destination IP (93.184.216.34), and TTL. This is the address the internet routes on.',
  },
  {
    id: 'nic-send',
    label: 'NIC (send)',
    tooltip: 'Data Link Layer (2) + Physical Layer (1). Wraps IP packet in an Ethernet frame with MAC addresses, then converts to electrical signals or photons. Leaves your machine as bits on a wire.',
  },
  {
    id: 'internet',
    label: 'Internet Routers',
    tooltip: 'Network Layer (3). Each router reads only the IP header (destination IP), looks up its routing table, and forwards the packet to the next hop. Routers do not read TCP or HTTP — just the IP address.',
  },
  {
    id: 'nic-recv',
    label: 'NIC (receive)',
    tooltip: "Data Link Layer (2) + Physical Layer (1). Server's NIC receives bits, assembles into an Ethernet frame, strips the MAC header, and passes the IP packet up the stack.",
  },
  {
    id: 'ip-recv',
    label: 'IP Layer',
    tooltip: 'Network Layer (3). Server strips the IP header, verifies destination IP is its own, and passes the TCP segment to the Transport Layer.',
  },
  {
    id: 'tcp-recv',
    label: 'TCP Layer',
    tooltip: 'Transport Layer (4). Server strips TCP header, verifies checksum, reassembles segments in sequence order, and passes the complete HTTP request bytes to the application.',
  },
  {
    id: 'server',
    label: 'Server App',
    tooltip: 'Application Layer (7). Server receives the complete HTTP request, processes it (database query, business logic), and sends back HTTP 200 OK — which travels back through the same stack in reverse.',
  },
]

export function NetworkPacketFlow() {
  return (
    <PassiveFlow
      title="Packet Encapsulation — Down the Sender Stack, Up the Receiver Stack"
      description="Each layer adds a header (encapsulation) on the way out, and strips it (decapsulation) on the way in. Hover or tap any node to see what that layer adds or removes. The internet only routes on Layer 3 IP addresses — all other headers are ignored by routers in transit."
      nodes={NODES}
      stepDurationMs={1500}
      completionMessage="Full round trip: 9 layer transitions. Each transition adds ~microseconds of overhead — negligible compared to the speed-of-light latency floor."
    />
  )
}
