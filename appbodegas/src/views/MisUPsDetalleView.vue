<template>
  <div class="page-container">
    <div class="page-nav">
      <button class="page-back-btn" @click="$router.push({ name: 'MisUPs' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Mis UPs
      </button>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
    </div>

    <template v-else-if="up">
      <!-- Encabezado UP -->
      <div class="view-header">
        <div class="view-header-row">
          <div>
            <h1>{{ up.up_name }}</h1>
            <p class="view-subtitle">{{ up.state_name || '—' }} · {{ up.municipality_name || '—' }}</p>
          </div>
          <button class="btn btn-ghost" @click="editMode = !editMode">
            {{ editMode ? 'Cancelar' : 'Editar datos' }}
          </button>
        </div>
      </div>

      <!-- Form de edición -->
      <div v-if="editMode" class="glass-card form-card">
        <h3 class="section-title">Editar datos generales</h3>
        <div class="form-grid">
          <div class="field">
            <label>Nombre de la UP</label>
            <input v-model="editData.up_name" type="text" />
          </div>
          <div class="field">
            <label>Tipo de UP</label>
            <input v-model="editData.up_type" type="text" />
          </div>
          <div class="field">
            <label>Sistema productivo</label>
            <input v-model="editData.production_system" type="text" />
          </div>
          <div class="field">
            <label>Régimen hídrico</label>
            <input v-model="editData.water_regime" type="text" />
          </div>
          <div class="field">
            <label>Estado</label>
            <input v-model="editData.state_name" type="text" />
          </div>
          <div class="field">
            <label>Municipio</label>
            <input v-model="editData.municipality_name" type="text" />
          </div>
        </div>
        <div v-if="editError" class="error-msg">{{ editError }}</div>
        <div class="actions">
          <button class="btn btn-primary" :disabled="saving" @click="guardarEdicion">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      <!-- Info general -->
      <div v-else class="glass-card info-card">
        <div class="info-row"><span class="info-label">Superficie calculada</span><span class="info-val">{{ up.area_ha_calc ? Number(up.area_ha_calc).toFixed(4) + ' ha' : '—' }}</span></div>
        <div class="info-row"><span class="info-label">Tipo de UP</span><span class="info-val">{{ up.up_type || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Sistema productivo</span><span class="info-val">{{ up.production_system || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Régimen hídrico</span><span class="info-val">{{ up.water_regime || '—' }}</span></div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.label }}</button>
      </div>

      <!-- Tab: Ciclos -->
      <div v-if="activeTab === 'ciclos'">
        <div v-if="cycles.length === 0" class="glass-card state-empty-sm"><p>Sin ciclos registrados.</p></div>
        <div v-for="c in cycles" :key="c.cycle_id" class="glass-card cycle-card">
          <div class="cycle-header">
            <span class="cycle-label">Ciclo {{ c.cycle_year }} / {{ c.cycle_type }}</span>
            <span class="badge badge-gray">{{ (c.crops || []).length }} cultivo(s)</span>
          </div>
          <div v-if="c.crops && c.crops.length" class="crops-list">
            <div v-for="crop in c.crops" :key="crop.cycle_crop_id" class="crop-row">
              <span class="crop-name">{{ crop.crop }}</span>
              <span class="crop-detail">{{ crop.area_sown_ha }} ha · {{ formatFecha(crop.planting_date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Seguimiento -->
      <div v-if="activeTab === 'seguimiento'">
        <div v-if="!seguimiento || todosVacios" class="glass-card state-empty-sm"><p>Sin registros de seguimiento.</p></div>
        <template v-else>
          <template v-if="seguimiento.visitas.length > 0">
            <h3 class="section-title">Visitas</h3>
            <div v-for="v in seguimiento.visitas" :key="v.id" class="glass-card seg-item">
              <div class="seg-fecha">{{ formatFecha(v.fecha_visita) }}</div>
              <div class="seg-desc">{{ v.etapa_cultivo }} · {{ v.estado_cultivo }}</div>
              <div class="seg-obs" v-if="v.observaciones">{{ v.observaciones }}</div>
            </div>
          </template>
          <template v-if="seguimiento.incidencias.length > 0">
            <h3 class="section-title">Incidencias</h3>
            <div v-for="i in seguimiento.incidencias" :key="i.id" class="glass-card seg-item">
              <div class="seg-fecha">{{ formatFecha(i.fecha) }}</div>
              <div class="seg-desc">{{ i.tipo_incidencia }} · <span :class="'sev-' + i.severidad">{{ i.severidad }}</span></div>
            </div>
          </template>
          <template v-if="seguimiento.estimaciones.length > 0">
            <h3 class="section-title">Estimaciones</h3>
            <div v-for="e in seguimiento.estimaciones" :key="e.id" class="glass-card seg-item">
              <div class="seg-fecha">{{ formatFecha(e.fecha_estimacion) }}</div>
              <div class="seg-desc">{{ e.rendimiento_estimado_ton_ha }} ton/ha estimadas</div>
            </div>
          </template>
          <template v-if="seguimiento.cosechas.length > 0">
            <h3 class="section-title">Cosechas</h3>
            <div v-for="co in seguimiento.cosechas" :key="co.id" class="glass-card seg-item">
              <div class="seg-fecha">{{ formatFecha(co.fecha_cosecha) }}</div>
              <div class="seg-desc">{{ co.produccion_total_ton }} ton · {{ co.rendimiento_real_ton_ha }} ton/ha</div>
            </div>
          </template>
        </template>
      </div>

      <!-- Tab: Alertas -->
      <div v-if="activeTab === 'alertas'">
        <div v-if="alertas.length === 0" class="glass-card state-empty-sm"><p>Sin alertas asociadas.</p></div>
        <div v-for="a in alertas" :key="a.id" class="glass-card seg-item">
          <div class="seg-fecha">{{ formatFecha(a.fecha_alerta) }}</div>
          <div class="seg-desc">{{ tipoAlertaLabel(a.tipo_alerta) }} · <span :class="'nivel-' + a.nivel_alerta">{{ a.nivel_alerta }}</span></div>
          <div class="seg-obs">Estado: {{ a.estado_alerta }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const upId = Number(route.params.up_id)

const loading = ref(true)
const up = ref<any>(null)
const cycles = ref<any[]>([])
const seguimiento = ref<any>(null)
const alertas = ref<any[]>([])
const activeTab = ref('ciclos')
const editMode = ref(false)
const saving = ref(false)
const editError = ref('')
const editData = ref<any>({})

const tabs = [
  { key: 'ciclos', label: 'Ciclos y Cultivos' },
  { key: 'seguimiento', label: 'Seguimiento' },
  { key: 'alertas', label: 'Alertas' },
]

const todosVacios = computed(() => {
  if (!seguimiento.value) return true
  return !seguimiento.value.visitas.length && !seguimiento.value.incidencias.length &&
         !seguimiento.value.estimaciones.length && !seguimiento.value.cosechas.length
})

async function cargar() {
  loading.value = true
  try {
    const data = await api.misUps.obtener(upId)
    up.value = data.up
    cycles.value = data.cycles || []
    seguimiento.value = data.seguimiento
    alertas.value = data.alertas || []
    editData.value = {
      up_name: data.up.up_name,
      up_type: data.up.up_type,
      production_system: data.up.production_system,
      water_regime: data.up.water_regime,
      state_name: data.up.state_name,
      municipality_name: data.up.municipality_name,
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function guardarEdicion() {
  editError.value = ''
  saving.value = true
  try {
    const res = await api.misUps.editar(upId, editData.value)
    up.value = { ...up.value, ...res.up }
    editMode.value = false
  } catch (e: any) {
    editError.value = e.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function formatFecha(f: string) {
  if (!f) return '—'
  return new Date(f.includes('T') ? f : f + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tipoAlertaLabel(t: string) {
  const m: Record<string, string> = { helada: 'Helada', sequia: 'Sequía', lluvia_fuerte: 'Lluvia fuerte', viento_fuerte: 'Viento fuerte', otro: 'Otro' }
  return m[t] || t
}

onMounted(cargar)
</script>

<style scoped>
.form-card { padding: 1.25rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

.info-card { padding: 1.25rem; display: flex; flex-direction: column; gap: .25rem; }
.info-row { display: flex; justify-content: space-between; padding: .5rem 0; border-bottom: .5px solid var(--color-separator); font-size: .875rem; }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--color-text-secondary); }
.info-val { font-weight: 600; color: var(--color-text); }

.tabs { display: flex; gap: 4px; margin: 1.25rem 0 .75rem; background: var(--color-fill); border-radius: 10px; padding: 3px; }
.tab-btn {
  flex: 1; padding: .5rem .75rem; border: none; background: none; cursor: pointer;
  border-radius: 8px; font-size: .8rem; font-weight: 550; color: var(--color-text-secondary);
  font-family: var(--font-family); transition: all .2s;
}
.tab-btn.active { background: var(--color-surface); color: var(--color-primary); font-weight: 650; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

.cycle-card { padding: 1rem 1.25rem; margin-bottom: .5rem; }
.cycle-header { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
.cycle-label { font-weight: 700; font-size: .9rem; color: var(--color-text); }

.crops-list { display: flex; flex-direction: column; gap: .25rem; }
.crop-row { display: flex; justify-content: space-between; font-size: .8125rem; padding: .3rem 0; }
.crop-name { font-weight: 600; color: var(--color-text); }
.crop-detail { color: var(--color-text-tertiary); }

.section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-tertiary); margin: 1rem 0 .5rem; }

.seg-item { padding: .875rem 1.25rem; margin-bottom: .5rem; }
.seg-fecha { font-size: .75rem; color: var(--color-text-tertiary); }
.seg-desc { font-size: .875rem; font-weight: 600; color: var(--color-text); }
.seg-obs { font-size: .78rem; color: var(--color-text-secondary); }

.sev-baja { color: #1D8348; }
.sev-media { color: #C05621; }
.sev-alta { color: #c53030; }
.nivel-bajo { color: #1D8348; }
.nivel-medio { color: #C05621; }
.nivel-alto { color: #c53030; }

.state-empty-sm { padding: 1.5rem; text-align: center; color: var(--color-text-tertiary); font-size: .875rem; }
.state-loading { display: flex; align-items: center; justify-content: center; padding: 3rem; }

.badge { display: inline-block; padding: .2rem .55rem; border-radius: 999px; font-size: .72rem; font-weight: 600; }
.badge-gray { background: var(--color-fill); color: var(--color-text-secondary); }

.spinner { display: inline-block; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.spinner-dark { border-top-color: var(--color-primary, #691C32); }
@keyframes spin { to { transform: rotate(360deg); } }

.field label { display: block; font-size: .8rem; font-weight: 600; margin-bottom: .35rem; color: var(--color-text-secondary); }
.field input { width: 100%; padding: .6rem .85rem; border: 1px solid var(--color-border); border-radius: 8px; font-size: .9rem; font-family: var(--font-family); box-sizing: border-box; }
.actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
.error-msg { color: #c53030; font-size: .85rem; margin-top: .5rem; }
</style>
