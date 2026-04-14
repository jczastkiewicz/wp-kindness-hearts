<?php
/**
 * WordPress admin page for Kindness Hearts.
 * Shows: class management, school total, QR code for teachers.
 */

defined( 'ABSPATH' ) || exit;

class KH_Admin {

    public static function add_menu(): void {
        add_menu_page(
            __( 'Kindness Hearts', 'kindness-hearts' ),
            __( 'Kindness Hearts', 'kindness-hearts' ),
            'manage_options',
            'kindness-hearts',
            [ self::class, 'render_page' ],
            'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#a0aec0" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' ),
            30
        );
    }

    public static function enqueue_scripts( string $hook ): void {
        if ( ! str_contains( $hook, 'kindness-hearts' ) ) {
            return;
        }
        // QR code library from CDN
        wp_enqueue_script(
            'qrcodejs',
            'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
            [],
            '1.0.0',
            true
        );
    }

    public static function render_page(): void {
        $token      = get_option( 'kh_secret_token', '' );
        $app_path   = site_url( '/kindness-app/' );
        $teacher_url = $app_path . '#/teacher?token=' . rawurlencode( $token );
        $heart_url   = $app_path . '#/heart';
        ?>
        <div class="wrap" id="kh-admin">
            <h1>❤️ <?php esc_html_e( 'Kindness Hearts', 'kindness-hearts' ); ?></h1>

            <!-- ── Stats bar ─────────────────────────────────────────── -->
            <div id="kh-stats" style="display:flex;gap:20px;margin:16px 0;">
                <div class="kh-stat-card" style="background:#fff3cd;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-total-display">…</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e( 'School-wide points', 'kindness-hearts' ); ?></div>
                </div>
                <div class="kh-stat-card" style="background:#d1ecf1;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-classes-count">…</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e( 'Classes', 'kindness-hearts' ); ?></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:960px;">

                <!-- ── Classes ─────────────────────────────────────── -->
                <div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="margin-top:0;"><?php esc_html_e( 'Classes', 'kindness-hearts' ); ?></h2>

                    <form id="kh-add-class-form" style="display:flex;gap:8px;margin-bottom:16px;">
                        <input type="text" id="kh-class-name" placeholder="<?php esc_attr_e( 'e.g. Class 3B', 'kindness-hearts' ); ?>"
                               style="flex:1;padding:8px 12px;border:1px solid #ccc;border-radius:4px;" required />
                        <button type="submit" class="button button-primary"><?php esc_html_e( 'Add Class', 'kindness-hearts' ); ?></button>
                    </form>

                    <table class="wp-list-table widefat fixed striped" id="kh-classes-table">
                        <thead><tr>
                            <th><?php esc_html_e( 'Class', 'kindness-hearts' ); ?></th>
                            <th style="width:90px;text-align:center;"><?php esc_html_e( 'Points', 'kindness-hearts' ); ?></th>
                            <th style="width:80px;"></th>
                        </tr></thead>
                        <tbody id="kh-classes-body">
                            <tr><td colspan="3"><?php esc_html_e( 'Loading…', 'kindness-hearts' ); ?></td></tr>
                        </tbody>
                    </table>

                    <p style="margin-top:16px;">
                        <button class="button button-secondary" id="kh-reset-btn" style="color:#c0392b;border-color:#c0392b;">
                            🔄 <?php esc_html_e( 'Reset all points to zero', 'kindness-hearts' ); ?>
                        </button>
                    </p>
                </div>

                <!-- ── QR Code ──────────────────────────────────────── -->
                <div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="margin-top:0;"><?php esc_html_e( 'Teacher App QR Code', 'kindness-hearts' ); ?></h2>
                    <p style="color:#555;font-size:.9rem;">
                        <?php esc_html_e( 'Print this QR code and give it only to teachers. Scanning it opens the app where they can award kindness points.', 'kindness-hearts' ); ?>
                    </p>
                    <div id="kh-qrcode" style="margin:16px 0;"></div>

                    <p style="word-break:break-all;font-size:.8rem;color:#666;background:#f9f9f9;padding:8px;border-radius:4px;">
                        <strong><?php esc_html_e( 'App URL:', 'kindness-hearts' ); ?></strong><br>
                        <a href="<?php echo esc_url( $teacher_url ); ?>" target="_blank"><?php echo esc_html( $teacher_url ); ?></a>
                    </p>

                    <p>
                        <button class="button button-secondary" id="kh-regen-token-btn">
                            🔑 <?php esc_html_e( 'Regenerate secret token', 'kindness-hearts' ); ?>
                        </button>
                        &nbsp;
                        <a href="<?php echo esc_url( $heart_url ); ?>" target="_blank" class="button button-secondary">
                            ❤️ <?php esc_html_e( 'Open Heart Display', 'kindness-hearts' ); ?>
                        </a>
                    </p>
                </div>
            </div>
        </div>

        <script>
        (function () {
            const api    = KH.restUrl;
            const nonce  = KH.nonce;
            const headers = { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce };

            // ── Build QR code ────────────────────────────────────────────
            const teacherUrl = KH.siteUrl + '/kindness-app/#/teacher?token=' + encodeURIComponent(KH.secretToken);
            new QRCode(document.getElementById('kh-qrcode'), {
                text:   teacherUrl,
                width:  200,
                height: 200,
                colorDark:  '#c0392b',
                colorLight: '#ffffff',
            });

            // ── Load data ────────────────────────────────────────────────
            function loadData() {
                Promise.all([
                    fetch(api + '/classes').then(r => r.json()),
                    fetch(api + '/total').then(r => r.json()),
                ]).then(([classes, total]) => {
                    document.getElementById('kh-total-display').textContent  = total.total;
                    document.getElementById('kh-classes-count').textContent  = classes.length;
                    renderClasses(classes);
                });
            }

            function renderClasses(classes) {
                const tbody = document.getElementById('kh-classes-body');
                if (!classes.length) {
                    tbody.innerHTML = '<tr><td colspan="3">No classes yet. Add one above.</td></tr>';
                    return;
                }
                tbody.innerHTML = classes.map(c => `
                    <tr>
                        <td>${escHtml(c.name)}</td>
                        <td style="text-align:center;font-weight:700;">${c.points}</td>
                        <td><button class="button button-small kh-del-btn" data-id="${c.id}">Delete</button></td>
                    </tr>
                `).join('');

                tbody.querySelectorAll('.kh-del-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!confirm('Delete this class and its points?')) return;
                        fetch(api + '/classes/' + btn.dataset.id, {
                            method: 'DELETE', headers,
                        }).then(loadData);
                    });
                });
            }

            // ── Add class ────────────────────────────────────────────────
            document.getElementById('kh-add-class-form').addEventListener('submit', e => {
                e.preventDefault();
                const name = document.getElementById('kh-class-name').value.trim();
                if (!name) return;
                fetch(api + '/classes', {
                    method: 'POST', headers,
                    body: JSON.stringify({ name }),
                }).then(() => {
                    document.getElementById('kh-class-name').value = '';
                    loadData();
                });
            });

            // ── Reset all ────────────────────────────────────────────────
            document.getElementById('kh-reset-btn').addEventListener('click', () => {
                if (!confirm('Reset ALL points to zero? This cannot be undone.')) return;
                fetch(api + '/reset', { method: 'POST', headers }).then(loadData);
            });

            // ── Regenerate token ─────────────────────────────────────────
            document.getElementById('kh-regen-token-btn').addEventListener('click', () => {
                if (!confirm('This will invalidate the old QR code. Continue?')) return;
                fetch(api + '/token/regenerate', { method: 'POST', headers })
                    .then(r => r.json())
                    .then(() => location.reload());
            });

            function escHtml(s) {
                return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }

            loadData();
        })();
        </script>
        <?php
    }
}
