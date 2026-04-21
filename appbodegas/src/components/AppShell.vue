<template>
  <div class="shell">
    <!-- ═══ Top Bar ═══ -->
    <header class="topbar">
      <router-link to="/" class="topbar-brand">
        <div class="brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        </div>
        <span class="brand-name">SIMAC</span>
      </router-link>

      <nav class="topbar-nav">
        <router-link to="/" exact class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          <span>Mapa</span>
        </router-link>
        <router-link v-if="showField" to="/productor" class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>Productores</span>
        </router-link>
        <router-link v-if="showField" to="/seguimiento" class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>
          <span>Seguimiento</span>
        </router-link>
        <router-link v-if="showField" to="/alertas" class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Alertas</span>
        </router-link>
        <router-link to="/infraestructura" class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span>Infraestructura</span>
        </router-link>
        <router-link v-if="authStore.isResponsable || authStore.isAdmin" to="/mis-bodegas" class="nav-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          <span>Bodegas</span>
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/admin" class="nav-pill nav-admin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Admin</span>
        </router-link>
      </nav>

      <div class="topbar-end">
        <router-link to="/notificaciones" class="topbar-icon-btn" title="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span v-if="notifCount > 0" class="notif-dot">{{ notifCount > 9 ? '9+' : notifCount }}</span>
        </router-link>

        <button class="avatar-btn" @click="menuOpen = !menuOpen" ref="avatarRef">
          <span class="avatar-initials">{{ initials }}</span>
          <svg class="avatar-chev" :class="{ flip: menuOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <Transition name="menu-pop">
          <div v-if="menuOpen" class="user-menu" ref="menuRef">
            <div class="um-header">
              <div class="um-avatar">{{ initials }}</div>
              <div class="um-name">{{ authStore.usuario?.nombre_completo }}</div>
              <span class="um-role" :class="authStore.rol">{{ rolLabel }}</span>
            </div>
            <div class="um-body">
              <div class="um-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{{ authStore.usuario?.email }}</span></div>
              <div class="um-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/></svg><span>{{ authStore.usuario?.curp }}</span></div>
            </div>
            <div class="um-footer">
              <button class="um-logout" @click="handleLogout">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </header>

    <!-- ═══ Page Content ═══ -->
    <main class="shell-main" :class="{ 'full-bleed': fullBleed }">
      <slot />
    </main>

    <!-- ═══ Bottom Tab Bar (mobile) ═══ -->
    <nav class="bottom-tabs">
      <router-link to="/" exact class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
        </div>
        <span>Mapa</span>
      </router-link>
      <router-link v-if="showField" to="/productor" class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <span>Productores</span>
      </router-link>
      <router-link v-if="showField" to="/seguimiento" class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>
        </div>
        <span>Seguimiento</span>
      </router-link>
      <router-link to="/infraestructura" class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        </div>
        <span>Infra</span>
      </router-link>
      <router-link v-if="showField" to="/alertas" class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <span>Alertas</span>
      </router-link>
      <router-link v-if="!showField && (authStore.isResponsable || authStore.isAdmin)" to="/mis-bodegas" class="tab-item">
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        </div>
        <span>Bodegas</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{ fullBleed?: boolean }>()

const authStore = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)
const avatarRef = ref<HTMLElement>()
const menuRef = ref<HTMLElement>()
const notifCount = ref(0)

const showField = computed(() => !authStore.isResponsable)

const initials = computed(() => {
  const n = authStore.usuario?.nombre_completo || ''
  return n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
})

const rolLabel = computed(() => {
  const m: Record<string, string> = { tecnico: 'Técnico', supervisor: 'Supervisor', responsable: 'Responsable', admin: 'Admin' }
  return m[authStore.rol] || authStore.rol
})

function handleLogout() {
  authStore.logout()
  menuOpen.value = false
  router.push('/login')
}

function onClickOutside(e: MouseEvent) {
  if (menuOpen.value && menuRef.value && avatarRef.value &&
      !menuRef.value.contains(e.target as Node) && !avatarRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
/* ── Top Bar ── */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 900;
  height: 60px; display: flex; align-items: center; gap: 1rem;
  padding: 0 1.25rem;
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-bottom: .5px solid rgba(0,0,0,.06);
}
.topbar-brand { display: flex; align-items: center; gap: .625rem; text-decoration: none; flex-shrink: 0; }
.brand-icon {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(145deg, #691C32, #A63D5A);
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 2px 8px rgba(105, 28, 50, 0.25);
}
.brand-name { font-size: 1.1rem; font-weight: 800; color: var(--color-text); letter-spacing: -.04em; }

/* ── Desktop Nav ── */
.topbar-nav {
  display: flex; gap: 2px; margin-left: .75rem;
  background: var(--color-fill); border-radius: 10px; padding: 3px;
}
.nav-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px;
  font-size: .8125rem; font-weight: 550; color: var(--color-text-secondary);
  text-decoration: none; transition: all .2s var(--ease-out);
  white-space: nowrap;
}
.nav-pill:hover { background: rgba(255,255,255,.6); color: var(--color-text); }
.nav-pill.active, .nav-pill.active-exact {
  background: var(--color-surface); color: var(--color-primary); font-weight: 650;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.nav-pill svg { flex-shrink: 0; }
.nav-admin.active { color: var(--color-indigo); }

/* ── End section ── */
.topbar-end { margin-left: auto; display: flex; align-items: center; gap: .625rem; }
.topbar-icon-btn {
  position: relative; width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary); transition: all .2s;
}
.topbar-icon-btn:hover { background: var(--color-fill); color: var(--color-text); }
.notif-dot {
  position: absolute; top: 2px; right: 2px;
  min-width: 17px; height: 17px; border-radius: 99px;
  background: var(--color-red); color: #fff;
  font-size: .6rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2px solid rgba(255,255,255,.9);
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.3);
}

/* ── Avatar ── */
.avatar-btn {
  display: flex; align-items: center; gap: 5px;
  height: 36px; padding: 0 12px; border-radius: 99px; border: none; cursor: pointer;
  background: linear-gradient(145deg, #691C32, #A63D5A); color: #fff;
  font-family: var(--font-family); transition: all .2s;
  box-shadow: 0 2px 8px rgba(105, 28, 50, 0.25);
}
.avatar-btn:hover { filter: brightness(1.1); transform: scale(1.04); }
.avatar-btn:active { transform: scale(.96); }
.avatar-initials { font-size: .75rem; font-weight: 700; letter-spacing: .02em; }
.avatar-chev { opacity: .7; transition: transform .25s; }
.avatar-chev.flip { transform: rotate(180deg); }

/* ── User Menu ── */
.user-menu {
  position: fixed; top: 66px; right: 16px; width: 280px; z-index: 950;
  background: rgba(255,255,255,.97);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0,0,0,.12), 0 0 0 .5px rgba(0,0,0,.06);
  overflow: hidden;
}
.um-header {
  padding: 1.5rem 1.25rem 1.125rem; text-align: center;
  background: var(--color-fill-secondary); border-bottom: .5px solid var(--color-separator);
}
.um-avatar {
  width: 48px; height: 48px; margin: 0 auto .625rem; border-radius: 50%;
  background: linear-gradient(145deg, #691C32, #A63D5A); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.0625rem; font-weight: 700;
  box-shadow: 0 4px 12px rgba(105, 28, 50, 0.25);
}
.um-name { font-size: .9375rem; font-weight: 700; color: var(--color-text); letter-spacing: -.015em; }
.um-role {
  display: inline-block; margin-top: 6px; padding: 3px 12px; border-radius: 99px;
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.um-role.tecnico { background: rgba(0,122,255,.1); color: #007AFF; }
.um-role.supervisor { background: rgba(88,86,214,.1); color: #5856D6; }
.um-role.responsable { background: rgba(52,199,89,.1); color: #1D8348; }
.um-role.admin { background: rgba(105,28,50,.1); color: #691C32; }
.um-body { padding: .875rem 1.25rem; }
.um-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem 0; font-size: .8125rem; color: var(--color-text-secondary);
  border-bottom: .5px solid var(--color-separator);
}
.um-row:last-child { border-bottom: none; }
.um-row svg { color: var(--color-text-tertiary); flex-shrink: 0; }
.um-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.um-footer { padding: .75rem 1.25rem; border-top: .5px solid var(--color-separator); }
.um-logout {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .625rem; background: var(--color-error-bg); color: var(--color-error);
  border: none; border-radius: 12px; font-size: .8125rem; font-weight: 600;
  font-family: var(--font-family); cursor: pointer; transition: all .2s;
}
.um-logout:hover { background: rgba(255,59,48,.14); }

/* Menu transition */
.menu-pop-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.menu-pop-leave-active { transition: all .15s ease-in; }
.menu-pop-enter-from { opacity: 0; transform: scale(.92) translateY(-8px); }
.menu-pop-leave-to { opacity: 0; transform: scale(.95) translateY(-4px); }

/* ── Main Area ── */
.shell-main { margin-top: 60px; min-height: calc(100vh - 60px); padding-bottom: 0; }
.shell-main.full-bleed { padding: 0; }

/* ── Bottom Tab Bar ── */
.bottom-tabs { display: none; }

@media (max-width: 768px) {
  .topbar-nav { display: none; }
  .topbar { height: 52px; padding: 0 .875rem; }
  .shell-main { margin-top: 52px; min-height: calc(100vh - 52px - 72px); padding-bottom: 72px; }
  .bottom-tabs {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 900;
    height: 72px; display: flex; align-items: stretch;
    background: rgba(255,255,255,.85);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    border-top: .5px solid rgba(0,0,0,.06);
    padding: 4px 8px calc(4px + env(safe-area-inset-bottom, 0));
  }
  .tab-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; text-decoration: none; color: var(--color-text-tertiary);
    font-size: .625rem; font-weight: 600; transition: color .2s;
    border-radius: 12px;
    position: relative;
  }
  .tab-icon-wrap {
    width: 32px; height: 28px; display: flex; align-items: center; justify-content: center;
    border-radius: 14px; transition: all .25s var(--ease-out);
  }
  .tab-item.active .tab-icon-wrap,
  .tab-item.active-exact .tab-icon-wrap {
    background: var(--color-primary-subtle);
    transform: scale(1.05);
  }
  .tab-item.active, .tab-item.active-exact { color: var(--color-primary); }
  .tab-item svg { width: 22px; height: 22px; }
}
</style>
