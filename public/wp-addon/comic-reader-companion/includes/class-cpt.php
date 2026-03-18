<?php
/**
 * Custom Post Types and Taxonomies for Comic Reader.
 *
 * Registered types:
 *   crc_comic   — mirrors API comic (public UI, searchable)
 *   crc_chapter — internal chapter record (non-public, linked to comic)
 *
 * Registered taxonomies:
 *   crc_category — hierarchical categories (← API categories)
 *   crc_genre    — flat tags/genres      (← API tags)
 *   crc_series   — series grouping       (← API series)
 *   crc_author   — author names          (← API author_name)
 *
 * Meta key constants are used across class-cpt.php, class-sync.php,
 * and template files so there is a single source of truth.
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;

final class CRC_CPT {

    // ── Post type slugs ────────────────────────────────────────────────────────
    const POST_TYPE_COMIC   = 'crc_comic';
    const POST_TYPE_CHAPTER = 'crc_chapter';

    // ── Taxonomy slugs ─────────────────────────────────────────────────────────
    const TAX_CATEGORY = 'crc_category';
    const TAX_GENRE    = 'crc_genre';
    const TAX_SERIES   = 'crc_series';
    const TAX_AUTHOR   = 'crc_author';

    // ── Common meta keys (both CPTs) ───────────────────────────────────────────
    const META_EXTERNAL_ID = '_crc_external_id'; // API UUID
    const META_SYNCED_AT   = '_crc_synced_at';   // datetime of last sync
    const META_API_HASH    = '_crc_api_hash';    // MD5 for change detection

    // ── Comic-specific meta keys ───────────────────────────────────────────────
    const META_SLUG        = '_crc_slug';
    const META_COVER_URL   = '_crc_cover_url';
    const META_STATUS      = '_crc_status';       // ongoing|completed|hiatus
    const META_AUTHOR      = '_crc_author_name';

    // ── Chapter-specific meta keys ─────────────────────────────────────────────
    const META_CH_NUMBER      = '_crc_chapter_number';
    const META_CH_COMIC_WP_ID = '_crc_comic_post_id';    // WP post ID of parent
    const META_CH_COMIC_EXT   = '_crc_comic_ext_id';     // API UUID of parent comic
    const META_CH_IMAGES      = '_crc_images';            // JSON array of image objects
    const META_CH_PREV_EXT    = '_crc_prev_chapter_ext_id';
    const META_CH_NEXT_EXT    = '_crc_next_chapter_ext_id';
    const META_CH_PUBLISHED   = '_crc_published_at';

    // ── Init ───────────────────────────────────────────────────────────────────
    public static function init(): void {
        add_action( 'init', [ self::class, 'register_post_types' ], 5 );
        add_action( 'init', [ self::class, 'register_taxonomies' ], 5 );
        add_action( 'add_meta_boxes', [ self::class, 'add_meta_boxes' ] );
    }

    // ── CPT Registration ───────────────────────────────────────────────────────

    public static function register_post_types(): void {

        // ─── Comic ──────────────────────────────────────────────────────────
        register_post_type(
            self::POST_TYPE_COMIC,
            [
                'labels'             => self::make_labels(
                    __( 'Comic', 'comic-reader' ),
                    __( 'Comics', 'comic-reader' )
                ),
                'description'        => __( 'Comics synced from Comic Storage API.', 'comic-reader' ),
                'public'             => true,
                // Routes handled by CRC_Rewrite — disable WP's own query routing.
                'publicly_queryable' => false,
                'show_ui'            => true,
                'show_in_menu'       => true,
                'show_in_nav_menus'  => false,
                'show_in_rest'       => true,
                'query_var'          => false,
                'rewrite'            => false,
                'capability_type'    => 'post',
                'capabilities'       => [
                    'create_posts' => 'do_not_allow', // Block manual creation — sync only.
                ],
                'map_meta_cap'       => true,
                'has_archive'        => false,
                'hierarchical'       => false,
                'menu_position'      => 25,
                'menu_icon'          => 'dashicons-book-alt',
                'supports'           => [ 'title', 'editor', 'thumbnail', 'custom-fields' ],
                'taxonomies'         => [
                    self::TAX_CATEGORY,
                    self::TAX_GENRE,
                    self::TAX_SERIES,
                    self::TAX_AUTHOR,
                ],
            ]
        );

        // ─── Chapter ────────────────────────────────────────────────────────
        register_post_type(
            self::POST_TYPE_CHAPTER,
            [
                'labels'             => self::make_labels(
                    __( 'Chapter', 'comic-reader' ),
                    __( 'Chapters', 'comic-reader' )
                ),
                'description'        => __( 'Chapters synced from Comic Storage API.', 'comic-reader' ),
                'public'             => false,
                'publicly_queryable' => false,
                'show_ui'            => true,
                // Nest under the Comic CPT in admin sidebar.
                'show_in_menu'       => 'edit.php?post_type=' . self::POST_TYPE_COMIC,
                'show_in_rest'       => false,
                'query_var'          => false,
                'rewrite'            => false,
                'capability_type'    => 'post',
                'capabilities'       => [
                    'create_posts' => 'do_not_allow',
                ],
                'map_meta_cap'       => true,
                'has_archive'        => false,
                'hierarchical'       => false,
                'supports'           => [ 'title', 'custom-fields' ],
            ]
        );
    }

    // ── Taxonomy Registration ──────────────────────────────────────────────────

    public static function register_taxonomies(): void {

        // ─── Category (hierarchical) ────────────────────────────────────────
        register_taxonomy(
            self::TAX_CATEGORY,
            [ self::POST_TYPE_COMIC ],
            [
                'labels'            => [
                    'name'          => __( 'Comic Categories', 'comic-reader' ),
                    'singular_name' => __( 'Comic Category', 'comic-reader' ),
                    'search_items'  => __( 'Search Categories', 'comic-reader' ),
                    'all_items'     => __( 'All Categories', 'comic-reader' ),
                    'edit_item'     => __( 'Edit Category', 'comic-reader' ),
                    'add_new_item'  => __( 'Add New Category', 'comic-reader' ),
                ],
                'hierarchical'      => true,
                'public'            => true,
                'show_ui'           => true,
                'show_in_menu'      => true,
                'show_in_rest'      => true,
                'show_admin_column' => true,
                'query_var'         => false,
                'rewrite'           => false,
            ]
        );

        // ─── Genre / Tag (flat) ─────────────────────────────────────────────
        register_taxonomy(
            self::TAX_GENRE,
            [ self::POST_TYPE_COMIC ],
            [
                'labels'            => [
                    'name'          => __( 'Genres', 'comic-reader' ),
                    'singular_name' => __( 'Genre', 'comic-reader' ),
                    'search_items'  => __( 'Search Genres', 'comic-reader' ),
                    'all_items'     => __( 'All Genres', 'comic-reader' ),
                    'edit_item'     => __( 'Edit Genre', 'comic-reader' ),
                    'add_new_item'  => __( 'Add New Genre', 'comic-reader' ),
                ],
                'hierarchical'      => false,
                'public'            => true,
                'show_ui'           => true,
                'show_in_rest'      => true,
                'show_admin_column' => true,
                'query_var'         => false,
                'rewrite'           => false,
            ]
        );

        // ─── Series (flat) ──────────────────────────────────────────────────
        register_taxonomy(
            self::TAX_SERIES,
            [ self::POST_TYPE_COMIC ],
            [
                'labels'            => [
                    'name'          => __( 'Series', 'comic-reader' ),
                    'singular_name' => __( 'Series', 'comic-reader' ),
                    'search_items'  => __( 'Search Series', 'comic-reader' ),
                    'all_items'     => __( 'All Series', 'comic-reader' ),
                    'edit_item'     => __( 'Edit Series', 'comic-reader' ),
                    'add_new_item'  => __( 'Add New Series', 'comic-reader' ),
                ],
                'hierarchical'      => false,
                'public'            => true,
                'show_ui'           => true,
                'show_in_rest'      => true,
                'show_admin_column' => true,
                'query_var'         => false,
                'rewrite'           => false,
            ]
        );

        // ─── Author (flat) ──────────────────────────────────────────────────
        register_taxonomy(
            self::TAX_AUTHOR,
            [ self::POST_TYPE_COMIC ],
            [
                'labels'            => [
                    'name'          => __( 'Authors', 'comic-reader' ),
                    'singular_name' => __( 'Author', 'comic-reader' ),
                    'search_items'  => __( 'Search Authors', 'comic-reader' ),
                    'all_items'     => __( 'All Authors', 'comic-reader' ),
                    'edit_item'     => __( 'Edit Author', 'comic-reader' ),
                    'add_new_item'  => __( 'Add New Author', 'comic-reader' ),
                ],
                'hierarchical'      => false,
                'public'            => true,
                'show_ui'           => true,
                'show_in_rest'      => true,
                'show_admin_column' => true,
                'query_var'         => false,
                'rewrite'           => false,
            ]
        );
    }

    // ── Admin Meta Boxes ───────────────────────────────────────────────────────

    public static function add_meta_boxes(): void {
        add_meta_box(
            'crc_comic_sync_info',
            __( 'API Sync Info', 'comic-reader' ),
            [ self::class, 'render_comic_meta_box' ],
            self::POST_TYPE_COMIC,
            'side',
            'default'
        );
        add_meta_box(
            'crc_chapter_sync_info',
            __( 'API Sync Info', 'comic-reader' ),
            [ self::class, 'render_chapter_meta_box' ],
            self::POST_TYPE_CHAPTER,
            'side',
            'default'
        );
    }

    public static function render_comic_meta_box( WP_Post $post ): void {
        $ext_id    = get_post_meta( $post->ID, self::META_EXTERNAL_ID, true );
        $slug      = get_post_meta( $post->ID, self::META_SLUG, true );
        $status    = get_post_meta( $post->ID, self::META_STATUS, true );
        $author    = get_post_meta( $post->ID, self::META_AUTHOR, true );
        $synced_at = get_post_meta( $post->ID, self::META_SYNCED_AT, true );
        ?>
        <table class="form-table" style="font-size:12px;">
            <tr><th><?php esc_html_e( 'API ID', 'comic-reader' ); ?></th>
                <td><code><?php echo esc_html( $ext_id ?: '—' ); ?></code></td></tr>
            <tr><th><?php esc_html_e( 'Slug', 'comic-reader' ); ?></th>
                <td><code><?php echo esc_html( $slug ?: '—' ); ?></code></td></tr>
            <tr><th><?php esc_html_e( 'Status', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( $status ?: '—' ); ?></td></tr>
            <tr><th><?php esc_html_e( 'Author', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( $author ?: '—' ); ?></td></tr>
            <tr><th><?php esc_html_e( 'Last synced', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( $synced_at ?: '—' ); ?></td></tr>
        </table>
        <?php if ( $slug ) : ?>
            <p><a href="<?php echo esc_url( crc_comic_url( $slug ) ); ?>" target="_blank" class="button button-small">
                <?php esc_html_e( 'View on site', 'comic-reader' ); ?>
            </a></p>
        <?php endif; ?>
        <?php
    }

    public static function render_chapter_meta_box( WP_Post $post ): void {
        $ext_id    = get_post_meta( $post->ID, self::META_EXTERNAL_ID, true );
        $num       = get_post_meta( $post->ID, self::META_CH_NUMBER, true );
        $images    = json_decode( (string) get_post_meta( $post->ID, self::META_CH_IMAGES, true ), true );
        $synced_at = get_post_meta( $post->ID, self::META_SYNCED_AT, true );

        $comic_wp_id = (int) get_post_meta( $post->ID, self::META_CH_COMIC_WP_ID, true );
        $comic_post  = $comic_wp_id ? get_post( $comic_wp_id ) : null;
        $comic_slug  = $comic_post ? get_post_meta( $comic_wp_id, self::META_SLUG, true ) : '';
        ?>
        <table class="form-table" style="font-size:12px;">
            <tr><th><?php esc_html_e( 'API ID', 'comic-reader' ); ?></th>
                <td><code><?php echo esc_html( $ext_id ?: '—' ); ?></code></td></tr>
            <tr><th><?php esc_html_e( 'Chapter #', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( $num ?: '—' ); ?></td></tr>
            <tr><th><?php esc_html_e( 'Images', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( is_array( $images ) ? count( $images ) : '0' ); ?></td></tr>
            <tr><th><?php esc_html_e( 'Comic', 'comic-reader' ); ?></th>
                <td><?php echo $comic_post ? esc_html( $comic_post->post_title ) : '—'; ?></td></tr>
            <tr><th><?php esc_html_e( 'Last synced', 'comic-reader' ); ?></th>
                <td><?php echo esc_html( $synced_at ?: '—' ); ?></td></tr>
        </table>
        <?php if ( $comic_slug && $num ) : ?>
            <p><a href="<?php echo esc_url( crc_chapter_url( $comic_slug, (int) $num ) ); ?>" target="_blank" class="button button-small">
                <?php esc_html_e( 'View on site', 'comic-reader' ); ?>
            </a></p>
        <?php endif; ?>
        <?php
    }

    // ── Lookup Helpers ─────────────────────────────────────────────────────────

    /**
     * Find a WP post ID by external API UUID.
     *
     * @param string $ext_id    API UUID.
     * @param string $post_type CPT slug.
     * @return int|null         WP post ID, or null if not found.
     */
    public static function get_post_id_by_ext_id( string $ext_id, string $post_type ): ?int {
        if ( empty( $ext_id ) ) return null;

        $posts = get_posts( [
            'post_type'      => $post_type,
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'no_found_rows'  => true,
            'post_status'    => [ 'publish', 'draft' ],
            // phpcs:ignore WordPress.DB.SlowDBQuery
            'meta_query'     => [ [
                'key'   => self::META_EXTERNAL_ID,
                'value' => $ext_id,
            ] ],
        ] );

        return ! empty( $posts ) ? (int) $posts[0] : null;
    }

    /**
     * Find a WP term ID by slug in a taxonomy.
     *
     * @param string $slug     Slug from API.
     * @param string $taxonomy Taxonomy slug.
     * @return int|null        WP term ID, or null.
     */
    public static function get_term_id_by_slug( string $slug, string $taxonomy ): ?int {
        if ( empty( $slug ) ) return null;
        $term = get_term_by( 'slug', $slug, $taxonomy );
        return ( $term instanceof WP_Term ) ? $term->term_id : null;
    }

    // ── Stat Helpers ───────────────────────────────────────────────────────────

    public static function comic_count(): int {
        $counts = wp_count_posts( self::POST_TYPE_COMIC );
        return (int) ( $counts->publish ?? 0 );
    }

    public static function chapter_count(): int {
        $counts = wp_count_posts( self::POST_TYPE_CHAPTER );
        return (int) ( $counts->publish ?? 0 );
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private static function make_labels( string $singular, string $plural ): array {
        return [
            'name'                  => $plural,
            'singular_name'         => $singular,
            'add_new'               => __( 'Add New', 'comic-reader' ),
            'add_new_item'          => sprintf( __( 'Add New %s', 'comic-reader' ), $singular ),
            'edit_item'             => sprintf( __( 'Edit %s', 'comic-reader' ), $singular ),
            'new_item'              => sprintf( __( 'New %s', 'comic-reader' ), $singular ),
            'view_item'             => sprintf( __( 'View %s', 'comic-reader' ), $singular ),
            'search_items'          => sprintf( __( 'Search %s', 'comic-reader' ), $plural ),
            'not_found'             => sprintf( __( 'No %s found.', 'comic-reader' ), strtolower( $plural ) ),
            'not_found_in_trash'    => sprintf( __( 'No %s in Trash.', 'comic-reader' ), strtolower( $plural ) ),
            'all_items'             => sprintf( __( 'All %s', 'comic-reader' ), $plural ),
            'menu_name'             => $plural,
            'name_admin_bar'        => $singular,
        ];
    }
}
