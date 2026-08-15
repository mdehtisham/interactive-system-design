'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'

interface Props {
  chart: string
  caption?: string
  /** Set to false to hide the fullscreen button (e.g. ER diagrams that are already readable inline). */
  fullscreen?: boolean
}

function ExpandIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}

/**
 * Client-side Mermaid diagram renderer with fullscreen support.
 *
 * KEY ARCHITECTURE DECISION — why dangerouslySetInnerHTML, not innerHTML:
 *
 * The original implementation called `containerRef.current.innerHTML = svg`
 * directly. This caused a React "removeChild" NotFoundError because:
 *   1. React renders <span>Rendering…</span> as a managed child of the container.
 *   2. Mermaid replaces innerHTML, removing that span outside React's knowledge.
 *   3. React later tries to remove the span it still tracks — but it's gone.
 *
 * Fix: store the SVG in React state and render it via dangerouslySetInnerHTML.
 * The loading <span> and the SVG output live in mutually exclusive branches,
 * so React never has concurrent ownership of the same DOM node.
 *
 * FULLSCREEN: uses createPortal to document.body so the overlay is never
 * clipped by any ancestor overflow:hidden container. The SVG max-width
 * constraint is removed for the fullscreen copy so it scales to fill the
 * available viewport width via its viewBox.
 */
export function MermaidDiagram({ chart, caption, fullscreen = true }: Props) {
  const { resolvedTheme } = useTheme()
  const svgContainerRef      = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef          = useRef<HTMLButtonElement>(null)
  const expandBtnRef         = useRef<HTMLButtonElement>(null)
  const bindFnRef            = useRef<((el: Element) => void) | null>(null)

  const [svgContent, setSvgContent]   = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mounted, setMounted]         = useState(false)

  // useId returns ":r0:" etc. Strip non-alphanumeric chars — Mermaid uses the
  // id as an SVG element id internally and requires a valid identifier.
  const rawId     = useId()
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  // Track client mount so createPortal can target document.body safely.
  useEffect(() => { setMounted(true) }, [])

  // Escape key closes fullscreen.
  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  // Lock body scroll while fullscreen is open; restore on close / unmount.
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isFullscreen])

  // Move focus: into the close button when fullscreen opens; back to the
  // expand button when it closes. Supports keyboard and screen-reader users.
  useEffect(() => {
    if (isFullscreen) {
      // rAF gives the portal a frame to paint before we attempt focus.
      const id = requestAnimationFrame(() => { closeBtnRef.current?.focus() })
      return () => cancelAnimationFrame(id)
    } else {
      expandBtnRef.current?.focus()
    }
  }, [isFullscreen])

  // Render Mermaid SVG whenever the chart string or theme changes.
  useEffect(() => {
    let cancelled = false
    setError(null)
    setSvgContent(null)
    setIsRendering(true)

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid')
        if (cancelled) return

        mermaid.initialize({
          startOnLoad:   false,
          theme:         resolvedTheme === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'loose',
          fontFamily:    'inherit',
          fontSize:      14,
        })

        const { svg, bindFunctions } = await mermaid.render(diagramId, chart)
        if (cancelled) return

        // Store bindFunctions in a ref so we can call it after React commits
        // the dangerouslySetInnerHTML update to the real DOM.
        bindFnRef.current = bindFunctions ?? null
        setSvgContent(svg)
        setIsRendering(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Diagram failed to render')
        setIsRendering(false)
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart, resolvedTheme, diagramId])

  // After React commits the dangerouslySetInnerHTML update, wire up any
  // interactive click handlers Mermaid produced (e.g. for flowchart links).
  useEffect(() => {
    if (svgContent && svgContainerRef.current && bindFnRef.current) {
      try { bindFnRef.current(svgContainerRef.current) } catch { /* non-critical */ }
    }
  }, [svgContent])

  // Same for the fullscreen copy — bind after it mounts in the portal.
  useEffect(() => {
    if (isFullscreen && svgContent && fullscreenContainerRef.current && bindFnRef.current) {
      try { bindFnRef.current(fullscreenContainerRef.current) } catch { /* non-critical */ }
    }
  }, [isFullscreen, svgContent])

  // Mermaid outputs SVGs with `style="max-width: Xpx; height: auto;"`.
  // For the fullscreen copy we replace that with `width: 100%` so the diagram
  // fills the viewport and scales via its viewBox aspect ratio.
  const fullscreenSvg = svgContent
    ? svgContent.replace(/style="max-width:[^"]*;"/, 'style="width:100%;height:auto;"')
    : ''

  const openFullscreen  = () => setIsFullscreen(true)
  const closeFullscreen = () => setIsFullscreen(false)

  const fullscreenOverlay = mounted && isFullscreen
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={caption ?? 'Diagram fullscreen view'}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm"
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-2">
            <span className="truncate pr-4 text-sm text-foreground">
              {caption ?? 'Diagram'}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Close fullscreen"
              onClick={closeFullscreen}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-foreground transition-[colors,transform] hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              <CollapseIcon />
            </button>
          </div>

          {/* ── Scrollable diagram area ─────────────────────────────────────── */}
          <div className="flex flex-1 overflow-auto p-4 md:p-10">
            <div
              ref={fullscreenContainerRef}
              className="m-auto w-full rounded-lg border border-border bg-background p-4 md:p-8"
              dangerouslySetInnerHTML={{ __html: fullscreenSvg }}
            />
          </div>

          {/* ── Footer hint ─────────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-border bg-background px-4 py-2 text-center text-xs text-muted-foreground">
            Press{' '}
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">
              Esc
            </kbd>{' '}
            or tap{' '}
            <CollapseIcon />{' '}
            to close
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <figure className="my-8">
      {/* ── Inline diagram container ──────────────────────────────────────── */}
      <div className="relative overflow-x-auto rounded-lg border border-border bg-transparent p-4">

        {/* Fullscreen expand button — only appears once the SVG is ready and fullscreen is enabled */}
        {fullscreen && svgContent && !error && (
          <button
            ref={expandBtnRef}
            type="button"
            aria-label="View diagram fullscreen"
            title="Fullscreen"
            onClick={openFullscreen}
            className="absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-[colors,transform] hover:bg-gray-100 hover:text-gray-900 active:scale-[0.97] dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          >
            <ExpandIcon />
          </button>
        )}

        {error ? (
          <p className="text-center text-sm text-destructive">
            ⚠ Diagram error: {error}
          </p>
        ) : isRendering ? (
          // Loading state — a plain React-managed element with no ref.
          // Crucially, it is NOT a sibling of the SVG container below, so
          // React never tries to remove it from the SVG container's DOM node.
          <div className="flex min-h-[100px] items-center justify-center">
            <span className="text-sm text-muted-foreground">Rendering diagram…</span>
          </div>
        ) : (
          // SVG output — dangerouslySetInnerHTML tells React about the update,
          // preventing the removeChild mismatch that direct innerHTML caused.
          <div
            ref={svgContainerRef}
            className="flex min-h-[100px] items-center justify-center"
            aria-label="Mermaid diagram"
            dangerouslySetInnerHTML={{ __html: svgContent ?? '' }}
          />
        )}
      </div>

      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}

      {fullscreenOverlay}
    </figure>
  )
}
