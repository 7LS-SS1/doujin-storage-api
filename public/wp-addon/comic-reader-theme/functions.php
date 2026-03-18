<?php
/**
 * Comic Reader Theme — functions.php
 *
 * @package ComicReader
 */

defined( 'ABSPATH' ) || exit;

// ── Theme Setup ───────────────────────────────────────────────────────────────
add_action( 'after_setup_theme', function (): void {
    load_theme_textdomain( 'comic-reader', get_template_directory() . '/languages' );

    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ] );
    add_theme_support( 'customize-selective-refresh-widgets' );

    // Navigation menus.
    register_nav_menus( [
        'primary' => __( 'Primary Menu', 'comic-reader' ),
        'footer'  => __( 'Footer Menu', 'comic-reader' ),
    ] );
} );

// ── Enqueue Styles & Scripts ──────────────────────────────────────────────────
add_action( 'wp_enqueue_scripts', function (): void {
    $style_path = get_stylesheet_directory() . '/style.css';
    $ver        = file_exists( $style_path ) ? (string) filemtime( $style_path ) : '1.0.0';

    // Main stylesheet (includes base styles defined in style.css).
    wp_enqueue_style(
        'comic-reader-style',
        get_stylesheet_uri(),
        [],
        $ver
    );

    // Homepage CSS + JS (only on the front page / blog homepage).
    if ( is_front_page() || is_home() ) {
        $home_css_path = get_template_directory() . '/assets/css/home.css';
        $home_js_path  = get_template_directory() . '/assets/js/home.js';

        wp_enqueue_style(
            'comic-reader-home',
            get_template_directory_uri() . '/assets/css/home.css',
            [ 'comic-reader-style' ],
            file_exists( $home_css_path ) ? (string) filemtime( $home_css_path ) : $ver
        );

        wp_enqueue_script(
            'comic-reader-home-js',
            get_template_directory_uri() . '/assets/js/home.js',
            [],
            file_exists( $home_js_path ) ? (string) filemtime( $home_js_path ) : $ver,
            [ 'in_footer' => true, 'strategy' => 'defer' ]
        );
    }

    // Reader-specific CSS (only on chapter reader pages).
    if ( get_query_var( 'crc_chapter_num' ) ) {
        $reader_css_path = get_template_directory() . '/assets/css/reader.css';
        $reader_js_path  = get_template_directory() . '/assets/js/reader.js';

        wp_enqueue_style(
            'comic-reader-reader',
            get_template_directory_uri() . '/assets/css/reader.css',
            [ 'comic-reader-style' ],
            file_exists( $reader_css_path ) ? (string) filemtime( $reader_css_path ) : $ver
        );

        // Reader JS (keyboard nav, lazy load observer, scroll restore).
        wp_enqueue_script(
            'comic-reader-js',
            get_template_directory_uri() . '/assets/js/reader.js',
            [],
            file_exists( $reader_js_path ) ? (string) filemtime( $reader_js_path ) : $ver,
            [ 'in_footer' => true, 'strategy' => 'defer' ]
        );
    }
} );

// ── Title Tag ─────────────────────────────────────────────────────────────────
add_filter( 'pre_get_document_title', function ( string $title ): string {
    $comic_slug  = get_query_var( 'crc_comic_slug' );
    $chapter_num = get_query_var( 'crc_chapter_num' );

    // If our plugin vars are set but $title is empty, provide a fallback.
    // The actual title is set in the template via wp_title filter if needed.
    return $title;
} );

// ── Body Classes ──────────────────────────────────────────────────────────────
add_filter( 'body_class', function ( array $classes ): array {
    $comic_slug  = get_query_var( 'crc_comic_slug' );
    $chapter_num = get_query_var( 'crc_chapter_num' );

    if ( $comic_slug === '__archive__' ) {
        $classes[] = 'crc-is-archive';
    } elseif ( $chapter_num ) {
        $classes[] = 'crc-is-reader';
        $classes[] = 'crc-reader-mode'; // Used by CSS to hide default WP padding.
    } elseif ( $comic_slug ) {
        $classes[] = 'crc-is-single-comic';
    }

    return $classes;
} );

// ── Widgets ───────────────────────────────────────────────────────────────────
add_action( 'widgets_init', function (): void {
    register_sidebar( [
        'name'          => __( 'Sidebar', 'comic-reader' ),
        'id'            => 'sidebar-1',
        'description'   => __( 'Add widgets here.', 'comic-reader' ),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ] );
} );
