<?php

namespace ReportBurster_Portal\Http\Controllers;

class TemplateController extends Controller
{
    protected string $renderer_path;

    public function __construct()
    {
        $this->renderer_path = plugin_dir_path( dirname( __DIR__, 2 ) ) . 'bootstrap/render-view.php';

        add_filter( 'single_template', [ $this, 'overrideSingleTemplate' ], 50 );
        add_filter( 'page_template',   [ $this, 'overridePageTemplate' ], 50 );
    }

    public function overrideSingleTemplate( $template )
    {
        if ( ! is_singular() ) {
            return $template;
        }

        $post_type = get_post_type();
        if ( ! $post_type ) { return $template; }

        $views_dir = plugin_dir_path( dirname( __DIR__, 2 ) ) . 'resources/views';
        if (
            file_exists( $views_dir . "/single-{$post_type}.php" ) ||
            file_exists( $views_dir . "/single-{$post_type}.blade.php" )
        ) {
            return $this->renderer_path;
        }

        return $template;
    }

    public function overridePageTemplate( $template )
    {
        if ( ! is_page() ) {
            return $template;
        }

        $slug = get_post_field( 'post_name', get_queried_object_id() );
        if ( ! $slug ) { return $template; }

        // Force login for the account portal (my-documents) always.
        if ( $slug === 'my-documents' && ! is_user_logged_in() ) {
            wp_redirect( wp_login_url( get_permalink() ) );
            exit;
        }

        $views_dir = plugin_dir_path( dirname( __DIR__, 2 ) ) . 'resources/views';
        if (
            file_exists( $views_dir . "/page-{$slug}.php" ) ||
            file_exists( $views_dir . "/page-{$slug}.blade.php" )
        ) {
            return $this->renderer_path;
        }

        return $template;
    }
}