<?php

// If uninstall is not called from WordPress, abort.
if (! defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Support multisite: run uninstall on each blog if necessary.
if (function_exists('is_multisite') && is_multisite()) {
    $blog_ids = array_map(function ($b) {
        return (int) $b->blog_id;
    }, get_sites(['fields' => 'ids']));
} else {
    $blog_ids = [get_current_blog_id()];
}

foreach ($blog_ids as $blog_id) {
    if (function_exists('switch_to_blog')) {
        switch_to_blog($blog_id);
    }

    // Delete options
    delete_option('khearts_secret_token');
    delete_option('khearts_school_name');
    delete_option('khearts_total_points');

    // Delete all khearts_class posts and their meta
    $posts = get_posts([
        'post_type' => 'khearts_class',
        'post_status' => 'any',
        'posts_per_page' => -1,
        'fields' => 'ids',
    ]);

    if (! empty($posts)) {
        foreach ($posts as $pid) {
            // Force delete (bypass trash) to remove meta and attachments
            wp_delete_post($pid, true);
        }
    }

    if (function_exists('restore_current_blog')) {
        restore_current_blog();
    }
}

// Optionally: remove rewrite rules (themes/plugins normally do this on deactivation)
flush_rewrite_rules();
