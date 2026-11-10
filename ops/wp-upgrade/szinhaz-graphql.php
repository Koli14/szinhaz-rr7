<?php
/**
 * Plugin Name: Színház GraphQL
 * Description: Exposes the "Kapcsolódó cikkek" ACF options page to WPGraphQL as relatedPosts (the theme registers it without GraphQL).
 */
add_filter('acf/validate_options_page', function ($page) {
  if (($page['menu_slug'] ?? '') === 'related-posts') {
    $page['show_in_graphql'] = true;
    $page['graphql_type_name'] = 'RelatedPosts';
    $page['graphql_single_name'] = 'relatedPosts';
  }
  return $page;
});

// ACF returns the field default (#eda407) for terms without a colour; REST
// (and so Frontity) gave nothing and fell back to its own colours. Do the
// same for GraphQL: no stored colour, no value.
add_filter('acf/load_value/name=tax_color', function ($value, $post_id, $field) {
  if (!function_exists('is_graphql_request') || !is_graphql_request()) {
    return $value;
  }
  $decoded = acf_decode_post_id($post_id);
  if ($decoded['type'] !== 'term') {
    return $value;
  }
  return metadata_exists('term', $decoded['id'], $field['name']) ? $value : null;
}, 10, 3);
