<template>
  <div class="page-container narrow">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Notificaciones</h1>
          <p class="view-subtitle">Alertas y actualizaciones recientes</p>
        </div>
        <div class="view-header-actions">
          <button v-if="totalNoLeidas > 0" class="btn btn-ghost" @click="leerTodas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Marcar todas como leídas
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando notificaciones...</p>
    </div>
    <div v-else-if="notificaciones.length === 0" class="state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <p>No tienes notificaciones.</p>
    </div>

    <div v-else class="notif-lista">
      <div
        v-for="n in notificaciones"
        :key="n.id"
        :class="['list-card-item notif-item', { 'notif-unread': !n.leida }]"
        @click="abrir(n)"
      >
        <div class="notif-dot-wrap">
          <span v-if="!n.leida" class="unread-indicator"></span>
          <div :class="['notif-level-icon', n.nivel_alerta]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
        <div class="list-item-body">
          <div class="notif-title-row">
            <span class="list-item-title">{{ tipoLabel(n.tipo_alerta) }}</span>
            <span class="badge" :class="nivelBadge(n.nivel_alerta)">{{ n.nivel_alerta }}</span>
          </div>
          <div class="list-item-subtitle">{{ n.apellido_paterno }} {{ n.nombres }} · {{ n.up_name }}</div>
          <div class="list-item-meta">{{ n.estado_alerta }} · {{ formatFecha(n.fecha_alerta) }}</div>
        </div>
        <div class="notif-time">{{ formatRelativo(n.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const notificaciones = ref<any[]>([])
const totalNoLeidas = ref(0)
const loading = ref(true)

async function cargar() {
  loading.value = true
  try {
    const data = await api.alertas.notificaciones()
    notificaciones.value = data.notificaciones
    totalNoLeidas.value = data.total_no_leidas
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function abrir(n: any) {
  if (!n.leida) {
    await api.alertas.marcarLeida(n.id).catch(() => {})
    n.leida = true
    totalNoLeidas.value = Math.max(0, totalNoLeidas.value - 1)
  }
  router.push({ name: 'AlertaDetalle', params: { id: n.alerta_id } })
}

async function leerTodas() {
  await api.alertas.marcarTodasLeidas().catch(() => {})
  notificaciones.value.forEach(n => (n.leida = true))
  totalNoLeidas.value = 0
}

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    helada: 'Helada', sequia: 'Sequía', lluvia_fuerte: 'Lluvia fuerte',
    viento_fuerte: 'Viento fuerte', otro: 'Otro',
  }
  return map[tipo] || tipo
}

function nivelBadge(nivel: string) {
  const m: Record<string, string> = { bajo: 'badge-green', medio: 'badge-yellow', alto: 'badge-red' }
  return m[nivel] || 'badge-gray'
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelativo(ts: string) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

onMounted(cargar)
</script>

<style scoped>
.notif-lista { display: flex; flex-direction: column; gap: .5rem; }

.notif-item { position: relative; }
.notif-unread { background: rgba(255, 149, 0, 0.04) !important; border-color: rgba(255, 149, 0, 0.15) !important; }

.notif-dot-wrap {
  position: relative; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.notif-dot-wrap .unread-indicator {
  position: absolute; top: -2px; right: -2px; z-index: 1;
}

.notif-level-icon {
  width: 40px; height: 40px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}

.notif-level-icon.bajo { background: rgba(52, 199, 89, 0.1); color: var(--color-green); }
.notif-level-icon.medio { background: rgba(255, 149, 0, 0.1); color: var(--color-orange); }
.notif-level-icon.alto { background: rgba(255, 59, 48, 0.1); color: var(--color-red); }

.notif-title-row { display: flex; align-items: center; gap: .5rem; }

.notif-time {
  font-size: .75rem; color: var(--color-text-tertiary);
  white-space: nowrap; flex-shrink: 0; align-self: flex-start;
  margin-top: 2px;
}
</style>
