#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Kindness Hearts — integration test runner
#
#  Prerequisites:
#    1. The test environment must be running:
#         ./start-test.sh          (first time — builds zip + starts WP)
#       OR if WP is already running:
#         docker compose -f docker-compose.test.yml up -d
#
#  Usage:
#    ./run-tests.sh              # run all tests (headless)
#    ./run-tests.sh --headed     # show the browser window
#    ./run-tests.sh --ui         # open Playwright interactive UI
#    ./run-tests.sh --report     # open last HTML report
# ─────────────────────────────────────────────────────────────────
set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$PLUGIN_DIR/tests"
ZIP="$PLUGIN_DIR/wp-kindness-hearts.zip"

echo ""
echo "❤️  Kindness Hearts — integration tests"
echo "─────────────────────────────────────────"

# ── 1. Build a fresh plugin zip ──────────────────────────────────
# Always rebuild so the zip reflects the latest PHP/JS source.
echo ""
echo "📦  Building plugin zip…"
"$PLUGIN_DIR/build-plugin.sh"

# ── 2. Check test WordPress is reachable ─────────────────────────
echo ""
echo "🔍  Checking test WordPress on http://localhost:8082 …"
if ! curl -sf http://localhost:8082/ -o /dev/null; then
  echo ""
  echo "❌  WordPress is not running on port 8082."
  echo "    Start the test environment first:"
  echo "    ./start-test.sh"
  exit 1
fi
echo "    ✅  WordPress is up."

# ── 3. Install Playwright deps if needed ─────────────────────────
cd "$TESTS_DIR"

if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦  Installing Playwright dependencies…"
  npm install
  npx playwright install chromium --with-deps
fi

# ── 4. Run tests ──────────────────────────────────────────────────
echo ""
echo "🧪  Running tests…"
echo ""

if [ "$1" = "--report" ]; then
  npx playwright show-report playwright-report
elif [ "$1" = "--ui" ]; then
  npx playwright test --ui
elif [ "$1" = "--headed" ]; then
  npx playwright test --headed
else
  npx playwright test "$@"
fi
