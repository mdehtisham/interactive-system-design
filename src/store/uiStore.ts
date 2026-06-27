import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  animationsPaused: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleAnimations: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      animationsPaused: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleAnimations: () => set((s) => ({ animationsPaused: !s.animationsPaused })),
    }),
    { name: 'ui-preferences' }
  )
)
