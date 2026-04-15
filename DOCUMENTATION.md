# Kindness Hearts — Application Documentation

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

## Local development

The project includes a Docker Compose setup for running WordPress locally.

```bash
# Start everything (builds React app, starts WordPress + MySQL)
./start.sh

# Stop
docker compose down

# Reset (also wipes the database)
docker compose down -v
```

| Service | URL |
|---------|-----|
| WordPress site | http://localhost:8080 |
| WP Admin (admin / admin) | http://localhost:8080/wp-admin |
| Kindness Hearts admin | http://localhost:8080/wp-admin/admin.php?page=kindness-hearts |
| Heart display | http://localhost:8080/kindness-app/#/heart |
| phpMyAdmin | http://localhost:8081 |

For hot-reload during React development, the Vite dev server runs on `http://localhost:5173` and proxies API calls to WordPress at port 8080.
