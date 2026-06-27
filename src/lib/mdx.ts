import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { TopicFrontmatter } from '@/types/mdx'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'topics')

/**
 * Returns slugs derived from MDX filenames on disk.
 * Falls back to an empty array when the content directory has not been created yet.
 */
export function getTopicSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => filename.replace(/\.mdx$/, ''))
}

/**
 * Reads and returns the raw MDX source for a given slug.
 * Throws a descriptive error when the file is missing so the caller
 * can decide whether to 404 or surface a build error.
 */
export function getTopicRawSource(slug: string): string {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `MDX file not found for slug "${slug}". Expected: ${filePath}`
    )
  }
  return fs.readFileSync(filePath, 'utf8')
}

/**
 * Parses only the YAML frontmatter from an MDX file using gray-matter.
 * Used by generateMetadata() to get the page title/description without
 * running the full compileMDX pipeline a second time.
 */
export function getTopicFrontmatter(slug: string): TopicFrontmatter {
  const raw = getTopicRawSource(slug)
  const { data } = matter(raw)
  return data as TopicFrontmatter
}
