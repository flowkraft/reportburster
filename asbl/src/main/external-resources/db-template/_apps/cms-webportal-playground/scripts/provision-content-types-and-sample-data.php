<?php
/**
 * Provision Content Types and Sample Data for WordPress Portal
 * 
 * DEBUG VERSION - Maximum verbosity, no silent failures!
 */

// FORCE ALL ERRORS TO DISPLAY - NO HIDING ANYTHING!
error_reporting( E_ALL );
ini_set( 'display_errors', '1' );
ini_set( 'log_errors', '1' );

// Simple debug function that ALWAYS outputs to console
function dbg( $msg ) {
    $timestamp = date( 'H:i:s' );
    $line = "[PROVISION {$timestamp}] {$msg}\n";
    // Write to BOTH stdout and stderr to ensure visibility
    fwrite( STDOUT, $line );
    fwrite( STDERR, $line );
    // Also use error_log as backup
    error_log( $line );
}

// Debug function for arrays/objects
function dbg_dump( $label, $data ) {
    dbg( "{$label}: " . print_r( $data, true ) );
}

dbg( '========================================' );
dbg( 'STARTING PROVISIONING SCRIPT' );
dbg( '========================================' );
dbg( 'PHP Version: ' . PHP_VERSION );
dbg( 'Current working directory: ' . getcwd() );
dbg( 'Script file: ' . __FILE__ );

// Check if running in WP-CLI context
dbg( 'Checking WP-CLI context...' );
if ( ! defined( 'WP_CLI' ) ) {
    dbg( 'ERROR: Not running in WP-CLI context!' );
    dbg( 'WP_CLI constant is not defined.' );
    echo "ERROR: This script must be run via WP-CLI: wp eval-file ...\n";
    exit( 1 );
}
dbg( 'OK: Running in WP-CLI context' );

// Check if Pods plugin is loaded
dbg( 'Checking if Pods plugin is active...' );
dbg( 'function_exists(pods_api): ' . ( function_exists( 'pods_api' ) ? 'YES' : 'NO' ) );
dbg( 'function_exists(pods): ' . ( function_exists( 'pods' ) ? 'YES' : 'NO' ) );
dbg( 'class_exists(Pods): ' . ( class_exists( 'Pods' ) ? 'YES' : 'NO' ) );
dbg( 'class_exists(PodsAPI): ' . ( class_exists( 'PodsAPI' ) ? 'YES' : 'NO' ) );

if ( ! function_exists( 'pods_api' ) ) {
    dbg( 'FATAL ERROR: pods_api() function does not exist!' );
    dbg( 'Active plugins:' );
    $active_plugins = get_option( 'active_plugins', [] );
    dbg_dump( 'active_plugins', $active_plugins );
    throw new Exception( 'Pods plugin is not active - pods_api() function not found!' );
}
dbg( 'OK: Pods plugin is active' );

// Check if demo user already exists (idempotent check)
dbg( 'Checking if demo user clyde.grew already exists...' );
$existing_user = username_exists( 'clyde.grew' );
dbg( 'username_exists(clyde.grew) returned: ' . var_export( $existing_user, true ) );

if ( $existing_user ) {
    dbg( 'Demo user already exists - provisioning was already done.' );
    dbg( 'Exiting with success (idempotent - nothing to do).' );
    echo "SUCCESS: Demo data already provisioned.\n";
    exit( 0 );
}

dbg( 'Demo user does not exist - proceeding with full provisioning...' );

// ============================================================================
// 1. CREATE DEMO USERS
// ============================================================================
dbg( '' );
dbg( '=== STEP 1: CREATE DEMO USERS ===' );

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

dbg( 'Will create ' . count( $demo_users ) . ' demo users' );

// First check if the 'employee' role exists
dbg( 'Checking if employee role exists...' );
$employee_role = get_role( 'employee' );
dbg( 'get_role(employee) returned: ' . var_export( $employee_role, true ) );
if ( ! $employee_role ) {
    dbg( 'WARNING: employee role does not exist! Users will fail to create with that role.' );
    dbg( 'Available roles:' );
    global $wp_roles;
    dbg_dump( 'wp_roles->role_names', $wp_roles->role_names );
}

$user_ids = [];
foreach ( $demo_users as $index => $user_data ) {
    dbg( '' );
    dbg( "Creating user {$index}: {$user_data['user_login']}..." );
    dbg_dump( 'user_data', $user_data );
    
    // Check if already exists
    $existing = get_user_by( 'login', $user_data['user_login'] );
    if ( $existing ) {
        dbg( "User already exists with ID: {$existing->ID}" );
        $user_ids[ $user_data['user_login'] ] = $existing->ID;
        continue;
    }
    
    dbg( 'Calling wp_insert_user()...' );
    $result = wp_insert_user( $user_data );
    dbg( 'wp_insert_user() returned: ' . var_export( $result, true ) );
    
    if ( is_wp_error( $result ) ) {
        dbg( 'ERROR: wp_insert_user() failed!' );
        dbg( 'Error code: ' . $result->get_error_code() );
        dbg( 'Error message: ' . $result->get_error_message() );
        dbg_dump( 'Full error', $result );
        throw new Exception( "Failed to create user {$user_data['user_login']}: " . $result->get_error_message() );
    }
    
    dbg( "SUCCESS: Created user {$user_data['user_login']} with ID: {$result}" );
    $user_ids[ $user_data['user_login'] ] = $result;
}

dbg( '' );
dbg( 'User creation complete.' );
dbg_dump( 'user_ids', $user_ids );

// ============================================================================
// 2. CREATE PAYSTUB POD (Custom Post Type)
// ============================================================================
dbg( '' );
dbg( '=== STEP 2: CREATE PAYSTUB POD ===' );

dbg( 'Getting Pods API instance...' );
$pods_api = pods_api();
dbg( 'pods_api() returned: ' . get_class( $pods_api ) );

dbg( 'Checking if paystub pod already exists...' );
$existing_pod = $pods_api->load_pod( [ 'name' => 'paystub' ] );
dbg( 'load_pod(paystub) returned: ' . var_export( ! empty( $existing_pod ), true ) );

if ( $existing_pod && ! empty( $existing_pod['id'] ) ) {
    $pod_id = $existing_pod['id'];
    dbg( "Paystub pod already exists with ID: {$pod_id}" );
} else {
    dbg( 'Paystub pod does not exist, creating...' );
    
    $pod_args = [
        'name'           => 'paystub',
        'label'          => 'Paystub',
        'label_singular' => 'Paystub',
        'type'           => 'post_type',
        'public'         => true,
        'show_ui'        => true,
        'show_in_menu'   => true,
        'supports'       => [ 'title' ],
        'menu_icon'      => 'dashicons-media-spreadsheet',
    ];
    dbg_dump( 'pod_args', $pod_args );
    
    dbg( 'Calling pods_api()->save_pod()...' );
    $pod_id = $pods_api->save_pod( $pod_args );
    dbg( 'save_pod() returned: ' . var_export( $pod_id, true ) );
    
    if ( ! $pod_id ) {
        dbg( 'FATAL ERROR: save_pod() returned falsy value!' );
        throw new Exception( 'Failed to create Paystub pod - save_pod() returned: ' . var_export( $pod_id, true ) );
    }
    
    dbg( "SUCCESS: Created Paystub pod with ID: {$pod_id}" );
}

// ============================================================================
// 3. ADD FIELDS TO PAYSTUB POD
// ============================================================================
dbg( '' );
dbg( '=== STEP 3: ADD FIELDS TO PAYSTUB POD ===' );

$fields = [
    [ 'name' => 'employee',        'label' => 'Employee',        'type' => 'text' ],
    [ 'name' => 'period',          'label' => 'Period',          'type' => 'text' ],
    [ 'name' => 'gross_amount',    'label' => 'Gross Amount',    'type' => 'number' ],
    [ 'name' => 'net_amount',      'label' => 'Net Amount',      'type' => 'number' ],
    [ 'name' => 'associated_user', 'label' => 'Associated User', 'type' => 'pick', 'pick_object' => 'user' ],
];

foreach ( $fields as $field ) {
    dbg( '' );
    dbg( "Adding field: {$field['name']}..." );
    
    $field['pod']    = 'paystub';
    $field['pod_id'] = $pod_id;
    dbg_dump( 'field_args', $field );
    
    dbg( 'Calling pods_api()->save_field()...' );
    $field_id = $pods_api->save_field( $field );
    dbg( 'save_field() returned: ' . var_export( $field_id, true ) );
    
    if ( $field_id ) {
        dbg( "SUCCESS: Field {$field['name']} saved with ID: {$field_id}" );
    } else {
        dbg( "WARNING: Field {$field['name']} - save_field returned falsy (may already exist)" );
    }
}

dbg( '' );
dbg( 'Flushing rewrite rules...' );
flush_rewrite_rules( true );
dbg( 'Rewrite rules flushed.' );

// ============================================================================
// 4. CREATE SAMPLE PAYSTUB POSTS
// ============================================================================
dbg( '' );
dbg( '=== STEP 4: CREATE SAMPLE PAYSTUB POSTS ===' );

$paystubs = [
    [
        'post_title'            => 'March 2024 Paystub - Clyde Grew',
        'employee'              => 'Clyde Grew',
        'period'                => 'March 2024',
        'gross_amount'          => 4000,
        'net_amount'            => 3790,
        'associated_user_login' => 'clyde.grew',
    ],
    [
        'post_title'            => 'March 2024 Paystub - Kyle Butford',
        'employee'              => 'Kyle Butford',
        'period'                => 'March 2024',
        'gross_amount'          => 3000,
        'net_amount'            => 2890,
        'associated_user_login' => 'kyle.butford',
    ],
    [
        'post_title'            => 'March 2024 Paystub - Alfreda Waldback',
        'employee'              => 'Alfreda Waldback',
        'period'                => 'March 2024',
        'gross_amount'          => 3500,
        'net_amount'            => 3590,
        'associated_user_login' => 'alfreda.waldback',
    ],
];

dbg( 'Will create ' . count( $paystubs ) . ' paystub posts' );

// First verify the post type is registered
dbg( 'Checking if paystub post type is registered...' );
$post_type_obj = get_post_type_object( 'paystub' );
dbg( 'get_post_type_object(paystub): ' . var_export( ! empty( $post_type_obj ), true ) );
if ( ! $post_type_obj ) {
    dbg( 'WARNING: paystub post type not registered yet! This may cause wp_insert_post to fail.' );
    dbg( 'Registered post types:' );
    dbg_dump( 'post_types', get_post_types() );
}

foreach ( $paystubs as $index => $paystub ) {
    dbg( '' );
    dbg( "Creating paystub {$index}: {$paystub['employee']}..." );
    
    dbg( 'Calling wp_insert_post()...' );
    $post_data = [
        'post_type'   => 'paystub',
        'post_title'  => $paystub['post_title'],
        'post_status' => 'publish',
    ];
    dbg_dump( 'post_data', $post_data );
    
    $post_id = wp_insert_post( $post_data, true ); // true = return WP_Error on failure
    dbg( 'wp_insert_post() returned: ' . var_export( $post_id, true ) );
    
    if ( is_wp_error( $post_id ) ) {
        dbg( 'ERROR: wp_insert_post() failed!' );
        dbg( 'Error code: ' . $post_id->get_error_code() );
        dbg( 'Error message: ' . $post_id->get_error_message() );
        throw new Exception( "Failed to create paystub for {$paystub['employee']}: " . $post_id->get_error_message() );
    }
    
    dbg( "SUCCESS: Created post with ID: {$post_id}" );
    
    // Save meta fields
    dbg( 'Saving meta fields...' );
    update_post_meta( $post_id, 'employee', $paystub['employee'] );
    dbg( "  - employee = {$paystub['employee']}" );
    
    update_post_meta( $post_id, 'period', $paystub['period'] );
    dbg( "  - period = {$paystub['period']}" );
    
    update_post_meta( $post_id, 'gross_amount', $paystub['gross_amount'] );
    dbg( "  - gross_amount = {$paystub['gross_amount']}" );
    
    update_post_meta( $post_id, 'net_amount', $paystub['net_amount'] );
    dbg( "  - net_amount = {$paystub['net_amount']}" );
    
    // Link to user
    $user_login = $paystub['associated_user_login'];
    if ( isset( $user_ids[ $user_login ] ) ) {
        update_post_meta( $post_id, 'associated_user', $user_ids[ $user_login ] );
        dbg( "  - associated_user = {$user_ids[ $user_login ]} (user: {$user_login})" );
    } else {
        dbg( "  - WARNING: No user ID found for {$user_login}" );
    }
    
    dbg( "Paystub for {$paystub['employee']} complete." );
}

// ============================================================================
// FINAL VERIFICATION
// ============================================================================
dbg( '' );
dbg( '=== FINAL VERIFICATION ===' );

$user_count = count( $user_ids );
dbg( "Users created/found: {$user_count}" );

$paystub_counts = wp_count_posts( 'paystub' );
dbg_dump( 'wp_count_posts(paystub)', $paystub_counts );
$paystub_count = $paystub_counts->publish ?? 0;
dbg( "Paystubs published: {$paystub_count}" );

dbg( '' );
dbg( '========================================' );
if ( $user_count >= 3 && $paystub_count >= 3 ) {
    dbg( 'PROVISIONING COMPLETED SUCCESSFULLY!' );
    echo "SUCCESS: Provisioning complete - {$user_count} users, {$paystub_count} paystubs.\n";
} else {
    dbg( "WARNING: Provisioning completed but counts are low!" );
    dbg( "Expected: 3 users, 3 paystubs" );
    dbg( "Got: {$user_count} users, {$paystub_count} paystubs" );
    echo "WARNING: Provisioning may have issues - check logs above.\n";
}
dbg( '========================================' );