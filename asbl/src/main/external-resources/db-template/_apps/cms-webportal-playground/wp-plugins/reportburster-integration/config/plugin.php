<?php

if (!defined('ABSPATH')) {
  exit();
}

return [

  /*
  |--------------------------------------------------------------------------
  | Plugin priorities
  | @since 1.9.5
  |--------------------------------------------------------------------------
  |
  | Here you may configure the priority of each hook your plugin uses.
  | Defaults to 10 if you don’t override them.
  |
  */

  'priorities' => [
    'init'              => 10,
    'widgets_init'      => 10,
    'admin_init'        => 10,
    'set_screen_option' => 10,
  ],

  /*
  |--------------------------------------------------------------------------
  | Logging Configuration
  |--------------------------------------------------------------------------
  |
  | Here you may configure the log settings for your plugin.
  |
  */

  "logging" => [
    /**
     * Type of log.
     * Available Settings: "single", "daily", "errorlog".
     *
     * - "errorlog", the log will be saved in the default WordPress log file.
     * Usually, this is located in the wp-content/debug.log file.
     *
     * - "single", the log will be saved in a single file in the log_path directory.
     * Default: [plugin-path]/storage/logs/debug.log
     *
     * - "daily", the log will be saved in a daily file in the log_path directory.
     * Default: [plugin-path]/storage/logs/[Y-m-d].log
     * Example: [plugin-path]/storage/logs/2024-10-09.log
     */
    "type" => "errorlog",

    /**
     * The path where the log will be saved.
     * Default: [plugin-path]/storage/logs/
     */
    //"path" => '',

    /**
     * Daily format.
     * Default: 'Y-m-d'
     */
    "daily_format" => 'Y-m-d',

    /**
     * The timestamp format used in the log.
     * Default: 'd-M-Y H:i:s T'
     * Example: [09-Oct-2024 12:51:22 UTC] [debug]: This is a debug message
     */
    "timestamp_format" => 'd-M-Y H:i:s T',
  ],


  /*
  |--------------------------------------------------------------------------
  | Screen options
  |--------------------------------------------------------------------------
  |
  | Here is where you can register the screen options for List Table.
  |
  */

  'screen_options' => [],

  /*
  |--------------------------------------------------------------------------
  | Custom Post Types
  |--------------------------------------------------------------------------
  |
  | Here is where you can register the Custom Post Types.
  |
  */

  'custom_post_types' => [],

  /*
  |--------------------------------------------------------------------------
  | Custom Taxonomies
  |--------------------------------------------------------------------------
  |
  | Here is where you can register the Custom Taxonomy Types.
  |
  */

  'custom_taxonomy_types' => [],


  /*
  |--------------------------------------------------------------------------
  | Shortcodes
  |--------------------------------------------------------------------------
  |
  | Here is where you can register the Shortcodes.
  |
  */

  'shortcodes' => [],

  /*
  |--------------------------------------------------------------------------
  | Widgets
  |--------------------------------------------------------------------------
  |
  | Here is where you can register all of the Widget for a plugin.
  |
  */

  'widgets' => [],


  /*
  |--------------------------------------------------------------------------
  | Ajax
  |--------------------------------------------------------------------------
  |
  | Here is where you can register your own Ajax actions.
  |
  */

  'ajax' => [],

  /*
  |--------------------------------------------------------------------------
  | Autoloaded Service Providers
  |--------------------------------------------------------------------------
  |
  | The service providers listed here will be automatically loaded on the
  | init to your plugin. Feel free to add your own services to
  | this array to grant expanded functionality to your applications.
  |
  */

  'providers' => []

];
