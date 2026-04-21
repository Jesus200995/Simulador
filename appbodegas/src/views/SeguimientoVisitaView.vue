<template>
  <div class="page-container narrow">
    <div class="view-header">
      <button class="btn btn-ghost btn-sm" @click="$router.back()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
      <h1>Registrar Visita</h1>
    </div>

    <div class="context-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      <strong>{{ route.query.nombres }}</strong> · {{ route.query.up_name }} · Ciclo {{ route.query.ciclo_label }}
    </div>

    <form class="glass-card" @submit.prevent="guardar">
      <div class="form-group">
        <label class="form-label">Fecha de visita <span class="form-required">*</span></label>
        <input v-model="form.fecha_visita" type="date" class="form-input" :max="hoy" required />
      </div>

      <div class="form-group">
        <label class="form-label">Etapa del cultivo <span class="form-required">*</span></label>
        <select v-model="form.etapa_cultivo" class="form-input" required>
          <option value="">-- Seleccionar --</option>
          <option value="siembra">Siembra</option>
          <option value="crecimiento">Crecimiento</option>
          <option value="floracion">Floración</option>
          <option value="llenado">Llenado</option>
          <option value="madurez">Madurez</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Estado del cultivo <span class="form-required">*</span></label>
        <div class="radio-card-group">
          <label v-for="opt in estadoOptions" :key="opt.value">
            <input type="radio" v-model="form.estado_cultivo" :value="opt.value" required class="sr-only" />
            <span :class="['radio-pill', opt.value, { selected: form.estado_cultivo === opt.value }]">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea v-model="form.observaciones" class="form-input" rows="3" placeholder="Notas de la visita..." maxlength="500" />
      </div>

      <div class="form-divider"><span>Precio observado (opcional)</span></div>

      <div class="form-group">
        <label class="form-label">Precio observado ($/ton)</label>
        <input v-model.number="form.precio_observado" type="number" class="form-input" min="0.01" step="0.01" placeholder="Ej. 5800" />
      </div>

      <div v-if="form.precio_observado" class="form-group">
        <label class="form-label">Tipo de maíz <span class="form-required">*</span></label>
        <select v-model="form.tipo_maiz" class="form-input" :required="!!form.precio_observado">
          <option value="">-- Seleccionar --</option>
          <option value="blanco">Maíz Blanco</option>
          <option value="amarillo">Maíz Amarillo</option>
          <option value="forrajero">Maíz Forrajero</option>
          <option value="palomero">Maíz Palomero</option>
          <option value="morado">Maíz Morado</option>
          <option value="criollo">Maíz Criollo</option>
        </select>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="exito" class="alert alert-success">Visita registrada correctamente.</div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Guardando...' : 'Guardar visita' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="irA('SeguimientoIncidencia')">+ Incidencia</button>
        <button type="button" class="btn btn-ghost" @click="irA('SeguimientoEstimacion')">+ Estimación</button>
        <button type="button" class="btn btn-ghost" @click="irA('SeguimientoCosecha')">+ Cosecha real</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()

const hoy = new Date().toISOString().split('T')[0]

const form = ref({
  fecha_visita: hoy,
  etapa_cultivo: '',
  estado_cultivo: '',
  observaciones: '',
  precio_observado: null as number | null,
  tipo_maiz: '',
})

const estadoOptions = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'malo', label: 'Malo' },
]

const loading = ref(false)
const error = ref('')
const exito = ref(false)

async function guardar() {
  error.value = ''
  exito.value = false
  loading.value = true
  try {
    await api.seguimiento.crearVisita({
      producer_id: Number(route.query.producer_id),
      up_id: Number(route.query.up_id),
      ciclo_id: Number(route.query.ciclo_id),
      ...form.value,
      precio_observado: form.value.precio_observado || undefined,
      tipo_maiz: form.value.tipo_maiz || undefined,
    })
    exito.value = true
    form.value = { fecha_visita: hoy, etapa_cultivo: '', estado_cultivo: '', observaciones: '', precio_observado: null, tipo_maiz: '' }
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  } finally {
    loading.value = false
  }
}

function irA(name: string) {
  router.push({ name, query: route.query })
}
</script>

<style scoped>
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); border: 0;
}

.radio-pill {
  padding: .4375rem .875rem; border-radius: var(--radius-full);
  font-size: .8125rem; font-weight: 600; cursor: pointer;
  border: 1.5px solid var(--color-separator-opaque);
  background: var(--color-surface); color: var(--color-text-secondary);
  transition: all .2s var(--ease-out);
}

.radio-pill:hover { border-color: var(--color-text-tertiary); }

.radio-pill.bueno.selected { background: rgba(52, 199, 89, 0.12); color: #1D8348; border-color: rgba(52, 199, 89, 0.3); }
.radio-pill.regular.selected { background: rgba(255, 149, 0, 0.12); color: #B8720E; border-color: rgba(255, 149, 0, 0.3); }
.radio-pill.malo.selected { background: rgba(255, 59, 48, 0.10); color: #C0392B; border-color: rgba(255, 59, 48, 0.3); }

.form-actions {
  display: flex; gap: .625rem; flex-wrap: wrap; margin-top: 1.5rem;
  padding-top: 1.25rem; border-top: .5px solid var(--color-separator);
}
</style>
