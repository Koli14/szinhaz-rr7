import { Link as RouterLink } from 'react-router'
import type { LinkProps } from 'react-router'

// Loads the target page's data and code on hover, focus or touch start (like
// Frontity's link prefetch), so the page is ready by the time of the click.
export function Link({ prefetch = 'intent', ...props }: LinkProps) {
  return <RouterLink prefetch={prefetch} {...props} />
}
