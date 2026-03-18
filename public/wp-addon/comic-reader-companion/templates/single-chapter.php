<?php
/**
 * Chapter reader template.
 *
 * Variables provided via $args (load_template WP 5.5+):
 *   @var array  $chapter         Chapter data with images, previousChapterId, nextChapterId.
 *   @var string $comic_slug      Comic slug (from URL).
 *   @var int    $chapter_number  Current chapter number.
 *
 * Enriched by CRC_API_Client::get_chapter_by_number():
 *   $chapter['prevChapterNumber'] — int|null
 *   $chapter['nextChapterNumber'] — int|null
 *
 * @package ComicReaderCompanion
 */

// phpcs:ignore WordPress.PHP.DontExtract
extract( $args, EXTR_SKIP );

/** @var array  $chapter */
/** @var string $comic_slug */
/** @var int    $chapter_number */

$comic_title     = $chapter['comic']['title'] ?? $chapter['comic_title'] ?? '';
$comic_slug_safe = sanitize_text_field( $comic_slug );
$ch_title        = $chapter['title'] ?? '';
$ch_number       = (int) ( $chapter['number'] ?? $chapter_number );
$images          = $chapter['images'] ?? [];
$prev_num        = $chapter['prevChapterNumber'] ?? null;
$next_num        = $chapter['nextChapterNumber'] ?? null;
$comic_url       = crc_comic_url( $comic_slug_safe );
$archive_url     = crc_archive_url();

$prev_url = ( $prev_num !== null ) ? crc_chapter_url( $comic_slug_safe, (int) $prev_num ) : null;
$next_url = ( $next_num !== null ) ? crc_chapter_url( $comic_slug_safe, (int) $next_num ) : null;

$page_title = $comic_title
    ? sprintf(
        /* translators: 1: comic title, 2: chapter number */
        __( '%1$s — Chapter %2$d', 'comic-reader' ),
        $comic_title,
        $ch_number
    )
    : sprintf(
        /* translators: %d: chapter number */
        __( 'Chapter %d', 'comic-reader' ),
        $ch_number
    );

// Sort images by sort_order ascending.
usort( $images, static fn( $a, $b ) => (int) ( $a['sort_order'] ?? 0 ) - (int) ( $b['sort_order'] ?? 0 ) );

get_header( 'chapter' ); // Allows theme to provide a minimal header.php for the reader.
?>

<div
    id="crc-reader"
    class="crc-reader crc-mode-scroll"
    data-chapter="<?php echo esc_attr( $ch_number ); ?>"
    data-total-pages="<?php echo esc_attr( count( $images ) ); ?>"
>

    <!-- ── Top navigation bar ─────────────────────────────────────────────── -->
    <header class="crc-reader-bar crc-reader-bar--top" role="navigation" aria-label="<?php esc_attr_e( 'Chapter navigation', 'comic-reader' ); ?>">
        <div class="crc-reader-bar__inner">

            <div class="crc-reader-bar__prev">
                <?php if ( $prev_url ) : ?>
                    <a
                        href="<?php echo esc_url( $prev_url ); ?>"
                        class="crc-nav-btn crc-nav-btn--prev"
                        title="<?php echo esc_attr( sprintf( __( 'Chapter %d', 'comic-reader' ), (int) $prev_num ) ); ?>"
                        id="crc-prev-top"
                        rel="prev"
                    >
                        <span class="crc-nav-btn__arrow" aria-hidden="true">‹</span>
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Previous', 'comic-reader' ); ?></span>
                            <span class="crc-nav-btn__ch">
                                <?php
                                printf(
                                    esc_html__( 'Chapter %d', 'comic-reader' ),
                                    (int) $prev_num
                                );
                                ?>
                            </span>
                        </span>
                    </a>
                <?php else : ?>
                    <span class="crc-nav-btn crc-nav-btn--disabled" aria-disabled="true">
                        <span class="crc-nav-btn__arrow" aria-hidden="true">‹</span>
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Previous', 'comic-reader' ); ?></span>
                        </span>
                    </span>
                <?php endif; ?>
            </div>

            <div class="crc-reader-bar__title">
                <a href="<?php echo esc_url( $comic_url ); ?>" class="crc-reader-bar__comic-title" title="<?php esc_attr_e( 'Back to comic', 'comic-reader' ); ?>">
                    <?php echo esc_html( $comic_title ); ?>
                </a>
                <span class="crc-reader-bar__chapter-info">
                    <?php echo esc_html( sprintf( __( 'Chapter %d', 'comic-reader' ), $ch_number ) ); ?>
                    <?php if ( $ch_title ) : ?>
                        <span class="crc-reader-bar__chapter-title"> — <?php echo esc_html( $ch_title ); ?></span>
                    <?php endif; ?>
                </span>
                <?php if ( ! empty( $images ) ) : ?>
                    <div class="crc-reader-mode-switch" role="group" aria-label="<?php esc_attr_e( 'โหมดการอ่าน', 'comic-reader' ); ?>">
                        <button type="button" class="crc-mode-btn is-active" data-mode="scroll">
                            <?php esc_html_e( 'อ่านแบบเลื่อนลง', 'comic-reader' ); ?>
                        </button>
                        <button type="button" class="crc-mode-btn" data-mode="paged">
                            <?php esc_html_e( 'อ่านทีละหน้า', 'comic-reader' ); ?>
                        </button>
                    </div>
                <?php endif; ?>
            </div>

            <div class="crc-reader-bar__next">
                <?php if ( $next_url ) : ?>
                    <a
                        href="<?php echo esc_url( $next_url ); ?>"
                        class="crc-nav-btn crc-nav-btn--next"
                        title="<?php echo esc_attr( sprintf( __( 'Chapter %d', 'comic-reader' ), (int) $next_num ) ); ?>"
                        id="crc-next-top"
                        rel="next"
                    >
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Next', 'comic-reader' ); ?></span>
                            <span class="crc-nav-btn__ch">
                                <?php
                                printf(
                                    esc_html__( 'Chapter %d', 'comic-reader' ),
                                    (int) $next_num
                                );
                                ?>
                            </span>
                        </span>
                        <span class="crc-nav-btn__arrow" aria-hidden="true">›</span>
                    </a>
                <?php else : ?>
                    <span class="crc-nav-btn crc-nav-btn--disabled" aria-disabled="true">
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Next', 'comic-reader' ); ?></span>
                        </span>
                        <span class="crc-nav-btn__arrow" aria-hidden="true">›</span>
                    </span>
                <?php endif; ?>
            </div>

        </div><!-- .crc-reader-bar__inner -->
    </header><!-- .crc-reader-bar--top -->

    <!-- ── Breadcrumb ─────────────────────────────────────────────────────── -->
    <nav class="crc-breadcrumb crc-reader__breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'comic-reader' ); ?>">
        <div class="crc-container">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'comic-reader' ); ?></a>
            <span aria-hidden="true"> › </span>
            <a href="<?php echo esc_url( $archive_url ); ?>"><?php esc_html_e( 'Comics', 'comic-reader' ); ?></a>
            <span aria-hidden="true"> › </span>
            <a href="<?php echo esc_url( $comic_url ); ?>"><?php echo esc_html( $comic_title ); ?></a>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">
                <?php echo esc_html( sprintf( __( 'Chapter %d', 'comic-reader' ), $ch_number ) ); ?>
            </span>
        </div>
    </nav>

    <?php if ( ! empty( $images ) ) : ?>
        <div id="crc-page-nav" class="crc-page-nav" aria-label="<?php esc_attr_e( 'ตัวควบคุมหน้าอ่าน', 'comic-reader' ); ?>" hidden>
            <button type="button" class="crc-page-nav__btn" id="crc-page-prev">
                <span class="crc-page-nav__btn-arrow" aria-hidden="true">‹</span>
                <span class="crc-page-nav__btn-text"><?php esc_html_e( 'หน้าก่อน', 'comic-reader' ); ?></span>
            </button>
            <div class="crc-page-nav__status" aria-live="polite">
                <span class="crc-page-nav__label"><?php esc_html_e( 'หน้า', 'comic-reader' ); ?></span>
                <strong id="crc-page-current">1</strong>
                <span>/</span>
                <span id="crc-page-total"><?php echo esc_html( (string) count( $images ) ); ?></span>
            </div>
            <button type="button" class="crc-page-nav__btn" id="crc-page-next">
                <span class="crc-page-nav__btn-text"><?php esc_html_e( 'หน้าถัดไป', 'comic-reader' ); ?></span>
                <span class="crc-page-nav__btn-arrow" aria-hidden="true">›</span>
            </button>
        </div>
    <?php endif; ?>

    <!-- ── Chapter images ────────────────────────────────────────────────── -->
    <main
        id="crc-images"
        class="crc-reader__images"
        aria-label="<?php esc_attr_e( 'Chapter images', 'comic-reader' ); ?>"
    >
        <?php if ( empty( $images ) ) : ?>
            <div class="crc-empty-state">
                <p><?php esc_html_e( 'No images found for this chapter.', 'comic-reader' ); ?></p>
                <a href="<?php echo esc_url( $comic_url ); ?>" class="crc-btn crc-btn--ghost">
                    <?php esc_html_e( '← Back to comic', 'comic-reader' ); ?>
                </a>
            </div>
        <?php else : ?>
            <?php
            $total_images = count( $images );
            foreach ( $images as $idx => $img ) :
                $img_url    = $img['image_url'] ?? '';
                $sort_order = (int) ( $img['sort_order'] ?? $idx );
                $page_num   = $sort_order + 1;
                $width      = $img['width'] ? (int) $img['width'] : null;
                $height     = $img['height'] ? (int) $img['height'] : null;
            ?>
                <figure
                    class="crc-reader__page"
                    data-page="<?php echo esc_attr( $page_num ); ?>"
                    aria-label="<?php echo esc_attr( sprintf( __( 'Page %1$d of %2$d', 'comic-reader' ), $page_num, $total_images ) ); ?>"
                >
                    <img
                        src="<?php echo esc_url( $img_url ); ?>"
                        alt="<?php echo esc_attr( sprintf( __( 'Page %d', 'comic-reader' ), $page_num ) ); ?>"
                        class="crc-reader__img"
                        loading="lazy"
                        decoding="async"
                        <?php if ( $width ) : ?>width="<?php echo esc_attr( $width ); ?>"<?php endif; ?>
                        <?php if ( $height ) : ?>height="<?php echo esc_attr( $height ); ?>"<?php endif; ?>
                    />
                </figure>
            <?php endforeach; ?>
        <?php endif; ?>
    </main>

    <!-- ── Bottom navigation ──────────────────────────────────────────────── -->
    <footer class="crc-reader-bar crc-reader-bar--bottom" role="navigation" aria-label="<?php esc_attr_e( 'Chapter navigation bottom', 'comic-reader' ); ?>">
        <button
            type="button"
            class="crc-reader-bar__mobile-toggle"
            id="crc-reader-footer-toggle"
            aria-expanded="true"
            aria-controls="crc-reader-footer-inner"
            data-label-show="<?php esc_attr_e( 'แสดงเมนูนำทาง', 'comic-reader' ); ?>"
            data-label-hide="<?php esc_attr_e( 'ซ่อนเมนูนำทาง', 'comic-reader' ); ?>"
        >
            <?php esc_html_e( 'ซ่อนเมนูนำทาง', 'comic-reader' ); ?>
        </button>
        <div class="crc-reader-bar__inner" id="crc-reader-footer-inner">

            <div class="crc-reader-bar__prev">
                <?php if ( $prev_url ) : ?>
                    <a
                        href="<?php echo esc_url( $prev_url ); ?>"
                        class="crc-nav-btn crc-nav-btn--prev"
                        id="crc-prev-bottom"
                        rel="prev"
                    >
                        <span class="crc-nav-btn__arrow" aria-hidden="true">‹</span>
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Previous Chapter', 'comic-reader' ); ?></span>
                            <span class="crc-nav-btn__ch">
                                <?php printf( esc_html__( 'Chapter %d', 'comic-reader' ), (int) $prev_num ); ?>
                            </span>
                        </span>
                    </a>
                <?php else : ?>
                    <a href="<?php echo esc_url( $comic_url ); ?>" class="crc-nav-btn crc-nav-btn--back">
                        <span class="crc-nav-btn__arrow" aria-hidden="true">↑</span>
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Back to Comic', 'comic-reader' ); ?></span>
                        </span>
                    </a>
                <?php endif; ?>
            </div>

            <div class="crc-reader-bar__center">
                <a
                    href="<?php echo esc_url( $comic_url ); ?>"
                    class="crc-btn crc-btn--ghost crc-btn--sm"
                    aria-label="<?php esc_attr_e( 'Back to chapters list', 'comic-reader' ); ?>"
                >
                    <span class="crc-reader-bar__center-icon" aria-hidden="true">📚</span>
                    <span class="crc-reader-bar__center-text"><?php esc_html_e( '↑ Back to chapters list', 'comic-reader' ); ?></span>
                </a>
            </div>

            <div class="crc-reader-bar__next">
                <?php if ( $next_url ) : ?>
                    <a
                        href="<?php echo esc_url( $next_url ); ?>"
                        class="crc-nav-btn crc-nav-btn--next"
                        id="crc-next-bottom"
                        rel="next"
                    >
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Next Chapter', 'comic-reader' ); ?></span>
                            <span class="crc-nav-btn__ch">
                                <?php printf( esc_html__( 'Chapter %d', 'comic-reader' ), (int) $next_num ); ?>
                            </span>
                        </span>
                        <span class="crc-nav-btn__arrow" aria-hidden="true">›</span>
                    </a>
                <?php else : ?>
                    <span class="crc-nav-btn crc-nav-btn--disabled" aria-disabled="true">
                        <span class="crc-nav-btn__label">
                            <span class="crc-nav-btn__hint"><?php esc_html_e( 'Latest Chapter', 'comic-reader' ); ?></span>
                        </span>
                        <span class="crc-nav-btn__arrow" aria-hidden="true">›</span>
                    </span>
                <?php endif; ?>
            </div>

        </div><!-- .crc-reader-bar__inner -->
    </footer><!-- .crc-reader-bar--bottom -->

    <!-- ── Keyboard shortcuts hint (screen-reader + tooltip) ─────────────── -->
    <div class="crc-reader__keyboard-hint" aria-hidden="true" id="crc-keyboard-hint">
        <kbd>←</kbd> <?php esc_html_e( 'Previous', 'comic-reader' ); ?>
        &nbsp;&nbsp;
        <kbd>→</kbd> <?php esc_html_e( 'Next', 'comic-reader' ); ?>
    </div>

</div><!-- #crc-reader -->

<!-- Pass nav URLs to JS for keyboard/gesture navigation. -->
<script>
window.crcReader = {
    prevUrl: <?php echo $prev_url ? wp_json_encode( $prev_url ) : 'null'; ?>,
    nextUrl: <?php echo $next_url ? wp_json_encode( $next_url ) : 'null'; ?>,
    comicUrl: <?php echo wp_json_encode( $comic_url ); ?>,
    totalPages: <?php echo (int) count( $images ); ?>,
    i18n: <?php echo wp_json_encode(
        [
            'prevPage'    => __( 'หน้าก่อน', 'comic-reader' ),
            'nextPage'    => __( 'หน้าถัดไป', 'comic-reader' ),
            'prevChapter' => __( 'ตอนก่อนหน้า', 'comic-reader' ),
            'nextChapter' => __( 'ตอนถัดไป', 'comic-reader' ),
        ]
    ); ?>
};
</script>

<?php get_footer( 'chapter' ); ?>
