<template>
  <div class="app-container">
    <header class="header">
      <button class="btn-icon" @click="$router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
      </button>
      <h1 class="header-title">Registrar Productor</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <!-- Progreso -->
      <div class="progress-bar">
        <div class="progress-step active">
          <span class="step-number">1</span>
          <span class="step-label">Datos Personales</span>
        </div>
        <div class="progress-divider"></div>
        <div class="progress-step">
          <span class="step-number">2</span>
          <span class="step-label">Unidad de Producción</span>
        </div>
        <div class="progress-divider"></div>
        <div class="progress-step">
          <span class="step-number">3</span>
          <span class="step-label">Ciclo Inicial</span>
        </div>
      </div>

      <!-- Formulario Paso 1 -->
      <section class="form-card">
        <h2 class="form-title">Paso 1: Datos Personales</h2>
        <p class="form-subtitle">Captura la información del productor</p>

        <form @submit.prevent="handleRegistro" class="form">
          <!-- Mensajes de error/éxito -->
          <div v-if="error" class="alert alert-error">{{ error }}</div>
          <div v-if="success" class="alert alert-success">{{ success }}</div>

          <!-- Datos Personales -->
          <div class="form-section">
            <h3 class="form-section-title">Datos Personales</h3>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="nombres">Nombre(s) <span class="required">*</span></label>
                <input
                  id="nombres"
                  v-model="form.nombres"
                  type="text"
                  class="form-input"
                  placeholder="Ej: Juan"
                  :class="{ 'input-error': errors.nombres }"
                />
                <span v-if="errors.nombres" class="form-error">{{ errors.nombres }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="apellido_paterno">Apellido Paterno <span class="required">*</span></label>
                <input
                  id="apellido_paterno"
                  v-model="form.apellido_paterno"
                  type="text"
                  class="form-input"
                  placeholder="Ej: García"
                  :class="{ 'input-error': errors.apellido_paterno }"
                />
                <span v-if="errors.apellido_paterno" class="form-error">{{ errors.apellido_paterno }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="apellido_materno">Apellido Materno <span class="required">*</span></label>
              <input
                id="apellido_materno"
                v-model="form.apellido_materno"
                type="text"
                class="form-input"
                placeholder="Ej: López"
                :class="{ 'input-error': errors.apellido_materno }"
              />
              <span v-if="errors.apellido_materno" class="form-error">{{ errors.apellido_materno }}</span>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="curp">CURP <span class="required">*</span></label>
                <input
                  id="curp"
                  v-model="form.curp"
                  type="text"
                  class="form-input uppercase"
                  placeholder="Ej: GAGJ940315HDFLRR05"
                  maxlength="18"
                  @input="form.curp = form.curp.toUpperCase()"
                  :class="{ 'input-error': errors.curp }"
                />
                <span v-if="errors.curp" class="form-error">{{ errors.curp }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="sexo">Sexo <span class="required">*</span></label>
                <select
                  id="sexo"
                  v-model="form.sexo"
                  class="form-input"
                  :class="{ 'input-error': errors.sexo }"
                >
                  <option value="">Selecciona sexo</option>
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="otro">Otro</option>
                  <option value="no_especifica">No especifica</option>
                </select>
                <span v-if="errors.sexo" class="form-error">{{ errors.sexo }}</span>
              </div>
            </div>
          </div>

          <!-- Contacto -->
          <div class="form-section">
            <h3 class="form-section-title">Datos de Contacto</h3>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="telefono">Teléfono <span class="required">*</span></label>
                <input
                  id="telefono"
                  v-model="form.telefono"
                  type="tel"
                  class="form-input"
                  placeholder="Ej: 5551234567"
                  maxlength="10"
                  @input="form.telefono = form.telefono.replace(/\D/g, '')"
                  :class="{ 'input-error': errors.telefono }"
                />
                <span v-if="errors.telefono" class="form-error">{{ errors.telefono }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="correo_electronico">Correo Electrónico</label>
                <input
                  id="correo_electronico"
                  v-model="form.correo_electronico"
                  type="email"
                  class="form-input"
                  placeholder="Ej: productor@correo.com"
                  :class="{ 'input-error': errors.correo_electronico }"
                />
                <span v-if="errors.correo_electronico" class="form-error">{{ errors.correo_electronico }}</span>
              </div>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="form-section">
            <h3 class="form-section-title">Ubicación</h3>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label" for="state_id">Estado <span class="required">*</span></label>
                <select
                  id="state_id"
                  v-model="form.state_id"
                  class="form-input"
                  :class="{ 'input-error': errors.state_id }"
                  @change="onStateChange"
                >
                  <option value="">Selecciona estado</option>
                  <option v-for="state in states" :key="state.state_id" :value="state.state_id">
                    {{ state.name }}
                  </option>
                </select>
                <span v-if="errors.state_id" class="form-error">{{ errors.state_id }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="municipality_id">Municipio <span class="required">*</span></label>
                <select
                  id="municipality_id"
                  v-model="form.municipality_id"
                  class="form-input"
                  :class="{ 'input-error': errors.municipality_id }"
                >
                  <option value="">Selecciona municipio</option>
                  <option v-for="mun in municipalities" :key="mun.municipality_id" :value="mun.municipality_id">
                    {{ mun.name }}
                  </option>
                </select>
                <span v-if="errors.municipality_id" class="form-error">{{ errors.municipality_id }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="localidad">Localidad <span class="required">*</span></label>
              <input
                id="localidad"
                v-model="form.localidad"
                type="text"
                class="form-input"
                placeholder="Ej: La Esperanza, Comunidad El Molino"
                :class="{ 'input-error': errors.localidad }"
              />
              <span v-if="errors.localidad" class="form-error">{{ errors.localidad }}</span>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="form-section">
            <h3 class="form-section-title">Observaciones</h3>

            <div class="form-group">
              <label class="form-label" for="observaciones">Observaciones (opcional)</label>
              <textarea
                id="observaciones"
                v-model="form.observaciones"
                class="form-input"
                rows="3"
                placeholder="Notas adicionales sobre el productor..."
              />
            </div>
          </div>

          <!-- Consentimiento -->
          <div class="form-section">
            <div class="form-group checkbox">
              <input
                id="consentimiento"
                v-model="form.consentimiento_recabado"
                type="checkbox"
                class="form-checkbox"
              />
              <label class="form-label checkbox-label" for="consentimiento">
                Acepto el aviso de privacidad y consentimiento de datos <span class="required">*</span>
              </label>
              <span v-if="errors.consentimiento_recabado" class="form-error">{{
                errors.consentimiento_recabado
              }}</span>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="$router.back()">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading">Registrando...</span>
              <span v-else>Registrar y Continuar</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import type { GeoState, GeoMunicipality } from '@/types'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref('')

const states = ref<GeoState[]>([])
const municipalities = ref<GeoMunicipality[]>([])

const form = reactive({
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  curp: '',
  sexo: '',
  telefono: '',
  correo_electronico: '',
  state_id: '',
  municipality_id: '',
  localidad: '',
  observaciones: '',
  consentimiento_recabado: false,
})

const errors = reactive<Record<string, string>>({})

const municipios_filtrados = computed(() => {
  if (!form.state_id) return municipalities.value
  return municipalities.value.filter((m) => m.state_id === form.state_id)
})

async function fetchCatalogos() {
  try {
    const catalogos = await api.productor.catalogos()
    states.value = catalogos.states
    municipalities.value = catalogos.municipalities
  } catch (err: any) {
    console.error('Error cargando catálogos:', err)
    error.value = 'Error al cargar los catálogos de estados y municipios'
  }
}

function onStateChange() {
  form.municipality_id = '' // Reset municipio
}

async function handleRegistro() {
  // Limpiar errores previos
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
  error.value = ''
  success.value = ''

  // Validaciones básicas
  if (!form.nombres.trim()) errors.nombres = 'El nombre es obligatorio'
  if (!form.apellido_paterno.trim()) errors.apellido_paterno = 'El apellido paterno es obligatorio'
  if (!form.apellido_materno.trim()) errors.apellido_materno = 'El apellido materno es obligatorio'
  if (!form.curp || form.curp.length !== 18) errors.curp = 'CURP debe tener 18 caracteres'
  if (!form.sexo) errors.sexo = 'Sexo es obligatorio'
  if (!form.telefono || form.telefono.length !== 10) errors.telefono = 'Teléfono debe tener 10 dígitos'
  if (!form.state_id) errors.state_id = 'Estado es obligatorio'
  if (!form.municipality_id) errors.municipality_id = 'Municipio es obligatorio'
  if (!form.localidad.trim()) errors.localidad = 'Localidad es obligatoria'
  if (!form.consentimiento_recabado) errors.consentimiento_recabado = 'Debe aceptar el consentimiento'

  if (Object.keys(errors).length > 0) return

  loading.value = true
  try {
    const payload = {
      nombres: form.nombres.trim(),
      apellido_paterno: form.apellido_paterno.trim(),
      apellido_materno: form.apellido_materno.trim(),
      curp: form.curp.toUpperCase(),
      sexo: form.sexo,
      telefono: form.telefono,
      correo_electronico: form.correo_electronico.trim() || null,
      state_id: form.state_id,
      municipality_id: form.municipality_id,
      localidad: form.localidad.trim(),
      observaciones: form.observaciones.trim() || null,
      consentimiento_recabado: form.consentimiento_recabado,
    }

    const response = await api.productor.registrar(payload)
    success.value = 'Productor registrado exitosamente'
    
    // Guardar producer_id en sessionStorage para continuar con Paso 2
    sessionStorage.setItem('producer_id', response.producer.producer_id)
    sessionStorage.setItem('producer_curp', response.producer.curp)

    // Redirigir a Paso 2 (Dibujo de UP) después de 1.5s
    setTimeout(() => {
      router.push('/productor/paso2')
    }, 1500)
  } catch (err: any) {
    console.error('Error registrando productor:', err)
    error.value = err.response?.data?.error || 'Error al registrar productor'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCatalogos()
})
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-step.active .step-number {
  background: #691c32;
  color: white;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e2e2;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.step-label {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  max-width: 60px;
}

.progress-divider {
  flex: 1;
  height: 2px;
  background: #e2e2e2;
  margin: 0 0.5rem;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
}

.form-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
  padding-bottom: 0;
}

.form-section-title {
  font-size: 0.95rem;
  font-weight: 650;
  color: #691c32;
  margin: 0 0 1rem;
  letter-spacing: 0.02em;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
}

.required {
  color: #dc3545;
}

.form-input,
textarea {
  padding: 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
textarea:focus {
  outline: none;
  border-color: #691c32;
  box-shadow: 0 0 0 2px rgba(105, 28, 50, 0.1);
}

.form-input.input-error,
textarea.input-error {
  border-color: #dc3545;
}

.form-error {
  font-size: 0.75rem;
  color: #dc3545;
  font-weight: 500;
}

.uppercase {
  text-transform: uppercase;
}

.checkbox {
  flex-direction: row;
  gap: 0.75rem;
  align-items: flex-start;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-top: 0.15rem;
}

.checkbox-label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.btn-primary {
  background: #691c32;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a1728;
}

.btn-primary:disabled {
  background: #999;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e2e2;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.alert-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

@media (max-width: 768px) {
  .progress-bar {
    gap: 0.5rem;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .step-label {
    font-size: 0.65rem;
    max-width: 50px;
  }

  .progress-divider {
    flex: 0.5;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-grid-2 {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-title {
    font-size: 1.25rem;
  }
}
</style>
