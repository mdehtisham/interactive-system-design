import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './CodeBlock'
import { MermaidDiagram } from './MermaidDiagram'
import { PassiveFlow } from '@/components/animations/PassiveFlow'
import { StepThrough } from '@/components/animations/StepThrough'
import { Interactive } from '@/components/animations/Interactive'
import { Comparative } from '@/components/animations/Comparative'
// Topic-specific animation wrappers — one file per topic
import { DnsResolutionFlow } from '@/components/animations/topics/DnsResolutionFlow'
import { HttpCycleSteps } from '@/components/animations/topics/HttpCycleSteps'
import { GeoDnsInteractive } from '@/components/animations/topics/GeoDnsInteractive'
import { DnsFailureModes } from '@/components/animations/topics/DnsFailureModes'
// Topic-specific diagram wrappers — chart strings live in TypeScript, not MDX,
// so MDX's JSX parser never encounters the `{` characters in erDiagram blocks.
import { DnsErDiagram } from '@/components/diagrams/DnsErDiagram'
import { DnsResolutionDiagram } from '@/components/diagrams/DnsResolutionDiagram'
import { WebRequestLifecycle } from '@/components/diagrams/WebRequestLifecycle'

/**
 * Converts any string to a URL-safe anchor ID.
 * Used on headings so TableOfContents anchor links work.
 * e.g. "Big Tech Deep-Dive" → "big-tech-deep-dive"
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (
    children !== null &&
    typeof children === 'object' &&
    'props' in (children as object)
  ) {
    return extractText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ''
}

/**
 * Maps MDX HTML elements to custom React components.
 *
 * Headings: automatically receive id attributes derived from their text content
 * so the TableOfContents IntersectionObserver can target them. The `scroll-mt-20`
 * class offsets the scroll position by the navbar height.
 *
 * Code blocks: the <pre> element is replaced by CodeBlock which adds a copy
 * button and horizontal scrolling. Shiki has already highlighted the content
 * as inline spans by the time the component renders.
 *
 * Animation components are registered here so they can be imported in MDX
 * files directly: `<PassiveFlow ... />`, `<StepThrough ... />`, etc.
 */
export const mdxComponents: MDXComponents = {
  h1: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(extractText(children))
    return (
      <h1
        id={headingId}
        className="mt-10 scroll-mt-20 text-3xl font-bold tracking-tight text-foreground first:mt-0"
        {...props}
      >
        {children}
      </h1>
    )
  },

  h2: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(extractText(children))
    return (
      <h2
        id={headingId}
        className="mt-10 scroll-mt-20 text-2xl font-semibold tracking-tight text-foreground border-b border-border pb-2"
        {...props}
      >
        {children}
      </h2>
    )
  },

  h3: ({ children, id, ...props }) => {
    const headingId = id ?? slugify(extractText(children))
    return (
      <h3
        id={headingId}
        className="mt-8 scroll-mt-20 text-xl font-semibold text-foreground"
        {...props}
      >
        {children}
      </h3>
    )
  },

  h4: ({ children, ...props }) => (
    <h4
      className="mt-6 text-base font-semibold text-foreground"
      {...props}
    >
      {children}
    </h4>
  ),

  // Shiki outputs <pre> elements. We wrap them in CodeBlock which adds the
  // copy button and overflow scroll without touching the highlighted content.
  pre: ({ children, ...props }) => (
    <CodeBlock {...props}>{children}</CodeBlock>
  ),

  // Inline code — styled outside of CodeBlock (no copy button needed).
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
      {...props}
    >
      {children}
    </code>
  ),

  // Blockquotes — used for callouts and notes.
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 border-l-4 border-[var(--anim-data)] pl-4 text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables — wrapped in an overflow scroll container to prevent page overflow.
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm !mt-0 !mb-0" {...props}>
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
      style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td
      className="border-t border-border px-4 py-2.5 text-sm text-foreground"
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule — used as a section divider.
  hr: () => <hr className="my-6 border-border" />,

  // ── Generic animation primitives ─────────────────────────────────────────
  // Usage: <Mermaid chart={`flowchart LR\n  A --> B`} caption="..." />
  Mermaid: MermaidDiagram,
  PassiveFlow,
  StepThrough,
  Interactive,
  Comparative,

  // ── Topic 01: How the Web Works — animations ────────────────────────────
  DnsResolutionFlow,
  HttpCycleSteps,
  GeoDnsInteractive,
  DnsFailureModes,

  // ── Topic 01: How the Web Works — diagrams ───────────────────────────────
  DnsErDiagram,
  DnsResolutionDiagram,
  WebRequestLifecycle,
}
