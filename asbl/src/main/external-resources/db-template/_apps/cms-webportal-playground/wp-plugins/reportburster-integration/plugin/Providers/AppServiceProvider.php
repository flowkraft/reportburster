<?php

namespace ReportBurster_Integration\Providers;

use ReportBurster_Integration\Http\Controllers\TemplateController;
use ReportBurster_Integration\helpers\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The provider boot method.
     *
     * @return void
     */
    public function boot()
    {
        // Instantiate your generic controller
        $templateController = new TemplateController();

        // Hook the methods into WordPress's template system
        add_filter('single_template', [$templateController, 'overrideSingleTemplate']);
        add_filter('page_template', [$templateController, 'overridePageTemplate']);

        // Hook the method to enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Enqueue plugin assets.
     */
    public function enqueueAssets()
    {
        // 1. Enqueue Tailwind CSS via CDN. This is the missing piece.
        // It provides all the utility classes (p-4, flex, text-red-500, etc.).
        wp_enqueue_script(
            'tailwindcss-cdn',
            'https://cdn.tailwindcss.com',
            [],
            null,
            false // Must be loaded in the <head> to work correctly.
        );

        // 2. Enqueue Bladewind's specific CSS.
        // This styles the structure of the components themselves.
        wp_enqueue_style(
            'bladewind-css',
            plugin_url('vendor/mkocansey/bladewind/public/bladewind.min.css'),
            [], // No dependency array needed here.
            '3.0.8'
        );

        // 3. Enqueue Bladewind's JavaScript for interactive components.
        wp_enqueue_script(
            'bladewind-js',
            plugin_url('vendor/mkocansey/bladewind/public/bladewind.min.js'),
            [],
            '3.0.8',
            true // Can be loaded in the footer.
        );
    }

    /**
     * The provider register method.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}