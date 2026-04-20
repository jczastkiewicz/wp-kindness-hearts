<?php

/**
 * REST API endpoints for Kindness Hearts.
 *
 * Public endpoints (no auth):
 *   GET  /kindness/v1/classes          – list all classes with point counts
 *   GET  /kindness/v1/total            – school-wide total
 *
 * Token-protected endpoints (require ?token=SECRET or X-KHearts-Token header):
 *   POST /kindness/v1/points           – add a point to a class
 *     (token may alternatively be sent as X-KHearts-Token header)
 *
 * WP-admin only:
 *   POST /kindness/v1/classes          – create a class
 *   DELETE /kindness/v1/classes/{id}   – delete a class
 *   POST /kindness/v1/reset            – reset all points
 *   POST /kindness/v1/token/regenerate – regenerate secret token
 */

defined('ABSPATH') || exit;

class KHearts_REST_API
{
    public static function register_routes(): void
    {
        $ns = 'kindness/v1';

        // Classes list
        register_rest_route($ns, '/classes', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [self::class, 'get_classes'],
                // Intentionally public — read-only list of class names and points,
                // the same data displayed on the public heart screen.
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'create_class'],
                'permission_callback' => [self::class, 'admin_permission'],
                'args' => [
                    'name' => [
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
        ]);

        // Single class delete
        register_rest_route($ns, '/classes/(?P<id>[\d]+)', [
            'methods' => WP_REST_Server::DELETABLE,
            'callback' => [self::class, 'delete_class'],
            'permission_callback' => [self::class, 'admin_permission'],
        ]);

        // Add a point (token-protected)
        register_rest_route($ns, '/points', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'add_point'],
            'permission_callback' => [self::class, 'token_permission'],
            'args' => [
                'class_id' => [
                    'required' => true,
                    'validate_callback' => fn ($v) => is_numeric($v) && $v > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        // School-wide total
        register_rest_route($ns, '/total', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [self::class, 'get_total'],
            // Intentionally public — aggregate point count shown on the public heart display.
            'permission_callback' => '__return_true',
        ]);

        // Reset all (admin)
        register_rest_route($ns, '/reset', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'reset_all'],
            'permission_callback' => [self::class, 'admin_permission'],
        ]);

        // Regenerate token (admin)
        register_rest_route($ns, '/token/regenerate', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'regenerate_token'],
            'permission_callback' => [self::class, 'admin_permission'],
        ]);

        // Return current token (admin-only) — used by the admin page to lazily
        // fetch the teacher QR token instead of embedding it in page HTML.
        register_rest_route($ns, '/token', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [self::class, 'get_token'],
            'permission_callback' => [self::class, 'admin_permission'],
        ]);
    }

    // ── Permission callbacks ─────────────────────────────────────────────────

    public static function admin_permission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Token can be passed as ?token=... query param OR X-KHearts-Token header.
     *
     * Returns false (→ 401) when no token is provided at all.
     * Returns WP_Error 403 when a token is provided but doesn't match.
     * This lets callers distinguish "missing token" from "wrong token".
     */
    public static function token_permission(WP_REST_Request $request): bool|WP_Error
    {
        $stored = get_option('khearts_secret_token', '');
        if (! $stored) {
            return new WP_Error('no_token_configured', 'No token configured', ['status' => 403]);
        }
        $provided = $request->get_param('token')
                    ?? $request->get_header('X-KHearts-Token')
                    ?? '';
        if (! $provided) {
            return false; // No token at all → WordPress returns 401
        }
        if (! hash_equals($stored, (string) $provided)) {
            return new WP_Error('invalid_token', 'Invalid token', ['status' => 403]);
        }

        return true;
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    public static function get_classes(): WP_REST_Response|WP_Error
    {
        $posts = get_posts([
            'post_type' => 'khearts_class',
            'post_status' => 'publish',
            // Cap results to avoid unbounded lists on very large installs
            'posts_per_page' => 500,
            'orderby' => 'title',
            'order' => 'ASC',
        ]);

        $data = array_map(function (WP_Post $p) {
            return [
                'id' => $p->ID,
                'name' => $p->post_title,
                'points' => (int) get_post_meta($p->ID, '_khearts_points', true),
            ];
        }, $posts);

        return rest_ensure_response($data);
    }

    public static function create_class(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $raw = $request->get_param('name');
        $name = trim(sanitize_text_field((string) $raw));

        // Validate length and content: non-empty, max 100 chars
        if ($name === '' || mb_strlen($name) > 100) {
            return new WP_Error('invalid_name', 'Class name must be between 1 and 100 characters', ['status' => 400]);
        }

        // Uniqueness: do not allow duplicate class titles
        $existing = get_page_by_title($name, OBJECT, 'khearts_class');
        if ($existing) {
            return new WP_Error('conflict', 'A class with that name already exists', ['status' => 409]);
        }

        $id = wp_insert_post([
            'post_type' => 'khearts_class',
            'post_status' => 'publish',
            'post_title' => $name,
        ], true); // pass $wp_error=true so failures return WP_Error, not 0

        if (is_wp_error($id)) {
            return $id;
        }

        update_post_meta($id, '_khearts_points', 0);

        return rest_ensure_response([
            'id' => $id,
            'name' => $name,
            'points' => 0,
        ]);
    }

    public static function delete_class(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $id = (int) $request->get_param('id');
        $post = get_post($id);

        if (! $post || $post->post_type !== 'khearts_class') {
            return new WP_Error('not_found', 'Class not found', ['status' => 404]);
        }

        $points = (int) get_post_meta($id, '_khearts_points', true);
        wp_delete_post($id, true);

        // Subtract from school total
        $total = (int) get_option('khearts_total_points', 0);
        update_option('khearts_total_points', max(0, $total - $points));

        return rest_ensure_response(['deleted' => true, 'id' => $id]);
    }

    public static function add_point(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $class_id = $request->get_param('class_id');
        $post = get_post($class_id);

        if (! $post || $post->post_type !== 'khearts_class') {
            return new WP_Error('not_found', 'Class not found', ['status' => 404]);
        }

        // Simple per-IP rate limit: 60 taps/minute per IP using WP transients.
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $rl_key = 'khearts_rl_' . md5($ip);
        $rl_count = (int) get_transient($rl_key);
        if ($rl_count >= 60) {
            return new WP_Error('rate_limited', 'Rate limit exceeded', ['status' => 429]);
        }
        set_transient($rl_key, $rl_count + 1, MINUTE_IN_SECONDS);

        global $wpdb;

        // Atomic increment for class points using direct SQL update to avoid
        // race conditions on concurrent requests. If the meta row doesn't
        // exist we fall back to creating it with update_post_meta/add_post_meta.
        $meta_table = $wpdb->postmeta;
        $wpdb->query($wpdb->prepare(
            "UPDATE {$meta_table}
               SET meta_value = CAST(meta_value AS UNSIGNED) + 1
             WHERE post_id = %d AND meta_key = '_khearts_points'",
            $class_id
        ));

        if ($wpdb->rows_affected === 0) {
            // No existing meta row — initialize to 1
            update_post_meta($class_id, '_khearts_points', 1);
        }

        // Re-read the value to return the updated count
        $class_points = (int) get_post_meta($class_id, '_khearts_points', true);

        // Atomic increment for the school total stored in options table.
        $options_table = $wpdb->options;
        $wpdb->query($wpdb->prepare(
            "UPDATE {$options_table}
               SET option_value = CAST(option_value AS UNSIGNED) + 1
             WHERE option_name = %s",
            'khearts_total_points'
        ));

        if ($wpdb->rows_affected === 0) {
            // Option didn't exist — create it with initial value 1
            add_option('khearts_total_points', 1, '', false);
        }

        $total = (int) get_option('khearts_total_points', 0);

        return rest_ensure_response([
            'class_id' => $class_id,
            'class_points' => $class_points,
            'total_points' => $total,
        ]);
    }

    public static function get_total(): WP_REST_Response|WP_Error
    {
        return rest_ensure_response([
            'total' => (int) get_option('khearts_total_points', 0),
        ]);
    }

    public static function reset_all(): WP_REST_Response|WP_Error
    {
        update_option('khearts_total_points', 0);

        $posts = get_posts([
            'post_type' => 'khearts_class',
            'post_status' => 'publish',
            'posts_per_page' => -1,
        ]);

        foreach ($posts as $p) {
            update_post_meta($p->ID, '_khearts_points', 0);
        }

        return rest_ensure_response(['reset' => true]);
    }

    public static function regenerate_token(): WP_REST_Response|WP_Error
    {
        $token = wp_generate_password(32, false);
        update_option('khearts_secret_token', $token);

        // Do not return the token in the response body — admin UI reloads and
        // reads the token via wp_localize_script or the /token endpoint.
        return rest_ensure_response(['success' => true]);
    }

    public static function get_token(): WP_REST_Response|WP_Error
    {
        $token = get_option('khearts_secret_token', '');
        if (! $token) {
            return new WP_Error('no_token', 'No token configured', ['status' => 404]);
        }

        return rest_ensure_response(['token' => $token]);
    }
}
