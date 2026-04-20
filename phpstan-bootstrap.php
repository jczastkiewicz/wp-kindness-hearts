<?php

/**
 * PHPStan bootstrap – defines constants that WordPress normally sets at runtime.
 * This file is NOT loaded by WordPress; it only exists for static analysis.
 */
define('ABSPATH', __DIR__ . '/');
define('KHEARTS_VERSION', '1.0.0');
define('KHEARTS_PLUGIN_DIR', __DIR__ . '/');
define('KHEARTS_PLUGIN_URL', 'https://example.com/wp-content/plugins/wp-kindness-hearts/');
define('KHEARTS_APP_URL', KHEARTS_PLUGIN_URL . 'app/dist/');
