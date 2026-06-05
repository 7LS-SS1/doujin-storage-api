<?php
/**
 * Miku Doujin Theme — functions.php
 *
 * @package MikuDoujinTheme
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function (): void {
    load_theme_textdomain( 'comic-reader', get_template_directory() . '/languages' );

    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'align-wide' );
    add_theme_support(
        'html5',
        [
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script',
        ]
    );

    register_nav_menus(
        [
            'primary' => __( 'Primary Menu', 'comic-reader' ),
            'footer'  => __( 'Footer Menu', 'comic-reader' ),
        ]
    );
} );

add_action( 'wp_enqueue_scripts', function (): void {
    $style_path = get_stylesheet_directory() . '/style.css';
    $version    = file_exists( $style_path ) ? (string) filemtime( $style_path ) : '1.0.0';

    wp_enqueue_style(
        'miku-doujin-theme-style',
        get_stylesheet_uri(),
        [],
        $version
    );

    $theme_js_path = get_template_directory() . '/assets/js/theme.js';
    wp_enqueue_script(
        'miku-doujin-theme-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        [],
        file_exists( $theme_js_path ) ? (string) filemtime( $theme_js_path ) : $version,
        [ 'in_footer' => true, 'strategy' => 'defer' ]
    );

    if ( is_front_page() || is_home() ) {
        $home_css_path = get_template_directory() . '/assets/css/home.css';
        $home_js_path  = get_template_directory() . '/assets/js/home.js';

        wp_enqueue_style(
            'miku-doujin-theme-home',
            get_template_directory_uri() . '/assets/css/home.css',
            [ 'miku-doujin-theme-style' ],
            file_exists( $home_css_path ) ? (string) filemtime( $home_css_path ) : $version
        );

        wp_enqueue_script(
            'miku-doujin-theme-home-js',
            get_template_directory_uri() . '/assets/js/home.js',
            [ 'miku-doujin-theme-js' ],
            file_exists( $home_js_path ) ? (string) filemtime( $home_js_path ) : $version,
            [ 'in_footer' => true, 'strategy' => 'defer' ]
        );
    }

    if ( get_query_var( 'crc_chapter_num' ) ) {
        $reader_css_path = get_template_directory() . '/assets/css/reader.css';
        $reader_js_path  = get_template_directory() . '/assets/js/reader.js';

        wp_enqueue_style(
            'miku-doujin-theme-reader',
            get_template_directory_uri() . '/assets/css/reader.css',
            [ 'miku-doujin-theme-style' ],
            file_exists( $reader_css_path ) ? (string) filemtime( $reader_css_path ) : $version
        );

        wp_enqueue_script(
            'miku-doujin-theme-reader-js',
            get_template_directory_uri() . '/assets/js/reader.js',
            [],
            file_exists( $reader_js_path ) ? (string) filemtime( $reader_js_path ) : $version,
            [ 'in_footer' => true, 'strategy' => 'defer' ]
        );
    }
} );

add_filter( 'body_class', function ( array $classes ): array {
    $comic_slug  = get_query_var( 'crc_comic_slug' );
    $chapter_num = get_query_var( 'crc_chapter_num' );
    $scope       = crc_theme_scope();

    $classes[] = 'crc-scope-' . sanitize_html_class( $scope );

    if ( is_front_page() || is_home() ) {
        $classes[] = 'crc-is-home';
    }

    if ( $comic_slug === '__archive__' ) {
        $classes[] = 'crc-is-archive';
    } elseif ( $chapter_num ) {
        $classes[] = 'crc-is-reader';
        $classes[] = 'crc-reader-mode';
    } elseif ( $comic_slug ) {
        $classes[] = 'crc-is-single-comic';
    }

    return $classes;
} );

if ( ! function_exists( 'crc_theme_scope' ) ) {
    function crc_theme_scope(): string {
        if ( class_exists( 'CRC_Settings' ) && is_callable( [ 'CRC_Settings', 'content_scope' ] ) ) {
            $scope = (string) CRC_Settings::content_scope();
            if ( in_array( $scope, [ 'all', 'manga', 'doujin' ], true ) ) {
                return $scope;
            }
        }

        return 'all';
    }
}

if ( ! function_exists( 'crc_theme_primary_label' ) ) {
    function crc_theme_primary_label(): string {
        return match ( crc_theme_scope() ) {
            'doujin' => __( 'อ่านโดจิน', 'comic-reader' ),
            'manga'  => __( 'อ่านมังงะ', 'comic-reader' ),
            default  => __( 'อ่านคอมมิค', 'comic-reader' ),
        };
    }
}

if ( ! function_exists( 'crc_theme_archive_label' ) ) {
    function crc_theme_archive_label(): string {
        return match ( crc_theme_scope() ) {
            'doujin' => __( 'โดจินล่าสุด', 'comic-reader' ),
            'manga'  => __( 'มังงะล่าสุด', 'comic-reader' ),
            default  => __( 'คอมมิคล่าสุด', 'comic-reader' ),
        };
    }
}

if ( ! function_exists( 'crc_theme_archive_endpoint' ) ) {
    function crc_theme_archive_endpoint(): string {
        return function_exists( 'crc_archive_url' ) ? crc_archive_url() : home_url( '/' );
    }
}

if ( ! function_exists( 'crc_theme_comic_url_for_post' ) ) {
    function crc_theme_comic_url_for_post( int $post_id ): string {
        $slug = (string) get_post_meta( $post_id, '_crc_slug', true );

        if ( $slug !== '' && function_exists( 'crc_comic_url' ) ) {
            return crc_comic_url( $slug );
        }

        return (string) get_permalink( $post_id );
    }
}

if ( ! function_exists( 'crc_theme_comic_type_label' ) ) {
    function crc_theme_comic_type_label( string $comic_type ): string {
        return match ( strtolower( $comic_type ) ) {
            'doujin' => 'Doujin',
            'manga'  => 'Manga',
            default  => '',
        };
    }
}

if ( ! function_exists( 'crc_theme_relative_time' ) ) {
    function crc_theme_relative_time( ?string $datetime ): string {
        if ( empty( $datetime ) ) {
            return '';
        }

        $timestamp = strtotime( $datetime );
        if ( ! $timestamp ) {
            return '';
        }

        return sprintf(
            /* translators: %s: relative time */
            __( '%s ที่แล้ว', 'comic-reader' ),
            human_time_diff( $timestamp, current_time( 'timestamp' ) )
        );
    }
}

if ( ! function_exists( 'crc_theme_taxonomy_name' ) ) {
    function crc_theme_taxonomy_name( string $type ): string {
        return match ( $type ) {
            'category' => 'crc_category',
            'genre'    => 'crc_genre',
            'author'   => 'crc_author',
            'series'   => 'crc_series',
            default    => $type,
        };
    }
}

if ( ! function_exists( 'crc_theme_filter_query_key' ) ) {
    function crc_theme_filter_query_key( string $taxonomy ): ?string {
        return match ( $taxonomy ) {
            'crc_category' => 'cat',
            'crc_genre'    => 'tag',
            default        => null,
        };
    }
}

if ( ! function_exists( 'crc_theme_filter_url' ) ) {
    function crc_theme_filter_url( string $taxonomy, string $slug ): string {
        $query_key = crc_theme_filter_query_key( $taxonomy );
        if ( ! $query_key ) {
            return crc_theme_archive_endpoint();
        }

        return add_query_arg( $query_key, rawurlencode( $slug ), crc_theme_archive_endpoint() );
    }
}

if ( ! function_exists( 'crc_theme_term_label_by_slug' ) ) {
    function crc_theme_term_label_by_slug( string $taxonomy, string $slug ): string {
        if ( ! $slug || ! taxonomy_exists( $taxonomy ) ) {
            return $slug;
        }

        $term = get_term_by( 'slug', $slug, $taxonomy );
        return ( $term instanceof WP_Term ) ? $term->name : $slug;
    }
}

if ( ! function_exists( 'crc_theme_get_terms' ) ) {
    function crc_theme_get_terms( string $taxonomy, int $limit = 40 ): array {
        if ( ! taxonomy_exists( $taxonomy ) ) {
            return [];
        }

        $terms = get_terms(
            [
                'taxonomy'   => $taxonomy,
                'hide_empty' => true,
                'number'     => $limit,
                'orderby'    => 'count',
                'order'      => 'DESC',
            ]
        );

        return is_array( $terms ) ? $terms : [];
    }
}

if ( ! function_exists( 'crc_theme_render_term_group' ) ) {
    function crc_theme_render_term_group( string $title, string $taxonomy, string $current_slug = '', int $limit = 40 ): void {
        $terms = crc_theme_get_terms( $taxonomy, $limit );
        if ( empty( $terms ) ) {
            return;
        }
        ?>
        <section class="crc-sidebar-panel">
            <h2 class="crc-sidebar-panel__title"><?php echo esc_html( $title ); ?></h2>
            <div class="crc-term-pills" role="list">
                <?php foreach ( $terms as $term ) : ?>
                    <?php
                    $is_active = $current_slug === $term->slug;
                    $url       = crc_theme_filter_url( $taxonomy, $term->slug );
                    ?>
                    <a
                        href="<?php echo esc_url( $url ); ?>"
                        class="crc-term-pill<?php echo $is_active ? ' is-active' : ''; ?>"
                        role="listitem"
                    >
                        <?php echo esc_html( $term->name ); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
    }
}

if ( ! function_exists( 'crc_theme_render_sidebar' ) ) {
    function crc_theme_render_sidebar( array $args = [] ): void {
        $current_category = sanitize_text_field( (string) ( $args['current_category'] ?? '' ) );
        $current_tag      = sanitize_text_field( (string) ( $args['current_tag'] ?? '' ) );
        $search           = sanitize_text_field( (string) ( $args['search'] ?? '' ) );
        $archive_url      = crc_theme_archive_endpoint();
        ?>
        <aside class="crc-sidebar" aria-label="<?php esc_attr_e( 'Sidebar', 'comic-reader' ); ?>">
            <section class="crc-sidebar-panel crc-sidebar-panel--search">
                <h2 class="crc-sidebar-panel__title"><?php esc_html_e( 'ค้นหา', 'comic-reader' ); ?></h2>
                <form class="crc-sidebar-search" method="get" action="<?php echo esc_url( $archive_url ); ?>">
                    <input
                        type="search"
                        name="s"
                        class="crc-sidebar-search__input"
                        value="<?php echo esc_attr( $search ); ?>"
                        placeholder="<?php esc_attr_e( 'พิมพ์ชื่อเรื่อง...', 'comic-reader' ); ?>"
                    />
                    <button type="submit" class="crc-sidebar-search__button">
                        <?php esc_html_e( 'ค้นหา', 'comic-reader' ); ?>
                    </button>
                </form>
            </section>

            <?php if ( $current_tag || $current_category ) : ?>
                <section class="crc-sidebar-panel">
                    <h2 class="crc-sidebar-panel__title"><?php esc_html_e( 'ตัวกรองที่ใช้งาน', 'comic-reader' ); ?></h2>
                    <div class="crc-active-filters">
                        <?php if ( $current_tag ) : ?>
                            <a href="<?php echo esc_url( add_query_arg( 'tag', rawurlencode( $current_tag ), $archive_url ) ); ?>" class="crc-term-pill is-active">
                                <?php echo esc_html( crc_theme_term_label_by_slug( crc_theme_taxonomy_name( 'genre' ), $current_tag ) ); ?>
                            </a>
                        <?php endif; ?>
                        <?php if ( $current_category ) : ?>
                            <a href="<?php echo esc_url( add_query_arg( 'cat', rawurlencode( $current_category ), $archive_url ) ); ?>" class="crc-term-pill is-active">
                                <?php echo esc_html( crc_theme_term_label_by_slug( crc_theme_taxonomy_name( 'category' ), $current_category ) ); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                </section>
            <?php endif; ?>

            <?php crc_theme_render_term_group( __( 'ประเภท', 'comic-reader' ), crc_theme_taxonomy_name( 'genre' ), $current_tag, 42 ); ?>
            <?php crc_theme_render_term_group( __( 'หมวดหมู่', 'comic-reader' ), crc_theme_taxonomy_name( 'category' ), $current_category, 18 ); ?>
        </aside>
        <?php
    }
}

add_action( 'widgets_init', function (): void {
    register_sidebar(
        [
            'name'          => __( 'Sidebar', 'comic-reader' ),
            'id'            => 'sidebar-1',
            'description'   => __( 'Add widgets here.', 'comic-reader' ),
            'before_widget' => '<section id="%1$s" class="widget %2$s">',
            'after_widget'  => '</section>',
            'before_title'  => '<h2 class="widget-title">',
            'after_title'   => '</h2>',
        ]
    );
} );
