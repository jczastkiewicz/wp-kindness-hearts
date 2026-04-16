#!/bin/sh
# WP-CLI setup script — runs once after WordPress container is healthy.
set -e

WP="wp --path=/var/www/html --allow-root"

echo ""
echo "── Kindness Hearts WP setup ───────────────────────"

# Wait until WordPress/Apache is actually serving HTTP
echo "→ Waiting for WordPress HTTP server..."
i=0
until curl -sf http://wordpress/ -o /dev/null; do
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
    --url="http://localhost:8080" \
    --title="Kindness Hearts School" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=admin@example.com \
    --skip-email
  echo "✅  WordPress installed"
else
  echo "✅  WordPress already installed"
fi

# Flush rewrite rules so /kindness-app/ virtual page works
$WP rewrite structure "/%postname%/" --hard
echo "✅  Rewrite rules flushed"

# Activate the plugin
$WP plugin activate wp-kindness-hearts
echo "✅  Plugin activated"

# Seed sample classes (idempotent — skips if they exist)
$WP eval '
$classes = ["Class 1A", "Class 1B", "Class 2A", "Class 2B", "Class 3A"];
foreach ($classes as $name) {
    $q = new WP_Query(["post_type"=>"kh_class","title"=>$name,"posts_per_page"=>1,"post_status"=>"publish"]);
    if ($q->have_posts()) { echo "  skip: $name\n"; continue; }
    $id = wp_insert_post(["post_type"=>"kh_class","post_status"=>"publish","post_title"=>$name]);
    update_post_meta($id, "_kh_points", 0);
    echo "  created: $name\n";
}
'
echo "✅  Sample classes ready"

echo ""
echo "─────────────────────────────────────────────────────"
echo "🎉  All done!"
echo ""
echo "   WP Admin:     http://localhost:8080/wp-admin"
echo "   Login:        admin / admin"
echo "   Plugin page:  http://localhost:8080/wp-admin/admin.php?page=kindness-hearts"
echo "   Heart:        http://localhost:8080/kindness-app/#/heart"
echo "─────────────────────────────────────────────────────"
