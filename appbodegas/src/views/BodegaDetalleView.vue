<template>
  <div class="detalle-page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7l-8 4-8-4v-7l8-4.32z"/><path d="M12 6L6 9v6l6 3 6-3V9l-6-3z" opacity=".4"/></svg>
        <span>Bodegas de Maíz</span>
      </div>
      <nav class="header-nav">
        <router-link to="/">Mapa</router-link>
        <span style="opacity:0.4;cursor:default;padding:0.375rem 0.875rem;font-size:0.85rem">Inventarios</span>
        <span style="opacity:0.4;cursor:default;padding:0.375rem 0.875rem;font-size:0.85rem">Simulador</span>
      </nav>
      <div class="header-spacer"></div>
      <div class="header-user">
        <span class="header-user-name">{{ authStore.usuario?.nombre_completo }}</span>
        <button class="btn-logout" @click="handleLogout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Salir
        </button>
      </div>
    </header>

    <main class="detalle-main">
      <div v-if="loading" class="detalle-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando información...</span>
      </div>

      <div v-else-if="bodega" class="detalle-content">
        <!-- Breadcrumb -->
        <div class="detalle-breadcrumb">
          <router-link to="/">← Volver al mapa</router-link>
        </div>

        <!-- Encabezado -->
        <div class="detalle-header-card">
          <div class="detalle-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M3 21V7l9-4 9 4v14H3z"/></svg>
          </div>
          <div class="detalle-header-info">
            <h1 class="detalle-title">{{ bodega.nombre }}</h1>
            <p class="detalle-subtitle" v-if="bodega.clave">Clave: {{ bodega.clave }}</p>
            <p class="detalle-location">
              {{ bodega.municipio }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado }}
              <span v-if="bodega.region_nombre"> — {{ bodega.region_nombre }}</span>
            </p>
          </div>
        </div>

        <!-- KPI inventario -->
        <div class="detalle-kpi-grid">
          <div class="detalle-kpi total">
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_total) }}</div>
            <div class="detalle-kpi-label">Toneladas totales</div>
          </div>
          <div class="detalle-kpi nacional">
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_nacional) }}</div>
            <div class="detalle-kpi-label">Nacional</div>
          </div>
          <div class="detalle-kpi importacion">
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_importacion) }}</div>
            <div class="detalle-kpi-label">Importación</div>
          </div>
        </div>

        <!-- Información detallada -->
        <div class="detalle-info-card">
          <h3>Información de ubicación</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Dirección</span>
              <span class="info-value">{{ bodega.direccion || 'Sin dirección registrada' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Municipio</span>
              <span class="info-value">{{ bodega.municipio || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="info-value">{{ bodega.estado || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Región</span>
              <span class="info-value">{{ bodega.region_nombre || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Capacidad</span>
              <span class="info-value">{{ bodega.capacidad_m2 ? bodega.capacidad_m2.toLocaleString() + ' m²' : '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Coordenadas</span>
              <span class="info-value">{{ bodega.latitud.toFixed(4) }}, {{ bodega.longitud.toFixed(4) }}</span>
            </div>
            <div class="info-row" v-if="bodega.fecha_actualizacion">
              <span class="info-label">Última actualización</span>
              <span class="info-value">{{ new Date(bodega.fecha_actualizacion).toLocaleDateString('es-MX') }}</span>
            </div>
          </div>
        </div>

        <!-- Mini mapa -->
        <div class="detalle-map-card">
          <h3>Ubicación en mapa</h3>
          <div class="detalle-minimap" ref="minimapContainer"></div>
        </div>
      </div>

      <div v-else class="detalle-error">
        <p>No se encontró la bodega solicitada.</p>
        <router-link to="/" class="btn btn-primary">Volver al mapa</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const bodega = ref<Bodega | null>(null)
const loading = ref(true)
const minimapContainer = ref<HTMLDivElement>()
let minimap: mapboxgl.Map | null = null

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

function formatNumber(n: number): string {
  if (n == null) return '0'
  return n.toLocaleString('es-MX')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function loadBodega() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await api.bodegas.obtener(id)
    bodega.value = res.bodega

    // Init minimap after data loads
    setTimeout(() => {
      if (bodega.value && minimapContainer.value) {
        minimap = new mapboxgl.Map({
          container: minimapContainer.value,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [bodega.value.longitud, bodega.value.latitud],
          zoom: 12,
          interactive: false,
          attributionControl: false,
        })

        const el = document.createElement('div')
        el.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#691C32;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);'

        new mapboxgl.Marker({ element: el })
          .setLngLat([bodega.value.longitud, bodega.value.latitud])
          .addTo(minimap)
      }
    }, 100)
  } catch (err) {
    console.error('Error cargando bodega:', err)
    bodega.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBodega()
})

onUnmounted(() => {
  if (minimap) { minimap.remove(); minimap = null }
})
</script>

<style scoped>
.detalle-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.detalle-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 76px 1.25rem 2rem;
}

.detalle-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: var(--color-text-muted);
}

.detalle-breadcrumb {
  margin-bottom: 1rem;
}

.detalle-breadcrumb a {
  font-size: 0.875rem;
  color: var(--color-primary);
  font-weight: 500;
}

.detalle-breadcrumb a:hover {
  text-decoration: underline;
}

.detalle-header-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.detalle-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detalle-header-info {
  flex: 1;
}

.detalle-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.detalle-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.detalle-location {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* KPI grid */
.detalle-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.detalle-kpi {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  text-align: center;
  border-top: 3px solid var(--color-text-muted);
}

.detalle-kpi.total { border-top-color: var(--color-kpi-toneladas); }
.detalle-kpi.nacional { border-top-color: var(--color-kpi-nacional); }
.detalle-kpi.importacion { border-top-color: var(--color-kpi-importacion); }

.detalle-kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.detalle-kpi-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* Info card */
.detalle-info-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.25rem;
}

.detalle-info-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  font-size: 0.85rem;
  color: var(--color-text);
  font-weight: 500;
  text-align: right;
}

/* Minimap */
.detalle-map-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.detalle-map-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.detalle-minimap {
  width: 100%;
  height: 250px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Error */
.detalle-error {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-secondary);
}

.detalle-error p {
  margin-bottom: 1rem;
}

@media (max-width: 480px) {
  .detalle-kpi-grid {
    grid-template-columns: 1fr;
  }

  .detalle-header-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    gap: 0.125rem;
  }

  .info-value {
    text-align: left;
  }
}
</style>
