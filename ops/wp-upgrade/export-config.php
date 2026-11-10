<?php
// Exports the rr7-related backend settings of this site as JSON.
$groups = [];
foreach (acf_get_field_groups() as $group) {
  $group['fields'] = acf_get_fields($group['key']);
  $groups[] = acf_prepare_field_group_for_export($group);
}
$options = [];
foreach (['cptui_post_types', 'cptui_taxonomies', 'graphql_general_settings', 'wpseo', 'wpseo_titles', 'wpseo_social', 'blog_public', 'permalink_structure', 'active_plugins'] as $name) {
  $options[$name] = get_option($name);
}
echo wp_json_encode(['acf' => $groups, 'options' => $options], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
