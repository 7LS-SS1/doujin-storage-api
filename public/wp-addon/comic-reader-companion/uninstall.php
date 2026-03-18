<?php
/**
 * Plugin uninstall cleanup.
 *
 * Runs when the plugin is deleted via WP Admin → Plugins → Delete.
 * Removes all plugin options, transients, and (optionally) CPT posts.
 *
 * IMPORTANT: CPT post deletion is commented out by default.
 * Uncomment the section below only if you want synced comic/chapter data
 * to be permanently removed when the plugin is uninstalled.
 *
 * @package ComicReaderCompanion
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

// ── Delete plugin options ──────────────────────────────────────────────────────
$options = [
    'crc_api_base_url',
    'crc_api_key',
    'crc_cache_ttl',
    'crc_slug_base',
    'crc_log_errors',
    'crc_version',
    'crc_rewrite_flushed',
    'crc_last_incremental_sync',
    'crc_last_full_sync',
    'crc_last_sync_stats',
    'crc_sync_errors',
];
foreach ( $options as $opt ) {
    delete_option( $opt );
}

// ── Delete all plugin transients ───────────────────────────────────────────────
// phpcs:ignore WordPress.DB.DirectDatabaseQuery
$wpdb->query(
    $wpdb->prepare(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
        $wpdb->esc_like( '_transient_crc_' ) . '%',
        $wpdb->esc_like( '_transient_timeout_crc_' ) . '%'
    )
);

// ── Optionally delete synced CPT posts ─────────────────────────────────────────
// Uncomment the block below to permanently delete all synced comic and chapter data.
// WARNING: This is irreversible. The data can be re-synced from the API.

/*
$post_types = [ 'crc_comic', 'crc_chapter' ];
foreach ( $post_types as $pt ) {
    $ids = get_posts( [
        'post_type'      => $pt,
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'post_status'    => 'any',
    ] );
    foreach ( $ids as $id ) {
        wp_delete_post( $id, true ); // true = force delete (skip trash)
    }
}
*/

// ── Flush rewrite rules ────────────────────────────────────────────────────────
flush_rewrite_rules();
