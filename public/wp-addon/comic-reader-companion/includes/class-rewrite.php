<?php
/**
 * Rewrite rules and virtual page routing.
 *
 * URL patterns registered:
 *   /{base}/                              → comics archive
 *   /{base}/{comic-slug}/                 → comic detail
 *   /{base}/{comic-slug}/ep-{number}/     → chapter reader
 *
 * Templates are loaded from (in priority order):
 *   1. wp-content/themes/{active-theme}/comic-reader/{template}.php
 *   2. wp-content/plugins/comic-reader-companion/templates/{template}.php
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_Rewrite {

    const QV_COMIC = 'crc_comic_slug';
    const QV_EP    = 'crc_chapter_num';

    public static function init(): void {
        add_action( 'init',              [ self::class, 'add_rules' ] );
        add_filter( 'query_vars',        [ self::class, 'add_query_vars' ] );
        add_action( 'template_redirect', [ self::class, 'handle_request' ], 1 );
        add_filter( 'rewrite_rules_array', [ self::class, 'maybe_flush_rules' ] );
    }

    /**
     * Register rewrite rules.
     * Must be called on activation AND on `init` (for multi-site / late init).
     */
    public static function add_rules(): void {
        $base = preg_quote( CRC_Settings::slug_base(), '/' );

        // Order matters — more specific patterns first.

        // /{base}/{slug}/ep-{number}/
        add_rewrite_rule(
            '^' . $base . '/([^/]+)/ep-([0-9]+)/?$',
            'index.php?' . self::QV_COMIC . '=$matches[1]&' . self::QV_EP . '=$matches[2]',
            'top'
        );

        // /{base}/{slug}/
        add_rewrite_rule(
            '^' . $base . '/([^/]+)/?$',
            'index.php?' . self::QV_COMIC . '=$matches[1]',
            'top'
        );

        // /{base}/
        add_rewrite_rule(
            '^' . $base . '/?$',
            'index.php?' . self::QV_COMIC . '=__archive__',
            'top'
        );
    }

    /**
     * Register custom query vars so WordPress doesn't strip them.
     */
    public static function add_query_vars( array $vars ): array {
        $vars[] = self::QV_COMIC;
        $vars[] = self::QV_EP;
        return $vars;
    }

    /**
     * Intercept matching requests, fetch from API, load template.
     */
    public static function handle_request(): void {
        $comic_slug  = get_query_var( self::QV_COMIC );
        $chapter_num = get_query_var( self::QV_EP );

        if ( empty( $comic_slug ) ) {
            return; // Not our route.
        }

        // Keep unicode slugs intact (sanitize_text_field strips encoded multibyte chars).
        $comic_slug  = rawurldecode( (string) $comic_slug );
        $comic_slug  = trim( wp_check_invalid_utf8( $comic_slug ) );
        $chapter_num = absint( $chapter_num );

        if ( $comic_slug === '' ) {
            self::handle_error(
                new WP_Error(
                    'crc_invalid_slug',
                    __( 'Invalid comic slug.', 'comic-reader' ),
                    [ 'status' => 404 ]
                )
            );
            exit;
        }

        if ( $comic_slug === '__archive__' ) {
            self::render_archive();
        } elseif ( $chapter_num > 0 ) {
            self::render_chapter( $comic_slug, $chapter_num );
        } else {
            self::render_comic( $comic_slug );
        }

        // Template has been loaded and rendered; stop WordPress's default handling.
        exit;
    }

    // ── Route handlers ────────────────────────────────────────────────────────

    private static function render_archive(): void {
        // Pagination via ?paged= query var.
        $page      = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification
        $search    = sanitize_text_field( $_GET['s'] ?? '' );  // phpcs:ignore WordPress.Security.NonceVerification
        $category  = sanitize_text_field( $_GET['cat'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification
        $tag       = sanitize_text_field( $_GET['tag'] ?? '' );  // phpcs:ignore WordPress.Security.NonceVerification
        $status    = sanitize_text_field( $_GET['status'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification

        $data = CRC_API_Client::get_comics(
            array_filter( [
                'page'     => $page,
                'pageSize' => 24,
                'search'   => $search,
                'category' => $category,
                'tag'      => $tag,
                'status'   => $status,
            ] )
        );

        if ( is_wp_error( $data ) ) {
            self::handle_error( $data );
            return;
        }

        self::load_template( 'archive-comics.php', [
            'comics'      => $data['comics'] ?? [],
            'total'       => (int) ( $data['total'] ?? 0 ),
            'page'        => $page,
            'page_size'   => 24,
            'search'      => $search,
            'category'    => $category,
            'tag'         => $tag,
            'status'      => $status,
        ] );
    }

    private static function render_comic( string $slug ): void {
        // Fetch comic detail and full chapter list in parallel using output buffering
        // (wp_remote_request doesn't support true async, so sequential is fine here
        // since both are transient-cached after first load).
        $comic    = CRC_API_Client::get_comic( $slug );
        $chapters = CRC_API_Client::get_comic_chapters( $slug );

        if ( is_wp_error( $comic ) ) {
            self::handle_error( $comic );
            return;
        }

        $chapter_list = is_wp_error( $chapters ) ? [] : ( $chapters['chapters'] ?? [] );
        $is_one_shot  = ! empty( $comic['is_one_shot'] );

        if ( $is_one_shot ) {
            // If chapter cache is stale/empty, retry chapters uncached for one-shot redirect.
            if ( empty( $chapter_list ) && method_exists( 'CRC_API_Client', 'get_uncached' ) ) {
                $fresh = CRC_API_Client::get_uncached(
                    '/comics/' . rawurlencode( $slug ) . '/chapters',
                    [ 'pageSize' => 200 ]
                );
                if ( ! is_wp_error( $fresh ) ) {
                    $chapter_list = $fresh['chapters'] ?? $chapter_list;
                }
            }

            $first_chapter_num = self::find_first_chapter_number( $chapter_list );

            // Fallback: use latestChapters from comic detail response.
            if ( $first_chapter_num === null ) {
                $first_chapter_num = self::find_first_chapter_number( $comic['latestChapters'] ?? [] );
            }

            if ( $first_chapter_num !== null ) {
                wp_safe_redirect( crc_chapter_url( $slug, $first_chapter_num ), 302, 'Comic Reader Companion' );
                exit;
            }
        }

        self::load_template( 'single-comic.php', [
            'comic'        => $comic,
            'chapters'     => $chapter_list,
            'comic_slug'   => $slug,
        ] );
    }

    /**
     * @param array $chapters List of chapter arrays that may contain `number`.
     * @return int|null Smallest positive chapter number, or null when none found.
     */
    private static function find_first_chapter_number( array $chapters ): ?int {
        $first = null;
        foreach ( $chapters as $ch ) {
            $num = (int) ( $ch['number'] ?? 0 );
            if ( $num <= 0 ) {
                continue;
            }
            if ( $first === null || $num < $first ) {
                $first = $num;
            }
        }
        return $first;
    }

    private static function render_chapter( string $comic_slug, int $chapter_num ): void {
        $chapter = CRC_API_Client::get_chapter_by_number( $comic_slug, $chapter_num );

        if ( is_wp_error( $chapter ) ) {
            self::handle_error( $chapter );
            return;
        }

        self::load_template( 'single-chapter.php', [
            'chapter'        => $chapter,
            'comic_slug'     => $comic_slug,
            'chapter_number' => $chapter_num,
        ] );
    }

    // ── Template loading ──────────────────────────────────────────────────────

    /**
     * Load a template file, checking the active theme first, then plugin fallback.
     * Data is passed as `$args` (WP 5.5+ convention) and also extracted into scope.
     *
     * @param string $template Template filename, e.g. 'single-chapter.php'.
     * @param array  $data     Data to pass to the template.
     */
    private static function load_template( string $template, array $data ): void {
        // 1. Look in active theme: themes/{theme}/comic-reader/{template}
        $theme_tpl = locate_template( 'comic-reader/' . $template );

        // 2. Fall back to plugin's own templates directory.
        $plugin_tpl = CRC_PLUGIN_DIR . 'templates/' . $template;

        $tpl = $theme_tpl ?: ( file_exists( $plugin_tpl ) ? $plugin_tpl : '' );

        if ( empty( $tpl ) ) {
            wp_die(
                esc_html(
                    sprintf(
                        /* translators: %s: template filename */
                        __( 'Comic Reader template not found: %s', 'comic-reader' ),
                        $template
                    )
                ),
                esc_html__( 'Template Error', 'comic-reader' ),
                [ 'response' => 500 ]
            );
        }

        status_header( 200 );

        // WordPress 5.5+: pass $args to load_template() which extracts them.
        load_template( $tpl, true, $data );
    }

    // ── Error handling ────────────────────────────────────────────────────────

    private static function handle_error( WP_Error $error ): void {
        $status = (int) ( $error->get_error_data()['status'] ?? 500 );

        if ( $status === 404 ) {
            global $wp_query;
            $wp_query->set_404();
            status_header( 404 );
            nocache_headers();
            // Use theme's 404 template.
            $tpl_404 = get_404_template();
            if ( $tpl_404 ) {
                load_template( $tpl_404 );
            }
            return;
        }

        wp_die(
            esc_html( $error->get_error_message() ),
            esc_html__( 'Comic Reader Error', 'comic-reader' ),
            [ 'response' => $status ]
        );
    }

    // ── Auto-flush detection ──────────────────────────────────────────────────

    /**
     * Detect if our rewrite rules are missing and schedule a flush.
     * Avoids having to remind users to visit Settings > Permalinks.
     */
    public static function maybe_flush_rules( array $rules ): array {
        $base      = preg_quote( CRC_Settings::slug_base(), '/' );
        $our_rule  = '^' . $base . '/([^/]+)/ep-([0-9]+)/?$';

        if ( ! isset( $rules[ $our_rule ] ) ) {
            $flushed = get_option( 'crc_rewrite_flushed', '' );
            if ( $flushed !== CRC_VERSION ) {
                update_option( 'crc_rewrite_flushed', CRC_VERSION );
                // Schedule flush at shutdown to avoid recursive calls.
                add_action( 'shutdown', 'flush_rewrite_rules' );
            }
        }

        return $rules;
    }
}
