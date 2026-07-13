'use client'

import { StepThrough, type Step } from '../StepThrough'

const STEPS: Step[] = [
  {
    title: 'User requests /video/4k-film.mp4',
    description:
      'A user in London opens a video page. Their browser sends an HTTPS GET request for the video file. GeoDNS has already routed them to the London CDN edge PoP. This is the first request for this file from the London PoP — it has never been cached here.',
    colour: 'var(--anim-data)',
  },
  {
    title: 'Edge checks its cache — MISS',
    description:
      'The edge server looks up the URL as a cache key. The entry does not exist (or has expired past its TTL). This is a cache miss. The edge cannot serve from local storage — it must fetch the content from the upstream tier.',
    colour: '#f59e0b',
  },
  {
    title: 'Edge forwards request to Origin Shield',
    description:
      'Rather than contacting the origin directly, the edge forwards the miss to the nearest Origin Shield — a regional tier-2 cache (e.g. EU-West). All European edge nodes share this shield. If any other European PoP has already fetched this file, the shield responds without touching origin.',
    colour: '#f59e0b',
  },
  {
    title: 'Origin Shield checks its cache — also MISS',
    description:
      'The shield has not seen this file either (cold start). It forwards the request to the origin server in AWS us-east-1. This is now a two-hop journey: London edge → EU shield → US origin. Total round-trip overhead: ~180ms on top of origin processing time.',
    colour: '#dc2626',
  },
  {
    title: 'Origin responds: 200 OK + Cache-Control headers',
    description:
      'The origin streams back the video file with: Cache-Control: public, s-maxage=86400, stale-while-revalidate=60. This instructs the CDN to cache the response for 86,400 seconds (24 hours), and to serve a stale copy for up to 60 seconds while revalidating in the background.',
    colour: '#16a34a',
  },
  {
    title: 'Shield caches the file, forwards to edge',
    description:
      'The origin shield stores the response locally (s-maxage applies to shared caches). It then forwards the response to the London edge PoP. Any other European edge node that misses this file in the next 24 hours will get it from the shield — not origin. The origin sees only one request, not thousands.',
    colour: '#16a34a',
  },
  {
    title: 'Edge caches + responds. Next request: cache HIT',
    description:
      'The London edge PoP caches its own copy and returns the response to the user. The first visitor paid the full two-hop miss latency (~200ms extra). Every subsequent visitor in London gets a cache hit — the edge responds in ~10ms. This is why CDN hit rate matters: each miss is 10–30× more expensive than a hit.',
    colour: '#16a34a',
  },
]

export function CdnCacheMiss() {
  return (
    <StepThrough
      title="Cache Miss: The Full Round Trip"
      description="Step through every phase of what happens when content is absent from the edge cache. The first visitor always pays the origin latency — subsequent visitors benefit from the cache the first visitor populated."
      steps={STEPS}
    />
  )
}
