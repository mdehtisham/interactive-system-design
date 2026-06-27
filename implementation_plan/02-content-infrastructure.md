# 02 — Content Infrastructure

## Goal

Build the machinery that turns MDX files into rendered topic pages — without writing any actual topic content yet. After this phase, all 14 `/topics/[slug]` URLs load a properly structured 7-section page shell, Mermaid diagrams render in the browser, code blocks are syntax-highlighted, and all four animation shell components are wired up and pause-aware.

No topic prose is written in this phase. Prose and animations are Phase 03+.

---

## Decisions

| Concern | Decision | Reason |
|---|---|---|
| MDX compilation | `next-mdx-remote` (RSC variant) | Avoids Turbopack serialization issue — MDX compiles server-side, outside Turbopack's module graph |
| Syntax highlighting | `@shikijs/rehype` via `next-mdx-remote` rehype plugins | Already installed; build-time, zero client JS |
| Mermaid rendering | Client-side (`mermaid` npm package, `useEffect`) | Avoids Playwright in Phase 02; build-time SVG upgrade deferred to post-MVP |
| Topic page nav | In-page anchor links (sticky TOC on desktop) | No router needed; browser handles scroll-to-anchor |
| Animation data | Props passed to shell components | No animation logic inside MDX or page files |

---

## Step 1 — Install `next-mdx-remote` and `mermaid`

```bash
npm install next-mdx-remote mermaid
npm install -D @types/mermaid
```

**Why `next-mdx-remote`:** Unlike `@next/mdx` (which requires Turbopack-compatible plugin serialization), `next-mdx-remote` compiles MDX in a server component via `compileMDX()`. Remark/rehype plugins run as normal Node functions — no Turbopack constraint.

Update `package.json` dev script to suppress the Turbopack root-collision warning seen in Phase 01:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest"
}
```

> Note: Turbopack is fine for dev (no MDX in the module graph — `next-mdx-remote` runs server-side only). If Turbopack causes issues with mermaid's client bundle, fall back to `next dev` (without `--turbopack`).

---

## Step 2 — MDX Frontmatter Type

Create `src/types/mdx.ts`:

```ts
export interface TopicFrontmatter {
  title: string
  description: string
  order: number
  cluster: string
  difficulty: 'easy' | 'medium' | 'hard'
  interviewFrequency: 'high' | 'medium' | 'low'
  prerequisites: string[]   // array of slugs
}
```

---

## Step 3 — MDX Utility

Create `src/lib/mdx.ts`:

```ts
import fs from 'fs'
import path from 'path'
import { compileMDX } from 'next-mdx-remote/rsc'
import rehypeShiki from '@shikijs/rehype'
import remarkGfm from 'remark-gfm'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import type { TopicFrontmatter } from '@/types/mdx'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'topics')

export function getTopicSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

export async function getTopicContent(slug: string) {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const raw = fs.readFileSync(filePath, 'utf8')

  const { content, frontmatter } = await compileMDX<TopicFrontmatter>({
    source: raw,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              themes: { dark: 'github-dark', light: 'github-light' },
            },
          ],
        ],
      },
    },
  })

  return { content, frontmatter }
}
```

---

## Step 4 — Topic Page Layout (7-Section Shell)

Replace the placeholder `src/app/topics/[slug]/page.tsx` with the full shell. The page fetches MDX content and renders it inside a structured layout with:
- Page header: title, description, difficulty/frequency badges, prerequisites block
- Sticky in-page TOC (desktop only, `lg:` breakpoint)
- 7 named sections with anchor IDs
- Full-width content on mobile, 3/4 width with TOC sidebar on desktop

```tsx
// src/app/topics/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTopicContent, getTopicSlugs } from '@/lib/mdx'
import { getTopicBySlug } from '@/lib/topics'
import { TopicHeader } from '@/components/topic/TopicHeader'
import { TableOfContents } from '@/components/topic/TableOfContents'

export function generateStaticParams() {
  return getTopicSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) return {}
  return { title: `${topic.title} — Interactive System Design` }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const { content, frontmatter } = await getTopicContent(slug)

  return (
    <div className="mx-auto max-w-5xl">
      <TopicHeader topic={topic} frontmatter={frontmatter} />

      <div className="mt-8 flex gap-8">
        {/* Main content */}
        <article className="min-w-0 flex-1 prose prose-neutral dark:prose-invert max-w-none">
          {content}
        </article>

        {/* Desktop TOC */}
        <aside className="hidden xl:block w-56 shrink-0">
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
```

**Section anchor IDs** (every topic MDX must use these exact headings so the TOC links work):

| Section | Heading text | Anchor ID |
|---|---|---|
| 1 | ELI5 Foundation | `#eli5` |
| 2 | FAANG Deep-Dive | `#deep-dive` |
| 3 | Implementation | `#implementation` |
| 4 | Database & API Schema | `#schema` |
| 5 | Visual Aids & Animations | `#animations` |
| 6 | Common Mistakes | `#mistakes` |
| 7 | Interview Prep | `#interview` |

---

## Step 5 — TopicHeader Component

Create `src/components/topic/TopicHeader.tsx`:

Renders:
- Topic title (`h1`)
- Description subtitle
- Difficulty badge (colour-coded: green=easy, yellow=medium, red=hard)
- Interview frequency badge (colour-coded: red=high, yellow=medium, grey=low)
- Prerequisites block: "Requires: [link1], [link2]" or "No prerequisites" — uses `getTopicBySlug()` to resolve each slug to a title

```tsx
// src/components/topic/TopicHeader.tsx
import Link from 'next/link'
import { getTopicBySlug } from '@/lib/topics'
import { cn } from '@/lib/utils'
import type { Topic } from '@/types/topic'
import type { TopicFrontmatter } from '@/types/mdx'

const DIFFICULTY_STYLES = {
  easy:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const FREQ_STYLES = {
  high:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low:    'bg-muted text-muted-foreground',
}

interface Props {
  topic: Topic
  frontmatter: TopicFrontmatter
}

export function TopicHeader({ topic, frontmatter }: Props) {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFFICULTY_STYLES[topic.difficulty])}>
          {topic.difficulty}
        </span>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', FREQ_STYLES[topic.interviewFrequency])}>
          {topic.interviewFrequency === 'high' ? 'High interview frequency' : `${topic.interviewFrequency} frequency`}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{frontmatter.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{frontmatter.description}</p>

      {/* Prerequisites block */}
      <div className="mt-4 text-sm">
        {topic.prerequisites.length === 0 ? (
          <p className="text-muted-foreground">No prerequisites — start here.</p>
        ) : (
          <div>
            <span className="font-medium">Prerequisites: </span>
            {topic.prerequisites.map((slug, i) => {
              const prereq = getTopicBySlug(slug)
              return (
                <span key={slug}>
                  {i > 0 && ', '}
                  <Link href={`/topics/${slug}`} className="text-primary underline underline-offset-4">
                    {prereq?.title ?? slug}
                  </Link>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Step 6 — TableOfContents Component

Create `src/components/topic/TableOfContents.tsx`:

Static anchor links to the 7 sections. Sticks to the top of the viewport while scrolling (`sticky top-8`). Active section is highlighted via `IntersectionObserver` (client component).

```tsx
'use client'
// src/components/topic/TableOfContents.tsx

const SECTIONS = [
  { id: 'eli5',           label: 'ELI5 Foundation' },
  { id: 'deep-dive',      label: 'FAANG Deep-Dive' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'schema',         label: 'DB & API Schema' },
  { id: 'animations',     label: 'Animations' },
  { id: 'mistakes',       label: 'Common Mistakes' },
  { id: 'interview',      label: 'Interview Prep' },
]
```

Use `IntersectionObserver` on each section heading to track which is visible, highlight the corresponding TOC link.

---

## Step 7 — MDX Component Map

Create `src/components/mdx/MDXComponents.tsx`:

Maps HTML elements produced by MDX to custom React components. This is the customization layer — headings get anchor IDs, code blocks get the Shiki wrapper, `<Mermaid>` renders the diagram client-side.

```tsx
// src/components/mdx/MDXComponents.tsx
import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './CodeBlock'
import { MermaidDiagram } from './MermaidDiagram'

export const mdxComponents: MDXComponents = {
  // Headings: add id attributes for anchor links
  h2: ({ children, ...props }) => (
    <h2 id={slugify(String(children))} className="scroll-mt-20" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 id={slugify(String(children))} className="scroll-mt-20" {...props}>
      {children}
    </h3>
  ),
  // Code: pre elements rendered by Shiki come through here
  pre: CodeBlock,
  // Custom MDX components available in all topic files
  Mermaid: MermaidDiagram,
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}
```

---

## Step 8 — CodeBlock Component

Create `src/components/mdx/CodeBlock.tsx`:

Shiki outputs `<pre>` elements with inline styles. This wrapper adds:
- Language label (top-right)
- Copy-to-clipboard button (top-right, 44×44px tap target)
- Horizontal scroll container (`overflow-x-auto`) — prevents page overflow on mobile
- Dark/light theme awareness (Shiki outputs both, CSS switches between them)

```tsx
'use client'
// src/components/mdx/CodeBlock.tsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    // Extract text content from the pre element's children
    const code = (props as { 'data-code'?: string })['data-code'] ?? ''
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-md bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Copy code"
      >
        {copied
          ? <Check className="h-4 w-4 text-green-500" />
          : <Copy className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {/* Shiki output */}
      <div className="overflow-x-auto">
        <pre {...props} className={cn('p-4 text-sm', props.className)}>
          {children}
        </pre>
      </div>
    </div>
  )
}
```

> Note: Shiki adds `data-language` to the `<code>` element. Read it via `(children as React.ReactElement)?.props?.['data-language']` to render a language label if desired.

---

## Step 9 — Mermaid Diagram Component

Create `src/components/mdx/MermaidDiagram.tsx`:

Client-side Mermaid rendering. Initialises Mermaid once, then renders SVG into a `div`. Supports dark/light mode by re-initialising when the theme changes.

```tsx
'use client'
// src/components/mdx/MermaidDiagram.tsx
import { useEffect, useRef, useId } from 'react'
import { useTheme } from 'next-themes'
import mermaid from 'mermaid'

interface Props {
  chart: string
  caption?: string
}

export function MermaidDiagram({ chart, caption }: Props) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    })

    async function render() {
      if (!containerRef.current) return
      const { svg } = await mermaid.render(`mermaid-${id}`, chart)
      if (containerRef.current) {
        containerRef.current.innerHTML = svg
      }
    }

    render()
  }, [chart, resolvedTheme, id])

  return (
    <figure className="my-6">
      {/* Horizontal scroll wrapper — prevents page overflow on narrow viewports */}
      <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
        <div ref={containerRef} className="flex justify-center" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
```

Usage in MDX files:
```mdx
<Mermaid
  chart={`
    flowchart LR
      Client --> DNS --> Server --> DB
  `}
  caption="System-level request flow"
/>
```

---

## Step 10 — AnimationShell Component

Create `src/components/animations/AnimationShell.tsx`:

The shared wrapper that every animation lives inside. Handles:
- Signals `pageHasAnimations = true` to Zustand on mount (so Navbar shows the pause toggle)
- Reads `animationsPaused` and `prefers-reduced-motion` via `useReducedMotion()`
- Speed control: Slow (2×), Normal (1×), Fast (0.5×) — exports `speedMultiplier` to children
- Reset button: calls a `onReset` callback prop
- Tooltip system: wraps `title` attributes in accessible tooltip spans

```tsx
'use client'
// src/components/animations/AnimationShell.tsx
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

type Speed = 'slow' | 'normal' | 'fast'
const SPEED_MULTIPLIERS: Record<Speed, number> = { slow: 2, normal: 1, fast: 0.5 }

interface Props {
  title: string
  description?: string
  onReset: () => void
  children: (options: { speedMultiplier: number; paused: boolean }) => React.ReactNode
}

export function AnimationShell({ title, description, onReset, children }: Props) {
  const setPageHasAnimations = useUIStore((s) => s.setPageHasAnimations)
  const paused = useReducedMotion()
  const [speed, setSpeed] = useState<Speed>('normal')

  useEffect(() => {
    setPageHasAnimations(true)
    return () => setPageHasAnimations(false)
  }, [setPageHasAnimations])

  return (
    <div className="my-6 rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div>
          <span className="text-sm font-medium">{title}</span>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {/* Controls — thumb-reachable at bottom on mobile, top on desktop */}
        <div className="flex items-center gap-1">
          {(['slow', 'normal', 'fast'] as Speed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`min-h-11 min-w-11 rounded-md px-2 text-xs transition-colors ${
                speed === s
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}

          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="min-h-11 min-w-11"
            aria-label="Reset animation"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Animation canvas — fixed height, no layout shift */}
      <div className="relative min-h-[280px] p-4 sm:min-h-[320px]">
        {paused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="text-sm text-muted-foreground">Animations paused</span>
          </div>
        )}
        {children({ speedMultiplier: SPEED_MULTIPLIERS[speed], paused })}
      </div>
    </div>
  )
}
```

---

## Step 11 — Animation Type Components (Shells)

Create four shell components that wrap `AnimationShell`. In Phase 02 these are structural shells — the actual animation logic is filled in per-topic in Phase 03+.

### `PassiveFlow.tsx` — Auto-playing sequential flow

```tsx
'use client'
// src/components/animations/PassiveFlow.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AnimationShell } from './AnimationShell'

interface Node {
  id: string
  label: string
  tooltip: string
}

interface Props {
  title: string
  description?: string
  nodes: Node[]
  /** ms between steps at normal speed */
  stepDuration?: number
}

export function PassiveFlow({ title, description, nodes, stepDuration = 1200 }: Props) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [key, setKey] = useState(0)

  const reset = useCallback(() => {
    setActiveIndex(-1)
    setKey((k) => k + 1)
  }, [])

  return (
    <AnimationShell title={title} description={description} onReset={reset}>
      {({ speedMultiplier, paused }) => (
        <AutoPlayer
          key={key}
          nodeCount={nodes.length}
          stepDuration={stepDuration * speedMultiplier}
          paused={paused}
          onStep={setActiveIndex}
        >
          {/* Node rendering: loop through nodes, highlight based on activeIndex */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nodes.map((node, i) => (
              <FlowNode
                key={node.id}
                label={node.label}
                tooltip={node.tooltip}
                state={
                  i < activeIndex ? 'done'
                  : i === activeIndex ? 'active'
                  : 'idle'
                }
              />
            ))}
          </div>
        </AutoPlayer>
      )}
    </AnimationShell>
  )
}
```

### `StepThrough.tsx` — Next/Prev step-controlled

Props: `steps: { title, description, diagram? }[]`, renders one step at a time with Next/Prev buttons and a step counter. Step content animates in with `framer-motion` `AnimatePresence`.

### `Interactive.tsx` — User-controlled variable animations

Props: `controls: Control[]` (each control has a `type: 'slider' | 'select' | 'toggle'`, a label, and a range/options). Passes current control values to a `render` prop function. Reset restores all controls to defaults.

### `Comparative.tsx` — Side-by-side comparison

Props: `left: { label, colour }`, `right: { label, colour }`. Renders two panels side-by-side (stacked on mobile, split at `md:`). Each panel accepts children. Useful for cache hit vs miss, indexed vs unindexed query, etc.

---

## Step 12 — MDX Skeleton Files (14 topics)

Create one `.mdx` file per topic in `src/content/topics/`. Each file has complete frontmatter but only section heading placeholders as body content. This makes all 14 topic pages renderable immediately.

**Frontmatter schema** (copy and fill per topic):

```yaml
---
title: How the Web Works
description: DNS resolution, TCP/IP, and the HTTP request-response cycle — how a URL becomes a webpage.
order: 1
cluster: web-foundations
difficulty: easy
interviewFrequency: low
prerequisites: []
---
```

**Body skeleton** (same for all 14 in Phase 02):

```mdx
## ELI5 Foundation {#eli5}

_Content coming in Phase 03._

## FAANG Deep-Dive {#deep-dive}

_Content coming in Phase 03._

## Implementation {#implementation}

_Content coming in Phase 03._

## Database & API Schema {#schema}

_Content coming in Phase 03._

## Visual Aids & Animations {#animations}

_Animations coming in Phase 03._

## Common Mistakes {#mistakes}

_Content coming in Phase 03._

## Interview Prep {#interview}

_Content coming in Phase 03._
```

**Files to create** (one per topic from TOPICS.md):

```
src/content/topics/
  how-the-web-works.mdx
  apis-and-rest.mdx
  cdn.mdx
  databases-101.mdx
  database-indexing.mdx
  replication-strategies.mdx
  cap-theorem.mdx
  database-sharding.mdx
  scalability.mdx
  load-balancing.mdx
  caching.mdx
  message-queues.mdx
  rate-limiting-api-gateways.mdx
  resilience-patterns.mdx
```

---

## Step 13 — `next.config.ts` Update

Remove the old comment and confirm the config stays minimal — `next-mdx-remote` needs no `next.config.ts` changes (it runs server-side in RSC, not through the bundler):

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  turbopack: { root: __dirname },
}

export default nextConfig
```

---

## Step 14 — `@tailwindcss/typography` for Prose

Install and configure the Tailwind typography plugin, which styles MDX-rendered prose (headings, paragraphs, lists, code, blockquotes) automatically:

```bash
npm install -D @tailwindcss/typography
```

Add to `tailwind.config.ts`:

```ts
plugins: [require('@tailwindcss/typography')],
```

The `prose prose-neutral dark:prose-invert` classes on the `<article>` in Step 4 require this plugin.

---

## Phase 02 Completion Checklist

- [x] `next-mdx-remote` and `mermaid` installed
- [x] `@tailwindcss/typography` installed and configured via `@plugin` directive in `globals.css` (Tailwind v4 approach — no `tailwind.config.ts` needed)
- [x] `src/types/mdx.ts` — `TopicFrontmatter` type defined
- [x] `src/lib/mdx.ts` — `getTopicSlugs()`, `getTopicRawSource()`, `getTopicFrontmatter()` implemented; `gray-matter` used for frontmatter pre-parsing (avoids running compileMDX twice)
- [x] `src/app/topics/[slug]/page.tsx` — renders MDX via `MDXRemote` (next-mdx-remote/rsc), `TopicHeader` + `TableOfContents` layout, graceful fallback when MDX file is missing
- [x] `src/components/topic/TopicHeader.tsx` — difficulty/frequency badges, prerequisites block with links
- [x] `src/components/topic/TableOfContents.tsx` — sticky TOC (`sticky top-8`), `IntersectionObserver` tracks active section, IDs match `slugify()` output from MDXComponents
- [x] `src/components/mdx/MDXComponents.tsx` — component map: headings get slugified IDs (prefers explicit `id` prop if present), `pre` → CodeBlock, custom table/blockquote/hr, animation + Mermaid components registered
- [x] `src/components/mdx/CodeBlock.tsx` — language label, copy-to-clipboard (recursive text extraction from Shiki spans), overflow scroll container, 44×44px tap target
- [x] `src/components/mdx/MermaidDiagram.tsx` — dynamic `import('mermaid')` (code-split, browser-only), dark/light theme re-init, error boundary, loading state, horizontal scroll wrapper
- [x] `src/components/animations/AnimationShell.tsx` — speed selector (slow/normal/fast), reset button, pause overlay, `pageHasAnimations` Zustand signal, controls pinned to bottom per mobile spec
- [x] `src/components/animations/PassiveFlow.tsx` — auto-playing node flow, `NodeBox` with hover/tap tooltip, `Connector` (horizontal desktop / vertical mobile), Framer Motion scale pulse on active node, completion message
- [x] `src/components/animations/StepThrough.tsx` — `AnimatePresence` slide transitions, Previous/Next buttons (44×44px), step counter, progress dots, per-step colour support
- [x] `src/components/animations/Interactive.tsx` — discriminated union `ControlDef` (SliderInput / SelectInput / ToggleInput), `useMemo` for stable defaults, render prop pattern for TSX composition
- [x] `src/components/animations/Comparative.tsx` — left/right panels with render props (each panel receives `AnimationOptions`), responsive (column on mobile, row on desktop)
- [x] 14 MDX skeleton files created with complete frontmatter and 7 plain-markdown section headings (`## ELI5 Foundation`, `## FAANG Deep-Dive`, `## Implementation`, `## Schema`, `## Animations`, `## Common Mistakes`, `## Interview Prep`)
- [x] All 14 topic pages render without error — `npm run build` generates 18/18 static routes
- [x] Shiki dual-theme CSS variables added to `globals.css` — `--shiki-light`/`--shiki-dark` toggled by `.dark` class from `next-themes`
- [ ] Code blocks render with syntax highlighting verified in browser (dark and light theme)
- [ ] Mermaid diagram renders correctly verified in browser (dark and light mode)
- [ ] TOC sticky behaviour verified at desktop viewport
- [ ] No horizontal overflow verified at 390px, 768px, 1280px viewports
- [x] `npm run build` passes — 18/18 static routes generated, zero TypeScript errors

### Implementation notes
- **`{#id}` shorthand is invalid MDX** — MDX parses `{...}` as a JS expression. Section anchor IDs come from `slugify(headingText)` in MDXComponents. TOC IDs were updated to match (`eli5-foundation`, `faang-deep-dive`, etc.).
- **`@shikijs/rehype@4.x` has default export only** — confirmed via `node -e "require('@shikijs/rehype')"`. Import as `import rehypeShiki from '@shikijs/rehype'`, not named import.
- **Turbopack + `next-mdx-remote`** — MDX compiles in RSC server context, completely outside Turbopack's module graph. No Turbopack serialization constraint applies.
- **Static generation timeout** — Shiki + MDX compilation during `next build` (6-worker static generation) causes 60s timeouts on first attempt; Next.js retries automatically and all 18 routes eventually succeed. Not an error.

---

## What Comes Next

**`03-topic-01-how-the-web-works.md`** — Full content and animations for Topic 01. This is the reference implementation — every subsequent topic follows the same pattern.
