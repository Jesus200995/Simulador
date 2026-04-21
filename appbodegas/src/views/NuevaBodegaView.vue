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
          <span class="bodega-badge pendiente">Estatus inicial: Pendiente</span>
        </div>

        <div v-if="success" class="alert alert-success">{{ success }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="clave">Clave centro de acopio *</label>
              <input id="clave" v-model="form.clave" type="text" class="form-input uppercase" placeholder="Ej: B1105101012" @input="form.clave = form.clave.toUpperCase()" />
            </div>
            <div class="form-group">
              <label class="form-label" for="nombre">Nombre centro de acopio *</label>
              <input id="nombre" v-model="form.nombre" type="text" class="form-input" placeholder="Nombre visible en mapa" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="estado">Nombre estado *</label>
              <select id="estado" v-model="form.estado" class="form-input" @change="form.municipio = ''">
                <option value="">Selecciona estado</option>
                <option v-for="e in catalogos.estados" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="ddr">Nombre DDR</label>
              <input id="ddr" v-model="form.ddr" type="text" class="form-input" placeholder="Texto libre" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="cader">Nombre CADER</label>
              <input id="cader" v-model="form.cader" type="text" class="form-input" placeholder="Texto libre" />
            </div>
            <div class="form-group">
              <label class="form-label" for="municipio">Nombre municipio *</label>
              <select id="municipio" v-model="form.municipio" class="form-input">
                <option value="">Selecciona municipio</option>
                <option v-for="m in municipiosFiltrados" :key="m.municipio" :value="m.municipio">{{ m.municipio }}</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="ejido">Nombre ejido</label>
              <input id="ejido" v-model="form.ejido" type="text" class="form-input" placeholder="Texto libre" />
            </div>
            <div class="form-group">
              <label class="form-label" for="calle">Calle</label>
              <input id="calle" v-model="form.direccion" type="text" class="form-input" placeholder="Direccion base" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="localidad">Localidad</label>
              <input id="localidad" v-model="form.localidad" type="text" class="form-input" placeholder="Texto libre" />
            </div>
            <div class="form-group">
              <label class="form-label" for="cp">Codigo postal</label>
              <input id="cp" v-model="form.codigo_postal" type="text" maxlength="5" class="form-input" placeholder="5 digitos" @input="form.codigo_postal = form.codigo_postal.replace(/\D/g, '').slice(0, 5)" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="capacidad">Total almacenamiento (toneladas)</label>
            <input id="capacidad" v-model.number="form.capacidad_toneladas" type="number" min="0" step="any" class="form-input" placeholder="Toneladas de capacidad" />
          </div>

          <!-- Coordenadas -->
          <div class="coords-section">
            <h3>Coordenadas</h3>
            <div class="coords-options">
              <label class="coords-option" :class="{ active: coordMode === 'manual' }">
                <input type="radio" v-model="coordMode" value="manual" /> Opcion A: Latitud y longitud manual
              </label>
              <label class="coords-option" :class="{ active: coordMode === 'gps' }">
                <input type="radio" v-model="coordMode" value="gps" /> Opcion B: Capturar punto con el dispositivo
              </label>
            </div>

            <div v-if="coordMode === 'manual'" class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="lat">Latitud *</label>
                <input id="lat" v-model.number="form.latitud" type="number" step="any" class="form-input" placeholder="Ej: 20.34305" />
              </div>
              <div class="form-group">
                <label class="form-label" for="lng">Longitud *</label>
                <input id="lng" v-model.number="form.longitud" type="number" step="any" class="form-input" placeholder="Ej: -100.579" />
              </div>
            </div>

            <div v-if="coordMode === 'gps'" class="gps-capture">
              <button type="button" class="btn btn-secondary" @click="captureGPS" :disabled="gpsLoading">
                <span v-if="gpsLoading" class="spinner spinner-dark"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ gpsLoading ? 'Obteniendo ubicacion...' : 'Capturar mi ubicacion' }}
              </button>
              <p v-if="form.latitud && form.longitud && coordMode === 'gps'" class="gps-result">
                Lat: {{ form.latitud.toFixed(6) }}, Long: {{ form.longitud.toFixed(6) }}
              </p>
            </div>

            <div v-if="coordWarning" class="alert alert-error" style="margin-top:0.5rem">{{ coordWarning }}</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="submitting" style="margin-top:1.5rem">
            <span v-if="submitting" class="spinner"></span>
            <span v-else>Enviar a aprobacion</span>
          </button>
        </form>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import type { Catalogos } from '@/types'

const router = useRouter()

const catalogos = reactive<Catalogos>({ regiones: [], estados: [], municipios: [], ddrs: [] })
const coordMode = ref<'manual' | 'gps'>('manual')
const gpsLoading = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const coordWarning = ref('')

const form = reactive({
  clave: '',
  nombre: '',
  estado: '',
  municipio: '',
  ddr: '',
  cader: '',
  ejido: '',
  direccion: '',
  localidad: '',
  codigo_postal: '',
  capacidad_toneladas: null as number | null,
  latitud: null as number | null,
  longitud: null as number | null,
})

const municipiosFiltrados = computed(() => {
  if (!form.estado) return catalogos.municipios
  return catalogos.municipios.filter((m) => m.estado === form.estado)
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

function captureGPS() {
  if (!navigator.geolocation) {
    error.value = 'Tu navegador no soporta geolocalizacion'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitud = pos.coords.latitude
      form.longitud = pos.coords.longitude
      gpsLoading.value = false
      validateCoords()
    },
    (err) => {
      error.value = 'No se pudo obtener la ubicacion. Verifica los permisos.'
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
  // Rango aproximado de México
  if (form.latitud < 14 || form.latitud > 33 || form.longitud < -118 || form.longitud > -86) {
    coordWarning.value = 'Las coordenadas parecen estar fuera del rango de Mexico'
  }
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  coordWarning.value = ''

  if (!form.clave.trim()) { error.value = 'La clave es obligatoria'; return }
  if (!form.nombre.trim()) { error.value = 'El nombre es obligatorio'; return }
  if (!form.estado) { error.value = 'Selecciona un estado'; return }
  if (!form.municipio) { error.value = 'Selecciona un municipio'; return }
  if (form.latitud == null || form.longitud == null) { error.value = 'Las coordenadas son obligatorias'; return }

  validateCoords()
  if (form.latitud < -90 || form.latitud > 90 || form.longitud < -180 || form.longitud > 180) return

  submitting.value = true
  try {
    await api.bodegas.crear({
      clave: form.clave.trim(),
      nombre: form.nombre.trim(),
      estado: form.estado,
      municipio: form.municipio,
      ddr: form.ddr.trim() || undefined,
      cader: form.cader.trim() || undefined,
      ejido: form.ejido.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      localidad: form.localidad.trim() || undefined,
      codigo_postal: form.codigo_postal.trim() || undefined,
      capacidad_toneladas: form.capacidad_toneladas || undefined,
      latitud: form.latitud,
      longitud: form.longitud,
    })
    success.value = 'Bodega registrada exitosamente. Pendiente de aprobacion.'
    setTimeout(() => router.push('/mis-bodegas'), 1500)
  } catch (err: any) {
    error.value = err.message || 'Error al registrar bodega'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCatalogos()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 1rem;
}

.page-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  font-family: var(--font-family);
}

.page-back-btn:hover {
  background: var(--color-fill);
}

.nueva-bodega-card {
  padding: 2rem;
  max-width: 760px;
  margin: 0 auto;
}

.nueva-bodega-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.nueva-bodega-header h1 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1rem;
}

.coords-section {
  margin-top: 1.25rem;
  padding: 1rem;
  background: var(--color-fill-secondary);
  border-radius: var(--radius-md);
  border: 0.5px solid var(--color-separator);
}

.coords-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.coords-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.coords-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.coords-option.active {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.coords-option input[type="radio"] {
  accent-color: var(--color-primary);
}

.gps-capture {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.gps-result {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}


@media (max-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
  .nueva-bodega-card {
    padding: 1.25rem;
  }
}
</style>
