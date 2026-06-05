<?php
/**
 * Front page template.
 *
 * @package MikuDoujinTheme
 */

defined( 'ABSPATH' ) || exit;

$paged = max( 1, (int) get_query_var( 'paged' ), (int) get_query_var( 'page' ) );

$comics = new WP_Query(
    [
        'post_type'      => 'crc_comic',
        'post_status'    => 'publish',
        'posts_per_page' => 24,
        'paged'          => $paged,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]
);

$archive_url   = crc_theme_archive_endpoint();
$primary_label = crc_theme_primary_label();
$section_label = crc_theme_archive_label();

get_header();
?>

<main id="crc-home-main" class="crc-page crc-front-page">
    <div class="crc-container">
        <nav class="crc-breadcrumb crc-breadcrumb--panel" aria-label="<?php esc_attr_e( 'Breadcrumb', 'comic-reader' ); ?>">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>
            <span aria-hidden="true">›</span>
            <span aria-current="page"><?php echo esc_html( $primary_label ); ?></span>
        </nav>

        <div class="crc-shell-grid">
            <section class="crc-panel crc-panel--content">
                <header class="crc-panel__header">
                    <div>
                        <p class="crc-panel__eyebrow"><?php esc_html_e( 'หน้าแรก', 'comic-reader' ); ?></p>
                        <h1 class="crc-panel__title">
                            <span class="crc-panel__title-icon" aria-hidden="true">▦</span>
                            <?php echo esc_html( $primary_label ); ?>
                        </h1>
                    </div>

                    <p class="crc-panel__meta">
                        <?php
                        printf(
                            /* translators: %d: total post count */
                            esc_html__( '%d เรื่อง', 'comic-reader' ),
                            (int) $comics->found_posts
                        );
                        ?>
                    </p>
                </header>

                <?php if ( ! $comics->have_posts() ) : ?>
                    <div class="crc-empty-state">
                        <p><?php esc_html_e( 'ยังไม่มีคอมมิคที่ sync เข้ามาใน WordPress', 'comic-reader' ); ?></p>
                        <a href="<?php echo esc_url( $archive_url ); ?>" class="crc-btn crc-btn--ghost">
                            <?php esc_html_e( 'ไปหน้า archive', 'comic-reader' ); ?>
                        </a>
                    </div>
                <?php else : ?>
                    <div class="crc-home-section-heading">
                        <h2><?php echo esc_html( $section_label ); ?></h2>
                    </div>

                    <div class="crc-comic-grid crc-comic-grid--home" role="list">
                        <?php while ( $comics->have_posts() ) : ?>
                            <?php
                            $comics->the_post();
                            $post_id      = get_the_ID();
                            $title        = get_the_title();
                            $cover        = (string) get_post_meta( $post_id, '_crc_cover_url', true );
                            $status       = (string) get_post_meta( $post_id, '_crc_status', true );
                            $comic_type   = (string) get_post_meta( $post_id, '_crc_comic_type', true );
                            $relative     = crc_theme_relative_time( get_post_modified_time( 'c', true, $post_id ) );
                            $comic_url    = crc_theme_comic_url_for_post( $post_id );
                            $type_label   = crc_theme_comic_type_label( $comic_type );
                            ?>
                            <article class="crc-comic-card" role="listitem">
                                <a href="<?php echo esc_url( $comic_url ); ?>" class="crc-comic-card__link">
                                    <div class="crc-comic-card__cover">
                                        <?php if ( $cover ) : ?>
                                            <img
                                                src="<?php echo esc_url( $cover ); ?>"
                                                alt="<?php echo esc_attr( $title ); ?>"
                                                class="crc-comic-card__img"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        <?php else : ?>
                                            <div class="crc-comic-card__no-cover" aria-hidden="true">▣</div>
                                        <?php endif; ?>

                                        <div class="crc-comic-card__badges">
                                            <?php if ( $type_label ) : ?>
                                                <span class="crc-badge crc-badge--type"><?php echo esc_html( $type_label ); ?></span>
                                            <?php endif; ?>
                                            <?php if ( $status ) : ?>
                                                <span class="crc-badge crc-badge--<?php echo esc_attr( $status ); ?>">
                                                    <?php echo esc_html( ucfirst( $status ) ); ?>
                                                </span>
                                            <?php endif; ?>
                                        </div>
                                    </div>

                                    <div class="crc-comic-card__body crc-comic-card__body--overlay">
                                        <h2 class="crc-comic-card__title"><?php echo esc_html( $title ); ?></h2>
                                        <?php if ( $relative ) : ?>
                                            <p class="crc-comic-card__time"><?php echo esc_html( $relative ); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </a>
                            </article>
                        <?php endwhile; ?>
                    </div>

                    <?php if ( $comics->max_num_pages > 1 ) : ?>
                        <nav class="crc-home-pagination" aria-label="<?php esc_attr_e( 'Page navigation', 'comic-reader' ); ?>">
                            <?php if ( $paged > 1 ) : ?>
                                <a href="<?php echo esc_url( get_pagenum_link( $paged - 1 ) ); ?>" class="crc-home-pagination__btn">
                                    ‹ <?php esc_html_e( 'Newer', 'comic-reader' ); ?>
                                </a>
                            <?php else : ?>
                                <span class="crc-home-pagination__btn is-disabled"><?php esc_html_e( '‹ Newer', 'comic-reader' ); ?></span>
                            <?php endif; ?>

                            <label class="screen-reader-text" for="crc-home-page-select"><?php esc_html_e( 'Select page', 'comic-reader' ); ?></label>
                            <select id="crc-home-page-select" class="crc-home-pagination__select" data-crc-jump-select>
                                <?php for ( $page = 1; $page <= (int) $comics->max_num_pages; $page++ ) : ?>
                                    <option value="<?php echo esc_url( get_pagenum_link( $page ) ); ?>" <?php selected( $page, $paged ); ?>>
                                        <?php echo esc_html( (string) $page ); ?>
                                    </option>
                                <?php endfor; ?>
                            </select>

                            <?php if ( $paged < (int) $comics->max_num_pages ) : ?>
                                <a href="<?php echo esc_url( get_pagenum_link( $paged + 1 ) ); ?>" class="crc-home-pagination__btn">
                                    <?php esc_html_e( 'Older', 'comic-reader' ); ?> ›
                                </a>
                            <?php else : ?>
                                <span class="crc-home-pagination__btn is-disabled"><?php esc_html_e( 'Older ›', 'comic-reader' ); ?></span>
                            <?php endif; ?>
                        </nav>
                    <?php endif; ?>
                <?php endif; ?>
            </section>

            <?php crc_theme_render_sidebar(); ?>
        </div>
    </div>
</main>

<?php
wp_reset_postdata();
get_footer();
