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
 */
export function MermaidDiagram({ chart, caption }: Props) {
  const { resolvedTheme } = useTheme()
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const bindFnRef = useRef<((el: Element) => void) | null>(null)

  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)

  // useId returns ":r0:" etc. Strip non-alphanumeric chars — Mermaid uses the
  // id as an SVG element id internally and requires a valid identifier.
  const rawId    = useId()
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

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
          startOnLoad: false,
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
      bindFnRef.current(svgContainerRef.current)
    }
  }, [svgContent])

  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-lg border border-border bg-transparent p-4">
        {error ? (
          <p className="text-center text-sm text-destructive">
            ⚠ Diagram error: {error}
          </p>
        ) : isRendering ? (
          // Loading state — a plain React-managed element with no ref.
          // Crucially, it is NOT a sibling of the SVG container below, so
          // React never tries to remove it from the SVG container's DOM node.
          <div className="flex min-h-[100px] items-center justify-center">
            <span className="text-sm text-muted-foreground">
              Rendering diagram…
            </span>
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
    </figure>
  )
}
