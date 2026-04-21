<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="$router.back()">← Volver</button>
      <h1>Registrar Incidencia</h1>
      <p class="context-info">
        <strong>{{ route.query.nombres }}</strong> ·
        {{ route.query.up_name }} · Ciclo {{ route.query.ciclo_label }}
      </p>
    </div>

    <form class="form-card" @submit.prevent="guardar">
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
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
}
.field textarea { resize: vertical; }
.radio-group { display: flex; gap: 1rem; }
.radio-label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.badge-sev { padding: 4px 12px; border-radius: 99px; font-size: 0.85rem; font-weight: 600; }
.badge-sev.baja { background: #c6f6d5; color: #276749; }
.badge-sev.media { background: #fef3c7; color: #92400e; }
.badge-sev.alta { background: #fed7d7; color: #9b2c2c; }
.actions { margin-top: 1.5rem; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
.exito-msg { color: #276749; font-size: 0.85rem; background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
</style>
