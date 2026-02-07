<?php
/**
 * Plugin Name: Comic Storage API
 * Plugin URI: https://github.com/your-org/comic-storage-api
 * Description: Integrates with the Comic Storage API to display comics, chapters, and images on your WordPress site. Supports taxonomy sync and chapter reader.
 * Version: 1.0.0
 * Author: Comic Storage Team
 * License: GPL v2 or later
 * Text Domain: comic-storage-api
 */

if (!defined('ABSPATH')) exit;

// ------------------------------------------------------------------
// Settings page
// ------------------------------------------------------------------
add_action('admin_menu', function () {
    add_options_page(
        'Comic Storage API',
        'Comic Storage API',
        'manage_options',
        'comic-storage-api',
        'csa_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('csa_options_group', 'csa_api_base_url');
    register_setting('csa_options_group', 'csa_api_key');

    add_settings_section('csa_main', 'API Configuration', null, 'comic-storage-api');

    add_settings_field('csa_api_base_url', 'API Base URL', function () {
        $val = esc_attr(get_option('csa_api_base_url', ''));
        echo "<input type='url' name='csa_api_base_url' value='{$val}' class='regular-text' placeholder='https://your-app.vercel.app' />";
        echo '<p class="description">Base URL of your Comic Storage API deployment (no trailing slash).</p>';
    }, 'comic-storage-api', 'csa_main');

    add_settings_field('csa_api_key', 'API Key', function () {
        $val = esc_attr(get_option('csa_api_key', ''));
        echo "<input type='text' name='csa_api_key' value='{$val}' class='regular-text' placeholder='csa_...' />";
        echo '<p class="description">Your API key from the admin dashboard.</p>';
    }, 'comic-storage-api', 'csa_main');
});

function csa_settings_page() {
    ?>
    <div class="wrap">
        <h1>Comic Storage API Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('csa_options_group');
            do_settings_sections('comic-storage-api');
            submit_button();
            ?>
        </form>
        <hr>
        <h2>Taxonomy Sync</h2>
        <p>Sync categories and tags from the API to WordPress taxonomies.</p>
        <form method="post">
            <?php wp_nonce_field('csa_sync_taxonomies', 'csa_sync_nonce'); ?>
            <button type="submit" name="csa_sync_categories" class="button">Sync Categories</button>
            <button type="submit" name="csa_sync_tags" class="button">Sync Tags</button>
        </form>
        <?php
        if (isset($_POST['csa_sync_categories']) && wp_verify_nonce($_POST['csa_sync_nonce'], 'csa_sync_taxonomies')) {
            csa_sync_categories();
        }
        if (isset($_POST['csa_sync_tags']) && wp_verify_nonce($_POST['csa_sync_nonce'], 'csa_sync_taxonomies')) {
            csa_sync_tags();
        }
        ?>
        <hr>
        <h2>Shortcodes</h2>
        <table class="widefat">
            <thead><tr><th>Shortcode</th><th>Description</th></tr></thead>
            <tbody>
                <tr><td><code>[comic_list]</code></td><td>Display comic grid. Params: category, tag, series, search, page_size (default 20).</td></tr>
                <tr><td><code>[comic_detail slug="..."]</code></td><td>Display a single comic with chapters.</td></tr>
                <tr><td><code>[chapter_reader id="..."]</code></td><td>Display chapter images in a vertical reader.</td></tr>
            </tbody>
        </table>
    </div>
    <?php
}

// ------------------------------------------------------------------
// API Helper
// ------------------------------------------------------------------
function csa_api_get($endpoint, $params = []) {
    $base = rtrim(get_option('csa_api_base_url', ''), '/');
    $key  = get_option('csa_api_key', '');

    if (empty($base) || empty($key)) return new WP_Error('csa_config', 'Comic Storage API is not configured.');

    $url = $base . '/api/public' . $endpoint;
    if (!empty($params)) $url .= '?' . http_build_query($params);

    $response = wp_remote_get($url, [
        'timeout' => 15,
        'headers' => ['X-API-Key' => $key],
    ]);

    if (is_wp_error($response)) return $response;

    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($code !== 200) return new WP_Error('csa_api', $body['error'] ?? 'API request failed', ['status' => $code]);

    return $body;
}

// ------------------------------------------------------------------
// Taxonomy sync
// ------------------------------------------------------------------
function csa_sync_categories() {
    $data = csa_api_get('/wp/sync/categories');
    if (is_wp_error($data)) {
        echo '<div class="error"><p>Error: ' . esc_html($data->get_error_message()) . '</p></div>';
        return;
    }
    $count = 0;
    foreach ($data['categories'] ?? [] as $cat) {
        if (!term_exists($cat['slug'], 'category')) {
            wp_insert_term($cat['name'], 'category', ['slug' => $cat['slug']]);
            $count++;
        }
    }
    echo '<div class="updated"><p>Synced ' . $count . ' new categories.</p></div>';
}

function csa_sync_tags() {
    $data = csa_api_get('/wp/sync/tags');
    if (is_wp_error($data)) {
        echo '<div class="error"><p>Error: ' . esc_html($data->get_error_message()) . '</p></div>';
        return;
    }
    $count = 0;
    foreach ($data['tags'] ?? [] as $tag) {
        if (!term_exists($tag['slug'], 'post_tag')) {
            wp_insert_term($tag['name'], 'post_tag', ['slug' => $tag['slug']]);
            $count++;
        }
    }
    echo '<div class="updated"><p>Synced ' . $count . ' new tags.</p></div>';
}

// ------------------------------------------------------------------
// Shortcode: [comic_list]
// ------------------------------------------------------------------
add_shortcode('comic_list', function ($atts) {
    $atts = shortcode_atts([
        'category'  => '',
        'tag'       => '',
        'series'    => '',
        'search'    => '',
        'page_size' => 20,
    ], $atts, 'comic_list');

    $page = max(1, intval($_GET['csa_page'] ?? 1));
    $params = array_filter([
        'category' => $atts['category'],
        'tag'      => $atts['tag'],
        'series'   => $atts['series'],
        'search'   => $atts['search'],
        'page'     => $page,
        'pageSize' => intval($atts['page_size']),
    ]);

    $data = csa_api_get('/comics', $params);
    if (is_wp_error($data)) return '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';

    $comics = $data['comics'] ?? [];
    $total  = $data['total'] ?? 0;
    $totalPages = ceil($total / intval($atts['page_size']));

    ob_start();
    ?>
    <div class="csa-comic-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
        <?php foreach ($comics as $comic): ?>
            <div class="csa-comic-card" style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#fff;">
                <?php if (!empty($comic['cover_image_url'])): ?>
                    <img src="<?php echo esc_url($comic['cover_image_url']); ?>" alt="<?php echo esc_attr($comic['title']); ?>" style="width:100%;aspect-ratio:3/4;object-fit:cover;" loading="lazy" />
                <?php else: ?>
                    <div style="width:100%;aspect-ratio:3/4;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;">No Cover</div>
                <?php endif; ?>
                <div style="padding:0.75rem;">
                    <h3 style="margin:0 0 0.25rem;font-size:0.95rem;"><a href="?csa_comic=<?php echo esc_attr($comic['slug']); ?>"><?php echo esc_html($comic['title']); ?></a></h3>
                    <p style="margin:0;font-size:0.8rem;color:#666;"><?php echo esc_html($comic['status']); ?></p>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php if ($totalPages > 1): ?>
        <div class="csa-pagination" style="margin-top:1rem;text-align:center;">
            <?php if ($page > 1): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_page', $page - 1)); ?>">&laquo; Previous</a>
            <?php endif; ?>
            <span style="margin:0 1rem;">Page <?php echo $page; ?> of <?php echo $totalPages; ?></span>
            <?php if ($page < $totalPages): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_page', $page + 1)); ?>">Next &raquo;</a>
            <?php endif; ?>
        </div>
    <?php endif; ?>
    <?php
    return ob_get_clean();
});

// ------------------------------------------------------------------
// Shortcode: [comic_detail slug="..."]
// ------------------------------------------------------------------
add_shortcode('comic_detail', function ($atts) {
    $atts = shortcode_atts(['slug' => ''], $atts, 'comic_detail');
    $slug = $atts['slug'] ?: ($_GET['csa_comic'] ?? '');
    if (empty($slug)) return '<p class="csa-error">No comic specified.</p>';

    $data = csa_api_get('/comics/' . sanitize_title($slug));
    if (is_wp_error($data)) return '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';

    ob_start();
    ?>
    <div class="csa-comic-detail" style="max-width:900px;margin:0 auto;">
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
            <?php if (!empty($data['cover_image_url'])): ?>
                <img src="<?php echo esc_url($data['cover_image_url']); ?>" alt="<?php echo esc_attr($data['title']); ?>" style="width:250px;border-radius:8px;object-fit:cover;" />
            <?php endif; ?>
            <div style="flex:1;min-width:250px;">
                <h2 style="margin:0 0 0.5rem;"><?php echo esc_html($data['title']); ?></h2>
                <?php if (!empty($data['author_name'])): ?>
                    <p style="color:#666;margin:0 0 0.5rem;">By <?php echo esc_html($data['author_name']); ?></p>
                <?php endif; ?>
                <p><strong>Status:</strong> <?php echo esc_html(ucfirst($data['status'] ?? '')); ?></p>
                <?php if (!empty($data['description'])): ?>
                    <p><?php echo esc_html($data['description']); ?></p>
                <?php endif; ?>
                <?php if (!empty($data['categories'])): ?>
                    <p><strong>Categories:</strong>
                    <?php foreach ($data['categories'] as $cat): ?>
                        <span style="background:#e0e0e0;padding:2px 8px;border-radius:4px;font-size:0.85rem;margin-right:4px;"><?php echo esc_html($cat['name']); ?></span>
                    <?php endforeach; ?>
                    </p>
                <?php endif; ?>
                <?php if (!empty($data['tags'])): ?>
                    <p><strong>Tags:</strong>
                    <?php foreach ($data['tags'] as $tag): ?>
                        <span style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:0.85rem;margin-right:4px;"><?php echo esc_html($tag['name']); ?></span>
                    <?php endforeach; ?>
                    </p>
                <?php endif; ?>
            </div>
        </div>
        <?php if (!empty($data['latestChapters'])): ?>
            <h3 style="margin-top:1.5rem;">Chapters</h3>
            <ul style="list-style:none;padding:0;">
                <?php foreach ($data['latestChapters'] as $ch): ?>
                    <li style="border:1px solid #ddd;border-radius:6px;padding:0.75rem;margin-bottom:0.5rem;">
                        <a href="?csa_chapter=<?php echo esc_attr($ch['id']); ?>">
                            Chapter <?php echo esc_html($ch['number']); ?>
                            <?php if (!empty($ch['title'])): ?> - <?php echo esc_html($ch['title']); ?><?php endif; ?>
                        </a>
                        <span style="float:right;color:#999;font-size:0.85rem;">
                            <?php echo esc_html(date('M j, Y', strtotime($ch['published_at']))); ?>
                        </span>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});

// ------------------------------------------------------------------
// Shortcode: [chapter_reader id="..."]
// ------------------------------------------------------------------
add_shortcode('chapter_reader', function ($atts) {
    $atts = shortcode_atts(['id' => ''], $atts, 'chapter_reader');
    $id = $atts['id'] ?: ($_GET['csa_chapter'] ?? '');
    if (empty($id)) return '<p class="csa-error">No chapter specified.</p>';

    $data = csa_api_get('/chapters/' . intval($id));
    if (is_wp_error($data)) return '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';

    ob_start();
    ?>
    <div class="csa-chapter-reader" style="max-width:800px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <?php if (!empty($data['previousChapterId'])): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_chapter', $data['previousChapterId'])); ?>">&laquo; Previous</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
            <h2 style="margin:0;text-align:center;">
                <?php echo esc_html($data['comic']['title'] ?? ''); ?> - Chapter <?php echo esc_html($data['number'] ?? ''); ?>
                <?php if (!empty($data['title'])): ?>: <?php echo esc_html($data['title']); ?><?php endif; ?>
            </h2>
            <?php if (!empty($data['nextChapterId'])): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_chapter', $data['nextChapterId'])); ?>">Next &raquo;</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
        </div>
        <div class="csa-reader-images">
            <?php foreach ($data['images'] ?? [] as $img): ?>
                <img src="<?php echo esc_url($img['image_url']); ?>" alt="Page <?php echo esc_attr($img['sort_order'] + 1); ?>" style="width:100%;display:block;margin-bottom:4px;" loading="lazy" />
            <?php endforeach; ?>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:1rem;">
            <?php if (!empty($data['previousChapterId'])): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_chapter', $data['previousChapterId'])); ?>">&laquo; Previous Chapter</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
            <?php if (!empty($data['nextChapterId'])): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_chapter', $data['nextChapterId'])); ?>">Next Chapter &raquo;</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
});
