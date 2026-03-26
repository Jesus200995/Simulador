<template>
  <div class="detalle-page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <span>Bodegas de Maiz</span>
      </div>
      <nav class="header-nav">
        <router-link to="/">Mapa</router-link>
        <span style="opacity:0.35;cursor:default;padding:0.375rem 0.875rem;font-size:0.8rem">Inventarios</span>
        <span style="opacity:0.35;cursor:default;padding:0.375rem 0.875rem;font-size:0.8rem">Simulador</span>
      </nav>
      <div class="header-spacer"></div>
      <div class="header-user">
        <span class="header-user-name">{{ authStore.usuario?.nombre_completo }}</span>
        <button class="btn-logout" @click="handleLogout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Salir
        </button>
      </div>
    </header>

    <main class="detalle-main">
      <div v-if="loading" class="detalle-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando informacion...</span>
      </div>

      <div v-else-if="bodega" class="detalle-content">
        <!-- Breadcrumb -->
        <div class="detalle-breadcrumb">
          <router-link to="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver al mapa
          </router-link>
        </div>

        <!-- Encabezado -->
        <div class="detalle-header-card">
          <div class="detalle-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div class="detalle-header-info">
            <h1 class="detalle-title">{{ bodega.nombre }}</h1>
            <p class="detalle-subtitle" v-if="bodega.clave">Clave: {{ bodega.clave }}</p>
            <p class="detalle-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ bodega.municipio }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado }}
              <span v-if="bodega.region_nombre"> · {{ bodega.region_nombre }}</span>
            </p>
          </div>
        </div>

        <!-- KPI inventario -->
        <div class="detalle-kpi-grid">
          <div class="detalle-kpi total">
            <div class="detalle-kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_total) }}</div>
            <div class="detalle-kpi-label">Toneladas totales</div>
          </div>
          <div class="detalle-kpi nacional">
            <div class="detalle-kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_nacional) }}</div>
            <div class="detalle-kpi-label">Nacional</div>
          </div>
          <div class="detalle-kpi importacion">
            <div class="detalle-kpi-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div class="detalle-kpi-value">{{ formatNumber(bodega.toneladas_importacion) }}</div>
            <div class="detalle-kpi-label">Importacion</div>
          </div>
        </div>

        <!-- Información detallada -->
        <div class="detalle-info-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Informacion de ubicacion
          </h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Direccion</span>
              <span class="info-value">{{ bodega.direccion || 'Sin direccion registrada' }}</span>
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
              <span class="info-label">Region</span>
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
              <span class="info-label">Ultima actualizacion</span>
              <span class="info-value">{{ new Date(bodega.fecha_actualizacion).toLocaleDateString('es-MX') }}</span>
            </div>
          </div>
        </div>

        <!-- Mini mapa -->
        <div class="detalle-map-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            Ubicacion en mapa
          </h3>
          <div class="detalle-minimap" ref="minimapContainer"></div>
        </div>
      </div>

      <div v-else class="detalle-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.25;margin-bottom:1rem"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No se encontro la bodega solicitada.</p>
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
        el.style.cssText = 'width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#691C32,#8B2A45);border:3px solid white;box-shadow:0 2px 8px rgba(105,28,50,0.35);'

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
  min-height: 100dvh;
  background: var(--color-bg);
}

.detalle-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 72px 1.25rem 2.5rem;
}

.detalle-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  color: var(--color-text-tertiary);
  font-size: 0.85rem;
}

/* Breadcrumb */
.detalle-breadcrumb {
  margin-bottom: 1.25rem;
}

.detalle-breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.detalle-breadcrumb a:hover {
  opacity: 0.7;
}

/* Header card */
.detalle-header-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.detalle-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #691C32, #8B2A45);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detalle-header-info {
  flex: 1;
  min-width: 0;
}

.detalle-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.2rem;
  letter-spacing: -0.01em;
}

.detalle-subtitle {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.2rem;
  font-weight: 500;
}

.detalle-location {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* KPI grid */
.detalle-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detalle-kpi {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem 1rem;
  box-shadow: var(--shadow-xs);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.detalle-kpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-text-tertiary);
  border-radius: 0 0 2px 2px;
}

.detalle-kpi.total::before { background: var(--color-kpi-toneladas); }
.detalle-kpi.nacional::before { background: var(--color-kpi-nacional); }
.detalle-kpi.importacion::before { background: var(--color-kpi-importacion); }

.detalle-kpi-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: var(--color-text-tertiary);
}

.detalle-kpi.total .detalle-kpi-icon { color: var(--color-kpi-toneladas); }
.detalle-kpi.nacional .detalle-kpi-icon { color: var(--color-kpi-nacional); }
.detalle-kpi.importacion .detalle-kpi-icon { color: var(--color-kpi-importacion); }

.detalle-kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.detalle-kpi-label {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  margin-top: 0.2rem;
}

/* Info card */
.detalle-info-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-xs);
  margin-bottom: 1rem;
}

.detalle-info-card h3,
.detalle-map-card h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-separator);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.detalle-info-card h3 svg,
.detalle-map-card h3 svg {
  color: var(--color-text-tertiary);
}

.info-grid {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-separator);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.82rem;
  color: var(--color-text);
  font-weight: 500;
  text-align: right;
}

/* Minimap */
.detalle-map-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-xs);
  margin-bottom: 2rem;
}

.detalle-minimap {
  width: 100%;
  height: 260px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Error */
.detalle-error {
  text-align: center;
  padding: 5rem 1rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detalle-error p {
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

/* Mobile */
@media (max-width: 600px) {
  .detalle-main {
    padding: 64px 1rem 2rem;
  }

  .detalle-kpi-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .detalle-kpi {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
    padding: 0.875rem 1rem;
  }

  .detalle-kpi::before {
    top: 0;
    left: 0;
    right: auto;
    bottom: 0;
    width: 3px;
    height: auto;
    border-radius: 0 2px 2px 0;
  }

  .detalle-kpi-icon {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .detalle-kpi-value {
    font-size: 1.2rem;
  }

  .detalle-kpi-label {
    margin-top: 0;
  }

  .detalle-header-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem;
  }

  .detalle-location {
    justify-content: center;
  }

  .info-row {
    flex-direction: column;
    gap: 0.15rem;
  }

  .info-value {
    text-align: left;
    color: var(--color-text-secondary);
  }

  .detalle-minimap {
    height: 200px;
  }
}
</style>
