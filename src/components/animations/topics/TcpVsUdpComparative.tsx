'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Comparative } from '@/components/animations/Comparative'
import type { AnimationOptions } from '@/components/animations/AnimationShell'

// ─── Shared types ─────────────────────────────────────────────────────────────

type PktState = 'pending' | 'transit' | 'received' | 'lost' | 'retransmit' | 'recovered'

interface Packet {
  id: number
  state: PktState
}

// ─── Packet chip ─────────────────────────────────────────────────────────────

const PKT_STYLES: Record<PktState, string> = {
  pending:   'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400',
  transit:   'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300',
  received:  'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300',
  lost:      'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300 line-through',
  retransmit:'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300',
  recovered: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300',
}

const PKT_LABELS: Record<PktState, string> = {
  pending:   '···',
  transit:   '→',
  received:  '✓',
  lost:      '✗',
  retransmit:'↺',
  recovered: '✓',
}

function PacketChip({ packet }: { packet: Packet }) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex min-h-[44px] w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition-colors duration-300 ${PKT_STYLES[packet.state]}`}
    >
      <span>P{packet.id}</span>
      <span className="text-[10px] font-normal">{PKT_LABELS[packet.state]}</span>
    </motion.div>
  )
}

// ─── TCP Panel ────────────────────────────────────────────────────────────────
// Sends 6 packets sequentially. Packet 3 is lost and retransmitted.
// Demonstrates: reliable, ordered, retransmission — but slower.

type TcpPhase = 'idle' | 'p1' | 'p2' | 'p3-lost' | 'p4' | 'p5' | 'p6' | 'retransmit' | 'done' | 'pause'

const TCP_PHASE_SEQUENCE: TcpPhase[] = [
  'idle', 'p1', 'p2', 'p3-lost', 'p4', 'p5', 'p6', 'retransmit', 'done', 'pause'
]

function TcpPanel({ options }: { options: AnimationOptions }) {
  const STEP_MS = 700 * options.speedMultiplier
  const [phase, setPhase] = useState<TcpPhase>('idle')
  const [packets, setPackets] = useState<Packet[]>([
    { id: 1, state: 'pending' },
    { id: 2, state: 'pending' },
    { id: 3, state: 'pending' },
    { id: 4, state: 'pending' },
    { id: 5, state: 'pending' },
    { id: 6, state: 'pending' },
  ])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (options.paused) return

    const nextPhaseIndex = TCP_PHASE_SEQUENCE.indexOf(phase) + 1
    const next = TCP_PHASE_SEQUENCE[nextPhaseIndex] as TcpPhase | undefined
    if (!next) return

    const delay = phase === 'p3-lost' ? STEP_MS * 2.5
                : phase === 'done'    ? STEP_MS * 4
                : phase === 'pause'   ? STEP_MS * 2
                : STEP_MS

    timerRef.current = setTimeout(() => {
      setPhase(next)

      setPackets((prev) => {
        // Use map so TypeScript knows each element is a defined Packet —
        // array index access (p[i]) returns Packet|undefined in strict mode.
        const stateByIndex: Record<number, PktState> = {}
        if (next === 'p1')         stateByIndex[0] = 'received'
        if (next === 'p2')         stateByIndex[1] = 'received'
        if (next === 'p3-lost')    stateByIndex[2] = 'lost'
        if (next === 'p4')         stateByIndex[3] = 'received'
        if (next === 'p5')         stateByIndex[4] = 'received'
        if (next === 'p6')         stateByIndex[5] = 'received'
        if (next === 'retransmit') stateByIndex[2] = 'retransmit'
        if (next === 'done')       stateByIndex[2] = 'recovered'
        const p = prev.map((pkt, i): Packet =>
          i in stateByIndex ? { id: pkt.id, state: stateByIndex[i] as PktState } : pkt
        )
        if (next === 'pause') {
          return [
            { id: 1, state: 'pending' },
            { id: 2, state: 'pending' },
            { id: 3, state: 'pending' },
            { id: 4, state: 'pending' },
            { id: 5, state: 'pending' },
            { id: 6, state: 'pending' },
          ]
        }
        return p
      })

      if (next === 'pause') {
        setTimeout(() => setPhase('idle'), 10)
      }
    }, delay)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, options.paused, STEP_MS])

  const isDone = phase === 'done'
  const isLost = phase === 'p3-lost' || phase === 'p4' || phase === 'p5' || phase === 'p6'
  const isRetransmit = phase === 'retransmit'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {packets.map((pkt) => <PacketChip key={pkt.id} packet={pkt} />)}
      </div>

      <AnimatePresence mode="wait">
        {isLost && !isRetransmit && (
          <motion.p
            key="lost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            ✗ Packet 3 lost — TCP detects via missing ACK, will retransmit
          </motion.p>
        )}
        {isRetransmit && (
          <motion.p
            key="retry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-amber-600 dark:text-amber-400"
          >
            ↺ Retransmitting Packet 3…
          </motion.p>
        )}
        {isDone && (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            ✓ All 6 packets delivered in order. Reliable — at the cost of retransmission delay.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-auto rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs">
        <p className="font-semibold text-zinc-700 dark:text-zinc-200">TCP guarantees</p>
        <p className="text-zinc-500 dark:text-zinc-400">Ordered · Reliable · ACK-based · Connection required</p>
        <p className="text-zinc-500 dark:text-zinc-400">Use: HTTP, databases, file transfer, anything correctness-critical</p>
      </div>
    </div>
  )
}

// ─── UDP Panel ────────────────────────────────────────────────────────────────
// Fires 6 packets simultaneously. Packets 2 and 5 are lost. No retransmission.
// Demonstrates: fast, low-overhead — but no delivery guarantee.

type UdpPhase = 'idle' | 'burst' | 'results' | 'pause'

function UdpPanel({ options }: { options: AnimationOptions }) {
  const STEP_MS = 700 * options.speedMultiplier
  const [phase, setPhase] = useState<UdpPhase>('idle')
  const [packets, setPackets] = useState<Packet[]>([
    { id: 1, state: 'pending' },
    { id: 2, state: 'pending' },
    { id: 3, state: 'pending' },
    { id: 4, state: 'pending' },
    { id: 5, state: 'pending' },
    { id: 6, state: 'pending' },
  ])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (options.paused) return

    if (phase === 'idle') {
      timerRef.current = setTimeout(() => {
        setPhase('burst')
        setPackets((prev) => prev.map((p) => ({ ...p, state: 'transit' as PktState })))
      }, STEP_MS)
    } else if (phase === 'burst') {
      timerRef.current = setTimeout(() => {
        setPhase('results')
        setPackets([
          { id: 1, state: 'received' },
          { id: 2, state: 'lost' },
          { id: 3, state: 'received' },
          { id: 4, state: 'received' },
          { id: 5, state: 'lost' },
          { id: 6, state: 'received' },
        ])
      }, STEP_MS * 1.5)
    } else if (phase === 'results') {
      timerRef.current = setTimeout(() => {
        setPhase('pause')
        setPackets(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, state: 'pending' as PktState })))
      }, STEP_MS * 4)
    } else if (phase === 'pause') {
      timerRef.current = setTimeout(() => setPhase('idle'), STEP_MS)
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, options.paused, STEP_MS])

  const delivered = packets.filter((p) => p.state === 'received').length
  const isDone = phase === 'results'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {packets.map((pkt) => <PacketChip key={pkt.id} packet={pkt} />)}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'burst' && (
          <motion.p
            key="burst"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-blue-600 dark:text-blue-400"
          >
            → All 6 packets fired simultaneously — no connection setup, no ordering
          </motion.p>
        )}
        {isDone && (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            ✗ {delivered}/6 delivered — 2 lost. No retransmission. Sender never knows.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-auto rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs">
        <p className="font-semibold text-zinc-700 dark:text-zinc-200">UDP trade-offs</p>
        <p className="text-zinc-500 dark:text-zinc-400">No ordering · No guarantee · No ACK · No connection</p>
        <p className="text-zinc-500 dark:text-zinc-400">Use: video/audio streaming, DNS, gaming, QUIC (HTTP/3)</p>
      </div>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function TcpVsUdpComparative() {
  return (
    <Comparative
      title="TCP vs UDP — Reliability vs Speed"
      description="TCP guarantees every packet arrives in order — at the cost of retransmission overhead. UDP fires packets and moves on — lower latency, no guarantees. Watch how each handles a lost packet (P3 for TCP, P2/P5 for UDP)."
      left={{
        label: 'TCP — Reliable, Ordered',
        colour: 'var(--anim-success)',
        render: (options) => <TcpPanel options={options} />,
      }}
      right={{
        label: 'UDP — Fast, Best-Effort',
        colour: 'var(--anim-error)',
        render: (options) => <UdpPanel options={options} />,
      }}
    />
  )
}
