<?php
/**
 * Debug file to test WPBones framework loading
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Create log function
if (!function_exists('rb_debug_log')) {
    function rb_debug_log($message) {
        if (is_array($message) || is_object($message)) {
            error_log(print_r($message, true));
        } else {
            error_log($message);
        }
    }
}

// Log that the debug file was loaded
rb_debug_log('Debug file loaded: ' . date('Y-m-d H:i:s'));

// Test if ServiceProvider class exists
$service_provider_exists = class_exists('ReportBurster_Portal\WPBones\Support\ServiceProvider');
rb_debug_log('ServiceProvider class exists: ' . ($service_provider_exists ? 'YES' : 'NO'));

// Test if AppServiceProvider class exists
$app_provider_exists = class_exists('ReportBurster_Portal\Providers\AppServiceProvider');
rb_debug_log('AppServiceProvider class exists: ' . ($app_provider_exists ? 'YES' : 'NO'));

// Test if the provider was registered
$providers_config = null;
if (file_exists(__DIR__ . '/config/plugin.php')) {
    $providers_config = require __DIR__ . '/config/plugin.php';
    rb_debug_log('Found plugin.php config: ' . print_r($providers_config, true));
}

// Log the autoload path
$composer_autoload = __DIR__ . '/vendor/autoload.php';
rb_debug_log('Composer autoload path exists: ' . (file_exists($composer_autoload) ? 'YES' : 'NO'));