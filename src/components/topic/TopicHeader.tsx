import Link from 'next/link'
import { getTopicBySlug } from '@/lib/topics'
import { cn } from '@/lib/utils'
import type { Topic } from '@/types/topic'
import type { TopicFrontmatter } from '@/types/mdx'

// bg-*-100 / text-*-800 in light mode: visible badge tint with readable contrast.
// dark: 10% opacity bg keeps the tint subtle on dark surfaces.
const DIFFICULTY_STYLES: Record<Topic['difficulty'], string> = {
  easy:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400',
  medium: 'bg-amber-100   text-amber-800   dark:bg-amber-500/10   dark:text-amber-400',
  hard:   'bg-rose-100    text-rose-800    dark:bg-rose-500/10    dark:text-rose-400',
}

const FREQ_STYLES: Record<Topic['interviewFrequency'], string> = {
  high:   'bg-violet-100 text-violet-800 dark:bg-violet-500/10 dark:text-violet-400',
  medium: 'bg-sky-100    text-sky-800    dark:bg-sky-500/10    dark:text-sky-400',
  low:    'bg-zinc-100   text-zinc-700   dark:bg-zinc-500/10   dark:text-zinc-400',
}

const FREQ_LABELS: Record<Topic['interviewFrequency'], string> = {
  high:   '🔥 High interview frequency',
  medium: 'Medium frequency',
  low:    'Low frequency',
}

interface Props {
  topic: Topic
  frontmatter: TopicFrontmatter
}

export function TopicHeader({ topic, frontmatter }: Props) {
  return (
    <header className="border-b border-border pb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            DIFFICULTY_STYLES[topic.difficulty]
          )}
        >
          {topic.difficulty}
        </span>

        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            FREQ_STYLES[topic.interviewFrequency]
          )}
        >
          {FREQ_LABELS[topic.interviewFrequency]}
        </span>

        <span className="text-xs text-muted-foreground">
          #{String(topic.order).padStart(2, '0')} · {topic.cluster.replace(/-/g, ' ')}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {frontmatter.title}
      </h1>

      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
        {frontmatter.description}
      </p>

      <div className="mt-5 text-sm">
        {topic.prerequisites.length === 0 ? (
          <p className="text-muted-foreground">
            No prerequisites — start here.
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="font-semibold text-muted-foreground">
              Prerequisites:
            </span>
            {topic.prerequisites.map((slug, index) => {
              const prereqTopic = getTopicBySlug(slug)
              return (
                <span key={slug} className="inline-flex items-center gap-1">
                  {index > 0 && (
                    <span className="text-muted-foreground/50">·</span>
                  )}
                  <Link
                    href={`/topics/${slug}`}
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    {prereqTopic?.title ?? slug}
                  </Link>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
