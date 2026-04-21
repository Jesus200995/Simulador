<template>
  <div class="lp">
    <!-- ── Brand Side (tablet+) ── -->
    <aside class="lp-brand">
      <div class="lp-brand-inner">
        <div class="lp-brand-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        </div>
        <h1 class="lp-brand-title">SIMAC</h1>
        <p class="lp-brand-desc">Sistema de Información<br>de Maíz y Cultivos</p>
        <div class="lp-brand-sep"></div>
        <ul class="lp-brand-list">
          <li><span class="lp-dot"></span>Registro y seguimiento de productores</li>
          <li><span class="lp-dot"></span>Monitoreo de cultivos y ciclos</li>
          <li><span class="lp-dot"></span>Alertas e infraestructura en tiempo real</li>
        </ul>
      </div>
      <span class="lp-brand-foot">geodatos.com.mx</span>
      <div class="lp-orb lp-orb-1"></div>
      <div class="lp-orb lp-orb-2"></div>
    </aside>

    <!-- ── Form Side ── -->
    <main class="lp-form-side">
      <div class="lp-form-wrap">
        <!-- Mobile header -->
        <div class="lp-mob-brand">
          <div class="lp-mob-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div>
            <span class="lp-mob-name">SIMAC</span>
            <span class="lp-mob-sub">Maíz y Cultivos</span>
          </div>
        </div>

        <div class="lp-card">
          <h2 class="lp-card-title">Bienvenido de nuevo</h2>
          <p class="lp-card-sub">Ingresa tus credenciales para acceder</p>

          <div v-if="authStore.error" class="lp-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{{ authStore.error }}</span>
          </div>

          <form @submit.prevent="handleLogin" novalidate>
            <div class="lp-field">
              <label class="lp-label" for="email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Correo electrónico
              </label>
              <input id="email" v-model="form.email" type="email" class="lp-input" :class="{ err: errors.email }" placeholder="correo@ejemplo.com" autocomplete="email" @focus="authStore.clearError()" />
              <p v-if="errors.email" class="lp-err">{{ errors.email }}</p>
            </div>

            <div class="lp-field">
              <label class="lp-label" for="password">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Contraseña
              </label>
              <div class="lp-pwd-wrap">
                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="lp-input" :class="{ err: errors.password }" placeholder="Tu contraseña" autocomplete="current-password" @focus="authStore.clearError()" />
                <button type="button" class="lp-pwd-btn" @click="showPassword = !showPassword" tabindex="-1">
                  <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <p v-if="errors.password" class="lp-err">{{ errors.password }}</p>
            </div>

            <button type="submit" class="lp-submit" :disabled="authStore.loading">
              <span v-if="authStore.loading" class="lp-spin"></span>
              <template v-else>
                Iniciar Sesión
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </template>
            </button>
          </form>

          <p class="lp-footer">¿No tienes cuenta? <router-link to="/registro">Regístrate aquí</router-link></p>
        </div>
      </div>
    </main>
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
.lp { display: flex; min-height: 100vh; min-height: 100dvh; }

/* ═══ Brand Panel ═══ */
.lp-brand {
  display: none; width: 44%; max-width: 520px; position: relative; overflow: hidden;
  background: linear-gradient(160deg, #1E0812 0%, #3D1024 22%, #691C32 52%, #A63D5A 82%, #BC955C 100%);
  color: #fff; padding: 3rem 2.5rem; flex-direction: column; justify-content: center;
}
.lp-brand-inner { position: relative; z-index: 2; }
.lp-brand-logo {
  width: 52px; height: 52px; border-radius: 15px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.75rem; backdrop-filter: blur(10px);
}
.lp-brand-title { font-size: 2.75rem; font-weight: 800; letter-spacing: -.05em; margin: 0 0 .5rem; line-height: 1; }
.lp-brand-desc { font-size: 1rem; color: rgba(255,255,255,.6); line-height: 1.5; margin: 0; }
.lp-brand-sep { width: 44px; height: 2px; border-radius: 2px; background: rgba(255,255,255,.2); margin: 2rem 0; }
.lp-brand-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .85rem; }
.lp-brand-list li { display: flex; align-items: center; gap: .65rem; font-size: .85rem; color: rgba(255,255,255,.72); }
.lp-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(188,149,92,.85); flex-shrink: 0; }
.lp-brand-foot { position: absolute; bottom: 2rem; left: 2.5rem; font-size: .7rem; opacity: .3; letter-spacing: .04em; z-index: 2; }
.lp-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.lp-orb-1 { width: 320px; height: 320px; top: -90px; right: -100px; background: radial-gradient(circle, rgba(188,149,92,.15) 0%, transparent 60%); }
.lp-orb-2 { width: 240px; height: 240px; bottom: -70px; left: -80px; background: radial-gradient(circle, rgba(90,200,250,.06) 0%, transparent 55%); }

/* ═══ Form Side ═══ */
.lp-form-side {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; background: #f5f3f0;
}
.lp-form-wrap { width: 100%; max-width: 420px; animation: lpFadeIn .5s ease-out; }

/* Mobile brand */
.lp-mob-brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 1.5rem; }
.lp-mob-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(145deg, #4A0E20, #691C32); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 12px rgba(105,28,50,.3);
}
.lp-mob-name { display: block; font-size: 1.25rem; font-weight: 800; color: #691C32; letter-spacing: -.04em; line-height: 1; }
.lp-mob-sub { display: block; font-size: .62rem; font-weight: 600; color: #9a8a7e; letter-spacing: .04em; text-transform: uppercase; margin-top: .1rem; }

/* Card */
.lp-card {
  background: rgba(255,255,255,.96); border-radius: 22px;
  padding: 2.25rem 2rem;
  box-shadow: 0 8px 40px rgba(105,28,50,.05), 0 1px 3px rgba(0,0,0,.04), 0 0 0 .5px rgba(0,0,0,.04);
}
.lp-card-title { font-size: 1.45rem; font-weight: 750; color: #1a1a1a; letter-spacing: -.03em; margin: 0 0 .3rem; }
.lp-card-sub { font-size: .85rem; color: #8a8078; margin: 0 0 1.75rem; }

/* Alert */
.lp-alert {
  display: flex; align-items: center; gap: .6rem;
  padding: .7rem 1rem; border-radius: 11px; margin-bottom: 1.25rem;
  background: #FEF2F2; color: #DC2626; border: 1px solid rgba(220,38,38,.1);
  font-size: .82rem; font-weight: 550;
}
.lp-alert svg { flex-shrink: 0; }

/* Fields */
.lp-field { margin-bottom: 1.2rem; }
.lp-label {
  display: flex; align-items: center; gap: .4rem;
  font-size: .78rem; font-weight: 650; color: #5a5550;
  margin-bottom: .45rem; letter-spacing: .01em;
}
.lp-label svg { color: #9a8a7e; }
.lp-input {
  width: 100%; padding: .78rem 1rem; font-size: .9375rem;
  font-family: var(--font-family); background: #f8f6f4;
  border: 1.5px solid #e8e4e0; border-radius: 11px;
  color: #1a1a1a; transition: all .2s; letter-spacing: -.005em;
}
.lp-input::placeholder { color: #b8b0a8; }
.lp-input:hover { background: #f4f1ee; border-color: #d8d4d0; }
.lp-input:focus { outline: none; background: #fff; border-color: #691C32; box-shadow: 0 0 0 4px rgba(105,28,50,.08); }
.lp-input.err { border-color: #DC2626 !important; box-shadow: 0 0 0 4px rgba(220,38,38,.06) !important; }
.lp-err { font-size: .72rem; font-weight: 550; color: #DC2626; margin: .35rem 0 0; padding-left: .1rem; }

/* Password */
.lp-pwd-wrap { position: relative; }
.lp-pwd-wrap .lp-input { padding-right: 2.75rem; }
.lp-pwd-btn {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: #b0a8a0;
  padding: 4px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  transition: color .2s;
}
.lp-pwd-btn:hover { color: #6a6460; }

/* Submit */
.lp-submit {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .85rem 1.5rem; margin-top: .5rem; min-height: 50px;
  background: linear-gradient(160deg, #5A1428, #691C32, #8B2A45); color: #fff;
  border: none; border-radius: 13px; font-size: .9375rem; font-weight: 650;
  font-family: var(--font-family); cursor: pointer; transition: all .25s;
  box-shadow: 0 4px 16px rgba(105,28,50,.25), inset 0 1px 0 rgba(255,255,255,.1);
}
.lp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(105,28,50,.3), inset 0 1px 0 rgba(255,255,255,.1); }
.lp-submit:active:not(:disabled) { transform: translateY(0); }
.lp-submit:disabled { opacity: .6; cursor: not-allowed; }
.lp-submit svg { transition: transform .2s; }
.lp-submit:hover:not(:disabled) svg { transform: translateX(2px); }

.lp-spin { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: lpSpin .6s linear infinite; }

/* Footer */
.lp-footer { text-align: center; margin: 1.5rem 0 0; font-size: .85rem; color: #8a8078; }
.lp-footer a { font-weight: 650; color: #691C32; margin-left: .25rem; text-decoration: none; }
.lp-footer a:hover { color: #A63D5A; }

@keyframes lpFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lpSpin { to { transform: rotate(360deg); } }

/* ═══ Tablet (768px+) ═══ */
@media (min-width: 768px) {
  .lp-brand { display: flex; }
  .lp-mob-brand { display: none; }
  .lp-form-side { padding: 2rem; }
  .lp-card { padding: 2.5rem 2.25rem; border-radius: 24px; }
}

/* ═══ Large tablet / Desktop (1024px+) ═══ */
@media (min-width: 1024px) {
  .lp-brand { padding: 3.5rem 3rem; }
  .lp-brand-title { font-size: 3rem; }
  .lp-brand-desc { font-size: 1.1rem; }
  .lp-card { padding: 2.75rem 2.5rem; }
  .lp-card-title { font-size: 1.6rem; }
}

/* ═══ Mobile (<768px) ═══ */
@media (max-width: 767px) {
  .lp { flex-direction: column; background: linear-gradient(170deg, #2A0A15 0%, #691C32 40%, #A63D5A 100%); }
  .lp-form-side { background: transparent; align-items: flex-end; padding: 0; flex: 1; }
  .lp-form-wrap {
    max-width: 100%; background: #f5f3f0;
    border-radius: 28px 28px 0 0; padding: 1.75rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 0));
  }
  .lp-mob-brand { margin-bottom: 1.25rem; }
  .lp-mob-icon { background: linear-gradient(145deg, #fff, #f0ece8); color: #691C32; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  .lp-mob-name { color: #3D1024; }
  .lp-card { padding: 1.75rem 1.5rem; border-radius: 18px; }
  .lp-card-title { font-size: 1.3rem; }
}

/* ═══ Small mobile ═══ */
@media (max-width: 480px) {
  .lp-form-wrap { padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0)); border-radius: 24px 24px 0 0; }
  .lp-card { padding: 1.5rem 1.25rem; border-radius: 16px; }
  .lp-card-title { font-size: 1.2rem; }
  .lp-input { padding: .7rem .875rem; font-size: .9rem; }
  .lp-submit { padding: .75rem 1.25rem; min-height: 46px; font-size: .9rem; border-radius: 11px; }
}
</style>
