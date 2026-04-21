<template>
  <div class="auth-page">
    <!-- Left branding panel (desktop only) -->
    <div class="auth-panel-brand" aria-hidden="true">
      <div class="brand-content">
        <div class="brand-logo">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/>
          </svg>
        </div>
        <h1 class="brand-title">SIMAC</h1>
        <p class="brand-desc">Sistema de Información de Maíz y Cultivos</p>
        <div class="brand-features">
          <div class="brand-feature">
            <span class="feat-dot"></span>
            <span>Registro y seguimiento de productores</span>
          </div>
          <div class="brand-feature">
            <span class="feat-dot"></span>
            <span>Monitoreo de cultivos y ciclos</span>
          </div>
          <div class="brand-feature">
            <span class="feat-dot"></span>
            <span>Alertas e infraestructura en tiempo real</span>
          </div>
        </div>
      </div>
      <div class="brand-orb brand-orb-1"></div>
      <div class="brand-orb brand-orb-2"></div>
    </div>

    <!-- Right form panel -->
    <div class="auth-panel-form">
      <div class="auth-form-inner">
        <!-- Mobile logo -->
        <div class="auth-mobile-logo">
          <div class="auth-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/>
            </svg>
          </div>
          <span>SIMAC</span>
        </div>

        <div class="auth-heading">
          <h2>Iniciar sesión</h2>
          <p>Ingresa tus credenciales para acceder</p>
        </div>

        <div v-if="authStore.error" class="alert alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ authStore.error }}
        </div>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="form-group">
            <label class="form-label" for="email">Correo electrónico</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input with-icon"
                :class="{ error: errors.email }"
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                @focus="authStore.clearError()"
              />
            </div>
            <p v-if="errors.email" class="form-error-text">{{ errors.email }}</p>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="password">Contraseña</label>
            </div>
            <div class="input-wrap password-wrapper">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input with-icon"
                :class="{ error: errors.password }"
                placeholder="Tu contraseña"
                autocomplete="current-password"
                @focus="authStore.clearError()"
              />
              <button type="button" class="password-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="errors.password" class="form-error-text">{{ errors.password }}</p>
          </div>

          <button type="submit" class="btn btn-primary btn-block submit-btn" :disabled="authStore.loading">
            <span v-if="authStore.loading" class="spinner"></span>
            <template v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Iniciar sesión
            </template>
          </button>
        </form>

        <div class="auth-divider"><span>¿No tienes cuenta?</span></div>

        <router-link to="/registro" class="btn-register">
          Crear cuenta nueva
        </router-link>
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

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })

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
    await authStore.login({ email: form.email.trim(), password: form.password })
    router.push('/')
  } catch {
    // Error manejado en el store
  }
}
</script>

<style scoped>
.auth-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  overflow: hidden;
}

/* ── Brand panel ── */
.auth-panel-brand {
  flex: 0 0 420px;
  background: linear-gradient(160deg, #2A0A15 0%, #691C32 45%, #8B2A45 75%, #A63D5A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 3rem 2.5rem;
}

.brand-content {
  position: relative;
  z-index: 2;
  color: #fff;
  max-width: 300px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.15);
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  margin-bottom: .5rem;
  color: #fff;
}

.brand-desc {
  font-size: .9375rem;
  color: rgba(255,255,255,.65);
  line-height: 1.55;
  margin-bottom: 2.5rem;
}

.brand-features { display: flex; flex-direction: column; gap: .875rem; }

.brand-feature {
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: .875rem;
  color: rgba(255,255,255,.8);
}

.feat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(188,149,92,.9);
  flex-shrink: 0;
}

/* Decorative orbs */
.brand-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}
.brand-orb-1 {
  width: 300px; height: 300px;
  background: radial-gradient(ellipse, rgba(188,149,92,.18) 0%, transparent 60%);
  top: -80px; right: -80px;
}
.brand-orb-2 {
  width: 250px; height: 250px;
  background: radial-gradient(ellipse, rgba(90,200,250,.08) 0%, transparent 60%);
  bottom: -60px; left: -60px;
}

/* ── Form panel ── */
.auth-panel-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 1.5rem;
  overflow-y: auto;
}

.auth-form-inner {
  width: 100%;
  max-width: 400px;
  animation: fadeInUp .5s var(--ease-out);
}

/* Mobile logo (hidden on desktop) */
.auth-mobile-logo {
  display: none;
  align-items: center;
  gap: .75rem;
  margin-bottom: 2rem;
}

.auth-logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(145deg, #4A0E20, #691C32);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(105,28,50,.3);
}

.auth-mobile-logo span {
  font-size: 1.375rem;
  font-weight: 800;
  color: #691C32;
  letter-spacing: -0.04em;
}

.auth-heading {
  margin-bottom: 1.75rem;
}

.auth-heading h2 {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.035em;
  margin-bottom: .375rem;
}

.auth-heading p {
  font-size: .9375rem;
  color: var(--color-text-secondary);
}

/* Input with icon */
.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.form-input.with-icon {
  padding-left: 2.625rem;
}

/* Password wrapper */
.password-wrapper .form-input {
  padding-right: 2.75rem;
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
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .2s;
}
.password-toggle:hover { color: var(--color-text-secondary); }

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .375rem;
}

.label-row .form-label { margin-bottom: 0; }

.submit-btn {
  margin-top: .25rem;
  height: 50px;
  font-size: 1rem;
  border-radius: var(--radius-md);
  gap: .5rem;
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin: 1.5rem 0 1rem;
  color: var(--color-text-tertiary);
  font-size: .8125rem;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: .5px;
  background: var(--color-separator-opaque);
}

/* Register link button */
.btn-register {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: .8125rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-separator-opaque);
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: .9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all .2s var(--ease-out);
  font-family: var(--font-family);
}
.btn-register:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  opacity: 1;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .auth-page { overflow: auto; }
  .auth-panel-brand { display: none; }
  .auth-panel-form {
    background: linear-gradient(160deg, #2A0A15 0%, #691C32 45%, #8B2A45 75%, #A63D5A 100%);
    align-items: flex-end;
    padding: 0;
    overflow: visible;
  }
  .auth-form-inner {
    max-width: 100%;
    background: var(--color-bg);
    border-radius: 28px 28px 0 0;
    padding: 2rem 1.5rem calc(2rem + env(safe-area-inset-bottom, 0));
    min-height: 72vh;
  }
  .auth-mobile-logo { display: flex; }
  .auth-heading h2 { font-size: 1.375rem; }
}
</style>
