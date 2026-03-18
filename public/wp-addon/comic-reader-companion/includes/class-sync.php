<?php
/**
 * API → WordPress sync manager.
 *
 * Syncs comics and chapters from the Comic Storage API into
 * WordPress CPTs (crc_comic, crc_chapter) and taxonomies.
 *
 * MAPPING STRATEGY
 * ─────────────────
 * • API UUID  →  stored in `_crc_external_id` post meta (indexed)
 * • Lookup    →  get_posts() with meta_query (uses wp_postmeta index on meta_key+meta_value)
 * • Change detection via MD5 hash of key API fields (`_crc_api_hash`)
 *   → skip unchanged records to minimise DB writes
 *
 * IMPORTANT: Chapters are only synced during full_sync() to avoid
 * excessive API calls during frequent incremental runs.
 * Incremental sync covers the first 100 most-recently-updated comics
 * (API returns comics ORDER BY updated_at DESC).
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_Sync {

    // ── Options ────────────────────────────────────────────────────────────────
    const OPT_LAST_INC  = 'crc_last_incremental_sync';
    const OPT_LAST_FULL = 'crc_last_full_sync';
    const OPT_STATS     = 'crc_last_sync_stats';
    const OPT_ERRORS    = 'crc_sync_errors';

    // ── Runtime counters (reset each run) ──────────────────────────────────────
    private static int   $cnt_created  = 0;
    private static int   $cnt_updated  = 0;
    private static int   $cnt_skipped  = 0;
    private static int   $cnt_errors   = 0;
    private static array $run_errors   = [];

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Incremental sync.
     *
     * Fetches the 2 most-recently-updated pages of comics (≤ 100 items)
     * and syncs any that have changed since last sync.
     * Runs every 10 minutes via WP-Cron.
     *
     * @return array Stats array.
     */
    public static function incremental_sync(): array {
        self::reset();
        $t0 = microtime( true );

        // Sync taxonomy terms first (lightweight).
        self::sync_taxonomy_terms();

        // Fetch most recently updated comics (API default sort: updated_at DESC).
        for ( $page = 1; $page <= 2; $page++ ) {
            $response = CRC_API_Client::get_uncached( '/comics', [
                'page'     => $page,
                'pageSize' => 50,
            ] );
            if ( is_wp_error( $response ) ) {
                self::add_error( "incremental page {$page}", $response->get_error_message() );
                break;
            }
            $comics = $response['comics'] ?? [];
            foreach ( $comics as $comic ) {
                // No chapter sync during incremental — too expensive.
                self::upsert_comic( $comic, false );
            }
            if ( count( $comics ) < 50 ) {
                break; // Reached last page.
            }
        }

        update_option( self::OPT_LAST_INC, time() );
        return self::build_stats( 'incremental', microtime( true ) - $t0 );
    }

    /**
     * Full sync.
     *
     * Pages through ALL comics and syncs every chapter.
     * Runs once daily via WP-Cron. May take several minutes on large datasets.
     *
     * @return array Stats array.
     */
    public static function full_sync(): array {
        self::reset();
        $t0 = microtime( true );

        // Safety: avoid PHP timeout on large datasets.
        if ( function_exists( 'set_time_limit' ) ) {
            set_time_limit( 600 );
        }

        self::sync_taxonomy_terms();

        $page      = 1;
        $page_size = 50; // Max allowed by API.

        do {
            $response = CRC_API_Client::get_uncached( '/comics', [
                'page'     => $page,
                'pageSize' => $page_size,
            ] );
            if ( is_wp_error( $response ) ) {
                self::add_error( "full_sync page {$page}", $response->get_error_message() );
                break;
            }
            $comics      = $response['comics'] ?? [];
            $total       = (int) ( $response['total'] ?? 0 );
            $total_pages = $total > 0 ? (int) ceil( $total / $page_size ) : 0;

            foreach ( $comics as $comic ) {
                self::upsert_comic( $comic, true ); // true = also sync chapters
            }
            $page++;
        } while ( $page <= $total_pages );

        update_option( self::OPT_LAST_FULL, time() );
        return self::build_stats( 'full', microtime( true ) - $t0 );
    }

    /**
     * Sync taxonomy terms only (categories → crc_category, tags → crc_genre).
     * Safe to call independently.
     */
    public static function sync_taxonomy_terms(): void {
        // Categories.
        $cats = CRC_API_Client::post( '/wp/sync/categories' );
        if ( ! is_wp_error( $cats ) ) {
            foreach ( $cats['mappings'] ?? [] as $item ) {
                self::ensure_term(
                    (string) ( $item['name'] ?? '' ),
                    (string) ( $item['slug'] ?? '' ),
                    CRC_CPT::TAX_CATEGORY,
                    (string) ( $item['id'] ?? '' )
                );
            }
        }

        // Tags → Genres.
        $tags = CRC_API_Client::post( '/wp/sync/tags' );
        if ( ! is_wp_error( $tags ) ) {
            foreach ( $tags['mappings'] ?? [] as $item ) {
                self::ensure_term(
                    (string) ( $item['name'] ?? '' ),
                    (string) ( $item['slug'] ?? '' ),
                    CRC_CPT::TAX_GENRE,
                    (string) ( $item['id'] ?? '' )
                );
            }
        }
    }

    // ── Comic upsert ───────────────────────────────────────────────────────────

    /**
     * Create or update a single crc_comic WP post from API data.
     *
     * @param array $data          Comic data from /api/public/comics.
     * @param bool  $sync_chapters Also paginate and sync this comic's chapters.
     * @return int WP post ID, or 0 on failure.
     */
    private static function upsert_comic( array $data, bool $sync_chapters ): int {
        $ext_id = (string) ( $data['id'] ?? '' );
        $slug   = (string) ( $data['slug'] ?? '' );

        if ( empty( $ext_id ) || empty( $slug ) ) {
            self::$cnt_errors++;
            return 0;
        }

        // Change detection: hash the fields that matter to end-users.
        $hash = md5( serialize( [
            'title'           => $data['title'] ?? '',
            'description'     => $data['description'] ?? '',
            'author_name'     => $data['author_name'] ?? '',
            'status'          => $data['status'] ?? '',
            'cover_image_url' => $data['cover_image_url'] ?? '',
            'updated_at'      => $data['updated_at'] ?? '',
        ] ) );

        $wp_id = CRC_CPT::get_post_id_by_ext_id( $ext_id, CRC_CPT::POST_TYPE_COMIC );

        if ( $wp_id ) {
            $stored_hash = (string) get_post_meta( $wp_id, CRC_CPT::META_API_HASH, true );
            if ( $stored_hash === $hash && ! $sync_chapters ) {
                // Nothing changed in core fields, but keep term mappings in sync
                // (e.g., when new taxonomy logic is added later).
                self::assign_comic_terms( $wp_id, $data );
                self::$cnt_skipped++;
                return $wp_id;
            }
            $wp_id = self::write_comic( $wp_id, $data, $hash );
        } else {
            $wp_id = self::write_comic( 0, $data, $hash );
        }

        if ( ! $wp_id ) {
            return 0;
        }

        // Assign taxonomy terms.
        self::assign_comic_terms( $wp_id, $data );

        if ( $sync_chapters ) {
            self::sync_chapters_for_comic( $slug, $wp_id, $ext_id );
        }

        return $wp_id;
    }

    /**
     * Write comic fields to WP.
     *
     * @param int   $wp_id Existing post ID (0 to create new).
     * @param array $data  API comic data.
     * @param string $hash Change-detection hash.
     * @return int Post ID, 0 on failure.
     */
    private static function write_comic( int $wp_id, array $data, string $hash ): int {
        $post_data = [
            'post_type'    => CRC_CPT::POST_TYPE_COMIC,
            'post_title'   => wp_strip_all_tags( (string) ( $data['title'] ?? '' ) ),
            'post_content' => wp_kses_post( (string) ( $data['description'] ?? '' ) ),
            'post_status'  => 'publish',
            'post_name'    => sanitize_title( (string) ( $data['slug'] ?? '' ) ),
        ];

        if ( $data['created_at'] ?? '' ) {
            $post_data['post_date']     = self::to_wp_date( $data['created_at'] );
            $post_data['post_date_gmt'] = self::to_wp_date_gmt( $data['created_at'] );
        }
        if ( $data['updated_at'] ?? '' ) {
            $post_data['post_modified']     = self::to_wp_date( $data['updated_at'] );
            $post_data['post_modified_gmt'] = self::to_wp_date_gmt( $data['updated_at'] );
        }

        if ( $wp_id ) {
            $post_data['ID'] = $wp_id;
            $result          = wp_update_post( $post_data, true );
        } else {
            $result = wp_insert_post( $post_data, true );
        }

        if ( is_wp_error( $result ) ) {
            self::add_error( 'write_comic ' . ( $data['slug'] ?? '' ), $result->get_error_message() );
            return 0;
        }

        $wp_id = (int) $result;

        // Write meta — sanitize every value before storing.
        $meta = [
            CRC_CPT::META_EXTERNAL_ID => sanitize_text_field( $data['id'] ?? '' ),
            CRC_CPT::META_SLUG        => sanitize_text_field( $data['slug'] ?? '' ),
            CRC_CPT::META_COVER_URL   => esc_url_raw( (string) ( $data['cover_image_url'] ?? '' ) ),
            CRC_CPT::META_STATUS      => sanitize_text_field( $data['status'] ?? '' ),
            CRC_CPT::META_AUTHOR      => sanitize_text_field( $data['author_name'] ?? '' ),
            CRC_CPT::META_API_HASH    => $hash,
            CRC_CPT::META_SYNCED_AT   => current_time( 'mysql' ),
        ];
        foreach ( $meta as $key => $value ) {
            update_post_meta( $wp_id, $key, $value );
        }

        if ( $post_data['ID'] ?? 0 ) {
            self::$cnt_updated++;
        } else {
            self::$cnt_created++;
        }

        return $wp_id;
    }

    // ── Taxonomy assignment ────────────────────────────────────────────────────

    private static function assign_comic_terms( int $wp_id, array $data ): void {
        // Categories → crc_category
        $cat_term_ids = [];
        foreach ( (array) ( $data['categories'] ?? [] ) as $cat ) {
            $slug = (string) ( $cat['slug'] ?? '' );
            $tid  = CRC_CPT::get_term_id_by_slug( $slug, CRC_CPT::TAX_CATEGORY );
            if ( ! $tid ) {
                $tid = self::ensure_term(
                    (string) ( $cat['name'] ?? $slug ),
                    $slug,
                    CRC_CPT::TAX_CATEGORY,
                    (string) ( $cat['id'] ?? '' )
                );
            }
            if ( $tid ) {
                $cat_term_ids[] = $tid;
            }
        }
        if ( ! empty( $cat_term_ids ) ) {
            wp_set_post_terms( $wp_id, $cat_term_ids, CRC_CPT::TAX_CATEGORY );
        }

        // Tags → crc_genre
        $genre_term_ids = [];
        foreach ( (array) ( $data['tags'] ?? [] ) as $tag ) {
            $slug = (string) ( $tag['slug'] ?? '' );
            $tid  = CRC_CPT::get_term_id_by_slug( $slug, CRC_CPT::TAX_GENRE );
            if ( ! $tid ) {
                $tid = self::ensure_term(
                    (string) ( $tag['name'] ?? $slug ),
                    $slug,
                    CRC_CPT::TAX_GENRE,
                    (string) ( $tag['id'] ?? '' )
                );
            }
            if ( $tid ) {
                $genre_term_ids[] = $tid;
            }
        }
        if ( ! empty( $genre_term_ids ) ) {
            wp_set_post_terms( $wp_id, $genre_term_ids, CRC_CPT::TAX_GENRE );
        }

        // Series → crc_series
        $series = $data['series'] ?? null;
        if ( ! $series && ! empty( $data['series_id'] ) ) {
            // Comics list endpoint embeds series as flat fields.
            $series = [
                'slug'  => (string) ( $data['series_slug'] ?? '' ),
                'title' => (string) ( $data['series_title'] ?? '' ),
            ];
        }
        if ( $series && ! empty( $series['slug'] ) ) {
            $series_slug = sanitize_title( $series['slug'] );
            $tid         = CRC_CPT::get_term_id_by_slug( $series_slug, CRC_CPT::TAX_SERIES );
            if ( ! $tid ) {
                $tid = self::ensure_term(
                    (string) ( $series['title'] ?? $series_slug ),
                    $series_slug,
                    CRC_CPT::TAX_SERIES,
                    ''
                );
            }
            if ( $tid ) {
                wp_set_post_terms( $wp_id, [ $tid ], CRC_CPT::TAX_SERIES );
            }
        }

        // Author name → crc_author
        $author_name = sanitize_text_field( (string) ( $data['author_name'] ?? '' ) );
        if ( $author_name !== '' ) {
            $author_slug = sanitize_title( $author_name );
            if ( $author_slug === '' ) {
                $author_slug = 'author-' . substr( md5( $author_name ), 0, 12 );
            }
            $tid = CRC_CPT::get_term_id_by_slug( $author_slug, CRC_CPT::TAX_AUTHOR );
            if ( ! $tid ) {
                $tid = self::ensure_term(
                    $author_name,
                    $author_slug,
                    CRC_CPT::TAX_AUTHOR,
                    ''
                );
            }
            if ( $tid ) {
                wp_set_post_terms( $wp_id, [ $tid ], CRC_CPT::TAX_AUTHOR );
            }
        } else {
            // Clear stale author term when API has no author_name.
            wp_set_post_terms( $wp_id, [], CRC_CPT::TAX_AUTHOR );
        }
    }

    // ── Chapter sync ───────────────────────────────────────────────────────────

    /**
     * Sync all chapters for a single comic.
     * Paginates /comics/{slug}/chapters (max 100/page).
     */
    private static function sync_chapters_for_comic(
        string $comic_slug,
        int    $comic_wp_id,
        string $comic_ext_id
    ): void {
        $page      = 1;
        $page_size = 100;

        do {
            $resp = CRC_API_Client::get_uncached(
                '/comics/' . rawurlencode( $comic_slug ) . '/chapters',
                [ 'page' => $page, 'pageSize' => $page_size ]
            );

            if ( is_wp_error( $resp ) ) {
                self::add_error( "chapters for {$comic_slug} page {$page}", $resp->get_error_message() );
                break;
            }

            $chapter_list = $resp['chapters'] ?? [];
            $total        = (int) ( $resp['total'] ?? 0 );
            $total_pages  = $total > 0 ? (int) ceil( $total / $page_size ) : 0;

            foreach ( $chapter_list as $ch ) {
                $ch_id = (string) ( $ch['id'] ?? '' );
                if ( empty( $ch_id ) ) continue;

                // Fetch full chapter detail (images + prev/next IDs) as fresh data.
                $detail = CRC_API_Client::get_uncached( '/chapters/' . rawurlencode( $ch_id ) );
                if ( is_wp_error( $detail ) ) {
                    self::add_error( "chapter detail {$ch_id}", $detail->get_error_message() );
                    continue;
                }

                self::upsert_chapter( $detail, $comic_wp_id, $comic_ext_id );
            }

            $page++;
        } while ( $page <= $total_pages );
    }

    /**
     * Create or update a single crc_chapter WP post.
     *
     * @param array  $data         Chapter data from /api/public/chapters/{id}.
     * @param int    $comic_wp_id  WP post ID of the parent comic.
     * @param string $comic_ext_id API UUID of the parent comic.
     * @return int WP post ID, 0 on failure.
     */
    private static function upsert_chapter( array $data, int $comic_wp_id, string $comic_ext_id ): int {
        $ext_id  = (string) ( $data['id'] ?? '' );
        $ch_num  = (int) ( $data['number'] ?? 0 );

        if ( empty( $ext_id ) || $ch_num <= 0 ) {
            self::$cnt_errors++;
            return 0;
        }

        $images    = $data['images'] ?? [];
        $hash      = md5( serialize( [
            'number'     => $ch_num,
            'title'      => $data['title'] ?? '',
            'updated_at' => $data['updated_at'] ?? '',
            'img_count'  => count( $images ),
        ] ) );

        $wp_id = CRC_CPT::get_post_id_by_ext_id( $ext_id, CRC_CPT::POST_TYPE_CHAPTER );

        if ( $wp_id ) {
            $stored = (string) get_post_meta( $wp_id, CRC_CPT::META_API_HASH, true );
            if ( $stored === $hash ) {
                self::$cnt_skipped++;
                return $wp_id;
            }
        }

        // Build a human-readable title.
        $comic_title = (string) ( $data['comic']['title'] ?? $data['comic_title'] ?? '' );
        $ch_title    = (string) ( $data['title'] ?? '' );
        $title       = $comic_title
            ? sprintf( '%s — Ch.%d%s', $comic_title, $ch_num, $ch_title ? " {$ch_title}" : '' )
            : sprintf( 'Chapter %d%s', $ch_num, $ch_title ? ": {$ch_title}" : '' );

        $post_data = [
            'post_type'   => CRC_CPT::POST_TYPE_CHAPTER,
            'post_title'  => wp_strip_all_tags( $title ),
            'post_status' => 'publish',
            'post_parent' => $comic_wp_id,
        ];

        $pub_date = $data['published_at'] ?? $data['created_at'] ?? '';
        if ( $pub_date ) {
            $post_data['post_date']     = self::to_wp_date( $pub_date );
            $post_data['post_date_gmt'] = self::to_wp_date_gmt( $pub_date );
        }

        if ( $wp_id ) {
            $post_data['ID'] = $wp_id;
            $result          = wp_update_post( $post_data, true );
        } else {
            $result = wp_insert_post( $post_data, true );
        }

        if ( is_wp_error( $result ) ) {
            self::add_error( 'write_chapter ' . $ext_id, $result->get_error_message() );
            return 0;
        }

        $wp_id = (int) $result;

        // Write meta — sanitize images as JSON.
        $meta = [
            CRC_CPT::META_EXTERNAL_ID  => sanitize_text_field( $ext_id ),
            CRC_CPT::META_CH_NUMBER    => $ch_num,
            CRC_CPT::META_CH_COMIC_WP_ID => $comic_wp_id,
            CRC_CPT::META_CH_COMIC_EXT => sanitize_text_field( $comic_ext_id ),
            CRC_CPT::META_CH_IMAGES    => wp_json_encode( $images ),
            CRC_CPT::META_CH_PREV_EXT  => sanitize_text_field( (string) ( $data['previousChapterId'] ?? '' ) ),
            CRC_CPT::META_CH_NEXT_EXT  => sanitize_text_field( (string) ( $data['nextChapterId'] ?? '' ) ),
            CRC_CPT::META_CH_PUBLISHED => sanitize_text_field( $pub_date ),
            CRC_CPT::META_API_HASH     => $hash,
            CRC_CPT::META_SYNCED_AT    => current_time( 'mysql' ),
        ];
        foreach ( $meta as $key => $value ) {
            update_post_meta( $wp_id, $key, $value );
        }

        if ( $post_data['ID'] ?? 0 ) {
            self::$cnt_updated++;
        } else {
            self::$cnt_created++;
        }

        return $wp_id;
    }

    // ── Taxonomy helper ────────────────────────────────────────────────────────

    /**
     * Ensure a term exists in a taxonomy, creating or updating it.
     *
     * @param string $name     Term display name.
     * @param string $slug     Term slug.
     * @param string $taxonomy Taxonomy slug.
     * @param string $ext_id   External API ID (stored as term meta).
     * @return int|null        WP term ID, or null on failure.
     */
    private static function ensure_term(
        string $name,
        string $slug,
        string $taxonomy,
        string $ext_id
    ): ?int {
        if ( empty( $name ) || empty( $slug ) ) return null;

        $slug = sanitize_title( $slug );
        $name = sanitize_text_field( $name );

        $existing = get_term_by( 'slug', $slug, $taxonomy );

        if ( $existing instanceof WP_Term ) {
            // Sync name if it drifted.
            if ( $existing->name !== $name ) {
                wp_update_term( $existing->term_id, $taxonomy, [ 'name' => $name ] );
            }
            return $existing->term_id;
        }

        $result = wp_insert_term( $name, $taxonomy, [ 'slug' => $slug ] );

        if ( is_wp_error( $result ) ) {
            // Term exists with a different slug — grab the ID from error data.
            if ( $result->get_error_code() === 'term_exists' ) {
                $data = $result->get_error_data();
                return isset( $data['term_id'] ) ? (int) $data['term_id'] : null;
            }
            self::add_error( "ensure_term {$taxonomy}/{$slug}", $result->get_error_message() );
            return null;
        }

        $term_id = (int) $result['term_id'];

        if ( $ext_id ) {
            update_term_meta( $term_id, '_crc_external_id', sanitize_text_field( $ext_id ) );
        }

        return $term_id;
    }

    // ── Internal utilities ─────────────────────────────────────────────────────

    /** Convert ISO 8601 date from API to WordPress local datetime string. */
    private static function to_wp_date( string $iso ): string {
        if ( empty( $iso ) ) return current_time( 'mysql' );
        $ts = strtotime( $iso );
        return $ts ? get_date_from_gmt( gmdate( 'Y-m-d H:i:s', $ts ) ) : current_time( 'mysql' );
    }

    /** Convert ISO 8601 date from API to WordPress GMT datetime string. */
    private static function to_wp_date_gmt( string $iso ): string {
        if ( empty( $iso ) ) return current_time( 'mysql', true );
        $ts = strtotime( $iso );
        return $ts ? gmdate( 'Y-m-d H:i:s', $ts ) : current_time( 'mysql', true );
    }

    private static function reset(): void {
        self::$cnt_created = 0;
        self::$cnt_updated = 0;
        self::$cnt_skipped = 0;
        self::$cnt_errors  = 0;
        self::$run_errors  = [];
    }

    private static function add_error( string $context, string $message ): void {
        self::$cnt_errors++;
        self::$run_errors[] = [
            'context' => $context,
            'message' => $message,
            'time'    => time(),
        ];
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions
        error_log( "[CRC Sync] {$context}: {$message}" );
    }

    private static function build_stats( string $type, float $elapsed ): array {
        $stats = [
            'type'    => $type,
            'created' => self::$cnt_created,
            'updated' => self::$cnt_updated,
            'skipped' => self::$cnt_skipped,
            'errors'  => self::$cnt_errors,
            'elapsed' => round( $elapsed, 2 ),
            'time'    => time(),
        ];
        update_option( self::OPT_STATS, $stats );

        if ( ! empty( self::$run_errors ) ) {
            // Keep only the latest 30 errors.
            $stored = (array) ( get_option( self::OPT_ERRORS ) ?: [] );
            $merged = array_merge( $stored, self::$run_errors );
            update_option( self::OPT_ERRORS, array_slice( $merged, -30 ) );
        }

        return $stats;
    }

    // ── Public getters (for admin UI) ──────────────────────────────────────────

    public static function last_incremental(): ?int {
        $v = get_option( self::OPT_LAST_INC );
        return $v ? (int) $v : null;
    }

    public static function last_full(): ?int {
        $v = get_option( self::OPT_LAST_FULL );
        return $v ? (int) $v : null;
    }

    public static function last_stats(): array {
        return (array) ( get_option( self::OPT_STATS ) ?: [] );
    }

    public static function recent_errors(): array {
        return (array) ( get_option( self::OPT_ERRORS ) ?: [] );
    }

    public static function clear_errors(): void {
        delete_option( self::OPT_ERRORS );
    }
}
