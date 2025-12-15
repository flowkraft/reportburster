<?php

namespace ReportBurster_Portal;

// ------------------------------
// IMPORT WORDPRESS CORE FUNCTIONS
// ------------------------------
use WP_Query;
use function add_action;
use function add_filter;
use function current_time;
use function delete_option;
use function error_log;
use function esc_html;
use function flush_rewrite_rules;
use function get_bloginfo;
use function get_option;
use function get_page_by_title;
use function get_post;
use function get_role;
use function get_user_by;
use function get_userdata;
use function is_wp_error;
use function update_option;
use function wp_delete_post;
use function wp_delete_user;
use function wp_insert_user;
use function wp_update_post;

// ------------------------------
// IMPORT PODS FUNCTIONS
// ------------------------------
use function pods;
use function pods_api;

/**
 * Provisioner - Creates demo users, Pods CPT, and sample data on plugin load.
 */
class Provisioner
{
    public static string $LOG_PREFIX = '[ReportBurster Provisioner]';
    public static string $PROVISIONED_OPTION = 'reportburster_demo_data_provisioned';
    public static string $CHANGES_OPTION = 'reportburster_provision_changes';
    public static string $PREV_HOME_OPTION = 'reportburster_prev_homepage_content';

    private static array $created_paystubs = [];

    /**
     * Register admin list column for paystub post type to show the associated user
     */
    public static function registerAdminColumns(): void
    {
        if (!function_exists('add_filter') || !function_exists('add_action')) {
            return;
        }

        add_filter('manage_paystub_posts_columns', [self::class, 'addEmployeeColumn']);
        add_action('manage_paystub_posts_custom_column', [self::class, 'renderEmployeeColumn'], 10, 2);
    }

    public static function addEmployeeColumn(array $columns): array
    {
        $new = [];
        foreach ($columns as $key => $label) {
            $new[$key] = $label;
            if ($key === 'title') {
                $new['employee'] = 'Employee';
            }
        }
        return $new;
    }

    public static function renderEmployeeColumn(string $column, int $post_id): void
    {
        if ($column !== 'employee') {
            return;
        }

        $pod = pods('paystub', $post_id);
        $value = $pod ? $pod->field('associated_user') : null;

        if (empty($value)) {
            echo '<em>None</em>';
            return;
        }

        if (is_array($value)) {
            if (!empty($value['display_name'])) {
                echo esc_html($value['display_name']);
                return;
            }
            if (!empty($value['user_login'])) {
                echo esc_html($value['user_login']);
                return;
            }
            echo esc_html(json_encode($value));
            return;
        }

        if (is_numeric($value)) {
            $user = get_userdata((int)$value);
            echo $user ? esc_html($user->display_name) : '<em>Unknown</em>';
            return;
        }

        echo esc_html((string)$value);
    }

    public static function log(string $message, string $level = 'INFO'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        error_log(self::$LOG_PREFIX . " [{$level}] [{$timestamp}] {$message}");
    }

    public static function run(): void
    {
        # try {
        #    self::down();
        # } catch (\Exception $e) {
        #    self::log('Down() error: ' . $e->getMessage(), 'WARN');
        # }

        if (!pods_api()) {
            self::log('Pods not loaded yet.', 'WAIT');
            return;
        }

        // Stop once provisioning has completed successfully
        if (get_option(self::$PROVISIONED_OPTION)) {
            self::log('Already provisioned. Skipping.', 'SKIP');
            return;
        }
    
        try {
            self::up();
        } catch (\Exception $e) {
            self::log('Up() error: ' . $e->getMessage(), 'ERROR');
        }
    }

    /**
     * Apply provisioning logic
     */
    public static function up(): void
    {
        if (!get_role('employee')) {
            self::log('Employee role missing.', 'WAIT');
            return;
        }

        self::$created_paystubs = [];

        $hello_world = get_page_by_title('Hello world!', OBJECT, 'post');
        if (!$hello_world) {
            $hello_world = get_post(1);
        }

        if ($hello_world) {
            update_option(self::$PREV_HOME_OPTION, [
                'id'      => $hello_world->ID,
                'title'   => $hello_world->post_title,
                'content' => $hello_world->post_content
            ], true);
            self::log('Backed up homepage.');
        }

        self::log('--- STEP 1: Creating demo users');
        $users = self::createDemoUsers();

        self::log('--- STEP 2: Creating Paystub Pod');
        $pod_id = self::createPaystubPod();

        self::log('--- STEP 3: Adding Fields');
        self::addPaystubFields($pod_id);

        flush_rewrite_rules(true);

        $api = pods_api();
        $api->cache_flush_pods('paystub', true, true);

        self::log('--- STEP 4: Creating Paystubs');
        self::createSamplePaystubs($users);

        self::log('--- STEP 5: Updating homepage');
        self::updateHomepageContent();

        flush_rewrite_rules(true);

        update_option(self::$CHANGES_OPTION, [
            'users'     => array_values($users),
            'paystubs'  => self::$created_paystubs,
            'pod_id'    => $pod_id,
        ], true);

        update_option(self::$PROVISIONED_OPTION, [
            'version'   => '1.0.0',
            'timestamp' => current_time('mysql'),
            'users'     => count($users),
            'pod_id'    => $pod_id,
        ], true);

        self::log('Provisioning complete.');
    }

    private static function createDemoUsers(): array
    {
        $demo_users = [
            [
                'user_login'   => 'clyde.grew',
                'user_pass'    => 'demo1234',
                'user_email'   => 'clyde.grew@northridgehealth.org',
                'display_name' => 'Clyde Grew',
                'role'         => 'employee',
            ],
            [
                'user_login'   => 'kyle.butford',
                'user_pass'    => 'demo1234',
                'user_email'   => 'kyle.butford@northridgehealth.org',
                'display_name' => 'Kyle Butford',
                'role'         => 'employee',
            ],
            [
                'user_login'   => 'alfreda.waldback',
                'user_pass'    => 'demo1234',
                'user_email'   => 'alfreda.waldback@northridgehealth.org',
                'display_name' => 'Alfreda Waldback',
                'role'         => 'employee',
            ],
        ];

        $user_ids = [];

        foreach ($demo_users as $u) {
            $existing = get_user_by('login', $u['user_login']);

            if ($existing) {
                $user_ids[$u['user_login']] = $existing->ID;
                self::log("User exists: {$u['user_login']}", 'SKIP');
                continue;
            }

            $result = wp_insert_user($u);
            if (is_wp_error($result)) {
                throw new \Exception("Failed creating user {$u['user_login']}: " . $result->get_error_message());
            }

            $user_ids[$u['user_login']] = $result;
            self::log("Created user: {$u['user_login']} (ID: $result)");
        }

        return $user_ids;
    }

    private static function createPaystubPod(): int
    {
        $api = pods_api();

        $existing = $api->load_pod(['name' => 'paystub']);
        if ($existing && !empty($existing['id'])) {
            self::log("Pod exists (ID {$existing['id']})", 'SKIP');
            return (int)$existing['id'];
        }

        $pod_id = $api->save_pod([
            'name'           => 'paystub',
            'label'          => 'Paystub',
            'label_singular' => 'Paystub',
            'type'           => 'post_type',
            'public'         => true,
            'show_ui'        => true,
            'supports'       => ['title'],
            'menu_icon'      => 'dashicons-media-spreadsheet',
        ]);

        if (!$pod_id) {
            throw new \Exception('Pods failed to create paystub pod.');
        }

        return (int)$pod_id;
    }

    private static function addPaystubFields(int $pod_id): void
    {
        $api = pods_api();

        $schema = $api->load_pod(['name' => 'paystub']);
        $existing = array_keys($schema['fields'] ?? []);

        $fields = [
            ['name' => 'employee', 'label' => 'Employee', 'type' => 'text'],
            ['name' => 'period', 'label' => 'Period', 'type' => 'text'],
            ['name' => 'gross_amount', 'label' => 'Gross Amount', 'type' => 'number'],
            ['name' => 'net_amount', 'label' => 'Net Amount', 'type' => 'number'],
            ['name' => 'associated_user_login', 'label' => 'Associated User Login', 'type' => 'text'],
            [
                'name'              => 'associated_user',
                'label'             => 'Associated User',
                'type'              => 'pick',
                'pick_object'       => 'user',
                'pick_val'          => 'id',
                'pick_format_type'  => 'single',
            ],
        ];

        foreach ($fields as $field) {
            if (in_array($field['name'], $existing, true)) {
                self::log("Field exists: {$field['name']}", 'SKIP');
                continue;
            }

            $api->save_field(array_merge($field, [
                'pod' => 'paystub',
                'pod_id' => $pod_id,
            ]));

            $api->cache_flush_pods('paystub', true, true);

            self::log("Added field: {$field['name']}");
        }
    }
 
    public static function createSamplePaystubs(array $user_ids): void
    {
        $items = [
            [
                'post_title' => 'March 2024 Paystub - Clyde Grew',
                'employee'   => 'Clyde Grew',
                'period'     => 'March 2024',
                'gross_amount' => 4000,
                'net_amount'   => 3790,
                'associated_user_login' => 'clyde.grew',
            ],
            [
                'post_title' => 'March 2024 Paystub - Kyle Butford',
                'employee'   => 'Kyle Butford',
                'period'     => 'March 2024',
                'gross_amount' => 3000,
                'net_amount'   => 2890,
                'associated_user_login' => 'kyle.butford',
            ],
            [
                'post_title' => 'March 2024 Paystub - Alfreda Waldback',
                'employee'   => 'Alfreda Waldback',
                'period'     => 'March 2024',
                'gross_amount' => 3500,
                'net_amount'   => 3590,
                'associated_user_login' => 'alfreda.waldback',
            ],
        ];

        foreach ($items as $item) {
            $user_id = $user_ids[$item['associated_user_login']] ?? null;
            if (!$user_id) {
                self::log("Missing user for {$item['post_title']}", 'WARN');
                continue;
            }

            $existing_query = new WP_Query([
                'post_type'      => 'paystub',
                'post_status'    => 'publish',
                'title'          => $item['post_title'],
                'posts_per_page' => 1,
                'fields'         => 'ids', // More efficient, we only need the ID
            ]);

            $existing_post_id = $existing_query->have_posts() ? $existing_query->posts[0] : null;

            // -----------------------------------
            // CASE 1: Paystub already exists
            // -----------------------------------
            if ($existing_post_id) {
                $pod = pods('paystub', $existing_post_id);
                $current_user = $pod->field('associated_user');

                // Already associated → do nothing
                if (!empty($current_user)) {
                    self::log("Paystub already associated: {$item['post_title']}", 'SKIP');
                    self::$created_paystubs[] = $existing_post_id;
                    continue;
                }

                // Missing association → FIX IT
                $pod->save([
                    'associated_user' => [ (int) $user_id ],
                ]);

                self::log("Fixed association for paystub: {$item['post_title']}");
                self::$created_paystubs[] = $existing_post_id;
                continue;
            }

            // -----------------------------------
            // CASE 2: Paystub does NOT exist → create it
            // -----------------------------------
            $api = pods_api();
            $pod = pods('paystub');
            $attempt = 0;
            $max_attempts = 3;

            // Retry if field not ready
            while ($attempt < $max_attempts && $pod->field('associated_user') === null) {
                $attempt++;
                self::log("associated_user field not ready, retrying ({$attempt}/{$max_attempts})...", 'WARN');

                flush_rewrite_rules(true);  // Reset WordPress rewrite rules
                
                $api->cache_flush_pods('paystub', true, true);

                $pod = pods('paystub');      // Reload the Pod

                // Optional delay between retries (0.5 seconds)
                usleep(500000);
            }

            $post_id = $pod->add([
                'post_title'   => $item['post_title'],
                'post_status'  => 'publish',
                'employee'     => $item['employee'],
                'period'       => $item['period'],
                'gross_amount' => $item['gross_amount'],
                'net_amount'   => $item['net_amount'],
                'associated_user_login' => $item['associated_user_login'],
                'associated_user' => [ (int) $user_id ],
            ]);

            self::log("Created paystub: {$item['post_title']}");
            self::$created_paystubs[] = $post_id;
        }
    }

    public static function down(): void
    {
        if (!pods_api()) {
            return;
        }

        self::log('Rollback: start');

        $home = get_option(self::$PREV_HOME_OPTION);
        if (!empty($home['id'])) {
            $restore = wp_update_post([
                'ID' => $home['id'],
                'post_title' => $home['title'],
                'post_content' => $home['content'],
            ], true);

            if (!is_wp_error($restore)) {
                self::log('Restored homepage.');
            }
        }

        $changes = get_option(self::$CHANGES_OPTION, []);

        if (!empty($changes['paystubs'])) {
            foreach ($changes['paystubs'] as $id) {
                if (get_post($id)) {
                    wp_delete_post((int)$id, true);
                }
            }
        }

        if (!empty($changes['users'])) {
            foreach ($changes['users'] as $uid) {
                if (get_userdata($uid)) {
                    wp_delete_user((int)$uid, true);
                }
            }
        }

        if (!empty($changes['pod_id'])) {
            $api = pods_api();
            if (method_exists($api, 'delete_pod')) {
                $api->delete_pod((int)$changes['pod_id']);
            } else {
                $pod = $api->load_pod(['id' => (int)$changes['pod_id']]);
                if ($pod) {
                    $api->save_pod(['name' => $pod['name'], 'delete' => true]);
                }
            }
        }

        delete_option(self::$CHANGES_OPTION);
        delete_option(self::$PROVISIONED_OPTION);
        delete_option(self::$PREV_HOME_OPTION);

        self::log('Rollback complete.');
    }

    private static function updateHomepageContent(): void
    {
        // Attempt to get existing page titled "Welcome to ReportBurster Portal"
        $home_page = get_page_by_title('Welcome to ReportBurster Portal', OBJECT, 'page');

        // Update existing page content if needed
        $documents_url = site_url('/my-documents');

        // If page does not exist, create it
        if (!$home_page) {
            $home_page_id = wp_insert_post([
                'post_title'    => 'Welcome to ReportBurster Portal',
                'post_content' => '<p>The fastest way to build your <em>You Name It</em> <strong>Web Portal</strong> - could be Employee Portal, Customer Portal, Partner Portal, Student Portal or any other Self-Service Portal.</p><br/><br/><br/><a href="' . esc_url($documents_url) . '" class="inline-block px-6 py-2 mt-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2" style="--color-cyan-600: oklch(60.9% 0.126 221.723); background-color: var(--color-cyan-600); color: #ffffff; text-decoration: none;">My Documents</a>',
                'post_status'   => 'publish',
                'post_type'     => 'page',
            ]);

            if (is_wp_error($home_page_id)) {
                self::log('Failed to create homepage: ' . $home_page_id->get_error_message(), 'ERROR');
                return;
            }

            $home_page = get_post($home_page_id);
            self::log('Homepage created: ' . $home_page->post_title);
        } else {
            // Update existing page content if needed
            $result = wp_update_post([
                'ID'           => $home_page->ID,
                'post_content' => '<p>The fastest way to build your <em>You Name It</em> <strong>Web Portal</strong> - could be Employee Portal, Customer Portal, Partner Portal, Student Portal or any other Self-Service Portal.</p><br/><br/><br/><a href="' . esc_url($documents_url) . '" class="inline-block px-6 py-2 mt-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2" style="--color-cyan-600: oklch(60.9% 0.126 221.723); background-color: var(--color-cyan-600); color: #ffffff; text-decoration: none;">My Documents</a>',
            ], true);

            if (is_wp_error($result)) {
                self::log('Failed updating homepage: ' . $result->get_error_message(), 'ERROR');
                return;
            }

            self::log('Homepage updated: ' . $home_page->post_title);
        }

        // Set this page as the default homepage
        update_option('show_on_front', 'page');
        update_option('page_on_front', $home_page->ID);
        self::log('Homepage set as front page: ' . $home_page->post_title);
    }

}

if (function_exists('add_action')) {
    Provisioner::registerAdminColumns();
}
