import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // x-forwarded-for is the real client IP when behind a proxy or CDN.
  // req.ip alone is unreliable in those environments.
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'

  return NextResponse.json({
    method:    req.method,
    url:       req.url,
    ip,
    host:      req.headers.get('host'),
    userAgent: req.headers.get('user-agent'),
    headers:   Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  })
}
