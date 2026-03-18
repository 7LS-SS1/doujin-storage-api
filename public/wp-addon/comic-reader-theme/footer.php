</div><!-- #main-content -->

<footer class="crc-site-footer" role="contentinfo">
    <div class="crc-container">
        <?php
        wp_nav_menu( [
            'theme_location' => 'footer',
            'container'      => false,
            'items_wrap'     => '<nav class="crc-site-footer__nav" aria-label="' . esc_attr__( 'Footer Navigation', 'comic-reader' ) . '">%3$s</nav>',
            'fallback_cb'    => false,
        ] );
        ?>
        <p>
            &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?>
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>.
            <?php esc_html_e( 'All rights reserved.', 'comic-reader' ); ?>
        </p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
