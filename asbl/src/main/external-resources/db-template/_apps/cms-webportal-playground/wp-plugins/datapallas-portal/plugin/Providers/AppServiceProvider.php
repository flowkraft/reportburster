<?php

namespace ReportBurster_Portal\Providers;

use ReportBurster_Portal\Http\Controllers\TemplateController;
use ReportBurster_Portal\Provisioner;
use ReportBurster_Portal\WPBones\Support\ServiceProvider; 

// Log that this file was loaded
error_log('AppServiceProvider.php was loaded at: ' . date('Y-m-d H:i:s'));

class AppServiceProvider extends ServiceProvider
{
    
    /**
     * Register all hooks and filters for the plugin.
     * This method is called by the WPBones framework.
     */
    public function register()
    {
        // --- Run Demo Data Provisioning (idempotent) ---
        // Runs on 'init' hook with priority 20 to ensure Pods is loaded first
        add_action('init', [Provisioner::class, 'run'], 20);
        
        // --- Action to associate user with paystub after paystub is saved ---
        add_action('pods_api_post_save_pod_item_paystub', function($pieces, $is_new_item, $id) {
            // Log the action when the hook is triggered
            Provisioner::log("pods_api_post_save_pod_item_paystub fired for Paystub ID: {$id}", 'INFO');

            // Get the paystub pod
            $pod = pods('paystub', $id);

            // Retrieve the current associated user (if any)
            $current_user = $pod->field('associated_user');
            
            // Log the initial state of the associated user field
            if (empty($current_user)) {
                Provisioner::log("No user currently associated with paystub ID: {$id}", 'INFO');
            } else {
                Provisioner::log("Existing associated user found for paystub ID: {$id}, User ID: {$current_user[0]}", 'INFO');
            }

            // If there's no associated user, we need to associate one
            if (empty($current_user)) {
                // Get the post title and associated user login for context
                $title = $pod->field('post_title');
                $associated_user_login = $pod->field('associated_user_login');
                
                // Log the details we're working with
                Provisioner::log("Attempting to associate user with paystub '{$title}' (Post ID: {$id}). Associated user login: {$associated_user_login}", 'INFO');
                
                // Fetch the user by login
                $user = get_user_by('login', $associated_user_login);
                
                // If user exists, associate them with the paystub
                if ($user) {
                    // Log the successful user retrieval
                    Provisioner::log("User '{$associated_user_login}' found. Associating with paystub ID: {$id}, User ID: {$user->ID}", 'INFO');

                    // Save the association
                    $pod->save([
                        'associated_user' => [(int) $user->ID],
                    ]);
                    
                    // Log success
                    Provisioner::log("Successfully associated user '{$associated_user_login}' with paystub ID: {$id}", 'SUCCESS');
                } else {
                    // Log the failure to find the user
                    Provisioner::log("User '{$associated_user_login}' not found in WordPress. Could not associate with paystub ID: {$id}", 'ERROR');
                }
            } else {
                // Log that we didn't need to associate the user because one already exists
                Provisioner::log("No action needed. Paystub ID: {$id} already has an associated user.", 'INFO');
            }
        }, 10, 3);

        // --- Template Controller Hooks ---
        $templateController = new TemplateController();
        add_filter('single_template', [$templateController, 'overrideSingleTemplate']);
        add_filter('page_template', [$templateController, 'overridePageTemplate']);
        
        add_action('init', function () {
            $slug       = 'my-documents';
            $title      = 'My Documents';
            $option_key = 'reportburster_account_page_id';

            $page = get_page_by_path($slug);

            if ( $page ) {
                // If it was trashed, restore
                if ( $page->post_status === 'trash' ) {
                    wp_untrash_post( $page->ID );
                }
                update_option( $option_key, $page->ID );
                return;
            }

            // Create only if it does not exist
            $new_id = wp_insert_post([
                'post_type'    => 'page',
                'post_name'    => $slug,
                'post_title'   => $title,
                'post_status'  => 'publish',
                'post_content' => '<!-- Auto-generated account portal. Content rendered by plugin template. -->',
            ]);

            if ( $new_id && ! is_wp_error( $new_id ) ) {
                update_option( $option_key, $new_id );
            }
        }, 12);
        
        add_action('init', function() {
            if (function_exists('pods_api')) {
                $pods = pods_api()->load_pods(['type' => 'pod']);
                foreach ($pods as $pod) {
                    $pod_name = $pod['name'];
                    $uri = "{$pod_name}/*";
                    // Check if Pod Page already exists
                    $existing = get_page_by_title($uri, OBJECT, '_pods_page');
                    if (!$existing) {
                        $shortcode = "[render_blade_pod name=\"{$pod_name}\" slug=\"{@url.2}\"]";
                        $pod_page_id = wp_insert_post([
                            'post_title'   => $uri,
                            'post_type'    => '_pods_page',
                            'post_status'  => 'publish',
                            'post_content' => $shortcode,
                        ]);
                        update_post_meta($pod_page_id, 'pod', $pod_name);
                        update_post_meta($pod_page_id, 'pod_slug', '{@url.2}');
                    }
                }
            }
        });

        add_shortcode('render_blade_pod', function($atts) {
            $name = $atts['name'] ?? '';
            $slug = $atts['slug'] ?? '';
            if (!$name || !$slug) return '';
            $pod = pods($name, $slug);
            if ($pod) {
                $view_name = "single-{$name}";
                return view($view_name, ['pod' => $pod])->render();
            }
            return '';
        });

        // --- Asset Enqueuing ---
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);

        // --- Pods Admin Columns & Search Integration (Commented Out) ---
        // error_log('[ReportBurster] Registering Pods integration hooks');
        // add_action('init', [$this, 'integrate_with_pods'], 20);
    }

    /*
    public function integrate_with_pods()
    {
        static $already_integrated = false;
        
        // Prevent double integration
        if ($already_integrated) {
            error_log('[ReportBurster] Pods integration already run, skipping duplicate execution');
            return;
        }
        
        error_log('[ReportBurster] Running integrate_with_pods() method');
        
        // Double-check that Pods is active before adding hooks.
        if (!function_exists('pods')) {
            error_log('[ReportBurster] Pods function not found, aborting integration');
            return;
        }
        
        error_log('[ReportBurster] Pods function exists, proceeding with integration');
        
        // Add the "Show as column" option to the Pods field editor UI
        add_filter('pods_admin_setup_edit_field_options', [$this, 'add_pods_column_option'], 10, 2);
        
        // Register hooks for ALL post types, not just 'posts'
        $post_types = get_post_types(['public' => true]);
        error_log('[ReportBurster] Found post types: ' . implode(', ', $post_types));
        
        foreach ($post_types as $post_type) {
            // These hooks target the specific post type's admin columns
            add_filter("manage_{$post_type}_posts_columns", [$this, 'add_admin_columns']);
            add_action("manage_{$post_type}_posts_custom_column", [$this, 'populate_admin_columns'], 10, 2);
            error_log("[ReportBurster] Added column support for post type: {$post_type}");
        }
        
        // Add search functionality for the custom columns if we're on an admin page
        if (is_admin()) {
            add_filter('posts_join', [$this, 'search_join'], 10, 2);
            add_filter('posts_where', [$this, 'search_where'], 10, 2);
            add_filter('posts_distinct', [$this, 'search_distinct']);
            error_log("[ReportBurster] Added search filters for admin");
        }
        
        $already_integrated = true;
        error_log('[ReportBurster] Pods integration complete');
    }
    */

    /**
     * Adds a "Show as column in dashboard" checkbox to the Pods field editor.
     */
    /*
    public function add_pods_column_option($options, $pod)
    {
        $options['advanced']['show_admin_column'] = [
            'name' => 'show_admin_column',
            'label' => __('Show as column in dashboard', 'reportburster-integration'),
            'type' => 'boolean',
            'default' => 0,
            'help' => __('If checked, this field will be displayed as a column in the admin list view for this post type.', 'reportburster-integration')
        ];
        return $options;
    }
    */

    /**
     * Adds the custom columns to the WordPress admin list table.
     */
    /*
    public function add_admin_columns($columns)
    {
        error_log("[ReportBurster] add_admin_columns: Fired.");

        // Determine the post type from the filter hook itself for reliability.
        $post_type = substr(current_filter(), 7, -15); // Extracts 'payslip' from 'manage_payslip_posts_columns'

        if (empty($post_type)) {
            error_log("[ReportBurster] add_admin_columns: Could not determine post type from filter.");
            return $columns;
        }

        error_log("[ReportBurster] add_admin_columns: Checking for post type '{$post_type}'");

        // Get the Pod for the current post type
        $pod = pods($post_type);

        // Check if it's a valid Pod
        if (!$pod || !$pod->id()) {
            error_log("[ReportBurster] add_admin_columns: No valid pod found for '{$post_type}'");
            return $columns;
        }

        // Loop through the Pod's fields
        foreach ($pod->fields as $field_name => $field_data) {
            // Check if our custom option is set to true (1)
            if (!empty($field_data['options']['show_admin_column'])) {
                $columns[$field_name] = $field_data['label'];
                error_log("[ReportBurster] add_admin_columns: Adding column '{$field_name}' for post type '{$post_type}'");
            }
        }

        return $columns;
    }
    */

    /**
     * Populates the custom columns with data.
     */
    /*
    public function populate_admin_columns($column_name, $post_id)
    {
        // Get the post type from the post ID
        $post_type = get_post_type($post_id);

        // Get the Pod for this post type
        $pod = pods($post_type);

        // Check if the current column is a field in our Pod
        if ($pod && array_key_exists($column_name, $pod->fields)) {
            // Use the Pods API to get the display value for the field
            $value = $pod->field($column_name, $post_id);
            echo esc_html($value);
            error_log("[ReportBurster] populate_admin_columns: Populating '{$column_name}' for post #{$post_id}");
        }
    }
    */

    /**
     * Modifies the SQL JOIN for admin search.
     */
    /*
    public function search_join($join, $query)
    {
        global $wpdb;
        if (!$query->is_main_query() || !$query->is_search()) {
            return $join;
        }

        $join .= ' LEFT JOIN ' . $wpdb->postmeta . ' ON ' . $wpdb->posts . '.ID = ' . $wpdb->postmeta . '.post_id ';
        return $join;
    }
    */

    /**
     * Modifies the SQL WHERE for admin search.
     */
    /*
    public function search_where($where, $query)
    {
        global $wpdb;
        if (!$query->is_main_query() || !$query->is_search()) {
            return $where;
        }

        $search_term = $query->get('s');
        if (empty($search_term)) {
            return $where;
        }

        $where = preg_replace(
            "/\(\s*" . $wpdb->posts . ".post_title\s+LIKE\s*(\'[^\']+\')\s*\)/",
            "(" . $wpdb->posts . ".post_title LIKE $1) OR (" . $wpdb->postmeta . ".meta_value LIKE $1)",
            $where
        );

        return $where;
    }
    */

    /**
     * Ensures search results are unique.
     */
    /*
    public function search_distinct($distinct)
    {
        global $pagenow;
        if (is_admin() && $pagenow == 'edit.php' && is_search()) {
            return "DISTINCT";
        }
        return $distinct;
    }
    */

    /**
     * Enqueue plugin assets.
     */
    public function enqueueAssets()
    {
        // Enqueue ReportBurster web components from server (Svelte-based custom elements)
        wp_enqueue_script(
            'rb-webcomponents',
            'http://localhost:9090/rb-webcomponents/rb-webcomponents.umd.js',
            [], // no dependencies
            '1.0.0',
            true // load in footer
        );
    }
}