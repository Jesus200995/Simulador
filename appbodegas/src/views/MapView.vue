<template>
  <div class="map-page">
    <div class="visor-layout">
      <div class="sidebar-overlay" :class="{ active: sidebarOpen }" @click="sidebarOpen = false"></div>

      <aside class="visor-panel" :class="{ open: sidebarOpen }">
        <div class="panel-mobile-header">
          <span>Explorar Bodegas</span>
          <button class="panel-close-btn" @click="sidebarOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Zona fija: búsqueda, filtros, KPI -->
        <div class="panel-top">
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

          <div v-if="authStore.canCapture" class="panel-no-bodega">
            <router-link to="/nueva-bodega" class="btn-no-bodega">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              No encuentro mi bodega
            </router-link>
          </div>

          <div class="panel-kpi">
            <div class="kpi-card bodegas">
              <div class="kpi-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
              </div>
              <div class="kpi-data">
                <span class="kpi-value">{{ kpi.total_bodegas.toLocaleString() }}</span>
                <span class="kpi-label">Bodegas</span>
              </div>
            </div>
            <div class="kpi-card toneladas">
              <div class="kpi-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div class="kpi-data">
                <span class="kpi-value">{{ formatNumber(kpi.total_capacidad) }}</span>
                <span class="kpi-label">Almacenamiento</span>
              </div>
            </div>
            <div class="kpi-card estados">
              <div class="kpi-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              </div>
              <div class="kpi-data">
                <span class="kpi-value">{{ kpi.total_estados }}</span>
                <span class="kpi-label">Estados</span>
              </div>
            </div>
            <div class="kpi-card municipios">
              <div class="kpi-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="kpi-data">
                <span class="kpi-value">{{ kpi.total_municipios }}</span>
                <span class="kpi-label">Municipios</span>
              </div>
            </div>
            <div class="kpi-card inventarios" v-if="authStore.canCapture">
              <div class="kpi-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <div class="kpi-data">
                <span class="kpi-value">{{ kpi.total_inventarios }}</span>
                <span class="kpi-label">Inventarios</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta de bodegas con scroll interno -->
        <div class="panel-list-card">
          <div class="panel-list-header">
            <span>Bodegas ({{ bodegas.length }})</span>
            <button class="refresh-btn" :class="{ spinning: refreshing }" @click="handleRefresh" :disabled="refreshing" aria-label="Actualizar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>

          <div class="panel-list-scroll">
            <div v-if="loading" class="panel-loading">
              <div class="spinner spinner-dark spinner-lg"></div>
              <span>Cargando bodegas...</span>
            </div>

            <ul v-else class="bodega-list">
              <li v-for="bodega in bodegas" :key="bodega.id" class="bodega-item" :class="{ active: selectedBodega?.id === bodega.id }" @click="selectBodega(bodega)">
                <div class="bodega-icon" :class="{ 'bodega-icon-pendiente': bodega.estatus === 'pendiente' }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
                </div>
                <div class="bodega-info">
                  <div class="bodega-nombre">{{ bodega.nombre }}</div>
                  <div class="bodega-ubicacion">{{ bodega.municipio || '' }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado || '' }}</div>
                  <div class="bodega-meta">
                    <span class="bodega-toneladas"><strong>{{ formatNumber(bodega.capacidad_toneladas) }}</strong> ton</span>
                    <span v-if="bodega.estatus === 'pendiente'" class="bodega-badge pendiente">Pendiente</span>
                    <span v-else class="bodega-badge aprobada">Aprobada</span>
                  </div>
                  <div class="bodega-cta" v-if="authStore.canCapture">Captura inventario en esta bodega</div>
                </div>
                <svg class="bodega-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </li>
              <li v-if="bodegas.length === 0" class="bodega-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.25;margin-bottom:0.5rem"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                No se encontraron bodegas
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <div class="visor-map" ref="mapContainer"></div>

      <!-- Mobile toggle for sidebar -->
      <button class="sidebar-toggle" @click="sidebarOpen = true" aria-label="Abrir explorador">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Explorar</span>
      </button>

      <!-- Panel inferior: Precios de maiz -->
      <div class="precios-panel" :class="{ open: preciosOpen }">
        <button class="precios-tab" @click="preciosOpen = !preciosOpen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          <span>Precios de maiz</span>
          <span v-if="preciosData.promedio" class="precios-tab-value">Promedio: ${{ formatNumber(preciosData.promedio) }}/t</span>
          <span v-if="preciosData.tendencia_general" class="precios-tab-trend" :class="preciosData.tendencia_general">{{ preciosData.tendencia_general }}</span>
          <svg class="precios-chevron" :class="{ open: preciosOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <div v-if="preciosOpen" class="precios-body">
          <div v-for="p in preciosData.precios" :key="p.id" class="precio-row">
            <span class="tipo">{{ p.tipo }}</span>
            <span class="monto">${{ formatNumber(p.precio) }}/t</span>
            <span class="tend" :class="p.tendencia">
              <svg v-if="p.tendencia === 'alza'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              <svg v-else-if="p.tendencia === 'baja'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
              <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="12" x2="23" y2="12"/></svg>
              {{ p.tendencia }}
            </span>
          </div>
          <div v-if="preciosData.precios.length === 0" class="inv-empty">Sin datos de precios disponibles</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega, Catalogos, KpiAgregado, PreciosResponse } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
let activePopup: mapboxgl.Popup | null = null
let hoveredId: number | null = null

const bodegas = ref<Bodega[]>([])
const selectedBodega = ref<Bodega | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const searchText = ref('')
const sidebarOpen = ref(false)
const profileOpen = ref(false)
const profileRef = ref<HTMLDivElement>()
const preciosOpen = ref(false)
const preciosData = reactive<PreciosResponse>({ precios: [], promedio: 0, tendencia_general: 'estable' })
const notifCount = ref(0)
let notifInterval: ReturnType<typeof setInterval> | null = null

const userInitials = computed(() => {
  const name = authStore.usuario?.nombre_completo || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

function onClickOutsideProfile(e: MouseEvent) {
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
    profileOpen.value = false
  }
}

const catalogos = reactive<Catalogos>({ regiones: [], estados: [], municipios: [], ddrs: [] })
const kpi = reactive<KpiAgregado>({ total_bodegas: 0, total_capacidad: 0, total_estados: 0, total_municipios: 0, total_inventarios: 0 })
const filters = reactive<{ estado: string | null; ddr: string | null; municipio: string | null }>({
  estado: null, ddr: null, municipio: null,
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const ddrsFiltrados = computed(() => {
  const ddrs = catalogos.ddrs ?? []
  if (!filters.estado) return ddrs
  return ddrs.filter((d) => d.estado === filters.estado)
})

const municipiosFiltrados = computed(() => {
  const municipios = catalogos.municipios ?? []
  if (!filters.estado) return municipios
  return municipios.filter((m) => m.estado === filters.estado)
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

async function handleRefresh() {
  refreshing.value = true
  try {
    await Promise.all([fetchCatalogos(), fetchBodegas()])
  } finally {
    setTimeout(() => { refreshing.value = false }, 500)
  }
}

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

async function fetchNotifCount() {
  try {
    const res = await api.alertas.notificaciones()
    notifCount.value = res.total_no_leidas
  } catch { /* silent */ }
}

async function fetchPrecios() {
  try {
    const data = await api.precios.obtener()
    preciosData.precios = data.precios
    preciosData.promedio = data.promedio
    preciosData.tendencia_general = data.tendencia_general
  } catch (err) {
    console.error('Error cargando precios:', err)
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
      properties: { id: b.id, nombre: b.nombre, clave: b.clave || '', estado: b.estado || '', municipio: b.municipio || '', ddr: b.ddr || '', capacidad_toneladas: b.capacidad_toneladas || 0, estatus: b.estatus || 'aprobada' },
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
    + '<div class="popup-estatus ' + (props.estatus === 'pendiente' ? 'pendiente' : 'aprobada') + '">' + (props.estatus === 'pendiente' ? 'Pendiente' : 'Aprobada') + '</div>'
    + '<div class="popup-row"><span>DDR</span><strong>' + sanitize(String(props.ddr || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Estado</span><strong>' + sanitize(String(props.estado || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Municipio</span><strong>' + sanitize(String(props.municipio || '-')) + '</strong></div>'
    + '<div class="popup-row"><span>Capacidad</span><strong>' + formatNumber(Number(props.capacidad_toneladas)) + ' ton</strong></div>'
    + '<button class="popup-btn" onclick="window.__verDetalle(' + Number(props.id) + ')">' + (authStore.canCapture ? 'Ver y registrar inventario &#x2192;' : 'Ver m&aacute;s detalles &#x2192;') + '</button>'
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
      estatus: bodega.estatus,
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
    style: 'mapbox://styles/mapbox/streets-v12',
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
        'circle-color': ['case', ['==', ['get', 'estatus'], 'pendiente'], '#FFB020', '#D35400'],
        'circle-opacity': 0.15,
        'circle-blur': 1,
      },
    })

    map!.addLayer({
      id: 'bodegas-points',
      type: 'circle',
      source: 'bodegas-src',
      paint: {
        'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 9, 7],
        'circle-color': ['case', ['==', ['get', 'estatus'], 'pendiente'], '#FFB020', '#D35400'],
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
  fetchPrecios()
  fetchNotifCount()
  notifInterval = setInterval(fetchNotifCount, 30000)
  initMap()
  document.addEventListener('click', onClickOutsideProfile)
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (notifInterval) clearInterval(notifInterval)
  document.removeEventListener('click', onClickOutsideProfile)
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

/* Role badge in profile dropdown */
.profile-role-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
}

.profile-role-badge.tecnico {
  background: rgba(88, 86, 214, 0.12);
  color: #5856D6;
}

.profile-role-badge.supervisor {
  background: rgba(0, 122, 255, 0.12);
  color: #007AFF;
}

.profile-role-badge.responsable {
  background: rgba(211, 84, 0, 0.12);
  color: #D35400;
}

.profile-role-badge.admin {
  background: rgba(105, 28, 50, 0.12);
  color: #691C32;
}

/* Notification bell in header */
.notif-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3125rem 0.625rem !important;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #e53e3e;
  color: #fff;
  font-size: 0.55rem;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
}

.mobile-notif-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e53e3e;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  padding: 0 4px;
  margin-left: 4px;
  line-height: 1;
}
</style>