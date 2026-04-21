<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="$router.back()">← Volver</button>
      <h1>Registrar Visita</h1>
      <p class="context-info">
        <strong>{{ route.query.nombres }}</strong> ·
        {{ route.query.up_name }} ·
        Ciclo {{ route.query.ciclo_label }}
      </p>
    </div>

    <form class="form-card" @submit.prevent="guardar">
      <div class="field">
        <label>Fecha de visita <span class="req">*</span></label>
        <input v-model="form.fecha_visita" type="date" :max="hoy" required />
      </div>

      <div class="field">
        <label>Etapa del cultivo <span class="req">*</span></label>
        <select v-model="form.etapa_cultivo" required>
          <option value="">-- Seleccionar --</option>
          <option value="siembra">Siembra</option>
          <option value="crecimiento">Crecimiento</option>
          <option value="floracion">Floración</option>
          <option value="llenado">Llenado</option>
          <option value="madurez">Madurez</option>
        </select>
      </div>

      <div class="field">
        <label>Estado del cultivo <span class="req">*</span></label>
        <div class="radio-group">
          <label v-for="opt in estadoOptions" :key="opt.value" class="radio-label">
            <input type="radio" v-model="form.estado_cultivo" :value="opt.value" required />
            <span :class="['badge-estado', opt.value]">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <div class="field">
        <label>Observaciones</label>
        <textarea v-model="form.observaciones" rows="3" placeholder="Notas de la visita..." maxlength="500" />
      </div>

      <div class="separator"><span>Precio observado (opcional)</span></div>

      <div class="field">
        <label>Precio observado ($/ton)</label>
        <input v-model.number="form.precio_observado" type="number" min="0.01" step="0.01" placeholder="Ej. 5800" />
      </div>

      <div v-if="form.precio_observado" class="field">
        <label>Tipo de maíz <span class="req">*</span></label>
        <select v-model="form.tipo_maiz" :required="!!form.precio_observado">
          <option value="">-- Seleccionar --</option>
          <option value="blanco">Maíz Blanco</option>
          <option value="amarillo">Maíz Amarillo</option>
          <option value="forrajero">Maíz Forrajero</option>
          <option value="palomero">Maíz Palomero</option>
          <option value="morado">Maíz Morado</option>
          <option value="criollo">Maíz Criollo</option>
        </select>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
      <div v-if="exito" class="exito-msg">Visita registrada correctamente.</div>

      <div class="actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Guardando...' : 'Guardar visita' }}
        </button>
        <button type="button" class="btn-secondary" @click="irA('SeguimientoIncidencia')">
          + Incidencia
        </button>
        <button type="button" class="btn-secondary" @click="irA('SeguimientoEstimacion')">
          + Estimación
        </button>
        <button type="button" class="btn-secondary" @click="irA('SeguimientoCosecha')">
          + Cosecha real
        </button>
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
.form-page { max-width: 600px; margin: 0 auto; padding: 1.5rem; }
.form-header { margin-bottom: 1.5rem; }
.back-btn { background: none; border: none; color: #2f855a; cursor: pointer; font-size: 0.9rem; margin-bottom: 0.5rem; padding: 0; }
.form-header h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem; color: #1a202c; }
.context-info { font-size: 0.85rem; color: #718096; margin: 0; }
.form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; }
.field { margin-bottom: 1.1rem; }
.field label { display: block; font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.35rem; }
.req { color: #e53e3e; }
.field input, .field select, .field textarea {
  width: 100%; box-sizing: border-box;
  padding: 0.55rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
}
.field textarea { resize: vertical; }
.radio-group { display: flex; gap: 1rem; flex-wrap: wrap; }
.radio-label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.badge-estado { padding: 4px 12px; border-radius: 99px; font-size: 0.85rem; font-weight: 600; }
.badge-estado.bueno { background: #c6f6d5; color: #276749; }
.badge-estado.regular { background: #fef3c7; color: #92400e; }
.badge-estado.malo { background: #fed7d7; color: #9b2c2c; }
.separator { display: flex; align-items: center; gap: 0.75rem; margin: 1.25rem 0; }
.separator span { color: #a0aec0; font-size: 0.8rem; white-space: nowrap; }
.separator::before, .separator::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
.actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #edf2f7; color: #4a5568; border: none; border-radius: 8px; padding: 0.6rem 1rem; font-size: 0.85rem; cursor: pointer; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; }
.exito-msg { color: #276749; font-size: 0.85rem; background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 0.5rem 0.75rem; }
</style>
