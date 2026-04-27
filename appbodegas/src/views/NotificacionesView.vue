<template>
  <div class="page-container narrow notif-page">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Notificaciones</h1>
          <p class="view-subtitle">Alertas y actualizaciones recientes</p>
        </div>
        <div class="view-header-actions">
          <button v-if="totalNoLeidas > 0" class="btn btn-ghost btn-sm" @click="leerTodas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Leer todas
          </button>
        </div>
      </div>
    </div>

    <!-- Unread count pill -->
    <div v-if="!loading && totalNoLeidas > 0" class="unread-banner">
      <span class="unread-pulse"></span>
      {{ totalNoLeidas }} sin leer
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="notif-lista">
      <div v-for="k in 5" :key="k" class="notif-card notif-skel">
        <div class="skel-icon skel-shimmer"></div>
        <div style="flex:1">
          <div class="skel-shimmer" style="width:55%;height:13px;border-radius:6px;margin-bottom:7px"></div>
          <div class="skel-shimmer" style="width:75%;height:10px;border-radius:5px;margin-bottom:5px"></div>
          <div class="skel-shimmer" style="width:35%;height:9px;border-radius:5px"></div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="notificaciones.length === 0" class="notif-empty">
      <div class="notif-empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <p class="notif-empty-title">Todo al día</p>
      <p class="notif-empty-sub">No tienes notificaciones pendientes</p>
    </div>

    <!-- List -->
    <TransitionGroup v-else name="notif-anim" tag="div" class="notif-lista">
      <div
        v-for="n in notificaciones"
        :key="n.id"
        :class="['notif-card', { unread: !n.leida }]"
        @click="abrir(n)"
      >
        <!-- Unread dot -->
        <span v-if="!n.leida" class="notif-unread-dot"></span>

        <!-- Weather icon -->
        <div class="notif-icon" :class="'tipo-' + n.tipo_alerta" v-html="tipoIcon(n.tipo_alerta)"></div>

        <!-- Content -->
        <div class="notif-body">
          <div class="notif-row-top">
            <span class="notif-tipo">{{ tipoLabel(n.tipo_alerta) }}</span>
            <span class="notif-nivel" :class="'nivel-' + n.nivel_alerta">
              <span class="nivel-dot" :class="{ pulse: !n.leida }"></span>
              {{ nivelLabel(n.nivel_alerta) }}
            </span>
          </div>
          <div class="notif-who">
            <span v-if="n.up_name">{{ n.up_name }}</span>
            <span v-if="n.apellido_paterno"> · {{ n.apellido_paterno }} {{ n.nombres }}</span>
          </div>
          <div class="notif-row-bottom">
            <span class="notif-estado" :class="'est-' + n.estado_alerta">{{ estadoLabel(n.estado_alerta) }}</span>
            <span class="notif-fecha">{{ formatFecha(n.fecha_alerta) }}</span>
          </div>
        </div>

        <!-- Time + chevron -->
        <div class="notif-end">
          <span class="notif-ago">{{ formatRelativo(n.created_at) }}</span>
          <svg class="notif-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </TransitionGroup>
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
    viento_fuerte: 'Viento fuerte', granizo: 'Granizo', otro: 'Otro',
  }
  return map[tipo] || tipo
}

function tipoIcon(tipo: string): string {
  const icons: Record<string, string> = {
    helada: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M17 5l-5 3-5-3M17 19l-5-3-5 3M2 12h20M5 7l3 5-3 5M19 7l-3 5 3 5"/></svg>',
    sequia: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    lluvia_fuerte: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="16" x2="16" y2="20"/></svg>',
    viento_fuerte: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
    granizo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><circle cx="8" cy="19" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="16" cy="19" r="1"/></svg>',
  }
  return icons[tipo] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
}

function nivelLabel(nivel: string) {
  const m: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }
  return m[nivel] || nivel
}

function estadoLabel(estado: string) {
  const m: Record<string, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', descartada: 'Descartada', atendida: 'Atendida' }
  return m[estado] || estado
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelativo(ts: string) {
  if (!ts) return ''
  const t = new Date(ts).getTime()
  if (isNaN(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Hace ${d}d`
  return formatFecha(ts)
}

onMounted(cargar)
</script>

<style scoped>
/* ── Unread banner ── */
.unread-banner {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 99px; margin-bottom: .75rem;
  background: rgba(255,149,0,.08); color: #C05621;
  font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
}
.unread-pulse {
  width: 7px; height: 7px; border-radius: 50%; background: #FF9500;
  animation: u-pulse 1.6s ease-in-out infinite;
}
@keyframes u-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .35; transform: scale(.65); }
}

/* ── List ── */
.notif-lista { display: flex; flex-direction: column; gap: .5rem; }

/* ── Card ── */
.notif-card {
  position: relative;
  display: flex; align-items: flex-start; gap: .75rem;
  padding: .875rem 1rem;
  background: var(--color-surface);
  border-radius: 14px;
  border: .5px solid rgba(0,0,0,.05);
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
  cursor: pointer;
  transition: transform .2s var(--ease-out), box-shadow .2s, background .2s;
}
.notif-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,.07);
}
.notif-card:active { transform: scale(.995); }
.notif-card.unread {
  background: linear-gradient(135deg, rgba(255,149,0,.03), rgba(255,204,0,.02));
  border-color: rgba(255,149,0,.12);
}

/* Unread dot */
.notif-unread-dot {
  position: absolute; top: 10px; left: 10px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #FF9500;
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 6px rgba(255,149,0,.4);
  z-index: 2;
}

/* ── Icon ── */
.notif-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(0,0,0,.04); color: var(--color-text-secondary);
}
.notif-icon.tipo-helada { background: rgba(96,165,250,.12); color: #3B82F6; }
.notif-icon.tipo-sequia { background: rgba(251,191,36,.12); color: #D97706; }
.notif-icon.tipo-lluvia_fuerte { background: rgba(59,130,246,.12); color: #2563EB; }
.notif-icon.tipo-viento_fuerte { background: rgba(139,92,246,.12); color: #7C3AED; }
.notif-icon.tipo-granizo { background: rgba(148,163,184,.12); color: #64748B; }
.notif-icon.tipo-otro { background: rgba(251,146,60,.1); color: #EA580C; }

/* ── Body ── */
.notif-body { flex: 1; min-width: 0; }
.notif-row-top { display: flex; align-items: center; gap: .4rem; margin-bottom: .2rem; }
.notif-tipo { font-size: .875rem; font-weight: 700; color: var(--color-text); letter-spacing: -.015em; }

.notif-nivel {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 1px 7px; border-radius: 99px;
  font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
}
.nivel-bajo { background: rgba(52,199,89,.1); color: #1D6B34; }
.nivel-medio { background: rgba(255,204,0,.15); color: #92600C; }
.nivel-alto { background: rgba(255,59,48,.1); color: #D32F2F; }
.nivel-dot {
  width: 5px; height: 5px; border-radius: 50%; background: currentColor;
}
.nivel-dot.pulse { animation: u-pulse 1.6s ease-in-out infinite; }

.notif-who {
  font-size: .75rem; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: .25rem;
}

.notif-row-bottom { display: flex; align-items: center; gap: .4rem; }
.notif-estado {
  padding: 1px 6px; border-radius: 5px;
  font-size: .6rem; font-weight: 650; text-transform: capitalize;
}
.est-pendiente { background: rgba(255,149,0,.1); color: #C05621; }
.est-confirmada { background: rgba(0,122,255,.1); color: #007AFF; }
.est-descartada { background: rgba(0,0,0,.05); color: var(--color-text-tertiary); }
.est-atendida { background: rgba(52,199,89,.1); color: #1D6B34; }
.notif-fecha { font-size: .65rem; color: var(--color-text-tertiary); }

/* ── End ── */
.notif-end {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: .25rem; flex-shrink: 0; padding-top: 1px;
}
.notif-ago { font-size: .625rem; color: var(--color-text-tertiary); white-space: nowrap; }
.notif-chev { color: var(--color-text-tertiary); opacity: .25; transition: opacity .2s; }
.notif-card:hover .notif-chev { opacity: .6; }

/* ── Empty ── */
.notif-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 3.5rem 1rem; text-align: center;
}
.notif-empty-icon {
  width: 76px; height: 76px; border-radius: 22px;
  background: rgba(0,0,0,.03);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-tertiary); margin-bottom: 1rem;
  animation: notif-bob 3s ease-in-out infinite;
}
@keyframes notif-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.notif-empty-title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin-bottom: .2rem; }
.notif-empty-sub { font-size: .8125rem; color: var(--color-text-tertiary); }

/* ── Skeleton ── */
.notif-skel { pointer-events: none; }
.skel-icon { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; }
.skel-shimmer {
  background: linear-gradient(90deg, rgba(0,0,0,.04) 25%, rgba(0,0,0,.08) 50%, rgba(0,0,0,.04) 75%);
  background-size: 200% 100%;
  animation: sk-shim 1.5s ease-in-out infinite;
}
@keyframes sk-shim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Transitions ── */
.notif-anim-enter-active { transition: all .3s cubic-bezier(.33,1,.68,1); }
.notif-anim-leave-active { transition: all .2s ease-in; }
.notif-anim-enter-from { opacity: 0; transform: translateY(10px); }
.notif-anim-leave-to { opacity: 0; transform: translateX(-12px); }
.notif-anim-move { transition: transform .3s ease; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .notif-card { padding: .75rem; gap: .625rem; }
  .notif-icon { width: 36px; height: 36px; border-radius: 10px; }
  .notif-icon :deep(svg) { width: 17px; height: 17px; }
  .notif-end { display: none; }
  .notif-tipo { font-size: .8125rem; }
}
</style>
