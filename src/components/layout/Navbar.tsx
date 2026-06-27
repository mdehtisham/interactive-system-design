'use client'

import { useTheme } from 'next-themes'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Menu, Moon, Sun, PauseCircle, PlayCircle } from 'lucide-react'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, animationsPaused, toggleAnimations } = useUIStore()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="min-h-11 min-w-11"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="hidden font-semibold text-sm sm:block">
          Interactive System Design
        </span>
      </div>

      {/* Right: animation toggle + theme toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAnimations}
          aria-label={animationsPaused ? 'Resume animations' : 'Pause animations'}
          className="min-h-11 min-w-11"
          title={animationsPaused ? 'Resume animations' : 'Pause animations'}
        >
          {animationsPaused
            ? <PlayCircle className="h-5 w-5" />
            : <PauseCircle className="h-5 w-5" />
          }
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="min-h-11 min-w-11"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  )
}
