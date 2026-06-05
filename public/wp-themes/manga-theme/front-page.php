<?php
/**
 * Front page template.
 *
 * @package MangaTheme
 */

defined( 'ABSPATH' ) || exit;

$featured    = crc_theme_get_home_comics( 8, [ 'orderby' => 'modified', 'order' => 'DESC' ] );
$updates     = crc_theme_get_home_comics( 14, [ 'orderby' => 'modified', 'order' => 'DESC' ] );
$spotlight   = $updates[0] ?? null;
$quick_picks = crc_theme_get_home_comics( 5, [ 'orderby' => 'date', 'order' => 'DESC' ] );
$archive_url = crc_theme_archive_endpoint();

get_header();
?>

<main id="crc-home-main" class="crc-page crc-front-page">
    <div class="crc-container">
        <section class="crc-home-hero">
            <div class="crc-home-hero__primary">
                <p class="crc-home-hero__eyebrow"><?php echo esc_html( crc_theme_primary_label() ); ?></p>
                <h1 class="crc-home-hero__title"><?php bloginfo( 'name' ); ?></h1>
                <p class="crc-home-hero__copy">
                    <?php esc_html_e( 'เว็บอ่านมังงะที่เน้นอัปเดตตอนใหม่เร็ว อ่านง่าย และจัดหน้ารวมแบบคลังตอนล่าสุดตามสไตล์เว็บ manga reader คลาสสิก', 'comic-reader' ); ?>
                </p>
                <div class="crc-home-hero__actions">
                    <a href="<?php echo esc_url( $archive_url ); ?>" class="crc-btn crc-btn--accent">
                        <?php esc_html_e( 'ดูรายชื่อการ์ตูน', 'comic-reader' ); ?>
                    </a>
                    <a href="<?php echo esc_url( add_query_arg( 'status', 'ongoing', $archive_url ) ); ?>" class="crc-btn crc-btn--ghost">
                        <?php esc_html_e( 'ดูเรื่องที่กำลังอัปเดต', 'comic-reader' ); ?>
                    </a>
                </div>
            </div>

            <div class="crc-home-hero__stats">
                <div class="crc-mini-stat">
                    <span class="crc-mini-stat__label"><?php esc_html_e( 'Scope', 'comic-reader' ); ?></span>
                    <strong class="crc-mini-stat__value"><?php echo esc_html( strtoupper( crc_theme_scope() ) ); ?></strong>
                </div>
                <div class="crc-mini-stat">
                    <span class="crc-mini-stat__label"><?php esc_html_e( 'Featured', 'comic-reader' ); ?></span>
                    <strong class="crc-mini-stat__value"><?php echo esc_html( (string) count( $featured ) ); ?></strong>
                </div>
                <div class="crc-mini-stat">
                    <span class="crc-mini-stat__label"><?php esc_html_e( 'Updated feed', 'comic-reader' ); ?></span>
                    <strong class="crc-mini-stat__value"><?php echo esc_html( (string) count( $updates ) ); ?></strong>
                </div>
            </div>
        </section>

        <?php if ( ! empty( $featured ) ) : ?>
            <section class="crc-box crc-box--featured">
                <header class="crc-box__header">
                    <h2 class="crc-box__title"><?php esc_html_e( 'อ่านการ์ตูนยอดนิยม แนะนำให้อ่าน!!', 'comic-reader' ); ?></h2>
                </header>

                <div class="crc-featured-grid" role="list">
                    <?php foreach ( $featured as $comic ) : ?>
                        <article class="crc-featured-card" role="listitem">
                            <a href="<?php echo esc_url( $comic['url'] ); ?>" class="crc-featured-card__link">
                                <div class="crc-featured-card__cover">
                                    <?php if ( $comic['cover'] ) : ?>
                                        <img
                                            src="<?php echo esc_url( $comic['cover'] ); ?>"
                                            alt="<?php echo esc_attr( $comic['title'] ); ?>"
                                            class="crc-featured-card__img"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    <?php else : ?>
                                        <div class="crc-featured-card__placeholder" aria-hidden="true">M</div>
                                    <?php endif; ?>
                                </div>
                                <div class="crc-featured-card__body">
                                    <h3 class="crc-featured-card__title"><?php echo esc_html( $comic['title'] ); ?></h3>
                                    <?php if ( ! empty( $comic['lastChapters'][0] ) ) : ?>
                                        <p class="crc-featured-card__chapter">
                                            <?php
                                            printf(
                                                esc_html__( 'ตอนที่ %s', 'comic-reader' ),
                                                esc_html( $comic['lastChapters'][0]['num'] ?? '' )
                                            );
                                            ?>
                                        </p>
                                    <?php endif; ?>
                                    <p class="crc-featured-card__meta">
                                        <?php echo esc_html( crc_theme_relative_time( $comic['updated_at'] ) ); ?>
                                    </p>
                                </div>
                            </a>
                        </article>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <div class="crc-home-layout">
            <section class="crc-home-main">
                <section class="crc-box crc-box--updates">
                    <header class="crc-box__header">
                        <h2 class="crc-box__title"><?php esc_html_e( 'อ่านการ์ตูนที่อัพเดทแต่ละตอน', 'comic-reader' ); ?></h2>
                        <a href="<?php echo esc_url( $archive_url ); ?>" class="crc-box__more">
                            <?php esc_html_e( 'ดูทั้งหมด', 'comic-reader' ); ?>
                        </a>
                    </header>

                    <div class="crc-update-feed">
                        <?php foreach ( $updates as $comic ) : ?>
                            <article class="crc-update-card">
                                <a href="<?php echo esc_url( $comic['url'] ); ?>" class="crc-update-card__cover">
                                    <?php if ( $comic['cover'] ) : ?>
                                        <img
                                            src="<?php echo esc_url( $comic['cover'] ); ?>"
                                            alt="<?php echo esc_attr( $comic['title'] ); ?>"
                                            class="crc-update-card__img"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    <?php else : ?>
                                        <div class="crc-update-card__placeholder" aria-hidden="true">M</div>
                                    <?php endif; ?>
                                </a>

                                <div class="crc-update-card__body">
                                    <?php
                                    $genre_names = array_map(
                                        static fn( WP_Term $term ): string => $term->name,
                                        array_slice( $comic['genres'], 0, 6 )
                                    );
                                    ?>
                                    <div class="crc-update-card__topline">
                                        <h3 class="crc-update-card__title">
                                            <a href="<?php echo esc_url( $comic['url'] ); ?>"><?php echo esc_html( $comic['title'] ); ?></a>
                                        </h3>
                                        <?php if ( $comic['comic_type'] ) : ?>
                                            <span class="crc-pill crc-pill--type"><?php echo esc_html( crc_theme_comic_type_label( $comic['comic_type'] ) ); ?></span>
                                        <?php endif; ?>
                                    </div>

                                    <?php if ( ! empty( $genre_names ) ) : ?>
                                        <p class="crc-update-card__genres"><?php echo esc_html( implode( ', ', $genre_names ) ); ?></p>
                                    <?php endif; ?>

                                    <div class="crc-update-card__meta">
                                        <?php if ( $comic['author'] ) : ?>
                                            <span><?php echo esc_html( $comic['author'] ); ?></span>
                                        <?php endif; ?>
                                        <?php if ( $comic['status'] ) : ?>
                                            <span><?php echo esc_html( crc_theme_status_label( $comic['status'] ) ); ?></span>
                                        <?php endif; ?>
                                        <?php if ( $comic['updated_at'] ) : ?>
                                            <span><?php echo esc_html( crc_theme_relative_time( $comic['updated_at'] ) ); ?></span>
                                        <?php endif; ?>
                                    </div>

                                    <?php if ( ! empty( $comic['lastChapters'] ) ) : ?>
                                        <ul class="crc-update-card__chapters">
                                            <?php foreach ( $comic['lastChapters'] as $chapter ) : ?>
                                                <li>
                                                    <a href="<?php echo esc_url( $chapter['url'] ); ?>">
                                                        <?php
                                                        printf(
                                                            esc_html__( 'ตอนที่ %s', 'comic-reader' ),
                                                            esc_html( $chapter['num'] )
                                                        );
                                                        ?>
                                                    </a>
                                                    <span><?php echo esc_html( $chapter['date'] ); ?></span>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif; ?>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </section>
            </section>

            <aside class="crc-home-sidebar">
                <section class="crc-box crc-box--notice">
                    <header class="crc-box__header">
                        <h2 class="crc-box__title"><?php esc_html_e( 'อัปเดตประจำวันนี้', 'comic-reader' ); ?></h2>
                    </header>
                    <p class="crc-home-note">
                        <?php esc_html_e( 'หน้าแรกนี้ออกแบบให้เน้นการไล่ตอนล่าสุดแบบเว็บอ่านมังงะคลาสสิก พร้อมปุ่มทางลัดไปยัง archive และหมวดหมู่ที่ใช้บ่อย', 'comic-reader' ); ?>
                    </p>
                </section>

                <?php if ( $spotlight ) : ?>
                    <section class="crc-box crc-box--spotlight">
                        <header class="crc-box__header">
                            <h2 class="crc-box__title"><?php esc_html_e( 'การ์ตูนแนะนำประจำสัปดาห์', 'comic-reader' ); ?></h2>
                        </header>

                        <article class="crc-spotlight">
                            <a href="<?php echo esc_url( $spotlight['url'] ); ?>" class="crc-spotlight__cover">
                                <?php if ( $spotlight['cover'] ) : ?>
                                    <img
                                        src="<?php echo esc_url( $spotlight['cover'] ); ?>"
                                        alt="<?php echo esc_attr( $spotlight['title'] ); ?>"
                                        class="crc-spotlight__img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                <?php endif; ?>
                            </a>
                            <h3 class="crc-spotlight__title">
                                <a href="<?php echo esc_url( $spotlight['url'] ); ?>"><?php echo esc_html( $spotlight['title'] ); ?></a>
                            </h3>
                            <p class="crc-spotlight__meta">
                                <?php if ( $spotlight['author'] ) : ?>
                                    <span><?php echo esc_html( $spotlight['author'] ); ?></span>
                                <?php endif; ?>
                                <?php if ( $spotlight['status'] ) : ?>
                                    <span><?php echo esc_html( crc_theme_status_label( $spotlight['status'] ) ); ?></span>
                                <?php endif; ?>
                            </p>
                            <?php if ( $spotlight['description'] ) : ?>
                                <p class="crc-spotlight__excerpt">
                                    <?php echo esc_html( wp_trim_words( $spotlight['description'], 22 ) ); ?>
                                </p>
                            <?php endif; ?>
                        </article>
                    </section>
                <?php endif; ?>

                <?php if ( ! empty( $quick_picks ) ) : ?>
                    <section class="crc-box crc-box--picks">
                        <header class="crc-box__header">
                            <h2 class="crc-box__title"><?php esc_html_e( 'Quick picks', 'comic-reader' ); ?></h2>
                        </header>
                        <ul class="crc-picks-list">
                            <?php foreach ( $quick_picks as $comic ) : ?>
                                <li>
                                    <a href="<?php echo esc_url( $comic['url'] ); ?>"><?php echo esc_html( $comic['title'] ); ?></a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </section>
                <?php endif; ?>

                <?php crc_theme_render_term_group( __( 'หมวดหมู่', 'comic-reader' ), crc_theme_taxonomy_name( 'category' ), '', 18 ); ?>
                <?php crc_theme_render_term_group( __( 'แท็กยอดนิยม', 'comic-reader' ), crc_theme_taxonomy_name( 'genre' ), '', 20 ); ?>
            </aside>
        </div>
    </div>
</main>

<?php get_footer(); ?>
