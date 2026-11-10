import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

export default {
  ssr: true,
  presets: [vercelPreset()],
  future: {
    // Keeps the trailing slash in client data requests (/tag/x/_.data), so
    // the loaders' WordPress-style trailing slash redirects don't loop
    unstable_trailingSlashAwareDataRequests: true,
  },
} satisfies Config
