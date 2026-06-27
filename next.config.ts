import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  turbopack: {
    root: __dirname,
  },
  // MDX pipeline (rehype-shiki + rehype-mermaid + remark plugins) configured in Phase 02
  // when actual .mdx content files are added. Turbopack requires serializable plugin options
  // which function-based remark/rehype plugins do not satisfy — see 02-content-infrastructure.md
}

export default nextConfig
