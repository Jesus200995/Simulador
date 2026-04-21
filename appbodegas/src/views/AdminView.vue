<template>
  <div class="detalle-page">
    <header class="app-header">
      <router-link to="/" class="detalle-back-btn" aria-label="Volver al mapa">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span class="detalle-back-label">Mapa</span>
      </router-link>
      <div class="header-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <div class="header-brand-text">
          <span class="header-brand-title">SIMAC</span>
          <span class="header-brand-subtitle">Panel de Administración</span>
        </div>
      </div>
      <nav class="header-nav">
        <router-link to="/">Mapa</router-link>
        <router-link to="/mis-bodegas">Mis bodegas</router-link>
        <router-link to="/admin" class="active">Admin</router-link>
      </nav>
      <div class="header-spacer"></div>
    </header>

    <main class="admin-main">
      <h1 class="admin-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Administracion
      </h1>

      <!-- Admin tabs -->
      <div class="admin-tabs">
        <button class="admin-tab" :class="{ active: adminTab === 'usuarios' }" @click="adminTab = 'usuarios'">
          Usuarios
          <span v-if="usuarios.length" class="admin-tab-badge">{{ usuarios.length }}</span>
        </button>
        <button class="admin-tab" :class="{ active: adminTab === 'pendientes' }" @click="adminTab = 'pendientes'">
          Bodegas pendientes
          <span v-if="pendientes.length" class="admin-tab-badge pending">{{ pendientes.length }}</span>
        </button>
      </div>

      <div v-if="loading" class="admin-loading">
        <span class="spinner spinner-dark"></span> Cargando...
      </div>

      <!-- Tab: Usuarios -->
      <div v-else-if="adminTab === 'usuarios'">
        <div v-if="actionMsg" class="alert" :class="actionMsg.type === 'success' ? 'alert-success' : 'alert-error'">{{ actionMsg.text }}</div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usuarios" :key="u.id" :class="{ inactive: !u.activo }">
                <td>
                  <div class="user-name">{{ u.nombre_completo }}</div>
                  <div class="user-curp">{{ u.curp }}</div>
                </td>
                <td>{{ u.email }}</td>
                <td>
                  <select class="role-select" :class="u.rol" :value="u.rol" @change="handleRolChange(u.id, ($event.target as HTMLSelectElement).value)" :disabled="actionLoading === u.id">
                    <option value="tecnico">Técnico</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="responsable">Responsable de Bodega</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span class="status-badge" :class="u.activo ? 'active' : 'inactive'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="date-cell">{{ u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-MX') : '-' }}</td>
                <td>
                  <button class="btn-action" :class="u.activo ? 'btn-deactivate' : 'btn-activate'" @click="handleEstatusChange(u.id, !u.activo)" :disabled="actionLoading === u.id">
                    <span v-if="actionLoading === u.id" class="spinner spinner-sm"></span>
                    <span v-else>{{ u.activo ? 'Desactivar' : 'Activar' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Bodegas pendientes -->
      <div v-else-if="adminTab === 'pendientes'">
        <div v-if="pendientesMsg" class="alert" :class="pendientesMsg.type === 'success' ? 'alert-success' : 'alert-error'">{{ pendientesMsg.text }}</div>

        <div v-if="pendientes.length === 0" class="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.25"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
          <p>No hay bodegas pendientes de aprobacion</p>
        </div>

        <div v-else class="pendientes-grid">
          <div v-for="b in pendientes" :key="b.id" class="pendiente-card">
            <div class="pendiente-header">
              <div>
                <h3>{{ b.nombre }}</h3>
                <p class="pendiente-meta">{{ b.clave }} · {{ b.municipio }}, {{ b.estado }}</p>
                <p class="pendiente-meta" v-if="(b as any).creado_por_nombre">Solicitado por: <strong>{{ (b as any).creado_por_nombre }}</strong></p>
              </div>
            </div>
            <div class="pendiente-details">
              <span>Capacidad: {{ b.capacidad_toneladas?.toLocaleString() || '—' }} ton</span>
              <span v-if="b.fecha_creacion">Fecha: {{ new Date(b.fecha_creacion).toLocaleDateString('es-MX') }}</span>
            </div>
            <div class="pendiente-actions">
              <button class="btn btn-approve" @click="handleAprobar(b.id)" :disabled="pendienteLoading === b.id">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Aprobar
              </button>
              <button class="btn btn-reject" @click="handleRechazar(b.id)" :disabled="pendienteLoading === b.id">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Rechazar
              </button>
              <router-link :to="`/bodega/${b.id}`" class="btn btn-detail">Ver detalle</router-link>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import type { AdminUsuario, Bodega, UserRole } from '@/types'

const adminTab = ref<'usuarios' | 'pendientes'>('usuarios')
const usuarios = ref<AdminUsuario[]>([])
const pendientes = ref<Bodega[]>([])
const loading = ref(true)
const actionLoading = ref<number | null>(null)
const pendienteLoading = ref<number | null>(null)
const actionMsg = ref<{ type: string; text: string } | null>(null)
const pendientesMsg = ref<{ type: string; text: string } | null>(null)

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
    actionMsg.value = { type: 'error', text: err.message || 'Error cargando datos' }
  } finally {
    loading.value = false
  }
}

async function handleRolChange(userId: number, newRol: string) {
  actionMsg.value = null
  actionLoading.value = userId
  try {
    const res = await api.admin.cambiarRol(userId, newRol as UserRole)
    actionMsg.value = { type: 'success', text: res.message }
    const idx = usuarios.value.findIndex(u => u.id === userId)
    if (idx !== -1) usuarios.value[idx].rol = newRol as UserRole
  } catch (err: any) {
    actionMsg.value = { type: 'error', text: err.message || 'Error cambiando rol' }
    // Revert select
    await fetchData()
  } finally {
    actionLoading.value = null
    setTimeout(() => { actionMsg.value = null }, 4000)
  }
}

async function handleEstatusChange(userId: number, activo: boolean) {
  actionMsg.value = null
  actionLoading.value = userId
  try {
    const res = await api.admin.cambiarEstatus(userId, activo)
    actionMsg.value = { type: 'success', text: res.message }
    const idx = usuarios.value.findIndex(u => u.id === userId)
    if (idx !== -1) usuarios.value[idx].activo = activo
  } catch (err: any) {
    actionMsg.value = { type: 'error', text: err.message || 'Error cambiando estado' }
  } finally {
    actionLoading.value = null
    setTimeout(() => { actionMsg.value = null }, 4000)
  }
}

async function handleAprobar(bodegaId: number) {
  pendientesMsg.value = null
  pendienteLoading.value = bodegaId
  try {
    const res = await api.admin.aprobarBodega(bodegaId)
    pendientesMsg.value = { type: 'success', text: res.message }
    pendientes.value = pendientes.value.filter(b => b.id !== bodegaId)
  } catch (err: any) {
    pendientesMsg.value = { type: 'error', text: err.message || 'Error aprobando bodega' }
  } finally {
    pendienteLoading.value = null
    setTimeout(() => { pendientesMsg.value = null }, 4000)
  }
}

async function handleRechazar(bodegaId: number) {
  pendientesMsg.value = null
  pendienteLoading.value = bodegaId
  try {
    const res = await api.admin.rechazarBodega(bodegaId)
    pendientesMsg.value = { type: 'success', text: res.message }
    pendientes.value = pendientes.value.filter(b => b.id !== bodegaId)
  } catch (err: any) {
    pendientesMsg.value = { type: 'error', text: err.message || 'Error rechazando bodega' }
  } finally {
    pendienteLoading.value = null
    setTimeout(() => { pendientesMsg.value = null }, 4000)
  }
}

onMounted(fetchData)
</script>

<style scoped>
.detalle-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

.admin-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 74px 1.25rem 2.5rem;
}

.admin-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.admin-title svg {
  color: var(--color-primary);
}

.detalle-back-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem 0.35rem 0.45rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.2s, color 0.2s;
  flex-shrink: 0;
}

.detalle-back-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1.5px solid var(--color-separator);
}

.admin-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  margin-bottom: -1.5px;
}

.admin-tab:hover {
  color: var(--color-text);
}

.admin-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.admin-tab-badge {
  background: var(--color-primary);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
}

.admin-tab-badge.pending {
  background: #FFB020;
}

.admin-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
}

.admin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: var(--color-text-tertiary);
  text-align: center;
}

/* Users table */
.admin-table-wrap {
  overflow-x: auto;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.admin-table th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-separator);
  background: var(--color-bg);
  white-space: nowrap;
}

.admin-table td {
  padding: 0.7rem 0.85rem;
  border-bottom: 0.5px solid var(--color-separator);
  color: var(--color-text);
  vertical-align: middle;
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.admin-table tr.inactive td {
  opacity: 0.55;
}

.user-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.user-curp {
  font-size: 0.72rem;
  color: var(--color-text-tertiary);
  margin-top: 0.1rem;
  font-family: monospace;
}

.date-cell {
  white-space: nowrap;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

/* Role select */
.role-select {
  padding: 0.3rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  background: white;
  appearance: auto;
  min-width: 100px;
}

.role-select.tecnico {
  color: #5856D6;
  border-color: rgba(88, 86, 214, 0.3);
}

.role-select.supervisor {
  color: #007AFF;
  border-color: rgba(0, 122, 255, 0.3);
}

.role-select.responsable {
  color: #D35400;
  border-color: rgba(211, 84, 0, 0.3);
}

.role-select.admin {
  color: #691C32;
  border-color: rgba(105, 28, 50, 0.3);
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-badge.active {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.inactive {
  background: #FFEAEA;
  color: #C0392B;
}

/* Action buttons */
.btn-action {
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1.5px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-deactivate {
  color: #C0392B;
  border-color: #F5B7B1;
  background: #FFF5F5;
}

.btn-deactivate:hover:not(:disabled) {
  background: #FFEAEA;
}

.btn-activate {
  color: #2E7D32;
  border-color: #A5D6A7;
  background: #F1F8F1;
}

.btn-activate:hover:not(:disabled) {
  background: #E8F5E9;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pending bodegas */
.pendientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}

.pendiente-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid #FFECB3;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pendiente-card h3 {
  font-size: 1rem;
  font-weight: 650;
  color: var(--color-text);
  margin: 0;
}

.pendiente-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0.15rem 0 0;
}

.pendiente-meta strong {
  color: var(--color-text);
}

.pendiente-details {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.pendiente-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-approve {
  background: #2E7D32;
  color: white;
  border: none;
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.2s;
}

.btn-approve:hover:not(:disabled) {
  background: #1B5E20;
}

.btn-reject {
  background: white;
  color: #C0392B;
  border: 1.5px solid #F5B7B1;
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
}

.btn-reject:hover:not(:disabled) {
  background: #FFF5F5;
}

.btn-detail {
  background: none;
  color: var(--color-primary);
  border: 1.5px solid var(--color-border);
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: var(--color-bg);
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .admin-main {
    padding: 64px 1rem 2rem;
  }

  .admin-table-wrap {
    font-size: 0.75rem;
  }

  .admin-table th,
  .admin-table td {
    padding: 0.55rem 0.5rem;
  }

  .pendientes-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .admin-tabs {
    overflow-x: auto;
  }

  .admin-tab {
    white-space: nowrap;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .admin-title {
    font-size: 1.15rem;
  }
}
</style>
