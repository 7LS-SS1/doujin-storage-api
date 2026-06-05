<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
$site_name     = get_bloginfo( 'name' );
$primary_label = function_exists( 'crc_theme_primary_label' ) ? crc_theme_primary_label() : $site_name;
$archive_url   = function_exists( 'crc_theme_archive_endpoint' ) ? crc_theme_archive_endpoint() : home_url( '/' );
?>

<a class="screen-reader-text skip-link" href="#main-content">
    <?php esc_html_e( 'Skip to content', 'comic-reader' ); ?>
</a>

<header class="crc-site-header" role="banner">
    <div class="crc-container crc-site-header__top">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="crc-site-header__logo" rel="home">
            <?php echo esc_html( $primary_label . ' ' . $site_name ); ?>
        </a>

        <form class="crc-site-header__search" method="get" action="<?php echo esc_url( $archive_url ); ?>">
            <input
                type="search"
                name="s"
                class="crc-site-header__search-input"
                value="<?php echo esc_attr( (string) get_query_var( 's' ) ); ?>"
                placeholder="<?php esc_attr_e( 'Search...', 'comic-reader' ); ?>"
            />
            <button type="submit" class="crc-site-header__search-button">
                <?php esc_html_e( 'Go', 'comic-reader' ); ?>
            </button>
        </form>
    </div>

    <div class="crc-site-header__nav-wrap">
        <div class="crc-container crc-site-header__nav-inner">
            <button
                type="button"
                class="crc-site-header__toggle"
                data-crc-nav-toggle
                aria-expanded="false"
                aria-controls="crc-primary-nav"
            >
                <span aria-hidden="true">☰</span>
                <span class="screen-reader-text"><?php esc_html_e( 'Toggle navigation', 'comic-reader' ); ?></span>
            </button>

            <nav class="crc-site-header__nav" id="crc-primary-nav" data-crc-nav-shell aria-label="<?php esc_attr_e( 'Primary Navigation', 'comic-reader' ); ?>">
                <ul class="crc-site-header__menu">
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'หน้าแรก', 'comic-reader' ); ?></a></li>
                    <li><a href="<?php echo esc_url( $archive_url ); ?>"><?php esc_html_e( 'รายชื่อการ์ตูน', 'comic-reader' ); ?></a></li>
                    <li><a href="<?php echo esc_url( add_query_arg( 'status', 'ongoing', $archive_url ) ); ?>"><?php esc_html_e( 'การ์ตูนมาใหม่', 'comic-reader' ); ?></a></li>
                    <li><a href="<?php echo esc_url( add_query_arg( 'tag', 'action', $archive_url ) ); ?>"><?php esc_html_e( 'หมวดแนะนำ', 'comic-reader' ); ?></a></li>
                    <?php
                    wp_nav_menu(
                        [
                            'theme_location' => 'primary',
                            'container'      => false,
                            'items_wrap'     => '%3$s',
                            'fallback_cb'    => false,
                            'depth'          => 1,
                        ]
                    );
                    ?>
                </ul>
            </nav>
        </div>
    </div>
</header>

<div id="main-content">
