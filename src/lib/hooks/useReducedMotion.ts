import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

export function useReducedMotion(): boolean {
  const systemPrefersReduced = useFramerReducedMotion()
  const manuallyPaused = useUIStore((s) => s.animationsPaused)
  return (systemPrefersReduced ?? false) || manuallyPaused
}
