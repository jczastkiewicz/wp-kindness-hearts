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
        // qr-code-styling — supports rounded dots, styled corners, centre logo
        wp_enqueue_script(
            'qr-code-styling',
            'https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js',
            [],
            '1.6.0',
            true
        );
    }

    public static function render_page(): void {
        $token       = get_option( 'kh_secret_token', '' );
        $school_name = get_option( 'kh_school_name', get_bloginfo( 'name' ) );
        $app_path    = site_url( '/kindness-app/' );
        $teacher_url = $app_path . '#/teacher?token=' . rawurlencode( $token );
        $heart_url   = $app_path . '#/heart';
        ?>
        <div class="wrap" id="kh-admin">
            <h1>❤️ <?php esc_html_e( 'Kindness Hearts', 'kindness-hearts' ); ?></h1>

            <!-- ── Stats bar ─────────────────────────────────────────── -->
            <div id="kh-stats" style="display:flex;gap:20px;margin:16px 0;">
                <div style="background:#fff3cd;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-total-display">…</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e( 'School-wide points', 'kindness-hearts' ); ?></div>
                </div>
                <div style="background:#d1ecf1;padding:16px 24px;border-radius:8px;min-width:140px;text-align:center;">
                    <div style="font-size:2rem;font-weight:700;" id="kh-classes-count">…</div>
                    <div style="color:#555;font-size:.85rem;"><?php esc_html_e( 'Classes', 'kindness-hearts' ); ?></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:960px;">

                <!-- ── Classes ─────────────────────────────────────── -->
                <div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="margin-top:0;"><?php esc_html_e( 'Classes', 'kindness-hearts' ); ?></h2>

                    <form id="kh-add-class-form" style="display:flex;gap:8px;margin-bottom:16px;">
                        <input type="text" id="kh-class-name"
                               placeholder="<?php esc_attr_e( 'e.g. Class 3B', 'kindness-hearts' ); ?>"
                               style="flex:1;padding:8px 12px;border:1px solid #ccc;border-radius:4px;" required />
                        <button type="submit" class="button button-primary">
                            <?php esc_html_e( 'Add Class', 'kindness-hearts' ); ?>
                        </button>
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
                        <?php esc_html_e( 'Print this QR code and give it only to teachers.', 'kindness-hearts' ); ?>
                    </p>

                    <!-- QR renders here -->
                    <div id="kh-qrcode" style="margin:16px 0;line-height:0;"></div>

                    <p style="word-break:break-all;font-size:.8rem;color:#666;background:#f9f9f9;padding:8px;border-radius:4px;">
                        <strong><?php esc_html_e( 'App URL:', 'kindness-hearts' ); ?></strong><br>
                        <a href="<?php echo esc_url( $teacher_url ); ?>" target="_blank">
                            <?php echo esc_html( $teacher_url ); ?>
                        </a>
                    </p>

                    <p style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
                        <button class="button button-primary" id="kh-print-btn">
                            🖨️ <?php esc_html_e( 'Print poster for teachers', 'kindness-hearts' ); ?>
                        </button>
                        <button class="button button-secondary" id="kh-download-btn">
                            ⬇️ <?php esc_html_e( 'Download QR PNG', 'kindness-hearts' ); ?>
                        </button>
                        <button class="button button-secondary" id="kh-regen-token-btn">
                            🔑 <?php esc_html_e( 'Regenerate token', 'kindness-hearts' ); ?>
                        </button>
                        <a href="<?php echo esc_url( $heart_url ); ?>" target="_blank" class="button button-secondary">
                            ❤️ <?php esc_html_e( 'Open Heart Display', 'kindness-hearts' ); ?>
                        </a>
                    </p>
                </div>
            </div>
        </div>

        <script>
        (function () {
            const api        = KH.restUrl;
            const nonce      = KH.nonce;
            const headers    = { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce };
            const teacherUrl = KH.siteUrl + '/kindness-app/#/teacher?token=' + encodeURIComponent(KH.secretToken);
            const schoolName = <?php echo wp_json_encode( $school_name ); ?>;

            // ── Solid heart SVG as data URL (centre logo) ────────────────
            const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="22" fill="white"/>
              <g transform="translate(4,6) scale(3.85)">
                <path fill="#e53e3e" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                  2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                  C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                  c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </g>
            </svg>`;
            const heartDataUrl = 'data:image/svg+xml;base64,' + btoa(heartSvg);

            // ── Build styled QR code ─────────────────────────────────────
            let qrStyling = null;

            function buildQR(container, size) {
                container.innerHTML = '';
                const qr = new QRCodeStyling({
                    width:  size,
                    height: size,
                    type:   'canvas',
                    data:   teacherUrl,
                    image:  heartDataUrl,
                    dotsOptions: {
                        type:  'rounded',
                        color: '#000000',
                    },
                    backgroundOptions: {
                        color: '#ffffff',
                    },
                    cornersSquareOptions: {
                        type:  'extra-rounded',
                        color: '#000000',
                    },
                    cornersDotOptions: {
                        type:  'dot',
                        color: '#000000',
                    },
                    imageOptions: {
                        crossOrigin: 'anonymous',
                        margin:      6,
                        imageSize:   0.28,
                    },
                    qrOptions: {
                        errorCorrectionLevel: 'H',   // H = 30% can be covered by logo
                    },
                });
                qr.append(container);
                return qr;
            }

            function initQR() {
                if (typeof QRCodeStyling === 'undefined') { setTimeout(initQR, 100); return; }
                qrStyling = buildQR(document.getElementById('kh-qrcode'), 220);
            }
            initQR();

            // ── Get QR canvas data URL ────────────────────────────────────
            function getQRDataUrl(callback) {
                // Build a fresh high-res version for export
                const tmp = document.createElement('div');
                tmp.style.cssText = 'position:fixed;left:-9999px;top:0;';
                document.body.appendChild(tmp);
                const tmpQR = new QRCodeStyling({
                    width:  600,
                    height: 600,
                    type:   'canvas',
                    data:   teacherUrl,
                    image:  heartDataUrl,
                    dotsOptions:         { type: 'rounded',       color: '#000000' },
                    backgroundOptions:   { color: '#ffffff' },
                    cornersSquareOptions:{ type: 'extra-rounded', color: '#000000' },
                    cornersDotOptions:   { type: 'dot',           color: '#000000' },
                    imageOptions:        { crossOrigin: 'anonymous', margin: 4, imageSize: 0.38 },
                    qrOptions:           { errorCorrectionLevel: 'H' },
                });
                tmpQR.append(tmp);
                // Wait for image to load inside the QR library
                setTimeout(() => {
                    const canvas = tmp.querySelector('canvas');
                    const dataUrl = canvas ? canvas.toDataURL('image/png') : '';
                    document.body.removeChild(tmp);
                    callback(dataUrl);
                }, 600);
            }

            // ── Download PNG ─────────────────────────────────────────────
            document.getElementById('kh-download-btn').addEventListener('click', () => {
                getQRDataUrl(dataUrl => {
                    const a = document.createElement('a');
                    a.href     = dataUrl;
                    a.download = 'kindness-hearts-qr.png';
                    a.click();
                });
            });

            // ── Print poster ─────────────────────────────────────────────
            document.getElementById('kh-print-btn').addEventListener('click', () => {
                getQRDataUrl(dataUrl => openPrintPoster(dataUrl));
            });

            function openPrintPoster(qrDataUrl) {
                const win = window.open('', '_blank', 'width=720,height=960');
                win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kindness Hearts – Teacher QR Code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 32px 24px;
    }
    .poster {
      width: 100%;
      max-width: 560px;
      border: 3px solid #e53e3e;
      border-radius: 28px;
      padding: 44px 40px 36px;
      text-align: center;
    }
    .heart-icon  { font-size: 4rem; line-height: 1; margin-bottom: 10px; }
    .school      { font-size: .9rem; color: #718096; font-weight: 700;
                   letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
    h1           { font-size: 2.2rem; font-weight: 800; color: #c0392b; margin-bottom: 8px; }
    .tagline     { font-size: 1rem; color: #4a5568; margin-bottom: 28px; line-height: 1.5; }
    .qr-wrap     { display: inline-block; padding: 16px; border: 2px solid #fed7d7;
                   border-radius: 20px; margin-bottom: 28px; }
    .qr-wrap img { display: block; width: 280px; height: 280px; }
    .divider     { border: none; border-top: 1px dashed #fed7d7; margin: 0 0 24px; }
    .steps       { text-align: left; margin-bottom: 24px; }
    .steps h2    { font-size: .8rem; font-weight: 700; color: #c0392b;
                   text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px; }
    .step        { display: flex; gap: 12px; align-items: flex-start;
                   margin-bottom: 12px; font-size: .95rem; color: #2d3748; line-height: 1.4; }
    .step-num    { background: #e53e3e; color: #fff; border-radius: 50%;
                   min-width: 26px; height: 26px; display: flex; align-items: center;
                   justify-content: center; font-size: .82rem; font-weight: 700; margin-top: 1px; }
    .warning     { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 12px;
                   padding: 14px 18px; font-size: .88rem; color: #c53030; }
    .warning strong { display: block; margin-bottom: 3px; font-size: .95rem; }
    @media print {
      body { padding: 0; min-height: unset; }
      .poster { max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="poster">
  <div class="heart-icon">❤️</div>
  <div class="school">${escHtml(schoolName)}</div>
  <h1>Kindness Hearts</h1>
  <p class="tagline">Scan to award kindness points<br>when a pupil helps a classmate</p>

  <div class="qr-wrap">
    <img src="${qrDataUrl}" alt="QR Code for teacher app" />
  </div>

  <hr class="divider">

  <div class="steps">
    <h2>How to use</h2>
    <div class="step"><div class="step-num">1</div><div>Scan the QR code with your phone camera</div></div>
    <div class="step"><div class="step-num">2</div><div>Select your class from the dropdown</div></div>
    <div class="step"><div class="step-num">3</div><div>Tap ❤️ each time a pupil helps a classmate</div></div>
    <div class="step"><div class="step-num">4</div><div>Watch the heart on the class screen fill up!</div></div>
  </div>

  <div class="warning">
    <strong>🔒 For teachers only</strong>
    Please do not share this QR code with pupils.
  </div>
</div>
<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`);
                win.document.close();
            }

            // ── Load data ────────────────────────────────────────────────
            function loadData() {
                Promise.all([
                    fetch(api + '/classes').then(r => r.json()),
                    fetch(api + '/total').then(r => r.json()),
                ]).then(([classes, total]) => {
                    document.getElementById('kh-total-display').textContent = total.total;
                    document.getElementById('kh-classes-count').textContent = classes.length;
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
                        fetch(api + '/classes/' + btn.dataset.id, { method: 'DELETE', headers }).then(loadData);
                    });
                });
            }

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

            document.getElementById('kh-reset-btn').addEventListener('click', () => {
                if (!confirm('Reset ALL points to zero? This cannot be undone.')) return;
                fetch(api + '/reset', { method: 'POST', headers }).then(loadData);
            });

            document.getElementById('kh-regen-token-btn').addEventListener('click', () => {
                if (!confirm('This will invalidate the old QR code. Continue?')) return;
                fetch(api + '/token/regenerate', { method: 'POST', headers })
                    .then(r => r.json())
                    .then(() => location.reload());
            });

            function escHtml(s) {
                return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            }

            loadData();
        })();
        </script>
        <?php
    }
}
