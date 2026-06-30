import Link from 'next/link'
import { topics } from '@/lib/topics'
import type { Cluster } from '@/types/topic'

const CLUSTER_LABELS: Record<Cluster, string> = {
  'web-foundations': 'Web Foundations',
  'storage':         'Storage',
  'scale':           'Scale',
  'reliability':     'Reliability',
}

const DIFFICULTY_COLOURS: Record<string, string> = {
  easy:   'text-anim-success',
  medium: 'text-anim-pending',
  hard:   'text-anim-error',
}

const CLUSTERS: Cluster[] = ['web-foundations', 'storage', 'scale', 'reliability']

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Interactive System Design
        </h1>
        <p className="mt-2 text-muted-foreground">
          Learn Big-tech-tier distributed systems from the ground up — with live code, animations, and interview prep.
        </p>
      </div>

      <div className="space-y-10">
        {CLUSTERS.map((cluster) => {
          const clusterTopics = topics.filter(
            (t) => t.cluster === cluster && t.status === 'mvp'
          )
          if (clusterTopics.length === 0) return null

          return (
            <section key={cluster}>
              <h2 className="mb-4 text-lg font-semibold">{CLUSTER_LABELS[cluster]}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clusterTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-muted-foreground">
                        {String(topic.order).padStart(2, '0')}
                      </span>
                      <span className={`text-xs font-medium capitalize ${DIFFICULTY_COLOURS[topic.difficulty]}`}>
                        {topic.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 font-medium leading-snug group-hover:text-accent-foreground">
                      {topic.title}
                    </p>
                    {topic.prerequisites.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Needs: {topic.prerequisites.length} prerequisite{topic.prerequisites.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
