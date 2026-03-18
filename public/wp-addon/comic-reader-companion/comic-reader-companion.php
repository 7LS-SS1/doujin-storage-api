<?php
/**
 * Plugin Name:  Comic Reader Companion
 * Plugin URI:   https://github.com/your-org/comic-storage-api
 * Description:  Companion plugin for Comic Storage API. Phase 1: rewrite rules, API client with transient caching, reader templates. Phase 2: CPTs, taxonomy sync, WP-Cron incremental/full sync, admin dashboard.
 * Version:      2.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * Author:       Comic Storage Team
 * License:      GPL v2 or later
 * Text Domain:  comic-reader
 * Domain Path:  /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'CRC_VERSION',     '2.0.0' );
define( 'CRC_PLUGIN_FILE', __FILE__ );
define( 'CRC_PLUGIN_DIR',  plugin_dir_path( __FILE__ ) );
define( 'CRC_PLUGIN_URL',  plugin_dir_url( __FILE__ ) );

// ── Autoload (order matters — Settings first, then dependents) ─────────────────
require_once CRC_PLUGIN_DIR . 'includes/class-settings.php';
require_once CRC_PLUGIN_DIR . 'includes/class-api-client.php';
require_once CRC_PLUGIN_DIR . 'includes/class-cpt.php';      // Phase 2
require_once CRC_PLUGIN_DIR . 'includes/class-sync.php';     // Phase 2
require_once CRC_PLUGIN_DIR . 'includes/class-cron.php';     // Phase 2
require_once CRC_PLUGIN_DIR . 'includes/class-rewrite.php';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
add_action( 'plugins_loaded', function (): void {
    CRC_Settings::init();  // Admin settings page
    CRC_CPT::init();       // CPTs + taxonomies
    CRC_Cron::init();      // Cron hooks + custom schedule
    CRC_Rewrite::init();   // URL routing + templates

    if ( is_admin() ) {
        add_action( 'admin_menu', 'crc_register_sync_menu' );
    }
} );

// ── Admin: Sync Dashboard ──────────────────────────────────────────────────────
function crc_register_sync_menu(): void {
    add_submenu_page(
        'comic-reader',
        __( 'Sync Dashboard', 'comic-reader' ),
        __( 'Sync Status', 'comic-reader' ),
        'manage_options',
        'crc-sync',
        'crc_render_sync_page'
    );
}

function crc_render_sync_page(): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( esc_html__( 'Insufficient permissions.', 'comic-reader' ) );
    }
    require_once CRC_PLUGIN_DIR . 'admin/sync-page.php';
}

// ── Activation ────────────────────────────────────────────────────────────────
register_activation_hook( __FILE__, function (): void {
    // Register CPTs before flushing so WP knows about them.
    CRC_CPT::register_post_types();
    CRC_CPT::register_taxonomies();
    CRC_Rewrite::add_rules();
    flush_rewrite_rules();
    CRC_Cron::schedule();
    update_option( 'crc_version', CRC_VERSION );
} );

// ── Deactivation ──────────────────────────────────────────────────────────────
register_deactivation_hook( __FILE__, function (): void {
    CRC_Cron::unschedule();
    flush_rewrite_rules();
    delete_option( 'crc_rewrite_flushed' );
} );

// ── URL helpers (global) ───────────────────────────────────────────────────────
if ( ! function_exists( 'crc_comic_url' ) ) {
    /**
     * Build the URL for a comic's detail page.
     *
     * @param string $slug Comic slug from API.
     */
    function crc_comic_url( string $slug ): string {
        $base = CRC_Settings::slug_base();
        return trailingslashit( home_url( '/' . $base . '/' . rawurlencode( $slug ) ) );
    }
}

if ( ! function_exists( 'crc_chapter_url' ) ) {
    /**
     * Build the URL for a chapter reader page.
     *
     * @param string $comic_slug    Comic slug from API.
     * @param int    $chapter_number Chapter number.
     */
    function crc_chapter_url( string $comic_slug, int $chapter_number ): string {
        $base = CRC_Settings::slug_base();
        return trailingslashit(
            home_url( '/' . $base . '/' . rawurlencode( $comic_slug ) . '/ep-' . $chapter_number )
        );
    }
}

if ( ! function_exists( 'crc_archive_url' ) ) {
    /**
     * Build the URL for the comics archive page.
     */
    function crc_archive_url(): string {
        return trailingslashit( home_url( '/' . CRC_Settings::slug_base() ) );
    }
}
