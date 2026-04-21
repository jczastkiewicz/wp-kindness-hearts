<?php
/**
 * Frontend handler — serves the React PWA at /kindness-app/.
 *
 * WordPress creates a virtual route so no actual WP page is needed.
 * The React app dist/ files are enqueued and a minimal HTML shell is rendered.
 */

defined('ABSPATH') || exit;

class KHearts_Frontend
{
    /** Register the khearts_class CPT (lightweight, no public archive needed). */
    public static function register_cpt(): void
    {
        register_post_type('khearts_class', [
            'label' => __('Kindness Class', 'kindness-hearts'),
            'public' => false,
            'show_ui' => false,
            'show_in_rest' => false, // We expose via our own REST routes
            'supports' => ['title'],
            'rewrite' => false,
        ]);
    }

    /**
     * Add a WP query var so we can detect the virtual route.
     *
     * @param array<string> $vars
     * @return array<string>
     */
    public static function add_query_vars(array $vars): array
    {
        $vars[] = 'kindness_app';

        return $vars;
    }

    /** Register rewrite rule: /kindness-app/  →  ?kindness_app=1 */
    public static function register_rewrite(): void
    {
        add_rewrite_rule('^kindness-app/?$', 'index.php?kindness_app=1', 'top');
    }

    /**
     * If the current request matches our virtual page, output the app shell
     * and exit — WordPress never renders a theme template.
     */
    public static function maybe_serve_app(): void
    {
        if (! get_query_var('kindness_app')) {
            return;
        }

        $dist_url = KHEARTS_APP_URL;

        // Read Vite manifest to get correct hashed asset filenames.
        $manifest_path = KHEARTS_PLUGIN_DIR . 'app/dist/.vite/manifest.json';
        $js_file = 'assets/index.js';
        $css_file = '';

        if (file_exists($manifest_path)) {
            $content = file_get_contents($manifest_path); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            if ($content !== false) {
                $manifest = json_decode($content, true);
                if (is_array($manifest)) {
                    // Vite uses 'index.html' as entry key when input is index.html
                    $entry_key = isset($manifest['index.html']) ? 'index.html' : 'src/main.jsx';
                    if (isset($manifest[ $entry_key ]) && is_array($manifest[ $entry_key ])) {
                        $entry = $manifest[ $entry_key ];
                        $js_file = $entry['file'] ?? $js_file;
                        $css_file = $entry['css'][0] ?? '';
                    }
                }
            }
        }

        $school_name = get_option('khearts_school_name', 'Kindness Hearts');

        // Security headers — this route bypasses the normal WordPress template
        // stack, so we set them explicitly rather than relying on theme/plugin
        // filters that would otherwise run.
        header('Content-Type: text/html; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header("Content-Security-Policy: frame-ancestors 'self'");
        // The teacher URL contains the secret token in the hash fragment (which
        // browsers don't send) but also sometimes in the query string on the
        // very first QR scan. Strip referrers so the token cannot leak via
        // outbound links.
        header('Referrer-Policy: no-referrer');
        ?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr(str_replace('_', '-', get_locale())); ?>">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#e53e3e" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="referrer" content="no-referrer" />
    <title><?php echo esc_html($school_name); ?></title>
    <link rel="manifest" href="<?php echo esc_url($dist_url . 'manifest.json'); ?>" />
    <link rel="icon" href="<?php echo esc_url($dist_url . 'heart-192.png'); ?>" />
    <?php if ($css_file) : ?>
    <link rel="stylesheet" href="<?php echo esc_url($dist_url . $css_file); ?>" />
    <?php endif; ?>
</head>
<body>
    <div id="root"></div>
    <script>window.WP_CONFIG = <?php echo wp_json_encode(['restUrl' => esc_url_raw(rest_url('kindness/v1')), 'nonce' => wp_create_nonce('wp_rest'), 'siteUrl' => site_url()]); ?>;</script>
    <script type="module" src="<?php echo esc_url($dist_url . $js_file); ?>"></script>
</body>
</html>
        <?php
        exit;
    }
}
