'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'
import { cn } from '@/lib/utils'

// ─── Mermaid diagram strings (module-level — never inline in JSX props) ───────

const D_SOCIAL = `erDiagram
    users {
        BIGSERIAL id PK
        TEXT username UK
        TEXT email UK
        TEXT bio
        TIMESTAMPTZ created_at
    }
    posts {
        BIGSERIAL id PK
        BIGINT user_id FK
        TEXT content
        INT like_count
        TIMESTAMPTZ created_at
    }
    follows {
        BIGINT follower_id FK
        BIGINT followee_id FK
    }
    likes {
        BIGINT user_id FK
        BIGINT post_id FK
        TIMESTAMPTZ liked_at
    }
    users ||--o{ posts : "writes"
    users ||--o{ follows : "follower"
    users ||--o{ follows : "followee"
    users ||--o{ likes : "likes"
    posts ||--o{ likes : "receives"`

const D_ECOMMERCE = `erDiagram
    products {
        BIGSERIAL id PK
        TEXT name
        TEXT description
        TEXT category
        TIMESTAMPTZ created_at
    }
    product_variants {
        BIGSERIAL id PK
        BIGINT product_id FK
        TEXT sku UK
        JSONB attributes
        INT price_cents
        INT stock_qty
    }
    orders {
        BIGSERIAL id PK
        BIGINT user_id FK
        TEXT status
        INT total_cents
        TIMESTAMPTZ placed_at
    }
    order_items {
        BIGSERIAL id PK
        BIGINT order_id FK
        BIGINT variant_id FK
        INT qty
        INT unit_price_cents
    }
    products ||--o{ product_variants : "has"
    orders ||--o{ order_items : "contains"
    product_variants ||--o{ order_items : "included in"`

const D_CHAT = `erDiagram
    conversations {
        BIGSERIAL id PK
        TEXT type
        TEXT name
        TIMESTAMPTZ created_at
    }
    conversation_members {
        BIGINT conversation_id FK
        BIGINT user_id FK
        TIMESTAMPTZ joined_at
    }
    messages {
        BIGSERIAL id PK
        BIGINT conversation_id FK
        BIGINT sender_id FK
        TEXT content
        TIMESTAMPTZ sent_at
    }
    message_reads {
        BIGINT message_id FK
        BIGINT user_id FK
        TIMESTAMPTZ read_at
    }
    conversations ||--o{ conversation_members : "has"
    conversations ||--o{ messages : "contains"
    messages ||--o{ message_reads : "tracked by"`

const D_RIDESHARE = `erDiagram
    users {
        BIGSERIAL id PK
        TEXT name
        TEXT phone UK
    }
    drivers {
        BIGSERIAL id PK
        BIGINT user_id FK
        TEXT status
        DECIMAL lat
        DECIMAL lng
        TIMESTAMPTZ last_ping
    }
    trips {
        BIGSERIAL id PK
        BIGINT rider_id FK
        BIGINT driver_id FK
        TEXT status
        DECIMAL pickup_lat
        DECIMAL pickup_lng
        DECIMAL dropoff_lat
        DECIMAL dropoff_lng
        INT fare_cents
        TIMESTAMPTZ created_at
    }
    trip_state_log {
        BIGSERIAL id PK
        BIGINT trip_id FK
        TEXT from_status
        TEXT to_status
        TIMESTAMPTZ transitioned_at
    }
    users ||--o{ trips : "rides"
    drivers ||--o{ trips : "drives"
    trips ||--o{ trip_state_log : "logs"`

const D_URLSHORTENER = `erDiagram
    urls {
        BIGSERIAL id PK
        TEXT short_code UK
        TEXT long_url
        BIGINT created_by FK
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }
    clicks {
        BIGSERIAL id PK
        BIGINT url_id FK
        TEXT country
        TEXT device_type
        TEXT referrer
        TIMESTAMPTZ clicked_at
    }
    urls ||--o{ clicks : "receives"`

const D_BOOKING = `erDiagram
    rooms {
        BIGSERIAL id PK
        TEXT hotel_id
        TEXT room_number
        TEXT type
        INT price_per_night_cents
    }
    reservations {
        BIGSERIAL id PK
        BIGINT room_id FK
        BIGINT guest_id FK
        DATE check_in
        DATE check_out
        TEXT status
        INT total_cents
    }
    rooms ||--o{ reservations : "booked via"`

const D_NOTIFICATION = `erDiagram
    notifications {
        BIGSERIAL id PK
        BIGINT recipient_id FK
        TEXT entity_type
        BIGINT entity_id
        TEXT type
        TEXT title
        TEXT body
        BOOLEAN is_read
        TIMESTAMPTZ created_at
    }
    notification_deliveries {
        BIGSERIAL id PK
        BIGINT notification_id FK
        TEXT channel
        TEXT status
        TIMESTAMPTZ sent_at
        TEXT failure_reason
    }
    notifications ||--o{ notification_deliveries : "delivered via"`

const D_TASKS = `erDiagram
    projects {
        BIGSERIAL id PK
        TEXT name
        BIGINT owner_id FK
        TIMESTAMPTZ created_at
    }
    tasks {
        BIGSERIAL id PK
        BIGINT project_id FK
        BIGINT parent_task_id FK
        BIGINT assignee_id FK
        TEXT title
        TEXT status
        DATE due_date
        INT sort_order
    }
    projects ||--o{ tasks : "contains"
    tasks ||--o{ tasks : "parent of"`

const D_PAYMENTS = `erDiagram
    accounts {
        BIGSERIAL id PK
        BIGINT user_id FK
        TEXT currency
        BIGINT balance_cents
        TIMESTAMPTZ updated_at
    }
    transactions {
        BIGSERIAL id PK
        TEXT idempotency_key UK
        TEXT type
        TEXT status
        TIMESTAMPTZ created_at
    }
    transaction_entries {
        BIGSERIAL id PK
        BIGINT transaction_id FK
        BIGINT account_id FK
        BIGINT amount_cents
        TEXT direction
    }
    accounts ||--o{ transaction_entries : "debited/credited"
    transactions ||--o{ transaction_entries : "records"`

const D_VIDEO = `erDiagram
    videos {
        BIGSERIAL id PK
        BIGINT uploader_id FK
        TEXT title
        TEXT status
        TEXT raw_storage_key
        INT duration_seconds
        BIGINT view_count
        TIMESTAMPTZ created_at
    }
    video_renditions {
        BIGSERIAL id PK
        BIGINT video_id FK
        TEXT resolution
        TEXT codec
        BIGINT size_bytes
        TEXT cdn_url
    }
    view_events {
        BIGSERIAL id PK
        BIGINT video_id FK
        BIGINT viewer_id FK
        INT watch_seconds
        TIMESTAMPTZ viewed_at
    }
    videos ||--o{ video_renditions : "encoded as"
    videos ||--o{ view_events : "viewed via"`

// ─── Types ────────────────────────────────────────────────────────────────────

interface Decision {
  title: string
  reasoning: string
}

interface QueryPattern {
  label: string
  sql: string
}

interface Scenario {
  id: string
  title: string
  question: string
  difficulty: 'medium' | 'hard'
  entities: string[]
  diagram: string
  sqlSchema: string
  mongoNote?: string
  decisions: Decision[]
  queryPatterns: QueryPattern[]
  trap: string
  bigTechTip: string
}

// ─── Scenario data ─────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 'social-media',
    title: 'Social Media: Users, Posts & Followers',
    question:
      'Design the database schema for a social media platform where users can post content, follow each other, and like posts.',
    difficulty: 'hard',
    entities: ['users', 'posts', 'follows', 'likes'],
    diagram: D_SOCIAL,
    sqlSchema: `CREATE TABLE users (
  id          BIGSERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  like_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_user_created ON posts (user_id, created_at DESC);

CREATE TABLE follows (
  follower_id  BIGINT NOT NULL REFERENCES users(id),
  followee_id  BIGINT NOT NULL REFERENCES users(id),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX follows_followee ON follows (followee_id);

CREATE TABLE likes (
  user_id   BIGINT NOT NULL REFERENCES users(id),
  post_id   BIGINT NOT NULL REFERENCES posts(id),
  liked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);`,
    mongoNote:
      "In MongoDB you might embed `like_count` as a field on the post document (as we do here with the denormalized counter), but the `follows` and `likes` relationships stay as separate collections — embedding arrays of millions of follower IDs would blow the 16 MB document limit.",
    decisions: [
      {
        title: 'Composite PK on follows',
        reasoning:
          "PRIMARY KEY (follower_id, followee_id) gives uniqueness plus the index for 'does user A follow user B?' in O(log n). No auto-increment id needed — the relationship itself is the identity.",
      },
      {
        title: 'Denormalized like_count on posts',
        reasoning:
          'Counting likes via COUNT(*) on the likes table for every feed render is O(likes). A pre-computed counter on posts trades write amplification (two writes per like) for constant-time read — the right trade-off at social-media scale.',
      },
      {
        title: 'Two indexes on follows',
        reasoning:
          "The PK index covers 'who does user A follow' (follower_id leading). The secondary index on followee_id covers 'who follows user A' — both directions needed for social graphs.",
      },
    ],
    queryPatterns: [
      {
        label: "User's home feed (following)",
        sql: `SELECT p.*
FROM posts p
JOIN follows f ON f.followee_id = p.user_id
WHERE f.follower_id = $1
ORDER BY p.created_at DESC
LIMIT 20;`,
      },
      {
        label: 'Toggle like (upsert)',
        sql: `INSERT INTO likes (user_id, post_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING
RETURNING post_id;`,
      },
    ],
    trap: "Storing followers as a JSON array inside the users row. This fails at ~1,000 followers because arrays have no index, and at ~16 MB it blows the document limit. Always use a separate junction table for many-to-many relationships that can grow unbounded.",
    bigTechTip:
      "Twitter/X uses a separate timeline service that pre-computes and stores the home feed for each user (fan-out on write). The follows table feeds that service — but the feed itself is stored in Redis, not queried from SQL at render time.",
  },
  {
    id: 'ecommerce',
    title: 'E-commerce: Products, Variants & Orders',
    question:
      'Design the schema for an e-commerce platform that sells products with multiple variants (size, color, SKU) and processes orders.',
    difficulty: 'hard',
    entities: ['products', 'product_variants', 'orders', 'order_items'],
    diagram: D_ECOMMERCE,
    sqlSchema: `CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category ON products (category);

CREATE TABLE product_variants (
  id          BIGSERIAL PRIMARY KEY,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  sku         TEXT NOT NULL UNIQUE,
  attributes  JSONB NOT NULL DEFAULT '{}',
  price_cents INT NOT NULL,
  stock_qty   INT NOT NULL DEFAULT 0
);
CREATE INDEX variants_product ON product_variants (product_id);

CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  total_cents INT NOT NULL DEFAULT 0,
  placed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id               BIGSERIAL PRIMARY KEY,
  order_id         BIGINT NOT NULL REFERENCES orders(id),
  variant_id       BIGINT NOT NULL REFERENCES product_variants(id),
  qty              INT NOT NULL,
  unit_price_cents INT NOT NULL
);`,
    mongoNote:
      "MongoDB's flexible schema shines for `attributes` (size, color, material vary wildly by category). In PostgreSQL we use JSONB for the same flexibility with the bonus of GIN indexing — `CREATE INDEX ON product_variants USING GIN (attributes)` lets you query `WHERE attributes @> '{\"color\": \"red\"}'` efficiently.",
    decisions: [
      {
        title: 'JSONB for variant attributes',
        reasoning:
          'Product attributes are category-specific and evolve often. JSONB avoids the EAV (Entity-Attribute-Value) anti-pattern (three-table join for every attribute read) while keeping the schema normalized at the product and variant level.',
      },
      {
        title: 'price_cents as INT, not DECIMAL',
        reasoning:
          'Floating-point DECIMAL arithmetic accumulates rounding errors in financial calculations. Storing cents as an integer and dividing for display eliminates precision bugs.',
      },
      {
        title: 'unit_price_cents snapshot on order_items',
        reasoning:
          'Product prices change. The order_items row records the price at the moment of purchase — never join back to the live price for historical orders.',
      },
    ],
    queryPatterns: [
      {
        label: "Products with 'red' color in stock",
        sql: `SELECT p.name, v.sku, v.stock_qty
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE v.attributes @> '{"color": "red"}'
  AND v.stock_qty > 0;`,
      },
      {
        label: 'Order total (sum of line items)',
        sql: `SELECT o.id, SUM(oi.qty * oi.unit_price_cents) AS computed_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = $1
GROUP BY o.id;`,
      },
    ],
    trap: "Storing variant attributes as separate columns (size VARCHAR, color VARCHAR, material VARCHAR). When a new product category needs a new attribute, you're altering the table schema in production — risky on large tables. JSONB handles this without migrations.",
    bigTechTip:
      "Amazon's product catalog uses a hybrid: a relational core (product ID, category, price) with a document store for attributes. PostgreSQL's JSONB gives you both in one database — which is why it's the default choice for mid-scale e-commerce before you need to split services.",
  },
  {
    id: 'chat',
    title: 'Chat: Conversations & Messages',
    question:
      'Design the schema for a chat application that supports 1:1 and group conversations with read receipts.',
    difficulty: 'hard',
    entities: ['conversations', 'conversation_members', 'messages', 'message_reads'],
    diagram: D_CHAT,
    sqlSchema: `CREATE TABLE conversations (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id BIGINT NOT NULL REFERENCES conversations(id),
  user_id         BIGINT NOT NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX cm_user ON conversation_members (user_id);

CREATE TABLE messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id),
  sender_id       BIGINT NOT NULL,
  content         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_sent ON messages (conversation_id, sent_at DESC);

CREATE TABLE message_reads (
  message_id BIGINT NOT NULL REFERENCES messages(id),
  user_id    BIGINT NOT NULL,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);`,
    mongoNote:
      "Discord stores messages in Cassandra (wide-column), not PostgreSQL, because messages are append-only, time-series data — exactly the access pattern Cassandra is optimized for. For a mid-scale chat app, PostgreSQL with a time-based index on (conversation_id, sent_at) works well up to hundreds of millions of messages.",
    decisions: [
      {
        title: 'Unified conversations table for 1:1 and group',
        reasoning:
          "A single conversations table with a type column avoids duplicate logic. 1:1 chats are just conversations with exactly 2 members — no special table needed.",
      },
      {
        title: 'Separate message_reads table',
        reasoning:
          "A `read_by` JSONB array on the messages row is tempting but breaks at scale — every read triggers an UPDATE on the message row, causing write contention. A separate table with one row per (message, user) is append-only and scales independently.",
      },
    ],
    queryPatterns: [
      {
        label: 'Last 20 messages in a conversation',
        sql: `SELECT m.*, u.username AS sender
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.conversation_id = $1
ORDER BY m.sent_at DESC
LIMIT 20;`,
      },
      {
        label: 'Unread count for a user in a conversation',
        sql: `SELECT COUNT(*) AS unread
FROM messages m
WHERE m.conversation_id = $1
  AND m.sender_id != $2
  AND NOT EXISTS (
    SELECT 1 FROM message_reads r
    WHERE r.message_id = m.id AND r.user_id = $2
  );`,
      },
    ],
    trap: "Storing messages as a JSON array inside the conversation document. A group chat with 10,000 messages would have a single document growing to megabytes. Read receipts per message per user inside that array make it completely unmanageable. Always normalize high-cardinality, append-only data.",
    bigTechTip:
      "Slack stores each workspace's messages in a separate shard (logical database partition by workspace_id). This means a single noisy workspace never contends with others. In PostgreSQL, you achieve this with table partitioning by conversation_id range — each partition lives on a separate disk sector.",
  },
  {
    id: 'rideshare',
    title: 'Ride-sharing: Drivers, Riders & Trips',
    question:
      'Design the schema for a ride-sharing platform with driver availability, trip booking, and state machine tracking.',
    difficulty: 'hard',
    entities: ['users', 'drivers', 'trips', 'trip_state_log'],
    diagram: D_RIDESHARE,
    sqlSchema: `CREATE TABLE drivers (
  id        BIGSERIAL PRIMARY KEY,
  user_id   BIGINT NOT NULL UNIQUE,
  status    TEXT NOT NULL DEFAULT 'offline'
            CHECK (status IN ('offline', 'available', 'on_trip')),
  lat       DECIMAL(9,6),
  lng       DECIMAL(9,6),
  last_ping TIMESTAMPTZ
);

CREATE TABLE trips (
  id           BIGSERIAL PRIMARY KEY,
  rider_id     BIGINT NOT NULL,
  driver_id    BIGINT,
  status       TEXT NOT NULL DEFAULT 'requested'
               CHECK (status IN ('requested','accepted','in_progress','completed','cancelled')),
  pickup_lat   DECIMAL(9,6) NOT NULL,
  pickup_lng   DECIMAL(9,6) NOT NULL,
  dropoff_lat  DECIMAL(9,6) NOT NULL,
  dropoff_lng  DECIMAL(9,6) NOT NULL,
  fare_cents   INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trip_state_log (
  id               BIGSERIAL PRIMARY KEY,
  trip_id          BIGINT NOT NULL REFERENCES trips(id),
  from_status      TEXT NOT NULL,
  to_status        TEXT NOT NULL,
  transitioned_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    mongoNote:
      "Uber uses a mix: PostgreSQL for trip records (ACID guarantees for fare calculation), and a geospatial store (H3 grid cells, Redis geohash) for real-time driver location. The lat/lng columns here work for offline queries — not for sub-second driver proximity lookups.",
    decisions: [
      {
        title: 'CHECK constraint for status enum',
        reasoning:
          "A TEXT column with a CHECK constraint is the PostgreSQL idiom for enumerations. It's easier to ALTER than a native ENUM type, and the constraint catches invalid values at the DB layer — not just in application code.",
      },
      {
        title: 'Separate trip_state_log table',
        reasoning:
          'Never overwrite status in place if you need an audit trail. The log table records every transition with a timestamp — invaluable for fraud detection (trip cancelled 1 second after driver accepted) and customer support disputes.',
      },
      {
        title: 'driver_id nullable on trips',
        reasoning:
          "When a trip is first requested, no driver has accepted yet — driver_id is NULL. This is intentional: a NULL FK is the correct representation of 'not yet assigned', not a 0 or a placeholder driver.",
      },
    ],
    queryPatterns: [
      {
        label: 'Available drivers near a location (bounding box)',
        sql: `SELECT id, lat, lng
FROM drivers
WHERE status = 'available'
  AND lat BETWEEN $1 - 0.05 AND $1 + 0.05
  AND lng BETWEEN $2 - 0.05 AND $2 + 0.05;`,
      },
      {
        label: 'Trip audit trail',
        sql: `SELECT from_status, to_status, transitioned_at
FROM trip_state_log
WHERE trip_id = $1
ORDER BY transitioned_at ASC;`,
      },
    ],
    trap: "Modelling trip status as a boolean (is_active, is_completed). This breaks the moment you add 'cancelled', 'disputed', or 'refunded' states. Always model state machines with a TEXT/ENUM status column from day one.",
    bigTechTip:
      "For production geospatial queries, add the PostGIS extension: `CREATE EXTENSION postgis; ALTER TABLE drivers ADD COLUMN location GEOGRAPHY(POINT)`. Then `ST_DWithin(location, ST_Point($lng,$lat)::geography, 5000)` finds drivers within 5 km with a spatial index — far faster than bounding box arithmetic.",
  },
  {
    id: 'url-shortener',
    title: 'URL Shortener with Click Analytics',
    question:
      'Design the schema for a URL shortener that tracks clicks with metadata (country, device, referrer).',
    difficulty: 'medium',
    entities: ['urls', 'clicks'],
    diagram: D_URLSHORTENER,
    sqlSchema: `CREATE TABLE urls (
  id          BIGSERIAL PRIMARY KEY,
  short_code  TEXT NOT NULL UNIQUE,
  long_url    TEXT NOT NULL,
  created_by  BIGINT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clicks (
  id          BIGSERIAL PRIMARY KEY,
  url_id      BIGINT NOT NULL REFERENCES urls(id),
  country     TEXT,
  device_type TEXT,
  referrer    TEXT,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (clicked_at);

CREATE TABLE clicks_2024 PARTITION OF clicks
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE clicks_2025 PARTITION OF clicks
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE INDEX clicks_url_time ON clicks (url_id, clicked_at DESC);`,
    mongoNote:
      "Click events are append-only time-series data — a case where a columnar store like ClickHouse or TimescaleDB outperforms both PostgreSQL and MongoDB for analytics aggregations. For MVP scale, PostgreSQL with table partitioning handles billions of rows.",
    decisions: [
      {
        title: 'Table partitioning on clicks by date',
        reasoning:
          "Clicks are time-series: old partitions are never updated and can be archived to cheaper storage. Queries for 'clicks this month' only scan one partition instead of the full table.",
      },
      {
        title: 'short_code as TEXT not an integer',
        reasoning:
          "Base62 short codes (abc123) are the industry standard. Storing the integer ID and encoding at read time couples your URL scheme to your database autoincrement sequence — a scaling problem if you switch to distributed ID generation.",
      },
    ],
    queryPatterns: [
      {
        label: 'Click count by country for a short URL',
        sql: `SELECT country, COUNT(*) AS clicks
FROM clicks
WHERE url_id = $1
  AND clicked_at > now() - INTERVAL '30 days'
GROUP BY country
ORDER BY clicks DESC;`,
      },
      {
        label: 'Redirect lookup (hot path)',
        sql: `SELECT long_url FROM urls
WHERE short_code = $1
  AND (expires_at IS NULL OR expires_at > now());`,
      },
    ],
    trap: "Using COUNT(*) on the full clicks table for every dashboard render. This is a full-table scan. Pre-aggregate click counts into a `url_daily_stats` summary table updated by a background job, and serve analytics from there.",
    bigTechTip:
      "Bit.ly stores click raw events in Kafka, then streams them into a data warehouse (Redshift/BigQuery) for analytics — the PostgreSQL table holds only the URL record and a pre-computed total. The hot path (redirect) reads only the urls table, which fits entirely in the PostgreSQL buffer cache.",
  },
  {
    id: 'booking',
    title: 'Booking System: Rooms & Reservations',
    question:
      'Design the schema for a hotel booking system that prevents double-booking of rooms.',
    difficulty: 'hard',
    entities: ['rooms', 'reservations'],
    diagram: D_BOOKING,
    sqlSchema: `CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE rooms (
  id                    BIGSERIAL PRIMARY KEY,
  hotel_id              TEXT NOT NULL,
  room_number           TEXT NOT NULL,
  type                  TEXT NOT NULL,
  price_per_night_cents INT NOT NULL,
  UNIQUE (hotel_id, room_number)
);

CREATE TABLE reservations (
  id          BIGSERIAL PRIMARY KEY,
  room_id     BIGINT NOT NULL REFERENCES rooms(id),
  guest_id    BIGINT NOT NULL,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  total_cents INT NOT NULL,
  CONSTRAINT no_overlap EXCLUDE USING GIST (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status != 'cancelled')
);`,
    mongoNote:
      "MongoDB has no equivalent of EXCLUDE USING GIST. Preventing double-booking in MongoDB requires application-level optimistic locking (read version → write if version unchanged) or a dedicated locking service. PostgreSQL's EXCLUDE constraint enforces the invariant at the database level — the right layer for a safety-critical constraint.",
    decisions: [
      {
        title: 'EXCLUDE USING GIST for date overlap',
        reasoning:
          'The EXCLUDE constraint uses a GiST index to reject any INSERT that would overlap an existing non-cancelled reservation for the same room. It is the only way to enforce this constraint at the database level in a concurrent environment — no application-level check can provide the same guarantee without a table lock.',
      },
      {
        title: 'WHERE (status != cancelled) partial index',
        reasoning:
          "Cancelled reservations should not block re-booking the same dates. The partial EXCLUDE makes cancelled rows invisible to the overlap check.",
      },
    ],
    queryPatterns: [
      {
        label: 'Available rooms for a date range',
        sql: `SELECT r.*
FROM rooms r
WHERE NOT EXISTS (
  SELECT 1 FROM reservations res
  WHERE res.room_id = r.id
    AND res.status = 'confirmed'
    AND daterange(res.check_in, res.check_out, '[)')
      && daterange($1::date, $2::date, '[)')
);`,
      },
      {
        label: "Guest's upcoming reservations",
        sql: `SELECT res.*, r.room_number, r.type
FROM reservations res
JOIN rooms r ON r.id = res.room_id
WHERE res.guest_id = $1
  AND res.check_out >= CURRENT_DATE
ORDER BY res.check_in ASC;`,
      },
    ],
    trap: "Checking for overlaps in application code before inserting. Between the SELECT check and the INSERT, another concurrent request can book the same dates. This is a classic TOCTOU (time-of-check-to-time-of-use) race. Only a database-level constraint or serializable transaction isolation prevents it.",
    bigTechTip:
      "Airbnb uses a calendar availability table (one row per room per night) with a unique constraint on (room_id, date, status='available'). This avoids the daterange extension dependency at the cost of more rows — a viable alternative when you need to support databases that lack GiST.",
  },
  {
    id: 'notifications',
    title: 'Notification System: Fan-out & Delivery',
    question:
      'Design the schema for a notification system that supports multiple channels (in-app, email, push) and tracks delivery state.',
    difficulty: 'medium',
    entities: ['notifications', 'notification_deliveries'],
    diagram: D_NOTIFICATION,
    sqlSchema: `CREATE TABLE notifications (
  id            BIGSERIAL PRIMARY KEY,
  recipient_id  BIGINT NOT NULL,
  entity_type   TEXT,
  entity_id     BIGINT,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient ON notifications (recipient_id, created_at DESC);
CREATE INDEX notifications_unread ON notifications (recipient_id) WHERE NOT is_read;

CREATE TABLE notification_deliveries (
  id              BIGSERIAL PRIMARY KEY,
  notification_id BIGINT NOT NULL REFERENCES notifications(id),
  channel         TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at         TIMESTAMPTZ,
  failure_reason  TEXT
);`,
    mongoNote:
      "The (entity_type, entity_id) pattern — 'liked your post' where entity_type='post', entity_id=42 — is a polymorphic association. MongoDB handles this naturally as embedded fields. In PostgreSQL, it works equally well as two nullable columns. The type column ('like', 'follow', 'mention') tells the client how to render the notification.",
    decisions: [
      {
        title: 'Partial index on unread notifications',
        reasoning:
          "Most notification reads are 'show me unread notifications'. A partial index WHERE NOT is_read contains only unread rows — it stays small and fast even when the notifications table has millions of rows.",
      },
      {
        title: 'Separate deliveries table',
        reasoning:
          "One notification can be delivered via in_app + email + push — three rows in notification_deliveries, one notification. This avoids nullable channel columns and makes retry logic straightforward: re-queue any delivery with status='failed'.",
      },
    ],
    queryPatterns: [
      {
        label: 'Unread notifications for a user',
        sql: `SELECT * FROM notifications
WHERE recipient_id = $1
  AND NOT is_read
ORDER BY created_at DESC
LIMIT 20;`,
      },
      {
        label: 'Mark all as read',
        sql: `UPDATE notifications
SET is_read = true
WHERE recipient_id = $1
  AND NOT is_read
RETURNING id;`,
      },
    ],
    trap: "Creating a separate table per notification type (post_likes_notifications, follow_notifications). You end up with 15 tables that all have the same columns. Use a single notifications table with a type column — the entity_type + entity_id columns give you the polymorphic reference back to the source object.",
    bigTechTip:
      "Instagram's notification fan-out: when a celebrity posts, the system must create notification rows for 50 million followers. They use fan-out-on-read (pull model) for high-follower accounts and fan-out-on-write (push model) for normal users. The schema stays the same — only the write timing differs.",
  },
  {
    id: 'tasks',
    title: 'Project Management: Tasks & Sub-tasks',
    question:
      'Design the schema for a project management tool that supports tasks with unlimited sub-task nesting.',
    difficulty: 'hard',
    entities: ['projects', 'tasks'],
    diagram: D_TASKS,
    sqlSchema: `CREATE TABLE projects (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  owner_id   BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id             BIGSERIAL PRIMARY KEY,
  project_id     BIGINT NOT NULL REFERENCES projects(id),
  parent_task_id BIGINT REFERENCES tasks(id),
  assignee_id    BIGINT,
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  due_date       DATE,
  sort_order     INT NOT NULL DEFAULT 0
);
CREATE INDEX tasks_project ON tasks (project_id);
CREATE INDEX tasks_parent ON tasks (parent_task_id);`,
    mongoNote:
      "MongoDB often uses an array of ancestor IDs (materialized path) for tree structures: `ancestors: [projectId, parentTaskId]`. This makes 'all tasks under this branch' a single query. In PostgreSQL, the WITH RECURSIVE CTE achieves the same result without the denormalization.",
    decisions: [
      {
        title: 'Self-referencing FK for tree',
        reasoning:
          'parent_task_id references tasks(id) in the same table. This is the standard adjacency list model — simple to implement, supports arbitrary depth. The trade-off: fetching all descendants requires a recursive query.',
      },
      {
        title: 'sort_order INT for manual ordering',
        reasoning:
          'Users drag and drop tasks. A sort_order integer lets you reorder by updating a single row. Alternative: fractional indexing (1.0, 1.5, 2.0) avoids re-numbering on insert but requires client-side sorting logic.',
      },
    ],
    queryPatterns: [
      {
        label: 'All descendants of a task (recursive CTE)',
        sql: `WITH RECURSIVE subtasks AS (
  SELECT * FROM tasks WHERE id = $1
  UNION ALL
  SELECT t.* FROM tasks t
  JOIN subtasks s ON s.id = t.parent_task_id
)
SELECT * FROM subtasks;`,
      },
      {
        label: 'Top-level tasks for a project',
        sql: `SELECT * FROM tasks
WHERE project_id = $1
  AND parent_task_id IS NULL
ORDER BY sort_order ASC;`,
      },
    ],
    trap: "Fetching the task tree with N+1 queries (fetch children, then for each child fetch their children). Always use a WITH RECURSIVE CTE to fetch the entire subtree in a single query.",
    bigTechTip:
      "Linear (the project management tool) uses a ltree extension for path-based tree queries: each task stores its full path as 'projectId.parentId.taskId'. `WHERE path <@ 'project.parent'` returns all descendants using a GiST index — faster than a recursive CTE on very deep trees.",
  },
  {
    id: 'payments',
    title: 'Payments: Accounts & Immutable Ledger',
    question:
      'Design the schema for a financial system where account balances must be consistent and every transaction is permanently auditable.',
    difficulty: 'hard',
    entities: ['accounts', 'transactions', 'transaction_entries'],
    diagram: D_PAYMENTS,
    sqlSchema: `CREATE TABLE accounts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL UNIQUE,
  currency      TEXT NOT NULL DEFAULT 'USD',
  balance_cents BIGINT NOT NULL DEFAULT 0
                CHECK (balance_cents >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  idempotency_key TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaction_entries (
  id              BIGSERIAL PRIMARY KEY,
  transaction_id  TEXT NOT NULL REFERENCES transactions(idempotency_key),
  account_id      BIGINT NOT NULL REFERENCES accounts(id),
  amount_cents    BIGINT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('debit', 'credit'))
);`,
    mongoNote:
      "Financial systems should almost always use PostgreSQL over MongoDB for ACID multi-document transactions. MongoDB added multi-document transactions in v4.0, but they carry significant performance overhead and are rarely used in practice. PostgreSQL's ACID guarantees are foundational to financial data integrity.",
    decisions: [
      {
        title: 'Double-entry bookkeeping via transaction_entries',
        reasoning:
          "Every transfer creates two rows: a debit on the sender's account and a credit on the receiver's. The sum of all entries for any account must equal its balance — this invariant is checkable and auditable at any time.",
      },
      {
        title: 'idempotency_key as the PK of transactions',
        reasoning:
          'Payment APIs must be idempotent — retrying a failed network request should not double-charge. The client generates a UUID and sends it with the request. ON CONFLICT DO NOTHING returns the existing transaction, making retries safe.',
      },
      {
        title: 'balance_cents CHECK constraint',
        reasoning:
          'CHECK (balance_cents >= 0) prevents overdrafts at the database level. No application bug can make an account go negative.',
      },
    ],
    queryPatterns: [
      {
        label: 'Transfer funds (atomic, using a transaction)',
        sql: `BEGIN;
UPDATE accounts SET balance_cents = balance_cents - $1
  WHERE id = $2 AND balance_cents >= $1;
UPDATE accounts SET balance_cents = balance_cents + $1
  WHERE id = $3;
INSERT INTO transaction_entries ...
COMMIT;`,
      },
      {
        label: 'Account statement (recent credits)',
        sql: `SELECT te.amount_cents, te.direction, t.created_at
FROM transaction_entries te
JOIN transactions t ON t.idempotency_key = te.transaction_id
WHERE te.account_id = $1
ORDER BY t.created_at DESC
LIMIT 50;`,
      },
    ],
    trap: "Updating `balance_cents` directly with `SET balance_cents = $new_value`. This is a last-write-wins update that loses concurrent transactions. Always use `SET balance_cents = balance_cents - $amount` so the DB applies the delta atomically.",
    bigTechTip:
      "Stripe's ledger is append-only — no UPDATE or DELETE ever runs on the transactions table. balance is derived by summing all entries. This guarantees a complete audit trail and makes reconciliation straightforward. They use a materialized balance column for read performance, recomputed in the background.",
  },
  {
    id: 'video',
    title: 'Video Platform: Uploads, Transcoding & Views',
    question:
      'Design the schema for a video streaming platform that processes uploaded videos through a transcoding pipeline and tracks view metrics.',
    difficulty: 'hard',
    entities: ['videos', 'video_renditions', 'view_events'],
    diagram: D_VIDEO,
    sqlSchema: `CREATE TABLE videos (
  id               BIGSERIAL PRIMARY KEY,
  uploader_id      BIGINT NOT NULL,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'processing'
                   CHECK (status IN ('processing','ready','failed','deleted')),
  raw_storage_key  TEXT,
  duration_seconds INT,
  view_count       BIGINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE video_renditions (
  id          BIGSERIAL PRIMARY KEY,
  video_id    BIGINT NOT NULL REFERENCES videos(id),
  resolution  TEXT NOT NULL,
  codec       TEXT NOT NULL,
  size_bytes  BIGINT,
  cdn_url     TEXT NOT NULL,
  UNIQUE (video_id, resolution, codec)
);

CREATE TABLE view_events (
  id            BIGSERIAL PRIMARY KEY,
  video_id      BIGINT NOT NULL REFERENCES videos(id),
  viewer_id     BIGINT,
  watch_seconds INT NOT NULL DEFAULT 0,
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (viewed_at);`,
    mongoNote:
      "YouTube-scale view counting cannot use a single PostgreSQL row — the `view_count` column would have thousands of concurrent writers. YouTube uses Bigtable (wide-column) for raw view events, aggregated by Dataflow, with the final count stored in Spanner. At startup scale, PostgreSQL with a background counter refresh is fine.",
    decisions: [
      {
        title: 'video_renditions for multi-quality streaming',
        reasoning:
          'A single uploaded video is transcoded into multiple resolutions (360p, 720p, 1080p) and codecs (H.264, AV1). Each rendition is a separate row with its own CDN URL — the player picks the appropriate rendition based on bandwidth.',
      },
      {
        title: 'view_count denormalized on videos',
        reasoning:
          'COUNT(*) on view_events for every video card render would be catastrophically slow. A pre-computed counter, incremented by a background job or event stream, gives O(1) read at the cost of slight staleness — acceptable for view counts.',
      },
    ],
    queryPatterns: [
      {
        label: 'Get available renditions for a video',
        sql: `SELECT resolution, codec, cdn_url
FROM video_renditions
WHERE video_id = $1
ORDER BY resolution DESC;`,
      },
      {
        label: 'Watch time per video (last 7 days)',
        sql: `SELECT video_id,
  SUM(watch_seconds) AS total_watch_seconds,
  COUNT(DISTINCT viewer_id) AS unique_viewers
FROM view_events
WHERE viewed_at > now() - INTERVAL '7 days'
GROUP BY video_id
ORDER BY total_watch_seconds DESC
LIMIT 20;`,
      },
    ],
    trap: "Storing all video renditions in a single JSON column on the videos row. When the player needs the 720p CDN URL, it fetches the entire JSON blob and filters client-side. A separate video_renditions table lets you query by resolution directly and add CDN-specific columns without schema changes.",
    bigTechTip:
      "Netflix separates video metadata (PostgreSQL, globally consistent) from viewing activity (Cassandra, time-series, regionally sharded) and from the actual video files (S3, replicated to CDN edge nodes). The status column on videos drives their transcoding pipeline — workers poll for status='processing' and update to 'ready' on completion.",
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: 'medium' | 'hard' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        difficulty === 'medium'
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400'
          : 'bg-rose-100 text-rose-900 dark:bg-rose-500/10 dark:text-rose-400',
      )}
    >
      {difficulty}
    </span>
  )
}

function EntityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-500/10 dark:text-blue-400">
      {label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {children}
    </p>
  )
}

function SqlBlock({ code }: { code: string }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-zinc-900">
      <pre className="p-4 font-mono text-xs leading-relaxed text-zinc-100">{code}</pre>
    </div>
  )
}

function MongoNote({ note }: { note: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
        MongoDB comparison
      </p>
      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">{note}</p>
    </div>
  )
}

function DecisionCard({ decision, index }: { decision: Decision; index: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
        <span className="mr-2 text-zinc-400 dark:text-zinc-500">{index + 1}.</span>
        {decision.title}
      </p>
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {decision.reasoning}
      </p>
    </div>
  )
}

function QueryPatternBlock({ pattern }: { pattern: QueryPattern }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {pattern.label}
      </p>
      <SqlBlock code={pattern.sql} />
    </div>
  )
}

function TrapCallout({ trap }: { trap: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/40">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
        Common trap
      </p>
      <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-200">{trap}</p>
    </div>
  )
}

function BigTechTip({ tip }: { tip: string }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
        Big Tech differentiator
      </p>
      <p className="text-sm leading-relaxed text-green-900 dark:text-green-200">{tip}</p>
    </div>
  )
}

// ─── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({
  scenario,
  index,
  isOpen,
  onToggle,
}: {
  scenario: Scenario
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      {/* Header / trigger */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-4 text-left transition-[colors,transform] active:scale-[0.97]',
          'hover:bg-gray-100 dark:hover:bg-zinc-700',
          isOpen && 'bg-gray-50 dark:bg-zinc-800',
        )}
      >
        {/* Number badge */}
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900 dark:bg-blue-500/10 dark:text-blue-400">
          {index + 1}
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {scenario.title}
            </span>
            <DifficultyBadge difficulty={scenario.difficulty} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scenario.entities.map((e) => (
              <EntityBadge key={e} label={e} />
            ))}
          </div>
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            'mt-0.5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400',
            isOpen && 'rotate-180',
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-6 border-t border-zinc-200 px-4 py-6 dark:border-zinc-700">
              {/* Question */}
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Question: </span>
                {scenario.question}
              </p>

              {/* ER Diagram */}
              <div>
                <SectionLabel>Entity relationship diagram</SectionLabel>
                <MermaidDiagram chart={scenario.diagram} fullscreen={false} />
              </div>

              {/* PostgreSQL schema */}
              <div>
                <SectionLabel>PostgreSQL schema</SectionLabel>
                <SqlBlock code={scenario.sqlSchema} />
              </div>

              {/* MongoDB note */}
              {scenario.mongoNote && <MongoNote note={scenario.mongoNote} />}

              {/* Design decisions */}
              <div>
                <SectionLabel>Design decisions</SectionLabel>
                <div className="space-y-3">
                  {scenario.decisions.map((d, i) => (
                    <DecisionCard key={d.title} decision={d} index={i} />
                  ))}
                </div>
              </div>

              {/* Query patterns */}
              <div>
                <SectionLabel>Query patterns</SectionLabel>
                <div className="space-y-4">
                  {scenario.queryPatterns.map((qp) => (
                    <QueryPatternBlock key={qp.label} pattern={qp} />
                  ))}
                </div>
              </div>

              {/* Trap + Big Tech tip */}
              <TrapCallout trap={scenario.trap} />
              <BigTechTip tip={scenario.bigTechTip} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function DataModelingAccordion() {
  const [openId, setOpenId] = useState<string | null>(null)

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-3">
      {SCENARIOS.map((scenario, index) => (
        <AccordionItem
          key={scenario.id}
          scenario={scenario}
          index={index}
          isOpen={openId === scenario.id}
          onToggle={() => toggle(scenario.id)}
        />
      ))}
    </div>
  )
}
