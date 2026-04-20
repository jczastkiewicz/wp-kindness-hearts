<?php
/**
 * WordPress admin page for Kindness Hearts.
 * Shows: class management, school total, QR code for teachers.
 */

defined('ABSPATH') || exit;

class KHearts_Admin
{
    public static function add_menu(): void
    {
        add_menu_page(
            __('Kindness Hearts', 'kindness-hearts'),
            __('Kindness Hearts', 'kindness-hearts'),
            'manage_options',
            'kindness-hearts',
            [self::class, 'render_page'],
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#a0aec0" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'),
            30
        );
    }

    public static function enqueue_scripts(string $hook): void
    {
        if (! str_contains($hook, 'kindness-hearts')) {
            return;
        }

        // qr-code-styling — bundled locally (MIT, see assets/js/qr-code-styling.LICENSE.txt)
        // Supports rounded dots, styled corners, centre logo.
        wp_enqueue_script(
            'qr-code-styling',
            KHEARTS_PLUGIN_URL . 'assets/js/qr-code-styling.js',
            [],
            '1.6.0-rc.1',
            true
        );

        // Admin UI script — data injected via wp_localize_script below.
        wp_enqueue_script(
            'kindness-hearts-admin',
            KHEARTS_PLUGIN_URL . 'assets/js/admin.js',
            ['qr-code-styling'],
            KHEARTS_VERSION,
            true
        );

        wp_localize_script(
            'kindness-hearts-admin',
            'KH',
            [
                'restUrl' => esc_url_raw(rest_url('kindness/v1')),
                'nonce' => wp_create_nonce('wp_rest'),
                'siteUrl' => site_url(),
                'secretToken' => get_option('khearts_secret_token', ''),
                'schoolName' => get_option('khearts_school_name', get_bloginfo('name')),
            ]
        );
    }

    public static function render_page(): void
    {
        $token = get_option('khearts_secret_token', '');
        $app_path = site_url('/kindness-app/');
        $teacher_url = $app_path . '#/teacher?token=' . rawurlencode($token);
        $heart_url = $app_path . '#/heart';
        ?>
        <div class="wrap" id="kh-admin">
            <h1>&#x2764;&#xFE0F; <?php esc_html_e('Kindness Hearts', 'kindness-hearts'); ?></h1>

            <!-- ── Stats bar ─────────────────────────────────────────── -->
            <div id="kh-stats" style="display:flex;gap:20px;margin:16px 0;">
                <div style="background:#fff3cd;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-total-display">&hellip;</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e('School-wide points', 'kindness-hearts'); ?></div>
                </div>
                <div style="background:#d1ecf1;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-classes-count">&hellip;</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e('Classes', 'kindness-hearts'); ?></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:960px;">

                <!-- ── Classes ─────────────────────────────────────── -->
                <div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="margin-top:0;"><?php esc_html_e('Classes', 'kindness-hearts'); ?></h2>

                    <form id="kh-add-class-form" style="display:flex;gap:8px;margin-bottom:16px;">
                        <input type="text" id="kh-class-name"
                               placeholder="<?php esc_attr_e('e.g. Class 3B', 'kindness-hearts'); ?>"
                               style="flex:1;padding:8px 12px;border:1px solid #ccc;border-radius:4px;" required />
                        <button type="submit" class="button button-primary">
                            <?php esc_html_e('Add Class', 'kindness-hearts'); ?>
                        </button>
                    </form>

                    <table class="wp-list-table widefat fixed striped" id="kh-classes-table">
                        <thead><tr>
                            <th><?php esc_html_e('Class', 'kindness-hearts'); ?></th>
                            <th style="width:90px;text-align:center;"><?php esc_html_e('Points', 'kindness-hearts'); ?></th>
                            <th style="width:80px;"></th>
                        </tr></thead>
                        <tbody id="kh-classes-body">
                            <tr><td colspan="3"><?php esc_html_e('Loading&hellip;', 'kindness-hearts'); ?></td></tr>
                        </tbody>
                    </table>

                    <p style="margin-top:16px;">
                        <button class="button button-secondary" id="kh-reset-btn" style="color:#c0392b;border-color:#c0392b;">
                            &#x1F504; <?php esc_html_e('Reset all points to zero', 'kindness-hearts'); ?>
                        </button>
                    </p>
                </div>

                <!-- ── QR Code ──────────────────────────────────────── -->
                <div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="margin-top:0;"><?php esc_html_e('Teacher App QR Code', 'kindness-hearts'); ?></h2>
                    <p style="color:#555;font-size:.9rem;">
                        <?php esc_html_e('Print this QR code and give it only to teachers.', 'kindness-hearts'); ?>
                    </p>

                    <!-- QR renders here -->
                    <div id="kh-qrcode" style="margin:16px 0;line-height:0;"></div>

                    <p style="word-break:break-all;font-size:.8rem;color:#666;background:#f9f9f9;padding:8px;border-radius:4px;margin-bottom:12px;">
                        <strong><?php esc_html_e('App URL:', 'kindness-hearts'); ?></strong><br>
                        <a href="<?php echo esc_url($teacher_url); ?>" target="_blank">
                            <?php echo esc_html($teacher_url); ?>
                        </a>
                    </p>

                    <p style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
                        <button class="button button-primary" id="kh-print-btn">
                            &#x1F5A8;&#xFE0F; <?php esc_html_e('Print poster for teachers', 'kindness-hearts'); ?>
                        </button>
                        <button class="button button-secondary" id="kh-download-btn">
                            &#x2B07;&#xFE0F; <?php esc_html_e('Download QR PNG', 'kindness-hearts'); ?>
                        </button>
                        <button class="button button-secondary" id="kh-regen-token-btn">
                            &#x1F511; <?php esc_html_e('Regenerate token', 'kindness-hearts'); ?>
                        </button>
                        <a href="<?php echo esc_url($heart_url); ?>" target="_blank" class="button button-secondary">
                            &#x2764;&#xFE0F; <?php esc_html_e('Open Heart Display', 'kindness-hearts'); ?>
                        </a>
                    </p>
                </div>
            </div>
        </div>
        <?php
    }
}
