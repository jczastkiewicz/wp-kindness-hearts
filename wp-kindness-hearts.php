<?php
/**
 * Plugin Name:       Kindness Hearts
 * Plugin URI:        https://github.com/your-org/wp-kindness-hearts
 * Description:       Teachers award kindness points when pupils help each other. Points accumulate to build a glowing heart. Includes a QR-code-protected PWA for teachers.
 * Version:           1.0.0
 * Author:            Your Name
 * License:           GPL-2.0+
 * Text Domain:       kindness-hearts
 */

defined( 'ABSPATH' ) || exit;

define( 'KH_VERSION',    '1.0.0' );
define( 'KH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'KH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'KH_APP_URL',    KH_PLUGIN_URL . 'app/dist/' );

// ── Autoload includes ────────────────────────────────────────────────────────
require_once KH_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once KH_PLUGIN_DIR . 'includes/class-admin.php';
require_once KH_PLUGIN_DIR . 'includes/class-frontend.php';

// ── Activation / deactivation hooks ─────────────────────────────────────────
register_activation_hook( __FILE__, 'kh_activate' );
register_deactivation_hook( __FILE__, 'kh_deactivate' );

function kh_activate(): void {
    // Generate a secret token for the teacher QR code if not already set
    if ( ! get_option( 'kh_secret_token' ) ) {
        update_option( 'kh_secret_token', wp_generate_password( 32, false ) );
    }

    // Seed default school name
    if ( ! get_option( 'kh_school_name' ) ) {
        update_option( 'kh_school_name', get_bloginfo( 'name' ) );
    }

    // Register CPT so the rewrite rules flush correctly
    KH_Frontend::register_rewrite();
    flush_rewrite_rules();
}

function kh_deactivate(): void {
    flush_rewrite_rules();
}

// ── Boot ─────────────────────────────────────────────────────────────────────
add_action( 'init', [ 'KH_Frontend', 'register_cpt' ] );
add_action( 'init', [ 'KH_Frontend', 'register_rewrite' ] );
add_action( 'rest_api_init', [ 'KH_REST_API', 'register_routes' ] );
add_action( 'admin_menu', [ 'KH_Admin', 'add_menu' ] );
add_action( 'admin_enqueue_scripts', [ 'KH_Admin', 'enqueue_scripts' ] );
add_action( 'template_redirect', [ 'KH_Frontend', 'maybe_serve_app' ] );
add_filter( 'query_vars', [ 'KH_Frontend', 'add_query_vars' ] );

// Expose REST URL to the admin page via JS
add_action( 'admin_head', function () {
    $screen = get_current_screen();
    if ( $screen && str_contains( $screen->id, 'kindness-hearts' ) ) {
        printf(
            '<script>var KH = %s;</script>',
            wp_json_encode( [
                'restUrl'    => esc_url_raw( rest_url( 'kindness/v1' ) ),
                'nonce'      => wp_create_nonce( 'wp_rest' ),
                'pluginUrl'  => KH_PLUGIN_URL,
                'appUrl'     => KH_APP_URL,
                'secretToken'=> get_option( 'kh_secret_token' ),
                'siteUrl'    => site_url(),
            ] )
        );
    }
} );
