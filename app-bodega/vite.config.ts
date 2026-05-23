import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icono.png'],
      manifest: {
        name: 'SOMEC — Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México',
        short_name: 'SOMEC',
        description: 'Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México — Módulo Bodega',
        start_url: '/',
        display: 'standalone',
        background_color: '#1A5C38',
        theme_color: '#1A5C38',
        lang: 'es',
        icons: [
          { src: '/icono.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icono.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icono.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      }
    }),
  ],
  server: { port: 5174 },
})
