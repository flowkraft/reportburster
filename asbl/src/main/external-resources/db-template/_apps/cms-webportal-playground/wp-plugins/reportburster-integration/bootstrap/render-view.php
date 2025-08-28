<?php
/**
 * Minimal template router: include plugin-scoped PHP template if present.
 * Looks for single-{post_type}.php or page-{slug}.php inside resources/views.
 */
if ( ! defined('ABSPATH') ) { exit; }

$plugin_root = dirname(__DIR__);
$views_dir   = $plugin_root . '/resources/views';

$include_view = function(string $name) use ($views_dir): bool {
    // Prefer plain PHP
    $php = $views_dir . '/' . $name . '.php';
    if ( file_exists($php) ) {
        include $php;
        return true;
    }
    // Optional legacy support if a .blade.php still exists but contains plain PHP
    $blade = $views_dir . '/' . $name . '.blade.php';
    if ( file_exists($blade) ) {
        include $blade;
        return true;
    }
    return false;
};

if ( is_page() ) {
    $slug = get_post_field('post_name', get_queried_object_id());
    if ( $include_view("page-{$slug}") ) {
        return;
    }
} elseif ( is_singular() ) {
    $pt = get_post_type();
    if ( $include_view("single-{$pt}") ) {
        return;
    }
}
