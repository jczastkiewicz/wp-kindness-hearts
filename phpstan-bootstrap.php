<?php
/**
 * PHPStan bootstrap – defines constants that WordPress normally sets at runtime.
 * This file is NOT loaded by WordPress; it only exists for static analysis.
 */
define( 'ABSPATH', __DIR__ . '/' );
define( 'KH_VERSION',    '1.0.0' );
define( 'KH_PLUGIN_DIR', __DIR__ . '/' );
define( 'KH_PLUGIN_URL', 'https://example.com/wp-content/plugins/wp-kindness-hearts/' );
define( 'KH_APP_URL',    KH_PLUGIN_URL . 'app/dist/' );
