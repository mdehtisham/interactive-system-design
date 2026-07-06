'use client'

import { InterviewQAAccordion, type QAItem } from '@/components/interview/InterviewQAAccordion'

const ITEMS: QAItem[] = [
  {
    question: 'What is the difference between idempotent and safe? Name an example of an operation that is idempotent but not safe.',
    intent: 'Whether you know RFC 9110 semantics precisely — these terms are frequently used interchangeably by candidates who only half-understand them.',
    answer:
      'Safe means the operation does not modify server state — it can be called freely by crawlers, prefetch logic, and caches. GET, HEAD, and OPTIONS are safe. Idempotent means calling the operation N times produces the same end state as calling it once — but it may still modify state on the first call. DELETE is the canonical example of idempotent but not safe. First call: deletes the resource, returns 204. Second call: resource is already gone, returns 404. Different responses, but identical end state. PUT is the other example: overwriting a resource is a state change (not safe), but doing it ten times leaves the same resource as doing it once (idempotent). The practical consequence: retry middleware can safely replay idempotent requests. Replaying a non-idempotent POST without an idempotency key creates duplicate records.',
    trap:
      'Saying "idempotent means no side effects." That is the definition of safe, not idempotent. An operation can have side effects — writing to a database, sending a notification — and still be idempotent if repeating it does not change the outcome beyond the first application. A PUT that sets a user\'s email to "alice@example.com" is idempotent: running it 100 times results in the same email address as running it once.',
  },
  {
    question: 'When would you choose GraphQL over REST? What problem does it solve that REST doesn\'t?',
    intent: 'Whether you have shipped both in production — the answer reveals whether you understand the overfetching problem at the scale that motivated GraphQL\'s creation.',
    answer:
      'GraphQL solves overfetching and underfetching — the client gets exactly the fields it requests, nothing more. It originated at Facebook because the News Feed on 3G mobile required 30+ REST round trips per screen load. One GraphQL query collapsed that to one. I would choose GraphQL when: multiple clients (web, iOS, Android, partner integrations) consume the same API with different field requirements; mobile clients are on constrained networks; or frontend teams need to iterate independently of backend without waiting for new endpoints. I would stay with REST when: the API is public and schema introspection would expose too much of the data model; HTTP caching is critical (GraphQL POST requests are not natively cacheable); or the team is small and the data model is simple — GraphQL\'s resolver complexity, N+1 problem, and DataLoader overhead are not worth the investment.',
    trap:
      'Saying "GraphQL is always better than REST because it reduces overfetching." GraphQL has real production costs: no native HTTP caching, N+1 query risk in resolvers, schema introspection exposes your data model, and a steeper learning curve. Stripe, Twilio, and GitHub REST API v3 all built world-class developer platforms without GraphQL. The choice is driven by your client population and caching requirements, not by which technology is newer.',
  },
  {
    question: 'How does gRPC achieve lower latency than REST, and what is the trade-off?',
    intent: 'Whether you can name both specific mechanisms — vague answers ("it\'s binary") indicate surface-level knowledge only.',
    answer:
      'Two distinct mechanisms: (1) Protocol Buffers — binary serialisation with numeric field tags instead of text key-value pairs. {"name":"John"} is 14 bytes as JSON, roughly 6 bytes as protobuf. Approximately 5–10× smaller payload, 5× faster to serialise and deserialise. (2) HTTP/2 multiplexing — all requests share one persistent TCP connection with no handshake per call. A REST client over HTTP/1.1 pays 1.5 RTTs per new connection; gRPC\'s persistent channel amortises that to near zero. The critical trade-off: browsers cannot speak gRPC directly. The Fetch API does not expose HTTP/2 trailers, which gRPC requires. You need an Envoy grpc-web proxy for any browser client. This makes gRPC essentially internal — microservice-to-microservice communication — while public APIs must use REST or GraphQL.',
    trap:
      'Saying gRPC is faster "because it uses HTTP/2." HTTP/2 alone gives multiplexing, but a REST API over HTTP/2 (perfectly valid and increasingly common) also gets that benefit while still paying JSON serialisation costs. The serialisation win from protobuf is typically larger than the transport win from HTTP/2. Candidates who attribute all of gRPC\'s performance to the transport layer are missing the more significant factor.',
  },
  {
    question: 'How does Stripe handle API versioning across a decade without breaking existing integrations?',
    intent: 'Whether you know Stripe\'s actual strategy — "just use /v1/" misses the mechanism entirely.',
    answer:
      'Stripe has kept /v1/ as their only URI version for over ten years. Non-breaking changes deploy freely. For breaking changes, they introduce a dated version snapshot: the request header Stripe-Version: 2024-06-20 selects a specific version of the API\'s behaviour. Each customer account defaults to the API version active on the day they registered. Their integration never breaks without action on their part. To adopt new behaviour, they opt in explicitly by setting the Stripe-Version header. Stripe maintains compatibility shims for every versioned behaviour change, which is a significant engineering investment — but it means a ten-year-old Stripe integration still works today without modification. The customer pays zero migration cost; Stripe absorbs it.',
    trap:
      'Saying "Stripe uses semantic versioning in the URL path." The /v1/ is a stability signal, not a semantic version. The real versioning mechanism is the Stripe-Version date header, which is invisible to URL-based routing. Most APIs that use /v1/, /v2/ path prefixes force every client to migrate when v2 ships — Stripe\'s approach avoids that migration cost entirely by making breaking changes opt-in at the header level.',
  },
  {
    question: 'What is HATEOAS and does anyone actually implement it?',
    intent: 'Whether you understand the most powerful and most ignored REST constraint — and can give an honest assessment of real-world adoption.',
    answer:
      'HATEOAS (Hypermedia as the Engine of Application State) means API responses include links to all available next actions, so clients discover capabilities from the response rather than having URL knowledge baked in. A GET /orders/123 response would include: {"_links": {"pay": "/orders/123/payment", "cancel": "/orders/123/cancel"}}. The client follows links; it does not hardcode paths. This makes clients resilient to URL changes and removes the tight coupling between client code and server URL structure. In practice: almost no public API fully implements it. GitHub REST API v3 does not. AWS does not. PayPal v2 comes closest among major APIs. Stripe returns related resource URLs but does not drive application state from them. The implementation cost — maintaining a complete link graph across all resource states — is high enough that most teams accept the coupling instead.',
    trap:
      'Saying "HATEOAS is just adding _links to responses." The deeper requirement is that the client drives its entire workflow from the links in responses, like a browser navigating a website without a pre-known sitemap. A client that hardcodes /api/v1/orders in its source code is not HATEOAS-driven even if the response contains some links. Partial HATEOAS — adding links for documentation convenience — is common; true HATEOAS-driven client architecture is extremely rare.',
  },
  {
    question: 'Why do we say 401 is about authentication and 403 is about authorization? What triggers each?',
    intent: 'Precise HTTP semantics — this pair is the most commonly misused status code combination in production APIs.',
    answer:
      '401 Unauthorized means "I do not know who you are." Despite the misleading name (it should have been called 401 Unauthenticated per RFC 7235\'s own commentary), it signals an authentication failure: no token provided, expired token, or invalid JWT signature. The correct client response is to authenticate — log in or refresh the token — then retry. 403 Forbidden means "I know who you are, but you cannot do this." Authentication succeeded; the identity is confirmed; the user simply lacks permission for this resource or action. A regular user hitting an admin endpoint gets 403. The correct client response to 403 is not to retry — re-authenticating will not help because the problem is authorisation, not identity.',
    trap:
      'Returning 404 instead of 403 to hide whether a resource exists (security through obscurity). GitHub returns 404 for private repositories to unauthenticated users to avoid leaking that a repo exists. This is a deliberate, documented design choice for a specific security requirement. Using 404 reflexively "to be safe" obscures API behaviour for legitimate users and makes debugging harder. The default for most APIs should be 403, with 404-masking reserved for explicit security requirements.',
  },
  {
    question: 'If a client POSTs a request and the network drops before the response arrives, what happens? How do you design for this?',
    intent: 'Distributed systems fundamentals — whether you understand that the network cannot guarantee exactly-once delivery and that the application must compensate.',
    answer:
      'The server may or may not have processed the request — the client has no way to determine which. If the server did process it, retrying creates a duplicate (two orders, two charges). If it did not, failing to retry loses data. Neither outcome is acceptable for financial or critical operations. The correct design is client-generated idempotency keys. The client creates a UUID before making the request and sends it as Idempotency-Key: <uuid>. The server stores the key-to-response mapping in Redis with a TTL (typically 24 hours). If the same key arrives in a subsequent request, the server returns the original response without re-processing. The client can retry freely and unconditionally — the server guarantees exactly-once semantics at the application layer. This is how Stripe handles all payment operations.',
    trap:
      'Saying "use PUT instead of POST because PUT is idempotent." PUT requires the client to specify the resource URL, which means knowing the ID before creation. For server-assigned IDs — the common case for orders, payments, and records — POST is the correct method and idempotency keys are the correct fix. Switching to PUT to sidestep POST\'s non-idempotency is a design smell that leaks internal ID generation to the client and creates coupling that does not belong there.',
  },
]

export function ApisAndRestQA() {
  return <InterviewQAAccordion items={ITEMS} />
}
