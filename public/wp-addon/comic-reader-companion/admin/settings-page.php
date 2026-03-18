<?php
/**
 * Plugin settings admin page — Thai Quick Setup redesign.
 *
 * Accessible at: Comics → Settings (admin.php?page=comic-reader)
 * Rendered by CRC_Settings::render_page() after capability check.
 *
 * - 3-step card layout (URL → Key → Save & Test)
 * - AJAX "Test Connection" reads current form values before saving
 * - Advanced accordion: Cache TTL, Slug Base, Logging
 * - Connection status badge from last AJAX test result
 *
 * @package ComicReaderCompanion
 */

defined( 'ABSPATH' ) || exit;
if ( ! current_user_can( 'manage_options' ) ) {
    return;
}

// ── Connection status badge ────────────────────────────────────────────────────
$last_test  = get_option( 'crc_last_test', [] );
$configured = CRC_Settings::is_configured();

if ( ! empty( $last_test['status'] ) ) {
    $badge = match ( $last_test['status'] ) {
        'ok'    => [ 'type' => 'ok',   'icon' => '✓', 'label' => 'เชื่อมต่อสำเร็จ' ],
        'error' => [ 'type' => 'err',  'icon' => '✗', 'label' => 'เชื่อมต่อล้มเหลว' ],
        default => [ 'type' => 'none', 'icon' => '○', 'label' => 'ยังไม่ได้ทดสอบ' ],
    };
} elseif ( $configured ) {
    $badge = [ 'type' => 'warn', 'icon' => '?', 'label' => 'ยังไม่ได้ทดสอบ' ];
} else {
    $badge = [ 'type' => 'none', 'icon' => '○', 'label' => 'ยังไม่ได้ตั้งค่า' ];
}

$slug_preview = CRC_Settings::slug_base() ?: 'comics';
$home         = untrailingslashit( home_url() );
?>

<div class="wrap crc-adm-wrap">

    <!-- ── Page header ──────────────────────────────────────────── -->
    <div class="crc-adm-page-header">
        <h1>📖 Comic Reader — ตั้งค่าปลั๊กอิน</h1>
        <span class="crc-adm-badge crc-adm-badge--<?php echo esc_attr( $badge['type'] ); ?>">
            <?php echo esc_html( $badge['icon'] . ' ' . $badge['label'] ); ?>
        </span>
    </div>

    <?php settings_errors( 'crc_messages' ); ?>

    <!-- ── Settings form (submits to options.php) ───────────────── -->
    <form method="post" action="options.php" id="crc-settings-form">
        <?php settings_fields( 'crc_group' ); ?>

        <!-- Step 1 — API Base URL -->
        <div class="crc-adm-card crc-adm-card--accent-blue">
            <div class="crc-adm-step">
                <div class="crc-adm-step-num">1</div>
                <div class="crc-adm-step-body">
                    <div class="crc-adm-step-label">URL ของ API Server</div>
                    <div class="crc-adm-field-row">
                        <input
                            type="url"
                            id="crc_api_base_url"
                            name="<?php echo esc_attr( CRC_Settings::OPTION_BASE_URL ); ?>"
                            class="regular-text"
                            value="<?php echo esc_attr( CRC_Settings::api_base_url() ); ?>"
                            placeholder="https://api.example.com"
                            autocomplete="off"
                            spellcheck="false"
                        >
                    </div>
                    <p class="crc-adm-hint">
                        URL หลักของ API เช่น <code>https://your-api.vercel.app</code><br>
                        ไม่ต้องใส่ <code>/</code> ท้าย หรือ path ย่อย เช่น <code>/api</code>
                    </p>
                </div>
            </div>
        </div>

        <!-- Step 2 — API Key -->
        <div class="crc-adm-card crc-adm-card--accent-blue">
            <div class="crc-adm-step">
                <div class="crc-adm-step-num">2</div>
                <div class="crc-adm-step-body">
                    <div class="crc-adm-step-label">API Key (กุญแจเข้าถึง)</div>
                    <div class="crc-adm-field-row">
                        <input
                            type="password"
                            id="crc_api_key"
                            name="<?php echo esc_attr( CRC_Settings::OPTION_API_KEY ); ?>"
                            class="regular-text"
                            value="<?php echo esc_attr( CRC_Settings::api_key() ); ?>"
                            placeholder="sk-••••••••••••••••"
                            autocomplete="new-password"
                        >
                        <button
                            type="button"
                            class="button crc-adm-field-btn"
                            data-crc-toggle-pw="crc_api_key"
                            aria-label="แสดง API Key"
                            title="แสดง / ซ่อน API Key"
                        >👁</button>
                    </div>
                    <p class="crc-adm-hint">
                        API Key ที่ได้รับจากผู้ดูแลระบบ — ส่งแบบ Server-to-Server ผ่าน Header
                        <code>X-API-Key</code> เท่านั้น ไม่เปิดเผยฝั่ง Browser
                    </p>
                </div>
            </div>
        </div>

        <!-- Step 3 — Save & Test -->
        <div class="crc-adm-card crc-adm-card--accent-green">
            <div class="crc-adm-step">
                <div class="crc-adm-step-num" style="background:var(--crc-success);">3</div>
                <div class="crc-adm-step-body">
                    <div class="crc-adm-step-label">บันทึกและทดสอบการเชื่อมต่อ</div>
                    <p class="crc-adm-hint" style="margin-bottom:.75rem;">
                        กด <strong>บันทึกการตั้งค่า</strong> เพื่อบันทึก
                        หรือกด <strong>ทดสอบการเชื่อมต่อ</strong> เพื่อตรวจสอบก่อนบันทึก
                        (ใช้ค่าในฟอร์มปัจจุบัน ไม่จำเป็นต้องบันทึกก่อน)
                    </p>
                    <div class="crc-adm-action-row">
                        <?php submit_button( 'บันทึกการตั้งค่า', 'primary', 'submit', false ); ?>
                        <button
                            type="button"
                            id="crc-test-btn"
                            class="button button-secondary"
                        >ทดสอบการเชื่อมต่อ</button>
                        <span id="crc-test-result" aria-live="polite"></span>
                    </div>

                    <?php if ( ! empty( $last_test['tested_at'] ) ) : ?>
                        <p class="crc-adm-hint" style="margin-top:.6rem;">
                            ทดสอบล่าสุด:
                            <strong><?php echo esc_html( human_time_diff( $last_test['tested_at'] ) . ' ที่แล้ว' ); ?></strong>
                            <?php if ( ! empty( $last_test['message'] ) ) : ?>
                                — <?php echo esc_html( $last_test['message'] ); ?>
                            <?php endif; ?>
                        </p>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Advanced settings accordion -->
        <div class="crc-adm-accordion" id="crc-advanced-acc">
            <button type="button" class="crc-adm-accordion-toggle">
                <span>⚙ ตั้งค่าขั้นสูง — Cache, URL Prefix, Logging</span>
                <em class="crc-adm-chevron">▾</em>
            </button>
            <div class="crc-adm-accordion-body">

                <!-- Cache TTL -->
                <div style="margin-bottom:1.4rem;">
                    <label for="crc_cache_ttl" style="display:block;font-weight:600;margin-bottom:.4rem;">
                        เวลาเก็บแคช (วินาที)
                    </label>
                    <input
                        type="number"
                        id="crc_cache_ttl"
                        name="<?php echo esc_attr( CRC_Settings::OPTION_CACHE_TTL ); ?>"
                        class="small-text"
                        value="<?php echo esc_attr( CRC_Settings::cache_ttl() ); ?>"
                        min="0"
                        max="86400"
                        step="30"
                    >
                    <p class="crc-adm-hint">
                        ค่าแนะนำ: <strong>300</strong> วินาที (5 นาที)
                        · ตั้งเป็น <strong>0</strong> เพื่อปิดแคช
                    </p>
                </div>

                <!-- Slug base -->
                <div style="margin-bottom:1.4rem;">
                    <label for="crc_slug_base" style="display:block;font-weight:600;margin-bottom:.4rem;">
                        URL Prefix สำหรับการ์ตูน
                    </label>
                    <input
                        type="text"
                        id="crc_slug_base"
                        name="<?php echo esc_attr( CRC_Settings::OPTION_SLUG_BASE ); ?>"
                        class="regular-text"
                        value="<?php echo esc_attr( $slug_preview ); ?>"
                        placeholder="comics"
                    >
                    <p class="crc-adm-hint">
                        URL รูปแบบ:
                        <code><?php echo esc_html( $home ); ?>/<span id="crc-slug-preview"><?php echo esc_html( $slug_preview ); ?></span>/{slug}/ep-{N}/</code><br>
                        หลังเปลี่ยนค่านี้ ไปที่
                        <a href="<?php echo esc_url( admin_url( 'options-permalink.php' ) ); ?>">Settings → Permalinks</a>
                        แล้วกด Save เพื่อ flush rewrite rules
                    </p>
                </div>

                <!-- Log errors -->
                <div>
                    <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-weight:600;">
                        <input type="hidden"
                            name="<?php echo esc_attr( CRC_Settings::OPTION_LOG_ERRORS ); ?>"
                            value="0">
                        <input
                            type="checkbox"
                            id="crc_log_errors"
                            name="<?php echo esc_attr( CRC_Settings::OPTION_LOG_ERRORS ); ?>"
                            value="1"
                            <?php checked( CRC_Settings::log_errors() ); ?>
                        >
                        <span>บันทึก Sync Error ลง Log</span>
                    </label>
                    <p class="crc-adm-hint" style="margin-left:1.5rem;">
                        ปิดถ้าไม่ต้องการเก็บ error log (ช่วยประหยัด database)
                    </p>
                </div>

                <hr class="crc-adm-sep">
                <?php submit_button( 'บันทึกการตั้งค่า', 'secondary', 'submit', false ); ?>

            </div><!-- .crc-adm-accordion-body -->
        </div><!-- .crc-adm-accordion -->

    </form><!-- #crc-settings-form -->

    <!-- ── Flush cache (standalone form) ──────────────────────── -->
    <div class="crc-adm-card">
        <div class="crc-adm-card-header">
            <h3 class="crc-adm-card-title">🗑 ล้าง API Cache</h3>
        </div>
        <p class="crc-adm-hint" style="margin-bottom:.75rem;">
            ลบ Transient cache ทั้งหมดของปลั๊กอิน —
            ข้อมูลจาก API จะถูกดึงใหม่ในการเข้าถึงครั้งถัดไป
        </p>
        <form method="post">
            <?php wp_nonce_field( 'crc_admin_actions', 'crc_nonce' ); ?>
            <button type="submit" name="crc_flush_cache" value="1" class="button button-secondary">
                ล้าง Cache ทันที
            </button>
        </form>
    </div>

    <!-- ── URL map (collapsible reference) ───────────────────── -->
    <div class="crc-adm-accordion">
        <button type="button" class="crc-adm-accordion-toggle">
            <span>🗺 URL Map ที่ใช้งานอยู่</span>
            <em class="crc-adm-chevron">▾</em>
        </button>
        <div class="crc-adm-accordion-body">
            <table class="crc-adm-cron-table">
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>หน้าที่</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code><?php echo esc_html( "{$home}/{$slug_preview}/" ); ?></code></td>
                        <td>หน้ารวมการ์ตูน (ตาราง + ค้นหา + ฟิลเตอร์)</td>
                    </tr>
                    <tr>
                        <td><code><?php echo esc_html( "{$home}/{$slug_preview}/{comic-slug}/" ); ?></code></td>
                        <td>หน้าโปรไฟล์การ์ตูน (ปก + รายละเอียด + รายการตอน)</td>
                    </tr>
                    <tr>
                        <td><code><?php echo esc_html( "{$home}/{$slug_preview}/{comic-slug}/ep-{N}/" ); ?></code></td>
                        <td>Reader ตอน (สกรอลแนวตั้ง + ปุ่ม prev/next)</td>
                    </tr>
                </tbody>
            </table>

            <hr class="crc-adm-sep" style="margin:1rem 0;">

            <p style="font-size:.85rem;font-weight:600;margin-bottom:.4rem;">Override Template ในธีม</p>
            <table class="crc-adm-cron-table">
                <thead>
                    <tr><th>ไฟล์</th><th>Override path ในธีม</th><th>สถานะ</th></tr>
                </thead>
                <tbody>
                    <?php foreach ( [ 'archive-comics.php', 'single-comic.php', 'single-chapter.php' ] as $tpl ) : ?>
                        <tr>
                            <td><code><?php echo esc_html( $tpl ); ?></code></td>
                            <td><code>comic-reader/<?php echo esc_html( $tpl ); ?></code></td>
                            <td>
                                <?php if ( file_exists( get_stylesheet_directory() . '/comic-reader/' . $tpl ) ) : ?>
                                    <span style="color:var(--crc-success);">✓ Override active</span>
                                <?php else : ?>
                                    <span style="color:var(--crc-text-muted);">— ใช้ default</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- ── Quick links ────────────────────────────────────────── -->
    <div class="crc-adm-quick-links">
        <strong>ลิงก์ด่วน:</strong>
        <a href="<?php echo esc_url( admin_url( 'admin.php?page=crc-sync' ) ); ?>">📊 Sync Dashboard</a>
        <span class="sep">|</span>
        <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . CRC_CPT::POST_TYPE_COMIC ) ); ?>">📚 ดูการ์ตูนทั้งหมด</a>
        <span class="sep">|</span>
        <a href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . CRC_CPT::POST_TYPE_CHAPTER ) ); ?>">📄 ดูตอนทั้งหมด</a>
        <span class="sep">|</span>
        <a href="<?php echo esc_url( admin_url( 'options-permalink.php' ) ); ?>">🔗 ตั้งค่า Permalinks</a>
    </div>

    <script>
    // Live preview of the slug base in the URL hint.
    (function () {
        var input   = document.getElementById('crc_slug_base');
        var preview = document.getElementById('crc-slug-preview');
        if (input && preview) {
            input.addEventListener('input', function () {
                preview.textContent = (input.value || 'comics').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'comics';
            });
        }
    })();
    </script>

</div><!-- .wrap.crc-adm-wrap -->
