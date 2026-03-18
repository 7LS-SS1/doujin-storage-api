<?php
/**
 * Homepage template — WordPress template hierarchy uses this file when
 * a static "front page" is set in Settings → Reading, or as default homepage.
 *
 * Data is queried server-side; hero state is passed to JS via data-* JSON.
 *
 * @package ComicReader
 */

defined( 'ABSPATH' ) || exit;

/* ─────────────────────────────────────────────────────────────────
 * DATA HELPERS
 * ─────────────────────────────────────────────────────────────── */

/**
 * Query comics from the crc_comic CPT.
 *
 * @param  array $extra Extra WP_Query args (orderby, meta_query, etc.).
 * @return array<int, array{id:int, title:string, url:string, cover:string, status:string, author:string, chapters:int}>
 */
function crc_home_query( array $extra = [] ): array {
	$q = new WP_Query(
		array_merge(
			[
				'post_type'      => 'crc_comic',
				'post_status'    => 'publish',
				'posts_per_page' => 20,
				'no_found_rows'  => true,
			],
			$extra
		)
	);

	$out = [];
	while ( $q->have_posts() ) {
		$q->the_post();
		$id   = get_the_ID();
		$slug = (string) get_post_meta( $id, '_crc_slug', true );
		if ( $slug === '' ) {
			$slug = get_post_field( 'post_name', $id );
		}

		$comic_url = get_the_permalink();
		if ( $slug !== '' && function_exists( 'crc_comic_url' ) ) {
			$comic_url = crc_comic_url( $slug );
		}

		$out[] = [
			'id'       => $id,
			'title'    => get_the_title(),
			'url'      => $comic_url,
			'cover'    => (string) get_post_meta( $id, '_crc_cover_url',  true ),
			'status'   => (string) get_post_meta( $id, '_crc_status',      true ),
			'author'   => (string) get_post_meta( $id, '_crc_author_name', true ),
			'chapters' => 0, // filled by batch query below
		];
	}
	wp_reset_postdata();
	return $out;
}

/**
 * Batch-fetch chapter counts for multiple comic IDs (single SQL query).
 *
 * @param  int[] $ids WP post IDs of comics.
 * @return array<int, int>  Map of comic_id => chapter_count.
 */
function crc_home_chapter_counts( array $ids ): array {
	if ( empty( $ids ) ) {
		return [];
	}

	global $wpdb;

	// All values are cast to int — safe to interpolate.
	$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
	// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	$prepared = $wpdb->prepare(
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		"SELECT pm.meta_value AS cid, COUNT(p.ID) AS cnt
		 FROM {$wpdb->posts} p
		 INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
		 WHERE p.post_type = 'crc_chapter'
		   AND p.post_status = 'publish'
		   AND pm.meta_key = '_crc_comic_post_id'
		   AND pm.meta_value IN ($placeholders)
		 GROUP BY pm.meta_value",
		...$ids
	);
	$rows = $wpdb->get_results( $prepared, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

	$map = [];
	foreach ( (array) $rows as $row ) {
		$map[ (int) $row['cid'] ] = (int) $row['cnt'];
	}
	return $map;
}

/**
 * Render one horizontal-scroll row with a title, badge, and "see all" link.
 *
 * @param string      $title   Row heading (may contain emoji).
 * @param array       $comics  List of comic data arrays.
 * @param string|null $badge   Card badge label (e.g. "HOT").
 * @param string      $see_all "See all" URL.
 */
function crc_home_render_row( string $title, array $comics, ?string $badge, string $see_all ): void {
	if ( empty( $comics ) ) {
		return;
	}
	?>
	<section class="crc-home-row">
		<div class="crc-home-row__header">
			<h2 class="crc-home-row__title"><?php echo esc_html( $title ); ?></h2>
			<a class="crc-home-row__see-all" href="<?php echo esc_url( $see_all ); ?>">
				ดูทั้งหมด <span aria-hidden="true">→</span>
			</a>
		</div>

		<div class="crc-home-row__wrap" data-crc-row>
			<button class="crc-row-arrow crc-row-arrow--prev" aria-label="เลื่อนซ้าย">&#8249;</button>
			<div class="crc-home-row__scroll" role="list">
				<?php foreach ( $comics as $c ) : ?>
					<?php crc_home_render_card( $c, $badge ); ?>
				<?php endforeach; ?>
			</div>
			<button class="crc-row-arrow crc-row-arrow--next" aria-label="เลื่อนขวา">&#8250;</button>
		</div>
	</section>
	<?php
}

/**
 * Render a single comic card inside a row.
 *
 * @param array       $c     Comic data array (id, title, url, cover, status, author, chapters).
 * @param string|null $badge Badge label.
 */
function crc_home_render_card( array $c, ?string $badge ): void {
	static $status_labels = [
		'ongoing'   => 'กำลังดำเนิน',
		'completed' => 'จบแล้ว',
		'hiatus'    => 'หยุดชั่วคราว',
	];
	static $status_badge_class = [
		'ongoing'   => 'crc-badge--ongoing',
		'completed' => 'crc-badge--completed',
		'hiatus'    => 'crc-badge--hiatus',
	];
	?>
	<div class="crc-home-card" role="listitem">
		<a class="crc-home-card__link" href="<?php echo esc_url( $c['url'] ); ?>">

			<div class="crc-home-card__cover">
				<?php if ( $c['cover'] ) : ?>
					<img class="crc-home-card__img"
					     src="<?php echo esc_url( $c['cover'] ); ?>"
					     alt="<?php echo esc_attr( $c['title'] ); ?>"
					     loading="lazy">
				<?php else : ?>
					<div class="crc-home-card__no-cover">📚</div>
				<?php endif; ?>

				<?php if ( $badge ) : ?>
					<span class="crc-home-card__badge"><?php echo esc_html( $badge ); ?></span>
				<?php endif; ?>

				<div class="crc-home-card__hover-overlay" aria-hidden="true">อ่านเลย</div>
			</div>

			<div class="crc-home-card__body">
				<p class="crc-home-card__title"><?php echo esc_html( $c['title'] ); ?></p>

				<?php if ( $c['author'] ) : ?>
					<p class="crc-home-card__author"><?php echo esc_html( $c['author'] ); ?></p>
				<?php endif; ?>

				<div class="crc-home-card__foot">
					<?php if ( $c['status'] ) : ?>
						<span class="crc-badge <?php echo esc_attr( $status_badge_class[ $c['status'] ] ?? 'crc-badge--ongoing' ); ?>">
							<?php echo esc_html( $status_labels[ $c['status'] ] ?? $c['status'] ); ?>
						</span>
					<?php endif; ?>
					<?php if ( $c['chapters'] > 0 ) : ?>
						<span class="crc-home-card__chapters"><?php echo esc_html( (string) $c['chapters'] ); ?> ตอน</span>
					<?php endif; ?>
				</div>
			</div>

		</a>
	</div>
	<?php
}

/* ─────────────────────────────────────────────────────────────────
 * FETCH DATA
 * ─────────────────────────────────────────────────────────────── */

$crc_new = crc_home_query( [ 'orderby' => 'date', 'order' => 'DESC' ] );

$crc_trending = crc_home_query( [ 'orderby' => 'modified', 'order' => 'DESC' ] );

$crc_ongoing = crc_home_query( [
	'orderby'    => 'modified',
	'order'      => 'DESC',
	'meta_query' => [ [ 'key' => '_crc_status', 'value' => 'ongoing', 'compare' => '=' ] ],
] );

$crc_completed = crc_home_query( [
	'orderby'    => 'modified',
	'order'      => 'DESC',
	'meta_query' => [ [ 'key' => '_crc_status', 'value' => 'completed', 'compare' => '=' ] ],
] );

// Batch chapter counts — one SQL query for all displayed comics.
$_all_ids = array_unique(
	array_merge(
		array_column( $crc_new,       'id' ),
		array_column( $crc_trending,  'id' ),
		array_column( $crc_ongoing,   'id' ),
		array_column( $crc_completed, 'id' )
	)
);
$_ch_counts = crc_home_chapter_counts( $_all_ids );

foreach ( [ &$crc_new, &$crc_trending, &$crc_ongoing, &$crc_completed ] as &$_list ) {
	foreach ( $_list as &$_c ) {
		$_c['chapters'] = $_ch_counts[ $_c['id'] ] ?? 0;
	}
}
unset( $_list, $_c );

// Hero: top 5 of each tab.
$crc_new_featured      = array_slice( $crc_new,      0, 5 );
$crc_trending_featured = array_slice( $crc_trending,  0, 5 );

$crc_has_content = ! empty( $crc_new ) || ! empty( $crc_trending )
                || ! empty( $crc_ongoing ) || ! empty( $crc_completed );

$crc_archive_url = function_exists( 'crc_archive_url' ) ? crc_archive_url() : home_url( '/' );

// First hero comic (PHP pre-render for above-the-fold).
$crc_first = $crc_new_featured[0] ?? null;

get_header();
?>

<main id="crc-home-main" class="crc-home-main">

	<?php /* ═══════════════════════════════════════════════
	       HERO SECTION
	       ═══════════════════════════════════════════════ */
	if ( ! empty( $crc_new_featured ) || ! empty( $crc_trending_featured ) ) : ?>

	<section
		class="crc-home-hero"
		id="crc-hero"
		data-new='<?php echo esc_attr( wp_json_encode( $crc_new_featured ) ); ?>'
		data-trending='<?php echo esc_attr( wp_json_encode( $crc_trending_featured ) ); ?>'
	>
		<?php /* ── Background layer: blurred cover + gradient (set by JS) ── */ ?>
		<div class="crc-hero-bg" aria-hidden="true">
			<div class="crc-hero-bg__img" id="crc-hero-bg-img"
			     <?php if ( $crc_first && $crc_first['cover'] ) : ?>
			     style="background-image:url(<?php echo esc_url( $crc_first['cover'] ); ?>)"
			     <?php endif; ?>
			></div>
			<div class="crc-hero-bg__grad"></div>
		</div>

		<?php /* ── Content ── */ ?>
		<div class="crc-hero-content">
			<div class="crc-container crc-hero-inner">

				<?php /* Tab buttons */ ?>
				<div class="crc-hero-tabs" role="tablist">
					<button class="crc-hero-tab crc-hero-tab--active"
					        data-tab="new" role="tab" aria-selected="true">
						✨ มาใหม่
					</button>
					<button class="crc-hero-tab"
					        data-tab="trending" role="tab" aria-selected="false">
						🔥 ยอดนิยม
					</button>
				</div>

				<?php /* Featured comic info – pre-rendered for first comic, JS updates on change */ ?>
				<div class="crc-hero-info" id="crc-hero-info">

					<?php /* Cover */ ?>
					<a class="crc-hero-cover-link"
					   id="crc-hero-cover-link"
					   href="<?php echo esc_url( $crc_first['url'] ?? '#' ); ?>"
					   aria-label="<?php echo esc_attr( sprintf( 'ดู %s', $crc_first['title'] ?? '' ) ); ?>">
						<div class="crc-hero-cover" id="crc-hero-cover">
							<?php if ( $crc_first && $crc_first['cover'] ) : ?>
								<img class="crc-hero-cover__img" id="crc-hero-cover-img"
								     src="<?php echo esc_url( $crc_first['cover'] ); ?>"
								     alt="<?php echo esc_attr( $crc_first['title'] ?? '' ); ?>"
								     loading="eager">
								<div class="crc-hero-cover__placeholder" id="crc-hero-cover-placeholder"
								     style="display:none" aria-hidden="true">📚</div>
							<?php else : ?>
								<img class="crc-hero-cover__img" id="crc-hero-cover-img"
								     src="" alt="" style="display:none" loading="eager">
								<div class="crc-hero-cover__placeholder" id="crc-hero-cover-placeholder"
								     aria-hidden="true">📚</div>
							<?php endif; ?>
						</div>
					</a>

					<?php /* Text block */ ?>
					<div class="crc-hero-text">
						<div class="crc-hero-meta">
							<?php
							$_status_labels = [
								'ongoing'   => 'กำลังดำเนิน',
								'completed' => 'จบแล้ว',
								'hiatus'    => 'หยุดชั่วคราว',
							];
							$_status_badge_class = [
								'ongoing'   => 'crc-badge--ongoing',
								'completed' => 'crc-badge--completed',
								'hiatus'    => 'crc-badge--hiatus',
							];
							$_s = $crc_first['status'] ?? '';
							?>
							<span class="crc-badge crc-hero-status <?php echo esc_attr( $_status_badge_class[ $_s ] ?? '' ); ?>"
							      id="crc-hero-status"
							      <?php echo ( ! $_s ) ? 'style="display:none"' : ''; ?>>
								<?php echo esc_html( $_status_labels[ $_s ] ?? $_s ); ?>
							</span>
						</div>

						<h2 class="crc-hero-title" id="crc-hero-title">
							<?php echo esc_html( $crc_first['title'] ?? '' ); ?>
						</h2>

						<p class="crc-hero-author" id="crc-hero-author"
						   <?php echo ( empty( $crc_first['author'] ) ) ? 'style="display:none"' : ''; ?>>
							<?php if ( ! empty( $crc_first['author'] ) ) : ?>
								โดย <?php echo esc_html( $crc_first['author'] ); ?>
								<?php if ( ( $crc_first['chapters'] ?? 0 ) > 0 ) : ?>
									<span class="crc-hero-author__chapters">
										· <?php echo esc_html( (string) $crc_first['chapters'] ); ?> ตอน
									</span>
								<?php endif; ?>
							<?php endif; ?>
						</p>

						<div class="crc-hero-actions">
							<a class="crc-btn crc-btn--primary crc-hero-btn"
							   id="crc-hero-btn-read"
							   href="<?php echo esc_url( $crc_first['url'] ?? '#' ); ?>">
								&#9654; อ่านเลย
							</a>
							<a class="crc-btn crc-btn--ghost crc-hero-btn"
							   id="crc-hero-btn-detail"
							   href="<?php echo esc_url( $crc_first['url'] ?? '#' ); ?>">
								&#8505; รายละเอียด
							</a>
						</div>
					</div>

				</div><?php /* /.crc-hero-info */ ?>

				<?php /* Thumbnail strip + arrows */ ?>
				<div class="crc-hero-strip" id="crc-hero-strip">
					<button class="crc-hero-nav crc-hero-nav--prev"
					        id="crc-hero-prev" aria-label="ก่อนหน้า">&#8249;</button>
					<div class="crc-hero-thumbs" id="crc-hero-thumbs" role="list"></div>
					<button class="crc-hero-nav crc-hero-nav--next"
					        id="crc-hero-next" aria-label="ถัดไป">&#8250;</button>
					<div class="crc-hero-dots" id="crc-hero-dots" role="presentation"></div>
				</div>

			</div><?php /* /.crc-hero-inner */ ?>
		</div><?php /* /.crc-hero-content */ ?>

	</section>

	<?php endif; /* end hero */ ?>


	<?php /* ═══════════════════════════════════════════════
	       COMIC ROWS
	       ═══════════════════════════════════════════════ */
	if ( $crc_has_content ) : ?>

	<div class="crc-home-rows">
		<div class="crc-container">
			<?php crc_home_render_row( '✨ มาใหม่ล่าสุด',      $crc_new,       'มาใหม่', $crc_archive_url . '?sort=new' ); ?>
			<?php crc_home_render_row( '🔥 ยอดนิยมสัปดาห์นี้', $crc_trending,  'HOT',    $crc_archive_url . '?sort=trending' ); ?>
			<?php crc_home_render_row( '📖 กำลังดำเนินเรื่อง', $crc_ongoing,   'อัปเดต', $crc_archive_url . '?status=ongoing' ); ?>
			<?php crc_home_render_row( '✅ จบแล้ว',              $crc_completed, null,     $crc_archive_url . '?status=completed' ); ?>
		</div>
	</div>

	<?php else : ?>

	<div class="crc-home-empty">
		<div class="crc-home-empty__icon">📚</div>
		<h2 class="crc-home-empty__title">ยังไม่มีการ์ตูนในระบบ</h2>
		<p class="crc-home-empty__text">เพิ่มการ์ตูนผ่านปลั๊กอิน Comic Reader Companion</p>
	</div>

	<?php endif; ?>

	<?php
	/*
	 * Render the static front page editor content after all homepage rows so the
	 * page can be authored in the normal WordPress editor and analysed by SEO plugins.
	 */
	if ( is_page() && 'page' === get_option( 'show_on_front' ) && have_posts() ) :
		while ( have_posts() ) :
			the_post();

			$crc_editor_content = (string) get_the_content();
			if ( '' === trim( $crc_editor_content ) ) {
				continue;
			}
			?>
			<section class="crc-home-article" aria-label="<?php echo esc_attr__( 'บทความหน้าแรก', 'comic-reader' ); ?>">
				<div class="crc-container">
					<article id="post-<?php the_ID(); ?>" <?php post_class( 'crc-home-article__panel' ); ?>>
						<div class="crc-home-article__content entry-content">
							<?php the_content(); ?>
						</div>
					</article>
				</div>
			</section>
			<?php
		endwhile;

		rewind_posts();
	endif;
	?>

</main>

<?php get_footer(); ?>
