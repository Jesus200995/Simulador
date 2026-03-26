<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <img src="/favicon.svg" alt="Logo" class="auth-logo" />
          <h1 class="auth-title">Bodegas de Maíz</h1>
          <p class="auth-subtitle">Crea tu cuenta para acceder al visor</p>
        </div>

        <div v-if="authStore.error" class="alert alert-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ authStore.error }}
        </div>

        <form @submit.prevent="handleRegistro" novalidate>
          <!-- Nombre Completo -->
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
            <p class="form-hint">Se guardará en mayúsculas sin acentos</p>
            <p v-if="errors.nombre_completo" class="form-error-text">{{ errors.nombre_completo }}</p>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Correo electrónico</label>
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
            <p class="form-hint">18 caracteres alfanuméricos</p>
            <p v-if="errors.curp" class="form-error-text">{{ errors.curp }}</p>
          </div>

          <!-- Teléfono -->
          <div class="form-group">
            <label class="form-label" for="telefono">Número de teléfono</label>
            <input
              id="telefono"
              v-model="form.telefono"
              type="tel"
              class="form-input"
              :class="{ error: errors.telefono }"
              placeholder="10 dígitos"
              maxlength="10"
              autocomplete="tel"
              @input="normalizeTelefono"
              @focus="authStore.clearError()"
            />
            <p v-if="errors.telefono" class="form-error-text">{{ errors.telefono }}</p>
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
            <div class="password-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.password }"
                placeholder="Mínimo 6 caracteres"
                autocomplete="new-password"
                @focus="authStore.clearError()"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="form-error-text">{{ errors.password }}</p>

            <!-- Indicador de fuerza -->
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.percent + '%' }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">
                {{ passwordStrength.label }}
              </span>
            </div>
          </div>

          <!-- Confirmar Contraseña -->
          <div class="form-group">
            <label class="form-label" for="password2">Confirmar contraseña</label>
            <input
              id="password2"
              v-model="form.password2"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ error: errors.password2 }"
              placeholder="Repite tu contraseña"
              autocomplete="new-password"
            />
            <p v-if="errors.password2" class="form-error-text">{{ errors.password2 }}</p>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="spinner"></span>
            <span v-else>Crear Cuenta</span>
          </button>
        </form>

        <div class="auth-footer">
          ¿Ya tienes cuenta?
          <router-link to="/login">Inicia sesión</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)

const form = reactive({
  nombre_completo: '',
  email: '',
  curp: '',
  telefono: '',
  password: '',
  password2: '',
})

const errors = reactive({
  nombre_completo: '',
  email: '',
  curp: '',
  telefono: '',
  password: '',
  password2: '',
})

const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return { percent: 0, label: '', class: '' }

  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  if (score <= 1) return { percent: 20, label: 'Muy débil', class: 'weak' }
  if (score === 2) return { percent: 40, label: 'Débil', class: 'weak' }
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
      password: form.password,
      telefono: form.telefono,
    })
    router.push('/')
  } catch {
    // Error manejado en el store
  }
}
</script>

<style scoped>
.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-text-secondary);
}

.password-wrapper .form-input {
  padding-right: 3rem;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-fill.weak { background-color: var(--color-error); }
.strength-fill.moderate { background-color: var(--color-warning); }
.strength-fill.strong { background-color: var(--color-secondary); }
.strength-fill.very-strong { background-color: var(--color-secondary-dark); }

.strength-text {
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.strength-text.weak { color: var(--color-error); }
.strength-text.moderate { color: var(--color-warning); }
.strength-text.strong { color: var(--color-secondary); }
.strength-text.very-strong { color: var(--color-secondary-dark); }
</style>
