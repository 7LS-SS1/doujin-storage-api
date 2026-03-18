<?php
/**
 * Plugin settings management.
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_Settings {

    const OPTION_BASE_URL   = 'crc_api_base_url';
    const OPTION_API_KEY    = 'crc_api_key';
    const OPTION_CACHE_TTL  = 'crc_cache_ttl';
    const OPTION_SLUG_BASE  = 'crc_slug_base';
    const OPTION_LOG_ERRORS = 'crc_log_errors';

    public static function init(): void {
        add_action( 'admin_menu',            [ self::class, 'register_menu' ] );
        add_action( 'admin_init',            [ self::class, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_admin_assets' ] );
        add_action( 'wp_ajax_crc_test_connection', [ self::class, 'ajax_test_connection' ] );
    }

    public static function register_menu(): void {
        add_menu_page(
            __( 'Comic Reader', 'comic-reader' ),
            __( 'Comic Reader', 'comic-reader' ),
            'manage_options',
            'comic-reader',
            [ self::class, 'render_page' ],
            'dashicons-book-alt',
            56
        );
    }

    public static function register_settings(): void {
        register_setting(
            'crc_group',
            self::OPTION_BASE_URL,
            [
                'type'              => 'string',
                'sanitize_callback' => 'esc_url_raw',
                'default'           => '',
            ]
        );
        register_setting(
            'crc_group',
            self::OPTION_API_KEY,
            [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ]
        );
        register_setting(
            'crc_group',
            self::OPTION_CACHE_TTL,
            [
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
                'default'           => 300,
            ]
        );
        register_setting(
            'crc_group',
            self::OPTION_SLUG_BASE,
            [
                'type'              => 'string',
                'sanitize_callback' => [ self::class, 'sanitize_slug_base' ],
                'default'           => 'comics',
            ]
        );
        register_setting(
            'crc_group',
            self::OPTION_LOG_ERRORS,
            [
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
                'default'           => 1,
            ]
        );
    }

    /**
     * Sanitize slug base — must be a valid URL segment.
     */
    public static function sanitize_slug_base( mixed $value ): string {
        $slug = sanitize_title( (string) $value );
        return $slug ?: 'comics';
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public static function api_base_url(): string {
        return rtrim( (string) get_option( self::OPTION_BASE_URL, '' ), '/' );
    }

    public static function api_key(): string {
        return (string) get_option( self::OPTION_API_KEY, '' );
    }

    public static function cache_ttl(): int {
        return (int) get_option( self::OPTION_CACHE_TTL, 300 );
    }

    public static function slug_base(): string {
        $base = (string) get_option( self::OPTION_SLUG_BASE, 'comics' );
        return $base ?: 'comics';
    }

    public static function log_errors(): bool {
        return (bool) get_option( self::OPTION_LOG_ERRORS, 1 );
    }

    public static function is_configured(): bool {
        return ! empty( self::api_base_url() ) && ! empty( self::api_key() );
    }

    // ── Settings page renderer ────────────────────────────────────────────────

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have permission to access this page.', 'comic-reader' ) );
        }

        // Handle manual cache flush.
        if (
            isset( $_POST['crc_flush_cache'] ) &&
            check_admin_referer( 'crc_admin_actions', 'crc_nonce' )
        ) {
            self::flush_all_cache();
            add_settings_error(
                'crc_messages',
                'crc_cache_cleared',
                __( 'All Comic Reader cache has been cleared.', 'comic-reader' ),
                'updated'
            );
        }

        require_once CRC_PLUGIN_DIR . 'admin/settings-page.php';
    }

    // ── Admin assets ──────────────────────────────────────────────────────────

    /**
     * Enqueue CSS + JS on CRC admin pages only.
     *
     * @param string $hook Current admin page hook suffix.
     */
    public static function enqueue_admin_assets( string $hook ): void {
        $crc_hooks = [
            'toplevel_page_comic-reader',
            'comic-reader_page_crc-sync',
        ];

        if ( ! in_array( $hook, $crc_hooks, true ) ) {
            return;
        }

        $base = CRC_PLUGIN_URL . 'admin/assets/';
        $ver  = CRC_VERSION;

        wp_enqueue_style(
            'crc-admin',
            $base . 'crc-admin.css',
            [],
            $ver
        );

        wp_enqueue_script(
            'crc-admin',
            $base . 'crc-admin.js',
            [],
            $ver,
            true // load in footer
        );

        wp_localize_script(
            'crc-admin',
            'crcAdm',
            [
                'nonce' => wp_create_nonce( 'crc_test_connection_nonce' ),
            ]
        );
    }

    // ── AJAX: Test Connection ─────────────────────────────────────────────────

    /**
     * AJAX handler: test API connection using form values (before saving).
     *
     * Expects POST: nonce, base_url, api_key.
     * Stores result in `crc_last_test` option for the status badge.
     */
    public static function ajax_test_connection(): void {
        check_ajax_referer( 'crc_test_connection_nonce', 'nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( [ 'message' => 'Permission denied.' ], 403 );
        }

        $base_url = esc_url_raw( sanitize_text_field( wp_unslash( $_POST['base_url'] ?? '' ) ) );
        $api_key  = sanitize_text_field( wp_unslash( $_POST['api_key'] ?? '' ) );

        $base_url = rtrim( $base_url, '/' );

        if ( empty( $base_url ) || empty( $api_key ) ) {
            wp_send_json_error( [ 'message' => 'กรุณากรอก URL และ API Key' ] );
        }

        // Public API routes are namespaced under /api/public.
        $url = $base_url . '/api/public/comics?page=1&pageSize=1';

        $response = wp_remote_get(
            $url,
            [
                'timeout' => 12,
                'headers' => [
                    'X-API-Key' => $api_key,
                    'Accept'    => 'application/json',
                ],
            ]
        );

        $tested_at = time();

        if ( is_wp_error( $response ) ) {
            $msg = 'เชื่อมต่อไม่ได้: ' . $response->get_error_message();
            update_option( 'crc_last_test', [
                'status'    => 'error',
                'message'   => $msg,
                'tested_at' => $tested_at,
            ] );
            wp_send_json_error( [ 'message' => $msg ] );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( $code === 200 && is_array( $data ) ) {
            $msg = 'เชื่อมต่อสำเร็จ (HTTP 200)';
            update_option( 'crc_last_test', [
                'status'    => 'ok',
                'message'   => $msg,
                'tested_at' => $tested_at,
            ] );
            wp_send_json_success( [ 'message' => $msg ] );
        }

        if ( $code === 401 || $code === 403 ) {
            $msg = 'API Key ไม่ถูกต้องหรือถูกปฏิเสธ (HTTP ' . $code . ')';
        } elseif ( $code === 404 ) {
            $msg = 'ไม่พบ Endpoint (HTTP 404) — ตรวจสอบ URL อีกครั้ง';
        } else {
            $msg = 'API ตอบกลับ HTTP ' . intval( $code ) . ' — ไม่สำเร็จ';
        }

        update_option( 'crc_last_test', [
            'status'    => 'error',
            'message'   => $msg,
            'tested_at' => $tested_at,
        ] );
        wp_send_json_error( [ 'message' => $msg ] );
    }

    // ── Cache ─────────────────────────────────────────────────────────────────

    /**
     * Delete all transients created by the plugin.
     */
    public static function flush_all_cache(): void {
        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                $wpdb->esc_like( '_transient_crc_' ) . '%',
                $wpdb->esc_like( '_transient_timeout_crc_' ) . '%'
            )
        );
    }
}
