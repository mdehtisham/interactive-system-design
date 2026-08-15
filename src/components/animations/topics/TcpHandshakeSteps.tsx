'use client'

import { StepThrough } from '@/components/animations/StepThrough'

function ArrowDiagram({
  from,
  arrow,
  to,
  label,
  colour,
  note,
}: {
  from: string
  arrow: string
  to: string
  label: string
  colour: string
  note?: string
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full max-w-xs items-center justify-between gap-2">
        <span className="min-w-[60px] rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 px-2 py-1.5 text-center text-xs font-bold text-blue-800 dark:text-blue-200">
          {from}
        </span>
        <div className="flex flex-1 flex-col items-center">
          <span className="mb-0.5 text-xs font-mono font-semibold" style={{ color: colour }}>
            {label}
          </span>
          <div className="flex w-full items-center">
            {arrow === '→' ? (
              <>
                <div className="h-0.5 flex-1 rounded" style={{ backgroundColor: colour }} />
                <span style={{ color: colour }} className="ml-0.5 text-base leading-none">▶</span>
              </>
            ) : arrow === '←' ? (
              <>
                <span style={{ color: colour }} className="mr-0.5 text-base leading-none">◀</span>
                <div className="h-0.5 flex-1 rounded" style={{ backgroundColor: colour }} />
              </>
            ) : (
              <div className="h-0.5 flex-1 rounded border-dashed" style={{ borderColor: colour, borderWidth: 1 }} />
            )}
          </div>
        </div>
        <span className="min-w-[60px] rounded-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600 px-2 py-1.5 text-center text-xs font-bold text-orange-800 dark:text-orange-200">
          {to}
        </span>
      </div>
      {note && (
        <p className="max-w-xs text-center text-xs text-zinc-500 dark:text-zinc-400 italic">
          {note}
        </p>
      )}
    </div>
  )
}

const STEPS = [
  {
    title: 'Before the Handshake',
    description:
      'Client and Server exist independently with no connection between them. TCP is connection-oriented — before any data can flow, both sides must agree to communicate. This agreement takes 1.5 round trips (RTT). At 70ms RTT between continents, that is 105ms of pure handshake overhead before the first byte of application data travels. This latency cost is what motivates keep-alive connections, connection pooling, and ultimately HTTP/3 with QUIC.',
    visual: (
      <div className="flex w-full max-w-xs items-center justify-between gap-4">
        <span className="rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 px-3 py-2 text-xs font-bold text-blue-800 dark:text-blue-200">
          Client
        </span>
        <div className="flex flex-1 items-center gap-1">
          <div className="h-0.5 flex-1 border-t-2 border-dashed border-zinc-300 dark:border-zinc-600" />
        </div>
        <span className="rounded-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600 px-3 py-2 text-xs font-bold text-orange-800 dark:text-orange-200">
          Server
        </span>
      </div>
    ),
    colour: 'var(--anim-idle)',
  },
  {
    title: 'Step 1 of 3 — SYN (Synchronise)',
    description:
      'Client sends a SYN packet to Server. SYN = "Synchronise" — the client is advertising its initial sequence number (ISN). The ISN is a random number chosen to avoid conflicts with previous connections on the same port. The server is now in SYN_RECEIVED state. No data has been sent yet — this packet exists purely to establish the parameters of the connection.',
    visual: (
      <ArrowDiagram
        from="Client"
        arrow="→"
        to="Server"
        label="SYN (SEQ=x)"
        colour="#3b82f6"
        note="Client's random initial sequence number x"
      />
    ),
    colour: '#3b82f6',
  },
  {
    title: 'Step 2 of 3 — SYN-ACK (Synchronise-Acknowledge)',
    description:
      'Server responds with SYN-ACK. This single packet does two things: (1) ACK=x+1 acknowledges the client\'s SYN and tells the client "I received up to byte x, send x+1 next." (2) SEQ=y is the server\'s own initial sequence number — the server is also synchronising its own sequence counter. The client is now in ESTABLISHED state. The server is still in SYN_RECEIVED.',
    visual: (
      <ArrowDiagram
        from="Client"
        arrow="←"
        to="Server"
        label="SYN-ACK (SEQ=y, ACK=x+1)"
        colour="#f59e0b"
        note="Server acknowledges x and introduces its own SEQ y"
      />
    ),
    colour: '#f59e0b',
  },
  {
    title: 'Step 3 of 3 — ACK (Acknowledge)',
    description:
      'Client sends a final ACK to the server. ACK=y+1 acknowledges the server\'s SYN-ACK. The server is now in ESTABLISHED state. The connection is open. 1.5 RTTs have elapsed. Application data (HTTP request, database query, etc.) can now flow in both directions. Both sides track sequence numbers to detect lost packets and ensure in-order delivery.',
    visual: (
      <ArrowDiagram
        from="Client"
        arrow="→"
        to="Server"
        label="ACK (ACK=y+1)"
        colour="#16a34a"
        note="Connection ESTABLISHED — 1.5 RTTs elapsed"
      />
    ),
    colour: '#16a34a',
  },
  {
    title: 'Connection Established — Data Flows',
    description:
      'Both client and server are in ESTABLISHED state. Data flows bidirectionally with reliability guarantees: every segment is acknowledged, lost segments are retransmitted, and segments are reassembled in order. The sequence numbers from the handshake are used to track which bytes have been received. This reliability makes TCP ideal for HTTP, database connections, and any protocol where correctness matters more than speed.',
    visual: (
      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <ArrowDiagram from="Client" arrow="→" to="Server" label="DATA (HTTP request)" colour="#16a34a" />
        <ArrowDiagram from="Client" arrow="←" to="Server" label="ACK + DATA (HTTP response)" colour="#16a34a" />
      </div>
    ),
    colour: '#16a34a',
  },
  {
    title: '4-Way Termination — FIN/FIN-ACK',
    description:
      'Either side can initiate connection close. TCP uses a 4-way termination (not 3-way) because each direction closes independently: (1) Initiator sends FIN. (2) Receiver ACKs the FIN. (3) Receiver sends its own FIN when ready. (4) Initiator ACKs. The connection enters TIME_WAIT state for 2× MSL (Maximum Segment Lifetime, typically 60s) to absorb any delayed packets. TIME_WAIT is a common source of port exhaustion at high connection rates — which is why persistent connections and connection pooling are important.',
    visual: (
      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <ArrowDiagram from="Client" arrow="→" to="Server" label="FIN" colour="#dc2626" />
        <ArrowDiagram from="Client" arrow="←" to="Server" label="ACK" colour="#f59e0b" />
        <ArrowDiagram from="Client" arrow="←" to="Server" label="FIN" colour="#dc2626" />
        <ArrowDiagram from="Client" arrow="→" to="Server" label="ACK → TIME_WAIT" colour="#f59e0b" />
      </div>
    ),
    colour: '#dc2626',
  },
]

export function TcpHandshakeSteps() {
  return (
    <StepThrough
      title="TCP 3-Way Handshake — Step by Step"
      description="TCP requires a 3-step agreement before any data flows. Each step advances the connection state on both sides. Step through to see exactly what is exchanged and why it exists."
      steps={STEPS}
    />
  )
}
