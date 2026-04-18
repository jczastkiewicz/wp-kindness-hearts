# Kindness Hearts

[![Build plugin](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/build.yml/badge.svg)](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/build.yml)
[![Integration tests](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/integration-tests.yml)
[![Code quality](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/code-quality.yml/badge.svg)](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/code-quality.yml)
[![Security](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/security.yml/badge.svg)](https://github.com/jczastkiewicz/wp-kindness-hearts/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WordPress](https://img.shields.io/badge/WordPress-5.9%2B-21759b?logo=wordpress&logoColor=white)](https://wordpress.org)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-777bb4?logo=php&logoColor=white)](https://php.net)
[![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Coverage](https://codecov.io/gh/jczastkiewicz/wp-kindness-hearts/graph/badge.svg)](https://codecov.io/gh/jczastkiewicz/wp-kindness-hearts)

## Overview

**Kindness Hearts** is a WordPress plugin designed for primary schools. It helps teachers celebrate and track acts of kindness between pupils. When one pupil helps another, a teacher taps a button to award a kindness point. Points accumulate across all classes and the whole school, and are visualised as a growing heart made of coloured dots — one dot per act of kindness.

The goal is to make kindness visible and rewarding for children, without turning it into a competition.

---

## How the system works

The system has three parts that work together:

**WordPress (backend)** stores all data: the list of classes and their point counts, the school-wide total, and the secret token that protects the teacher app. It exposes a REST API that the React app communicates with.

**The teacher app (PWA)** is a mobile-first Progressive Web App that runs in the browser. Teachers open it by scanning a QR code. They select their class and tap the heart button to award a point. It works like a native app and can be installed on a phone home screen.

**The heart display** is a public page meant to be shown on a classroom or school projector. It shows the heart filling up with dots in real time and a leaderboard of classes. No login or token is needed to view it.

---

## Screens

### 1. WordPress Admin — Kindness Hearts page

**Who uses it:** The school administrator (headteacher or IT coordinator).

**URL:** `http://your-site/wp-admin/admin.php?page=kindness-hearts`

**What it shows:**

At the top, two stat cards show the current school-wide point total and the number of classes registered.

Below, the screen is split into two panels side by side.

The left panel is the **class manager**. It has a text field and an "Add Class" button to create classes (e.g. "Class 3A", "Class 3B"). Existing classes are listed in a table with their name, current point count, and a Delete button. At the bottom is a "Reset all points to zero" button for starting a new term or school year.

The right panel shows the **teacher QR code**. The QR code uses rounded dots and rounded corner eyes, with a large red heart logo in the centre. Below it is the full teacher app URL displayed as text for copy-pasting. Four buttons are available:

- **🖨️ Print poster for teachers** — opens a formatted A4-ready print page with the QR code, step-by-step instructions for teachers, and a "teachers only" warning. The print dialog opens automatically.
- **⬇️ Download QR PNG** — saves a high-resolution 600×600px PNG of the QR code to the computer.
- **🔑 Regenerate token** — invalidates the current QR code and creates a new one. Useful if the code is accidentally seen by pupils.
- **❤️ Open Heart Display** — opens the public projector page in a new tab.

**Important:** The QR code and the printed poster should only be shared with teachers. They contain a secret token that authorises adding points.

---

### 2. Teacher App — class selector and point button

**Who uses it:** Class teachers.

**How to open it:** Scan the QR code from the admin page. This opens the URL directly:
`http://your-site/kindness-app/#/teacher?token=SECRET`

The app can be installed on a phone home screen like a native app (it is a PWA). Once installed, teachers can open it directly without scanning the QR code again — as long as the token has not been regenerated.

**What it shows:**

A clean, full-screen mobile page with a red colour scheme.

At the top is a small header: the ❤️ icon, the title "Kindness Points", and a subtitle explaining the purpose.

Below is a **class selector** — a dropdown listing all classes registered in the admin. The teacher taps it to choose which class to award a point to.

The middle of the screen shows the **current point count** for the selected class in large bold numbers, and a smaller line showing the school-wide total.

The centrepiece is a large **red heart button** (a circle with a ❤️ emoji). The teacher taps it once to award one kindness point. When tapped, a brief animated heart floats upward as visual feedback, and the point count increments instantly.

At the bottom is a small label: "Tap the heart to award +1 kindness point".

If the teacher arrives without a valid token (e.g. by navigating directly without the QR code), a friendly error screen is shown asking them to scan the QR code.

If no classes have been set up yet, a message is shown asking the administrator to add classes first.

---

### 3. Heart Display — public projector screen

**Who uses it:** Anyone — displayed on a classroom projector or school TV screen.

**URL:** `http://your-site/kindness-app/#/heart`

No token or login is required. The page auto-refreshes every 10 seconds.

**What it shows:**

At the top is the title **"Our Kindness Heart ❤️"** and the subtitle "Every dot represents one moment of kindness."

The centrepiece is a large **heart made of dots** rendered as an SVG grid (up to 560px wide). The heart shape is generated mathematically — each candidate dot position is tested against the parametric heart equation to decide whether it falls inside the heart. Empty dots are pale pink; filled dots are bright red. As new points are awarded, dots fill in at random positions within the heart, each with a small pop animation. Dots are clearly separated with visible gaps between them, giving a distinct dotted look.

Below the heart is a counter showing how many dots are filled (e.g. "47 / 520 dots (9%)") and a red pill badge showing the total school-wide points in larger text.

Below that is the **class leaderboard** — a ranked list of all classes. Each entry shows the class rank (🏆 for first place, #2, #3, etc.), the class name, a horizontal progress bar scaled relative to the top class, and the class's individual point total on the right.

At the very bottom is a small note: "Auto-refreshes every 10 seconds."

---

### 4. Printable Teacher Poster

**Who uses it:** The administrator — printed and handed to teachers.

**How to open it:** Click "🖨️ Print poster for teachers" on the admin page.

A new browser window opens showing a formatted A4-ready card containing the school name, a large 280px QR code (same styled design as the admin page), four numbered steps explaining how to use the app, and a red "For teachers only" warning box. The browser print dialog opens automatically so the administrator can print directly or save as PDF.

---

## Use cases

### Setting up at the start of a school year

1. The administrator installs and activates the plugin.
2. They go to the Kindness Hearts admin page and add all classes for the year (e.g. "Class 1A", "Class 2B").
3. They click "🖨️ Print poster for teachers" to print a copy for each teacher, or click "⬇️ Download QR PNG" to share the image digitally.
4. They open the Heart Display URL on the classroom projector or school screen and leave it running.

### A teacher awards a point during class

1. A pupil helps a classmate (explains a problem, shares materials, encourages a friend, etc.).
2. The teacher takes out their phone and opens the Kindness Hearts app (either by scanning the QR code or tapping the home screen icon if it was already installed).
3. They confirm their class is selected in the dropdown.
4. They tap the ❤️ button once.
5. The point count updates immediately on their screen. Within 10 seconds, the dot heart on the projector fills in one more dot.

### Viewing progress during the school day

The heart display page runs continuously on the projector. As teachers award points throughout the day, the class leaderboard updates and the heart gradually fills with red dots. Children can see the heart growing and understand collectively how kind their school has been.

### Starting a new term

The administrator goes to the admin page and clicks "Reset all points to zero". All class totals and the school-wide total return to zero and the heart empties. Classes remain in place.

### If the QR code is accidentally seen by pupils

The administrator clicks "🔑 Regenerate token". The old QR code immediately stops working. A new QR code is displayed and the administrator prints or shares a fresh poster with teachers. Teachers who had the app installed on their home screen will see a "token invalid" error and need to scan the new QR code once.

---

## Data stored in WordPress

| Data | Where stored |
|------|-------------|
| Class names | Custom post type `kh_class` (post title) |
| Points per class | Post meta `_kh_points` on each class post |
| School-wide total | WordPress option `kh_total_points` |
| Secret teacher token | WordPress option `kh_secret_token` |
| School name | WordPress option `kh_school_name` |

---

## REST API reference

All endpoints are under `/wp-json/kindness/v1/`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/classes` | public | Returns all classes with names and point counts |
| POST | `/classes` | WP admin | Creates a new class |
| DELETE | `/classes/{id}` | WP admin | Deletes a class and subtracts its points from the school total |
| POST | `/points` | token | Adds 1 point to the given `class_id` |
| GET | `/total` | public | Returns the school-wide point total |
| POST | `/reset` | WP admin | Resets all points to zero |
| POST | `/token/regenerate` | WP admin | Generates a new secret token |

The teacher token can be passed as `?token=VALUE` in the query string or as an `X-KH-Token` request header.

---

## Technical notes

The React app is a Progressive Web App built with Vite. It uses hash-based routing (`/#/teacher`, `/#/heart`) so it works regardless of server configuration. It is served by WordPress via a virtual page registered at `/kindness-app/` — no actual WordPress page needs to be created manually. The built assets are read via the Vite manifest so hashed filenames resolve correctly.

The heart shape is generated mathematically using the parametric heart inequality: `(x² + y² − 1)³ ≤ x² · y³`. A grid of dot positions is tested against this formula to determine which fall inside the heart. Dots fill in a randomised order for a playful effect, and each new dot animates with a pop on arrival.

The QR code in the admin is rendered using the `qr-code-styling` library with rounded dots, extra-rounded corner eyes, and a solid red heart as the centre logo. Error correction level H is used so that up to 30% of the QR code can be obscured by the logo while remaining scannable.

The teacher app polls for class data on load. The heart display polls the total and class list every 10 seconds using a lightweight interval hook — no websockets required.

---

## Building for production

When you are ready to deploy to a real WordPress server, run the build script from the plugin folder:

```bash
./build-plugin.sh
```

This script does two things automatically. First it runs `npm install` and `npm run build` inside the `app/` directory, which compiles the React PWA into the `app/dist/` folder. Then it packages everything WordPress needs into a single zip file called `wp-kindness-hearts.zip` (approximately 90–100 KB). Source files, Docker files, and development tools are excluded from the zip.

Run this script every time you make code changes before deploying.

---

## Uploading and installing the plugin

### Option A — WordPress Admin (recommended)

This is the easiest method and requires no server access.

1. Open your WordPress admin panel and go to **Plugins → Add New Plugin**.
2. Click **Upload Plugin** at the top of the page.
3. Click **Choose File**, select `wp-kindness-hearts.zip`, and click **Install Now**.
4. Once installed, click **Activate Plugin**.

### Option B — FTP / SFTP

Use this if your hosting provider does not allow plugin uploads via the admin panel.

1. Unzip `wp-kindness-hearts.zip` on your computer.
2. Using an FTP or SFTP client (e.g. FileZilla), connect to your server.
3. Upload the `wp-kindness-hearts` folder to `/wp-content/plugins/` on the server.
4. Go to **WP Admin → Plugins**, find Kindness Hearts in the list, and click **Activate**.

### Option C — WP-CLI

Use this if you have command-line access to the server and WP-CLI installed.

```bash
wp plugin install /path/to/wp-kindness-hearts.zip --activate
```

---

## Server requirements

The plugin works on any standard WordPress hosting. There are no unusual server requirements. WordPress 5.9 or later is recommended (for full REST API support and block editor compatibility). PHP 8.0 or later is required. No additional PHP extensions are needed.

The `/kindness-app/` virtual page requires Apache `mod_rewrite` to be enabled and `AllowOverride All` set in the server configuration — both are standard on virtually all managed WordPress hosts. If the page returns a 404 after activation, go to **WP Admin → Settings → Permalinks** and click **Save Changes** to flush the rewrite rules manually.

---

## First-time configuration after installation

After activating the plugin for the first time, follow these steps to get it ready for teachers.

**Step 1 — Add classes.**
Go to **WP Admin → Kindness Hearts**. In the left panel, type each class name (e.g. "Class 1A", "Class 2B") into the text field and click **Add Class**. Repeat for every class in the school.

**Step 2 — Print or share the teacher QR code.**
In the right panel you will see the teacher QR code. Click **🖨️ Print poster for teachers** to open a formatted A4 card with the QR code and instructions — print one copy per teacher, or save as PDF and send by email. Alternatively click **⬇️ Download QR PNG** to get a high-resolution image you can include in a message or document.

**Step 3 — Open the heart display.**
Click **❤️ Open Heart Display** to open the public projector page. Open this URL on the classroom or school projector and leave it running. The address is:
`http://your-site/kindness-app/#/heart`

**Step 4 — Verify the teacher app works.**
Scan the QR code with a phone. The teacher app should open, show the class selector, and allow you to tap the heart button. Check that the heart display updates within 10 seconds.

The plugin is now fully configured and ready to use.

---

## Updating the plugin

To update an existing installation after making code changes:

1. Run `./build-plugin.sh` to produce a new `wp-kindness-hearts.zip`.
2. In WP Admin, go to **Plugins**, deactivate Kindness Hearts, then delete it.
3. Re-upload and activate the new zip following the installation steps above.

Existing data (classes and points) is stored in the WordPress database and is not affected by reinstalling the plugin.

---

## Project structure

```
wp-kindness-hearts/
├── wp-kindness-hearts.php   # Plugin entry point — constants, hooks, activation
├── includes/
│   ├── class-rest-api.php   # All REST endpoints (/wp-json/kindness/v1/*)
│   ├── class-admin.php      # WP Admin page (class manager + QR code)
│   └── class-frontend.php   # CPT registration, virtual /kindness-app/ page
├── app/                     # React PWA (Vite + Vitest)
│   ├── src/
│   │   ├── App.jsx          # Hash-based router (/#/teacher, /#/heart)
│   │   ├── api/wpApi.js     # REST client + useClasses / useTotal hooks
│   │   ├── components/
│   │   │   └── HeartVisualization.jsx   # SVG dot-heart component
│   │   └── pages/
│   │       ├── HeartPage.jsx    # Public projector display
│   │       └── TeacherPage.jsx  # Teacher point-award panel
│   ├── src/__tests__/       # Unit tests (Vitest + Testing Library)
│   ├── vite.config.js       # Vite + Vitest + PWA config
│   └── package.json
├── tests/                   # Playwright integration tests
│   ├── global-setup.js      # Install plugin, authenticate, capture token
│   ├── 01-configure.spec.js
│   ├── 02-teacher.spec.js
│   ├── 03-heart.spec.js
│   └── 04-security.spec.js
├── .github/
│   ├── workflows/           # CI: build, integration-tests, code-quality, security
│   └── dependabot.yml       # Automated dependency updates
├── phpstan.neon             # PHPStan static analysis config (level 5)
├── composer.json            # Dev: PHPStan + WordPress stubs
├── start.sh                 # Start local dev environment
├── start-test.sh            # Start integration test environment
├── run-tests.sh             # Run Playwright tests
└── build-plugin.sh          # Build zip for production deployment
```

---

## Unit tests

Unit tests cover the React app — all API functions, custom hooks, and UI components. They run with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com).

```bash
cd app

npm test          # run tests once
npm run coverage  # run tests with v8 coverage report (text + lcov + HTML)
```

Current coverage: **~96% statements, ~98% lines** across all source files. The HTML report is written to `app/coverage/` and is uploaded to [Codecov](https://codecov.io/gh/jczastkiewicz/wp-kindness-hearts) on every CI run.

Test files live alongside their source modules in `__tests__/` directories:

| Test file | What it covers |
|-----------|---------------|
| `api/__tests__/wpApi.test.js` | `fetchClasses`, `fetchTotal`, `addPoint`, `useClasses` hook, `useTotal` hook |
| `__tests__/App.test.jsx` | Hash-based routing — all four routes |
| `components/__tests__/HeartVisualization.test.jsx` | SVG rendering, aria labels, fill clamping, animation |
| `pages/__tests__/HeartPage.test.jsx` | Loading state, leaderboard sort, singular/plural badge |
| `pages/__tests__/TeacherPage.test.jsx` | Guard states, addPoint flow, error display, class switching |

---

## CI / quality pipeline

Every push and pull request runs four GitHub Actions workflows:

| Workflow | What runs |
|----------|-----------|
| **Build** | `npm ci`, Vite production build, Vitest unit tests + coverage upload to Codecov, plugin zip artifact |
| **Integration tests** | Docker WordPress, install from zip, Playwright E2E (4 spec files) |
| **Code quality** | PHP syntax check, PHPStan level 5 (with WordPress stubs), ESLint (flat config, React rules) |
| **Security** | CodeQL (JavaScript/TypeScript), Trivy filesystem scan (SARIF → Security tab), `npm audit` production deps |

[Dependabot](https://docs.github.com/en/code-security/dependabot) is configured to open weekly PRs for npm (grouped by `react` and `vite` groups), Composer, and GitHub Actions updates.

---

## Local development

The project includes a Docker Compose setup for running WordPress locally with no manual WordPress installation required.

**Requirements:** Docker with Compose support, Node.js 20+.

```bash
# First run — builds React app, pulls Docker images, installs WordPress,
# activates the plugin, and seeds sample classes (~30–60s on first run)
./start.sh

# Stop Docker (React dev server stops when you press Ctrl+C)
docker compose down

# Full reset — stops Docker and wipes the database volume
docker compose down -v
```

| Service | URL |
|---------|-----|
| WordPress site | http://localhost:8080 |
| WP Admin (`admin` / `admin`) | http://localhost:8080/wp-admin |
| Kindness Hearts admin | http://localhost:8080/wp-admin/admin.php?page=kindness-hearts |
| Heart display | http://localhost:8080/kindness-app/#/heart |
| Teacher app | http://localhost:8080/kindness-app/#/teacher?token=… |
| phpMyAdmin | http://localhost:8081 |

The Vite dev server runs on `http://localhost:5173` with hot-reload. API calls are proxied automatically to WordPress at port 8080, so you can develop the React app without rebuilding after every change. The PHP plugin files are bind-mounted into the WordPress container, so PHP changes are also reflected immediately without a restart.

---

## Integration testing

Integration testing verifies the complete install-from-zip flow on a clean WordPress instance — exactly as a school administrator would experience it. The test environment runs on port 8082, completely separate from the development environment on port 8080. Both can run at the same time without interfering.

### Quick start

```bash
# Step 1 — build the zip and start a clean WordPress (first time only, ~60s)
./start-test.sh

# Step 2 — run all automated Playwright tests
./run-tests.sh
```

`start-test.sh` calls `build-plugin.sh` internally, so there is no need to build the zip separately. `run-tests.sh` installs Playwright's npm dependencies and the Chromium browser automatically on the first run.

### How it works

`start-test.sh` spins up a clean WordPress with no plugin pre-installed. Then `run-tests.sh` drives the full flow via [Playwright](https://playwright.dev):

The **global setup** (`tests/global-setup.js`) runs once before any spec. It opens a browser, logs into WP Admin, uploads `wp-kindness-hearts.zip` via the standard plugin upload UI, activates it, and reads the generated secret token from `window.KH.secretToken`. Auth cookies and the token are saved to `tests/.auth.json` and `tests/.test-state.json` (both git-ignored) and shared across all specs.

The **four spec files** then run in order:

`01-configure.spec.js` — WP Admin: add a class, verify it appears in the table with 0 points, confirm the QR code canvas renders, delete the class.

`02-teacher.spec.js` — Teacher PWA: the no-token gate shows "Access required", the app loads with a valid token, the heart button increments the counter, switching classes updates the display.

`03-heart.spec.js` — Heart display: page loads without authentication, the canvas renders, the leaderboard lists all classes, and the badge total updates after a point is awarded via the REST API.

`04-security.spec.js` — Token enforcement: no token → 401, wrong token → 403, valid token → 200, token in `X-KH-Token` header works, regenerating the token invalidates the old one, reset zeroes all counters.

### Run options

```bash
./run-tests.sh              # headless — default, CI-friendly
./run-tests.sh --headed     # watch the browser as tests run
./run-tests.sh --ui         # open Playwright interactive UI
./run-tests.sh --report     # open the last HTML report
```

### Manage the test environment

```bash
# Stop containers (database is preserved)
docker compose -f docker-compose.test.yml down

# Full reset — stops containers and wipes the test database
docker compose -f docker-compose.test.yml down -v
```

| Service | URL |
|---------|-----|
| WordPress site | http://localhost:8082 |
| WP Admin (`admin` / `admin`) | http://localhost:8082/wp-admin |
| Kindness Hearts admin | http://localhost:8082/wp-admin/admin.php?page=kindness-hearts |
| Heart display | http://localhost:8082/kindness-app/#/heart |
| phpMyAdmin | http://localhost:8083 |
