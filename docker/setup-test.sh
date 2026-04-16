#!/bin/sh
# WP-CLI setup for integration testing.
# Sets up a bare WordPress site — NO plugin installed or activated.
# The plugin is uploaded and installed manually via WP Admin as part of the test.
set -e

WP="wp --path=/var/www/html --allow-root"

echo ""
echo "── Kindness Hearts — Integration Test WP setup ────"

# Wait until WordPress/Apache is actually serving HTTP
echo "→ Waiting for WordPress HTTP server..."
i=0
until curl -sf http://wordpress_test/ -o /dev/null; do
  i=$((i+1))
  if [ $i -gt 40 ]; then
    echo "❌  Timed out waiting for WordPress to respond"
    exit 1
  fi
  sleep 3
done
echo "✅  HTTP server is up"

# Install WordPress core if not yet installed
if ! $WP core is-installed 2>/dev/null; then
  echo "→ Installing WordPress..."
  $WP core install \
    --url="http://localhost:8082" \
    --title="Kindness Hearts — Integration Test" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=admin@example.com \
    --skip-email
  echo "✅  WordPress installed"
else
  echo "✅  WordPress already installed"
fi

# Enable pretty permalinks (required for WP REST API and plugin's /kindness-app/ route)
$WP rewrite structure "/%postname%/" --hard
echo "✅  Rewrite rules flushed"

# ── Plugin intentionally NOT installed here ───────────────────────
# Upload wp-kindness-hearts.zip manually via:
#   WP Admin → Plugins → Add New → Upload Plugin

echo ""
echo "─────────────────────────────────────────────────────"
echo "🎉  Clean WordPress is ready for integration testing!"
echo ""
echo "   WP Admin:  http://localhost:8082/wp-admin"
echo "   Login:     admin / admin"
echo ""
echo "   Next: upload wp-kindness-hearts.zip"
echo "   → WP Admin → Plugins → Add New → Upload Plugin"
echo "─────────────────────────────────────────────────────"
