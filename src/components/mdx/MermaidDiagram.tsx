'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface Props {
  chart: string
  caption?: string
}

/**
 * Client-side Mermaid diagram renderer.
 *
 * Mermaid is a browser-only library (~1.4 MB). We load it via dynamic import
 * inside useEffect so it is never bundled into the SSR payload and is
 * code-split as a separate chunk that loads only when this component mounts.
 *
 * Re-renders on theme change by reinitialising Mermaid with the matching
 * theme ('dark' / 'default') before re-rendering the SVG.
 */
export function MermaidDiagram({ chart, caption }: Props) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)

  // useId returns ":r0:" etc. — strip all non-alphanumeric characters to produce
  // a valid HTML id (Mermaid uses the id as an SVG element id internally).
  const rawId = useId()
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false
    setError(null)
    setIsRendering(true)

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid')

        if (cancelled) return

        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          fontSize: 14,
        })

        // Mermaid's render function produces the SVG string and an optional
        // cleanup function for any event listeners it attached.
        const { svg, bindFunctions } = await mermaid.render(diagramId, chart)

        if (cancelled || !containerRef.current) return

        containerRef.current.innerHTML = svg

        // bindFunctions wires up interactive elements (e.g. click handlers).
        // It is safe to call even when the diagram has no interactive elements.
        if (bindFunctions) {
          bindFunctions(containerRef.current)
        }

        setIsRendering(false)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Diagram failed to render'
        setError(message)
        setIsRendering(false)
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [chart, resolvedTheme, diagramId])

  return (
    <figure className="my-8">
      {/* Horizontal scroll prevents page-level overflow on narrow viewports */}
      <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
        {error ? (
          <p className="text-center text-sm text-destructive">
            ⚠ Diagram error: {error}
          </p>
        ) : (
          <div
            ref={containerRef}
            className="flex min-h-[100px] items-center justify-center"
            aria-label="Mermaid diagram"
          >
            {isRendering && (
              <span className="text-sm text-muted-foreground">
                Rendering diagram…
              </span>
            )}
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
