<?php
/**
 * API client for Comic Storage API.
 *
 * All GET requests are cached via WordPress transients.
 * The API key is never exposed to the frontend — all requests
 * happen server-side via wp_remote_request().
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_API_Client {

    private const TRANSIENT_PREFIX = 'crc_';
    private const MAX_TIMEOUT      = 15; // seconds

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * GET with transient cache.
     *
     * @param string  $endpoint  e.g. '/comics' or '/chapters/uuid'
     * @param array   $params    Query string parameters.
     * @return array|WP_Error   Decoded JSON or WP_Error.
     */
    public static function get( string $endpoint, array $params = [] ): array|WP_Error {
        $cache_key = self::make_cache_key( $endpoint, $params );
        $ttl       = CRC_Settings::cache_ttl();

        if ( $ttl > 0 ) {
            $cached = get_transient( $cache_key );
            if ( $cached !== false ) {
                return $cached;
            }
        }

        $result = self::request( 'GET', $endpoint, $params );

        if ( ! is_wp_error( $result ) && $ttl > 0 ) {
            set_transient( $cache_key, $result, $ttl );
        }

        return $result;
    }

    /**
     * GET without transient cache.
     * Used by sync jobs to always fetch the latest API state.
     *
     * @param string $endpoint API endpoint.
     * @param array  $params   Query string params.
     * @return array|WP_Error
     */
    public static function get_uncached( string $endpoint, array $params = [] ): array|WP_Error {
        return self::request( 'GET', $endpoint, $params );
    }

    /**
     * POST (no cache).
     *
     * @param string $endpoint API endpoint.
     * @param array  $body     JSON body.
     */
    public static function post( string $endpoint, array $body = [] ): array|WP_Error {
        return self::request( 'POST', $endpoint, [], $body );
    }

    // ── Convenience helpers ───────────────────────────────────────────────────

    public static function get_comics( array $params = [] ): array|WP_Error {
        return self::get( '/comics', $params );
    }

    public static function get_comic( string $slug ): array|WP_Error {
        return self::get( '/comics/' . rawurlencode( $slug ) );
    }

    /**
     * Fetch all chapters for a comic (up to 200 via pageSize param).
     * Returns the API response array with 'chapters' key.
     */
    public static function get_comic_chapters( string $slug, int $page_size = 200 ): array|WP_Error {
        return self::get( '/comics/' . rawurlencode( $slug ) . '/chapters', [ 'pageSize' => $page_size ] );
    }

    public static function get_chapter( string $id ): array|WP_Error {
        return self::get( '/chapters/' . rawurlencode( $id ) );
    }

    /**
     * Fetch a chapter by comic slug + chapter number.
     *
     * Also enriches the response with `prevChapterNumber` and `nextChapterNumber`
     * so templates can build prev/next URLs without extra API calls.
     *
     * @param string $comic_slug     Comic slug from API.
     * @param int    $chapter_number Chapter number (from URL ep-N).
     * @return array|WP_Error        Chapter data with images and enriched nav.
     */
    public static function get_chapter_by_number( string $comic_slug, int $chapter_number ): array|WP_Error {

        // Get the chapter list for this comic (cached).
        $chapters_response = self::get_comic_chapters( $comic_slug );
        if ( is_wp_error( $chapters_response ) ) {
            return $chapters_response;
        }

        $chapter_list = $chapters_response['chapters'] ?? [];

        // Build chapter maps for reliable prev/next fallback logic.
        $id_to_num = [];
        $match_id  = null;
        $all_nums  = [];

        foreach ( $chapter_list as $ch ) {
            $num = (int) ( $ch['number'] ?? -1 );
            $id  = (string) ( $ch['id'] ?? '' );

            if ( $id !== '' ) {
                $id_to_num[ $id ] = $num;
            }
            if ( $num > 0 ) {
                $all_nums[ $num ] = true;
            }

            if ( $num === $chapter_number ) {
                $match_id = $id;
            }
        }

        // Neighbor lookup from chapter numbers list (robust against broken prev/next IDs).
        $sorted_nums = array_keys( $all_nums );
        sort( $sorted_nums, SORT_NUMERIC );

        $prev_from_list = null;
        $next_from_list = null;
        foreach ( $sorted_nums as $num ) {
            if ( $num < $chapter_number ) {
                $prev_from_list = $num;
                continue;
            }
            if ( $num > $chapter_number ) {
                $next_from_list = $num;
                break;
            }
        }

        if ( $match_id === null ) {
            return new WP_Error(
                'crc_not_found',
                sprintf(
                    /* translators: 1: chapter number, 2: comic slug */
                    __( 'Chapter %1$d not found in "%2$s".', 'comic-reader' ),
                    $chapter_number,
                    $comic_slug
                ),
                [ 'status' => 404 ]
            );
        }

        // Fetch full chapter details (images + prev/next IDs).
        $chapter = self::get_chapter( $match_id );
        if ( is_wp_error( $chapter ) ) {
            return $chapter;
        }

        // Enrich with chapter numbers for URL generation (primary strategy).
        $prev_id = $chapter['previousChapterId'] ?? null;
        $next_id = $chapter['nextChapterId'] ?? null;

        $prev_num = null;
        if ( $prev_id && isset( $id_to_num[ $prev_id ] ) ) {
            $candidate = (int) $id_to_num[ $prev_id ];
            if ( $candidate > 0 && $candidate < $chapter_number ) {
                $prev_num = $candidate;
            }
        }
        if ( $prev_num === null && $prev_from_list !== null ) {
            $prev_num = (int) $prev_from_list;
        }
        if ( $prev_num === null && $prev_id && $chapter_number > 1 ) {
            // Last-resort fallback for APIs that only send IDs and no list match.
            $prev_num = $chapter_number - 1;
        }
        $chapter['prevChapterNumber'] = $prev_num;

        $next_num = null;
        if ( $next_id && isset( $id_to_num[ $next_id ] ) ) {
            $candidate = (int) $id_to_num[ $next_id ];
            if ( $candidate > $chapter_number ) {
                $next_num = $candidate;
            }
        }
        if ( $next_num === null && $next_from_list !== null ) {
            $next_num = (int) $next_from_list;
        }
        $chapter['nextChapterNumber'] = $next_num;

        return $chapter;
    }

    /**
     * Bust transient cache for a specific endpoint + params combo.
     */
    public static function bust( string $endpoint, array $params = [] ): void {
        delete_transient( self::make_cache_key( $endpoint, $params ) );
    }

    // ── Core HTTP ─────────────────────────────────────────────────────────────

    private static function request(
        string $method,
        string $endpoint,
        array  $params = [],
        array  $body   = []
    ): array|WP_Error {

        if ( ! CRC_Settings::is_configured() ) {
            return new WP_Error(
                'crc_not_configured',
                __( 'Comic Reader Companion is not configured. Please set the API Base URL and API Key in Comic Reader → Settings.', 'comic-reader' )
            );
        }

        // Build URL.
        $url = CRC_Settings::api_base_url() . '/api/public' . $endpoint;
        if ( ! empty( $params ) && strtoupper( $method ) === 'GET' ) {
            // Remove empty values so we don't send ?category=&tag=.
            $clean_params = array_filter(
                $params,
                static fn( $v ) => $v !== '' && $v !== null
            );
            if ( ! empty( $clean_params ) ) {
                $url .= '?' . http_build_query( $clean_params );
            }
        }

        $args = [
            'method'    => strtoupper( $method ),
            'timeout'   => self::MAX_TIMEOUT,
            'sslverify' => true,
            'headers'   => [
                // API key is ONLY sent server-side, never to frontend.
                'X-API-Key' => CRC_Settings::api_key(),
                'Accept'    => 'application/json',
            ],
        ];

        if ( ! empty( $body ) ) {
            $args['headers']['Content-Type'] = 'application/json';
            $args['body']                    = wp_json_encode( $body );
        }

        $response = wp_remote_request( $url, $args );

        if ( is_wp_error( $response ) ) {
            self::log( "HTTP error [{$method} {$endpoint}]: " . $response->get_error_message() );
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $raw_body    = wp_remote_retrieve_body( $response );
        $decoded     = json_decode( $raw_body, true );

        if ( $status_code < 200 || $status_code >= 300 ) {
            $api_message = is_array( $decoded ) ? ( $decoded['error'] ?? "HTTP {$status_code}" ) : "HTTP {$status_code}";
            self::log( "API error {$status_code} [{$method} {$endpoint}]: {$api_message}" );
            return new WP_Error(
                'crc_api_error',
                $api_message,
                [ 'status' => (int) $status_code ]
            );
        }

        if ( ! is_array( $decoded ) ) {
            self::log( "Invalid JSON from [{$method} {$endpoint}]" );
            return new WP_Error(
                'crc_json_error',
                __( 'Invalid response from Comic Storage API.', 'comic-reader' )
            );
        }

        return $decoded;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function make_cache_key( string $endpoint, array $params ): string {
        // Keep it under 172 chars (WP transient key limit is 172 chars for option_name).
        $hash = substr( md5( $endpoint . serialize( $params ) ), 0, 20 );
        return self::TRANSIENT_PREFIX . $hash;
    }

    private static function log( string $message ): void {
        if ( CRC_Settings::log_errors() ) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions
            error_log( '[CRC] ' . $message );
        }
    }
}
