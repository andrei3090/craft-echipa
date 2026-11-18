/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { mockApi } from './mock/mock-api';

// GitHub Pages serves the app from /<repo>/; set BASE in the deploy workflow.
const base = process.env.BASE ?? '/';

export default defineConfig(({ command }) => ({
  base,
  plugins: [
    react(),
    tailwindcss(),
    command === 'serve' ? (mockApi() as Plugin) : null,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Craft Cafe · Echipa',
        short_name: 'Echipa',
        description: 'Checklisturile zilnice și săptămânale ale echipei',
        lang: 'ro',
        start_url: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#FBF7EF',
        theme_color: '#2F6B47',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: /config\.json$/, handler: 'NetworkFirst', options: { cacheName: 'config' } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } } },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
}));
