<?php
/**
 * 404 template.
 *
 * @package ComicReader
 */
get_header();
?>
<main class="crc-page" id="crc-404">
    <div class="crc-container">
        <div class="crc-empty-state" style="padding: 5rem 1rem;">
            <p style="font-size: 4rem; margin-bottom: 1rem;" aria-hidden="true">404</p>
            <h1 style="margin-bottom: 1rem;"><?php esc_html_e( 'Page Not Found', 'comic-reader' ); ?></h1>
            <p><?php esc_html_e( 'The comic, chapter, or page you are looking for does not exist.', 'comic-reader' ); ?></p>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="crc-btn crc-btn--ghost">
                    <?php esc_html_e( '← Home', 'comic-reader' ); ?>
                </a>
                <?php if ( function_exists( 'crc_archive_url' ) ) : ?>
                    <a href="<?php echo esc_url( crc_archive_url() ); ?>" class="crc-btn crc-btn--primary">
                        <?php esc_html_e( 'Browse Comics', 'comic-reader' ); ?>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>
<?php get_footer(); ?>
