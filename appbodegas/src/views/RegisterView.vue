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
        <p class="brand-desc">Únete al Sistema de Información de Maíz y Cultivos</p>
        <div class="brand-steps">
          <div class="brand-step">
            <div class="step-num">1</div>
            <div>
              <div class="step-title">Crea tu cuenta</div>
              <div class="step-desc">Registro con CURP y datos personales</div>
            </div>
          </div>
          <div class="brand-step">
            <div class="step-num">2</div>
            <div>
              <div class="step-title">Aprobación</div>
              <div class="step-desc">Un administrador activa tu acceso</div>
            </div>
          </div>
          <div class="brand-step">
            <div class="step-num">3</div>
            <div>
              <div class="step-title">Accede al sistema</div>
              <div class="step-desc">Gestiona productores, ciclos y alertas</div>
            </div>
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
          <h2>Crear cuenta</h2>
          <p>Completa el formulario para registrarte</p>
        </div>

        <div v-if="authStore.error" class="alert alert-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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

          <!-- CURP + Teléfono en row -->
          <div class="form-row-2">
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
              <p class="form-hint">18 caracteres</p>
              <p v-if="errors.curp" class="form-error-text">{{ errors.curp }}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="telefono">Teléfono</label>
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
          </div>

          <!-- Rol -->
          <div class="form-group">
            <label class="form-label" for="rol">Rol en el sistema</label>
            <select id="rol" v-model="form.rol" class="form-input" :class="{ error: errors.rol }" @focus="authStore.clearError()">
              <option value="">Selecciona un rol</option>
              <option value="tecnico">Técnico de campo</option>
              <option value="supervisor">Supervisor</option>
              <option value="responsable">Responsable de Bodega</option>
            </select>
            <p v-if="errors.rol" class="form-error-text">{{ errors.rol }}</p>
          </div>

          <!-- Estado + Municipio en row -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="estado">Estado</label>
              <select id="estado" v-model="form.state_id" class="form-input" :class="{ error: errors.state_id }" @change="onStateChange" @focus="authStore.clearError()">
                <option value="">Selecciona</option>
                <option v-for="s in states" :key="s.state_id" :value="s.state_id">{{ s.name }}</option>
              </select>
              <p v-if="errors.state_id" class="form-error-text">{{ errors.state_id }}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="municipio">Municipio</label>
              <select id="municipio" v-model="form.municipality_id" class="form-input" :class="{ error: errors.municipality_id }" :disabled="!form.state_id" @focus="authStore.clearError()">
                <option value="">Selecciona</option>
                <option v-for="m in municipalities" :key="m.municipality_id" :value="m.municipality_id">{{ m.name }}</option>
              </select>
              <p v-if="errors.municipality_id" class="form-error-text">{{ errors.municipality_id }}</p>
            </div>
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
              <button type="button" class="password-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.percent + '%' }"></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">{{ passwordStrength.label }}</span>
            </div>
            <p v-if="errors.password" class="form-error-text">{{ errors.password }}</p>
          </div>

          <!-- Confirmar -->
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

          <button type="submit" class="btn btn-primary btn-block submit-btn" :disabled="authStore.loading">
            <span v-if="authStore.loading" class="spinner"></span>
            <template v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Crear cuenta
            </template>
          </button>
        </form>

        <div class="auth-divider"><span>¿Ya tienes cuenta?</span></div>

        <router-link to="/login" class="btn-login">
          Iniciar sesión
        </router-link>
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
  if (score <= 1) return { percent: 20, label: 'Muy débil', class: 'weak' }
  if (score === 2) return { percent: 40, label: 'Débil', class: 'weak' }
  if (score === 3) return { percent: 60, label: 'Moderada', class: 'moderate' }
  if (score === 4) return { percent: 80, label: 'Fuerte', class: 'strong' }
  return { percent: 100, label: 'Muy fuerte', class: 'very-strong' }
})

function normalizeNombre() {
  form.nombre_completo = form.nombre_completo
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

function normalizeCurp() {
  form.curp = form.curp.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18)
}

function normalizeTelefono() {
  form.telefono = form.telefono.replace(/\D/g, '').slice(0, 10)
}

function validate(): boolean {
  let valid = true
  Object.keys(errors).forEach(k => { (errors as any)[k] = '' })

  if (!form.nombre_completo.trim()) {
    errors.nombre_completo = 'El nombre es obligatorio'; valid = false
  } else if (form.nombre_completo.trim().length < 5) {
    errors.nombre_completo = 'Ingresa tu nombre completo'; valid = false
  }
  if (!form.email.trim()) {
    errors.email = 'El correo es obligatorio'; valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Formato de correo inválido'; valid = false
  }
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/
  if (!form.curp.trim()) {
    errors.curp = 'El CURP es obligatorio'; valid = false
  } else if (!curpRegex.test(form.curp)) {
    errors.curp = 'Formato de CURP inválido'; valid = false
  }
  if (!form.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio'; valid = false
  } else if (!/^\d{10}$/.test(form.telefono)) {
    errors.telefono = '10 dígitos requeridos'; valid = false
  }
  if (!form.rol) { errors.rol = 'El rol es obligatorio'; valid = false }
  if (!form.state_id) { errors.state_id = 'Selecciona un estado'; valid = false }
  if (!form.municipality_id) { errors.municipality_id = 'Selecciona un municipio'; valid = false }
  if (!form.password) {
    errors.password = 'La contraseña es obligatoria'; valid = false
  } else if (form.password.length < 6) {
    errors.password = 'Mínimo 6 caracteres'; valid = false
  }
  if (!form.password2) {
    errors.password2 = 'Confirma tu contraseña'; valid = false
  } else if (form.password !== form.password2) {
    errors.password2 = 'Las contraseñas no coinciden'; valid = false
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
.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
}

/* ── Brand panel ── */
.auth-panel-brand {
  flex: 0 0 380px;
  background: linear-gradient(160deg, #2A0A15 0%, #691C32 45%, #8B2A45 75%, #A63D5A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: 3rem 2.5rem;
}

.brand-content {
  position: relative;
  z-index: 2;
  color: #fff;
  max-width: 280px;
}

.brand-logo {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.15);
}

.brand-title {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  margin-bottom: .5rem;
  color: #fff;
}

.brand-desc {
  font-size: .875rem;
  color: rgba(255,255,255,.65);
  line-height: 1.55;
  margin-bottom: 2.25rem;
}

.brand-steps { display: flex; flex-direction: column; gap: 1.125rem; }

.brand-step {
  display: flex;
  align-items: flex-start;
  gap: .875rem;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(188,149,92,.25);
  border: 1px solid rgba(188,149,92,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  color: #D4B07A;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-title { font-size: .875rem; font-weight: 650; color: #fff; margin-bottom: 2px; }
.step-desc { font-size: .8rem; color: rgba(255,255,255,.55); }

.brand-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 1; }
.brand-orb-1 {
  width: 280px; height: 280px;
  background: radial-gradient(ellipse, rgba(188,149,92,.18) 0%, transparent 60%);
  top: -70px; right: -70px;
}
.brand-orb-2 {
  width: 220px; height: 220px;
  background: radial-gradient(ellipse, rgba(90,200,250,.08) 0%, transparent 60%);
  bottom: -50px; left: -50px;
}

/* ── Form panel ── */
.auth-panel-form {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--color-bg);
  padding: 2rem 1.5rem;
}

.auth-form-inner {
  width: 100%;
  max-width: 460px;
  animation: fadeInUp .5s var(--ease-out);
}

.auth-mobile-logo {
  display: none;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.75rem;
}
.auth-logo-icon {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(145deg, #4A0E20, #691C32);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(105,28,50,.3);
}
.auth-mobile-logo span {
  font-size: 1.375rem; font-weight: 800; color: #691C32; letter-spacing: -0.04em;
}

.auth-heading { margin-bottom: 1.125rem; }
.auth-heading h2 {
  font-size: 1.5rem; font-weight: 700;
  color: var(--color-text); letter-spacing: -0.035em; margin-bottom: .25rem;
}
.auth-heading p { font-size: .875rem; color: var(--color-text-secondary); }

/* Two-column row for short fields */
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

/* Password */
.password-wrapper { position: relative; }
.password-wrapper .form-input { padding-right: 2.75rem; }
.password-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--color-text-tertiary); padding: 4px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; transition: color .2s;
}
.password-toggle:hover { color: var(--color-text-secondary); }

.password-strength {
  display: flex; align-items: center; gap: .5rem; margin-top: .5rem;
}
.strength-bar {
  flex: 1; height: 3px; background: var(--color-fill); border-radius: 999px; overflow: hidden;
}
.strength-fill {
  height: 100%; border-radius: 999px;
  transition: width .35s var(--ease-spring), background-color .3s ease;
}
.strength-fill.weak { background-color: var(--color-error); }
.strength-fill.moderate { background-color: var(--color-warning); }
.strength-fill.strong { background-color: var(--color-gold); }
.strength-fill.very-strong { background-color: var(--color-success); }
.strength-text { font-size: .65rem; font-weight: 600; white-space: nowrap; letter-spacing: .02em; }
.strength-text.weak { color: var(--color-error); }
.strength-text.moderate { color: var(--color-warning); }
.strength-text.strong { color: var(--color-gold); }
.strength-text.very-strong { color: var(--color-success); }

.submit-btn { margin-top: .25rem; height: 50px; font-size: 1rem; gap: .5rem; }

.auth-divider {
  display: flex; align-items: center; gap: .75rem;
  margin: 1.5rem 0 1rem;
  color: var(--color-text-tertiary); font-size: .8125rem;
}
.auth-divider::before, .auth-divider::after {
  content: ''; flex: 1; height: .5px; background: var(--color-separator-opaque);
}

.btn-login {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: .8125rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-separator-opaque);
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: .9375rem; font-weight: 600;
  text-decoration: none;
  transition: all .2s var(--ease-out);
  font-family: var(--font-family);
}
.btn-login:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  opacity: 1;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .auth-panel-brand { flex: 0 0 300px; }
}

@media (max-width: 768px) {
  .auth-panel-brand { display: none; }
  .auth-panel-form {
    background: linear-gradient(160deg, #2A0A15 0%, #691C32 45%, #8B2A45 75%, #A63D5A 100%);
    align-items: flex-end;
    padding: 0;
  }
  .auth-form-inner {
    max-width: 100%;
    background: var(--color-bg);
    border-radius: 28px 28px 0 0;
    padding: 1.75rem 1.25rem calc(2rem + env(safe-area-inset-bottom, 0));
    min-height: 85vh;
  }
  .auth-mobile-logo { display: flex; }
  .auth-heading h2 { font-size: 1.25rem; }
  .form-row-2 { grid-template-columns: 1fr; gap: 0; }
}
</style>
