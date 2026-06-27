import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeShiki from '@shikijs/rehype'
import { getTopicBySlug, topics } from '@/lib/topics'
import { getTopicRawSource, getTopicFrontmatter, getTopicSlugs } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/MDXComponents'
import { TopicHeader } from '@/components/topic/TopicHeader'
import { TableOfContents } from '@/components/topic/TableOfContents'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * generateStaticParams is driven by the topic registry (single source of truth)
 * rather than by scanning the content directory, so the build doesn't fail if
 * an MDX file is missing — it will simply 404 at runtime instead.
 */
export function generateStaticParams() {
  return topics
    .filter((t) => t.status === 'mvp')
    .map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) return {}

  try {
    const { title, description } = getTopicFrontmatter(slug)
    return {
      title: `${title} — Interactive System Design`,
      description,
    }
  } catch {
    // MDX file not yet written — fall back to registry title.
    return {
      title: `${topic.title} — Interactive System Design`,
    }
  }
}

/**
 * MDX compilation options.
 *
 * rehypeShiki with `defaultColor: false` outputs CSS variables on each token
 * span (--shiki-light / --shiki-dark). globals.css applies the correct colour
 * based on whether the <html> element carries the `.dark` class (next-themes).
 *
 * remarkGfm adds GitHub Flavored Markdown: tables, strikethrough, task lists.
 */
const MDX_OPTIONS = {
  parseFrontmatter: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    // rehypeShiki is typed as `default` export (confirmed via node -e check).
    // The tuple `[plugin, options]` matches unified's PluggableList entry type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rehypePlugins: [[rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }]] as any,
  },
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params

  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  // Attempt to read the MDX source. If the content file hasn't been written
  // yet (Phase 02 skeleton files), render a "coming soon" placeholder instead
  // of throwing a build error or returning 500.
  let source: string
  try {
    source = getTopicRawSource(slug)
  } catch {
    source = `---
title: ${topic.title}
description: Content coming soon.
order: ${topic.order}
---

## Content coming soon

This topic is planned for a future release. Check back later.
`
  }

  const frontmatter = getTopicFrontmatter(slug)

  return (
    <div className="mx-auto max-w-5xl">
      <TopicHeader topic={topic} frontmatter={frontmatter} />

      <div className="mt-8 flex gap-10">
        {/* Main MDX content */}
        <article className="min-w-0 flex-1 prose prose-neutral dark:prose-invert max-w-none
          prose-headings:scroll-mt-20
          prose-a:text-primary prose-a:underline prose-a:underline-offset-4
          prose-code:before:content-none prose-code:after:content-none">
          <MDXRemote
            source={source}
            components={mdxComponents}
            options={MDX_OPTIONS}
          />
        </article>

        {/* Sticky TOC — desktop only (xl+) */}
        <aside className="hidden xl:block w-52 shrink-0">
          <div className="sticky top-8">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  )
}
