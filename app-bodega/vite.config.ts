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
      // En desarrollo NO registrar Service Worker (evita que intercepte la API en local)
      devOptions: { enabled: false },
      includeAssets: ['icono.png'],
      manifest: {
        name: 'SIMAC — Sistema de Ordenamiento de la Producción y Comercialización del Maíz Blanco en México',
        short_name: 'SIMAC',
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
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    }),
  ],
  // host: true expone el dev server en la red local para abrir el frontend
  // desde cualquier dispositivo (celular/otra laptop) vía http://IP-DEL-EQUIPO:5174
  server: { host: true, port: Number(process.env.PORT) || 5174 },
})
