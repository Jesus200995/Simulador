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
        <h1>Registrar Incidencia</h1>
        <p class="context-info">
          <strong>{{ route.query.nombres }}</strong> ·
          {{ route.query.up_name }} · Ciclo {{ route.query.ciclo_label }}
        </p>
      </div>

      <form class="glass-card form-card" @submit.prevent="guardar">
      <div class="field">
        <label>Tipo de incidencia <span class="req">*</span></label>
        <select v-model="form.tipo_incidencia" required>
          <option value="">-- Seleccionar --</option>
          <option value="sequia">Sequía</option>
          <option value="lluvia_excesiva">Lluvia excesiva</option>
          <option value="plaga">Plaga</option>
          <option value="enfermedad">Enfermedad</option>
          <option value="viento">Viento</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div class="field">
        <label>Severidad <span class="req">*</span></label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="form.severidad" value="baja" required />
            <span class="badge-sev baja">Baja</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="form.severidad" value="media" />
            <span class="badge-sev media">Media</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="form.severidad" value="alta" />
            <span class="badge-sev alta">Alta</span>
          </label>
        </div>
      </div>

      <div class="field">
        <label>Fecha <span class="req">*</span></label>
        <input v-model="form.fecha" type="date" :max="hoy" required />
      </div>

      <div class="field">
        <label>Observaciones</label>
        <textarea v-model="form.observaciones" rows="3" placeholder="Descripción breve..." maxlength="500" />
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
      <div v-if="exito" class="exito-msg">Incidencia registrada correctamente.</div>

      <div class="actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Guardando...' : 'Guardar incidencia' }}
        </button>
      </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const hoy = new Date().toISOString().split('T')[0]

const form = ref({ tipo_incidencia: '', severidad: '', fecha: hoy, observaciones: '' })
const loading = ref(false)
const error = ref('')
const exito = ref(false)

async function guardar() {
  error.value = ''
  exito.value = false
  loading.value = true
  try {
    await api.seguimiento.crearIncidencia({
      producer_id: Number(route.query.producer_id),
      up_id: Number(route.query.up_id),
      ciclo_id: Number(route.query.ciclo_id),
      ...form.value,
    })
    exito.value = true
    form.value = { tipo_incidencia: '', severidad: '', fecha: hoy, observaciones: '' }
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
.field input, .field select, .field textarea {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 0.875rem; font-family: var(--font-family);
  background: var(--color-surface); color: var(--color-text); transition: border-color 0.2s;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}
.field textarea { resize: vertical; }
.radio-group { display: flex; gap: 1rem; }
.radio-label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.radio-label input[type="radio"] { accent-color: var(--color-primary); }
.badge-sev { padding: 4px 12px; border-radius: 99px; font-size: 0.82rem; font-weight: 600; }
.badge-sev.baja { background: var(--color-success-bg); color: var(--color-success); }
.badge-sev.media { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-sev.alta { background: var(--color-error-bg); color: var(--color-error); }
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
