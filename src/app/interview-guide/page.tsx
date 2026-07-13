import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeShiki from '@shikijs/rehype'
import { mdxComponents } from '@/components/mdx/MDXComponents'

export const metadata: Metadata = {
  title: 'System Design Interview Framework — Interactive System Design',
  description:
    'The 6-step framework used in Big Tech system design interviews — Requirements, Core Entities, API, Data Flow, High-Level Design, Deep Dives — walked through live with a Rate Limiter example.',
}

const MDX_OPTIONS = {
  parseFrontmatter: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rehypePlugins: [[rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }]] as any,
  },
}

export default function InterviewGuidePage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src', 'content', 'interview-guide.mdx'),
    'utf8'
  )

  return (
    <div className="mx-auto max-w-4xl">
      <article
        className="
          prose prose-neutral dark:prose-invert max-w-none
          prose-headings:scroll-mt-20
          prose-p:text-foreground prose-li:text-foreground prose-td:text-foreground
          prose-strong:text-foreground
          prose-a:text-primary prose-a:underline prose-a:underline-offset-4
          prose-code:before:content-none prose-code:after:content-none
          prose-li:my-1 prose-ol:my-3 prose-ul:my-3
        "
      >
        <MDXRemote
          source={source}
          components={mdxComponents}
          options={MDX_OPTIONS}
        />
      </article>
    </div>
  )
}
