import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  animationsPaused: boolean
  pageHasAnimations: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleAnimations: () => void
  setPageHasAnimations: (has: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      animationsPaused: false,
      pageHasAnimations: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleAnimations: () => set((s) => ({ animationsPaused: !s.animationsPaused })),
      setPageHasAnimations: (has) => set({ pageHasAnimations: has }),
    }),
    {
      name: 'ui-preferences',
      // pageHasAnimations is transient — not persisted across sessions
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen, animationsPaused: s.animationsPaused }),
    }
  )
)
