<template>
  <div class="page-container">
    <div class="page-nav">
      <button class="page-back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
    </div>

    <div class="form-wrap">
      <div class="form-header">
        <h1>Cosecha Real</h1>
        <p class="context-info">
          <strong>{{ route.query.nombres }}</strong> ·
          {{ route.query.up_name }} · Ciclo {{ route.query.ciclo_label }}
        </p>
      </div>

      <form class="glass-card form-card" @submit.prevent="guardar">
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
.page-nav { margin-bottom: 1rem; }
.page-back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: none; border: none; color: var(--color-primary);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem; border-radius: var(--radius-sm);
  transition: background 0.2s; font-family: var(--font-family);
}
.page-back-btn:hover { background: var(--color-fill); }

.form-wrap { max-width: 600px; margin: 0 auto; }
.form-header { margin-bottom: 1.25rem; }
.form-header h1 { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem; color: var(--color-text); letter-spacing: -0.02em; }
.context-info { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; }
.context-info strong { color: var(--color-text); }
.form-card { padding: 1.75rem; }
.field { margin-bottom: 1.1rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.35rem; }
.req { color: var(--color-error); }
.field input, .field textarea {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 0.875rem; font-family: var(--font-family);
  background: var(--color-surface); color: var(--color-text); transition: border-color 0.2s;
}
.field input:focus, .field textarea:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}
.field textarea { resize: vertical; }
.calc-preview {
  background: rgba(0,122,255,0.06); border: 1px solid rgba(0,122,255,0.15);
  border-radius: var(--radius-sm); padding: 0.6rem 0.9rem;
  font-size: 0.82rem; color: #007AFF; margin-bottom: 1rem;
}
.actions { margin-top: 1.5rem; }
.btn-primary {
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-sm); padding: 0.6rem 1.25rem;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  font-family: var(--font-family); transition: filter 0.2s;
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg {
  color: var(--color-error); font-size: 0.82rem;
  background: var(--color-error-bg); border: 1px solid rgba(255,59,48,0.15);
  border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
}
.exito-msg {
  color: var(--color-success); font-size: 0.82rem;
  background: var(--color-success-bg); border: 1px solid rgba(52,199,89,0.2);
  border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
}

@media (max-width: 640px) { .form-card { padding: 1.25rem; } }
</style>
