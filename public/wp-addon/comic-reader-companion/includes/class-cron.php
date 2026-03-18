<?php
/**
 * WP-Cron scheduling for Comic Reader sync.
 *
 * Schedules registered:
 *   crc_10min  — custom 10-minute interval (incremental sync)
 *   daily      — built-in WP daily interval (full sync)
 *
 * All cron callbacks guard themselves: they bail early if the plugin
 * is not configured, so accidental firing never causes PHP errors.
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_Cron {

    const HOOK_INCREMENTAL = 'crc_cron_incremental';
    const HOOK_FULL_SYNC   = 'crc_cron_full_sync';
    const SCHEDULE_10MIN   = 'crc_10min';

    // ── Init ───────────────────────────────────────────────────────────────────

    public static function init(): void {
        add_filter( 'cron_schedules',        [ self::class, 'add_schedules' ] );
        add_action( self::HOOK_INCREMENTAL,  [ self::class, 'run_incremental' ] );
        add_action( self::HOOK_FULL_SYNC,    [ self::class, 'run_full_sync' ] );
    }

    // ── Custom intervals ───────────────────────────────────────────────────────

    /**
     * Register the crc_10min schedule if not already defined.
     *
     * @param array $schedules Existing cron schedules.
     * @return array Modified schedules.
     */
    public static function add_schedules( array $schedules ): array {
        if ( ! isset( $schedules[ self::SCHEDULE_10MIN ] ) ) {
            $schedules[ self::SCHEDULE_10MIN ] = [
                'interval' => 10 * MINUTE_IN_SECONDS,
                'display'  => __( 'Every 10 Minutes', 'comic-reader' ),
            ];
        }
        return $schedules;
    }

    // ── Schedule management ────────────────────────────────────────────────────

    /**
     * Register all cron events.
     * Safe to call multiple times — checks before scheduling.
     * Called on plugin activation.
     */
    public static function schedule(): void {
        if ( ! wp_next_scheduled( self::HOOK_INCREMENTAL ) ) {
            wp_schedule_event( time(), self::SCHEDULE_10MIN, self::HOOK_INCREMENTAL );
        }

        if ( ! wp_next_scheduled( self::HOOK_FULL_SYNC ) ) {
            // Offset full sync by 90 minutes to avoid hammering the API right at activation.
            wp_schedule_event(
                time() + ( 90 * MINUTE_IN_SECONDS ),
                'daily',
                self::HOOK_FULL_SYNC
            );
        }
    }

    /**
     * Unregister all cron events.
     * Called on plugin deactivation.
     */
    public static function unschedule(): void {
        $hooks = [ self::HOOK_INCREMENTAL, self::HOOK_FULL_SYNC ];
        foreach ( $hooks as $hook ) {
            $ts = wp_next_scheduled( $hook );
            if ( $ts ) {
                wp_unschedule_event( $ts, $hook );
            }
            // Also clear any remaining instances.
            wp_clear_scheduled_hook( $hook );
        }
    }

    /**
     * Reschedule both cron jobs from scratch.
     * Useful after changing the sync interval in settings.
     */
    public static function reschedule(): void {
        self::unschedule();
        self::schedule();
    }

    // ── Cron handlers ──────────────────────────────────────────────────────────

    /**
     * Incremental sync handler (runs every 10 minutes).
     * Processes the most recently updated comics only.
     */
    public static function run_incremental(): void {
        if ( ! CRC_Settings::is_configured() ) {
            return;
        }

        // Prevent overlapping runs if a previous sync is still running.
        if ( get_transient( 'crc_sync_running' ) ) {
            return;
        }

        set_transient( 'crc_sync_running', 1, 8 * MINUTE_IN_SECONDS );

        try {
            CRC_Sync::incremental_sync();
        } finally {
            delete_transient( 'crc_sync_running' );
        }
    }

    /**
     * Full sync handler (runs once daily).
     * Syncs ALL comics, chapters, and taxonomy terms.
     */
    public static function run_full_sync(): void {
        if ( ! CRC_Settings::is_configured() ) {
            return;
        }

        if ( get_transient( 'crc_sync_running' ) ) {
            return;
        }

        // Full sync needs more time — lock for up to 9 minutes.
        set_transient( 'crc_sync_running', 1, 9 * MINUTE_IN_SECONDS );

        try {
            CRC_Sync::full_sync();
        } finally {
            delete_transient( 'crc_sync_running' );
        }
    }

    // ── Status helpers (for admin UI) ──────────────────────────────────────────

    /**
     * Unix timestamp of next incremental sync, or null if not scheduled.
     */
    public static function next_incremental(): ?int {
        $ts = wp_next_scheduled( self::HOOK_INCREMENTAL );
        return $ts ?: null;
    }

    /**
     * Unix timestamp of next full sync, or null if not scheduled.
     */
    public static function next_full(): ?int {
        $ts = wp_next_scheduled( self::HOOK_FULL_SYNC );
        return $ts ?: null;
    }

    /** Is a sync currently running? */
    public static function is_running(): bool {
        return (bool) get_transient( 'crc_sync_running' );
    }
}
