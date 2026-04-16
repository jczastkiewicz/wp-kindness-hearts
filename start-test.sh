#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Kindness Hearts — integration test environment
#
#  What this does:
#    1. Builds the production plugin zip  (wp-kindness-hearts.zip)
#    2. Spins up a clean WordPress on port 8082  (no plugin pre-installed)
#    3. Prints the checklist for manual installation testing
#
#  Usage:  ./start-test.sh
#  Stop:   docker compose -f docker-compose.test.yml down
#  Reset:  docker compose -f docker-compose.test.yml down -v
# ─────────────────────────────────────────────────────────────────
set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$PLUGIN_DIR/app"
ZIP="$PLUGIN_DIR/wp-kindness-hearts.zip"

echo ""
echo "❤️  Kindness Hearts — Integration Test Setup"
echo "────────────────────────────────────────────"

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

# ── Step 1: Build the production plugin zip ──────────────────────
echo ""
echo "📦  Step 1/2: Building production plugin zip..."
"$PLUGIN_DIR/build-plugin.sh"

# ── Step 2: Start clean WordPress (test environment) ─────────────
echo ""
echo "🐋  Step 2/2: Starting clean WordPress for integration testing..."
cd "$PLUGIN_DIR"
$DC -f docker-compose.test.yml up -d --remove-orphans

echo ""
echo "⏳  Waiting for WordPress + WP-CLI setup (~30s on first run)…"
echo ""

TIMEOUT=180
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$($DC -f docker-compose.test.yml ps wpcli_test --format json 2>/dev/null \
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

echo ""
echo "── WP-CLI setup log ───────────────────────────────"
$DC -f docker-compose.test.yml logs wpcli_test 2>&1 | tail -20
echo "────────────────────────────────────────────────────"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Clean WordPress is ready!"
echo ""
echo "   Plugin zip:   $ZIP"
echo "   WP Admin:     http://localhost:8082/wp-admin"
echo "   Login:        admin / admin"
echo "   phpMyAdmin:   http://localhost:8083"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋  INTEGRATION TEST CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  INSTALL"
echo "  -------"
echo "  [ ] 1. Go to WP Admin → Plugins → Add New → Upload Plugin"
echo "  [ ] 2. Choose wp-kindness-hearts.zip"
echo "  [ ] 3. Click Install Now"
echo "  [ ] 4. Click Activate Plugin"
echo ""
echo "  CONFIGURE"
echo "  ---------"
echo "  [ ] 5. Go to Kindness Hearts (left sidebar)"
echo "  [ ] 6. Add at least one class (e.g. 'Class 1A')"
echo "  [ ] 7. Confirm QR code appears"
echo "  [ ] 8. Click 'Open Heart Display' — heart page loads"
echo ""
echo "  TEACHER FLOW"
echo "  ------------"
echo "  [ ] 9.  Scan / open the QR URL in a browser"
echo "  [ ] 10. Teacher app loads, class list visible"
echo "  [ ] 11. Tap a class → point awarded, counter updates"
echo "  [ ] 12. Heart display updates (auto-refresh ≤10s)"
echo ""
echo "  EDGE CASES"
echo "  ----------"
echo "  [ ] 13. Open teacher URL without token → 401 error in console"
echo "  [ ] 14. Open teacher URL with wrong token → API returns 403"
echo "  [ ] 15. Regenerate token → old token no longer works"
echo "  [ ] 16. Reset points → counters go to zero, heart clears"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   To stop:  $DC -f docker-compose.test.yml down"
echo "   To reset: $DC -f docker-compose.test.yml down -v"
echo ""
