import { notFound } from 'next/navigation'
import { getTopicBySlug, topics } from '@/lib/topics'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return topics
    .filter((t) => t.status === 'mvp')
    .map((t) => ({ slug: t.slug }))
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)

  if (!topic) notFound()

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{topic.cluster.replace('-', ' ')}</span>
          <span>·</span>
          <span className="capitalize">{topic.difficulty}</span>
          <span>·</span>
          <span>#{topic.order}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>

        {topic.prerequisites.length > 0 && (
          <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-semibold">Prerequisites</p>
            <ul className="space-y-1">
              {topic.prerequisites.map((prereq) => {
                const prereqTopic = getTopicBySlug(prereq)
                return (
                  <li key={prereq}>
                    <Link
                      href={`/topics/${prereq}`}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {prereqTopic?.title ?? prereq}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Content placeholder — MDX content renders here in Phase 02 */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          Content for <strong>{topic.title}</strong> is coming in Phase 02.
        </p>
      </div>
    </article>
  )
}
