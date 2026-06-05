</div><!-- #main-content -->

<footer class="crc-site-footer" role="contentinfo">
    <div class="crc-container crc-site-footer__inner">
        <p class="crc-site-footer__copy">
            Copyright &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> -
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>
        </p>

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
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
