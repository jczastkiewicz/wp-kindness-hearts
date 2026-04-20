#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Kindness Hearts — production plugin builder
#  Outputs:  wp-kindness-hearts.zip  (ready to upload to WordPress)
#  Usage:    ./build-plugin.sh
# ─────────────────────────────────────────────────────────────────
set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$PLUGIN_DIR/app"
DIST_DIR="$PLUGIN_DIR/app/dist"
OUT_ZIP="$PLUGIN_DIR/wp-kindness-hearts.zip"

echo ""
echo "❤️  Kindness Hearts — production build"
echo "────────────────────────────────────────"

# ── Step 1: Build the React app ──────────────────────────────────
echo ""
echo "📦  Building React app..."
cd "$APP_DIR"
npm install
npm run build
echo "    ✅  React app built → app/dist/"

# ── Step 2: Package the plugin zip ───────────────────────────────
echo ""
echo "🗜️   Creating plugin zip..."

# Remove any previous zip
rm -f "$OUT_ZIP"

cd "$PLUGIN_DIR/.."

# Include only the files WordPress needs — no source, no dev tools
zip -r "$OUT_ZIP" wp-kindness-hearts \
    --include \
        "wp-kindness-hearts/wp-kindness-hearts.php" \
        "wp-kindness-hearts/readme.txt" \
        "wp-kindness-hearts/LICENSE" \
        "wp-kindness-hearts/includes/*.php" \
        "wp-kindness-hearts/assets/js/*" \
        "wp-kindness-hearts/app/dist/*" \
        "wp-kindness-hearts/app/dist/**/*" \
        "wp-kindness-hearts/app/dist/.vite/*" \
        "wp-kindness-hearts/app/public/heart-192.png" \
        "wp-kindness-hearts/app/public/heart-512.png" \
        "wp-kindness-hearts/app/public/manifest.json" \
    -x "*.DS_Store" \
    -x "*__MACOSX*" \
    -x "*/app/dist/index.html" \
    -x "*/app/dist/generate-icons.js"

SIZE=$(du -sh "$OUT_ZIP" | cut -f1)
echo "    ✅  Created: wp-kindness-hearts.zip ($SIZE)"

echo ""
echo "─────────────────────────────────────────────────────"
echo "🎉  Done! Upload the zip to WordPress:"
echo ""
echo "   Option A — WP Admin (easiest):"
echo "   → WP Admin → Plugins → Add New → Upload Plugin"
echo "   → Choose wp-kindness-hearts.zip → Install Now → Activate"
echo ""
echo "   Option B — FTP/SFTP:"
echo "   → Unzip and copy the folder to:"
echo "   → /wp-content/plugins/wp-kindness-hearts/"
echo "   → Then activate in WP Admin → Plugins"
echo ""
echo "   Option C — WP-CLI (if available on server):"
echo "   → wp plugin install wp-kindness-hearts.zip --activate"
echo "─────────────────────────────────────────────────────"
