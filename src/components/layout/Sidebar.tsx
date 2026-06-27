'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
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

export function Sidebar() {
  const { sidebarOpen } = useUIStore()
  const pathname = usePathname()

  if (!sidebarOpen) return null

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Topics
        </span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2">
          {CLUSTERS.map((cluster) => {
            const clusterTopics = topics.filter(
              (t) => t.cluster === cluster && t.status === 'mvp'
            )
            if (clusterTopics.length === 0) return null

            return (
              <Collapsible key={cluster} defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent">
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
                            className={cn(
                              'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-accent font-medium text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
    </aside>
  )
}
