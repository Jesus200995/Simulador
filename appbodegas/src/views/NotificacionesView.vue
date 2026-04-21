<template>
  <div class="notif-page">
    <div class="page-header">
      <h1>Notificaciones</h1>
      <button v-if="totalNoLeidas > 0" class="btn-leer-todas" @click="leerTodas">
        Marcar todas como leídas
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando notificaciones...</div>
    <div v-else-if="notificaciones.length === 0" class="empty">No tienes notificaciones.</div>

    <div v-else class="lista">
      <div
        v-for="n in notificaciones"
        :key="n.id"
        :class="['notif-item', { 'no-leida': !n.leida }]"
        @click="abrir(n)"
      >
        <div class="notif-icon">
          <span :class="['nivel-dot', n.nivel_alerta]"></span>
        </div>
        <div class="notif-body">
          <div class="notif-titulo">
            <strong>{{ tipoLabel(n.tipo_alerta) }}</strong>
            <span :class="['nivel-badge', n.nivel_alerta]">{{ n.nivel_alerta }}</span>
          </div>
          <div class="notif-meta">
            {{ n.apellido_paterno }} {{ n.nombres }} · {{ n.up_name }}
          </div>
          <div class="notif-estado">
            Estado: <span :class="['estado-badge', n.estado_alerta]">{{ n.estado_alerta }}</span>
            · {{ formatFecha(n.fecha_alerta) }}
          </div>
        </div>
        <div class="notif-fecha">{{ formatRelativo(n.created_at) }}</div>
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
.notif-page { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin: 0; }
.btn-leer-todas { background: none; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.8rem; color: #718096; cursor: pointer; }
.loading, .empty { text-align: center; color: #718096; padding: 2rem; }
.lista { display: flex; flex-direction: column; gap: 0.5rem; }
.notif-item {
  display: flex; align-items: flex-start; gap: 0.75rem;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 0.9rem 1rem; cursor: pointer; transition: box-shadow 0.15s;
}
.notif-item.no-leida { border-left: 3px solid #ed8936; background: #fffaf0; }
.notif-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
.notif-icon { padding-top: 4px; }
.nivel-dot { display: block; width: 10px; height: 10px; border-radius: 50%; }
.nivel-dot.bajo { background: #48bb78; }
.nivel-dot.medio { background: #ed8936; }
.nivel-dot.alto { background: #e53e3e; }
.notif-body { flex: 1; }
.notif-titulo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem; }
.notif-titulo strong { font-size: 0.95rem; color: #2d3748; }
.nivel-badge { padding: 1px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
.nivel-badge.bajo { background: #c6f6d5; color: #276749; }
.nivel-badge.medio { background: #fef3c7; color: #92400e; }
.nivel-badge.alto { background: #fed7d7; color: #9b2c2c; }
.notif-meta { font-size: 0.8rem; color: #718096; margin-bottom: 0.2rem; }
.notif-estado { font-size: 0.78rem; color: #a0aec0; }
.estado-badge { font-weight: 600; color: #4a5568; }
.notif-fecha { font-size: 0.75rem; color: #a0aec0; white-space: nowrap; }
</style>
