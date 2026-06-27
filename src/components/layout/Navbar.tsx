'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Home, Menu, Moon, Sun, PauseCircle, PlayCircle } from 'lucide-react'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, animationsPaused, toggleAnimations, pageHasAnimations } = useUIStore()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: sidebar toggle + home + brand */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="min-h-11 min-w-11"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className="min-h-11 min-w-11"
        >
          <Link href="/" aria-label="Go to homepage">
            <Home className="h-5 w-5" />
          </Link>
        </Button>

        <Link
          href="/"
          className="hidden font-semibold text-sm sm:block hover:text-foreground/80 transition-colors"
        >
          Interactive System Design
        </Link>
      </div>

      {/* Right: animation toggle (only when page has animations) + theme toggle */}
      <div className="flex items-center gap-2">
        {pageHasAnimations && (
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
        )}

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
