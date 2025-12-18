import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.webp', 'mask-icon.svg', 'qr-code-don.webp'],
      manifest: {
        name: 'Anosunu - Plateforme Anonyme',
        short_name: 'Anosunu',
        description: 'Plateforme sociale anonyme avec chambres noires et feed',
        theme_color: '#ec4899',
        background_color: '#1f2937',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff,woff2}'],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^http:\/\/127\.0\.0\.1:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 30
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // ✅ PHASE 2: Code Splitting Configuration
        // Splits large third-party libraries into separate chunks for optimal caching
        manualChunks: {
          // Split lucide-react (980 KB) into separate chunk to avoid re-downloading on code changes
          'lucide': ['lucide-react'],
          
          // Split react-router-dom (432 KB) into separate chunk
          'router': ['react-router-dom'],
          
          // Split @tanstack/react-query (included as vendor) into separate chunk for cache busting
          'query': ['@tanstack/react-query'],
          
          // Split Pusher/WebSocket into separate chunk (loaded only on demand)
          'realtime': ['pusher-js', 'laravel-echo'],
        },
      },
    },
    // Optimize build output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    // Increase chunk size limits to allow better compression
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional, remove for size)
    sourcemap: false,
  },
})
