<?php
<?php

/**
 * This file is loaded by template filters to render Blade views.
 */

//blade support for WordPress pages
if (is_page()) {
    $page_slug = get_post_field('post_name', get_queried_object_id());
    $view_name = "page-{$page_slug}"; // e.g., 'page-portal-dashboard'
    echo view($view_name);

} elseif (is_singular()) { //blade support for WordPress CPTs
    $post_type = get_post_type();
    $view_name = "single-{$post_type}"; // e.g., 'single-invoice'
    echo view($view_name);
    
}