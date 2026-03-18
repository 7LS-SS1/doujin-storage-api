<?php
/**
 * Single comic detail template.
 *
 * Variables provided via $args (load_template WP 5.5+):
 *   @var array  $comic       Comic data from API (includes categories, tags, latestChapters, relatedComicsInSeries).
 *   @var array  $chapters    Full chapter list from /comics/{slug}/chapters.
 *   @var string $comic_slug  Comic slug.
 *
 * @package ComicReaderCompanion
 */

// phpcs:ignore WordPress.PHP.DontExtract
extract( $args, EXTR_SKIP );

/** @var array  $comic */
/** @var array  $chapters */
/** @var string $comic_slug */

$title       = $comic['title'] ?? '';
$description = $comic['description'] ?? '';
$author      = $comic['author_name'] ?? '';
$cover       = $comic['cover_image_url'] ?? '';
$status      = $comic['status'] ?? '';
$categories  = $comic['categories'] ?? [];
$tags        = $comic['tags'] ?? [];
$series      = $comic['series'] ?? null;
$related     = $comic['relatedComicsInSeries'] ?? [];
$archive_url = crc_archive_url();

// One-shot fallback redirect:
// If the rewrite layer didn't redirect for any reason, redirect here before output.
$is_one_shot = ! empty( $comic['is_one_shot'] );
if ( $is_one_shot ) {
    $find_first_chapter_num = static function ( array $rows ): ?int {
        $first = null;
        foreach ( $rows as $row ) {
            $num = (int) ( $row['number'] ?? 0 );
            if ( $num <= 0 ) {
                continue;
            }
            if ( $first === null || $num < $first ) {
                $first = $num;
            }
        }
        return $first;
    };

    $redirect_chapter_num = $find_first_chapter_num( $chapters );
    if ( $redirect_chapter_num === null ) {
        $redirect_chapter_num = $find_first_chapter_num( $comic['latestChapters'] ?? [] );
    }

    if ( $redirect_chapter_num !== null ) {
        $target_url = crc_chapter_url( $comic_slug, $redirect_chapter_num );
        wp_safe_redirect( $target_url, 302, 'Comic Reader Companion' );
        exit;
    }
}

// Sort chapters by number ascending for display.
usort( $chapters, static fn( $a, $b ) => (int) ( $b['number'] ?? 0 ) - (int) ( $a['number'] ?? 0 ) );

$first_chapter_num = ! empty( $chapters ) ? (int) end( $chapters )['number'] : null;
$latest_chapter    = ! empty( $chapters ) ? reset( $chapters ) : null;

get_header();
?>

<main id="crc-single-comic" class="crc-page crc-single-comic-page">
<div class="crc-container">

    <!-- Breadcrumb -->
    <nav class="crc-breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'comic-reader' ); ?>">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'comic-reader' ); ?></a>
        <span aria-hidden="true"> › </span>
        <a href="<?php echo esc_url( $archive_url ); ?>"><?php esc_html_e( 'Comics', 'comic-reader' ); ?></a>
        <span aria-hidden="true"> › </span>
        <span aria-current="page"><?php echo esc_html( $title ); ?></span>
    </nav>

    <!-- Comic Header -->
    <div class="crc-comic-hero">
        <div class="crc-comic-hero__cover">
            <?php if ( $cover ) : ?>
                <img
                    src="<?php echo esc_url( $cover ); ?>"
                    alt="<?php echo esc_attr( $title ); ?>"
                    class="crc-comic-hero__img"
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="400"
                />
            <?php else : ?>
                <div class="crc-comic-hero__no-cover" aria-hidden="true">
                    <span>📖</span>
                </div>
            <?php endif; ?>
        </div>

        <div class="crc-comic-hero__meta">
            <h1 class="crc-comic-hero__title"><?php echo esc_html( $title ); ?></h1>

            <?php if ( $author ) : ?>
                <p class="crc-comic-hero__author">
                    <span class="crc-label"><?php esc_html_e( 'ผู้แต่ง:', 'comic-reader' ); ?></span>
                    <?php echo esc_html( $author ); ?>
                </p>
            <?php endif; ?>

            <?php if ( $status ) : ?>
                <p class="crc-comic-hero__status">
                    <span class="crc-label"><?php esc_html_e( 'สถานะ:', 'comic-reader' ); ?></span>
                    <span class="crc-badge crc-badge--<?php echo esc_attr( $status ); ?>">
                        <?php echo esc_html( ucfirst( $status ) ); ?>
                    </span>
                </p>
            <?php endif; ?>

            <?php if ( $series ) : ?>
                <p class="crc-comic-hero__series">
                    <span class="crc-label"><?php esc_html_e( 'ซีรีย์:', 'comic-reader' ); ?></span>
                    <?php echo esc_html( $series['title'] ?? '' ); ?>
                </p>
            <?php endif; ?>

            <?php if ( ! empty( $categories ) ) : ?>
                <div class="crc-comic-hero__terms">
                    <span class="crc-label"><?php esc_html_e( 'หมวดหมู่:', 'comic-reader' ); ?></span>
                    <?php foreach ( $categories as $cat ) : ?>
                        <a
                            href="<?php echo esc_url( add_query_arg( 'cat', rawurlencode( $cat['slug'] ?? '' ), $archive_url ) ); ?>"
                            class="crc-tag crc-tag--category"
                        ><?php echo esc_html( $cat['name'] ?? '' ); ?></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if ( ! empty( $tags ) ) : ?>
                <div class="crc-comic-hero__terms">
                    <span class="crc-label"><?php esc_html_e( 'แท็ก:', 'comic-reader' ); ?></span>
                    <?php foreach ( $tags as $tag ) : ?>
                        <a
                            href="<?php echo esc_url( add_query_arg( 'tag', rawurlencode( $tag['slug'] ?? '' ), $archive_url ) ); ?>"
                            class="crc-tag crc-tag--tag"
                        ><?php echo esc_html( $tag['name'] ?? '' ); ?></a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <!-- CTA Buttons -->
            <div class="crc-comic-hero__actions">
                <?php if ( $first_chapter_num !== null ) : ?>
                    <a
                        href="<?php echo esc_url( crc_chapter_url( $comic_slug, $first_chapter_num ) ); ?>"
                        class="crc-btn crc-btn--primary"
                    ><?php esc_html_e( '▶ อ่าตอนแรก', 'comic-reader' ); ?></a>
                <?php endif; ?>

                <?php if ( $latest_chapter && $first_chapter_num !== (int) ( $latest_chapter['number'] ?? $first_chapter_num ) ) : ?>
                    <a
                        href="<?php echo esc_url( crc_chapter_url( $comic_slug, (int) $latest_chapter['number'] ) ); ?>"
                        class="crc-btn crc-btn--ghost"
                    ><?php esc_html_e( '⏭ อ่าตอนล่าสุด', 'comic-reader' ); ?></a>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Description -->
    <?php if ( $description ) : ?>
        <section class="crc-comic-description">
            <h2 class="crc-section-title"><?php esc_html_e( 'รายละเอียด', 'comic-reader' ); ?></h2>
            <div class="crc-comic-description__body">
                <?php echo wp_kses_post( wpautop( $description ) ); ?>
            </div>
        </section>
    <?php endif; ?>

    <!-- Chapter List -->
    <section class="crc-chapter-list" aria-labelledby="crc-chapters-heading">
        <h2 class="crc-section-title" id="crc-chapters-heading">
            <?php
            printf(
                /* translators: %d: chapter count */
                esc_html( _n( '%d Chapter', '%d Chapters', count( $chapters ), 'comic-reader' ) ),
                count( $chapters )
            );
            ?>
        </h2>

        <?php if ( empty( $chapters ) ) : ?>
            <p class="crc-empty-state"><?php esc_html_e( 'No chapters available yet.', 'comic-reader' ); ?></p>
        <?php else : ?>
            <ul class="crc-chapters-ul" role="list">
                <?php foreach ( $chapters as $ch ) :
                    $ch_num    = (int) ( $ch['number'] ?? 0 );
                    $ch_title  = $ch['title'] ?? '';
                    $ch_url    = crc_chapter_url( $comic_slug, $ch_num );
                    $ch_date   = $ch['published_at'] ?? $ch['created_at'] ?? '';
                ?>
                    <li class="crc-chapter-item" role="listitem">
                        <a href="<?php echo esc_url( $ch_url ); ?>" class="crc-chapter-item__link">
                            <span class="crc-chapter-item__num">
                                <?php
                                printf(
                                    /* translators: %s: chapter number */
                                    esc_html__( 'ตอนที่ %s', 'comic-reader' ),
                                    esc_html( $ch_num )
                                );
                                ?>
                            </span>
                            <?php if ( $ch_title ) : ?>
                                <span class="crc-chapter-item__title"><?php echo esc_html( $ch_title ); ?></span>
                            <?php endif; ?>
                        </a>
                        <?php if ( $ch_date ) : ?>
                            <time
                                class="crc-chapter-item__date"
                                datetime="<?php echo esc_attr( $ch_date ); ?>"
                            >
                                <?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $ch_date ) ) ); ?>
                            </time>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>

    <!-- Related in Series -->
    <?php if ( ! empty( $related ) ) : ?>
        <section class="crc-related" aria-labelledby="crc-related-heading">
            <h2 class="crc-section-title" id="crc-related-heading">
                <?php esc_html_e( 'More in this Series', 'comic-reader' ); ?>
            </h2>
            <div class="crc-related-grid" role="list">
                <?php foreach ( $related as $rel ) : ?>
                    <article class="crc-comic-card crc-comic-card--small" role="listitem">
                        <a href="<?php echo esc_url( crc_comic_url( $rel['slug'] ?? '' ) ); ?>" class="crc-comic-card__link">
                            <?php if ( ! empty( $rel['cover_image_url'] ) ) : ?>
                                <img
                                    src="<?php echo esc_url( $rel['cover_image_url'] ); ?>"
                                    alt="<?php echo esc_attr( $rel['title'] ?? '' ); ?>"
                                    class="crc-comic-card__img"
                                    loading="lazy"
                                    decoding="async"
                                    width="120"
                                    height="160"
                                />
                            <?php endif; ?>
                            <div class="crc-comic-card__body">
                                <h3 class="crc-comic-card__title"><?php echo esc_html( $rel['title'] ?? '' ); ?></h3>
                            </div>
                        </a>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>

</div><!-- .crc-container -->
</main>

<?php get_footer(); ?>
