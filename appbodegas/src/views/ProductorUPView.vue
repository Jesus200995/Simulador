<template>
  <div class="productor-page">
    <!-- Stepper -->
    <div class="wizard-stepper">
      <div v-for="(s, i) in steps" :key="i"
           class="step-item" :class="{ active: step === i, completed: step > i }"
           @click="i < step ? step = i : null">
        <div class="step-circle">
          <svg v-if="step > i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="step-label">{{ s }}</span>
      </div>
    </div>

    <main class="wizard-main">
      <!-- ======== PASO 1: Registro Productor ======== -->
      <section v-if="step === 0" class="wizard-step">
        <div class="wizard-card">
          <h2 class="wizard-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Datos del productor
          </h2>

          <div class="form-group">
            <label>CURP <span class="required">*</span></label>
            <input v-model="form.curp" type="text" maxlength="18" placeholder="18 caracteres" class="form-input"
                   :class="{ error: errors.curp }" @input="form.curp = form.curp.toUpperCase()" />
            <span v-if="errors.curp" class="form-error">{{ errors.curp }}</span>
          </div>

          <div class="form-group">
            <label>Teléfono <span class="optional">(opcional)</span></label>
            <input v-model="form.phone" type="tel" maxlength="10" placeholder="10 dígitos" class="form-input" />
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.privacy_consent" />
              <span>Acepto el aviso de privacidad y uso de datos</span>
            </label>
            <span v-if="errors.privacy" class="form-error">{{ errors.privacy }}</span>
          </div>

          <button class="btn btn-primary btn-block" @click="submitStep0" :disabled="saving">
            {{ saving ? 'Registrando...' : 'Continuar' }}
          </button>
          <p v-if="stepError" class="form-error text-center mt-1">{{ stepError }}</p>
        </div>
      </section>

      <!-- ======== PASO 2: Dibujar UP en mapa ======== -->
      <section v-if="step === 1" class="wizard-step step-map">
        <div class="map-toolbar">
          <div class="map-toolbar-info">
            <h3>Dibuja tu Unidad de Producción</h3>
            <p>Usa las herramientas para dibujar el polígono de tu parcela</p>
          </div>
          <div class="map-toolbar-actions">
            <button class="btn btn-sm" @click="deleteDrawing" :disabled="!hasPolygon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Borrar
            </button>
          </div>
        </div>
        <div class="map-container" ref="mapContainer"></div>

        <div class="map-summary" v-if="hasPolygon">
          <div class="summary-item">
            <span class="summary-label">Área calculada:</span>
            <span class="summary-value">{{ calculatedArea }} ha</span>
          </div>
        </div>

        <div class="wizard-actions">
          <button class="btn btn-secondary" @click="step = 0">Atrás</button>
          <button class="btn btn-primary" @click="submitStep1" :disabled="!hasPolygon">
            Continuar
          </button>
        </div>
      </section>

      <!-- ======== PASO 3: Datos de la UP ======== -->
      <section v-if="step === 2" class="wizard-step">
        <div class="wizard-card">
          <h2 class="wizard-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
            Datos de la UP
          </h2>

          <!-- Ubicación -->
          <div class="form-section">
            <h4 class="form-section-title">Ubicación (prellenada)</h4>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Estado <span class="required">*</span></label>
                <select v-model="form.state_name" class="form-input" @change="onStateChange">
                  <option value="">Seleccionar...</option>
                  <option v-for="s in catalogos?.states" :key="s.state_id" :value="s.name">{{ s.name }}</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Municipio <span class="required">*</span></label>
                <select v-model="form.municipality_name" class="form-input">
                  <option value="">Seleccionar...</option>
                  <option v-for="m in municipalities" :key="m.municipality_id" :value="m.name">{{ m.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Identificación -->
          <div class="form-section">
            <h4 class="form-section-title">Identificación</h4>
            <div class="form-group">
              <label>Nombre de la UP <span class="required">*</span></label>
              <input v-model="form.up_name" type="text" maxlength="80" placeholder="Ej: Parcela La Loma" class="form-input"
                     :class="{ error: errors.up_name }" />
              <span v-if="errors.up_name" class="form-error">{{ errors.up_name }}</span>
            </div>
            <div class="form-group">
              <label>Tipo de UP <span class="required">*</span></label>
              <select v-model="form.up_type" class="form-input">
                <option value="">Seleccionar...</option>
                <option v-for="c in getCatalog('up_type')" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <!-- Sistema productivo -->
          <div class="form-section">
            <h4 class="form-section-title">Sistema productivo</h4>
            <div class="form-group">
              <label>Arreglo/Sistema <span class="required">*</span></label>
              <select v-model="form.production_system" class="form-input">
                <option value="">Seleccionar...</option>
                <option v-for="c in getCatalog('production_system')" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Régimen hídrico <span class="required">*</span></label>
              <select v-model="form.water_regime" class="form-input">
                <option value="">Seleccionar...</option>
                <option v-for="c in getCatalog('water_regime')" :key="c.code" :value="c.code">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <div class="wizard-actions">
            <button class="btn btn-secondary" @click="step = 1">Atrás</button>
            <button class="btn btn-primary" @click="submitStep2" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar UP' }}
            </button>
          </div>
          <p v-if="stepError" class="form-error text-center mt-1">{{ stepError }}</p>
        </div>
      </section>

      <!-- ======== PASO 4: Ciclo productivo ======== -->
      <section v-if="step === 3" class="wizard-step">
        <div class="wizard-card">
          <h2 class="wizard-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            Ciclo productivo
          </h2>

          <div class="up-summary-badge" v-if="savedUp">
            <strong>{{ savedUp.up_name }}</strong> · {{ savedUp.area_ha_calc }} ha
            <span v-if="savedUp.state_name"> · {{ savedUp.municipality_name }}, {{ savedUp.state_name }}</span>
          </div>

          <!-- Ciclo -->
          <div class="form-section">
            <h4 class="form-section-title">Ciclo</h4>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Año <span class="required">*</span></label>
                <input v-model.number="cycleForm.cycle_year" type="number" min="2020" max="2030" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>Tipo de ciclo <span class="required">*</span></label>
                <select v-model="cycleForm.cycle_type" class="form-input">
                  <option value="">Seleccionar...</option>
                  <option v-for="c in getCatalog('cycle_type')" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Cultivos -->
          <div class="form-section" v-for="(crop, ci) in cropForms" :key="ci">
            <div class="form-section-header">
              <h4 class="form-section-title">Cultivo {{ ci + 1 }}</h4>
              <button v-if="ci > 0" class="btn-icon-sm" @click="removeCrop(ci)" title="Eliminar cultivo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Cultivo <span class="required">*</span></label>
                <select v-model="crop.crop" class="form-input" @change="crop.variety_id = ''">
                  <option value="">Seleccionar...</option>
                  <option v-for="c in getCatalog('crop')" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Variedad <span class="required">*</span></label>
                <select v-model="crop.variety_id" class="form-input">
                  <option value="">Seleccionar...</option>
                  <option v-for="v in getVarieties(crop.crop)" :key="v.code" :value="v.code">{{ v.label }}</option>
                </select>
              </div>
            </div>

            <div class="form-group" v-if="crop.variety_id === 'CRIOLLO_LOCAL' || crop.variety_id === 'OTRA'">
              <label>Especificar variedad <span class="required">*</span></label>
              <input v-model="crop.variety_other" type="text" class="form-input" placeholder="Escriba el nombre de la variedad" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Sup. sembrada (ha) <span class="required">*</span></label>
                <input v-model.number="crop.area_sown_ha" type="number" step="0.01" min="0" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Fecha de siembra <span class="required">*</span></label>
                <input v-model="crop.planting_date" type="date" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>Rendimiento esperado (t/ha) <span class="required">*</span></label>
                <input v-model.number="crop.yield_expected" type="number" step="0.1" min="0" class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Fecha estimada de cosecha</label>
                <input v-model="crop.estimated_harvest_date" type="date" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>Destino</label>
                <select v-model="crop.destination" class="form-input">
                  <option value="">Seleccionar...</option>
                  <option v-for="c in getCatalog('destination')" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <button class="btn btn-secondary btn-block btn-add-crop" @click="addCrop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar otro cultivo
          </button>

          <div class="wizard-actions">
            <button class="btn btn-secondary" @click="step = 2">Atrás</button>
            <button class="btn btn-primary" @click="submitStep3" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar ciclo' }}
            </button>
          </div>
          <p v-if="stepError" class="form-error text-center mt-1">{{ stepError }}</p>
        </div>
      </section>

      <!-- ======== PASO Final: Resumen / Éxito ======== -->
      <section v-if="step === 4" class="wizard-step">
        <div class="wizard-card success-card">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>¡Registro completado!</h2>
          <p>La Unidad de Producción y el ciclo productivo se han guardado exitosamente.</p>

          <div class="success-summary" v-if="savedUp">
            <div class="summary-row"><span>UP:</span><strong>{{ savedUp.up_name }}</strong></div>
            <div class="summary-row"><span>Área:</span><strong>{{ savedUp.area_ha_calc }} ha</strong></div>
            <div class="summary-row"><span>Ubicación:</span><strong>{{ savedUp.municipality_name }}, {{ savedUp.state_name }}</strong></div>
          </div>

          <div class="wizard-actions">
            <button class="btn btn-primary" @click="resetWizard">Registrar otra UP</button>
            <router-link to="/" class="btn btn-secondary">Volver al mapa</router-link>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { api } from '@/services/api'
import type { ProductorCatalogos, UP, GeoMunicipality, CatalogItem, CropVariety } from '@/types'
import * as turf from '@turf/turf'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const steps = ['Productor', 'Dibujo UP', 'Datos UP', 'Ciclo']
const step = ref(0)
const saving = ref(false)
const stepError = ref('')
const catalogos = ref<ProductorCatalogos | null>(null)
const municipalities = ref<GeoMunicipality[]>([])
const savedUp = ref<UP | null>(null)
const hasPolygon = ref(false)
const calculatedArea = ref('0')
const drawnGeoJSON = ref<any>(null)

const mapContainer = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
let draw: MapboxDraw | null = null

const errors = reactive<Record<string, string>>({})

const form = reactive({
  curp: '',
  phone: '',
  privacy_consent: false,
  up_name: '',
  up_type: '',
  production_system: '',
  water_regime: '',
  state_name: '',
  municipality_name: '',
})

const cycleForm = reactive({
  cycle_year: new Date().getFullYear(),
  cycle_type: '',
})

const emptyCrop = () => ({
  crop: '',
  variety_id: '',
  variety_other: '',
  area_sown_ha: null as unknown as number,
  planting_date: '',
  estimated_harvest_date: '',
  yield_expected: null as unknown as number,
  area_harvested_ha: null as unknown as number,
  destination: '',
  production_qty: null as unknown as number,
  production_unit: '',
})

const cropForms = ref([emptyCrop()])

function getCatalog(name: string): CatalogItem[] {
  return catalogos.value?.catalogs[name] || []
}

function getVarieties(crop: string): CropVariety[] {
  if (!crop) return []
  return catalogos.value?.varieties[crop] || []
}

function addCrop() {
  cropForms.value.push(emptyCrop())
}

function removeCrop(index: number) {
  cropForms.value.splice(index, 1)
}

// ======== Step 0: Producer ========
async function submitStep0() {
  errors.curp = ''
  errors.privacy = ''
  stepError.value = ''

  const curp = form.curp.trim().toUpperCase()
  if (curp.length !== 18) {
    errors.curp = 'El CURP debe tener 18 caracteres'
    return
  }

  if (!form.privacy_consent) {
    errors.privacy = 'Debe aceptar el aviso de privacidad'
    return
  }

  saving.value = true
  try {
    await api.producers.crear({
      curp,
      phone: form.phone || undefined,
      privacy_consent: true,
    })
    step.value = 1
    await nextTick()
    initMap()
  } catch (e: any) {
    stepError.value = e.message || 'Error al registrar productor'
  } finally {
    saving.value = false
  }
}

// ======== Step 1: Draw ========
function initMap() {
  if (map || !mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [-99.1332, 19.4326],
    zoom: 5,
    attributionControl: false,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserHeading: false,
  }), 'top-right')

  draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
    },
    defaultMode: 'draw_polygon',
  })
  map.addControl(draw as any)

  map.on('draw.create', updateArea)
  map.on('draw.delete', updateArea)
  map.on('draw.update', updateArea)
}

function updateArea() {
  if (!draw) return
  const data = draw.getAll()
  if (data.features.length > 0) {
    // Keep only the last polygon drawn
    if (data.features.length > 1) {
      const lastId = data.features[data.features.length - 1].id
      data.features.slice(0, -1).forEach(f => {
        if (f.id) draw!.delete(f.id as string)
      })
    }
    const polygon = draw.getAll().features[0]
    if (polygon && polygon.geometry.type === 'Polygon') {
      const area = turf.area(polygon) / 10000
      calculatedArea.value = area.toFixed(4)
      drawnGeoJSON.value = polygon.geometry
      hasPolygon.value = true
    }
  } else {
    hasPolygon.value = false
    calculatedArea.value = '0'
    drawnGeoJSON.value = null
  }
}

function deleteDrawing() {
  if (draw) {
    draw.deleteAll()
    hasPolygon.value = false
    calculatedArea.value = '0'
    drawnGeoJSON.value = null
  }
}

function submitStep1() {
  if (!hasPolygon.value || !drawnGeoJSON.value) return
  step.value = 2
}

// ======== Step 2: UP Data ========
async function onStateChange() {
  form.municipality_name = ''
  municipalities.value = []
  if (form.state_name) {
    const state = catalogos.value?.states.find(s => s.name === form.state_name)
    if (state) {
      try {
        const res = await api.catalogosProductor.municipios(state.state_id)
        municipalities.value = res.municipalities
      } catch { /* empty */ }
    }
  }
}

async function submitStep2() {
  errors.up_name = ''
  stepError.value = ''

  if (!form.up_name || form.up_name.trim().length < 3) {
    errors.up_name = 'El nombre debe tener al menos 3 caracteres'
    return
  }
  if (!form.up_type || !form.production_system || !form.water_regime) {
    stepError.value = 'Todos los campos con * son obligatorios'
    return
  }
  if (!form.state_name || !form.municipality_name) {
    stepError.value = 'Seleccione estado y municipio'
    return
  }

  saving.value = true
  try {
    const res = await api.ups.crear({
      curp: form.curp.trim().toUpperCase(),
      up_name: form.up_name.trim(),
      up_type: form.up_type,
      production_system: form.production_system,
      water_regime: form.water_regime,
      geom_geojson: drawnGeoJSON.value,
      state_name: form.state_name,
      municipality_name: form.municipality_name,
    })
    savedUp.value = res.up
    step.value = 3
  } catch (e: any) {
    stepError.value = e.message || 'Error al guardar la UP'
  } finally {
    saving.value = false
  }
}

// ======== Step 3: Cycle ========
async function submitStep3() {
  stepError.value = ''

  if (!cycleForm.cycle_year || !cycleForm.cycle_type) {
    stepError.value = 'Seleccione año y tipo de ciclo'
    return
  }

  // Validate crops
  for (let i = 0; i < cropForms.value.length; i++) {
    const c = cropForms.value[i]
    if (!c.crop || !c.variety_id || !c.area_sown_ha || !c.planting_date) {
      stepError.value = `Cultivo ${i + 1}: complete todos los campos obligatorios`
      return
    }
    if (c.area_sown_ha <= 0) {
      stepError.value = `Cultivo ${i + 1}: la superficie sembrada debe ser > 0`
      return
    }
    if ((c.variety_id === 'CRIOLLO_LOCAL' || c.variety_id === 'OTRA') && !c.variety_other) {
      stepError.value = `Cultivo ${i + 1}: especifique el nombre de la variedad`
      return
    }
  }

  if (!savedUp.value) {
    stepError.value = 'No hay UP guardada. Vuelva al paso anterior.'
    return
  }

  saving.value = true
  try {
    // Create cycle
    const cycleRes = await api.cycles.crear(savedUp.value.up_id, {
      cycle_year: cycleForm.cycle_year,
      cycle_type: cycleForm.cycle_type,
    })

    // Add each crop
    for (const c of cropForms.value) {
      await api.cycles.agregarCultivo(cycleRes.cycle.cycle_id, {
        crop: c.crop,
        variety_id: c.variety_id,
        variety_other: c.variety_other || undefined,
        area_sown_ha: c.area_sown_ha,
        planting_date: c.planting_date,
        estimated_harvest_date: c.estimated_harvest_date || undefined,
        yield_expected: c.yield_expected || undefined,
        area_harvested_ha: c.area_harvested_ha || undefined,
        destination: c.destination || undefined,
        production_qty: c.production_qty || undefined,
        production_unit: c.production_unit || undefined,
      })
    }

    step.value = 4
  } catch (e: any) {
    stepError.value = e.message || 'Error al guardar ciclo'
  } finally {
    saving.value = false
  }
}

function resetWizard() {
  step.value = 0
  form.curp = ''
  form.phone = ''
  form.privacy_consent = false
  form.up_name = ''
  form.up_type = ''
  form.production_system = ''
  form.water_regime = ''
  form.state_name = ''
  form.municipality_name = ''
  cycleForm.cycle_year = new Date().getFullYear()
  cycleForm.cycle_type = ''
  cropForms.value = [emptyCrop()]
  savedUp.value = null
  hasPolygon.value = false
  calculatedArea.value = '0'
  drawnGeoJSON.value = null
  if (draw) draw.deleteAll()
  if (map) { map.remove(); map = null; draw = null }
}

// Watch step to init map when returning to step 1
watch(step, async (val) => {
  if (val === 1) {
    await nextTick()
    if (!map) initMap()
  }
})

onMounted(async () => {
  try {
    catalogos.value = await api.catalogosProductor.obtener()
  } catch (e) {
    console.error('Error cargando catálogos:', e)
  }
})

onUnmounted(() => {
  if (map) { map.remove(); map = null; draw = null }
})
</script>

<style scoped>
.productor-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* Stepper */
.wizard-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 1rem 1.25rem;
  margin-top: 0;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid var(--color-separator);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  cursor: default;
  opacity: 0.4;
  transition: opacity 0.3s;
}

.step-item.active,
.step-item.completed {
  opacity: 1;
}

.step-item.completed {
  cursor: pointer;
}

.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-fill-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: all 0.3s;
}

.step-item.active .step-circle {
  background: var(--color-primary);
  color: white;
}

.step-item.completed .step-circle {
  background: #2D7D46;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.step-item.active .step-label {
  color: var(--color-text);
}

/* Main */
.wizard-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem;
}

.wizard-card {
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
}

.wizard-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-separator);
}

.wizard-card-title svg {
  color: var(--color-primary);
}

/* Forms */
.form-section {
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 0.5px solid var(--color-separator);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.75rem;
}

.form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.flex-1 { flex: 1; }

.form-group {
  margin-bottom: 0.875rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.3rem;
}

.required { color: #D32F2F; }
.optional { color: var(--color-text-tertiary); font-weight: 400; font-size: 0.75rem; }

.form-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: var(--color-fill-quaternary);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(105, 28, 50, 0.12);
}

.form-input.error {
  border-color: #D32F2F;
}

.form-error {
  font-size: 0.75rem;
  color: #D32F2F;
  margin-top: 0.2rem;
}

.text-center { text-align: center; }
.mt-1 { margin-top: 0.5rem; }

.checkbox-group {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex !important;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem !important;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.15rem;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

/* Map step */
.step-map {
  margin: 0 -1.25rem;
  padding: 0 !important;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: white;
  border-bottom: 0.5px solid var(--color-separator);
}

.map-toolbar h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 0.1rem;
}

.map-toolbar p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.map-container {
  width: 100%;
  height: 55vh;
  min-height: 350px;
}

.map-summary {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(45, 125, 70, 0.08);
  border-bottom: 0.5px solid var(--color-separator);
}

.summary-item {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.summary-label {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2D7D46;
}

.wizard-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding: 0.75rem 1.25rem 0;
}

.wizard-actions .btn {
  flex: 1;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-fill-secondary);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-fill-tertiary);
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
}

.btn-add-crop {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1.5px dashed var(--color-border);
  background: transparent;
}

.btn-icon-sm {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: var(--color-fill-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: #fde8e8;
  color: #D32F2F;
}

/* UP summary badge */
.up-summary-badge {
  background: var(--color-fill-quaternary);
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  border: 0.5px solid var(--color-border);
  margin-bottom: 1rem;
}

.up-summary-badge strong {
  color: var(--color-text);
}

/* Success */
.success-card {
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.success-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(45, 125, 70, 0.1);
  color: #2D7D46;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.success-card h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.success-card p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.success-summary {
  background: var(--color-fill-quaternary);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.8125rem;
}

.summary-row span {
  color: var(--color-text-secondary);
}

/* Back button */
.detalle-back-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem 0.35rem 0.45rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.2s;
  flex-shrink: 0;
}

.detalle-back-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* Responsive */
@media (max-width: 1024px) {
  .wizard-stepper {
    padding: 0.75rem 0.5rem;
    overflow-x: auto;
  }

  .step-label {
    display: none;
  }

  .step-item.active .step-label {
    display: inline;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .map-container {
    height: 50vh;
    min-height: 300px;
  }

  .wizard-main {
    padding: 1rem;
  }
}
</style>
