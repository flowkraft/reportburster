<?php
/**
 * Template part for displaying the header content
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ReportBurster_Theme
 */

?>

<header id="masthead" class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center py-4">
			<div class="flex-shrink-0 flex items-center">
				<?php if ( is_front_page() ) : ?>
					<h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
						<svg class="w-5 h-5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m22 2-7 20-4-9-9-4Z"/>
							<path d="M22 2 11 13"/>
						</svg>
						<span><strong>Report</strong><em class="font-normal">Burster</em></span>
					</h1>
				<?php else : ?>
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" class="text-xl font-bold text-gray-900 hover:text-cyan-600 transition-colors flex items-center gap-2">
						<svg class="w-5 h-5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m22 2-7 20-4-9-9-4Z"/>
							<path d="M22 2 11 13"/>
						</svg>
						<span><strong>Report</strong><em class="font-normal">Burster</em></span>
					</a>
				<?php endif; ?>
			</div>

			<div class="flex items-center space-x-6">
				<nav id="site-navigation" aria-label="<?php esc_attr_e( 'Main Navigation', 'reportburster-theme' ); ?>">
					<?php
					wp_nav_menu(
						array(
							'theme_location' => 'menu-1',
							'menu_id'        => 'primary-menu',
							'menu_class'     => 'flex space-x-8',
							'items_wrap'     => '<ul id="%1$s" class="%2$s">%3$s</ul>',
							'fallback_cb'    => false,
							'link_before'    => '<span class="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">',
							'link_after'     => '</span>',
						)
					);
					?>
				</nav>
				
				<?php if ( is_user_logged_in() ) : ?>
					<div class="flex items-center space-x-4 text-sm">
						<span class="text-gray-600">
							<?php 
							$current_user = wp_get_current_user();
							echo esc_html( $current_user->display_name ); 
							?>
						</span>
						<a href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>" class="text-red-600 hover:text-red-700 hover:underline font-medium">
							Logout
						</a>
					</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
</header><!-- #masthead -->
