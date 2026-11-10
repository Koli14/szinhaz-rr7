import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

export default {
  ssr: true,
  presets: [vercelPreset()],
  // Ship the whole (small) route manifest with the page. Lazy discovery skips
  // pages with many links (the /__manifest URL gets too long), and then the
  // links can't prefetch.
  routeDiscovery: { mode: 'initial' },
  future: {
    // Keeps the trailing slash in client data requests (/tag/x/_.data), so
    // the loaders' WordPress-style trailing slash redirects don't loop
    unstable_trailingSlashAwareDataRequests: true,
  },
} satisfies Config
