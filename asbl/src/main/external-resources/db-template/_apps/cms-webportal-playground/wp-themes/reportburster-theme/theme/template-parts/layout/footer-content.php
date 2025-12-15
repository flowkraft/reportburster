<?php
/**
 * Template part for displaying the footer content
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ReportBurster_Theme
 */

?>

<footer id="colophon" class="bg-white border-t border-gray-200 mt-16">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

		<?php /* Widget sidebar commented out
		if ( is_active_sidebar( 'sidebar-1' ) ) : ?>
			<aside role="complementary" aria-label="<?php esc_attr_e( 'Footer', 'reportburster-theme' ); ?>" class="mb-8">
				<?php dynamic_sidebar( 'sidebar-1' ); ?>
			</aside>
		<?php endif;
		*/ ?>

		<?php if ( has_nav_menu( 'menu-2' ) ) : ?>
			<nav aria-label="<?php esc_attr_e( 'Footer Menu', 'reportburster-theme' ); ?>" class="mb-8">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'menu-2',
						'menu_class'     => 'flex flex-wrap justify-center gap-6 text-sm',
						'depth'          => 1,
					)
				);
				?>
			</nav>
		<?php endif; ?>

		<div class="text-center text-sm text-gray-500">
			<span class="text-gray-600">&copy; <?php echo date('Y'); ?></span>
			<span class="mx-2">&bull;</span>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" class="text-gray-700 hover:text-blue-600">
				<strong>Report</strong>Burster Portal
			</a>
		</div>

	</div>
</footer><!-- #colophon -->
