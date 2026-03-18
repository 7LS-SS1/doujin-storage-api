<?php
/**
 * Default index template — used for normal WordPress pages/posts.
 *
 * Note: front-page.php takes priority in the template hierarchy when a static
 * front page is configured. This fallback handles the case where front-page.php
 * is missing or WP falls back to index.php (e.g. blog posts homepage).
 *
 * @package ComicReader
 */

// Safety fallback: if WordPress somehow lands here on the front page
// and front-page.php exists, delegate to it.
if ( is_front_page() ) {
    $fp = get_template_directory() . '/front-page.php';
    if ( file_exists( $fp ) ) {
        require $fp;
        return;
    }
}

get_header();
?>
<main id="crc-wp-content" class="crc-page">
    <div class="crc-container">
        <?php if ( have_posts() ) : ?>
            <?php while ( have_posts() ) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <h1><?php the_title(); ?></h1>
                    <div><?php the_content(); ?></div>
                </article>
            <?php endwhile; ?>
        <?php else : ?>
            <p><?php esc_html_e( 'Nothing found.', 'comic-reader' ); ?></p>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>
