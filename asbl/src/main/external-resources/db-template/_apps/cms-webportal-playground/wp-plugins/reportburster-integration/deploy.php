<?php

/**
 * This file is included by "bones" command. You'll find
 *
 * $this Instance of bones command console
 * $path Destination path
 *
 * You'll able to:
 *
 * Delete a file
 *   @unlink("{$path}/myfile");
 *
 * Delete a folder
 *   $console->deleteDirectory("{$path}/docs");
 *
 *
 */

/**
 * Fired when the deploy command is started
 *
 * @param object $console Instance of WPBones Console
 * @param string $path Destination path
 */
add_action('wpbones_console_deploy_start', function ($console, $path) {
  // Do something
}, 10, 2);

/**
 * Fired before building assets
 *
 * @param object $console Instance of WPBones Console
 * @param string $path Destination path
 */
add_action('wpbones_console_deploy_before_build_assets', function ($console, $path) {
  // Do something
}, 10, 2);

/**
 * Fired after building assets
 *
 * @param object $console Instance of WPBones Console
 * @param string $path Destination path
 */
add_action('wpbones_console_deploy_after_build_assets', function ($console, $path) {
  // Do something
}, 10, 2);

/**
 * Filter the list of the folder to skip for the deploy version
 *
 * @param array $folders List of folders to skip
 * @return array List of folders to skip
 */
add_filter('wpbones_console_deploy_skip_folders', function ($folders) {
  return $folders;
});

/**
 * Fired when the deploy command is completed
 *
 * @param object $console Instance of WPBones Console
 * @param string $path Destination path
 */
add_action('wpbones_console_deploy_completed', function ($console, $path) {
  // Do something
}, 10, 2);
