<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Alertas</h1>
          <p class="view-subtitle">Monitoreo de eventos climáticos y riesgos</p>
        </div>
        <div class="view-header-actions">
          <button v-if="!authStore.isBodeguero" class="btn btn-primary" @click="showForm = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva alerta
          </button>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <select v-model="filtros.estado_alerta" @change="cargar">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="descartada">Descartada</option>
        <option value="atendida">Atendida</option>
      </select>
      <select v-model="filtros.nivel_alerta" @change="cargar">
        <option value="">Todos los niveles</option>
        <option value="bajo">Bajo</option>
        <option value="medio">Medio</option>
        <option value="alto">Alto</option>
      </select>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando alertas...</p>
    </div>
    <div v-else-if="alertas.length === 0" class="state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <p>No hay alertas con los filtros seleccionados.</p>
    </div>

    <div v-else class="alertas-grid">
      <div
        v-for="alerta in alertas"
        :key="alerta.id"
        class="glass-card interactive alerta-card"
        @click="$router.push({ name: 'AlertaDetalle', params: { id: alerta.id } })"
      >
        <div class="alerta-badges">
          <span class="badge" :class="nivelBadge(alerta.nivel_alerta)">{{ alerta.nivel_alerta }}</span>
          <span class="badge" :class="estadoBadge(alerta.estado_alerta)">{{ alerta.estado_alerta }}</span>
          <span class="badge badge-gray">{{ alerta.origen_alerta }}</span>
        </div>
        <div class="alerta-body">
          <div class="alerta-tipo">{{ tipoLabel(alerta.tipo_alerta) }}</div>
          <div class="alerta-productor">{{ alerta.apellido_paterno }} {{ alerta.nombres }} · {{ alerta.up_name }}</div>
          <div class="alerta-fecha">{{ formatFecha(alerta.fecha_alerta) }}</div>
        </div>
        <div class="alerta-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>

    <!-- Modal nueva alerta -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-card">
        <h2>Nueva alerta manual</h2>
        <form @submit.prevent="crearAlerta">
          <!-- Supervisor/Admin: buscar productor primero -->
          <div class="form-group" v-if="!authStore.isProductor">
            <label class="form-label">Productor <span class="form-required">*</span></label>
            <input
              v-model="productorQuery"
              type="text"
              class="form-input"
              placeholder="Buscar por nombre o CURP..."
              @input="buscarProductores"
            />
            <div v-if="productoresList.length > 0 && !selectedProductor" class="autocomplete-list">
              <div
                v-for="p in productoresList"
                :key="p.producer_id"
                class="autocomplete-item"
                @click="seleccionarProductor(p)"
              >
                {{ p.apellido_paterno }} {{ p.apellido_materno }} {{ p.nombres }} · {{ p.curp }}
              </div>
            </div>
            <div v-if="selectedProductor" class="selected-badge">
              {{ selectedProductor.apellido_paterno }} {{ selectedProductor.nombres }}
              <button type="button" class="badge-clear" @click="limpiarProductor">&times;</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Unidad de Producción <span class="form-required">*</span></label>
            <select v-model="newAlerta.up_id" class="form-input" required @change="onUpChange">
              <option :value="null">-- Seleccionar UP --</option>
              <option v-for="up in upsDisponibles" :key="up.up_id" :value="up.up_id">
                {{ up.up_name }} ({{ up.state_name || up.municipality_name || 'Sin ubicación' }})
              </option>
            </select>
          </div>
          <div class="form-group" v-if="ciclosUp.length > 0">
            <label class="form-label">Ciclo <span class="form-required">*</span></label>
            <select v-model="newAlerta.ciclo_id" class="form-input" required @change="onCicloChange">
              <option :value="null">-- Seleccionar ciclo --</option>
              <option v-for="c in ciclosUp" :key="c.cycle_id" :value="c.cycle_id">
                {{ c.cycle_year }} / {{ c.cycle_type }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="cultivosCiclo.length > 0">
            <label class="form-label">Cultivo (opcional)</label>
            <select v-model="newAlerta.cycle_crop_id" class="form-input">
              <option :value="null">-- Aplica a todo el ciclo --</option>
              <option v-for="cc in cultivosCiclo" :key="cc.cycle_crop_id" :value="cc.cycle_crop_id">
                {{ cropLabel(cc.crop) }}{{ cc.variety_id ? ' · ' + cc.variety_id : '' }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de alerta <span class="form-required">*</span></label>
            <select v-model="newAlerta.tipo_alerta" class="form-input" required>
              <option value="">-- Seleccionar --</option>
              <option value="helada">Helada</option>
              <option value="sequia">Sequía</option>
              <option value="lluvia_fuerte">Lluvia fuerte</option>
              <option value="viento_fuerte">Viento fuerte</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nivel <span class="form-required">*</span></label>
            <select v-model="newAlerta.nivel_alerta" class="form-input" required>
              <option value="">-- Seleccionar --</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha <span class="form-required">*</span></label>
            <input v-model="newAlerta.fecha_alerta" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea v-model="newAlerta.observaciones" class="form-input" rows="2" maxlength="500" />
          </div>
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showForm = false">Cancelar</button>
            <button type="submit" :disabled="formLoading" class="btn btn-primary">
              {{ formLoading ? 'Guardando...' : 'Crear alerta' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const alertas = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const filtros = ref({ estado_alerta: '', nivel_alerta: '' })
const hoy = new Date().toISOString().split('T')[0]
const misUps = ref<any[]>([])
const ciclosUp = ref<any[]>([])
const cultivosCiclo = ref<any[]>([])

// Supervisor/Admin: producer search
const productorQuery = ref('')
const productoresList = ref<any[]>([])
const selectedProductor = ref<any>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const upsDisponibles = computed(() => {
  if (authStore.isProductor) return misUps.value
  if (!selectedProductor.value) return []
  return selectedProductor.value.ups || []
})

const newAlerta = ref({
  up_id: null as number | null,
  ciclo_id: null as number | null,
  cycle_crop_id: null as number | null,
  tipo_alerta: '',
  nivel_alerta: '',
  fecha_alerta: hoy,
  observaciones: '',
})

async function cargar() {
  loading.value = true
  try {
    const data = await api.alertas.listar(filtros.value)
    alertas.value = data.alertas
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarMisUps() {
  if (!authStore.isProductor) return
  try {
    const data = await api.misUps.listar()
    misUps.value = data.ups || []
  } catch (e) {
    console.error(e)
  }
}

function buscarProductores() {
  if (searchTimeout) clearTimeout(searchTimeout)
  selectedProductor.value = null
  productoresList.value = []
  if (productorQuery.value.length < 2) return
  searchTimeout = setTimeout(async () => {
    try {
      const data = await api.seguimiento.productores(productorQuery.value)
      productoresList.value = data.productores || []
    } catch (e) {
      console.error(e)
    }
  }, 350)
}

function seleccionarProductor(p: any) {
  selectedProductor.value = p
  productoresList.value = []
  productorQuery.value = `${p.apellido_paterno || ''} ${p.nombres || ''}`.trim()
  // Reset downstream selectors
  newAlerta.value.up_id = null
  newAlerta.value.ciclo_id = null
  newAlerta.value.cycle_crop_id = null
  ciclosUp.value = []
  cultivosCiclo.value = []
}

function limpiarProductor() {
  selectedProductor.value = null
  productorQuery.value = ''
  productoresList.value = []
  newAlerta.value.up_id = null
  newAlerta.value.ciclo_id = null
  newAlerta.value.cycle_crop_id = null
  ciclosUp.value = []
  cultivosCiclo.value = []
}

async function onUpChange() {
  ciclosUp.value = []
  cultivosCiclo.value = []
  newAlerta.value.ciclo_id = null
  newAlerta.value.cycle_crop_id = null
  if (!newAlerta.value.up_id) return

  if (!authStore.isProductor && selectedProductor.value) {
    // Supervisor/Admin: cycles already embedded in the producer data
    const up = (selectedProductor.value.ups || []).find((u: any) => u.up_id === newAlerta.value.up_id)
    ciclosUp.value = up?.ciclos || []
  } else {
    try {
      const data = await api.cycles.listar(newAlerta.value.up_id)
      ciclosUp.value = data.cycles || []
    } catch (e) {
      console.error(e)
    }
  }
}

function onCicloChange() {
  cultivosCiclo.value = []
  newAlerta.value.cycle_crop_id = null
  const ciclo = ciclosUp.value.find((c: any) => c.cycle_id === newAlerta.value.ciclo_id)
  if (ciclo && Array.isArray(ciclo.crops)) {
    cultivosCiclo.value = ciclo.crops
  }
}

async function crearAlerta() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.alertas.crear(newAlerta.value)
    showForm.value = false
    newAlerta.value = { up_id: null, ciclo_id: null, cycle_crop_id: null, tipo_alerta: '', nivel_alerta: '', fecha_alerta: hoy, observaciones: '' }
    ciclosUp.value = []
    cultivosCiclo.value = []
    selectedProductor.value = null
    productorQuery.value = ''
    productoresList.value = []
    await cargar()
  } catch (e: any) {
    formError.value = e.message || 'Error al crear alerta'
  } finally {
    formLoading.value = false
  }
}

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    helada: 'Helada', sequia: 'Sequía', lluvia_fuerte: 'Lluvia fuerte',
    viento_fuerte: 'Viento fuerte', otro: 'Otro',
  }
  return map[tipo] || tipo
}

function cropLabel(crop: string) {
  const m: Record<string, string> = { maiz: 'Maíz', frijol: 'Frijol' }
  return m[crop] || crop
}

function nivelBadge(nivel: string) {
  const m: Record<string, string> = { bajo: 'badge-green', medio: 'badge-yellow', alto: 'badge-red' }
  return m[nivel] || 'badge-gray'
}

function estadoBadge(estado: string) {
  const m: Record<string, string> = { pendiente: 'badge-gray', confirmada: 'badge-blue', descartada: 'badge-gray', atendida: 'badge-green' }
  return m[estado] || 'badge-gray'
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => { cargar(); cargarMisUps() })
</script>

<style scoped>
.alertas-grid { display: flex; flex-direction: column; gap: .75rem; }

.alerta-card {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 1.25rem !important;
}

.alerta-badges { display: flex; gap: .375rem; flex-wrap: wrap; min-width: 0; flex-shrink: 0; }

.alerta-body { flex: 1; min-width: 0; }
.alerta-tipo { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -.02em; margin-bottom: .15rem; }
.alerta-productor { font-size: .8125rem; color: var(--color-text-secondary); }
.alerta-fecha { font-size: .75rem; color: var(--color-text-tertiary); margin-top: .25rem; }

.alerta-chevron { color: var(--color-text-tertiary); opacity: .4; flex-shrink: 0; align-self: center; }
.alerta-card:hover .alerta-chevron { opacity: .7; }

.autocomplete-list {
  position: absolute; z-index: 10; left: 0; right: 0;
  max-height: 180px; overflow-y: auto;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.autocomplete-item {
  padding: .6rem .75rem; cursor: pointer; font-size: .8125rem;
  color: var(--color-text); transition: background .15s;
}
.autocomplete-item:hover { background: var(--color-fill); }
.selected-badge {
  display: inline-flex; align-items: center; gap: .4rem;
  margin-top: .35rem; padding: .3rem .65rem; border-radius: 99px;
  background: rgba(15,81,50,.08); color: #0F5132;
  font-size: .8125rem; font-weight: 600;
}
.badge-clear {
  background: none; border: none; cursor: pointer;
  font-size: 1.1rem; color: #0F5132; opacity: .6; line-height: 1;
  padding: 0 2px;
}
.badge-clear:hover { opacity: 1; }
.form-group { position: relative; }

@media (max-width: 600px) {
  .alerta-card { flex-direction: column; gap: .625rem; }
  .alerta-chevron { display: none; }
}
</style>
