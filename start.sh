#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Kindness Hearts – local development starter
#  Usage:  ./start.sh
# ─────────────────────────────────────────────────────────────────
set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$PLUGIN_DIR/app"

echo ""
echo "❤️  Kindness Hearts – local dev setup"
echo "────────────────────────────────────────"

# ── Detect docker compose command ────────────────────────────────
if docker compose version &>/dev/null; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  echo ""
  echo "❌  Neither 'docker compose' nor 'docker-compose' was found."
  echo "    Please install Docker Compose:"
  echo "    https://docs.docker.com/compose/install/"
  exit 1
fi
echo "    Using: $DC"

# ── Check docker daemon is running ───────────────────────────────
if ! docker info &>/dev/null; then
  echo ""
  echo "❌  Docker daemon is not running. Please start it first:"
  echo "    - macOS (colima): colima start"
  echo "    - macOS (Docker Desktop): open Docker Desktop"
  echo "    - Linux: sudo systemctl start docker"
  exit 1
fi

# ── Step 1: Build the React app ──────────────────────────────────
echo ""
echo "📦  Step 1/2: Building React app..."
cd "$APP_DIR"

echo "    Installing npm dependencies…"
npm install
npm run build
echo "    ✅  React app built → app/dist/"

# ── Step 2: Start WordPress via Docker Compose ───────────────────
echo ""
echo "🐋  Step 2/2: Starting WordPress with Docker Compose..."
cd "$PLUGIN_DIR"
$DC up -d --remove-orphans

echo ""
echo "⏳  Waiting for WordPress to be ready (this takes ~30s on first run)…"
echo "    (MySQL needs to initialise its data volume)"
echo ""

# Wait for wpcli container to finish its setup
TIMEOUT=180
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$($DC ps wpcli --format json 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['State'] if isinstance(d,list) and d else ('exited' if 'exited' in str(d) else 'running'))" 2>/dev/null \
    || echo "running")
  if [ "$STATUS" = "exited" ]; then
    break
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  printf "."
done
echo ""

# Show wpcli output so we can see if it succeeded
echo ""
echo "── WP-CLI setup log ──────────────────────────────"
$DC logs wpcli 2>&1 | tail -20
echo "──────────────────────────────────────────────────"
echo ""

echo "🎉  Ready! Open these in your browser:"
echo ""
echo "   WP Admin (admin / admin)"
echo "   → http://localhost:8080/wp-admin"
echo ""
echo "   Kindness Hearts (classes + QR code)"
echo "   → http://localhost:8080/wp-admin/admin.php?page=kindness-hearts"
echo ""
echo "   ❤️  Heart display (put this on the projector)"
echo "   → http://localhost:8080/kindness-app/#/heart"
echo ""
echo "   phpMyAdmin"
echo "   → http://localhost:8081"
echo ""
echo "   To stop:  $DC down"
echo "   To reset: $DC down -v   ← also deletes the database"
echo ""

# ── Step 3: Vite dev server for hot-reload ───────────────────────
echo "🔥  Starting Vite dev server (Ctrl+C to stop only this, Docker keeps running)…"
echo ""
cd "$APP_DIR"
npm run dev
