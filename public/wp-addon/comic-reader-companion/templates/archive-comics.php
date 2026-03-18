<?php
/**
 * Comics archive template.
 *
 * Variables provided via $args (load_template WP 5.5+):
 *   @var array  $comics     List of comic objects from API.
 *   @var int    $total      Total comics matching query.
 *   @var int    $page       Current page number.
 *   @var int    $page_size  Items per page.
 *   @var string $search     Current search query.
 *   @var string $category   Category slug filter.
 *   @var string $tag        Tag slug filter.
 *   @var string $status     Status filter.
 *
 * @package ComicReaderCompanion
 */

// $args is set by load_template() - extract for convenient local access.
// phpcs:ignore WordPress.PHP.DontExtract
extract( $args, EXTR_SKIP );

/** @var array  $comics */
/** @var int    $total */
/** @var int    $page */
/** @var int    $page_size */
/** @var string $search */
/** @var string $category */
/** @var string $tag */
/** @var string $status */

$total_pages = $total > 0 ? (int) ceil( $total / $page_size ) : 1;
$archive_url = crc_archive_url();

get_header();
?>

<main id="crc-archive" class="crc-page crc-archive-page">

    <div class="crc-container">

        <!-- Breadcrumb -->
        <nav class="crc-breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'comic-reader' ); ?>">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'comic-reader' ); ?></a>
            <span aria-hidden="true"> › </span>
            <span aria-current="page"><?php esc_html_e( 'Comics', 'comic-reader' ); ?></span>
        </nav>

        <h1 class="crc-archive-title">
            <?php
            if ( ! empty( $search ) ) {
                printf(
                    /* translators: %s: search term */
                    esc_html__( 'Search: %s', 'comic-reader' ),
                    '<span>' . esc_html( $search ) . '</span>'
                );
            } else {
                esc_html_e( 'Comics', 'comic-reader' );
            }
            ?>
        </h1>

        <!-- Search + Filter Form -->
        <form class="crc-filter-form" method="get" action="<?php echo esc_url( $archive_url ); ?>">
            <div class="crc-filter-row">
                <div class="crc-search-wrap">
                    <input
                        type="search"
                        name="s"
                        class="crc-search-input"
                        placeholder="<?php esc_attr_e( 'Search comics…', 'comic-reader' ); ?>"
                        value="<?php echo esc_attr( $search ); ?>"
                        aria-label="<?php esc_attr_e( 'Search comics', 'comic-reader' ); ?>"
                    />
                    <button type="submit" class="crc-btn crc-btn--primary">
                        <?php esc_html_e( 'Search', 'comic-reader' ); ?>
                    </button>
                </div>

                <div class="crc-filter-selects">
                    <select name="status" class="crc-select" aria-label="<?php esc_attr_e( 'Filter by status', 'comic-reader' ); ?>">
                        <option value=""><?php esc_html_e( 'All Status', 'comic-reader' ); ?></option>
                        <?php
                        $statuses = [ 'ongoing' => __( 'Ongoing', 'comic-reader' ), 'completed' => __( 'Completed', 'comic-reader' ), 'hiatus' => __( 'Hiatus', 'comic-reader' ) ];
                        foreach ( $statuses as $val => $label ) :
                        ?>
                            <option value="<?php echo esc_attr( $val ); ?>" <?php selected( $status, $val ); ?>>
                                <?php echo esc_html( $label ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <?php if ( ! empty( $search ) || ! empty( $status ) || ! empty( $category ) || ! empty( $tag ) ) : ?>
                    <a href="<?php echo esc_url( $archive_url ); ?>" class="crc-clear-filters">
                        <?php esc_html_e( '✕ Clear filters', 'comic-reader' ); ?>
                    </a>
                <?php endif; ?>
            </div>
        </form>

        <!-- Result count -->
        <?php if ( $total > 0 ) : ?>
            <p class="crc-result-count">
                <?php
                printf(
                    /* translators: 1: count */
                    esc_html( _n( '%d comic found', '%d comics found', $total, 'comic-reader' ) ),
                    (int) $total
                );
                ?>
            </p>
        <?php endif; ?>

        <!-- Comics Grid -->
        <?php if ( empty( $comics ) ) : ?>
            <div class="crc-empty-state">
                <p><?php esc_html_e( 'No comics found.', 'comic-reader' ); ?></p>
                <?php if ( ! empty( $search ) || ! empty( $status ) ) : ?>
                    <a href="<?php echo esc_url( $archive_url ); ?>" class="crc-btn crc-btn--ghost">
                        <?php esc_html_e( 'View all comics', 'comic-reader' ); ?>
                    </a>
                <?php endif; ?>
            </div>
        <?php else : ?>
            <div class="crc-comic-grid" role="list">
                <?php foreach ( $comics as $comic ) :
                    $comic_url = crc_comic_url( $comic['slug'] ?? '' );
                    $cover     = $comic['cover_image_url'] ?? '';
                    $title     = $comic['title'] ?? '';
                    $author    = $comic['author_name'] ?? '';
                    $st        = $comic['status'] ?? '';
                    $latest    = $comic['latestChapters'][0] ?? null;
                ?>
                    <article class="crc-comic-card" role="listitem">
                        <a href="<?php echo esc_url( $comic_url ); ?>" class="crc-comic-card__link" tabindex="0">
                            <div class="crc-comic-card__cover">
                                <?php if ( $cover ) : ?>
                                    <img
                                        src="<?php echo esc_url( $cover ); ?>"
                                        alt="<?php echo esc_attr( $title ); ?>"
                                        class="crc-comic-card__img"
                                        loading="lazy"
                                        decoding="async"
                                        width="180"
                                        height="240"
                                    />
                                <?php else : ?>
                                    <div class="crc-comic-card__no-cover" aria-hidden="true">
                                        <span>📖</span>
                                    </div>
                                <?php endif; ?>
                                <?php if ( $st ) : ?>
                                    <span class="crc-badge crc-badge--<?php echo esc_attr( $st ); ?>">
                                        <?php echo esc_html( ucfirst( $st ) ); ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                            <div class="crc-comic-card__body">
                                <h2 class="crc-comic-card__title"><?php echo esc_html( $title ); ?></h2>
                                <?php if ( $author ) : ?>
                                    <p class="crc-comic-card__author"><?php echo esc_html( $author ); ?></p>
                                <?php endif; ?>
                                <?php if ( $latest ) : ?>
                                    <p class="crc-comic-card__latest">
                                        <?php
                                        printf(
                                            /* translators: %s: chapter number */
                                            esc_html__( 'Ch. %s', 'comic-reader' ),
                                            esc_html( $latest['number'] ?? '' )
                                        );
                                        ?>
                                    </p>
                                <?php endif; ?>
                            </div>
                        </a>
                    </article>
                <?php endforeach; ?>
            </div>

            <!-- Pagination -->
            <?php if ( $total_pages > 1 ) : ?>
                <nav class="crc-pagination" aria-label="<?php esc_attr_e( 'Page navigation', 'comic-reader' ); ?>">
                    <?php if ( $page > 1 ) : ?>
                        <a
                            href="<?php echo esc_url( add_query_arg( 'paged', $page - 1, $archive_url ) ); ?>"
                            class="crc-pagination__btn"
                            rel="prev"
                        >&laquo; <?php esc_html_e( 'Previous', 'comic-reader' ); ?></a>
                    <?php endif; ?>

                    <span class="crc-pagination__info">
                        <?php
                        printf(
                            /* translators: 1: current page, 2: total pages */
                            esc_html__( 'Page %1$d of %2$d', 'comic-reader' ),
                            (int) $page,
                            (int) $total_pages
                        );
                        ?>
                    </span>

                    <?php if ( $page < $total_pages ) : ?>
                        <a
                            href="<?php echo esc_url( add_query_arg( 'paged', $page + 1, $archive_url ) ); ?>"
                            class="crc-pagination__btn"
                            rel="next"
                        ><?php esc_html_e( 'Next', 'comic-reader' ); ?> &raquo;</a>
                    <?php endif; ?>
                </nav>
            <?php endif; ?>
        <?php endif; ?>

    </div><!-- .crc-container -->

</main>

<?php get_footer(); ?>
