<?php

/**
 * This file is loaded by the 'single_template' and 'page_template' filters.
 * Its job is to call the correct Blade view based on the WordPress query.
 */

if (is_page()) {
    $page_slug = get_post_field('post_name', get_queried_object_id());
    $view_name = "page-{$page_slug}"; // e.g., 'page-portal-dashboard'
    echo view($view_name);

} elseif (is_singular()) {
    $post_type = get_post_type();
    $view_name = "single-{$post_type}"; // e.g., 'single-invoice'
    echo view($view_name);
}