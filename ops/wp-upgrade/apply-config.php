<?php
// Applies the rr7 GraphQL settings (exported from the configured remix
// site) to this site. Usage: wp eval-file apply-config.php <config.json>
$src = json_decode(file_get_contents($args[0]), true);
if (!$src) { WP_CLI::error('cannot read config json'); }

// ACF: group- and field-level GraphQL settings, matched by key
$group_keys = ['show_in_graphql', 'graphql_field_name', 'map_graphql_types_from_location_rules', 'graphql_types'];
$field_keys = ['show_in_graphql', 'graphql_field_name', 'graphql_connection_type'];
$apply_fields = function ($fields) use (&$apply_fields, $field_keys) {
  foreach ($fields as $want) {
    $field = acf_get_field($want['key']);
    if (!$field) { WP_CLI::warning("field missing: {$want['key']}"); continue; }
    $changed = false;
    foreach ($field_keys as $k) {
      if (array_key_exists($k, $want) && ($field[$k] ?? null) !== $want[$k]) {
        $field[$k] = $want[$k];
        $changed = true;
      }
    }
    if ($changed) { acf_update_field($field); WP_CLI::log("  field {$field['name']}"); }
    if (!empty($want['sub_fields'])) $apply_fields($want['sub_fields']);
  }
};
foreach ($src['acf'] as $want) {
  $group = acf_get_field_group($want['key']);
  if (!$group) { WP_CLI::warning("group missing: {$want['key']}"); continue; }
  foreach ($group_keys as $k) {
    if (array_key_exists($k, $want)) $group[$k] = $want[$k];
  }
  acf_update_field_group($group);
  WP_CLI::log("group {$group['title']} -> {$group['graphql_field_name']}");
  $apply_fields($want['fields']);
}

// CPT UI: expose the quote and gallery post types to GraphQL
$types = get_option('cptui_post_types');
foreach (['idezet', 'galeria'] as $type) {
  foreach (['show_in_graphql', 'graphql_single_name', 'graphql_plural_name'] as $k) {
    $types[$type][$k] = $src['options']['cptui_post_types'][$type][$k];
  }
}
update_option('cptui_post_types', $types);
WP_CLI::log('cptui post types: idezet, galeria in GraphQL');

WP_CLI::success('config applied');
