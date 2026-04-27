<template>
  <div class="rp">
    <!-- ── Brand Side (tablet+) ── -->
    <aside class="rp-brand">
      <div class="rp-brand-inner">
        <div class="rp-brand-logo">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        </div>
        <h1 class="rp-brand-title">SIMAC</h1>
        <p class="rp-brand-desc">Únete al Sistema de Información de Maíz y Cultivos</p>
        <div class="rp-brand-sep"></div>
        <div class="rp-steps">
          <div class="rp-step"><span class="rp-step-n">1</span><div><strong>Crea tu cuenta</strong><br><small>Registro con CURP y datos personales</small></div></div>
          <div class="rp-step"><span class="rp-step-n">2</span><div><strong>Aprobación</strong><br><small>Un administrador activa tu acceso</small></div></div>
          <div class="rp-step"><span class="rp-step-n">3</span><div><strong>Accede al sistema</strong><br><small>Gestiona productores, ciclos y alertas</small></div></div>
        </div>
      </div>
      <div class="rp-orb rp-orb-1"></div>
      <div class="rp-orb rp-orb-2"></div>
    </aside>

    <!-- ── Form Side ── -->
    <main class="rp-form-side">
      <div class="rp-form-wrap">
        <!-- Mobile header -->
        <div class="rp-mob-brand">
          <div class="rp-mob-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div>
            <span class="rp-mob-name">SIMAC</span>
            <span class="rp-mob-sub">Maíz y Cultivos</span>
          </div>
        </div>

        <div class="rp-card">
          <h2 class="rp-card-title">Crear cuenta</h2>
          <p class="rp-card-sub">Completa el formulario para registrarte</p>

          <div v-if="authStore.error" class="rp-alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ authStore.error }}</span>
          </div>

          <form @submit.prevent="handleRegistro" novalidate>
            <div class="rp-field">
              <label class="rp-label" for="nombre">Nombre completo</label>
              <input id="nombre" v-model="form.nombre_completo" type="text" class="rp-input rp-upper" :class="{ err: errors.nombre_completo }" placeholder="NOMBRE APELLIDO PATERNO MATERNO" autocomplete="name" @input="normalizeNombre" @focus="authStore.clearError()" />
              <p class="rp-hint">Se guardará en mayúsculas sin acentos</p>
              <p v-if="errors.nombre_completo" class="rp-err">{{ errors.nombre_completo }}</p>
            </div>

            <div class="rp-field">
              <label class="rp-label" for="email">Correo electrónico</label>
              <input id="email" v-model="form.email" type="email" class="rp-input" :class="{ err: errors.email }" placeholder="correo@ejemplo.com" autocomplete="email" @focus="authStore.clearError()" />
              <p v-if="errors.email" class="rp-err">{{ errors.email }}</p>
            </div>

            <div class="rp-row">
              <div class="rp-field">
                <label class="rp-label" for="curp">CURP</label>
                <input id="curp" v-model="form.curp" type="text" class="rp-input rp-upper" :class="{ err: errors.curp }" placeholder="XXXX000000XXXXXXX0" maxlength="18" autocomplete="off" @input="normalizeCurp" @focus="authStore.clearError()" />
                <p class="rp-hint">18 caracteres</p>
                <p v-if="errors.curp" class="rp-err">{{ errors.curp }}</p>
              </div>
              <div class="rp-field">
                <label class="rp-label" for="telefono">Teléfono</label>
                <input id="telefono" v-model="form.telefono" type="tel" class="rp-input" :class="{ err: errors.telefono }" placeholder="10 dígitos" maxlength="10" autocomplete="tel" @input="normalizeTelefono" @focus="authStore.clearError()" />
                <p v-if="errors.telefono" class="rp-err">{{ errors.telefono }}</p>
              </div>
            </div>

            <div class="rp-field">
              <label class="rp-label" for="rol">Rol en el sistema</label>
              <select id="rol" v-model="form.rol" class="rp-input" :class="{ err: errors.rol }" @focus="authStore.clearError()">
                <option value="">Selecciona un rol</option>
                <option value="productor">Productor / Sembrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="bodeguero">Bodeguero</option>
              </select>
              <p v-if="errors.rol" class="rp-err">{{ errors.rol }}</p>
            </div>

            <div class="rp-row">
              <div class="rp-field">
                <label class="rp-label" for="estado">Estado</label>
                <select id="estado" v-model="form.state_id" class="rp-input" :class="{ err: errors.state_id }" @change="onStateChange" @focus="authStore.clearError()">
                  <option value="">Selecciona</option>
                  <option v-for="s in states" :key="s.state_id" :value="s.state_id">{{ s.name }}</option>
                </select>
                <p v-if="errors.state_id" class="rp-err">{{ errors.state_id }}</p>
              </div>
              <div class="rp-field">
                <label class="rp-label" for="municipio">Municipio</label>
                <select id="municipio" v-model="form.municipality_id" class="rp-input" :class="{ err: errors.municipality_id }" :disabled="!form.state_id" @focus="authStore.clearError()">
                  <option value="">Selecciona</option>
                  <option v-for="m in municipalities" :key="m.municipality_id" :value="m.municipality_id">{{ m.name }}</option>
                </select>
                <p v-if="errors.municipality_id" class="rp-err">{{ errors.municipality_id }}</p>
              </div>
            </div>

            <div class="rp-field">
              <label class="rp-label" for="password">Contraseña</label>
              <div class="rp-pwd-wrap">
                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="rp-input" :class="{ err: errors.password }" placeholder="Mínimo 6 caracteres" autocomplete="new-password" @focus="authStore.clearError()" />
                <button type="button" class="rp-pwd-btn" @click="showPassword = !showPassword" tabindex="-1">
                  <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <div v-if="form.password" class="rp-strength">
                <div class="rp-str-bar"><div class="rp-str-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.percent + '%' }"></div></div>
                <span class="rp-str-text" :class="passwordStrength.class">{{ passwordStrength.label }}</span>
              </div>
              <p v-if="errors.password" class="rp-err">{{ errors.password }}</p>
            </div>

            <div class="rp-field">
              <label class="rp-label" for="password2">Confirmar contraseña</label>
              <input id="password2" v-model="form.password2" :type="showPassword ? 'text' : 'password'" class="rp-input" :class="{ err: errors.password2 }" placeholder="Repite tu contraseña" autocomplete="new-password" />
              <p v-if="errors.password2" class="rp-err">{{ errors.password2 }}</p>
            </div>

            <button type="submit" class="rp-submit" :disabled="authStore.loading">
              <span v-if="authStore.loading" class="rp-spin"></span>
              <template v-else>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Crear cuenta
              </template>
            </button>
          </form>

          <p class="rp-footer">¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link></p>
        </div>
      </div>
    </main>
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
.rp { display: flex; min-height: 100vh; min-height: 100dvh; }

/* ═══ Brand Panel ═══ */
.rp-brand {
  display: none; width: 380px; position: relative; overflow: hidden;
  background: linear-gradient(160deg, #041510 0%, #0A2D1B 22%, #0F5132 52%, #2D8659 82%, #BC955C 100%);
  color: #fff; padding: 3rem 2.5rem; flex-direction: column; justify-content: center;
  position: sticky; top: 0; height: 100vh; height: 100dvh;
}
.rp-brand-inner { position: relative; z-index: 2; max-width: 280px; }
.rp-brand-logo {
  width: 50px; height: 50px; border-radius: 14px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.5rem; backdrop-filter: blur(10px);
}
.rp-brand-title { font-size: 2.25rem; font-weight: 800; letter-spacing: -.05em; margin: 0 0 .5rem; line-height: 1; }
.rp-brand-desc { font-size: .9rem; color: rgba(255,255,255,.6); line-height: 1.5; margin: 0; }
.rp-brand-sep { width: 40px; height: 2px; border-radius: 2px; background: rgba(255,255,255,.18); margin: 1.75rem 0; }
.rp-steps { display: flex; flex-direction: column; gap: 1.1rem; }
.rp-step { display: flex; align-items: flex-start; gap: .75rem; font-size: .85rem; color: rgba(255,255,255,.8); }
.rp-step strong { font-weight: 650; color: #fff; }
.rp-step small { font-size: .78rem; color: rgba(255,255,255,.5); }
.rp-step-n {
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
  background: rgba(188,149,92,.22); border: 1px solid rgba(188,149,92,.45);
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700; color: #D4B07A; margin-top: 1px;
}
.rp-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.rp-orb-1 { width: 280px; height: 280px; top: -70px; right: -70px; background: radial-gradient(circle, rgba(188,149,92,.15) 0%, transparent 60%); }
.rp-orb-2 { width: 220px; height: 220px; bottom: -50px; left: -50px; background: radial-gradient(circle, rgba(90,200,250,.06) 0%, transparent 55%); }

/* ═══ Form Side ═══ */
.rp-form-side {
  flex: 1; display: flex; align-items: flex-start; justify-content: center;
  padding: 2rem 1.5rem; background: #f5f3f0; overflow-y: auto;
}
.rp-form-wrap { width: 100%; max-width: 480px; animation: rpFade .5s ease-out; }

/* Mobile brand */
.rp-mob-brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 1.25rem; }
.rp-mob-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(145deg, #0A3D24, #0F5132); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 12px rgba(15, 81, 50,.3);
}
.rp-mob-name { display: block; font-size: 1.25rem; font-weight: 800; color: #0F5132; letter-spacing: -.04em; line-height: 1; }
.rp-mob-sub { display: block; font-size: .62rem; font-weight: 600; color: #9a8a7e; letter-spacing: .04em; text-transform: uppercase; margin-top: .1rem; }

/* Card */
.rp-card {
  background: rgba(255,255,255,.96); border-radius: 22px; padding: 2rem 1.75rem;
  box-shadow: 0 8px 40px rgba(15, 81, 50,.05), 0 1px 3px rgba(0,0,0,.04), 0 0 0 .5px rgba(0,0,0,.04);
}
.rp-card-title { font-size: 1.35rem; font-weight: 750; color: #1a1a1a; letter-spacing: -.03em; margin: 0 0 .25rem; }
.rp-card-sub { font-size: .82rem; color: #8a8078; margin: 0 0 1.5rem; }

/* Alert */
.rp-alert {
  display: flex; align-items: center; gap: .6rem; padding: .7rem 1rem;
  border-radius: 11px; margin-bottom: 1.1rem;
  background: #FEF2F2; color: #DC2626; border: 1px solid rgba(220,38,38,.1);
  font-size: .82rem; font-weight: 550;
}
.rp-alert svg { flex-shrink: 0; }

/* Fields */
.rp-field { margin-bottom: 1rem; }
.rp-label { display: block; font-size: .76rem; font-weight: 650; color: #5a5550; margin-bottom: .4rem; letter-spacing: .01em; }
.rp-input {
  width: 100%; padding: .72rem .9rem; font-size: .875rem;
  font-family: var(--font-family); background: #f8f6f4;
  border: 1.5px solid #e8e4e0; border-radius: 10px;
  color: #1a1a1a; transition: all .2s; letter-spacing: -.005em;
}
.rp-input::placeholder { color: #b8b0a8; }
.rp-input:hover { background: #f4f1ee; border-color: #d8d4d0; }
.rp-input:focus { outline: none; background: #fff; border-color: #0F5132; box-shadow: 0 0 0 3px rgba(15, 81, 50,.08); }
.rp-input.err { border-color: #DC2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,.06) !important; }
.rp-input:disabled { opacity: .5; cursor: not-allowed; }
.rp-upper { text-transform: uppercase; }
.rp-hint { font-size: .66rem; color: #a09890; margin: .25rem 0 0; }
.rp-err { font-size: .7rem; font-weight: 550; color: #DC2626; margin: .3rem 0 0; }

/* 2-col row */
.rp-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

/* Password */
.rp-pwd-wrap { position: relative; }
.rp-pwd-wrap .rp-input { padding-right: 2.5rem; }
.rp-pwd-btn {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #b0a8a0;
  padding: 3px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: color .2s;
}
.rp-pwd-btn:hover { color: #6a6460; }

/* Strength */
.rp-strength { display: flex; align-items: center; gap: .5rem; margin-top: .4rem; }
.rp-str-bar { flex: 1; height: 3px; background: #e8e4e0; border-radius: 99px; overflow: hidden; }
.rp-str-fill { height: 100%; border-radius: 99px; transition: width .35s ease, background-color .3s ease; }
.rp-str-fill.weak { background: #DC2626; }
.rp-str-fill.moderate { background: #F59E0B; }
.rp-str-fill.strong { background: #D4A853; }
.rp-str-fill.very-strong { background: #22C55E; }
.rp-str-text { font-size: .62rem; font-weight: 600; white-space: nowrap; letter-spacing: .02em; }
.rp-str-text.weak { color: #DC2626; }
.rp-str-text.moderate { color: #D97706; }
.rp-str-text.strong { color: #B8942E; }
.rp-str-text.very-strong { color: #16A34A; }

/* Submit */
.rp-submit {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .82rem 1.5rem; margin-top: .5rem; min-height: 48px;
  background: linear-gradient(160deg, #0A3D24, #0F5132, #187A4F); color: #fff;
  border: none; border-radius: 12px; font-size: .9375rem; font-weight: 650;
  font-family: var(--font-family); cursor: pointer; transition: all .25s;
  box-shadow: 0 4px 16px rgba(15, 81, 50,.25), inset 0 1px 0 rgba(255,255,255,.1);
}
.rp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15, 81, 50,.3); }
.rp-submit:active:not(:disabled) { transform: translateY(0); }
.rp-submit:disabled { opacity: .6; cursor: not-allowed; }
.rp-spin { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: rpSpin .6s linear infinite; }

/* Footer */
.rp-footer { text-align: center; margin: 1.25rem 0 0; font-size: .82rem; color: #8a8078; }
.rp-footer a { font-weight: 650; color: #0F5132; margin-left: .25rem; text-decoration: none; }
.rp-footer a:hover { color: #2D8659; }

@keyframes rpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rpSpin { to { transform: rotate(360deg); } }

/* ═══ Tablet (768px+) ═══ */
@media (min-width: 768px) {
  .rp-brand { display: flex; }
  .rp-mob-brand { display: none; }
  .rp-form-side { padding: 2rem; }
  .rp-card { padding: 2.25rem 2rem; border-radius: 24px; }
}

/* ═══ Desktop (1024px+) ═══ */
@media (min-width: 1024px) {
  .rp-brand { width: 420px; padding: 3rem; }
  .rp-brand-title { font-size: 2.5rem; }
  .rp-form-wrap { max-width: 500px; }
  .rp-card { padding: 2.5rem 2.25rem; }
  .rp-card-title { font-size: 1.5rem; }
}

/* ═══ Mobile (<768px) ═══ */
@media (max-width: 767px) {
  .rp { flex-direction: column; background: linear-gradient(170deg, #041510 0%, #0F5132 30%, #2D8659 100%); }
  .rp-form-side { background: transparent; align-items: flex-start; padding: 0; flex: 1; }
  .rp-form-wrap {
    max-width: 100%; background: #f5f3f0;
    border-radius: 28px 28px 0 0; padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0));
  }
  .rp-card { padding: 1.5rem 1.25rem; border-radius: 16px; }
  .rp-card-title { font-size: 1.2rem; }
  .rp-row { grid-template-columns: 1fr; gap: 0; }
  .rp-mob-icon { background: linear-gradient(145deg, #fff, #f0ece8); color: #0F5132; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  .rp-mob-name { color: #0A3D24; }
}

/* ═══ Small mobile ═══ */
@media (max-width: 480px) {
  .rp-form-wrap { padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0)); border-radius: 24px 24px 0 0; }
  .rp-card { padding: 1.25rem 1rem; border-radius: 14px; }
  .rp-input { padding: .65rem .8rem; font-size: .85rem; }
  .rp-submit { padding: .7rem 1rem; min-height: 44px; font-size: .875rem; border-radius: 10px; }
}
</style>
