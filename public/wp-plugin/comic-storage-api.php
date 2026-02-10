<?php
/**
 * Plugin Name: Comic Storage API
 * Plugin URI: https://github.com/your-org/comic-storage-api
 * Description: Integrates with the Comic Storage API to display comics, chapters, and images on your WordPress site. Supports taxonomy sync and chapter reader.
 * Version: 1.2.0
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
function csa_api_request($endpoint, $params = [], $method = 'GET', $body = null) {
    $base = rtrim(get_option('csa_api_base_url', ''), '/');
    $key  = get_option('csa_api_key', '');

    if (empty($base) || empty($key)) return new WP_Error('csa_config', 'Comic Storage API is not configured.');

    $url = $base . '/api/public' . $endpoint;
    if (!empty($params) && strtoupper($method) === 'GET') $url .= '?' . http_build_query($params);

    $headers = ['X-API-Key' => $key];
    $args = [
        'method'  => strtoupper($method),
        'timeout' => 15,
        'headers' => $headers,
    ];

    if ($body !== null) {
        $args['headers']['Content-Type'] = 'application/json';
        $args['body'] = wp_json_encode($body);
    }

    $response = wp_remote_request($url, $args);

    if (is_wp_error($response)) return $response;

    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($code < 200 || $code >= 300) return new WP_Error('csa_api', $body['error'] ?? 'API request failed', ['status' => $code]);

    return $body;
}

function csa_api_get($endpoint, $params = []) {
    return csa_api_request($endpoint, $params, 'GET');
}

function csa_current_url() {
    $scheme = is_ssl() ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (empty($host)) return '';
    return esc_url_raw($scheme . '://' . $host . $uri);
}

function csa_build_link($base_url, $key, $value) {
    $base = $base_url ?: csa_current_url();
    if (empty($base)) return '';
    return esc_url(add_query_arg($key, $value, $base));
}

// ------------------------------------------------------------------
// Taxonomy sync
// ------------------------------------------------------------------
function csa_sync_categories() {
    $data = csa_api_request('/wp/sync/categories', [], 'POST');
    if (is_wp_error($data)) {
        echo '<div class="error"><p>Error: ' . esc_html($data->get_error_message()) . '</p></div>';
        return;
    }
    $count = 0;
    foreach ($data['mappings'] ?? [] as $cat) {
        if (($cat['taxonomy'] ?? '') !== 'category') continue;
        if (!term_exists($cat['slug'], 'category')) {
            wp_insert_term($cat['name'], 'category', ['slug' => $cat['slug']]);
            $count++;
        }
    }
    echo '<div class="updated"><p>Synced ' . $count . ' new categories.</p></div>';
}

function csa_sync_tags() {
    $data = csa_api_request('/wp/sync/tags', [], 'POST');
    if (is_wp_error($data)) {
        echo '<div class="error"><p>Error: ' . esc_html($data->get_error_message()) . '</p></div>';
        return;
    }
    $count = 0;
    foreach ($data['mappings'] ?? [] as $tag) {
        if (($tag['taxonomy'] ?? '') !== 'post_tag') continue;
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
        'status'    => '',
        'page_size' => 20,
        'show_pagination' => 'true',
        'detail_url' => '',
    ], $atts, 'comic_list');

    $queryCategory = sanitize_text_field($_GET['csa_category'] ?? '');
    $queryTag = sanitize_text_field($_GET['csa_tag'] ?? '');
    $querySeries = sanitize_text_field($_GET['csa_series'] ?? '');
    $querySearch = sanitize_text_field($_GET['csa_search'] ?? '');

    if (empty($atts['category']) && !empty($queryCategory)) $atts['category'] = $queryCategory;
    if (empty($atts['tag']) && !empty($queryTag)) $atts['tag'] = $queryTag;
    if (empty($atts['series']) && !empty($querySeries)) $atts['series'] = $querySeries;
    if (empty($atts['search']) && !empty($querySearch)) $atts['search'] = $querySearch;

    $page = max(1, intval($_GET['csa_page'] ?? 1));
    $params = array_filter([
        'category' => $atts['category'],
        'tag'      => $atts['tag'],
        'series'   => $atts['series'],
        'search'   => $atts['search'],
        'status'   => $atts['status'],
        'page'     => $page,
        'pageSize' => intval($atts['page_size']),
    ]);

    $data = csa_api_get('/comics', $params);
    if (is_wp_error($data)) return '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';

    $comics = $data['comics'] ?? [];
    $total  = $data['total'] ?? 0;
    $totalPages = ceil($total / intval($atts['page_size']));
    $showPagination = strtolower($atts['show_pagination']) !== 'false';
    $detailUrl = !empty($atts['detail_url']) ? esc_url_raw($atts['detail_url']) : '';

    ob_start();
    ?>
    <div class="csa-comic-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
        <?php foreach ($comics as $comic): ?>
            <?php $comicLink = $detailUrl ? csa_build_link($detailUrl, 'csa_comic', rawurlencode($comic['slug'])) : '?csa_comic=' . esc_attr(rawurlencode($comic['slug'])); ?>
            <div class="csa-comic-card" style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#fff;">
                <?php if (!empty($comic['cover_image_url'])): ?>
                    <img src="<?php echo esc_url($comic['cover_image_url']); ?>" alt="<?php echo esc_attr($comic['title']); ?>" style="width:100%;aspect-ratio:3/4;object-fit:cover;" loading="lazy" />
                <?php else: ?>
                    <div style="width:100%;aspect-ratio:3/4;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;">No Cover</div>
                <?php endif; ?>
                <div style="padding:0.75rem;">
                    <h3 style="margin:0 0 0.25rem;font-size:0.95rem;"><a href="<?php echo esc_url($comicLink); ?>"><?php echo esc_html($comic['title']); ?></a></h3>
                    <p style="margin:0;font-size:0.8rem;color:#666;"><?php echo esc_html($comic['status']); ?></p>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php if ($showPagination && $totalPages > 1): ?>
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
    $atts = shortcode_atts(['slug' => '', 'reader_url' => '', 'show_chapters' => 'true'], $atts, 'comic_detail');
    $slug = $atts['slug'] ?: ($_GET['csa_comic'] ?? '');
    $slug = sanitize_text_field($slug);
    if (empty($slug)) return '<p class="csa-error">No comic specified.</p>';

    $data = csa_api_get('/comics/' . rawurlencode($slug));
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
        <?php if (strtolower($atts['show_chapters']) !== 'false' && !empty($data['latestChapters'])): ?>
            <h3 style="margin-top:1.5rem;">Chapters</h3>
            <ul style="list-style:none;padding:0;">
                <?php foreach ($data['latestChapters'] as $ch): ?>
                    <?php $readerUrl = !empty($atts['reader_url']) ? esc_url_raw($atts['reader_url']) : ''; ?>
                    <?php $chapterLink = $readerUrl ? csa_build_link($readerUrl, 'csa_chapter', rawurlencode($ch['id'])) : '?csa_chapter=' . esc_attr(rawurlencode($ch['id'])); ?>
                    <li style="border:1px solid #ddd;border-radius:6px;padding:0.75rem;margin-bottom:0.5rem;">
                        <a href="<?php echo esc_url($chapterLink); ?>">
                            Chapter <?php echo esc_html($ch['number']); ?>
                            <?php if (!empty($ch['title'])): ?> - <?php echo esc_html($ch['title']); ?><?php endif; ?>
                        </a>
                        <span style="float:right;color:#999;font-size:0.85rem;">
                            <?php if (!empty($ch['published_at'])) echo esc_html(date('M j, Y', strtotime($ch['published_at']))); ?>
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
    $atts = shortcode_atts(['id' => '', 'show_nav' => 'true'], $atts, 'chapter_reader');
    $id = $atts['id'] ?: ($_GET['csa_chapter'] ?? '');
    $id = sanitize_text_field($id);
    if (empty($id)) return '<p class="csa-error">No chapter specified.</p>';

    $data = csa_api_get('/chapters/' . rawurlencode($id));
    if (is_wp_error($data)) return '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';

    ob_start();
    ?>
    <div class="csa-chapter-reader" style="max-width:800px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <?php if (strtolower($atts['show_nav']) !== 'false' && !empty($data['previousChapterId'])): ?>
                <a href="<?php echo esc_url(add_query_arg('csa_chapter', $data['previousChapterId'])); ?>">&laquo; Previous</a>
            <?php else: ?>
                <span></span>
            <?php endif; ?>
            <h2 style="margin:0;text-align:center;">
                <?php echo esc_html($data['comic']['title'] ?? ''); ?> - Chapter <?php echo esc_html($data['number'] ?? ''); ?>
                <?php if (!empty($data['title'])): ?>: <?php echo esc_html($data['title']); ?><?php endif; ?>
            </h2>
            <?php if (strtolower($atts['show_nav']) !== 'false' && !empty($data['nextChapterId'])): ?>
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
        <?php if (strtolower($atts['show_nav']) !== 'false'): ?>
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
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});

// ------------------------------------------------------------------
// Elementor Widgets
// ------------------------------------------------------------------
add_action('elementor/elements/categories_registered', function($elements_manager) {
    $elements_manager->add_category('csa-widgets', [
        'title' => 'Comic Storage API',
        'icon' => 'fa fa-book',
    ]);
});

add_action('elementor/widgets/register', function($widgets_manager) {
    if (!class_exists('\\Elementor\\Widget_Base')) return;

    class CSA_Elementor_Comic_List_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_comic_list'; }
        public function get_title() { return 'Comic List (CSA)'; }
        public function get_icon() { return 'eicon-posts-grid'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('query', ['label' => 'Query']);
            $this->add_control('category', ['label' => 'Category Slug', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('tag', ['label' => 'Tag Slug', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('series', ['label' => 'Series Slug', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('search', ['label' => 'Search', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('status', [
                'label' => 'Status',
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    '' => 'Any',
                    'ongoing' => 'Ongoing',
                    'completed' => 'Completed',
                    'hiatus' => 'Hiatus',
                ],
                'default' => '',
            ]);
            $this->add_control('page_size', ['label' => 'Page Size', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 20, 'min' => 1, 'max' => 50]);
            $this->add_control('show_pagination', [
                'label' => 'Show Pagination',
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]);
            $this->add_control('detail_url', [
                'label' => 'Comic Detail Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/comic',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $detailUrl = $s['detail_url']['url'] ?? '';
            $shortcode = '[comic_list'
                . ' category="' . esc_attr($s['category']) . '"'
                . ' tag="' . esc_attr($s['tag']) . '"'
                . ' series="' . esc_attr($s['series']) . '"'
                . ' search="' . esc_attr($s['search']) . '"'
                . ' status="' . esc_attr($s['status']) . '"'
                . ' page_size="' . esc_attr($s['page_size']) . '"'
                . ' show_pagination="' . ($s['show_pagination'] === 'yes' ? 'true' : 'false') . '"'
                . (!empty($detailUrl) ? ' detail_url="' . esc_attr($detailUrl) . '"' : '')
                . ']';
            echo do_shortcode($shortcode);
        }
    }

    class CSA_Elementor_Comic_Detail_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_comic_detail'; }
        public function get_title() { return 'Comic Detail (CSA)'; }
        public function get_icon() { return 'eicon-post-single'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('slug', ['label' => 'Comic Slug', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('show_chapters', [
                'label' => 'Show Chapters',
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]);
            $this->add_control('reader_url', [
                'label' => 'Chapter Reader Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/reader',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $readerUrl = $s['reader_url']['url'] ?? '';
            $shortcode = '[comic_detail'
                . ' slug="' . esc_attr($s['slug']) . '"'
                . ' show_chapters="' . ($s['show_chapters'] === 'yes' ? 'true' : 'false') . '"'
                . (!empty($readerUrl) ? ' reader_url="' . esc_attr($readerUrl) . '"' : '')
                . ']';
            echo do_shortcode($shortcode);
        }
    }

    class CSA_Elementor_Chapter_Reader_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_chapter_reader'; }
        public function get_title() { return 'Chapter Reader (CSA)'; }
        public function get_icon() { return 'eicon-gallery-grid'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('chapter_id', ['label' => 'Chapter ID', 'type' => \Elementor\Controls_Manager::TEXT]);
            $this->add_control('show_nav', [
                'label' => 'Show Navigation',
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $shortcode = '[chapter_reader'
                . ' id="' . esc_attr($s['chapter_id']) . '"'
                . ' show_nav="' . ($s['show_nav'] === 'yes' ? 'true' : 'false') . '"'
                . ']';
            echo do_shortcode($shortcode);
        }
    }

    class CSA_Elementor_Taxonomy_List_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_taxonomy_list'; }
        public function get_title() { return 'Taxonomy List (CSA)'; }
        public function get_icon() { return 'eicon-post-list'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('type', [
                'label' => 'Type',
                'type' => \Elementor\Controls_Manager::SELECT,
                'options' => [
                    'categories' => 'Categories',
                    'tags' => 'Tags',
                    'both' => 'Both',
                ],
                'default' => 'categories',
            ]);
            $this->add_control('limit', ['label' => 'Limit', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 50, 'min' => 1, 'max' => 200]);
            $this->add_control('target_url', [
                'label' => 'Target Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/comics',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $data = csa_api_get('/taxonomies');
            if (is_wp_error($data)) {
                echo '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';
                return;
            }
            $limit = intval($s['limit']);
            $targetUrl = $s['target_url']['url'] ?? '';
            echo '<div class="csa-taxonomy-list" style="display:flex;flex-wrap:wrap;gap:6px;">';
            if ($s['type'] === 'categories' || $s['type'] === 'both') {
                $categories = array_slice($data['categories'] ?? [], 0, $limit);
                foreach ($categories as $cat) {
                    $link = csa_build_link($targetUrl, 'csa_category', rawurlencode($cat['slug']));
                    echo '<a href="' . esc_url($link) . '" style="padding:4px 8px;border:1px solid #ddd;border-radius:12px;font-size:12px;">' . esc_html($cat['name']) . '</a>';
                }
            }
            if ($s['type'] === 'tags' || $s['type'] === 'both') {
                $tags = array_slice($data['tags'] ?? [], 0, $limit);
                foreach ($tags as $tag) {
                    $link = csa_build_link($targetUrl, 'csa_tag', rawurlencode($tag['slug']));
                    echo '<a href="' . esc_url($link) . '" style="padding:4px 8px;border:1px solid #eee;border-radius:12px;font-size:12px;background:#fafafa;">' . esc_html($tag['name']) . '</a>';
                }
            }
            echo '</div>';
        }
    }

    class CSA_Elementor_Series_List_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_series_list'; }
        public function get_title() { return 'Series List (CSA)'; }
        public function get_icon() { return 'eicon-folder'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('page_size', ['label' => 'Comics Page Size', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 50, 'min' => 1, 'max' => 50]);
            $this->add_control('limit', ['label' => 'Series Limit', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 50, 'min' => 1, 'max' => 200]);
            $this->add_control('target_url', [
                'label' => 'Target Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/comics',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $data = csa_api_get('/comics', ['pageSize' => intval($s['page_size'])]);
            if (is_wp_error($data)) {
                echo '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';
                return;
            }
            $seriesMap = [];
            foreach (($data['comics'] ?? []) as $comic) {
                if (!empty($comic['series']) && !empty($comic['series']['slug'])) {
                    $seriesMap[$comic['series']['slug']] = $comic['series']['title'];
                }
            }
            $targetUrl = $s['target_url']['url'] ?? '';
            $limit = intval($s['limit']);
            echo '<ul class="csa-series-list" style="list-style:none;padding:0;margin:0;">';
            $count = 0;
            foreach ($seriesMap as $slug => $title) {
                if ($count >= $limit) break;
                $link = csa_build_link($targetUrl, 'csa_series', rawurlencode($slug));
                echo '<li style="margin-bottom:6px;"><a href="' . esc_url($link) . '">' . esc_html($title) . '</a></li>';
                $count++;
            }
            echo '</ul>';
        }
    }

    class CSA_Elementor_Author_List_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_author_list'; }
        public function get_title() { return 'Author List (CSA)'; }
        public function get_icon() { return 'eicon-user-circle-o'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('page_size', ['label' => 'Comics Page Size', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 50, 'min' => 1, 'max' => 50]);
            $this->add_control('limit', ['label' => 'Author Limit', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 50, 'min' => 1, 'max' => 200]);
            $this->add_control('target_url', [
                'label' => 'Target Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/comics',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $data = csa_api_get('/comics', ['pageSize' => intval($s['page_size'])]);
            if (is_wp_error($data)) {
                echo '<p class="csa-error">' . esc_html($data->get_error_message()) . '</p>';
                return;
            }
            $authors = [];
            foreach (($data['comics'] ?? []) as $comic) {
                $author = trim((string)($comic['author_name'] ?? ''));
                if (!empty($author)) $authors[$author] = true;
            }
            $authors = array_keys($authors);
            sort($authors, SORT_NATURAL | SORT_FLAG_CASE);
            $targetUrl = $s['target_url']['url'] ?? '';
            $limit = intval($s['limit']);
            echo '<ul class="csa-author-list" style="list-style:none;padding:0;margin:0;">';
            $count = 0;
            foreach ($authors as $author) {
                if ($count >= $limit) break;
                $link = csa_build_link($targetUrl, 'csa_search', rawurlencode($author));
                echo '<li style="margin-bottom:6px;"><a href="' . esc_url($link) . '">' . esc_html($author) . '</a></li>';
                $count++;
            }
            echo '</ul>';
        }
    }

    class CSA_Elementor_Search_Widget extends \Elementor\Widget_Base {
        public function get_name() { return 'csa_search'; }
        public function get_title() { return 'Comic Search (CSA)'; }
        public function get_icon() { return 'eicon-search'; }
        public function get_categories() { return ['csa-widgets']; }
        protected function register_controls() {
            $this->start_controls_section('content', ['label' => 'Content']);
            $this->add_control('placeholder', ['label' => 'Placeholder', 'type' => \Elementor\Controls_Manager::TEXT, 'default' => 'ค้นหาคอมมิค...']);
            $this->add_control('target_url', [
                'label' => 'Target Page URL',
                'type' => \Elementor\Controls_Manager::URL,
                'placeholder' => 'https://example.com/comics',
            ]);
            $this->end_controls_section();
        }
        protected function render() {
            $s = $this->get_settings_for_display();
            $targetUrl = $s['target_url']['url'] ?? csa_current_url();
            echo '<form class="csa-search" method="get" action="' . esc_url($targetUrl) . '" style="display:flex;gap:6px;">';
            echo '<input type="text" name="csa_search" placeholder="' . esc_attr($s['placeholder']) . '" style="flex:1;padding:8px 10px;border:1px solid #ddd;border-radius:6px;" />';
            echo '<button type="submit" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;background:#111;color:#fff;">Search</button>';
            echo '</form>';
        }
    }

    $widgets_manager->register(new CSA_Elementor_Comic_List_Widget());
    $widgets_manager->register(new CSA_Elementor_Comic_Detail_Widget());
    $widgets_manager->register(new CSA_Elementor_Chapter_Reader_Widget());
    $widgets_manager->register(new CSA_Elementor_Taxonomy_List_Widget());
    $widgets_manager->register(new CSA_Elementor_Series_List_Widget());
    $widgets_manager->register(new CSA_Elementor_Author_List_Widget());
    $widgets_manager->register(new CSA_Elementor_Search_Widget());
});
