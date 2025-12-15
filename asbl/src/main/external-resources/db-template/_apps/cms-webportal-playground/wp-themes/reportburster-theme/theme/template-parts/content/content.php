<?php
/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package ReportBurster_Theme
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class( 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow' ); ?>>

	<div class="p-6 sm:p-8">
		<header class="entry-header mb-4">
			<?php
			if ( is_sticky() && is_home() && ! is_paged() ) {
				printf( '<span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mb-3">%s</span>', esc_html_x( 'Featured', 'post', 'reportburster-theme' ) );
			}
			if ( is_singular() ) :
				the_title( '<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">', '</h1>' );
			else :
				the_title( sprintf( '<h2 class="text-xl sm:text-2xl font-bold"><a href="%s" rel="bookmark" class="text-gray-900 hover:text-blue-600 transition-colors">', esc_url( get_permalink() ) ), '</a></h2>' );
			endif;
			?>
		</header><!-- .entry-header -->

		<?php reportburster_theme_post_thumbnail(); ?>

		<div <?php reportburster_theme_content_class( 'entry-content prose prose-gray max-w-none' ); ?>>
			<?php
			the_content();

			wp_link_pages(
				array(
					'before' => '<div class="mt-4 flex gap-2">' . __( 'Pages:', 'reportburster-theme' ),
					'after'  => '</div>',
				)
			);
			?>
		</div><!-- .entry-content -->

		<?php if ( ! is_front_page() && ! is_home() ) : ?>
		<footer class="entry-footer mt-6 pt-4 border-t border-gray-100">
			<div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
				<?php reportburster_theme_entry_footer(); ?>
			</div>
		</footer><!-- .entry-footer -->
		<?php endif; ?>
	</div>

</article><!-- #post-${ID} -->
