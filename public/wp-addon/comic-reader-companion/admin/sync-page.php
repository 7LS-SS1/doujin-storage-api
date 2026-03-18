<?php
/**
 * Admin sync dashboard — Thai redesign.
 *
 * Accessible at: Comics → Sync Status (admin.php?page=crc-sync)
 * Rendered by crc_render_sync_page() after capability check.
 *
 * Sections:
 *   1. Stat cards    — comic/chapter counts, last sync times
 *   2. Action cards  — Incremental (recommended), Full, Utilities
 *   3. Last run      — visual result row with color-coded counts
 *   4. Cron schedule — collapsible table
 *   5. Error log     — collapsible (shown only when errors exist)
 *   6. WP data links — quick access to CPT post lists
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;
if ( ! current_user_can( 'manage_options' ) ) {
    return;
}

// ── Process POST actions ───────────────────────────────────────────────────────
$action_result = null;
if ( ! empty( $_POST['crc_sync_action'] ) && check_admin_referer( 'crc_sync_actions', 'crc_sync_nonce' ) ) {

    $action = sanitize_key( $_POST['crc_sync_action'] );

    switch ( $action ) {
        case 'incremental':
            if ( CRC_Cron::is_running() ) {
                $action_result = [ 'type' => 'warning', 'msg' => 'มี Sync กำลังทำงานอยู่ กรุณารอสักครู่แล้วลองใหม่' ];
            } else {
                if ( function_exists( 'set_time_limit' ) ) set_time_limit( 120 );
                $stats = CRC_Sync::incremental_sync();
                $action_result = [
                    'type'  => 'success',
                    'msg'   => sprintf(
                        'Incremental Sync เสร็จสิ้น ใช้เวลา %.2f วินาที — สร้าง: %d · อัพเดท: %d · ข้าม: %d · Error: %d',
                        $stats['elapsed'], $stats['created'], $stats['updated'], $stats['skipped'], $stats['errors']
                    ),
                    'stats' => $stats,
                ];
            }
            break;

        case 'full':
            if ( CRC_Cron::is_running() ) {
                $action_result = [ 'type' => 'warning', 'msg' => 'มี Sync กำลังทำงานอยู่ กรุณารอสักครู่แล้วลองใหม่' ];
            } else {
                if ( function_exists( 'set_time_limit' ) ) set_time_limit( 600 );
                $stats = CRC_Sync::full_sync();
                $action_result = [
                    'type'  => 'success',
                    'msg'   => sprintf(
                        'Full Sync เสร็จสิ้น ใช้เวลา %.2f วินาที — สร้าง: %d · อัพเดท: %d · ข้าม: %d · Error: %d',
                        $stats['elapsed'], $stats['created'], $stats['updated'], $stats['skipped'], $stats['errors']
                    ),
                    'stats' => $stats,
                ];
            }
            break;

        case 'flush_cache':
            CRC_Settings::flush_all_cache();
            $action_result = [ 'type' => 'success', 'msg' => 'ล้าง API Cache เรียบร้อยแล้ว' ];
            break;

        case 'clear_errors':
            CRC_Sync::clear_errors();
            $action_result = [ 'type' => 'success', 'msg' => 'ล้าง Error Log เรียบร้อยแล้ว' ];
            break;

        case 'reschedule':
            CRC_Cron::reschedule();
            $action_result = [ 'type' => 'success', 'msg' => 'ตั้งเวลา Cron ใหม่เรียบร้อยแล้ว' ];
            break;
    }
}

// ── Data ──────────────────────────────────────────────────────────────────────
$stats         = CRC_Sync::last_stats();
$errors        = CRC_Sync::recent_errors();
$last_inc      = CRC_Sync::last_incremental();
$last_full     = CRC_Sync::last_full();
$next_inc      = CRC_Cron::next_incremental();
$next_full     = CRC_Cron::next_full();
$is_running    = CRC_Cron::is_running();
$comic_count   = CRC_CPT::comic_count();
$chapter_count = CRC_CPT::chapter_count();
$configured    = CRC_Settings::is_configured();

$dt_format = get_option( 'date_format' ) . ' ' . get_option( 'time_format' );

/**
 * Format a Unix timestamp for display.
 */
function crc_fmt_time( ?int $ts ): string {
    if ( ! $ts ) return '—';
    return esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $ts ) )
        . ' <span style="color:#999">(' . esc_html( human_time_diff( $ts ) . ' ที่แล้ว' ) . ')</span>';
}

// Determine global status badge.
if ( $is_running ) {
    $status_badge = [ 'type' => 'running', 'label' => '⟳ Sync กำลังทำงาน' ];
} elseif ( ! $configured ) {
    $status_badge = [ 'type' => 'err', 'label' => '✗ ยังไม่ได้ตั้งค่า' ];
} elseif ( ! empty( $errors ) ) {
    $status_badge = [ 'type' => 'warn', 'label' => '⚠ มี Error ' . count( $errors ) . ' รายการ' ];
} else {
    $status_badge = [ 'type' => 'ok', 'label' => '✓ ปกติ' ];
}
?>

<div class="wrap crc-adm-wrap">

    <!-- ── Page header ──────────────────────────────────────────── -->
    <div class="crc-adm-page-header">
        <h1>📊 Comic Reader — Sync Dashboard</h1>
        <span class="crc-adm-badge crc-adm-badge--<?php echo esc_attr( $status_badge['type'] ); ?>">
            <?php echo esc_html( $status_badge['label'] ); ?>
        </span>
    </div>

    <!-- Notices -->
    <?php if ( $action_result ) : ?>
        <div class="notice notice-<?php echo esc_attr( $action_result['type'] ); ?> is-dismissible">
            <p><?php echo esc_html( $action_result['msg'] ); ?></p>
        </div>
    <?php endif; ?>

    <?php if ( ! $configured ) : ?>
        <div class="notice notice-error">
            <p>
                <strong>ปลั๊กอินยังไม่ได้ตั้งค่า</strong>
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=comic-reader' ) ); ?>">
                    ไปที่ Comic Reader Settings →
                </a>
            </p>
        </div>
    <?php endif; ?>

    <?php if ( $is_running ) : ?>
        <div class="notice notice-info">
            <p>⟳ มี Sync กำลังทำงานอยู่ใน Background</p>
        </div>
    <?php endif; ?>

    <!-- ── Stat cards ───────────────────────────────────────────── -->
    <div class="crc-adm-stat-grid">

        <div class="crc-adm-stat">
            <div class="crc-adm-stat-icon">📚</div>
            <div class="crc-adm-stat-value"><?php echo esc_html( number_format_i18n( $comic_count ) ); ?></div>
            <div class="crc-adm-stat-label">การ์ตูนใน WordPress</div>
        </div>

        <div class="crc-adm-stat">
            <div class="crc-adm-stat-icon">📄</div>
            <div class="crc-adm-stat-value"><?php echo esc_html( number_format_i18n( $chapter_count ) ); ?></div>
            <div class="crc-adm-stat-label">ตอนทั้งหมดใน WordPress</div>
        </div>

        <div class="crc-adm-stat">
            <div class="crc-adm-stat-icon">⚡</div>
            <div class="crc-adm-stat-value" style="font-size:1.15rem;">
                <?php echo $last_inc ? esc_html( human_time_diff( $last_inc ) . ' ago' ) : '—'; ?>
            </div>
            <div class="crc-adm-stat-label">Sync เร็วล่าสุด</div>
        </div>

        <div class="crc-adm-stat">
            <div class="crc-adm-stat-icon">🔄</div>
            <div class="crc-adm-stat-value" style="font-size:1.15rem;">
                <?php echo $last_full ? esc_html( human_time_diff( $last_full ) . ' ago' ) : '—'; ?>
            </div>
            <div class="crc-adm-stat-label">Full Sync ล่าสุด</div>
        </div>

    </div>

    <!-- ── Action cards ─────────────────────────────────────────── -->
    <form method="post" id="crc-sync-form">
        <?php wp_nonce_field( 'crc_sync_actions', 'crc_sync_nonce' ); ?>

        <div class="crc-adm-action-grid">

            <!-- Incremental (recommended) -->
            <div class="crc-adm-action-card crc-adm-action-card--primary">
                <div class="crc-adm-action-card-icon">⚡</div>
                <div>
                    <div class="crc-adm-action-card-tag">แนะนำ</div>
                    <div class="crc-adm-action-card-title">Sync แบบเร็ว</div>
                </div>
                <div class="crc-adm-action-card-desc">
                    ดึงเฉพาะการ์ตูนที่อัพเดทล่าสุด ~100 รายการ
                    เร็ว ใช้เวลาประมาณ 5–15 วินาที
                    เหมาะสำหรับการรีเฟรชข้อมูลระหว่างวัน
                </div>
                <button
                    type="submit"
                    name="crc_sync_action"
                    value="incremental"
                    class="button button-primary"
                    data-loading-text="กำลัง Sync…"
                    <?php disabled( ! $configured || $is_running ); ?>
                >▶ Run Incremental Sync</button>
            </div>

            <!-- Full sync (advanced) -->
            <div class="crc-adm-action-card crc-adm-action-card--muted">
                <div class="crc-adm-action-card-icon">🔄</div>
                <div>
                    <div class="crc-adm-action-card-tag" style="color:var(--crc-text-muted);">ขั้นสูง</div>
                    <div class="crc-adm-action-card-title">Full Sync</div>
                </div>
                <div class="crc-adm-action-card-desc">
                    ดึงการ์ตูน + ตอน + Taxonomy ทั้งหมด
                    อาจใช้เวลาหลายนาที — ใช้เมื่อข้อมูลไม่ตรงกันหรือหลังแก้ปัญหา
                </div>
                <button
                    type="submit"
                    name="crc_sync_action"
                    value="full"
                    class="button"
                    data-loading-text="กำลัง Full Sync…"
                    onclick="return confirm('Full Sync อาจใช้เวลาหลายนาที\nหน้าจะค้างระหว่างรอ — ต้องการดำเนินการต่อหรือไม่?')"
                    <?php disabled( ! $configured || $is_running ); ?>
                >▶ Run Full Sync</button>
            </div>

            <!-- Utilities -->
            <div class="crc-adm-action-card crc-adm-action-card--util">
                <div class="crc-adm-action-card-icon">🛠</div>
                <div>
                    <div class="crc-adm-action-card-tag" style="color:var(--crc-text-muted);">ยูทิลิตี้</div>
                    <div class="crc-adm-action-card-title">เครื่องมือเสริม</div>
                </div>
                <div class="crc-adm-action-card-desc">
                    ล้าง API Cache, ตั้งเวลา Cron ใหม่,
                    หรือล้าง Error Log
                </div>
                <div class="crc-adm-util-row">
                    <button type="submit" name="crc_sync_action" value="flush_cache" class="button button-secondary">
                        🗑 ล้าง API Cache
                    </button>
                    <button type="submit" name="crc_sync_action" value="reschedule" class="button button-secondary">
                        ⏰ ตั้งเวลา Cron ใหม่
                    </button>
                    <?php if ( ! empty( $errors ) ) : ?>
                        <button type="submit" name="crc_sync_action" value="clear_errors" class="button button-secondary">
                            🧹 ล้าง Error Log
                        </button>
                    <?php endif; ?>
                </div>
            </div>

        </div><!-- .crc-adm-action-grid -->
    </form>

    <!-- ── Last sync result (visual) ────────────────────────────── -->
    <?php if ( ! empty( $stats ) ) : ?>
        <div class="crc-adm-card">
            <div class="crc-adm-card-header">
                <h3 class="crc-adm-card-title">
                    📈 ผลการ Sync ครั้งล่าสุด
                </h3>
                <span style="font-size:.8rem;color:var(--crc-text-muted);">
                    <?php echo esc_html( ucfirst( $stats['type'] ?? '' ) ); ?>
                    <?php if ( ! empty( $stats['time'] ) ) : ?>
                        · <?php echo esc_html( date_i18n( $dt_format, $stats['time'] ) ); ?>
                    <?php endif; ?>
                    <?php if ( isset( $stats['elapsed'] ) ) : ?>
                        · ใช้เวลา <?php echo esc_html( number_format( $stats['elapsed'], 2 ) ); ?>s
                    <?php endif; ?>
                </span>
            </div>

            <div class="crc-adm-result-row">
                <div class="crc-adm-result-cell crc-adm-result-cell--create">
                    <div class="crc-adm-result-cell-value"><?php echo esc_html( $stats['created'] ?? 0 ); ?></div>
                    <div class="crc-adm-result-cell-label">สร้างใหม่</div>
                </div>
                <div class="crc-adm-result-cell crc-adm-result-cell--update">
                    <div class="crc-adm-result-cell-value"><?php echo esc_html( $stats['updated'] ?? 0 ); ?></div>
                    <div class="crc-adm-result-cell-label">อัพเดท</div>
                </div>
                <div class="crc-adm-result-cell crc-adm-result-cell--skip">
                    <div class="crc-adm-result-cell-value"><?php echo esc_html( $stats['skipped'] ?? 0 ); ?></div>
                    <div class="crc-adm-result-cell-label">ข้าม (ไม่เปลี่ยน)</div>
                </div>
                <div class="crc-adm-result-cell crc-adm-result-cell--error">
                    <div class="crc-adm-result-cell-value"><?php echo esc_html( $stats['errors'] ?? 0 ); ?></div>
                    <div class="crc-adm-result-cell-label">Error</div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- ── Cron schedule (collapsible) ─────────────────────────── -->
    <div class="crc-adm-accordion">
        <button type="button" class="crc-adm-accordion-toggle">
            <span>⏰ ตารางเวลา Cron Jobs</span>
            <em class="crc-adm-chevron">▾</em>
        </button>
        <div class="crc-adm-accordion-body">
            <table class="crc-adm-cron-table">
                <thead>
                    <tr>
                        <th>งาน</th>
                        <th>ความถี่</th>
                        <th>รอบถัดไป</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Incremental Sync</td>
                        <td>ทุก 10 นาที</td>
                        <td>
                            <?php if ( $next_inc ) : ?>
                                <?php echo esc_html( date_i18n( $dt_format, $next_inc ) ); ?>
                            <?php else : ?>
                                <span class="crc-adm-cron-not-scheduled">ยังไม่ได้ตั้งเวลา</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td>Full Sync</td>
                        <td>ทุกวัน</td>
                        <td>
                            <?php if ( $next_full ) : ?>
                                <?php echo esc_html( date_i18n( $dt_format, $next_full ) ); ?>
                            <?php else : ?>
                                <span class="crc-adm-cron-not-scheduled">ยังไม่ได้ตั้งเวลา</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p style="margin-top:.75rem;">
                <form method="post" style="display:inline;">
                    <?php wp_nonce_field( 'crc_sync_actions', 'crc_sync_nonce' ); ?>
                    <button type="submit" name="crc_sync_action" value="reschedule" class="button button-secondary">
                        ⏰ ตั้งเวลา Cron ใหม่
                    </button>
                </form>
            </p>
        </div>
    </div>

    <!-- ── Error log (collapsible, shown only when errors exist) ─ -->
    <?php if ( ! empty( $errors ) ) : ?>
        <div class="crc-adm-accordion is-open">
            <button type="button" class="crc-adm-accordion-toggle" style="background:#fff5f5;">
                <span style="color:var(--crc-error);">
                    ⚠ Error Log (<?php echo count( $errors ); ?> รายการ)
                </span>
                <em class="crc-adm-chevron" style="color:var(--crc-error);">▾</em>
            </button>
            <div class="crc-adm-accordion-body" style="padding:0;">
                <div class="crc-adm-error-log">
                    <?php foreach ( array_reverse( $errors ) as $err ) : ?>
                        <div class="crc-adm-error-row">
                            <div class="crc-adm-error-time">
                                <?php echo esc_html( date_i18n( $dt_format, $err['time'] ?? 0 ) ); ?>
                            </div>
                            <div class="crc-adm-error-ctx">
                                <?php echo esc_html( $err['context'] ?? '' ); ?>
                            </div>
                            <div class="crc-adm-error-msg">
                                <?php echo esc_html( $err['message'] ?? '' ); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <form method="post" style="margin-bottom:1rem;">
            <?php wp_nonce_field( 'crc_sync_actions', 'crc_sync_nonce' ); ?>
            <button type="submit" name="crc_sync_action" value="clear_errors" class="button button-secondary">
                🧹 ล้าง Error Log
            </button>
        </form>
    <?php else : ?>
        <p style="color:var(--crc-success);font-size:.85rem;margin:0 0 1.5rem;">
            ✓ ไม่มี Sync Error ที่บันทึกไว้
        </p>
    <?php endif; ?>

    <!-- ── WordPress data quick links ─────────────────────────── -->
    <div class="crc-adm-card">
        <h3 class="crc-adm-card-title">🗂 ข้อมูลใน WordPress</h3>
        <div class="crc-adm-wp-links">
            <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . CRC_CPT::POST_TYPE_COMIC ) ); ?>" class="button">
                📚 การ์ตูน (<?php echo esc_html( number_format_i18n( $comic_count ) ); ?>)
            </a>
            <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . CRC_CPT::POST_TYPE_CHAPTER ) ); ?>" class="button">
                📄 ตอน (<?php echo esc_html( number_format_i18n( $chapter_count ) ); ?>)
            </a>
            <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=' . CRC_CPT::TAX_CATEGORY . '&post_type=' . CRC_CPT::POST_TYPE_COMIC ) ); ?>" class="button">
                🏷 หมวดหมู่
            </a>
            <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=' . CRC_CPT::TAX_GENRE . '&post_type=' . CRC_CPT::POST_TYPE_COMIC ) ); ?>" class="button">
                🎭 แนว (Genre)
            </a>
            <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=' . CRC_CPT::TAX_AUTHOR . '&post_type=' . CRC_CPT::POST_TYPE_COMIC ) ); ?>" class="button">
                ✍ ผู้แต่ง (Authors)
            </a>
        </div>
    </div>

    <!-- ── Quick links ────────────────────────────────────────── -->
    <div class="crc-adm-quick-links">
        <strong>ลิงก์ด่วน:</strong>
        <a href="<?php echo esc_url( admin_url( 'admin.php?page=comic-reader' ) ); ?>">⚙ ตั้งค่าปลั๊กอิน</a>
        <span class="sep">|</span>
        <a href="<?php echo esc_url( admin_url( 'options-permalink.php' ) ); ?>">🔗 Permalinks</a>
    </div>

</div><!-- .wrap.crc-adm-wrap -->
