<!--
 |
 | In $plugin you'll find an instance of Plugin class.
 | If you'd like can pass variable to this view, for example:
 |
 | return PluginClassName()->view( 'dashboard.index', [ 'var' => 'value' ] );
 |
-->

<?php ob_start() ?>

<div class="reportburster-integration wrap reportburster-integration-sample">

  <div class="reportburster-integration-toc-content">
    <?php wpkirk_section(__('Overview', 'reportburster-integration')); ?>

    <p><?php _e('Starting from version 1.4.0, you can use blade templates in your plugin.', 'reportburster-integration'); ?></p>
    <p><?php _e('In this example, we are going to use Blade templates in our plugin.', 'reportburster-integration'); ?></p>

    <img alt="BladeOne ogo" src="https://raw.githubusercontent.com/EFTEC/BladeOne/gh-pages/images/bladelogo.png" />

    <p><?php _e('We\'re using the', 'reportburster-integration'); ?> <a href="https://github.com/EFTEC/BladeOne">BladeOne</a> <?php _e('template engine. BladeOne is a standalone version of Blade Template Engine that uses a single PHP file and can be ported and used in different projects. It allows you to use blade template outside Laravel.', 'reportburster-integration'); ?></p>

    <p><?php _e('BladeOne is a standalone version of Blade Template Engine that uses a single PHP file and can be ported and used in different projects. It allows you to use blade template outside Laravel.', 'reportburster-integration'); ?></p>

    <p>In this example, we have created a classic Controller. The same one used in the other examples.</p>

    <?php wpkirk_section(__('Controller', 'reportburster-integration')); ?>
    <?php wpkirk_code("@/plugin/Http/Controllers/Dashboard/DashboardController.php") ?>

    <p><?php wpkirk_md(__('You can use the usual views structure, `/resources/views/index.blade.php`.', 'reportburster-integration')); ?></p>

    <?php wpkirk_code("@/resources/views/dashboard/index.blade.php") ?>

    <?php wpkirk_section(__('Blade Output', 'reportburster-integration')); ?>

    @foreach ($books as $book)
    <p>Title: {{ $book['title'] }}</p>
    <p>Author: {{ $book['author'] }}</p>
    <p>Year: {{ $book['year'] }}</p>
    @endforeach

    <p><?php _e('For more information, please visit the', 'reportburster-integration'); ?> <a href="https://github.com/EFTEC/BladeOne/wiki">BladeOne</a> <?php _e('Wiki pages.', 'reportburster-integration'); ?></p>

  </div>

  <?php wpkirk_toc('Blade') ?>

</div>