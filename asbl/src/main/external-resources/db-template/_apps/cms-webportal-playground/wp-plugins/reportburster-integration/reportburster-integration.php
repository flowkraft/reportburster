<?php

/**
 * Plugin Name: ReportBurster Integration
 * Plugin URI: https://reportburster.com/
 * Description: ReportBurster Integration for WordPress, a boilerplate plugin to integrate ReportBurster with WordPress.
 * Version: 1.0.0
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: FlowKraft
 * Author URI: https://reportburster.com/
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: reportburster-integration
 * Domain Path: languages
 *
 */

// Add to reportburster-integration.php (near the top)
require_once plugin_dir_path(__FILE__) . 'debug.php';

if (!defined('ABSPATH')) {
  exit();
}

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
|
| Composer provides a convenient, automatically generated class loader for
| our application. We just need to utilize it! We'll simply require it
| into the script here so that we don't have to worry about manual
| loading any of our classes later on. It feels nice to relax.
|
*/

require_once __DIR__ . '/bootstrap/autoload.php';

