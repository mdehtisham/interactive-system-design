'use client'

import { MermaidDiagram } from '@/components/mdx/MermaidDiagram'

// Chart string is module-level to prevent MDX JSX parser from treating
// the `{` characters in erDiagram attribute blocks as JS expression boundaries.
const CHART = `erDiagram
  USER {
    ObjectId id PK
    string email UK
    string name
    string passwordHash
    date createdAt
  }
  POST {
    ObjectId id PK
    string title
    string slug UK
    string body
    ObjectId authorId FK
    string[] tags
    string status
    date createdAt
    date updatedAt
  }
  COMMENT {
    ObjectId id PK
    ObjectId postId FK
    ObjectId authorId FK
    string body
    date createdAt
  }
  USER ||--o{ POST : writes
  POST ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes`

export function ApiErDiagram() {
  return (
    <MermaidDiagram
      chart={CHART}
      caption="A blog API schema: one User writes many Posts, each Post has many Comments, each Comment belongs to both a Post and a User (author). The slug field is a URL-safe unique identifier — e.g. 'rest-apis-explained' — so resources are addressable by name without exposing internal ObjectIds."
      fullscreen={false}
    />
  )
}
