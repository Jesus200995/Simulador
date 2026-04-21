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
        <h1>Alta de bodega / ventanilla</h1>
        <p class="subtitle">Si no encuentras tu bodega en el listado, regístrala aquí. Quedará pendiente de validación.</p>
      </div>

      <form class="glass-card form-card" @submit.prevent="guardar">
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
.page-nav { margin-bottom: 1rem; }
.page-back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: none; border: none; color: var(--color-primary);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem; border-radius: var(--radius-sm);
  transition: background 0.2s; font-family: var(--font-family);
}
.page-back-btn:hover { background: var(--color-fill); }

.form-wrap { max-width: 680px; margin: 0 auto; }
.form-header { margin-bottom: 1.25rem; }
.form-header h1 { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem; color: var(--color-text); letter-spacing: -0.02em; }
.subtitle { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; }
.form-card { padding: 1.75rem; }
.section-title {
  font-size: 0.75rem; font-weight: 700; color: var(--color-text-tertiary);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin: 1.25rem 0 0.75rem; padding-bottom: 0.4rem;
  border-bottom: 0.5px solid var(--color-separator);
}
.section-title:first-child { margin-top: 0; }
.field { margin-bottom: 1rem; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.35rem; }
.req { color: var(--color-error); }
.field input, .field select {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 0.875rem; font-family: var(--font-family);
  background: var(--color-surface); color: var(--color-text); transition: border-color 0.2s;
}
.field input:focus, .field select:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}
.checkboxes { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.check-label {
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
  color: var(--color-text-secondary); cursor: pointer;
}
.check-label input[type="checkbox"] { accent-color: var(--color-primary); }
.check-label.disabled { color: var(--color-text-tertiary); cursor: not-allowed; }
.actions { margin-top: 1.5rem; }
.btn-primary {
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-sm); padding: 0.6rem 1.5rem;
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
  border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .field-row { grid-template-columns: 1fr; }
  .form-card { padding: 1.25rem; }
}
</style>
