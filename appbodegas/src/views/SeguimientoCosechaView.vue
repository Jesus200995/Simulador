<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="$router.back()">← Volver</button>
      <h1>Cosecha Real</h1>
      <p class="context-info">
        <strong>{{ route.query.nombres }}</strong> ·
        {{ route.query.up_name }} · Ciclo {{ route.query.ciclo_label }}
      </p>
    </div>

    <form class="form-card" @submit.prevent="guardar">
      <div class="field">
        <label>Fecha de cosecha <span class="req">*</span></label>
        <input v-model="form.fecha_cosecha" type="date" :max="hoy" required />
      </div>

      <div class="field">
        <label>Superficie cosechada (ha) <span class="req">*</span></label>
        <input v-model.number="form.superficie_cosechada_ha" type="number" min="0.01" step="0.01" placeholder="Ej. 2.5" required />
      </div>

      <div class="field">
        <label>Producción total (ton) <span class="req">*</span></label>
        <input v-model.number="form.produccion_total_ton" type="number" min="0.01" step="0.01" placeholder="Ej. 7.5" required />
      </div>

      <div v-if="rendimientoCalc" class="calc-preview">
        Rendimiento real: <strong>{{ rendimientoCalc }} ton/ha</strong>
      </div>

      <div class="field">
        <label>Observaciones</label>
        <textarea v-model="form.observaciones" rows="3" placeholder="Notas de la cosecha..." maxlength="500" />
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
      <div v-if="exito" class="exito-msg">Cosecha real registrada correctamente.</div>

      <div class="actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Guardando...' : 'Guardar cosecha' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const hoy = new Date().toISOString().split('T')[0]

const form = ref({
  fecha_cosecha: hoy,
  superficie_cosechada_ha: null as number | null,
  produccion_total_ton: null as number | null,
  observaciones: '',
})

const rendimientoCalc = computed(() => {
  if (form.value.superficie_cosechada_ha && form.value.produccion_total_ton) {
    return (form.value.produccion_total_ton / form.value.superficie_cosechada_ha).toFixed(2)
  }
  return null
})

const loading = ref(false)
const error = ref('')
const exito = ref(false)

async function guardar() {
  error.value = ''
  exito.value = false
  loading.value = true
  try {
    await api.seguimiento.crearCosecha({
      producer_id: Number(route.query.producer_id),
      up_id: Number(route.query.up_id),
      ciclo_id: Number(route.query.ciclo_id),
      ...form.value,
    })
    exito.value = true
    form.value = { fecha_cosecha: hoy, superficie_cosechada_ha: null, produccion_total_ton: null, observaciones: '' }
  } catch (e: any) {
    error.value = e.message || 'Error al guardar'
  } finally {
    loading.value = false
  }
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
.field input, .field textarea {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
}
.field textarea { resize: vertical; }
.calc-preview { background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.9rem; color: #2b6cb0; margin-bottom: 1rem; }
.actions { margin-top: 1.5rem; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
.exito-msg { color: #276749; font-size: 0.85rem; background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
</style>
