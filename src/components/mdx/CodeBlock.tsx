'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Recursively extracts the plain-text content from a React element tree.
 * Used to pull the raw code string out of Shiki's highlighted <pre> output
 * so we can copy it to the clipboard without stripping the spans manually.
 */
function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (!node || typeof node === 'boolean') return ''
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('')
  }
  if (typeof node === 'object' && 'props' in node) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractTextContent(element.props.children)
  }
  return ''
}

interface Props extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode
}

export function CodeBlock({ children, className, ...rest }: Props) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Extract language from Shiki's data-language attribute on the nested <code> element.
  // Shiki sets this on the <code> child, not on the <pre> element directly.
  const codeElement =
    children !== null &&
    typeof children === 'object' &&
    !Array.isArray(children) &&
    'props' in (children as object)
      ? (children as React.ReactElement<{ 'data-language'?: string }>)
      : null
  const language = codeElement?.props['data-language'] ?? ''

  function handleCopy() {
    const text = extractTextContent(children)
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API is not available (e.g. non-secure context). Silently ignore.
    })

    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-5 overflow-hidden rounded-lg border border-border">
      {/* Top bar: language label + copy button */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'code'}
        </span>

        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className={cn(
            'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2',
            'text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content — overflow-x-auto prevents page-level horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <pre
          {...rest}
          className={cn('p-4 text-sm leading-relaxed', className)}
        >
          {children}
        </pre>
      </div>
    </div>
  )
}
