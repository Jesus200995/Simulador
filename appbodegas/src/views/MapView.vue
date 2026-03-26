<template>
  <div class="map-page">
    <header class="app-header">
      <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
        <svg v-if="!sidebarOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="header-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <div class="header-brand-text">
          <span class="header-brand-title">Bodegas de Maiz</span>
          <span class="header-brand-subtitle">Sistema Nacional de Monitoreo</span>
        </div>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Salir
        </button>
      </div>
    </header>

    <div class="visor-layout">
      <div class="sidebar-overlay" :class="{ active: sidebarOpen }" @click="sidebarOpen = false"></div>

      <aside class="visor-panel" :class="{ open: sidebarOpen }">
        <div class="panel-mobile-header">
          <span>Explorar Bodegas</span>
          <button class="panel-close-btn" @click="sidebarOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="visor-panel-scroll">
          <div class="panel-search">
            <div class="search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="searchText" type="text" class="search-input" placeholder="Buscar bodega, municipio..." @input="onSearch" />
            </div>
          </div>

          <div class="panel-filters">
            <select v-model="filters.estado" class="filter-select" @change="onEstadoChange">
              <option :value="null">Todos los estados</option>
              <option v-for="e in catalogos.estados" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
            </select>
            <select v-model="filters.ddr" class="filter-select" @change="onDdrChange">
              <option :value="null">Todos los DDR</option>
              <option v-for="d in ddrsFiltrados" :key="d.ddr" :value="d.ddr">{{ d.ddr }}</option>
            </select>
            <select v-model="filters.municipio" class="filter-select" @change="onFilterChange">
              <option :value="null">Todos los municipios</option>
              <option v-for="m in municipiosFiltrados" :key="m.municipio" :value="m.municipio">{{ m.municipio }}</option>
            </select>
          </div>

          <div class="panel-kpi">
            <div class="kpi-card bodegas">
              <span class="kpi-value">{{ kpi.total_bodegas.toLocaleString() }}</span>
              <span class="kpi-label">Bodegas</span>
            </div>
            <div class="kpi-card toneladas">
              <span class="kpi-value">{{ formatNumber(kpi.total_capacidad) }}</span>
              <span class="kpi-label">Cap. Toneladas</span>
            </div>
            <div class="kpi-card nacional">
              <span class="kpi-value">{{ kpi.total_estados }}</span>
              <span class="kpi-label">Estados</span>
            </div>
            <div class="kpi-card importacion">
              <span class="kpi-value">{{ kpi.total_municipios }}</span>
              <span class="kpi-label">Municipios</span>
            </div>
          </div>

          <div class="panel-list-header">
            Bodegas ({{ bodegas.length }})
          </div>

          <div v-if="loading" class="panel-loading">
            <div class="spinner spinner-dark spinner-lg"></div>
            <span>Cargando bodegas...</span>
          </div>

          <ul v-else class="bodega-list">
            <li v-for="bodega in bodegas" :key="bodega.id" class="bodega-item" :class="{ active: selectedBodega?.id === bodega.id }" @click="selectBodega(bodega)">
              <div class="bodega-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
              </div>
              <div class="bodega-info">
                <div class="bodega-nombre">{{ bodega.nombre }}</div>
                <div class="bodega-ubicacion">{{ bodega.municipio || '' }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado || '' }}</div>
                <div class="bodega-toneladas"><strong>{{ formatNumber(bodega.capacidad_toneladas) }}</strong> ton</div>
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

      <div class="visor-map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega, Catalogos, KpiAgregado } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
let activePopup: mapboxgl.Popup | null = null
let hoveredId: number | null = null

const bodegas = ref<Bodega[]>([])
const selectedBodega = ref<Bodega | null>(null)
const loading = ref(true)
const searchText = ref('')
const sidebarOpen = ref(false)

const catalogos = reactive<Catalogos>({ regiones: [], estados: [], municipios: [], ddrs: [] })
const kpi = reactive<KpiAgregado>({ total_bodegas: 0, total_capacidad: 0, total_estados: 0, total_municipios: 0 })
const filters = reactive<{ estado: string | null; ddr: string | null; municipio: string | null }>({
  estado: null, ddr: null, municipio: null,
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const ddrsFiltrados = computed(() => {
  if (!filters.estado) return catalogos.ddrs
  return catalogos.ddrs.filter((d) => d.estado === filters.estado)
})

const municipiosFiltrados = computed(() => {
  if (!filters.estado) return catalogos.municipios
  return catalogos.municipios.filter((m) => m.estado === filters.estado)
})

function formatNumber(n: number): string {
  if (n == null) return '0'
  return n.toLocaleString('es-MX')
}

function sanitize(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function handleLogout() { authStore.logout(); router.push('/login') }

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchBodegas(), 400)
}

function onEstadoChange() { filters.ddr = null; filters.municipio = null; fetchBodegas() }
function onDdrChange() { filters.municipio = null; fetchBodegas() }
function onFilterChange() { fetchBodegas() }

async function fetchCatalogos() {
  try {
    const data = await api.bodegas.catalogos()
    catalogos.regiones = data.regiones
    catalogos.estados = data.estados
    catalogos.municipios = data.municipios
    catalogos.ddrs = data.ddrs
  } catch (err) {
    console.error('Error cargando catalogos:', err)
  }
}

async function fetchBodegas() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.estado) params.estado = filters.estado
    if (filters.ddr) params.ddr = filters.ddr
    if (filters.municipio) params.municipio = filters.municipio
    if (searchText.value.trim()) params.q = searchText.value.trim()

    const res = await api.bodegas.listar(params)
    bodegas.value = res.bodegas
    Object.assign(kpi, res.kpi)
    await nextTick()
    updateMapSource()
    fitMapToBodegas()
  } catch (err) {
    console.error('Error cargando bodegas:', err)
  } finally {
    loading.value = false
  }
}

function updateMapSource() {
  if (!map) return
  const src = map.getSource('bodegas-src') as mapboxgl.GeoJSONSource | undefined
  if (!src) return
  src.setData({
    type: 'FeatureCollection',
    features: bodegas.value.map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.longitud, b.latitud] },
      properties: { id: b.id, nombre: b.nombre, clave: b.clave || '', estado: b.estado || '', municipio: b.municipio || '', ddr: b.ddr || '', capacidad_toneladas: b.capacidad_toneladas || 0 },
    })),
  } as any)
}

function showPopup(lngLat: [number, number], props: Record<string, any>) {
  if (!map) return
  if (activePopup) activePopup.remove()
  const html = '<div class="popup-header">'
    + '<div class="popup-title">' + sanitize(String(props.nombre)) + '</div>'
    + (props.clave ? '<div class="popup-clave">' + sanitize(String(props.clave)) + '</div>' : '')
    + '</div><div class="popup-body">'
    + '<div class="popup-row"><span>DDR</span><strong>' + sanitize(String(props.ddr || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Estado</span><strong>' + sanitize(String(props.estado || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Municipio</span><strong>' + sanitize(String(props.municipio || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Capacidad</span><strong>' + formatNumber(Number(props.capacidad_toneladas)) + ' ton</strong></div>'
    + '<button class="popup-btn" onclick="window.__verDetalle(' + Number(props.id) + ')">Ver detalle &#x2192;</button>'
    + '</div>'
  activePopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', offset: 14 })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map)
}

function selectBodega(bodega: Bodega) {
  selectedBodega.value = bodega
  sidebarOpen.value = false
  if (!map) return
  map.flyTo({ center: [bodega.longitud, bodega.latitud], zoom: 13, duration: 1200, essential: true })
  setTimeout(() => {
    showPopup([bodega.longitud, bodega.latitud], {
      id: bodega.id, nombre: bodega.nombre, clave: bodega.clave,
      estado: bodega.estado, municipio: bodega.municipio,
      ddr: bodega.ddr, capacidad_toneladas: bodega.capacidad_toneladas,
    })
  }, 350)
}

function fitMapToBodegas() {
  if (!map || bodegas.value.length === 0) return
  const bounds = new mapboxgl.LngLatBounds()
  bodegas.value.forEach((b) => bounds.extend([b.longitud, b.latitud]))
  map.fitBounds(bounds, {
    padding: { top: 60, bottom: 60, left: window.innerWidth <= 768 ? 40 : 420, right: 40 },
    duration: 1000,
  })
}

function initMap() {
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-104.0, 22.5],
    zoom: 6,
    attributionControl: false,
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
  map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), 'bottom-right')
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left')
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

  map.on('load', () => {
    map!.addSource('bodegas-src', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      generateId: true,
    })

    map!.addLayer({
      id: 'bodegas-glow',
      type: 'circle',
      source: 'bodegas-src',
      paint: {
        'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 18, 14],
        'circle-color': '#691C32',
        'circle-opacity': 0.12,
        'circle-blur': 1,
      },
    })

    map!.addLayer({
      id: 'bodegas-points',
      type: 'circle',
      source: 'bodegas-src',
      paint: {
        'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 9, 7],
        'circle-color': '#691C32',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.5,
        'circle-opacity': 0.92,
      },
    })

    map!.on('click', 'bodegas-points', (e) => {
      if (!e.features || e.features.length === 0) return
      const f = e.features[0]
      const coords = (f.geometry as any).coordinates.slice() as [number, number]
      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360
      }
      showPopup(coords, f.properties!)
      selectedBodega.value = bodegas.value.find((b) => b.id === f.properties!.id) || null
    })

    map!.on('mousemove', 'bodegas-points', (e) => {
      if (!e.features || e.features.length === 0) return
      if (hoveredId !== null) {
        map!.setFeatureState({ source: 'bodegas-src', id: hoveredId }, { hover: false })
      }
      hoveredId = e.features[0].id as number
      map!.setFeatureState({ source: 'bodegas-src', id: hoveredId }, { hover: true })
      map!.getCanvas().style.cursor = 'pointer'
    })

    map!.on('mouseleave', 'bodegas-points', () => {
      if (hoveredId !== null) {
        map!.setFeatureState({ source: 'bodegas-src', id: hoveredId }, { hover: false })
      }
      hoveredId = null
      map!.getCanvas().style.cursor = ''
    })

    fetchBodegas()
  })
}

;(window as any).__verDetalle = (id: number) => { router.push('/bodega/' + id) }

onMounted(() => {
  fetchCatalogos()
  initMap()
})

onUnmounted(() => {
  delete (window as any).__verDetalle
  if (activePopup) { activePopup.remove(); activePopup = null }
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