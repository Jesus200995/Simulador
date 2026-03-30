<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo-wrap">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/><path d="M3 8l9-5 9 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h1 class="auth-title">SIMAC</h1>
          <p class="auth-subtitle">Sistema de Información de Maíz y Cultivos</p>
        </div>

        <div v-if="authStore.error" class="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ authStore.error }}
        </div>

        <form @submit.prevent="handleLogin" novalidate>
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

          <div class="form-group">
            <label class="form-label" for="password">Contrasena</label>
            <div class="password-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.password }"
                placeholder="Tu contrasena"
                autocomplete="current-password"
                @focus="authStore.clearError()"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="form-error-text">{{ errors.password }}</p>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="spinner"></span>
            <span v-else>Iniciar Sesion</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>¿No tienes cuenta?</span>
          <router-link to="/registro">Registrate aqui</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

function validate(): boolean {
  let valid = true
  errors.email = ''
  errors.password = ''

  if (!form.email.trim()) {
    errors.email = 'El correo es obligatorio'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Formato de correo inválido'
    valid = false
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria'
    valid = false
  }

  return valid
}

async function handleLogin() {
  if (!validate()) return

  try {
    await authStore.login({
      email: form.email.trim(),
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, #691C32, #A63D5A);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 6px 20px rgba(105, 28, 50, 0.3);
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
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
  border-radius: 6px;
}

.password-toggle:hover {
  color: var(--color-text-secondary);
}

.password-wrapper .form-input {
  padding-right: 2.75rem;
}
</style>
