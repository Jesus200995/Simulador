<template>
  <div class="inicio">
    <!-- Hero greeting -->
    <header class="inicio-hero">
      <div class="inicio-hero-inner">
        <div class="inicio-hero-row">
          <div class="inicio-hero-text">
            <p class="inicio-eyebrow">Inicio</p>
            <h1 class="inicio-greeting">¡Hola, {{ firstName }}!</h1>
            <p class="inicio-sub">Este es el resumen de hoy</p>
          </div>
          <button class="inicio-bell" @click="$router.push('/notificaciones')" aria-label="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span v-if="notifCount > 0" class="inicio-bell-dot">{{ notifCount > 9 ? '9+' : notifCount }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Stats grid -->
    <section class="inicio-stats">
      <div class="stat-card" @click="goTo(productoresRoute)">
        <p class="stat-label">{{ stats.productores_label || 'Productores' }}</p>
        <p class="stat-value" :class="{ skeleton: loading }">{{ loading ? '—' : formatNum(stats.productores) }}</p>
        <p class="stat-trend stat-trend-up" v-if="stats.productores_recientes">
          +{{ stats.productores_recientes }} esta semana
        </p>
        <p class="stat-trend" v-else-if="!loading">
          {{ productoresHint }}
        </p>
      </div>

      <div class="stat-card" @click="goTo(seguimientoRoute)">
        <p class="stat-label">{{ stats.seguimientos_label || 'Seguimientos' }}</p>
        <p class="stat-value" :class="{ skeleton: loading }">{{ loading ? '—' : formatNum(stats.seguimientos) }}</p>
        <p class="stat-trend stat-trend-warn" v-if="stats.seguimientos_pendientes">
          Pendientes: {{ stats.seguimientos_pendientes }}
        </p>
        <p class="stat-trend" v-else-if="!loading && stats.seguimientos > 0">
          Registrados
        </p>
        <p class="stat-trend" v-else-if="!loading">Sin registros</p>
      </div>

      <div v-if="!stats.alertas_hidden" class="stat-card" @click="goTo('/alertas')">
        <p class="stat-label">Alertas activas</p>
        <p class="stat-value" :class="{ skeleton: loading }">{{ loading ? '—' : formatNum(stats.alertas) }}</p>
        <p class="stat-trend stat-trend-danger" v-if="!loading && stats.alertas > 0">
          Requieren atención
        </p>
        <p class="stat-trend stat-trend-ok" v-else-if="!loading">Todo en orden</p>
      </div>

      <div class="stat-card" @click="goTo(bodegasRoute)">
        <p class="stat-label">{{ bodegasTitle }}</p>
        <p class="stat-value" :class="{ skeleton: loading }">{{ loading ? '—' : formatNum(stats.bodegas) }}</p>
        <p class="stat-trend" v-if="!loading">{{ stats.bodegas_label || 'En tu región' }}</p>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="inicio-actions">
      <h2 class="actions-title">Acciones rápidas</h2>
      <div class="actions-grid">
        <button v-for="a in quickActions" :key="a.key" class="action-card" @click="goTo(a.to)">
          <span class="action-icon" :class="'icon-' + a.color">
            <component :is="a.icon" />
          </span>
          <span class="action-label">{{ a.label }}</span>
        </button>
      </div>
    </section>

    <!-- Recent activity -->
    <section v-if="recientes.length > 0" class="inicio-recent">
      <div class="recent-header">
        <h2 class="actions-title">Actividad reciente</h2>
        <router-link to="/notificaciones" class="recent-link">Ver todo</router-link>
      </div>
      <div class="recent-list">
        <div v-for="r in recientes" :key="r.id" class="recent-item">
          <div class="recent-dot" :class="'dot-' + nivelToTone(r.nivel)"></div>
          <div class="recent-body">
            <p class="recent-title">{{ alertaTitulo(r.titulo) }}</p>
            <p class="recent-time">{{ formatTime(r.fecha) }} · {{ r.estado || 'pendiente' }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'

const auth = useAuthStore()
const router = useRouter()

const firstName = computed(() => {
  if (!auth.usuario?.nombre_completo) return roleLabel.value
  return auth.usuario.nombre_completo.split(' ')[0]
})

const roleLabel = computed(() => {
  const m: Record<string, string> = {
    productor: 'Productor', tecnico: 'Técnico', supervisor: 'Supervisor',
    bodeguero: 'Bodeguero', responsable: 'Responsable', admin: 'Admin',
  }
  return m[auth.rol] || 'Usuario'
})

const productoresRoute = computed(() => {
  if (auth.isSupervisor) return '/mis-productores'
  if (auth.isAdmin) return '/productor'
  if (auth.isBodeguero) return '/mis-bodegas'
  return '/mis-ups'
})

const seguimientoRoute = computed(() => {
  if (auth.isBodeguero) return '/mis-bodegas'
  return '/seguimiento'
})

const bodegasRoute = computed(() => {
  if (auth.isBodeguero) return '/mis-bodegas'
  return '/infraestructura'
})

const bodegasTitle = computed(() => {
  if (auth.isBodeguero) return 'Bodegas'
  if (auth.isAdmin) return 'Bodegas'
  if (auth.isSupervisor) return 'Bodegas'
  return 'Bodegas cercanas'
})

const productoresHint = computed(() => {
  if (auth.isProductor) return 'Tus unidades'
  if (auth.isSupervisor) return 'Productores vinculados'
  if (auth.isBodeguero) return 'Tus bodegas'
  return 'Total en sistema'
})

interface HomeStats {
  productores: number
  productores_label?: string
  productores_recientes?: number
  seguimientos: number
  seguimientos_label?: string
  seguimientos_pendientes: number
  ciclos?: number
  alertas: number
  alertas_hidden?: boolean
  bodegas: number
  bodegas_label?: string
}

const stats = ref<HomeStats>({
  productores: 0,
  seguimientos: 0,
  seguimientos_pendientes: 0,
  alertas: 0,
  bodegas: 0,
})

const loading = ref(true)
const recientes = ref<Array<{ id: number | string; titulo: string; nivel?: string; fecha: string; estado?: string }>>([])
const notifCount = ref(0)

// Icons as inline SVG components
const IconUserPlus = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '8.5', cy: '7', r: '4' }),
  h('line', { x1: '20', y1: '8', x2: '20', y2: '14' }),
  h('line', { x1: '23', y1: '11', x2: '17', y2: '11' }),
])
const IconClipboard = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M9 11l3 3L22 4' }),
  h('path', { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' }),
])
const IconPriceTag = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' }),
  h('line', { x1: '7', y1: '7', x2: '7.01', y2: '7' }),
])
const IconBell = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
  h('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' }),
])
const IconWarehouse = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M3 21V8l9-5 9 5v13' }),
  h('path', { d: 'M9 21V13h6v8' }),
])
const IconMap = () => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('polygon', { points: '1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6' }),
  h('line', { x1: '8', y1: '2', x2: '8', y2: '18' }),
  h('line', { x1: '16', y1: '6', x2: '16', y2: '22' }),
])

const quickActions = computed(() => {
  const items: Array<{ key: string; label: string; to: string; color: string; icon: any }> = []

  if (auth.isAdmin || auth.isSupervisor || auth.rol === 'tecnico') {
    items.push({ key: 'nuevo-prod', label: 'Registrar productor', to: '/productor/paso1', color: 'green', icon: IconUserPlus })
  }
  items.push({ key: 'seg', label: 'Seguimiento', to: '/seguimiento', color: 'teal', icon: IconClipboard })

  if (!auth.isBodeguero) {
    items.push({ key: 'precio', label: 'Registrar precio', to: '/precios/registrar', color: 'gold', icon: IconPriceTag })
    items.push({ key: 'alertas', label: 'Ver alertas', to: '/alertas', color: 'red', icon: IconBell })
  }

  if (auth.isBodeguero || auth.isAdmin) {
    items.push({ key: 'mis-bodegas', label: 'Mis bodegas', to: '/mis-bodegas', color: 'green', icon: IconWarehouse })
  }
  items.push({ key: 'mapa', label: 'Ver mapa', to: '/mapa', color: 'teal', icon: IconMap })

  return items.slice(0, 6)
})

function goTo(path: string) {
  router.push(path)
}

function formatNum(n: number) {
  if (n == null) return '0'
  return new Intl.NumberFormat('es-MX').format(n)
}

function formatTime(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    const diff = Date.now() - dt.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'ahora'
    if (min < 60) return `hace ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `hace ${h} h`
    return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  } catch {
    return d
  }
}

function nivelToTone(nivel?: string): string {
  if (nivel === 'alto') return 'danger'
  if (nivel === 'medio') return 'warn'
  if (nivel === 'bajo') return 'info'
  return 'info'
}

function alertaTitulo(tipo: string): string {
  const m: Record<string, string> = {
    helada: 'Helada',
    sequia: 'Sequía',
    lluvia_fuerte: 'Lluvia fuerte',
    viento_fuerte: 'Viento fuerte',
    otro: 'Alerta',
  }
  return m[tipo] || tipo
}

async function loadStats() {
  loading.value = true
  try {
    const res = await api.home.stats()
    stats.value = res.stats as HomeStats
    recientes.value = (res.stats as any).recientes ?? []
  } catch (e) {
    console.warn('No se pudieron cargar las estadísticas:', e)
  } finally {
    loading.value = false
  }
}

async function loadNotifs() {
  try {
    const r = await api.alertas.notificaciones()
    notifCount.value = r.total_no_leidas ?? 0
  } catch { /* noop */ }
}

onMounted(() => {
  loadStats()
  loadNotifs()
})
</script>

<style scoped>
.inicio {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 1rem;
}

/* ============ HERO ============ */
.inicio-hero {
  background: linear-gradient(160deg, var(--color-primary-darker) 0%, var(--color-primary) 55%, var(--color-primary-hover) 100%);
  padding: 1.5rem 1.25rem 2.5rem;
  border-radius: 0 0 28px 28px;
  position: relative;
  overflow: hidden;
}
.inicio-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 85% 15%, rgba(255,255,255,.08), transparent 45%);
  pointer-events: none;
}
.inicio-hero-inner {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}
.inicio-hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.inicio-eyebrow {
  font-size: .82rem;
  font-weight: 600;
  color: rgba(255,255,255,.7);
  margin: 0 0 .25rem;
  letter-spacing: -.01em;
}
.inicio-greeting {
  font-size: 1.55rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 .25rem;
  letter-spacing: -.02em;
  line-height: 1.15;
}
.inicio-sub {
  font-size: .92rem;
  color: rgba(255,255,255,.78);
  margin: 0;
  font-weight: 500;
}
.inicio-bell {
  position: relative;
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.16);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background .2s;
  flex-shrink: 0;
}
.inicio-bell:hover { background: rgba(255,255,255,.2); }
.inicio-bell-dot {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 18px; height: 18px;
  background: #FF3B30;
  color: #fff;
  border-radius: 99px;
  font-size: .62rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
  border: 2px solid var(--color-primary);
}

/* ============ STATS ============ */
.inicio-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .75rem;
  padding: 0 1.25rem;
  max-width: 720px;
  margin: -1.5rem auto 0;
  position: relative;
  z-index: 2;
}
.stat-card {
  background: #fff;
  border-radius: 18px;
  padding: 1rem 1.1rem;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  box-shadow: 0 6px 20px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  border: .5px solid rgba(0,0,0,.04);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.08); }
.stat-card:active { transform: scale(.98); }
.stat-label {
  font-size: .82rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  margin: 0 0 .35rem;
  letter-spacing: -.01em;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -.04em;
  line-height: 1;
}
.stat-value.skeleton {
  color: transparent;
  background: linear-gradient(90deg, #eee 0%, #f5f5f5 50%, #eee 100%);
  background-size: 200% 100%;
  animation: skeletonPulse 1.4s ease-in-out infinite;
  border-radius: 6px;
  display: inline-block;
  min-width: 50px;
}
@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.stat-trend {
  font-size: .72rem;
  font-weight: 600;
  margin: .35rem 0 0;
  color: var(--color-text-tertiary);
}
.stat-trend-up { color: var(--color-success); }
.stat-trend-warn { color: var(--color-warning); }
.stat-trend-danger { color: var(--color-error); }
.stat-trend-ok { color: var(--color-success); }

/* ============ ACTIONS ============ */
.inicio-actions {
  padding: 1.5rem 1.25rem 0;
  max-width: 720px;
  margin: 0 auto;
}
.actions-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 .75rem;
  letter-spacing: -.015em;
}
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .75rem;
}
.action-card {
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: .75rem;
  cursor: pointer;
  border: .5px solid rgba(0,0,0,.05);
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  text-align: left;
  font-family: var(--font-family);
  transition: transform .15s, box-shadow .2s;
  min-height: 64px;
}
.action-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
.action-card:active { transform: scale(.97); }

.action-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.icon-green { background: rgba(15, 81, 50, .12); color: var(--color-primary); }
.icon-teal { background: rgba(0, 199, 190, .14); color: #0E8C84; }
.icon-gold { background: rgba(188, 149, 92, .15); color: #A07A3A; }
.icon-red { background: rgba(255, 59, 48, .12); color: var(--color-error); }

.action-label {
  font-size: .88rem;
  font-weight: 650;
  color: var(--color-text);
  line-height: 1.2;
  letter-spacing: -.015em;
}

/* ============ RECENT ============ */
.inicio-recent {
  padding: 1.5rem 1.25rem 1rem;
  max-width: 720px;
  margin: 0 auto;
}
.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;
}
.recent-link {
  font-size: .82rem;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
.recent-list {
  background: #fff;
  border-radius: 16px;
  padding: .25rem .75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  border: .5px solid rgba(0,0,0,.05);
}
.recent-item {
  display: flex; align-items: center; gap: .75rem;
  padding: .85rem .25rem;
  border-bottom: .5px solid var(--color-separator);
}
.recent-item:last-child { border-bottom: none; }
.recent-dot { width: 10px; height: 10px; border-radius: 99px; flex-shrink: 0; }
.dot-info { background: var(--color-blue); }
.dot-warn { background: var(--color-warning); }
.dot-danger { background: var(--color-error); }
.dot-success { background: var(--color-success); }
.recent-body { flex: 1; min-width: 0; }
.recent-title {
  font-size: .88rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-time {
  font-size: .72rem;
  color: var(--color-text-tertiary);
  margin: .15rem 0 0;
}

/* ============ RESPONSIVE ============ */
@media (min-width: 700px) {
  .inicio-stats { grid-template-columns: repeat(4, 1fr); }
  .actions-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .inicio-hero { padding: 2.25rem 2rem 3rem; border-radius: 0 0 36px 36px; }
  .inicio-greeting { font-size: 2rem; }
  .inicio-sub { font-size: 1rem; }
  .inicio-stats { padding: 0 2rem; gap: 1rem; }
  .stat-value { font-size: 2.1rem; }
  .inicio-actions { padding: 2rem 2rem 0; }
  .actions-grid { grid-template-columns: repeat(6, 1fr); gap: 1rem; }
  .action-card { flex-direction: column; text-align: center; padding: 1.25rem .75rem; min-height: 110px; }
  .action-label { font-size: .82rem; }
  .inicio-recent { padding: 2rem; }
}
</style>
