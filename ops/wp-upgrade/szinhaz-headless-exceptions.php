<?php
/**
 * Plugin Name: Színház headless exceptions
 * Description: Lets Yoast XML sitemaps and feeds through headless-mode, so the rr7 frontend can proxy them.
 */
add_filter('headless_mode_will_redirect', function ($redirect) {
  $path = trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
  $sitemap = '~^(sitemap_index\.xml|[a-z0-9_-]+-sitemap\d*\.xml|main-sitemap\.xsl)$~';
  $feed = '~(^|/)feed(/|$)~';
  if (preg_match($sitemap, $path) || preg_match($feed, $path)) {
    return false;
  }
  return $redirect;
});
