import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite config for the Kindness Hearts React PWA.
 *
 * Build output goes to ../app/dist/ which WordPress enqueues.
 * Base is set to the plugin's URL at runtime via window.WP_CONFIG,
 * but during build we use './' so assets resolve correctly.
 */
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['heart-192.png', 'heart-512.png', 'favicon.ico'],
      manifest: false, // We provide our own manifest.json in public/
      workbox: {
        // Exclude index.html from precache because build-plugin.sh and CI exclude it
        // from the zip. This prevents the service worker install from failing when
        // index.html is not present in the shipped artifact.
        globPatterns: ['**/*.{js,css,png,svg,ico}'],
        globIgnores: ['index.html'],
        runtimeCaching: [
          {
            // Cache WP REST API calls for offline fallback
            urlPattern: /\/wp-json\/kindness\/v1\/(classes|total)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kh-api-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    // Proxy API calls to local WordPress during development
    proxy: {
      '/wp-json': {
        target: 'http://localhost:8080',  // change to your local WP URL
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['src/**'],
      exclude: ['src/main.jsx'],
      thresholds: {
        lines: 0,      // raise these as you add unit tests
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});
