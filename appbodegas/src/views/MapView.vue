<template>
  <div class="map-page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-brand">
        <img src="/favicon.svg" alt="Logo" />
        <span>Bodegas</span>
      </div>
      <div class="header-user">
        <span class="header-user-name">{{ authStore.usuario?.nombre_completo }}</span>
        <button class="btn-logout" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </header>

    <!-- Sidebar Toggle (Desktop) -->
    <button
      class="sidebar-toggle"
      :class="{ shifted: !sidebarCollapsed }"
      @click="sidebarCollapsed = !sidebarCollapsed"
    >
      <svg v-if="sidebarCollapsed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Sidebar / Bottom Sheet -->
    <aside class="map-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="map-sidebar-header" @click="handleSheetToggle">
        <h2 class="map-sidebar-title">
          Bodegas
          <span v-if="bodegas.length" class="bodega-count">({{ bodegas.length }})</span>
        </h2>
        <div class="sidebar-search">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Buscar bodega..."
          />
        </div>
      </div>

      <div v-if="loadingBodegas" class="sidebar-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando bodegas...</span>
      </div>

      <ul v-else class="bodega-list">
        <li
          v-for="bodega in filteredBodegas"
          :key="bodega.id"
          class="bodega-item"
          :class="{ active: selectedBodega?.id === bodega.id }"
          @click="selectBodega(bodega)"
        >
          <div class="bodega-nombre">{{ bodega.nombre }}</div>
          <div class="bodega-direccion">{{ bodega.direccion || 'Sin dirección' }}</div>
          <div class="bodega-meta">
            <span
              class="bodega-estado"
              :class="bodega.estado"
            >
              <span class="estado-dot"></span>
              {{ bodega.estado }}
            </span>
            <span v-if="bodega.capacidad_m2" class="bodega-capacidad">
              {{ bodega.capacidad_m2.toLocaleString() }} m²
            </span>
          </div>
        </li>
        <li v-if="filteredBodegas.length === 0" class="bodega-empty">
          No se encontraron bodegas
        </li>
      </ul>
    </aside>

    <!-- Map -->
    <div
      class="map-container"
      :class="{ 'with-sidebar': !sidebarCollapsed }"
      ref="mapContainer"
    ></div>

    <!-- Bodega Detail Popup (mobile) -->
    <transition name="slide-up">
      <div v-if="selectedBodega && isMobile" class="bodega-detail-card">
        <button class="detail-close" @click="selectedBodega = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h3 class="detail-title">{{ selectedBodega.nombre }}</h3>
        <p class="detail-address">{{ selectedBodega.direccion }}</p>
        <div class="detail-badges">
          <span class="bodega-estado" :class="selectedBodega.estado">
            {{ selectedBodega.estado }}
          </span>
          <span v-if="selectedBodega.capacidad_m2" class="detail-capacity">
            {{ selectedBodega.capacidad_m2.toLocaleString() }} m²
          </span>
        </div>
        <p v-if="selectedBodega.descripcion" class="detail-desc">
          {{ selectedBodega.descripcion }}
        </p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []

const bodegas = ref<Bodega[]>([])
const selectedBodega = ref<Bodega | null>(null)
const sidebarCollapsed = ref(false)
const loadingBodegas = ref(true)
const searchQuery = ref('')
const isMobile = ref(window.innerWidth <= 768)

// Token de Mapbox desde variable de entorno
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const filteredBodegas = computed(() => {
  if (!searchQuery.value.trim()) return bodegas.value
  const q = searchQuery.value.toLowerCase()
  return bodegas.value.filter(
    (b) =>
      b.nombre.toLowerCase().includes(q) ||
      (b.direccion && b.direccion.toLowerCase().includes(q)) ||
      b.estado.toLowerCase().includes(q)
  )
})

function handleResize() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

function handleSheetToggle() {
  if (isMobile.value) {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function getEstadoColor(estado: string): string {
  switch (estado) {
    case 'disponible': return '#22c55e'
    case 'ocupada': return '#ef4444'
    case 'mantenimiento': return '#f59e0b'
    default: return '#64748b'
  }
}

function addMarkers() {
  // Limpiar marcadores previos
  markers.forEach((m) => m.remove())
  markers.length = 0

  bodegas.value.forEach((bodega) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${getEstadoColor(bodega.estado)};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease;
    `
    el.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M3 21V7l9-4 9 4v14H3z"/>
        <rect x="9" y="13" width="6" height="8" fill="${getEstadoColor(bodega.estado)}"/>
      </svg>
    `
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
    })

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      maxWidth: '280px',
    }).setHTML(`
      <div class="popup-title">${bodega.nombre}</div>
      <div class="popup-address">${bodega.direccion || 'Sin dirección'}</div>
      <div class="popup-detail">
        <strong>Estado:</strong> ${bodega.estado}<br/>
        ${bodega.capacidad_m2 ? `<strong>Capacidad:</strong> ${bodega.capacidad_m2.toLocaleString()} m²` : ''}
      </div>
    `)

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([bodega.longitud, bodega.latitud])
      .setPopup(popup)
      .addTo(map!)

    marker.getElement().addEventListener('click', () => {
      selectedBodega.value = bodega
    })

    markers.push(marker)
  })
}

function selectBodega(bodega: Bodega) {
  selectedBodega.value = bodega

  if (map) {
    map.flyTo({
      center: [bodega.longitud, bodega.latitud],
      zoom: 14,
      duration: 1500,
      essential: true,
    })

    // Abrir popup del marcador
    const idx = bodegas.value.findIndex((b) => b.id === bodega.id)
    if (idx !== -1 && markers[idx]) {
      markers.forEach((m) => {
        if (m.getPopup()?.isOpen()) m.togglePopup()
      })
      markers[idx].togglePopup()
    }
  }

  // En mobile, colapsar sidebar
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

function fitMapToBodegas() {
  if (!map || bodegas.value.length === 0) return

  const bounds = new mapboxgl.LngLatBounds()
  bodegas.value.forEach((b) => {
    bounds.extend([b.longitud, b.latitud])
  })

  map.fitBounds(bounds, {
    padding: { top: 80, bottom: 80, left: isMobile.value ? 40 : 400, right: 40 },
    duration: 1000,
  })
}

async function loadBodegas() {
  loadingBodegas.value = true
  try {
    const res = await api.bodegas.listar()
    bodegas.value = res.bodegas
    await nextTick()
    addMarkers()
    fitMapToBodegas()
  } catch (error) {
    console.error('Error cargando bodegas:', error)
  } finally {
    loadingBodegas.value = false
  }
}

function initMap() {
  if (!mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-99.1332, 19.4326], // CDMX por defecto
    zoom: 5,
    attributionControl: false,
  })

  // Controles
  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }),
    'bottom-right'
  )
  map.addControl(new mapboxgl.ScaleControl(), 'bottom-left')
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

  map.on('load', () => {
    loadBodegas()
  })
}

watch(filteredBodegas, () => {
  if (map) {
    addMarkers()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
  initMap()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-container.with-sidebar {
  left: 360px;
}

.bodega-count {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.sidebar-search {
  margin-top: 0.75rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: var(--font-family);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color var(--transition-fast);
  background: var(--color-bg);
}

.search-input:focus {
  border-color: var(--color-primary-light);
}

.sidebar-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.bodega-empty {
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.estado-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Bodega Detail Card (mobile popup) */
.bodega-detail-card {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-xl);
  z-index: 700;
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
}

.detail-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
  padding-right: 2rem;
}

.detail-address {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.detail-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.detail-capacity {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.detail-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
  line-height: 1.5;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .map-container.with-sidebar {
    left: 0;
  }
}

@media (min-width: 769px) {
  .bodega-detail-card {
    display: none;
  }
}

@media (min-width: 1200px) {
  .map-container.with-sidebar {
    left: 400px;
  }
}
</style>
