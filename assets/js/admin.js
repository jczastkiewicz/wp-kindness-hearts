/**
 * Kindness Hearts — admin page UI
 *
 * Data is injected by wp_localize_script() as window.KH:
 *   KH.restUrl     – REST API base URL (kindness/v1)
 *   KH.nonce       – wp_rest nonce
 *   KH.siteUrl     – home URL
 *   KH.secretToken – teacher QR token (admin-only page, manage_options required)
 *   KH.schoolName  – display name
 */
/* global KH, QRCodeStyling */
(function () {
    'use strict';

    const api        = KH.restUrl;
    const nonce      = KH.nonce;
    const headers    = { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce };
    let teacherUrl    = null; // constructed after fetching admin-only token
    const schoolName = KH.schoolName;
    // Translatable strings provided by PHP via wp_localize_script. Defensive
    // fallbacks are English so the page remains usable if the localize call
    // is missing for any reason.
    const i18n = (KH && KH.i18n) || {};
    function t(key, fallback) {
        return Object.prototype.hasOwnProperty.call(i18n, key) ? i18n[key] : fallback;
    }

    // ── Solid heart SVG as data URL (centre logo) ────────────────────────────
    const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="22" fill="white"/>
      <g transform="translate(4,6) scale(3.85)">
        <path fill="#e53e3e" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
          C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
          c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </g>
    </svg>`;
    const heartDataUrl = 'data:image/svg+xml;base64,' + btoa( heartSvg );

    // ── Build styled QR code ─────────────────────────────────────────────────
    let qrStyling = null;

    function buildQR( container, size ) {
        container.innerHTML = '';
        const qr = new QRCodeStyling( {
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
                errorCorrectionLevel: 'H', // H = 30% can be covered by logo
            },
        } );
        qr.append( container );
        return qr;
    }

    let initQrTries = 0;
    const INIT_QR_MAX = 30;
    function initQR() {
        if ( typeof QRCodeStyling === 'undefined' ) {
            initQrTries++;
            if (initQrTries > INIT_QR_MAX) {
                const el = document.getElementById('kh-qrcode');
                el.textContent = '';
                const div = document.createElement('div');
                div.style.color = '#c0392b';
                div.textContent = t('qrLibFailed', 'QR library failed to load — please check your connection.');
                el.appendChild(div);
                return;
            }
            setTimeout( initQR, 100 );
            return;
        }
        // Fetch the admin-only secret token lazily and then build the QR using it.
        apiFetch('/token', { method: 'GET' })
            .then( data => {
                teacherUrl = KH.siteUrl + '/kindness-app/#/teacher?token=' + encodeURIComponent( data.token );
                qrStyling = buildQR( document.getElementById( 'kh-qrcode' ), 220 );
            } )
            .catch( e => {
                // If token fetch fails show an explanatory message in the QR area.
                const el = document.getElementById('kh-qrcode');
                el.textContent = '';
                const div = document.createElement('div');
                div.style.color = '#c0392b';
                div.textContent = t('tokenFetchFailed', 'Unable to load teacher QR token.');
                el.appendChild(div);
                console.error(e);
            });
    }
    initQR();

    // Small helper that wraps fetch and surfaces errors to the UI.
    function apiFetch(path, opts = {}) {
        return fetch(api + path, Object.assign({ headers }, opts))
            .then(r => (r.ok ? r.json() : r.text().then(t => { throw new Error(t || r.statusText); })))
            .catch(err => {
                // Lightweight feedback for admins — non-blocking but visible.
                alert(err.message || t('requestFailed', 'Request failed'));
                throw err;
            });
    }

    // ── Get QR canvas data URL ───────────────────────────────────────────────
    function getQRDataUrl( callback ) {
        // Build a fresh high-res version for export
        const tmp = document.createElement( 'div' );
        tmp.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild( tmp );
        const tmpQR = new QRCodeStyling( {
            width:  600,
            height: 600,
            type:   'canvas',
            data:   teacherUrl,
            image:  heartDataUrl,
            dotsOptions:          { type: 'rounded',       color: '#000000' },
            backgroundOptions:    { color: '#ffffff' },
            cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
            cornersDotOptions:    { type: 'dot',           color: '#000000' },
            imageOptions:         { crossOrigin: 'anonymous', margin: 4, imageSize: 0.38 },
            qrOptions:            { errorCorrectionLevel: 'H' },
        } );
        tmpQR.append( tmp );
        // Poll for the canvas element instead of relying on a fixed timeout.
        let tries = 0;
        const maxTries = 20; // ~2s at 100ms interval
        const iv = setInterval(() => {
            const canvas = tmp.querySelector( 'canvas' );
            if (canvas) {
                const dataUrl = canvas.toDataURL( 'image/png' );
                clearInterval(iv);
                document.body.removeChild( tmp );
                callback(dataUrl);
                return;
            }
            tries++;
            if (tries >= maxTries) {
                clearInterval(iv);
                document.body.removeChild( tmp );
                callback('');
            }
        }, 100);
    }

    // ── Download PNG ─────────────────────────────────────────────────────────
    document.getElementById( 'kh-download-btn' ).addEventListener( 'click', () => {
        getQRDataUrl( dataUrl => {
            const a = document.createElement( 'a' );
            a.href     = dataUrl;
            a.download = 'kindness-hearts-qr.png';
            a.click();
        } );
    } );

    // ── Print poster ─────────────────────────────────────────────────────────
    document.getElementById( 'kh-print-btn' ).addEventListener( 'click', () => {
        getQRDataUrl( dataUrl => openPrintPoster( dataUrl ) );
    } );

    function openPrintPoster( qrDataUrl ) {
        const win = window.open( '', '_blank', 'width=720,height=960' );
        const lang = (KH && KH.locale) ? escHtml(KH.locale) : 'en';
        const posterTitle      = escHtml( t('posterTitle', 'Kindness Hearts \u2013 Teacher QR Code') );
        const posterTagline    = escHtml( t('posterTagline', 'Scan to award kindness points when a pupil helps a classmate') );
        const posterHowTo      = escHtml( t('posterHowTo', 'How to use') );
        const posterStep1      = escHtml( t('posterStep1', 'Scan the QR code with your phone camera') );
        const posterStep2      = escHtml( t('posterStep2', 'Select your class from the dropdown') );
        const posterStep3      = escHtml( t('posterStep3', 'Tap \u2764\ufe0f each time a pupil helps a classmate') );
        const posterStep4      = escHtml( t('posterStep4', 'Watch the heart on the class screen fill up!') );
        const posterTeachers   = escHtml( t('posterTeachersOnly', '\ud83d\udd12 For teachers only') );
        const posterTeachersBd = escHtml( t('posterTeachersOnlyBody', 'Please do not share this QR code with pupils.') );
        const posterQrAlt      = escHtml( t('posterQrAlt', 'QR Code for teacher app') );
        win.document.write( `<!DOCTYPE html>
<html lang="${ lang }">
<head>
  <meta charset="UTF-8">
  <title>${ posterTitle }</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
  <div class="heart-icon">\u2764\uFE0F</div>
  <div class="school">${ escHtml( schoolName ) }</div>
  <h1>Kindness Hearts</h1>
  <p class="tagline">${ posterTagline }</p>

  <div class="qr-wrap">
    <img src="${ qrDataUrl }" alt="${ posterQrAlt }" />
  </div>

  <hr class="divider">

  <div class="steps">
    <h2>${ posterHowTo }</h2>
    <div class="step"><div class="step-num">1</div><div>${ posterStep1 }</div></div>
    <div class="step"><div class="step-num">2</div><div>${ posterStep2 }</div></div>
    <div class="step"><div class="step-num">3</div><div>${ posterStep3 }</div></div>
    <div class="step"><div class="step-num">4</div><div>${ posterStep4 }</div></div>
  </div>

  <div class="warning">
    <strong>${ posterTeachers }</strong>
    ${ posterTeachersBd }
  </div>
</div>
<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>` );
        win.document.close();
    }

    // ── Load data ────────────────────────────────────────────────────────────
    function loadData() {
        Promise.all([
            apiFetch('/classes', { method: 'GET' }),
            apiFetch('/total', { method: 'GET' }),
        ]).then(([ classes, total ]) => {
            document.getElementById('kh-total-display').textContent = total.total;
            document.getElementById('kh-classes-count').textContent = classes.length;
            renderClasses(classes);
        }).catch(() => {
            // apiFetch already alerts; nothing else to do here.
        });
    }

    function renderClasses( classes ) {
        const tbody = document.getElementById( 'kh-classes-body' );
        if ( ! classes.length ) {
            tbody.innerHTML = '<tr><td colspan="3"></td></tr>';
            tbody.querySelector('td').textContent = t('noClassesYet', 'No classes yet. Add one above.');
            return;
        }
        const deleteLabel = t('deleteBtn', 'Delete');
        tbody.innerHTML = classes.map( c => `
            <tr>
                <td>${ escHtml( c.name ) }</td>
                <td style="text-align:center;font-weight:700;">${ c.points }</td>
                <td><button class="button button-small kh-del-btn" data-id="${ c.id }">${ escHtml( deleteLabel ) }</button></td>
            </tr>
        ` ).join( '' );
        tbody.querySelectorAll( '.kh-del-btn' ).forEach( btn => {
            btn.addEventListener( 'click', () => {
                if ( ! confirm( t('confirmDeleteClass', 'Delete this class and its points?') ) ) return;
                apiFetch('/classes/' + btn.dataset.id, { method: 'DELETE' }).then( loadData ).catch(() => {});
            } );
        } );
    }

    document.getElementById('kh-add-class-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('kh-class-name').value.trim();
        if (!name) return;
        apiFetch('/classes', { method: 'POST', body: JSON.stringify({ name }) })
            .then(() => {
                document.getElementById('kh-class-name').value = '';
                loadData();
            })
            .catch(() => {});
    });

    document.getElementById('kh-reset-btn').addEventListener('click', () => {
        if (!confirm(t('confirmReset', 'Reset ALL points to zero? This cannot be undone.'))) return;
        apiFetch('/reset', { method: 'POST' }).then(loadData).catch(() => {});
    });

    document.getElementById('kh-regen-token-btn').addEventListener('click', () => {
        if (!confirm(t('confirmRegen', 'This will invalidate the old QR code. Continue?'))) return;
        apiFetch('/token/regenerate', { method: 'POST' })
            .then(() => location.reload())
            .catch(() => {});
    });

    function escHtml( s ) {
        return String( s )
            .replace( /&/g, '&amp;' )
            .replace( /</g, '&lt;' )
            .replace( />/g, '&gt;' )
            .replace( /"/g, '&quot;' );
    }

    loadData();
} )();
