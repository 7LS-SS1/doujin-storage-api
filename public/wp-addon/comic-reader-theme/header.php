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

<a class="screen-reader-text skip-link" href="#main-content">
    <?php esc_html_e( 'Skip to content', 'comic-reader' ); ?>
</a>

<header class="crc-site-header" role="banner">
    <div class="crc-site-header__inner">

        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="crc-site-header__logo" rel="home">
            <?php bloginfo( 'name' ); ?>
        </a>

        <nav class="crc-site-header__nav" role="navigation" aria-label="<?php esc_attr_e( 'Primary Navigation', 'comic-reader' ); ?>">
            <?php if ( function_exists( 'crc_archive_url' ) ) : ?>
                <a href="<?php echo esc_url( crc_archive_url() ); ?>">
                    <?php esc_html_e( 'Comics', 'comic-reader' ); ?>
                </a>
            <?php endif; ?>

            <?php
            wp_nav_menu( [
                'theme_location'  => 'primary',
                'container'       => false,
                'items_wrap'      => '%3$s',
                'fallback_cb'     => false,
                'link_before'     => '',
                'link_after'      => '',
            ] );
            ?>
        </nav>

    </div>
</header>

<div id="main-content">
