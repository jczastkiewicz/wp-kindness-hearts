# Kindness Hearts — WordPress Plugin

A WordPress plugin that lets teachers award kindness points whenever one pupil helps another. Points accumulate school-wide and fill a beautiful heart made of dots, showing pupils how kind they are to each other.

---

## How it works

1. **Admin** installs the plugin and adds classes (e.g. "Class 3A", "Class 3B") in the WP admin.
2. The admin page generates a **secret QR code** — print it and give it only to teachers.
3. **Teachers** scan the QR code with their phone. It opens the PWA teacher app where they can select a class and tap the ❤️ button to award a point.
4. On a classroom projector, open `/kindness-app/#/heart` to see the heart fill up in real time.

---

## Project structure

```
wp-kindness-hearts/
├── wp-kindness-hearts.php       ← Plugin entry point
├── includes/
│   ├── class-rest-api.php       ← REST API endpoints
│   ├── class-admin.php          ← WP Admin page + QR code
│   └── class-frontend.php       ← Virtual page + React app shell
└── app/                         ← React PWA (Vite)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   ├── manifest.json        ← PWA manifest
    │   ├── heart-192.png        ← App icon
    │   └── heart-512.png        ← App icon (large)
    └── src/
        ├── main.jsx             ← React entry + SW registration
        ├── App.jsx              ← Hash router + routes
        ├── index.css            ← Global styles
        ├── api/
        │   └── wpApi.js         ← REST API client + React hooks
        ├── components/
        │   └── HeartVisualization.jsx  ← Animated dot-heart
        └── pages/
            ├── TeacherPage.jsx  ← Teacher award-a-point UI
            └── HeartPage.jsx    ← Public display with leaderboard
```

---

## Installation

### 1. Build the React app

```bash
cd wp-kindness-hearts/app
npm install
npm run build
```

This outputs the built app to `app/dist/`.

### 2. Install the WordPress plugin

Copy the entire `wp-kindness-hearts/` folder to your WordPress `wp-content/plugins/` directory.

```
wp-content/plugins/wp-kindness-hearts/
```

### 3. Activate in WordPress

Go to **Plugins → Installed Plugins** and activate **Kindness Hearts**.

### 4. Set up classes

Navigate to **Kindness Hearts** in the WP admin sidebar. Add your school's classes (e.g. "Class 1A", "Class 2B", …).

### 5. Share the QR code

Print the QR code shown on the admin page and give it to teachers. **Do not show it to pupils.**

---

## Pages

| URL | Description |
|-----|-------------|
| `/kindness-app/#/teacher?token=SECRET` | Teacher app (requires token via QR) |
| `/kindness-app/#/heart` | Public heart display (no token needed) |

---

## REST API

All endpoints are under `/wp-json/kindness/v1/`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/classes` | public | List all classes with points |
| POST | `/classes` | WP admin | Create a class |
| DELETE | `/classes/{id}` | WP admin | Delete a class |
| POST | `/points?token=…` | token | Add 1 point to a class |
| GET | `/total` | public | School-wide total |
| POST | `/reset` | WP admin | Reset all points to 0 |
| POST | `/token/regenerate` | WP admin | Generate a new secret token |

The **token** can be passed as `?token=SECRET` query param **or** `X-KH-Token` request header.

---

## Development

For local development with a running WordPress:

```bash
cd app
# Edit vite.config.js → set proxy target to your local WP URL
npm run dev
```

The Vite dev server proxies `/wp-json` calls to your local WordPress. Open `http://localhost:5173/kindness-app/#/teacher?token=YOUR_TOKEN`.

---

## Security notes

- The secret token is stored in `wp_options` and is never shown to pupils.
- Token verification uses `hash_equals()` to prevent timing attacks.
- Regenerating the token immediately invalidates the old QR code — print a new one.
- The REST endpoint for adding points requires the token; no WordPress login needed for teachers.

---

## Customisation ideas

- Add **pupil names** so teachers can note who helped whom.
- Show a **confetti burst** on the heart display when a milestone is reached.
- Add a **class page** showing the daily/weekly point history.
- Send a **weekly email digest** to the headteacher.
- Support **multiple schools** with separate tokens per school.
