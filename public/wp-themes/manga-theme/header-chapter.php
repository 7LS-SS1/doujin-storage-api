<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="screen-reader-text skip-link" href="#crc-images">
    <?php esc_html_e( 'Skip to chapter images', 'comic-reader' ); ?>
</a>
<?php
// Minimal header for the chapter reader — no top site nav bar, just loads WP head.
// The chapter reader template provides its own navigation bar.
?>
