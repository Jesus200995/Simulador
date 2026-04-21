<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-wrap">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/><path d="M3 8l9-5 9 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h1 class="auth-title">SIMAC — Crear cuenta</h1>
          <p class="auth-subtitle">Regístrate para acceder al sistema</p>
        </div>

        <div v-if="authStore.error" class="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ authStore.error }}
        </div>

        <form @submit.prevent="handleRegistro" novalidate>
          <!-- Nombre -->
          <div class="form-group">
            <label class="form-label" for="nombre">Nombre completo</label>
            <input
              id="nombre"
              v-model="form.nombre_completo"
              type="text"
              class="form-input uppercase"
              :class="{ error: errors.nombre_completo }"
              placeholder="NOMBRE APELLIDO PATERNO MATERNO"
              autocomplete="name"
              @input="normalizeNombre"
              @focus="authStore.clearError()"
            />
            <p class="form-hint">Se guardara en mayusculas sin acentos</p>
            <p v-if="errors.nombre_completo" class="form-error-text">{{ errors.nombre_completo }}</p>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Correo electronico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="correo@ejemplo.com"
              autocomplete="email"
              @focus="authStore.clearError()"
            />
            <p v-if="errors.email" class="form-error-text">{{ errors.email }}</p>
          </div>

          <!-- CURP -->
          <div class="form-group">
            <label class="form-label" for="curp">CURP</label>
            <input
              id="curp"
              v-model="form.curp"
              type="text"
              class="form-input uppercase"
              :class="{ error: errors.curp }"
              placeholder="XXXX000000XXXXXXX0"
              maxlength="18"
              autocomplete="off"
              @input="normalizeCurp"
              @focus="authStore.clearError()"
            />
            <p class="form-hint">18 caracteres alfanumericos</p>
            <p v-if="errors.curp" class="form-error-text">{{ errors.curp }}</p>
          </div>

          <!-- Telefono -->
          <div class="form-group">
            <label class="form-label" for="telefono">Numero de telefono</label>
            <input
              id="telefono"
              v-model="form.telefono"
              type="tel"
              class="form-input"
              :class="{ error: errors.telefono }"
              placeholder="10 digitos"
              maxlength="10"
              autocomplete="tel"
              @input="normalizeTelefono"
              @focus="authStore.clearError()"
            />
            <p v-if="errors.telefono" class="form-error-text">{{ errors.telefono }}</p>
          </div>

          <!-- Rol -->
          <div class="form-group">
            <label class="form-label" for="rol">Rol</label>
            <select id="rol" v-model="form.rol" class="form-input" :class="{ error: errors.rol }" @focus="authStore.clearError()">
              <option value="">Selecciona un rol</option>
              <option value="tecnico">Técnico</option>
              <option value="supervisor">Supervisor</option>
              <option value="responsable">Responsable de Bodega</option>
            </select>
            <p v-if="errors.rol" class="form-error-text">{{ errors.rol }}</p>
          </div>

          <!-- Estado -->
          <div class="form-group">
            <label class="form-label" for="estado">Estado</label>
            <select id="estado" v-model="form.state_id" class="form-input" :class="{ error: errors.state_id }" @change="onStateChange" @focus="authStore.clearError()">
              <option value="">Selecciona un estado</option>
              <option v-for="s in states" :key="s.state_id" :value="s.state_id">{{ s.name }}</option>
            </select>
            <p v-if="errors.state_id" class="form-error-text">{{ errors.state_id }}</p>
          </div>

          <!-- Municipio -->
          <div class="form-group">
            <label class="form-label" for="municipio">Municipio</label>
            <select id="municipio" v-model="form.municipality_id" class="form-input" :class="{ error: errors.municipality_id }" :disabled="!form.state_id" @focus="authStore.clearError()">
              <option value="">Selecciona un municipio</option>
              <option v-for="m in municipalities" :key="m.municipality_id" :value="m.municipality_id">{{ m.name }}</option>
            </select>
            <p v-if="errors.municipality_id" class="form-error-text">{{ errors.municipality_id }}</p>
          </div>

          <!-- Contrasena -->
          <div class="form-group">
            <label class="form-label" for="password">Contrasena</label>
            <div class="password-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.password }"
                placeholder="Minimo 6 caracteres"
                autocomplete="new-password"
                @focus="authStore.clearError()"
              />
              <button type="button" class="password-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="errors.password" class="form-error-text">{{ errors.password }}</p>

            <!-- Indicador de fuerza -->
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.percent + '%' }"></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">{{ passwordStrength.label }}</span>
            </div>
          </div>

          <!-- Confirmar -->
          <div class="form-group">
            <label class="form-label" for="password2">Confirmar contrasena</label>
            <input
              id="password2"
              v-model="form.password2"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ error: errors.password2 }"
              placeholder="Repite tu contrasena"
              autocomplete="new-password"
            />
            <p v-if="errors.password2" class="form-error-text">{{ errors.password2 }}</p>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="authStore.loading">
            <span v-if="authStore.loading" class="spinner"></span>
            <span v-else>Crear Cuenta</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>¿Ya tienes cuenta?</span>
          <router-link to="/login">Inicia sesion</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { GeoState, GeoMunicipality } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)

const form = reactive({
  nombre_completo: '',
  email: '',
  curp: '',
  telefono: '',
  rol: '',
  state_id: '',
  municipality_id: '',
  password: '',
  password2: '',
})

const errors = reactive({
  nombre_completo: '',
  email: '',
  curp: '',
  telefono: '',
  rol: '',
  state_id: '',
  municipality_id: '',
  password: '',
  password2: '',
})

const states = ref<GeoState[]>([])
const municipalities = ref<GeoMunicipality[]>([])

onMounted(async () => {
  try {
    const res = await api.auth.states()
    states.value = res.states
  } catch (err) {
    console.error('Error fetching states', err)
  }
})

async function onStateChange() {
  form.municipality_id = ''
  municipalities.value = []
  if (!form.state_id) return
  try {
    const res = await api.auth.municipalities(form.state_id)
    municipalities.value = res.municipalities
  } catch (err) {
    console.error('Error fetching municipalities', err)
  }
}



const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return { percent: 0, label: '', class: '' }

  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  if (score <= 1) return { percent: 20, label: 'Muy debil', class: 'weak' }
  if (score === 2) return { percent: 40, label: 'Debil', class: 'weak' }
  if (score === 3) return { percent: 60, label: 'Moderada', class: 'moderate' }
  if (score === 4) return { percent: 80, label: 'Fuerte', class: 'strong' }
  return { percent: 100, label: 'Muy fuerte', class: 'very-strong' }
})

function normalizeNombre() {
  form.nombre_completo = form.nombre_completo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function normalizeCurp() {
  form.curp = form.curp
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 18)
}

function normalizeTelefono() {
  form.telefono = form.telefono.replace(/\D/g, '').slice(0, 10)
}

function validate(): boolean {
  let valid = true
  Object.keys(errors).forEach((k) => {
    ;(errors as any)[k] = ''
  })

  // Nombre
  if (!form.nombre_completo.trim()) {
    errors.nombre_completo = 'El nombre es obligatorio'
    valid = false
  } else if (form.nombre_completo.trim().length < 5) {
    errors.nombre_completo = 'Ingresa tu nombre completo'
    valid = false
  }

  // Email
  if (!form.email.trim()) {
    errors.email = 'El correo es obligatorio'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Formato de correo inválido'
    valid = false
  }

  // CURP
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/
  if (!form.curp.trim()) {
    errors.curp = 'El CURP es obligatorio'
    valid = false
  } else if (!curpRegex.test(form.curp)) {
    errors.curp = 'El formato del CURP no es válido'
    valid = false
  }

  // Teléfono
  if (!form.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio'
    valid = false
  } else if (!/^\d{10}$/.test(form.telefono)) {
    errors.telefono = 'El teléfono debe tener 10 dígitos'
    valid = false
  }

  // Rol
  if (!form.rol) {
    errors.rol = 'El rol es obligatorio'
    valid = false
  }

  // Estado
  if (!form.state_id) {
    errors.state_id = 'El estado es obligatorio'
    valid = false
  }

  // Municipio
  if (!form.municipality_id) {
    errors.municipality_id = 'El municipio es obligatorio'
    valid = false
  }

  // Contraseña
  if (!form.password) {
    errors.password = 'La contraseña es obligatoria'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'Mínimo 6 caracteres'
    valid = false
  }

  // Confirmar contraseña
  if (!form.password2) {
    errors.password2 = 'Confirma tu contraseña'
    valid = false
  } else if (form.password !== form.password2) {
    errors.password2 = 'Las contraseñas no coinciden'
    valid = false
  }

  return valid
}

async function handleRegistro() {
  if (!validate()) return

  try {
    await authStore.registro({
      email: form.email.trim().toLowerCase(),
      curp: form.curp,
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono,
      rol: form.rol,
      state_id: form.state_id,
      municipality_id: form.municipality_id,
      password: form.password,
    })
    router.push('/')
  } catch {
    // Error manejado en el store
  }
}
</script>

<style scoped>
.auth-logo-wrap {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: linear-gradient(145deg, #691C32, #A63D5A);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 28px rgba(105, 28, 50, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
}

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  padding: 4px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: var(--color-text-secondary);
}

.password-wrapper .form-input {
  padding-right: 2.75rem;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 3px;
  background: var(--color-fill);
  border-radius: 999px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s var(--ease-spring), background-color 0.3s ease;
}

.strength-fill.weak { background-color: var(--color-error); }
.strength-fill.moderate { background-color: var(--color-warning); }
.strength-fill.strong { background-color: var(--color-gold); }
.strength-fill.very-strong { background-color: var(--color-success); }

.strength-text {
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.strength-text.weak { color: var(--color-error); }
.strength-text.moderate { color: var(--color-warning); }
.strength-text.strong { color: var(--color-gold); }
.strength-text.very-strong { color: var(--color-success); }
</style>
