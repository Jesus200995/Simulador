<template>
  <div class="map-page">
    <!-- Header - frosted glass -->
    <header class="app-header">
      <div class="header-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/><path d="M3 8l9-5 9 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Bodegas de Maiz</span>
      </div>
      <nav class="header-nav">
        <router-link to="/" class="active">Mapa</router-link>
        <span>Inventarios</span>
        <span>Simulador</span>
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

    <!-- Desktop layout -->
    <div class="visor-layout">
      <!-- Panel izquierdo - glassmorphism -->
      <aside class="visor-panel">
        <div class="visor-panel-scroll">
          <!-- Buscador -->
          <div class="panel-search">
            <div class="search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                v-model="searchText"
                type="text"
                class="search-input"
                placeholder="Buscar bodega..."
                @input="onSearch"
              />
            </div>
          </div>

          <!-- Filtros -->
          <div class="panel-filters">
            <select v-model="filters.region_id" class="filter-select" @change="onFilterChange">
              <option :value="null">Todas las regiones</option>
              <option v-for="r in catalogos.regiones" :key="r.id" :value="r.id">{{ r.nombre }}</option>
            </select>
            <select v-model="filters.estado" class="filter-select" @change="onFilterChange">
              <option :value="null">Todos los estados</option>
              <option v-for="e in estadosFiltrados" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
            </select>
            <select v-model="filters.municipio" class="filter-select" @change="onFilterChange">
              <option :value="null">Todos los municipios</option>
              <option v-for="m in municipiosFiltrados" :key="m.municipio" :value="m.municipio">{{ m.municipio }}</option>
            </select>
          </div>

          <!-- KPI widgets -->
          <div class="panel-kpi">
            <div class="kpi-card bodegas">
              <span class="kpi-value">{{ kpi.total_bodegas }}</span>
              <span class="kpi-label">Bodegas</span>
            </div>
            <div class="kpi-card toneladas">
              <span class="kpi-value">{{ formatNumber(kpi.total_toneladas) }}</span>
              <span class="kpi-label">Toneladas</span>
            </div>
            <div class="kpi-card nacional">
              <span class="kpi-value">{{ formatNumber(kpi.total_nacional) }}</span>
              <span class="kpi-label">Nacional</span>
            </div>
            <div class="kpi-card importacion">
              <span class="kpi-value">{{ formatNumber(kpi.total_importacion) }}</span>
              <span class="kpi-label">Importacion</span>
            </div>
          </div>

          <!-- Lista -->
          <div class="panel-list-header">
            Bodegas ({{ bodegas.length }})
          </div>

          <div v-if="loading" class="panel-loading">
            <div class="spinner spinner-dark spinner-lg"></div>
            <span>Cargando bodegas...</span>
          </div>

          <ul v-else class="bodega-list">
            <li
              v-for="bodega in bodegas"
              :key="bodega.id"
              class="bodega-item"
              :class="{ active: selectedBodega?.id === bodega.id }"
              @click="selectBodega(bodega)"
            >
              <div class="bodega-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
              </div>
              <div class="bodega-info">
                <div class="bodega-nombre">{{ bodega.nombre }}</div>
                <div class="bodega-ubicacion">{{ bodega.municipio || '' }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado || '' }}</div>
                <div class="bodega-toneladas"><strong>{{ formatNumber(bodega.toneladas_total) }}</strong> ton</div>
              </div>
              <svg class="bodega-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li v-if="bodegas.length === 0" class="bodega-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.25;margin-bottom:0.5rem"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              No se encontraron bodegas
            </li>
          </ul>
        </div>
      </aside>

      <!-- Mapa -->
      <div class="visor-map" ref="mapContainer"></div>
    </div>

    <!-- Mobile bottom sheet -->
    <div class="mobile-sheet" :class="{ collapsed: sheetCollapsed }">
      <div class="sheet-handle" @click="sheetCollapsed = !sheetCollapsed">
        <div class="sheet-handle-bar"></div>
      </div>
      <div class="sheet-tabs">
        <button class="sheet-tab" :class="{ active: mobileTab === 'filtros' }" @click="mobileTab = 'filtros'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filtros
        </button>
        <button class="sheet-tab" :class="{ active: mobileTab === 'lista' }" @click="mobileTab = 'lista'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Lista ({{ bodegas.length }})
        </button>
      </div>
      <div class="sheet-content">
        <!-- Tab filtros -->
        <template v-if="mobileTab === 'filtros'">
          <div class="panel-search">
            <div class="search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                v-model="searchText"
                type="text"
                class="search-input"
                placeholder="Buscar bodega..."
                @input="onSearch"
              />
            </div>
          </div>
          <div class="panel-filters" style="flex-direction:column">
            <select v-model="filters.region_id" class="filter-select" @change="onFilterChange">
              <option :value="null">Todas las regiones</option>
              <option v-for="r in catalogos.regiones" :key="r.id" :value="r.id">{{ r.nombre }}</option>
            </select>
            <select v-model="filters.estado" class="filter-select" @change="onFilterChange">
              <option :value="null">Todos los estados</option>
              <option v-for="e in estadosFiltrados" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
            </select>
            <select v-model="filters.municipio" class="filter-select" @change="onFilterChange">
              <option :value="null">Todos los municipios</option>
              <option v-for="m in municipiosFiltrados" :key="m.municipio" :value="m.municipio">{{ m.municipio }}</option>
            </select>
          </div>
          <div class="panel-kpi">
            <div class="kpi-card bodegas">
              <span class="kpi-value">{{ kpi.total_bodegas }}</span>
              <span class="kpi-label">Bodegas</span>
            </div>
            <div class="kpi-card toneladas">
              <span class="kpi-value">{{ formatNumber(kpi.total_toneladas) }}</span>
              <span class="kpi-label">Toneladas</span>
            </div>
            <div class="kpi-card nacional">
              <span class="kpi-value">{{ formatNumber(kpi.total_nacional) }}</span>
              <span class="kpi-label">Nacional</span>
            </div>
            <div class="kpi-card importacion">
              <span class="kpi-value">{{ formatNumber(kpi.total_importacion) }}</span>
              <span class="kpi-label">Importacion</span>
            </div>
          </div>
        </template>
        <!-- Tab lista -->
        <template v-if="mobileTab === 'lista'">
          <ul class="bodega-list">
            <li
              v-for="bodega in bodegas"
              :key="bodega.id"
              class="bodega-item"
              :class="{ active: selectedBodega?.id === bodega.id }"
              @click="selectBodega(bodega); sheetCollapsed = true"
            >
              <div class="bodega-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
              </div>
              <div class="bodega-info">
                <div class="bodega-nombre">{{ bodega.nombre }}</div>
                <div class="bodega-ubicacion">{{ bodega.municipio || '' }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado || '' }}</div>
                <div class="bodega-toneladas"><strong>{{ formatNumber(bodega.toneladas_total) }}</strong> ton</div>
              </div>
              <svg class="bodega-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li v-if="bodegas.length === 0" class="bodega-empty">No se encontraron bodegas</li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega, Catalogos, KpiAgregado } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []
let activePopup: mapboxgl.Popup | null = null

const bodegas = ref<Bodega[]>([])
const selectedBodega = ref<Bodega | null>(null)
const loading = ref(true)
const searchText = ref('')
const sheetCollapsed = ref(true)
const mobileTab = ref<'filtros' | 'lista'>('filtros')
const isMobile = ref(window.innerWidth <= 768)

const catalogos = reactive<Catalogos>({ regiones: [], estados: [], municipios: [] })
const kpi = reactive<KpiAgregado>({ total_bodegas: 0, total_toneladas: 0, total_nacional: 0, total_importacion: 0 })
const filters = reactive<{ region_id: number | null; estado: string | null; municipio: string | null }>({
  region_id: null,
  estado: null,
  municipio: null,
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Filtros dependientes
const estadosFiltrados = computed(() => {
  if (!filters.region_id) return catalogos.estados
  return catalogos.estados.filter((e) => e.region_id === filters.region_id)
})

const municipiosFiltrados = computed(() => {
  if (!filters.estado) return catalogos.municipios
  return catalogos.municipios.filter((m) => m.estado === filters.estado)
})

function formatNumber(n: number): string {
  if (n == null) return '0'
  return n.toLocaleString('es-MX')
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchBodegas()
  }, 400)
}

function onFilterChange() {
  // Limpiar dependientes
  if (!filters.region_id) {
    filters.estado = null
    filters.municipio = null
  }
  if (!filters.estado) {
    filters.municipio = null
  }
  fetchBodegas()
}

async function fetchCatalogos() {
  try {
    const data = await api.bodegas.catalogos()
    catalogos.regiones = data.regiones
    catalogos.estados = data.estados
    catalogos.municipios = data.municipios
  } catch (err) {
    console.error('Error cargando catalogos:', err)
  }
}

async function fetchBodegas() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.region_id) params.region_id = filters.region_id
    if (filters.estado) params.estado = filters.estado
    if (filters.municipio) params.municipio = filters.municipio
    if (searchText.value.trim()) params.q = searchText.value.trim()

    const res = await api.bodegas.listar(params)
    bodegas.value = res.bodegas
    Object.assign(kpi, res.kpi)

    await nextTick()
    addMarkers()
    fitMapToBodegas()
  } catch (err) {
    console.error('Error cargando bodegas:', err)
  } finally {
    loading.value = false
  }
}

function addMarkers() {
  markers.forEach((m) => m.remove())
  markers.length = 0
  if (activePopup) { activePopup.remove(); activePopup = null }

  bodegas.value.forEach((bodega) => {
    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #691C32, #8B2A45); border: 2px solid white;
      box-shadow: 0 2px 8px rgba(105,28,50,0.35), 0 1px 3px rgba(0,0,0,0.12);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
    `
    el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>'
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; el.style.boxShadow = '0 4px 14px rgba(105,28,50,0.45), 0 2px 6px rgba(0,0,0,0.15)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.boxShadow = '0 2px 8px rgba(105,28,50,0.35), 0 1px 3px rgba(0,0,0,0.12)' })

    const popupHtml = `
      <div class="popup-header">
        <div class="popup-title">${sanitize(bodega.nombre)}</div>
        ${bodega.clave ? '<div class="popup-clave">' + sanitize(bodega.clave) + '</div>' : ''}
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Region</span><strong>${sanitize(bodega.region_nombre || '-')}</strong></div>
        <div class="popup-row"><span>Estado</span><strong>${sanitize(bodega.estado || '-')}</strong></div>
        <div class="popup-row"><span>Municipio</span><strong>${sanitize(bodega.municipio || '-')}</strong></div>
        <div class="popup-row"><span>Toneladas</span><strong>${formatNumber(bodega.toneladas_total)}</strong></div>
        <button class="popup-btn" onclick="window.__verInventario(${bodega.id})">Ver detalle →</button>
      </div>
    `

    const popup = new mapboxgl.Popup({ offset: 18, closeButton: true, maxWidth: '260px' })
      .setHTML(popupHtml)

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

function sanitize(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function selectBodega(bodega: Bodega) {
  selectedBodega.value = bodega
  if (!map) return

  map.flyTo({
    center: [bodega.longitud, bodega.latitud],
    zoom: 12,
    duration: 1200,
    essential: true,
  })

  const idx = bodegas.value.findIndex((b) => b.id === bodega.id)
  if (idx !== -1 && markers[idx]) {
    markers.forEach((m) => { if (m.getPopup()?.isOpen()) m.togglePopup() })
    markers[idx].togglePopup()
  }
}

function fitMapToBodegas() {
  if (!map || bodegas.value.length === 0) return
  const bounds = new mapboxgl.LngLatBounds()
  bodegas.value.forEach((b) => bounds.extend([b.longitud, b.latitud]))
  map.fitBounds(bounds, {
    padding: { top: 60, bottom: 60, left: isMobile.value ? 40 : 400, right: 40 },
    duration: 1000,
  })
}

function initMap() {
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-99.1332, 19.4326],
    zoom: 5,
    attributionControl: false,
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
  map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), 'bottom-right')
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left')
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

  map.on('load', () => {
    fetchBodegas()
  })
}

// Global handler para popup "Ver inventario"
;(window as any).__verInventario = (id: number) => {
  router.push('/bodega/' + id)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
  fetchCatalogos()
  initMap()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  delete (window as any).__verInventario
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.map-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
