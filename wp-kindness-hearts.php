<?php

/**
 * Plugin Name:       Kindness Hearts
 * Plugin URI:        https://github.com/jczastkiewicz/wp-kindness-hearts
 * Description:       Teachers award kindness points when pupils help each other. Points accumulate to build a glowing heart. Includes a QR-code-protected PWA for teachers.
 * Version:           1.0.0
 * Author:            auxeo.pl
 * Author URI:        https://auxeo.pl
 * License:           GPL-2.0+
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kindness-hearts
 */

defined('ABSPATH') || exit;

define('KHEARTS_VERSION', '1.0.0');
define('KHEARTS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('KHEARTS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('KHEARTS_APP_URL', KHEARTS_PLUGIN_URL . 'app/dist/');

// ── Autoload includes ────────────────────────────────────────────────────────
require_once KHEARTS_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once KHEARTS_PLUGIN_DIR . 'includes/class-admin.php';
require_once KHEARTS_PLUGIN_DIR . 'includes/class-frontend.php';

// ── Activation / deactivation hooks ─────────────────────────────────────────
register_activation_hook(__FILE__, 'khearts_activate');
register_deactivation_hook(__FILE__, 'khearts_deactivate');

function khearts_activate(): void
{
    // Generate a secret token for the teacher QR code if not already set
    if (! get_option('khearts_secret_token')) {
        update_option('khearts_secret_token', wp_generate_password(32, false));
    }

    // Seed default school name
    if (! get_option('khearts_school_name')) {
        update_option('khearts_school_name', get_bloginfo('name'));
    }

    // Register CPT so the rewrite rules flush correctly
    KHearts_Frontend::register_rewrite();
    flush_rewrite_rules();
}

function khearts_deactivate(): void
{
    flush_rewrite_rules();
}

// ── Boot ─────────────────────────────────────────────────────────────────────
add_action('init', ['KHearts_Frontend', 'register_cpt']);
add_action('init', ['KHearts_Frontend', 'register_rewrite']);
add_action('rest_api_init', ['KHearts_REST_API', 'register_routes']);
add_action('admin_menu', ['KHearts_Admin', 'add_menu']);
add_action('admin_enqueue_scripts', ['KHearts_Admin', 'enqueue_scripts']);
add_action('template_redirect', ['KHearts_Frontend', 'maybe_serve_app']);
add_filter('query_vars', ['KHearts_Frontend', 'add_query_vars']);
