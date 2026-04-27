<template>
  <div class="page-container alertas-page">
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
      <select v-model="filtros.estado_alerta" @change="cargar" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="descartada">Descartada</option>
        <option value="atendida">Atendida</option>
      </select>
      <select v-model="filtros.nivel_alerta" @change="cargar" class="filter-select">
        <option value="">Todos los niveles</option>
        <option value="bajo">Bajo</option>
        <option value="medio">Medio</option>
        <option value="alto">Alto</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="alertas-grid">
      <div v-for="n in 4" :key="n" class="alerta-card alerta-skeleton">
        <div class="alerta-icon-wrap skeleton-pulse" style="width:44px;height:44px;border-radius:14px"></div>
        <div class="alerta-content" style="flex:1">
          <div class="skeleton-pulse" style="width:60%;height:14px;border-radius:6px;margin-bottom:8px"></div>
          <div class="skeleton-pulse" style="width:80%;height:11px;border-radius:5px;margin-bottom:6px"></div>
          <div class="skeleton-pulse" style="width:40%;height:10px;border-radius:5px"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="alertas.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <p class="empty-title">Sin alertas</p>
      <p class="empty-sub">No hay alertas con los filtros seleccionados</p>
    </div>

    <!-- Alertas list -->
    <TransitionGroup v-else name="card-list" tag="div" class="alertas-grid">
      <div
        v-for="alerta in alertas"
        :key="alerta.id"
        class="alerta-card"
        @click="$router.push({ name: 'AlertaDetalle', params: { id: alerta.id } })"
      >
        <!-- Icon -->
        <div class="alerta-icon-wrap" :class="'icon-' + alerta.tipo_alerta">
          <div v-html="tipoIcon(alerta.tipo_alerta)"></div>
        </div>

        <!-- Content -->
        <div class="alerta-content">
          <div class="alerta-top-row">
            <span class="alerta-tipo">{{ tipoLabel(alerta.tipo_alerta) }}</span>
            <span class="nivel-pill" :class="'nivel-' + alerta.nivel_alerta">
              <span class="nivel-dot" :class="{ 'pulse': alerta.estado_alerta === 'pendiente' }"></span>
              {{ nivelLabel(alerta.nivel_alerta) }}
            </span>
          </div>
          <div class="alerta-meta">
            <span v-if="alerta.up_name">{{ alerta.up_name }}</span>
            <span v-if="alerta.apellido_paterno"> · {{ alerta.apellido_paterno }} {{ alerta.nombres }}</span>
          </div>
          <div class="alerta-bottom-row">
            <span class="estado-tag" :class="'estado-' + alerta.estado_alerta">{{ estadoLabel(alerta.estado_alerta) }}</span>
            <span class="alerta-fecha">{{ formatFecha(alerta.fecha_alerta) }}</span>
            <span class="origen-tag" v-if="alerta.origen_alerta === 'automatica'">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Auto
            </span>
          </div>
          <div class="alerta-obs" v-if="alerta.observaciones">{{ alerta.observaciones }}</div>
        </div>

        <!-- Chevron + time -->
        <div class="alerta-end">
          <span class="alerta-ago">{{ timeAgo(alerta.created_at) }}</span>
          <svg class="alerta-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </TransitionGroup>

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
    viento_fuerte: 'Viento fuerte', granizo: 'Granizo', otro: 'Otro',
  }
  return map[tipo] || tipo
}

function tipoIcon(tipo: string): string {
  const icons: Record<string, string> = {
    helada: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M17 5l-5 3-5-3M17 19l-5-3-5 3M2 12h20M5 7l3 5-3 5M19 7l-3 5 3 5"/></svg>',
    sequia: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    lluvia_fuerte: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/></svg>',
    viento_fuerte: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
    granizo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><circle cx="8" cy="19" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="16" cy="19" r="1"/></svg>',
  }
  return icons[tipo] || '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
}

function nivelLabel(nivel: string) {
  const m: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }
  return m[nivel] || nivel
}

function estadoLabel(estado: string) {
  const m: Record<string, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', descartada: 'Descartada', atendida: 'Atendida' }
  return m[estado] || estado
}

function cropLabel(crop: string) {
  const m: Record<string, string> = { maiz: 'Maíz', frijol: 'Frijol' }
  return m[crop] || crop
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return ''
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return formatFecha(dateStr)
}

onMounted(() => { cargar(); cargarMisUps() })
</script>

<style scoped>
/* ── Filter bar ── */
.filter-bar { display: flex; gap: .5rem; margin-bottom: 1rem; }
.filter-select {
  flex: 1; padding: .5rem .75rem; border-radius: 10px;
  border: 1px solid var(--color-separator); background: var(--color-surface);
  font-size: .8125rem; font-weight: 550; color: var(--color-text);
  font-family: var(--font-family);
  transition: border-color .2s;
}
.filter-select:focus { border-color: var(--color-primary); outline: none; }

/* ── Grid ── */
.alertas-grid { display: flex; flex-direction: column; gap: .625rem; }

/* ── Card ── */
.alerta-card {
  display: flex; align-items: flex-start; gap: .875rem;
  padding: 1rem 1.125rem;
  background: var(--color-surface);
  border-radius: 16px;
  border: .5px solid rgba(0,0,0,.05);
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.02);
  cursor: pointer;
  transition: transform .2s var(--ease-out), box-shadow .2s;
}
.alerta-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
}
.alerta-card:active { transform: scale(.995); }

/* ── Weather Icon ── */
.alerta-icon-wrap {
  width: 44px; height: 44px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(0,0,0,.04); color: var(--color-text-secondary);
}
.alerta-icon-wrap.icon-helada { background: rgba(96,165,250,.12); color: #3B82F6; }
.alerta-icon-wrap.icon-sequia { background: rgba(251,191,36,.12); color: #D97706; }
.alerta-icon-wrap.icon-lluvia_fuerte { background: rgba(59,130,246,.12); color: #2563EB; }
.alerta-icon-wrap.icon-viento_fuerte { background: rgba(139,92,246,.12); color: #7C3AED; }
.alerta-icon-wrap.icon-granizo { background: rgba(148,163,184,.12); color: #64748B; }
.alerta-icon-wrap.icon-otro { background: rgba(251,146,60,.1); color: #EA580C; }

/* ── Content ── */
.alerta-content { flex: 1; min-width: 0; }
.alerta-top-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
.alerta-tipo { font-size: .9375rem; font-weight: 700; color: var(--color-text); letter-spacing: -.02em; }

/* Nivel pill */
.nivel-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 99px;
  font-size: .625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.nivel-bajo { background: rgba(52,199,89,.1); color: #1D6B34; }
.nivel-medio { background: rgba(255,204,0,.15); color: #92600C; }
.nivel-alto { background: rgba(255,59,48,.1); color: #D32F2F; }
.nivel-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
}
.nivel-dot.pulse { animation: pulse-dot 1.8s ease-in-out infinite; }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(.7); }
}

/* Meta */
.alerta-meta {
  font-size: .78rem; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: .35rem;
}

/* Bottom row */
.alerta-bottom-row { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.estado-tag {
  display: inline-block; padding: 1px 7px; border-radius: 6px;
  font-size: .65rem; font-weight: 650; text-transform: capitalize;
}
.estado-pendiente { background: rgba(255,149,0,.1); color: #C05621; }
.estado-confirmada { background: rgba(0,122,255,.1); color: #007AFF; }
.estado-descartada { background: rgba(0,0,0,.05); color: var(--color-text-tertiary); }
.estado-atendida { background: rgba(52,199,89,.1); color: #1D6B34; }

.alerta-fecha { font-size: .7rem; color: var(--color-text-tertiary); }
.origen-tag {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: .6rem; font-weight: 700; text-transform: uppercase;
  color: var(--color-text-tertiary); letter-spacing: .03em;
}

.alerta-obs {
  margin-top: .3rem; font-size: .75rem; color: var(--color-text-tertiary);
  font-style: italic; line-height: 1.35;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── End column ── */
.alerta-end {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: .35rem; flex-shrink: 0; padding-top: 2px;
}
.alerta-ago { font-size: .65rem; color: var(--color-text-tertiary); white-space: nowrap; }
.alerta-chevron { color: var(--color-text-tertiary); opacity: .3; transition: opacity .2s; }
.alerta-card:hover .alerta-chevron { opacity: .7; }

/* ── Empty state ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 3rem 1rem; text-align: center;
}
.empty-icon {
  width: 80px; height: 80px; border-radius: 24px;
  background: rgba(0,0,0,.03);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-tertiary); margin-bottom: 1rem;
  animation: empty-bob 3s ease-in-out infinite;
}
@keyframes empty-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.empty-title { font-size: 1.0625rem; font-weight: 700; color: var(--color-text); margin-bottom: .25rem; }
.empty-sub { font-size: .8125rem; color: var(--color-text-tertiary); }

/* ── Skeleton ── */
.alerta-skeleton { pointer-events: none; }
.skeleton-pulse {
  background: linear-gradient(90deg, rgba(0,0,0,.04) 25%, rgba(0,0,0,.08) 50%, rgba(0,0,0,.04) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Card list transition ── */
.card-list-enter-active { transition: all .35s cubic-bezier(.33,1,.68,1); }
.card-list-leave-active { transition: all .2s ease-in; }
.card-list-enter-from { opacity: 0; transform: translateY(12px); }
.card-list-leave-to { opacity: 0; transform: translateX(-16px); }
.card-list-move { transition: transform .3s ease; }

/* ── Autocomplete ── */
.autocomplete-list {
  position: absolute; z-index: 10; left: 0; right: 0;
  max-height: 180px; overflow-y: auto;
  background: var(--color-surface); border: 1px solid var(--color-separator);
  border-radius: 12px; margin-top: 2px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
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
  font-size: 1.1rem; color: #0F5132; opacity: .6; line-height: 1; padding: 0 2px;
}
.badge-clear:hover { opacity: 1; }
.form-group { position: relative; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .alerta-card { padding: .875rem; gap: .75rem; }
  .alerta-icon-wrap { width: 38px; height: 38px; border-radius: 12px; }
  .alerta-icon-wrap :deep(svg) { width: 18px; height: 18px; }
  .alerta-tipo { font-size: .875rem; }
  .alerta-end { display: none; }
  .alerta-meta { font-size: .72rem; }
  .filter-bar { flex-direction: column; }
}
</style>
