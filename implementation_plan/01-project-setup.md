# 01 — Project Setup & Scaffolding

## Decisions Summary

All decisions captured from the requirements interview:

| Concern | Decision |
|---|---|
| Authentication | None in MVP — fully public platform |
| Content storage | MDX files only (MongoDB added post-MVP) |
| Deployment | Vercel — free `.vercel.app` subdomain for MVP |
| UI components | shadcn/ui + Tailwind CSS |
| State management | Zustand |
| Syntax highlighting | Shiki (build-time, zero client JS) |
| Mermaid rendering | rehype-mermaid (build-time SVG, pairs with Shiki) |
| Testing | Vitest — unit tests only |
| Project name | `interactive-system-design` → `interactivesystemdesign.vercel.app` |
| Animation accessibility | `prefers-reduced-motion` respected + manual "Pause animations" toggle in navbar |
| Theme | Dark + light mode — OS default, manual toggle in navbar |
| CI/CD | GitHub Actions — ESLint + TypeScript check on every PR |

---

## Phase 01 — Project Scaffolding & Tooling

**Goal:** A running Next.js app with all tooling configured, the correct directory structure in place, a working layout shell (navbar + collapsible sidebar), and Vercel + GitHub Actions connected. No topic content yet — infrastructure only.

---

### Step 1 — Initialise Next.js

```bash
npx create-next-app@latest interactive-system-design \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Flags explained:**
- `--typescript` — strict TypeScript from day one
- `--tailwind` — Tailwind CSS pre-configured
- `--eslint` — ESLint pre-configured
- `--app` — Next.js App Router (not Pages Router)
- `--src-dir` — all source code under `src/` for cleaner root
- `--import-alias "@/*"` — clean absolute imports

After init, update `tsconfig.json` to enable strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

### Step 2 — Install Core Dependencies

```bash
# UI & Styling
npx shadcn@latest init
npm install framer-motion
npm install next-themes

# State
npm install zustand

# MDX pipeline
npm install @next/mdx @mdx-js/loader @mdx-js/react
npm install rehype-shiki rehype-mermaid
npm install remark-gfm remark-frontmatter remark-mdx-frontmatter
npm install gray-matter

# Types
npm install -D @types/mdx
```

**Why each package:**
| Package | Purpose |
|---|---|
| `framer-motion` | All topic animations |
| `next-themes` | Dark/light mode with system default detection |
| `zustand` | Global state — sidebar open/closed, animation paused |
| `@next/mdx` | Native Next.js MDX support via App Router |
| `rehype-shiki` | Build-time syntax highlighting (VS Code quality) |
| `rehype-mermaid` | Build-time Mermaid → SVG (no client JS) |
| `remark-gfm` | GitHub Flavored Markdown (tables, strikethrough) |
| `gray-matter` | Parse YAML frontmatter from MDX files |

---

### Step 3 — Configure MDX Pipeline

Update `next.config.ts`:

```ts
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeShiki from 'rehype-shiki'
import rehypeMermaid from 'rehype-mermaid'

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
    rehypePlugins: [
      [rehypeShiki, { theme: { dark: 'github-dark', light: 'github-light' } }],
      rehypeMermaid,
    ],
  },
})

export default withMDX({
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
})
```

---

### Step 4 — Directory Structure

```
src/
  app/
    layout.tsx              # Root layout — ThemeProvider, Zustand store, sidebar shell
    page.tsx                # Homepage — topic grid / learning path selector
    topics/
      [slug]/
        page.tsx            # Dynamic topic page — reads MDX by slug
  components/
    layout/
      Navbar.tsx            # Dark mode toggle, animation pause toggle, mobile menu
      Sidebar.tsx           # Collapsible topic navigator — reads from topic registry
      SidebarToggle.tsx     # Hamburger / arrow button
    mdx/
      MDXComponents.tsx     # Custom MDX component map (headings, code, diagrams)
      CodeBlock.tsx         # Shiki-powered code block with copy button
      MermaidDiagram.tsx    # Wrapper for build-time SVG diagrams
    animations/
      PassiveFlow.tsx       # Auto-playing system flow animations
      StepThrough.tsx       # Next/Prev step-controlled animations
      Interactive.tsx       # User-controlled variable animations
      Comparative.tsx       # Side-by-side trade-off animations
      AnimationShell.tsx    # Shared wrapper — speed control, reset, tooltips, pause check
    ui/                     # shadcn/ui components (auto-generated, do not hand-edit)
  lib/
    topics.ts               # Topic registry — reads TOPICS.md metadata, exports typed list
    mdx.ts                  # MDX file reader utility
    hooks/
      useReducedMotion.ts   # Respects prefers-reduced-motion + Zustand pause state
      useTheme.ts           # Re-exports next-themes with typed return
  store/
    uiStore.ts              # Zustand store — sidebar open, animation paused, theme
  types/
    topic.ts                # TypeScript types for Topic, Tag, Cluster, Path
  content/
    topics/                 # One .mdx file per topic, named by slug
      how-the-web-works.mdx
      apis-and-rest.mdx
      ... (14 files total for MVP)
```

---

### Step 5 — Zustand Store

Create `src/store/uiStore.ts`:

```ts
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
    { name: 'ui-preferences' } // persists to localStorage
  )
)
```

---

### Step 6 — Animation Preference Hook

Create `src/lib/hooks/useReducedMotion.ts`:

```ts
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

export function useReducedMotion(): boolean {
  const systemPrefersReduced = useFramerReducedMotion()
  const manuallyPaused = useUIStore((s) => s.animationsPaused)
  return systemPrefersReduced ?? manuallyPaused
}
```

Every animation component imports this hook. If it returns `true`, replace motion with instant transitions or static diagrams.

---

### Step 7 — Theme Setup

Wrap the root layout with `next-themes`:

```tsx
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Install and configure the shadcn/ui dark mode toggle:

```bash
npx shadcn@latest add button dropdown-menu
```

---

### Step 8 — Tailwind Colour Tokens

Add the platform-wide animation colour system (from CLAUDE.md) to `tailwind.config.ts`:

```ts
colors: {
  'anim-success':  '#22c55e', // green  — cache hit, healthy node
  'anim-error':    '#ef4444', // red    — failure, cache miss, dead node
  'anim-pending':  '#f59e0b', // amber  — in-transit, waiting, degraded
  'anim-data':     '#3b82f6', // blue   — data/request/packet in motion
  'anim-idle':     '#6b7280', // grey   — inactive, background system
}
```

---

### Step 9 — Collapsible Sidebar Shell

The sidebar reads from the topic registry and renders cluster-grouped navigation. For Phase 01 this is a **shell only** — all topic links render but point to placeholder pages.

Behaviour:
- Desktop (`lg:` and above): sidebar visible by default, toggle collapses to icon-only rail
- Tablet (`md:`): sidebar hidden by default, slides in as an overlay on toggle
- Mobile: sidebar hidden by default, full-width drawer from the left on toggle
- Active topic highlighted, cluster headings non-clickable but collapsible

```bash
npx shadcn@latest add sheet scroll-area collapsible
```

---

### Step 10 — Navbar Shell

Navbar contains (left to right on desktop, stacked on mobile):
1. Logo / project name
2. Sidebar toggle button (hamburger)
3. `Pause Animations` toggle (icon button, reflects `animationsPaused` from Zustand)
4. Dark/Light mode toggle (icon button)

All four controls must meet the 44×44px minimum tap target requirement.

---

### Step 11 — Topic Type System

Create `src/types/topic.ts` — the TypeScript mirror of the tag schema from CLAUDE.md:

```ts
export type Cluster = 'web-foundations' | 'storage' | 'scale' | 'reliability'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type InterviewFrequency = 'high' | 'medium' | 'low'
export type LearningPath = 'fundamentals-first' | 'interview-critical' | 'complexity-ladder'
export type HLDWeight = 'primary' | 'supporting'
export type TopicStatus = 'mvp' | 'backlog'

export interface Topic {
  slug: string
  title: string
  cluster: Cluster
  difficulty: Difficulty
  interviewFrequency: InterviewFrequency
  path: LearningPath[]
  hldWeight: HLDWeight
  status: TopicStatus
  prerequisites: string[]        // array of slugs
  order: number                  // global sequence number from TOPICS.md
}
```

---

### Step 12 — GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test
```

---

### Step 13 — Vercel Setup

1. Push repo to GitHub (already initialised)
2. Connect repo to Vercel via vercel.com dashboard
3. Set framework preset to **Next.js** (auto-detected)
4. Set root directory to `.` (project root)
5. No environment variables needed for Phase 01
6. Enable **automatic preview deployments** on every PR branch

---

## Phase 01 Completion Checklist

- [x] `npx create-next-app` complete, TypeScript strict enabled (`strict`, `noUncheckedIndexedAccess`)
- [x] All dependencies installed — framer-motion, next-themes, zustand, lucide-react, clsx, tailwind-merge, class-variance-authority, @shikijs/rehype, rehype-mermaid, @next/mdx and remark plugins
- [x] `next.config.ts` configured with `turbopack.root` and `pageExtensions` — MDX pipeline deferred to Phase 02 (see note below)
- [x] Directory structure created — `src/app`, `src/components/layout`, `src/components/ui`, `src/components/animations`, `src/components/mdx`, `src/lib/hooks`, `src/store`, `src/types`, `src/content/topics`
- [x] Zustand store (`src/store/uiStore.ts`) — sidebar open/close and animation pause state persisted to localStorage
- [x] `useReducedMotion` hook (`src/lib/hooks/useReducedMotion.ts`) — combines OS `prefers-reduced-motion` with manual Zustand pause state
- [x] `next-themes` dark/light mode wired in root layout — system default, `suppressHydrationWarning` set
- [x] Animation colour tokens added to `globals.css` as CSS variables (`--anim-success`, `--anim-error`, `--anim-pending`, `--anim-data`, `--anim-idle`)
- [x] Navbar shell (`src/components/layout/Navbar.tsx`) — logo, sidebar toggle, animation pause toggle, theme toggle; all controls meet 44×44px tap target
- [x] Sidebar shell (`src/components/layout/Sidebar.tsx`) — cluster-grouped navigation, active topic highlighted, collapsible per cluster
- [x] `Topic` TypeScript type defined (`src/types/topic.ts`) — all 6 tag fields typed
- [x] Topic registry (`src/lib/topics.ts`) — all 14 MVP topics with full tag data, `getTopicBySlug` and `getTopicsByPath` helpers
- [x] Homepage (`src/app/page.tsx`) — topic grid grouped by cluster with difficulty colour coding
- [x] Dynamic topic pages (`src/app/topics/[slug]/page.tsx`) — all 14 slugs statically generated, prerequisites block with links
- [x] shadcn/ui components installed — button, dropdown-menu, sheet, scroll-area, collapsible
- [x] GitHub Actions CI (`.github/workflows/ci.yml`) — lint + typecheck on push to main and PRs
- [x] `npm run lint` passes clean
- [x] `npx tsc --noEmit` passes clean — zero errors
- [x] `npm run build` passes — 18 static routes generated successfully
- [x] Home icon added to Navbar (dedicated icon button) and Sidebar nav (top link above clusters) — both link to `/`
- [x] Brand name in Navbar made a clickable link to `/`
- [x] Mobile sidebar drawer implemented — hamburger toggle opens a `Sheet` (slide-in from left) on viewports below `lg` (1024px); desktop inline sidebar unchanged
- [x] Animation pause/play toggle hidden when the current page has no animations — `pageHasAnimations` flag in Zustand store (not persisted); animation components call `setPageHasAnimations(true)` on mount
- [ ] Vercel project connected and deploying to `interactivesystemdesign.vercel.app` *(manual step — push to GitHub then connect via vercel.com/new)*
- [ ] App verified at 390px, 768px, 1280px viewports *(run `npm run dev` and test in browser DevTools)*

### Deferred to Phase 02

| Item | Reason |
|---|---|
| `rehype-mermaid` in MDX pipeline | Requires `playwright` (headless browser) — no MDX content files exist yet in Phase 01 |
| Full MDX pipeline in `next.config.ts` | Turbopack (Next.js 16 default) does not serialize function-based remark/rehype plugins — Phase 02 will resolve with Turbopack-compatible MDX config |
| `exactOptionalPropertyTypes` in tsconfig | Incompatible with shadcn/ui generated components — removed, `strict` + `noUncheckedIndexedAccess` remain |

---

## What Comes Next

**`02-content-infrastructure.md`** — MDX file structure, topic registry, dynamic routing (`/topics/[slug]`), topic page layout shell with all 7 section placeholders, and the shared animation component system (`AnimationShell`, `PassiveFlow`, `StepThrough`, `Interactive`, `Comparative`).
