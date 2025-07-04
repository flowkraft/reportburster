<?php

namespace ReportBurster_Integration\Http\Controllers;

class TemplateController extends Controller
{
    /**
     * The path to the generic PHP file that renders our Blade views.
     *
     * @var string
     */
    protected $renderer_path;

    public function __construct()
    {
        $plugin_dir = plugin_dir_path(dirname(dirname(dirname(__FILE__))));
        $this->renderer_path = $plugin_dir . 'bootstrap/render-view.php';
 
    }

    /**
     * Overrides the single post template, checking for auth rules defined in Pods.
     *
     * @param string $template The original template path.
     * @return string The new template path.
     */
    public function overrideSingleTemplate($template)
    {
        $post_type = get_post_type();

        // By default, assume the post type is NOT public. Secure by default.
        $is_public = false;

        // Check if Pods is active and if a rule has been set for this post type.
        if (function_exists('pods')) {
            $pod = pods_api()->load_pod(['name' => $post_type]);

            // Check if the 'allow_public_viewing' field exists in the Pod's options
            // and if its value is '1' (which means 'Yes').
            if (isset($pod['options']['allow_public_viewing']) && $pod['options']['allow_public_viewing'] == 1) {
                $is_public = true;
            }
        }

        // THE RULE: If the post type is NOT public AND the user is NOT logged in, redirect.
        if (!$is_public && !is_user_logged_in()) {
            wp_redirect(wp_login_url(get_permalink()));
            exit;
        }

        // --- The rest of the function remains the same ---
        $view_name = "single-{$post_type}";
        if (view()->exists($view_name)) {
            return $this->renderer_path;
        }

        return $template;
    }

    /**
     * Overrides the page template if a specific Blade view exists.
     *
     * @param string $template The original template path.
     * @return string The new template path.
     */
    public function overridePageTemplate($template)
    {
        if (is_page()) {
            $page_slug = get_post_field('post_name', get_queried_object_id());

            // You can keep hardcoded rules for specific, known pages like the dashboard.
            if ($page_slug === 'portal-dashboard' && !is_user_logged_in()) {
                wp_redirect(wp_login_url(get_permalink()));
                exit;
            }

            // --- The rest of the function remains the same ---
            $view_name = "page-{$page_slug}";
            if (view()->exists($view_name)) {
                return $this->renderer_path;
            }
        }

        return $template;
    }
}