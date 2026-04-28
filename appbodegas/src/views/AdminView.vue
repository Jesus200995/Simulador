<template>
  <div class="adm">
    <!-- Header -->
    <header class="adm-header">
      <div class="adm-header-inner">
        <h1 class="adm-title">Administración</h1>
        <p class="adm-sub">Gestión de usuarios y bodegas</p>
      </div>
    </header>

    <!-- Segmented control -->
    <div class="adm-seg-wrap">
      <div class="adm-seg">
        <button :class="{ active: tab === 'usuarios' }" @click="tab = 'usuarios'">
          Usuarios
          <span v-if="usuarios.length" class="adm-seg-count">{{ usuarios.length }}</span>
        </button>
        <button :class="{ active: tab === 'pendientes' }" @click="tab = 'pendientes'">
          Pendientes
          <span v-if="pendientes.length" class="adm-seg-count warn">{{ pendientes.length }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="adm-loading">
      <div class="adm-spinner"></div>
    </div>

    <!-- ═══ USUARIOS ═══ -->
    <section v-else-if="tab === 'usuarios'" class="adm-section">
      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toast" class="adm-toast" :class="toast.type">{{ toast.text }}</div>
      </Transition>

      <!-- Search -->
      <div class="adm-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" type="text" placeholder="Buscar por nombre, email o CURP..." class="adm-search" />
      </div>

      <!-- User cards list -->
      <div class="adm-users-card">
      <div class="adm-users">
        <div v-for="u in filteredUsers" :key="u.id" class="usr" :class="{ 'usr--off': !u.activo }">
          <!-- Avatar -->
          <div class="usr-avatar" :class="'usr-avatar--' + u.rol">
            {{ initials(u.nombre_completo) }}
          </div>

          <!-- Info -->
          <div class="usr-body">
            <div class="usr-row-top">
              <div class="usr-name">{{ u.nombre_completo }}</div>
            </div>
            <div class="usr-email">{{ u.email }}</div>
            <div class="usr-meta">
              <span class="usr-curp">{{ u.curp }}</span>
              <span class="usr-dot"></span>
              <span :class="u.activo ? 'usr-status-on' : 'usr-status-off'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
              <span class="usr-dot"></span>
              <span>{{ formatDate(u.fecha_registro) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="usr-actions">
            <div class="usr-role-group" @click="openRolModal(u)">
              <span class="usr-role-tag" :class="'usr-role-tag--' + u.rol">{{ rolLabel(u.rol) }}</span>
              <button class="usr-btn usr-btn--role" title="Cambiar rol">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
              </button>
            </div>
            <button class="usr-btn usr-btn--toggle" :class="u.activo ? 'on' : 'off'" :title="u.activo ? 'Desactivar' : 'Activar'" @click="openToggleModal(u)">
              <svg v-if="u.activo" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64A9 9 0 0 1 12 21a9 9 0 0 1 0-18c1.66 0 3.2.45 4.53 1.23"/><path d="M12 2v10"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/></svg>
            </button>
            <button class="usr-btn usr-btn--edit" title="Editar" @click="openEditModal(u)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="usr-btn usr-btn--delete" title="Eliminar" @click="openDeleteModal(u)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <div v-if="filteredUsers.length === 0 && !loading" class="adm-empty">
          <p>{{ search ? 'Sin resultados' : 'No hay usuarios' }}</p>
        </div>
      </div>
      </div>
    </section>

    <!-- ═══ BODEGAS PENDIENTES ═══ -->
    <section v-else-if="tab === 'pendientes'" class="adm-section">
      <Transition name="toast">
        <div v-if="toast" class="adm-toast" :class="toast.type">{{ toast.text }}</div>
      </Transition>

      <div v-if="pendientes.length === 0" class="adm-empty adm-empty-lg">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".2"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <p>No hay bodegas pendientes</p>
      </div>

      <div v-else class="pend-grid">
        <div v-for="b in pendientes" :key="b.id" class="pend">
          <div class="pend-top">
            <div class="pend-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
            </div>
            <div class="pend-info">
              <h3 class="pend-name">{{ b.nombre }}</h3>
              <p class="pend-sub">{{ b.clave }} · {{ b.municipio }}, {{ b.estado }}</p>
              <p class="pend-sub" v-if="(b as any).creado_por_nombre">Por: <strong>{{ (b as any).creado_por_nombre }}</strong></p>
            </div>
          </div>
          <div class="pend-detail">
            <span>{{ b.capacidad_toneladas?.toLocaleString() || '—' }} ton</span>
            <span v-if="b.fecha_creacion">{{ new Date(b.fecha_creacion).toLocaleDateString('es-MX') }}</span>
          </div>
          <div class="pend-btns">
            <button class="pend-btn pend-btn--ok" @click="handleAprobar(b.id)" :disabled="pendLoading === b.id">Aprobar</button>
            <button class="pend-btn pend-btn--no" @click="handleRechazar(b.id)" :disabled="pendLoading === b.id">Rechazar</button>
            <router-link :to="`/bodega/${b.id}`" class="pend-btn pend-btn--link">Detalle</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ MODAL: Cambiar rol ═══ -->
    <Transition name="modal">
      <div v-if="rolModal" class="modal-overlay" @click.self="rolModal = null">
        <div class="modal-card">
          <h2 class="modal-title">Cambiar rol</h2>
          <p class="modal-desc">Selecciona el nuevo rol para <strong>{{ rolModal.nombre_completo }}</strong></p>
          <div class="modal-roles">
            <label v-for="r in roles" :key="r.value" class="modal-role" :class="{ selected: rolNewValue === r.value }">
              <input type="radio" :value="r.value" v-model="rolNewValue" />
              <span class="modal-role-dot" :class="'dot--' + r.value"></span>
              <span>{{ r.label }}</span>
            </label>
          </div>
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" @click="rolModal = null">Cancelar</button>
            <button class="modal-btn modal-btn--confirm" :disabled="!rolNewValue || rolNewValue === rolModal.rol || actionBusy" @click="confirmRolChange">
              <span v-if="actionBusy" class="adm-spinner-sm"></span>
              <span v-else>Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ MODAL: Editar usuario ═══ -->
    <Transition name="modal">
      <div v-if="editModal" class="modal-overlay" @click.self="editModal = null">
        <div class="modal-card">
          <h2 class="modal-title">Editar usuario</h2>
          <form @submit.prevent="confirmEdit" class="modal-form">
            <div class="modal-field">
              <label>Nombre completo</label>
              <input v-model="editForm.nombre_completo" required />
            </div>
            <div class="modal-field">
              <label>Email</label>
              <input v-model="editForm.email" type="email" required />
            </div>
            <div class="modal-field">
              <label>CURP</label>
              <input v-model="editForm.curp" maxlength="18" style="text-transform:uppercase" required />
            </div>
            <div class="modal-field">
              <label>Teléfono</label>
              <input v-model="editForm.telefono" maxlength="10" />
            </div>
            <div class="modal-actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="editModal = null">Cancelar</button>
              <button type="submit" class="modal-btn modal-btn--confirm" :disabled="actionBusy">
                <span v-if="actionBusy" class="adm-spinner-sm"></span>
                <span v-else>Guardar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ═══ MODAL: Toggle status ═══ -->
    <Transition name="modal">
      <div v-if="toggleModal" class="modal-overlay" @click.self="toggleModal = null">
        <div class="modal-card modal-card--sm">
          <div class="modal-icon-wrap" :class="toggleModal.activo ? 'modal-icon--warn' : 'modal-icon--ok'">
            <svg v-if="toggleModal.activo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64A9 9 0 0 1 12 21a9 9 0 0 1 0-18"/><path d="M12 2v10"/></svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/></svg>
          </div>
          <h2 class="modal-title">{{ toggleModal.activo ? 'Desactivar' : 'Activar' }} usuario</h2>
          <p class="modal-desc">¿{{ toggleModal.activo ? 'Desactivar' : 'Activar' }} a <strong>{{ toggleModal.nombre_completo }}</strong>?</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" @click="toggleModal = null">Cancelar</button>
            <button class="modal-btn" :class="toggleModal.activo ? 'modal-btn--danger' : 'modal-btn--confirm'" :disabled="actionBusy" @click="confirmToggle">
              <span v-if="actionBusy" class="adm-spinner-sm"></span>
              <span v-else>{{ toggleModal.activo ? 'Desactivar' : 'Activar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══ MODAL: Eliminar ═══ -->
    <Transition name="modal">
      <div v-if="deleteModal" class="modal-overlay" @click.self="deleteModal = null">
        <div class="modal-card modal-card--sm">
          <div class="modal-icon-wrap modal-icon--danger">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </div>
          <h2 class="modal-title">Eliminar usuario</h2>
          <p class="modal-desc">¿Eliminar permanentemente a <strong>{{ deleteModal.nombre_completo }}</strong>? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" @click="deleteModal = null">Cancelar</button>
            <button class="modal-btn modal-btn--danger" :disabled="actionBusy" @click="confirmDelete">
              <span v-if="actionBusy" class="adm-spinner-sm"></span>
              <span v-else>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import type { AdminUsuario, Bodega, UserRole } from '@/types'

const tab = ref<'usuarios' | 'pendientes'>('usuarios')
const usuarios = ref<AdminUsuario[]>([])
const pendientes = ref<Bodega[]>([])
const loading = ref(true)
const search = ref('')
const toast = ref<{ type: string; text: string } | null>(null)
const actionBusy = ref(false)
const pendLoading = ref<number | null>(null)

const roles = [
  { value: 'productor', label: 'Productor' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'admin', label: 'Administrador' },
]

const rolModal = ref<AdminUsuario | null>(null)
const rolNewValue = ref('')
const editModal = ref<AdminUsuario | null>(null)
const editForm = ref({ nombre_completo: '', email: '', curp: '', telefono: '' })
const toggleModal = ref<AdminUsuario | null>(null)
const deleteModal = ref<AdminUsuario | null>(null)

const filteredUsers = computed(() => {
  if (!search.value) return usuarios.value
  const q = search.value.toLowerCase()
  return usuarios.value.filter(u =>
    u.nombre_completo.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.curp.toLowerCase().includes(q)
  )
})

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

function rolLabel(r: string) {
  return roles.find(x => x.value === r)?.label || r
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function showToast(type: string, text: string) {
  toast.value = { type, text }
  setTimeout(() => { toast.value = null }, 4000)
}

// ── Fetch data ──
async function fetchData() {
  loading.value = true
  try {
    const [uRes, bRes] = await Promise.all([
      api.admin.listarUsuarios(),
      api.admin.bodegasPendientes(),
    ])
    usuarios.value = uRes.usuarios
    pendientes.value = bRes.bodegas
  } catch (err: any) {
    showToast('error', err.message || 'Error cargando datos')
  } finally {
    loading.value = false
  }
}

// ── Rol modal ──
function openRolModal(u: AdminUsuario) {
  rolModal.value = u
  rolNewValue.value = u.rol
}

async function confirmRolChange() {
  if (!rolModal.value || !rolNewValue.value) return
  actionBusy.value = true
  try {
    const res = await api.admin.cambiarRol(rolModal.value.id, rolNewValue.value as UserRole)
    const idx = usuarios.value.findIndex(u => u.id === rolModal.value!.id)
    if (idx !== -1) usuarios.value[idx].rol = rolNewValue.value as UserRole
    showToast('success', res.message)
    rolModal.value = null
  } catch (err: any) {
    showToast('error', err.message || 'Error cambiando rol')
  } finally {
    actionBusy.value = false
  }
}

// ── Edit modal ──
function openEditModal(u: AdminUsuario) {
  editModal.value = u
  editForm.value = {
    nombre_completo: u.nombre_completo,
    email: u.email,
    curp: u.curp,
    telefono: (u as any).telefono || '',
  }
}

async function confirmEdit() {
  if (!editModal.value) return
  actionBusy.value = true
  try {
    const res = await api.admin.editarUsuario(editModal.value.id, editForm.value)
    const idx = usuarios.value.findIndex(u => u.id === editModal.value!.id)
    if (idx !== -1) Object.assign(usuarios.value[idx], res.usuario)
    showToast('success', res.message)
    editModal.value = null
  } catch (err: any) {
    showToast('error', err.message || 'Error al editar')
  } finally {
    actionBusy.value = false
  }
}

// ── Toggle status modal ──
function openToggleModal(u: AdminUsuario) {
  toggleModal.value = u
}

async function confirmToggle() {
  if (!toggleModal.value) return
  actionBusy.value = true
  try {
    const newVal = !toggleModal.value.activo
    const res = await api.admin.cambiarEstatus(toggleModal.value.id, newVal)
    const idx = usuarios.value.findIndex(u => u.id === toggleModal.value!.id)
    if (idx !== -1) usuarios.value[idx].activo = newVal
    showToast('success', res.message)
    toggleModal.value = null
  } catch (err: any) {
    showToast('error', err.message || 'Error cambiando estado')
  } finally {
    actionBusy.value = false
  }
}

// ── Delete modal ──
function openDeleteModal(u: AdminUsuario) {
  deleteModal.value = u
}

async function confirmDelete() {
  if (!deleteModal.value) return
  actionBusy.value = true
  try {
    const res = await api.admin.eliminarUsuario(deleteModal.value.id)
    usuarios.value = usuarios.value.filter(u => u.id !== deleteModal.value!.id)
    showToast('success', res.message)
    deleteModal.value = null
  } catch (err: any) {
    showToast('error', err.message || 'Error al eliminar')
  } finally {
    actionBusy.value = false
  }
}

// ── Bodegas ──
async function handleAprobar(id: number) {
  pendLoading.value = id
  try {
    const res = await api.admin.aprobarBodega(id)
    pendientes.value = pendientes.value.filter(b => b.id !== id)
    showToast('success', res.message)
  } catch (err: any) {
    showToast('error', err.message || 'Error aprobando')
  } finally {
    pendLoading.value = null
  }
}

async function handleRechazar(id: number) {
  pendLoading.value = id
  try {
    const res = await api.admin.rechazarBodega(id)
    pendientes.value = pendientes.value.filter(b => b.id !== id)
    showToast('success', res.message)
  } catch (err: any) {
    showToast('error', err.message || 'Error rechazando')
  } finally {
    pendLoading.value = null
  }
}

onMounted(fetchData)
</script>

<style scoped>
/* ══════ LAYOUT ══════ */
.adm {
  background: #F5F5F7;
  display: flex; flex-direction: column;
  height: calc(100vh - 60px); /* desktop: topbar 60px */
  overflow: hidden;
}

/* ══════ HEADER ══════ */
.adm-header {
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
  padding: 1.5rem 1.5rem 2rem;
  border-radius: 0 0 32px 32px;
  flex-shrink: 0;
}
.adm-header-inner { max-width: 820px; margin: 0 auto; }
.adm-title { font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0; letter-spacing: -.03em; }
.adm-sub { font-size: .9rem; color: rgba(255,255,255,.6); margin: .25rem 0 0; font-weight: 500; }

/* ══════ SEGMENTED CONTROL ══════ */
.adm-seg-wrap { max-width: 820px; margin: -1.25rem auto 0; padding: 0 1.5rem; position: relative; z-index: 2; flex-shrink: 0; }
.adm-seg {
  display: inline-flex; background: rgba(255,255,255,.85); backdrop-filter: blur(16px);
  border-radius: 14px; padding: 4px; box-shadow: 0 4px 20px rgba(0,0,0,.08);
  border: .5px solid rgba(0,0,0,.06);
}
.adm-seg button {
  padding: .55rem 1.25rem; border: none; background: transparent; border-radius: 11px;
  font-size: .82rem; font-weight: 650; color: #666; cursor: pointer;
  transition: all .25s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; gap: .4rem;
}
.adm-seg button.active {
  background: #fff; color: #1a1a2e; box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
.adm-seg-count {
  font-size: .6rem; font-weight: 700; background: #1a1a2e; color: #fff;
  padding: 1px 6px; border-radius: 99px; min-width: 18px; text-align: center;
}
.adm-seg-count.warn { background: #FF9F0A; }

/* ══════ LOADING ══════ */
.adm-loading { display: flex; justify-content: center; padding: 4rem 0; }
.adm-spinner {
  width: 32px; height: 32px; border: 3px solid #e0e0e0; border-top-color: #1a1a2e;
  border-radius: 50%; animation: spin .7s linear infinite;
}
.adm-spinner-sm {
  display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════ SECTION ══════ */
.adm-section {
  max-width: 820px; width: 100%; margin: .75rem auto 0; padding: 0 1.5rem;
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  box-sizing: border-box;
}

/* ══════ TOAST ══════ */
.adm-toast {
  padding: .65rem 1rem; border-radius: 12px; font-size: .82rem; font-weight: 600;
  margin-bottom: 1rem; backdrop-filter: blur(12px);
}
.adm-toast.success { background: rgba(52,199,89,.12); color: #1D6B34; border: .5px solid rgba(52,199,89,.2); }
.adm-toast.error { background: rgba(255,59,48,.1); color: #C0392B; border: .5px solid rgba(255,59,48,.18); }
.toast-enter-active, .toast-leave-active { transition: all .3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }

/* ══════ SEARCH ══════ */
.adm-search-bar {
  display: flex; align-items: center; gap: .6rem;
  background: rgba(255,255,255,.75); backdrop-filter: blur(12px);
  border: .5px solid rgba(0,0,0,.06); border-radius: 14px;
  padding: .6rem 1rem; margin-bottom: .75rem;
  box-shadow: 0 1px 4px rgba(0,0,0,.03);
  flex-shrink: 0;
}
.adm-search-bar svg { color: #999; flex-shrink: 0; }
.adm-search {
  border: none; background: transparent; flex: 1;
  font-size: .85rem; font-weight: 500; color: #1a1a2e; outline: none;
}
.adm-search::placeholder { color: #aaa; }

/* ══════ USER CARDS ══════ */
.adm-users-card {
  background: rgba(255,255,255,.5); backdrop-filter: blur(12px);
  border: .5px solid rgba(0,0,0,.06); border-radius: 20px;
  padding: .75rem;
  flex: 1; min-height: 0; overflow-y: auto;
  box-shadow: 0 2px 16px rgba(0,0,0,.04);
  scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.12) transparent;
}
.adm-users-card::-webkit-scrollbar { width: 6px; }
.adm-users-card::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 3px; }
.adm-users-card::-webkit-scrollbar-track { background: transparent; }
.adm-users { display: flex; flex-direction: column; gap: .625rem; }
.usr {
  display: flex; align-items: center; gap: 1rem;
  background: rgba(255,255,255,.82); backdrop-filter: blur(16px);
  border: .5px solid rgba(0,0,0,.05); border-radius: 18px;
  padding: 1rem 1.15rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
  transition: transform .2s, box-shadow .2s;
}
.usr:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.07); }
.usr--off { opacity: .5; }

.usr-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 800; color: #fff; flex-shrink: 0;
  letter-spacing: .02em;
}
.usr-avatar--productor { background: linear-gradient(135deg, #7C3AED, #5B21B6); }
.usr-avatar--supervisor { background: linear-gradient(135deg, #2563EB, #1D4ED8); }
.usr-avatar--responsable { background: linear-gradient(135deg, #EA580C, #C2410C); }
.usr-avatar--admin { background: linear-gradient(135deg, #0F5132, #064E3B); }
.usr-avatar--bodeguero { background: linear-gradient(135deg, #D97706, #B45309); }

.usr-body { flex: 1; min-width: 0; }
.usr-row-top { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.usr-name { font-size: .88rem; font-weight: 700; color: #1a1a2e; letter-spacing: -.015em; }
.usr-email { font-size: .78rem; color: #666; margin-top: .15rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.usr-meta { display: flex; align-items: center; gap: .4rem; font-size: .7rem; color: #999; margin-top: .25rem; flex-wrap: wrap; }
.usr-curp { font-family: ui-monospace, monospace; }
.usr-dot { width: 3px; height: 3px; border-radius: 50%; background: #ccc; }
.usr-status-on { color: #22C55E; font-weight: 600; }
.usr-status-off { color: #EF4444; font-weight: 600; }

.usr-actions { display: flex; align-items: center; gap: .35rem; flex-shrink: 0; }
.usr-role-group {
  display: flex; align-items: center; gap: 0; cursor: pointer;
  border-radius: 10px; overflow: hidden; height: 36px;
  transition: opacity .2s;
}
.usr-role-group:hover { opacity: .85; }
.usr-role-tag {
  font-size: .6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; white-space: nowrap;
  padding: 0; height: 100%;
  display: flex; align-items: center; justify-content: center;
  width: 110px;
}
.usr-role-tag--productor { background: #EDE9FE; color: #6D28D9; }
.usr-role-tag--supervisor { background: #DBEAFE; color: #1D4ED8; }
.usr-role-tag--responsable { background: #FFF7ED; color: #C2410C; }
.usr-role-tag--admin { background: #ECFDF5; color: #065F46; }
.usr-role-tag--bodeguero { background: #FFFBEB; color: #B45309; }
.usr-role-group .usr-btn--role {
  border-radius: 0; width: 34px; height: 100%;
  background: rgba(0,0,0,.05);
}
.usr-btn {
  width: 36px; height: 36px; border-radius: 11px; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .2s; background: rgba(0,0,0,.04);
  color: #666;
}
.usr-btn:hover { background: rgba(0,0,0,.08); }
.usr-btn--toggle.on { color: #EF4444; }
.usr-btn--toggle.on:hover { background: rgba(239,68,68,.08); }
.usr-btn--toggle.off { color: #22C55E; }
.usr-btn--toggle.off:hover { background: rgba(34,197,94,.08); }
.usr-btn--role { color: #7C3AED; }
.usr-btn--role:hover { background: rgba(124,58,237,.08); }
.usr-btn--edit { color: #2563EB; }
.usr-btn--edit:hover { background: rgba(37,99,235,.08); }
.usr-btn--delete { color: #EF4444; }
.usr-btn--delete:hover { background: rgba(239,68,68,.08); }

/* ══════ EMPTY ══════ */
.adm-empty { text-align: center; padding: 3rem 1rem; color: #999; font-size: .88rem; }
.adm-empty-lg { padding: 5rem 1rem; }
.adm-empty svg { margin-bottom: .5rem; }

/* ══════ PENDIENTES ══════ */
.pend-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: .75rem; }
.pend {
  background: rgba(255,255,255,.82); backdrop-filter: blur(16px);
  border: .5px solid rgba(255,200,50,.2); border-radius: 18px;
  padding: 1.15rem; display: flex; flex-direction: column; gap: .75rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
}
.pend-top { display: flex; gap: .75rem; align-items: flex-start; }
.pend-icon {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: rgba(255,159,10,.1); color: #FF9F0A;
  display: flex; align-items: center; justify-content: center;
}
.pend-info { min-width: 0; flex: 1; }
.pend-name { font-size: .92rem; font-weight: 700; color: #1a1a2e; margin: 0; }
.pend-sub { font-size: .78rem; color: #888; margin: .1rem 0 0; }
.pend-sub strong { color: #555; }
.pend-detail { display: flex; gap: 1rem; font-size: .75rem; color: #999; }
.pend-btns { display: flex; gap: .4rem; flex-wrap: wrap; }
.pend-btn {
  padding: .45rem .85rem; border-radius: 10px; font-size: .78rem; font-weight: 650;
  cursor: pointer; border: none; transition: all .2s; text-decoration: none; text-align: center;
}
.pend-btn--ok { background: #22C55E; color: #fff; }
.pend-btn--ok:hover:not(:disabled) { background: #16A34A; }
.pend-btn--no { background: rgba(239,68,68,.08); color: #EF4444; }
.pend-btn--no:hover:not(:disabled) { background: rgba(239,68,68,.15); }
.pend-btn--link { background: rgba(0,0,0,.04); color: #555; }
.pend-btn--link:hover { background: rgba(0,0,0,.08); }
.pend-btn:disabled { opacity: .4; cursor: not-allowed; }

/* ══════ MODALS ══════ */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.35); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-card {
  background: rgba(255,255,255,.92); backdrop-filter: blur(24px);
  border-radius: 22px; padding: 1.75rem; width: 100%; max-width: 420px;
  box-shadow: 0 24px 80px rgba(0,0,0,.15);
  border: .5px solid rgba(255,255,255,.6);
}
.modal-card--sm { max-width: 360px; text-align: center; }
.modal-icon-wrap {
  width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 1rem;
  display: flex; align-items: center; justify-content: center;
}
.modal-icon--warn { background: rgba(255,159,10,.12); color: #FF9F0A; }
.modal-icon--ok { background: rgba(34,197,94,.12); color: #22C55E; }
.modal-icon--danger { background: rgba(239,68,68,.1); color: #EF4444; }

.modal-title { font-size: 1.15rem; font-weight: 750; color: #1a1a2e; margin: 0 0 .35rem; letter-spacing: -.02em; }
.modal-desc { font-size: .85rem; color: #666; margin: 0 0 1.25rem; line-height: 1.45; }
.modal-desc strong { color: #333; }

/* Role picker */
.modal-roles { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1.25rem; }
.modal-role {
  display: flex; align-items: center; gap: .6rem;
  padding: .65rem .85rem; border-radius: 12px; cursor: pointer;
  border: 1.5px solid transparent; transition: all .2s;
  background: rgba(0,0,0,.02);
}
.modal-role:hover { background: rgba(0,0,0,.04); }
.modal-role.selected { border-color: #1a1a2e; background: rgba(26,26,46,.04); }
.modal-role input { display: none; }
.modal-role-dot { width: 10px; height: 10px; border-radius: 50%; }
.dot--productor { background: #7C3AED; }
.dot--supervisor { background: #2563EB; }
.dot--responsable { background: #EA580C; }
.dot--admin { background: #0F5132; }
.dot--bodeguero { background: #D97706; }
.modal-role span:last-child { font-size: .85rem; font-weight: 600; color: #333; }

/* Form */
.modal-form { display: flex; flex-direction: column; gap: .85rem; }
.modal-field label { display: block; font-size: .72rem; font-weight: 650; color: #888; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .3rem; }
.modal-field input {
  width: 100%; padding: .6rem .75rem; border: 1.5px solid rgba(0,0,0,.1);
  border-radius: 10px; font-size: .85rem; font-weight: 500; color: #1a1a2e;
  background: rgba(255,255,255,.6); outline: none; transition: border-color .2s;
  box-sizing: border-box;
}
.modal-field input:focus { border-color: #1a1a2e; }

/* Actions */
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .5rem; }
.modal-btn {
  padding: .55rem 1.25rem; border: none; border-radius: 11px;
  font-size: .82rem; font-weight: 650; cursor: pointer;
  transition: all .2s; display: inline-flex; align-items: center; gap: .4rem;
}
.modal-btn--cancel { background: rgba(0,0,0,.05); color: #666; }
.modal-btn--cancel:hover { background: rgba(0,0,0,.08); }
.modal-btn--confirm { background: #1a1a2e; color: #fff; }
.modal-btn--confirm:hover:not(:disabled) { background: #2a2a4e; }
.modal-btn--danger { background: #EF4444; color: #fff; }
.modal-btn--danger:hover:not(:disabled) { background: #DC2626; }
.modal-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Transitions */
.modal-enter-active { transition: all .3s cubic-bezier(.4,0,.2,1); }
.modal-leave-active { transition: all .2s ease; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(.92) translateY(12px); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: scale(.95); }

/* ══════ RESPONSIVE ══════ */
@media (max-width: 768px) {
  .adm-header { padding: 1.5rem 1.25rem 2rem; border-radius: 0 0 24px 24px; }
  .adm-title { font-size: 1.4rem; }
  .adm-seg-wrap { padding: 0 1.25rem; }
  .adm-section { padding: 0 1.25rem; }
  .usr { flex-direction: column; align-items: stretch; gap: .75rem; padding: 1rem; }
  .usr-avatar { width: 38px; height: 38px; font-size: .68rem; position: absolute; border-radius: 50%; }
  .usr { position: relative; padding-left: 3.5rem; }
  .usr-avatar { position: absolute; left: 1rem; top: 1rem; }
  .usr-actions { justify-content: flex-end; border-top: .5px solid rgba(0,0,0,.06); padding-top: .6rem; }
  .usr-role-tag { min-width: 70px; font-size: .55rem; }
  .adm { height: calc(100vh - 52px - 72px); } /* topbar 52px + bottom tabs 72px */
  .pend-grid { grid-template-columns: 1fr; }
  .modal-card { padding: 1.25rem; border-radius: 18px; }
}

@media (max-width: 420px) {
  .adm-header { padding: 1rem 1rem 1.5rem; }
  .adm-title { font-size: 1.25rem; }
  .adm-section { padding: 0 1rem; }
  .adm-seg-wrap { padding: 0 1rem; }
  .usr-meta { display: none; }
  .modal-actions { flex-direction: column; }
  .modal-btn { justify-content: center; }
}
</style>
