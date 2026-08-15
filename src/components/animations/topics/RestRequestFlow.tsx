'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimationShell } from '../AnimationShell'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    node: 'Client',
    sub: 'Browser / Mobile',
    colour: '#3b82f6',
    title: 'Client prepares the HTTP request',
    code: `POST /api/v1/posts HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{
  "title": "REST APIs Explained",
  "body": "REST is an architectural style..."
}`,
    note: 'Every field needed to process this request is in the request itself — no server-side session. This is the Stateless constraint: any server in the pool can handle this request with no shared memory.',
  },
  {
    node: 'Load Balancer',
    sub: 'Nginx / AWS ALB',
    colour: '#8b5cf6',
    title: 'Load Balancer routes to an available server',
    code: `# LB adds forwarding headers before forwarding:
X-Forwarded-For: 203.0.113.45
X-Forwarded-Host: api.example.com
X-Real-IP: 203.0.113.45

# Picks a server using round-robin:
→ Forwarding to api-server-3.internal:3000`,
    note: 'The client has no idea which API server it hit, or how many exist. This is the Layered System constraint — intermediaries (CDN, LB, cache) are transparent to the client.',
  },
  {
    node: 'Auth Middleware',
    sub: 'JWT validation',
    colour: '#f59e0b',
    title: 'Auth Middleware validates the JWT token',
    code: `function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token)
    return res.status(401).json({ error: 'Unauthorized' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    next() // ← valid token: continue to next middleware
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' })
  }
}`,
    note: '401 means "I don\'t know who you are — authenticate first." 403 means "I know who you are, but you\'re not allowed." They trigger different client responses: 401 → re-login, 403 → contact admin.',
  },
  {
    node: 'Validation',
    sub: 'Body schema check',
    colour: '#f59e0b',
    title: 'Validation Middleware checks the request body',
    code: `const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  body:  z.string().min(1),
  tags:  z.array(z.string()).optional(),
})

const result = CreatePostSchema.safeParse(req.body)
if (!result.success) {
  return res.status(422).json({
    error: 'Validation failed',
    fields: result.error.flatten().fieldErrors,
  })
}`,
    note: '422 Unprocessable Entity = "the JSON was valid but data failed business rules." 400 Bad Request = "the request itself is malformed (broken JSON, wrong Content-Type)." Using the right code lets clients distinguish structural from validation errors.',
  },
  {
    node: 'Router',
    sub: 'Route matching',
    colour: '#3b82f6',
    title: 'Express Router matches the endpoint',
    code: `// routes/v1/posts.ts
router.route('/')
  .get(listPosts)    // GET  /api/v1/posts
  .post(createPost)  // POST /api/v1/posts ← matched

router.route('/:id')
  .get(getPost)      // GET    /api/v1/posts/:id
  .put(replacePost)  // PUT    /api/v1/posts/:id
  .patch(updatePost) // PATCH  /api/v1/posts/:id
  .delete(deletePost)// DELETE /api/v1/posts/:id

app.use('/api/v1/posts', router)`,
    note: 'The /v1/ prefix is API versioning. Add it on day one even if you never ship v2 — it costs nothing and lets you make breaking changes later without forcing all clients to update at once.',
  },
  {
    node: 'Controller + DB',
    sub: 'Post.create() → MongoDB',
    colour: '#3b82f6',
    title: 'Controller writes to MongoDB',
    code: `async function createPost(req, res) {
  const post = await Post.create({
    title:    req.body.title,
    slug:     slugify(req.body.title),
    body:     req.body.body,
    authorId: req.user.id,  // set by auth middleware
    status:   'draft',
  })
  // ↑ Mongoose validates schema, assigns _id (ObjectId),
  //   writes to posts collection, returns saved document

  res
    .status(201)
    .setHeader('Location', \`/api/v1/posts/\${post._id}\`)
    .json({ data: post })
}`,
    note: 'MongoDB assigns an ObjectId (_id) on insert. The Location header (RFC 9110) tells the client the URL of the new resource without forcing them to construct it from fragments.',
  },
  {
    node: '201 Created',
    sub: 'Response to client',
    colour: '#10b981',
    title: '201 Created flows back to the client',
    code: `HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/posts/507f1f77bcf86cd799439011

{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "REST APIs Explained",
    "slug": "rest-apis-explained",
    "status": "draft",
    "authorId": "64a7e2f1c3d4e5f6a7b8c9d0",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`,
    note: '201 specifically signals "a new resource was created." Using 200 OK instead hides the creation semantics from monitoring tools, retry logic, and API clients — all three behave differently for 201 vs 200.',
  },
]

const NODE_LABELS = STEPS.map((s) => ({ label: s.node, sub: s.sub, colour: s.colour }))

// ─── Pipeline stepper ─────────────────────────────────────────────────────────

function PipelineStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {NODE_LABELS.map((n, i) => {
        const isDone   = i < activeIndex
        const isActive = i === activeIndex
        return (
          <div key={n.label + i} className="flex items-center">
            {/* Node box */}
            <motion.div
              animate={{
                borderColor: isActive ? n.colour : isDone ? '#10b981' : 'hsl(var(--border))',
                backgroundColor: isActive
                  ? n.colour + '15'
                  : isDone
                    ? '#10b98115'
                    : 'transparent',
              }}
              transition={{ duration: 0.3 }}
              className="flex min-w-[72px] flex-col items-center rounded-lg border-2 px-2 py-1.5 text-center"
            >
              {/* Number circle */}
              <motion.div
                animate={{
                  backgroundColor: isActive
                    ? n.colour
                    : isDone
                      ? '#10b981'
                      : 'hsl(var(--muted))',
                }}
                className="mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              >
                {isDone ? '✓' : i + 1}
              </motion.div>
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{ color: isActive ? n.colour : isDone ? '#10b981' : undefined }}
              >
                {n.label}
              </span>
              <span className="text-[9px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                {n.sub}
              </span>
            </motion.div>

            {/* Connector line */}
            {i < NODE_LABELS.length - 1 && (
              <motion.div
                animate={{ backgroundColor: isDone ? '#10b981' : 'hsl(var(--border))' }}
                className="h-0.5 w-4 shrink-0"
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function RestRequestFlow() {
  const [index, setIndex] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  const canPrev = index > 0
  const canNext = index < STEPS.length - 1

  const go = useCallback((next: number) => setIndex(next), [])
  const reset = useCallback(() => { setIndex(0); setResetKey((k) => k + 1) }, [])

  const step = STEPS[index]!

  return (
    <AnimationShell
      title="REST Request Lifecycle"
      description="Step through a POST /api/v1/posts request — from the client to MongoDB and back. See exactly what each layer does and why."
      onReset={reset}
      minHeight={480}
    >
      {() => (
        <div key={resetKey} className="flex flex-col gap-4">
          {/* Pipeline stepper */}
          <PipelineStepper activeIndex={index} />

          {/* Step content */}
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: step.colour }}
              >
                {index + 1}
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
            </div>

            {/* Code block */}
            <pre className={cn(
              'overflow-x-auto rounded-lg border border-border bg-muted/60',
              'p-3 font-mono text-[11px] leading-relaxed text-foreground',
            )}>
              {step.code}
            </pre>

            {/* Note */}
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
              💡 {step.note}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline" size="sm"
              onClick={() => go(index - 1)}
              disabled={!canPrev}
              className={cn('min-h-11 flex-1 gap-1.5', !canPrev && 'opacity-40')}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="shrink-0 text-xs text-muted-foreground">
              {index + 1} / {STEPS.length}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => go(index + 1)}
              disabled={!canNext}
              className={cn('min-h-11 flex-1 gap-1.5', !canNext && 'opacity-40')}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AnimationShell>
  )
}
