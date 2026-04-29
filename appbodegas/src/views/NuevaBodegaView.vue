<template>
  <div class="page-container">
    <div class="page-header">
      <button class="page-back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
    </div>

    <div class="glass-card nueva-bodega-card">
      <div class="nueva-bodega-header">
        <h1>Registrar nueva bodega</h1>
        <span class="bodega-badge pendiente">Estatus: Pendiente</span>
      </div>

      <div v-if="success" class="alert alert-success">{{ success }}</div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Datos generales -->
        <div class="form-section">
          <h3 class="section-title">Datos generales</h3>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="clave">Clave <span class="req">*</span></label>
              <input id="clave" v-model="form.clave" type="text" class="form-input uppercase" placeholder="Ej: B1105101012" @input="form.clave = form.clave.toUpperCase()" />
            </div>
            <div class="form-group">
              <label class="form-label" for="nombre">Nombre <span class="req">*</span></label>
              <input id="nombre" v-model="form.nombre" type="text" class="form-input" placeholder="Nombre visible en mapa" />
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="form-section">
          <h3 class="section-title">Ubicación</h3>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="estado">Estado <span class="req">*</span></label>
              <select id="estado" v-model="form.estado" class="form-input" @change="form.municipio = ''">
                <option value="">Selecciona estado</option>
                <option v-for="e in catalogos.estados" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="municipio">Municipio <span class="req">*</span></label>
              <select id="municipio" v-model="form.municipio" class="form-input">
                <option value="">Selecciona municipio</option>
                <option v-for="m in municipiosFiltrados" :key="m.municipio" :value="m.municipio">{{ m.municipio }}</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="localidad">Localidad</label>
              <input id="localidad" v-model="form.localidad" type="text" class="form-input" placeholder="Nombre de la localidad" />
            </div>
            <div class="form-group">
              <label class="form-label" for="direccion">Dirección</label>
              <input id="direccion" v-model="form.direccion" type="text" class="form-input" placeholder="Calle, número" />
            </div>
          </div>
        </div>

        <!-- Capacidad -->
        <div class="form-section">
          <h3 class="section-title">Capacidad</h3>
          <div class="form-group">
            <label class="form-label" for="capacidad">Capacidad de almacenamiento (toneladas)</label>
            <input id="capacidad" v-model.number="form.capacidad_ton" type="number" min="0" step="any" class="form-input" placeholder="Ej: 5000" />
          </div>
        </div>

        <!-- Coordenadas con mapa -->
        <div class="form-section">
          <h3 class="section-title">Coordenadas <span class="req">*</span></h3>
          <p class="section-hint">Haz clic en el mapa para marcar la ubicación de la bodega, o usa las opciones manuales.</p>

          <div class="coords-options">
            <label class="coords-option" :class="{ active: coordMode === 'map' }">
              <input type="radio" v-model="coordMode" value="map" /> Seleccionar en mapa
            </label>
            <label class="coords-option" :class="{ active: coordMode === 'manual' }">
              <input type="radio" v-model="coordMode" value="manual" /> Ingresar manualmente
            </label>
            <label class="coords-option" :class="{ active: coordMode === 'gps' }">
              <input type="radio" v-model="coordMode" value="gps" /> Usar mi ubicación actual
            </label>
          </div>

          <!-- Mapa interactivo -->
          <div v-show="coordMode === 'map'" class="map-container">
            <div ref="mapContainer" class="map-box"></div>
            <div v-if="form.latitud != null && form.longitud != null" class="map-coords-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ form.latitud.toFixed(6) }}, {{ form.longitud.toFixed(6) }}
            </div>
            <p v-else class="map-hint">Haz clic en el mapa para colocar el marcador</p>
          </div>

          <!-- Manual -->
          <div v-if="coordMode === 'manual'" class="form-grid-2" style="margin-top:.75rem">
            <div class="form-group">
              <label class="form-label" for="lat">Latitud</label>
              <input id="lat" v-model.number="form.latitud" type="number" step="any" class="form-input" placeholder="Ej: 20.34305" />
            </div>
            <div class="form-group">
              <label class="form-label" for="lng">Longitud</label>
              <input id="lng" v-model.number="form.longitud" type="number" step="any" class="form-input" placeholder="Ej: -100.579" />
            </div>
          </div>

          <!-- GPS -->
          <div v-if="coordMode === 'gps'" class="gps-capture">
            <button type="button" class="btn btn-secondary" @click="captureGPS" :disabled="gpsLoading">
              <span v-if="gpsLoading" class="spinner spinner-dark"></span>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ gpsLoading ? 'Obteniendo...' : 'Capturar ubicación' }}
            </button>
            <p v-if="form.latitud != null && form.longitud != null" class="gps-result">
              Lat: {{ form.latitud.toFixed(6) }}, Lng: {{ form.longitud.toFixed(6) }}
            </p>
          </div>

          <div v-if="coordWarning" class="alert alert-error" style="margin-top:0.5rem">{{ coordWarning }}</div>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="submitting">
          <span v-if="submitting" class="spinner"></span>
          <span v-else>Registrar bodega</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { api } from '@/services/api'
import type { Catalogos } from '@/types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const router = useRouter()

const catalogos = reactive<Catalogos>({ regiones: [], estados: [], municipios: [], ddrs: [] })
const coordMode = ref<'map' | 'manual' | 'gps'>('map')
const gpsLoading = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const coordWarning = ref('')

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null

const form = reactive({
  clave: '',
  nombre: '',
  estado: '',
  municipio: '',
  localidad: '',
  direccion: '',
  capacidad_ton: null as number | null,
  latitud: null as number | null,
  longitud: null as number | null,
})

const municipiosFiltrados = computed(() => {
  if (!form.estado) return catalogos.municipios
  return catalogos.municipios.filter((m: any) => m.estado === form.estado)
})

async function fetchCatalogos() {
  try {
    const data = await api.bodegas.catalogos()
    catalogos.estados = data.estados
    catalogos.municipios = data.municipios
    catalogos.ddrs = data.ddrs
    catalogos.regiones = data.regiones
  } catch (err) {
    console.error('Error cargando catalogos:', err)
  }
}

function initMap() {
  if (!mapContainer.value || map) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-102.5, 23.5],
    zoom: 5,
    attributionControl: false,
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
  }), 'top-right')

  map.on('click', (e) => {
    const { lng, lat } = e.lngLat
    form.latitud = parseFloat(lat.toFixed(6))
    form.longitud = parseFloat(lng.toFixed(6))
    setMarker(lng, lat)
    validateCoords()
  })

  // If coords already exist, place marker
  if (form.latitud != null && form.longitud != null) {
    map.on('load', () => {
      setMarker(form.longitud!, form.latitud!)
    })
  }
}

function setMarker(lng: number, lat: number) {
  if (!map) return
  if (marker) {
    marker.setLngLat([lng, lat])
  } else {
    marker = new mapboxgl.Marker({ color: '#0F5132', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map)
    marker.on('dragend', () => {
      const pos = marker!.getLngLat()
      form.latitud = parseFloat(pos.lat.toFixed(6))
      form.longitud = parseFloat(pos.lng.toFixed(6))
      validateCoords()
    })
  }
}

function destroyMap() {
  if (marker) { marker.remove(); marker = null }
  if (map) { map.remove(); map = null }
}

watch(coordMode, (mode) => {
  if (mode === 'map') {
    nextTick(() => {
      if (!map) initMap()
      else map.resize()
    })
  }
})

function captureGPS() {
  if (!navigator.geolocation) {
    error.value = 'Tu navegador no soporta geolocalización'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitud = parseFloat(pos.coords.latitude.toFixed(6))
      form.longitud = parseFloat(pos.coords.longitude.toFixed(6))
      gpsLoading.value = false
      validateCoords()
      // Update marker on map if exists
      if (map && form.longitud != null && form.latitud != null) {
        setMarker(form.longitud, form.latitud)
        map.flyTo({ center: [form.longitud, form.latitud], zoom: 14 })
      }
    },
    () => {
      error.value = 'No se pudo obtener la ubicación. Verifica los permisos.'
      gpsLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

function validateCoords() {
  coordWarning.value = ''
  if (form.latitud == null || form.longitud == null) return
  if (form.latitud < -90 || form.latitud > 90) {
    coordWarning.value = 'Latitud debe estar entre -90 y 90'
    return
  }
  if (form.longitud < -180 || form.longitud > 180) {
    coordWarning.value = 'Longitud debe estar entre -180 y 180'
    return
  }
  if (form.latitud < 14 || form.latitud > 33 || form.longitud < -118 || form.longitud > -86) {
    coordWarning.value = 'Las coordenadas parecen estar fuera del rango de México'
  }
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  coordWarning.value = ''

  if (!form.nombre.trim()) { error.value = 'El nombre es obligatorio'; return }
  if (!form.estado) { error.value = 'Selecciona un estado'; return }
  if (!form.municipio) { error.value = 'Selecciona un municipio'; return }
  if (form.latitud == null || form.longitud == null) { error.value = 'Las coordenadas son obligatorias. Marca un punto en el mapa.'; return }

  validateCoords()
  if (coordWarning.value && (form.latitud < -90 || form.latitud > 90 || form.longitud < -180 || form.longitud > 180)) return

  submitting.value = true
  try {
    await api.bodegas.crear({
      clave: form.clave.trim() || undefined,
      nombre: form.nombre.trim(),
      estado: form.estado,
      municipio: form.municipio,
      localidad: form.localidad.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      capacidad_ton: form.capacidad_ton || undefined,
      latitud: form.latitud,
      longitud: form.longitud,
    } as any)
    success.value = 'Bodega registrada exitosamente. Pendiente de aprobación.'
    setTimeout(() => router.push('/mis-bodegas'), 1500)
  } catch (err: any) {
    error.value = err.message || 'Error al registrar bodega'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCatalogos()
  nextTick(() => {
    if (coordMode.value === 'map') initMap()
  })
})

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
.page-header { margin-bottom: 1rem; }

.page-back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: none; border: none; color: var(--color-primary);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem; border-radius: var(--radius-sm);
  transition: background 0.2s; font-family: var(--font-family);
}
.page-back-btn:hover { background: var(--color-fill); }

.nueva-bodega-card {
  padding: 2rem; max-width: 760px; margin: 0 auto;
}

.nueva-bodega-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;
}
.nueva-bodega-header h1 {
  font-size: 1.35rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em;
}

.form-section {
  margin-bottom: 1.5rem; padding-bottom: 1.5rem;
  border-bottom: 0.5px solid var(--color-separator);
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 1rem; padding-bottom: 0; }

.section-title {
  font-size: 0.85rem; font-weight: 650; color: var(--color-primary);
  margin: 0 0 0.75rem; letter-spacing: 0.02em;
}
.section-hint {
  font-size: 0.8rem; color: var(--color-text-secondary); margin: -0.5rem 0 0.75rem;
}

.form-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem;
}

.req { color: var(--color-error, #e53e3e); }

.coords-options {
  display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;
}
.coords-option {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.8rem; font-weight: 500; color: var(--color-text-secondary);
  cursor: pointer; padding: 0.45rem 0.75rem; border-radius: 99px;
  border: 1px solid var(--color-border); transition: all 0.2s;
}
.coords-option.active {
  background: var(--color-primary-subtle, rgba(15,81,50,.08));
  color: var(--color-primary); border-color: var(--color-primary);
}
.coords-option input[type="radio"] { display: none; }

/* Map */
.map-container {
  position: relative; border-radius: var(--radius-md); overflow: hidden;
  border: 1px solid var(--color-border); margin-bottom: 0.5rem;
}
.map-box {
  width: 100%; height: 320px;
}
.map-coords-badge {
  position: absolute; bottom: 10px; left: 10px;
  background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
  padding: 0.35rem 0.7rem; border-radius: 99px;
  font-size: 0.75rem; font-weight: 600; color: var(--color-primary);
  display: flex; align-items: center; gap: 0.3rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}
.map-hint {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(255,255,255,.9); backdrop-filter: blur(6px);
  padding: 0.5rem 1rem; border-radius: 99px;
  font-size: 0.8rem; font-weight: 500; color: var(--color-text-secondary);
  pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.gps-capture {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem;
}
.gps-result {
  font-size: 0.82rem; color: var(--color-text-secondary); font-weight: 500;
}

@media (max-width: 1024px) {
  .form-grid-2 { grid-template-columns: 1fr; }
  .nueva-bodega-card { padding: 1.25rem; }
  .map-box { height: 260px; }
}
@media (max-width: 480px) {
  .map-box { height: 220px; }
  .coords-options { flex-direction: column; }
}
</style>
