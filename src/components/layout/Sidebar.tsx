'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ChevronRight, Home } from 'lucide-react'
import { topics } from '@/lib/topics'
import type { Cluster } from '@/types/topic'
import { cn } from '@/lib/utils'

const CLUSTER_LABELS: Record<Cluster, string> = {
  'web-foundations': 'Web Foundations',
  'storage':         'Storage',
  'scale':           'Scale',
  'reliability':     'Reliability',
}

const CLUSTERS: Cluster[] = ['web-foundations', 'storage', 'scale', 'reliability']

interface NavProps {
  pathname: string
  onNavigate?: () => void
}

function SidebarNav({ pathname, onNavigate }: NavProps) {
  return (
    <ScrollArea className="flex-1">
      <nav className="p-2">
        {/* Home link */}
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1',
            pathname === '/'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          Home
        </Link>

        <div className="my-1 border-t border-border" />

        {CLUSTERS.map((cluster) => {
          const clusterTopics = topics.filter(
            (t) => t.cluster === cluster && t.status === 'mvp'
          )
          if (clusterTopics.length === 0) return null

          return (
            <Collapsible key={cluster} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100">
                {CLUSTER_LABELS[cluster]}
                <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]_&]:rotate-90" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ul className="mt-1 space-y-0.5 pb-2">
                  {clusterTopics.map((topic) => {
                    const href = `/topics/${topic.slug}`
                    const isActive = pathname === href

                    return (
                      <li key={topic.slug}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-500/10 dark:text-blue-400'
                              : 'text-zinc-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                          )}
                        >
                          <span className="mr-2 text-xs text-muted-foreground/60">
                            {String(topic.order).padStart(2, '0')}
                          </span>
                          {topic.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </nav>
    </ScrollArea>
  )
}

function SidebarHeader() {
  return (
    <div className="flex h-14 items-center border-b border-border px-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Topics
      </span>
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <>
      {/* Desktop inline sidebar — visible at lg+ when open */}
      {sidebarOpen && (
        <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
          <SidebarHeader />
          <SidebarNav pathname={pathname} />
        </aside>
      )}

      {/* Mobile/tablet drawer — slides in from left below lg breakpoint */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarHeader />
          <SidebarNav
            pathname={pathname}
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
