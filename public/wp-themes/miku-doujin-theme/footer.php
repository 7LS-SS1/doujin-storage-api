</div><!-- #main-content -->

<footer class="crc-site-footer" role="contentinfo">
    <div class="crc-container crc-site-footer__inner">
        <?php
        wp_nav_menu(
            [
                'theme_location' => 'footer',
                'container'      => false,
                'items_wrap'     => '<nav class="crc-site-footer__nav" aria-label="' . esc_attr__( 'Footer Navigation', 'comic-reader' ) . '"><ul class="crc-site-footer__menu">%3$s</ul></nav>',
                'fallback_cb'    => false,
                'depth'          => 1,
            ]
        );
        ?>

        <p class="crc-site-footer__copy">
            &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?>
            <?php bloginfo( 'name' ); ?>
        </p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
