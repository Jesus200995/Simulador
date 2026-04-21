<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="$router.back()">← Volver</button>
      <h1>Alta de bodega / ventanilla</h1>
      <p class="subtitle">Si no encuentras tu bodega en el listado, regístrala aquí. Quedará pendiente de validación.</p>
    </div>

    <form class="form-card" @submit.prevent="guardar">
      <h2 class="section-title">Identificación</h2>
      <div class="field">
        <label>Nombre <span class="req">*</span></label>
        <input v-model="form.nombre" required placeholder="Nombre de la bodega o ventanilla" />
      </div>
      <div class="field">
        <label>Clave</label>
        <input v-model="form.clave" placeholder="Clave única (opcional)" />
      </div>

      <h2 class="section-title">Ubicación</h2>
      <div class="field-row">
        <div class="field">
          <label>Estado <span class="req">*</span></label>
          <input v-model="form.estado" required placeholder="Ej. Sinaloa" />
        </div>
        <div class="field">
          <label>Municipio <span class="req">*</span></label>
          <input v-model="form.municipio" required placeholder="Ej. Culiacán" />
        </div>
      </div>
      <div class="field">
        <label>Localidad <span class="req">*</span></label>
        <input v-model="form.localidad" required placeholder="Nombre de la localidad" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Latitud <span class="req">*</span></label>
          <input v-model.number="form.latitud" type="number" step="any" min="-90" max="90" required placeholder="-90 a 90" />
        </div>
        <div class="field">
          <label>Longitud <span class="req">*</span></label>
          <input v-model.number="form.longitud" type="number" step="any" min="-180" max="180" required placeholder="-180 a 180" />
        </div>
      </div>

      <h2 class="section-title">Operación</h2>
      <div class="field">
        <label>Capacidad (ton)</label>
        <input v-model.number="form.capacidad_ton" type="number" min="0" step="1" placeholder="Capacidad en toneladas" />
      </div>

      <div class="checkboxes">
        <label class="check-label">
          <input type="checkbox" v-model="form.es_ventanilla" @change="onVentanilla" />
          Es ventanilla (activa acopio, incentivos y coberturas)
        </label>
        <label class="check-label" :class="{ disabled: form.es_ventanilla }">
          <input type="checkbox" v-model="form.realiza_acopio" :disabled="form.es_ventanilla" />
          Realiza acopio
        </label>
        <label class="check-label" :class="{ disabled: form.es_ventanilla }">
          <input type="checkbox" v-model="form.opera_incentivos" :disabled="form.es_ventanilla" />
          Opera incentivos
        </label>
        <label class="check-label" :class="{ disabled: form.es_ventanilla }">
          <input type="checkbox" v-model="form.opera_coberturas" :disabled="form.es_ventanilla" />
          Opera coberturas
        </label>
        <label class="check-label">
          <input type="checkbox" v-model="form.registra_inventario" />
          Registra inventario
        </label>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
      <div v-if="exito" class="exito-msg">
        Bodega registrada correctamente. Quedará pendiente de validación por un administrador.
      </div>

      <div class="actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Guardando...' : 'Registrar bodega' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'

const form = ref({
  nombre: '',
  clave: '',
  estado: '',
  municipio: '',
  localidad: '',
  latitud: null as number | null,
  longitud: null as number | null,
  capacidad_ton: null as number | null,
  es_ventanilla: false,
  realiza_acopio: false,
  opera_incentivos: false,
  opera_coberturas: false,
  registra_inventario: true,
})

const loading = ref(false)
const error = ref('')
const exito = ref(false)

function onVentanilla() {
  if (form.value.es_ventanilla) {
    form.value.realiza_acopio = true
    form.value.opera_incentivos = true
    form.value.opera_coberturas = true
  }
}

async function guardar() {
  error.value = ''
  exito.value = false
  loading.value = true
  try {
    await api.infraestructura.crear(form.value)
    exito.value = true
    form.value = {
      nombre: '', clave: '', estado: '', municipio: '', localidad: '',
      latitud: null, longitud: null, capacidad_ton: null,
      es_ventanilla: false, realiza_acopio: false, opera_incentivos: false,
      opera_coberturas: false, registra_inventario: true,
    }
  } catch (e: any) {
    error.value = e.message || 'Error al registrar'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page { max-width: 680px; margin: 0 auto; padding: 1.5rem; }
.form-header { margin-bottom: 1.5rem; }
.back-btn { background: none; border: none; color: #2f855a; cursor: pointer; font-size: 0.9rem; margin-bottom: 0.5rem; padding: 0; }
.form-header h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 0.25rem; color: #1a202c; }
.subtitle { font-size: 0.85rem; color: #718096; margin: 0; }
.form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; }
.section-title { font-size: 0.9rem; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.25rem 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid #e2e8f0; }
.section-title:first-child { margin-top: 0; }
.field { margin-bottom: 1rem; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field label { display: block; font-size: 0.875rem; font-weight: 600; color: #4a5568; margin-bottom: 0.35rem; }
.req { color: #e53e3e; }
.field input, .field select {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
}
.checkboxes { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.check-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #4a5568; cursor: pointer; }
.check-label.disabled { color: #a0aec0; cursor: not-allowed; }
.actions { margin-top: 1.5rem; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
.exito-msg { color: #276749; font-size: 0.85rem; background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 0.75rem; margin-bottom: 0.75rem; }
</style>
