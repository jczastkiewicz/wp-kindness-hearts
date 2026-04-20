=== Kindness Hearts ===
Contributors: jczastkiewicz
Tags: education, school, gamification, classroom, kindness
Requires at least: 5.9
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Let teachers award kindness points in class with a single tap. A beautiful dot-heart fills up on the school projector as kindness grows.

== Description ==

**Kindness Hearts** is a WordPress plugin for primary schools that makes kindness visible and rewarding for children — without turning it into a competition.

When one pupil helps another, the teacher opens a simple mobile app, selects their class, and taps a heart button. Each tap adds one kindness point to the class total and to the school-wide total. On the classroom projector, the whole school can watch a growing heart fill with red dots — one dot per act of kindness.

= Features =

* **Teacher PWA** — A mobile-first Progressive Web App accessed by scanning a QR code. No app store required; teachers can install it on their phone home screen.
* **Heart display** — A full-screen page designed for projectors and school TVs. The heart fills up in real time and auto-refreshes every 10 seconds. No login needed.
* **Admin panel** — Add and delete classes, reset points at the end of term, regenerate the secret token if needed, and print a ready-to-go A4 poster for teachers.
* **QR code** — Styled with rounded dots and a heart logo. One-click print or PNG download for sharing with teachers.
* **Security** — The teacher app is protected by a secret token embedded in the QR code URL. Only people with the QR code can award points. Wrong token returns 403; missing token returns 401.
* **No external dependencies at runtime** — All data stays in your WordPress database. No third-party services or subscriptions required.
* **REST API** — All functionality is available via a clean REST API under `/wp-json/kindness/v1/`.

= How it works =

1. The administrator installs the plugin, adds classes (e.g. "Class 3A", "Class 3B"), and prints the teacher QR code poster.
2. Each teacher scans the QR code once and installs the PWA on their phone home screen.
3. Whenever a pupil helps a classmate, the teacher taps the heart button. The point appears on the projector within 10 seconds.
4. At the end of term, the administrator clicks "Reset all points" to start fresh.

= Source code =

This plugin includes a compiled React application. The full source code — including all React components, Vite configuration, unit tests, and Playwright integration tests — is available at:

**https://github.com/jczastkiewicz/wp-kindness-hearts**

= Privacy =

Kindness Hearts does not collect, store, or transmit any personally identifiable information. No data leaves your WordPress installation. No cookies are set by the plugin. The teacher app and heart display communicate only with your own WordPress REST API.

== Installation ==

= From the WordPress Admin (recommended) =

1. Go to **Plugins → Add New Plugin** in your WordPress admin.
2. Click **Upload Plugin**, choose `wp-kindness-hearts.zip`, and click **Install Now**.
3. Click **Activate Plugin**.

= Manual installation =

1. Unzip `wp-kindness-hearts.zip`.
2. Upload the `wp-kindness-hearts` folder to `/wp-content/plugins/` via FTP or SFTP.
3. Go to **WP Admin → Plugins** and activate Kindness Hearts.

= First-time setup =

1. Go to **WP Admin → Kindness Hearts**.
2. Add all classes for the school year (e.g. "Class 1A", "Class 2B") using the left panel.
3. Click **🖨️ Print poster for teachers** to generate an A4 card with the QR code and instructions — print one per teacher.
4. Open **❤️ Heart Display** on the classroom projector and leave it running.
5. Scan the QR code with a phone to verify the teacher app works.

= Requirements =

* WordPress 5.9 or later
* PHP 8.0 or later
* Apache with `mod_rewrite` enabled (standard on all managed WordPress hosts)
* If the `/kindness-app/` page shows a 404 after activation, go to **Settings → Permalinks** and click **Save Changes** to flush rewrite rules.

== Frequently Asked Questions ==

= Does the teacher app work on any phone? =

Yes. The teacher app is a Progressive Web App that runs in any modern mobile browser (Chrome, Safari, Firefox). No app store installation is required. Teachers can add it to their home screen for one-tap access.

= Can multiple teachers use the app at the same time? =

Yes. Any number of teachers can award points simultaneously. Each tap is an independent REST API call.

= Is there a limit on the number of classes or points? =

No. Classes and points are stored as WordPress custom posts and options with no artificial limits.

= What happens if I deactivate the plugin? =

The plugin's data (classes and points) remains in the WordPress database. Reactivating the plugin makes everything available again immediately. To remove all data permanently, delete the plugin and then clean up the `kh_class` posts and `kh_*` options from the database.

= Can pupils see the admin panel or award points themselves? =

No. The admin panel requires WordPress administrator capabilities. Awarding points requires the secret token, which is only in the QR code given to teachers. Pupils cannot access either.

= What if a teacher accidentally scans an old QR code after the token is regenerated? =

The app immediately shows an "Invalid token" error. The teacher should scan the new QR code poster to get the updated URL.

= Can the heart display be embedded in a page? =

The heart display is a standalone full-screen page at `/kindness-app/#/heart`. It can be opened in any browser and works well in kiosk mode. Embedding as an iframe is possible but not officially supported.

= Does the plugin require any paid services? =

No. Everything runs on your existing WordPress hosting. No subscriptions, API keys, or third-party accounts are needed.

== Screenshots ==

1. WordPress admin — class manager (left) and teacher QR code with print/download buttons (right).
2. Teacher app on mobile — class selector, live point counter, and the large heart award button.
3. Heart display on a projector — the dot-heart with fill progress and the class leaderboard below.
4. Printable A4 teacher poster — QR code, step-by-step instructions, and "For teachers only" notice.

== Changelog ==

= 1.0.0 =
* Initial release.
* WordPress admin panel with class manager and QR code generator.
* Teacher Progressive Web App with token-protected heart button.
* Public heart display with dot animation and class leaderboard.
* REST API: classes, points, total, reset, token regenerate.
* Printable teacher poster (A4, opens print dialog automatically).
* Offline-capable PWA via Workbox service worker.

== Upgrade Notice ==

= 1.0.0 =
Initial release — no upgrade required.
