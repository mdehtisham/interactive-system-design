'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * These IDs must exactly match what the `slugify()` function in MDXComponents
 * produces from the heading text used in every topic MDX file.
 *
 * Heading text → slugified ID:
 *   "ELI5 Foundation"  → "eli5-foundation"
 *   "FAANG Deep-Dive"  → "faang-deep-dive"
 *   "Implementation"   → "implementation"
 *   "Schema"           → "schema"
 *   "Animations"       → "animations"
 *   "Common Mistakes"  → "common-mistakes"
 *   "Interview Prep"   → "interview-prep"
 */
const SECTIONS = [
  { id: 'eli5-foundation',  label: 'ELI5 Foundation' },
  { id: 'faang-deep-dive',  label: 'FAANG Deep-Dive' },
  { id: 'implementation',   label: 'Implementation' },
  { id: 'schema',           label: 'DB & API Schema' },
  { id: 'animations',       label: 'Animations' },
  { id: 'common-mistakes',  label: 'Common Mistakes' },
  { id: 'interview-prep',   label: 'Interview Prep' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function TableOfContents() {
  const [activeId, setActiveId] = useState<SectionId | ''>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const elements = SECTIONS.flatMap(({ id }) => {
      const el = document.getElementById(id)
      return el ? [el] : []
    })

    if (elements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Among all currently-intersecting entries, take the one nearest the
        // top of the viewport so the TOC always tracks the reading position.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        const topEntry = visible[0]
        if (topEntry) {
          setActiveId(topEntry.target.id as SectionId)
        }
      },
      // Top margin accounts for the 56px navbar. Bottom -55% means a section
      // must be in the top 45% of the viewport to become active — prevents
      // two sections lighting up simultaneously on tall viewports.
      { rootMargin: '-56px 0px -55% 0px', threshold: 0 }
    )

    elements.forEach((el) => observerRef.current!.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>

      {/*
       * Vertical rail pattern (used by Tailwind docs, Next.js docs, shadcn/ui docs):
       * - `ul` carries a 1px left border — the rail line
       * - Each `Link` has `-ml-px border-l-2`: the negative margin makes the
       *   2px active border overlap and replace the 1px rail, so there's no
       *   double-border effect
       * - Active: primary-coloured left border + full-opacity text
       * - Hover: muted border tint + subtle bg + pointer cursor — immediately
       *   signals "these are clickable links", not static text
       */}
      {/*
       * Rail pattern: ul has a 1px left border (the rail).
       * Each Link uses -ml-px + border-l-2 so the 2px active/hover border
       * overlaps the rail without creating a double-border.
       *
       * Hover colours use explicit palette values (zinc-100 / zinc-800) rather
       * than CSS-variable-based classes like bg-accent, which resolve to an
       * almost-white neutral that is invisible on a white background.
       */}
      <ul className="border-l border-zinc-200 dark:border-zinc-700">
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id

          return (
            <li key={section.id}>
              <Link
                href={`#${section.id}`}
                className={cn(
                  '-ml-px flex cursor-pointer select-none items-center border-l-2 py-1.5 pl-3 text-sm transition-all duration-150',
                  isActive
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
