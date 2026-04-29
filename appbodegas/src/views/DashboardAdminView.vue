<template>
  <AppShell>
    <div class="dash">
      <!-- ═══ HEADER ═══ -->
      <header class="dash-header">
        <div>
          <h1 class="dash-title">Dashboard administrativo</h1>
          <p class="dash-subtitle">Vision general del sistema</p>
        </div>
        <div class="header-actions">
          <span class="header-date">{{ fechaActual }}</span>
          <button class="btn-glass" @click="recargarTodo" :class="{ spinning: cargando }">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </header>

      <!-- ═══ KPI CARDS ═══ -->
      <div v-if="loadingResumen" class="loader-row"><div class="loader"></div></div>
      <section v-else-if="resumen" class="kpi-row">
        <div class="kpi" v-for="k in kpis" :key="k.key">
          <div class="kpi-icon" :style="{ background: k.bg, color: k.color }">
            <span v-html="k.icon"></span>
          </div>
          <div class="kpi-body">
            <span class="kpi-val">{{ k.fmt(resumen[k.key]) }}</span>
            <span class="kpi-lbl">{{ k.label }}</span>
          </div>
        </div>
      </section>

      <!-- ═══ MAP + INSIGHTS ═══ -->
      <section class="map-section glass-card">
        <div class="map-header">
          <h2 class="section-heading">Mapa general del sistema</h2>
          <nav class="map-tabs">
            <button v-for="t in mapTabs" :key="t" class="map-tab" :class="{ active: mapTab === t }" @click="mapTab = t">{{ t }}</button>
          </nav>
        </div>
        <div class="map-body">
          <div ref="mapContainer" class="map-container"></div>
          <aside class="insights-panel">
            <h3 class="insights-title">Insights principales</h3>
            <ul class="insights-list" v-if="insights.length">
              <li v-for="(ins, i) in insights" :key="i" class="insight-item">
                <span class="insight-dot" :class="ins.type"></span>
                <span>{{ ins.text }}</span>
              </li>
            </ul>
            <p v-else class="insights-empty">Cargando datos...</p>
          </aside>
        </div>
      </section>

      <!-- ═══ CHARTS ROW ═══ -->
      <section class="charts-row">
        <div class="glass-card chart-card">
          <h3 class="card-heading">Produccion por estado</h3>
          <div class="chart-wrap">
            <Bar v-if="produccionChartData" :data="produccionChartData" :options="barOpts" />
            <div v-else class="chart-placeholder">Sin datos</div>
          </div>
        </div>
        <div class="glass-card chart-card">
          <h3 class="card-heading">Distribucion de alertas</h3>
          <div class="chart-wrap chart-wrap-sm">
            <Doughnut v-if="alertasChartData" :data="alertasChartData" :options="doughnutOpts" />
            <div v-else class="chart-placeholder">Sin datos</div>
          </div>
        </div>
      </section>

      <!-- ═══ STATE TABLE ═══ -->
      <section class="glass-card table-section">
        <h2 class="section-heading">Resumen por estado</h2>
        <div class="table-wrap">
          <table class="dt">
            <thead>
              <tr>
                <th>Estado</th>
                <th>UPs</th>
                <th>Productores</th>
                <th>Superficie (ha)</th>
                <th>Produccion est. (ton)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in estadoRows" :key="row.estado">
                <td class="td-state">{{ row.estado || '—' }}</td>
                <td>{{ row.ups }}</td>
                <td>{{ row.productores }}</td>
                <td>{{ fmtNum(row.superficie_ha) }}</td>
                <td>{{ fmtNum(row.produccion_ton) }}</td>
              </tr>
              <tr v-if="!estadoRows.length">
                <td colspan="5" class="td-empty">Sin datos disponibles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ═══ INFRAESTRUCTURA + PRECIOS ROW ═══ -->
      <section class="detail-row">
        <div class="glass-card detail-card">
          <h3 class="card-heading">Infraestructura</h3>
          <div v-if="infraestructura" class="mini-stats">
            <div class="mini-stat">
              <span class="ms-val">{{ infraestructura.bodegas_aprobadas }}</span>
              <span class="ms-lbl">Bodegas</span>
            </div>
            <div class="mini-stat">
              <span class="ms-val">{{ fmtNum(infraestructura.capacidad_total_ton) }}</span>
              <span class="ms-lbl">Capacidad ton</span>
            </div>
            <div class="mini-stat">
              <span class="ms-val">{{ fmtNum(infraestructura.stock_actual_ton) }}</span>
              <span class="ms-lbl">Stock ton</span>
            </div>
          </div>
          <div v-if="infraestructura" class="ocu-bar-wrap">
            <div class="ocu-label">Ocupacion <strong>{{ infraestructura.ocupacion_pct }}%</strong></div>
            <div class="ocu-track"><div class="ocu-fill" :class="ocuClass" :style="{ width: infraestructura.ocupacion_pct + '%' }"></div></div>
          </div>
          <div v-else class="chart-placeholder">Cargando...</div>
        </div>

        <div class="glass-card detail-card">
          <h3 class="card-heading">Precios recientes</h3>
          <div v-if="precios?.recientes?.length" class="precio-list">
            <div v-for="p in precios.recientes" :key="p.tipo_precio" class="precio-row">
              <span class="pr-badge" :class="tipoPrecioClass(p.tipo_precio)">{{ tipoPrecioLabel(p.tipo_precio) }}</span>
              <span class="pr-val">${{ fmtPrice(p.precio) }}/ton</span>
              <span class="pr-meta">{{ p.tipo_maiz }}</span>
            </div>
          </div>
          <div v-else class="chart-placeholder">Sin precios</div>
        </div>

        <div class="glass-card detail-card">
          <h3 class="card-heading">Operacion</h3>
          <div v-if="operacion" class="roles-list">
            <div v-for="r in operacion.usuarios_por_rol" :key="r.rol" class="role-item">
              <span class="ri-name">{{ rolLabel(r.rol) }}</span>
              <span class="ri-count">{{ r.total }}</span>
            </div>
          </div>
          <div v-if="operacion" class="calidad-mini">
            <div class="cm-row" v-for="q in calidadItems" :key="q.key">
              <span class="cm-lbl">{{ q.label }}</span>
              <div class="cm-track"><div class="cm-fill" :style="{ width: q.pct + '%' }"></div></div>
              <span class="cm-pct">{{ q.pct }}%</span>
            </div>
          </div>
          <div v-else class="chart-placeholder">Cargando...</div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { api } from '@/services/api'
import mapboxgl from 'mapbox-gl'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const cargando = ref(false)
const loadingResumen = ref(false)
const resumen = ref<any>(null)
const produccion = ref<any>(null)
const infraestructura = ref<any>(null)
const precios = ref<any>(null)
const alertasData = ref<any>(null)
const operacion = ref<any>(null)
const mapaData = ref<any>(null)

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []
const mapTab = ref('UPs')
const mapTabs = ['UPs', 'Bodegas']

const fechaActual = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)

const kpis = [
  { key: 'productores', label: 'Productores activos', bg: 'rgba(26,92,56,.08)', color: '#15803d', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', fmt: (v: number) => fmtCompact(v) },
  { key: 'ups', label: 'UPs registradas', bg: 'rgba(37,99,235,.08)', color: '#2563eb', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', fmt: (v: number) => fmtCompact(v) },
  { key: 'superficie_ha', label: 'Hectareas sembradas', bg: 'rgba(14,148,148,.08)', color: '#0e9494', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>', fmt: (v: number) => fmtCompact(v) + ' ha' },
  { key: 'bodegas_activas', label: 'Bodegas activas', bg: 'rgba(124,58,237,.08)', color: '#7c3aed', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>', fmt: (v: number) => String(v) },
  { key: 'alertas_pendientes', label: 'Alertas activas', bg: 'rgba(220,38,38,.08)', color: '#dc2626', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', fmt: (v: number) => String(v) },
  { key: 'ciclos_activos', label: 'Ciclos activos', bg: 'rgba(217,119,6,.08)', color: '#d97706', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>', fmt: (v: number) => String(v) },
]

const estadoRows = computed(() => mapaData.value?.por_estado ?? [])

const insights = computed(() => {
  const arr: { text: string; type: string }[] = []
  const estados = mapaData.value?.por_estado ?? []
  if (estados.length > 0) {
    const top = estados[0]
    const totalProd = estados.reduce((s: number, e: any) => s + Number(e.produccion_ton || 0), 0)
    const pct = totalProd > 0 ? Math.round((Number(top.produccion_ton) / totalProd) * 100) : 0
    arr.push({ text: `${top.estado} concentra el ${pct}% de produccion estimada.`, type: 'green' })
  }
  if (resumen.value?.alertas_pendientes > 0)
    arr.push({ text: `${resumen.value.alertas_pendientes} alertas pendientes por atender.`, type: 'red' })
  if (infraestructura.value)
    arr.push({ text: `Ocupacion de bodegas al ${infraestructura.value.ocupacion_pct}%.`, type: infraestructura.value.ocupacion_pct > 70 ? 'amber' : 'blue' })
  if (resumen.value)
    arr.push({ text: `${resumen.value.supervisores_activos} supervisores activos monitoreando.`, type: 'blue' })
  return arr
})

const produccionChartData = computed(() => {
  const rows = mapaData.value?.por_estado?.slice(0, 8) ?? []
  if (!rows.length) return null
  return {
    labels: rows.map((r: any) => r.estado?.substring(0, 12) || '—'),
    datasets: [{
      label: 'Superficie (ha)',
      data: rows.map((r: any) => Number(r.superficie_ha)),
      backgroundColor: 'rgba(26,92,56,.65)',
      borderRadius: 6,
    }],
  }
})

const alertasChartData = computed(() => {
  const niveles = alertasData.value?.por_nivel ?? []
  if (!niveles.length) return null
  const colors: Record<string, string> = { critico: '#dc2626', alto: '#f59e0b', medio: '#3b82f6', bajo: '#22c55e' }
  return {
    labels: niveles.map((n: any) => n.nivel_alerta),
    datasets: [{
      data: niveles.map((n: any) => n.total),
      backgroundColor: niveles.map((n: any) => colors[n.nivel_alerta] || '#94a3b8'),
      borderWidth: 0,
    }],
  }
})

const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false } } } }
const doughnutOpts = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } } }

const ocuClass = computed(() => {
  const p = infraestructura.value?.ocupacion_pct ?? 0
  return p >= 90 ? 'ocu-red' : p >= 70 ? 'ocu-amber' : 'ocu-green'
})

const calidadItems = computed(() => {
  const c = operacion.value?.calidad_datos
  if (!c) return []
  return [
    { key: 'nombre', label: 'Con nombre', pct: c.con_nombre_pct },
    { key: 'area', label: 'Con area', pct: c.con_area_pct },
    { key: 'ciclo', label: 'Con ciclo', pct: c.con_ciclo_pct },
    { key: 'cultivo', label: 'Con cultivo', pct: c.con_cultivo_pct },
  ]
})

function fmtCompact(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + ' M'
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' K'
  return String(v)
}
function fmtNum(v: any): string { return Number(v || 0).toLocaleString('es-MX') }
function fmtPrice(v: any): string { return Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }
function tipoPrecioLabel(t: string) { return ({ observado: 'Parcela', bodega: 'Bodega', mercado_internacional: 'Internacional' } as any)[t] || t }
function tipoPrecioClass(t: string) { return ({ observado: 'pr-green', bodega: 'pr-blue', mercado_internacional: 'pr-purple' } as any)[t] || '' }
function rolLabel(r: string) { return ({ admin: 'Admin', supervisor: 'Supervisor', productor: 'Productor', bodeguero: 'Bodeguero', responsable: 'Responsable', tecnico: 'Tecnico' } as any)[r] || r }

// ── Map ──
function initMap() {
  if (!mapContainer.value || map) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-102.5, 23.5],
    zoom: 4.3,
    attributionControl: false,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.on('load', () => updateMarkers())
}

function clearMarkers() { markers.forEach(m => m.remove()); markers.length = 0 }

function updateMarkers() {
  clearMarkers()
  if (!map || !mapaData.value) return
  const items = mapTab.value === 'UPs' ? (mapaData.value.ups || []) : (mapaData.value.bodegas || [])
  const color = mapTab.value === 'UPs' ? '#15803d' : '#7c3aed'
  items.forEach((item: any) => {
    if (!item.lng || !item.lat) return
    const el = document.createElement('div')
    el.style.cssText = `width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer;`
    const popup = new mapboxgl.Popup({ offset: 12, maxWidth: '200px' })
      .setHTML(`<strong>${item.up_name || item.nombre || '—'}</strong><br><small>${item.state_name || item.estado || ''}</small>`)
    const marker = new mapboxgl.Marker({ element: el }).setLngLat([Number(item.lng), Number(item.lat)]).setPopup(popup).addTo(map!)
    markers.push(marker)
  })
}

watch(mapTab, () => updateMarkers())

// ── Data loading ──
async function loadAll() {
  loadingResumen.value = true
  const results = await Promise.allSettled([
    api.dashboardAdmin.resumen(),
    api.dashboardAdmin.produccion(),
    api.dashboardAdmin.infraestructura(),
    api.dashboardAdmin.precios(),
    api.dashboardAdmin.alertas(),
    api.dashboardAdmin.operacion(),
    api.dashboardAdmin.mapa(),
  ])
  resumen.value = results[0].status === 'fulfilled' ? results[0].value : null
  produccion.value = results[1].status === 'fulfilled' ? results[1].value : null
  infraestructura.value = results[2].status === 'fulfilled' ? results[2].value : null
  precios.value = results[3].status === 'fulfilled' ? results[3].value : null
  alertasData.value = results[4].status === 'fulfilled' ? results[4].value : null
  operacion.value = results[5].status === 'fulfilled' ? results[5].value : null
  mapaData.value = results[6].status === 'fulfilled' ? results[6].value : null
  loadingResumen.value = false
  await nextTick()
  initMap()
  if (map?.loaded()) updateMarkers()
}

async function recargarTodo() {
  cargando.value = true
  resumen.value = null; produccion.value = null; infraestructura.value = null
  precios.value = null; alertasData.value = null; operacion.value = null; mapaData.value = null
  clearMarkers()
  await loadAll()
  cargando.value = false
}

onMounted(() => loadAll())
onUnmounted(() => { if (map) { map.remove(); map = null } })
</script>

<style scoped>
/* ═══════════════════════════════════════════
   Apple 2026 — Glassmorphism Dashboard
   ═══════════════════════════════════════════ */
.dash {
  max-width: 1320px;
  margin: 0 auto;
  padding: 28px 24px 72px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Glass card base ── */
.glass-card {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 18px;
  box-shadow: 0 2px 16px rgba(0,0,0,.04), 0 0.5px 0 rgba(255,255,255,.6) inset;
  padding: 22px 24px;
}

/* ── Header ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.dash-title { font-size: 1.55rem; font-weight: 700; color: #111; margin: 0; letter-spacing: -.02em; }
.dash-subtitle { font-size: .82rem; color: #6b7280; margin: 2px 0 0; }
.header-actions { display: flex; align-items: center; gap: 14px; }
.header-date { font-size: .78rem; color: #9ca3af; text-transform: capitalize; }
.btn-glass {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,.08); background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px); cursor: pointer; color: #374151;
  transition: all .15s;
}
.btn-glass:hover { background: rgba(255,255,255,.95); box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.btn-glass.spinning svg { animation: spin .8s linear infinite; }

/* ── KPI Row ── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}
.kpi {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px;
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 16px;
  box-shadow: 0 1px 8px rgba(0,0,0,.03);
  transition: transform .15s, box-shadow .15s;
}
.kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.07); }
.kpi .kpi-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-body { display: flex; flex-direction: column; min-width: 0; }
.kpi-val { font-size: 1.35rem; font-weight: 700; line-height: 1.1; color: #111; letter-spacing: -.01em; }
.kpi-lbl { font-size: .7rem; color: #6b7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Map Section ── */
.map-section { padding: 0; overflow: hidden; }
.map-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 14px; flex-wrap: wrap; gap: 10px;
}
.section-heading { font-size: 1.05rem; font-weight: 650; color: #111; margin: 0; }
.map-tabs { display: flex; gap: 4px; }
.map-tab {
  padding: 6px 16px; border-radius: 99px; border: none;
  font-size: .8rem; font-weight: 550; cursor: pointer;
  background: rgba(0,0,0,.04); color: #6b7280; transition: all .15s;
}
.map-tab.active { background: #1A5C38; color: #fff; }
.map-tab:hover:not(.active) { background: rgba(0,0,0,.08); }
.map-body { display: flex; min-height: 380px; }
.map-container { flex: 1; min-height: 380px; }
.insights-panel {
  width: 260px; flex-shrink: 0;
  padding: 20px 22px;
  border-left: 1px solid rgba(0,0,0,.06);
  display: flex; flex-direction: column; gap: 14px;
}
.insights-title { font-size: .85rem; font-weight: 600; color: #111; margin: 0; }
.insights-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.insight-item { display: flex; align-items: flex-start; gap: 8px; font-size: .8rem; color: #374151; line-height: 1.4; }
.insight-dot {
  width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
}
.insight-dot.green { background: #22c55e; }
.insight-dot.red { background: #ef4444; }
.insight-dot.amber { background: #f59e0b; }
.insight-dot.blue { background: #3b82f6; }
.insights-empty { font-size: .8rem; color: #9ca3af; margin: 0; }

/* ── Charts Row ── */
.charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; }
.chart-card { display: flex; flex-direction: column; }
.card-heading { font-size: .92rem; font-weight: 600; color: #111; margin: 0 0 16px; }
.chart-wrap { height: 220px; position: relative; }
.chart-wrap-sm { height: 220px; }
.chart-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: .85rem; }

/* ── State Table ── */
.table-section { padding-bottom: 10px; }
.table-wrap { overflow-x: auto; margin-top: 12px; }
.dt { width: 100%; border-collapse: collapse; font-size: .84rem; }
.dt thead tr { border-bottom: 2px solid #e5e7eb; }
.dt th {
  padding: 10px 16px; text-align: left; font-weight: 600;
  color: #6b7280; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em;
  white-space: nowrap;
}
.dt td { padding: 11px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; }
.dt tbody tr:last-child td { border-bottom: none; }
.dt tbody tr { transition: background .1s; }
.dt tbody tr:hover td { background: rgba(26,92,56,.03); }
.td-state { font-weight: 600; color: #111; }
.td-empty { text-align: center; color: #9ca3af; padding: 28px 16px !important; }

/* ── Detail Row (3 cols) ── */
.detail-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.detail-card { display: flex; flex-direction: column; gap: 14px; }
.mini-stats { display: flex; gap: 12px; flex-wrap: wrap; }
.mini-stat {
  flex: 1; min-width: 80px; text-align: center;
  padding: 12px 8px; border-radius: 12px;
  background: rgba(0,0,0,.02);
}
.ms-val { display: block; font-size: 1.15rem; font-weight: 700; color: #111; }
.ms-lbl { display: block; font-size: .68rem; color: #6b7280; margin-top: 2px; }

/* Ocupacion bar */
.ocu-bar-wrap { margin-top: 4px; }
.ocu-label { font-size: .8rem; color: #374151; margin-bottom: 6px; }
.ocu-track { height: 8px; border-radius: 99px; background: #e5e7eb; overflow: hidden; }
.ocu-fill { height: 100%; border-radius: 99px; transition: width .6s ease; }
.ocu-green { background: #22c55e; }
.ocu-amber { background: #f59e0b; }
.ocu-red { background: #ef4444; }

/* Precios list */
.precio-list { display: flex; flex-direction: column; gap: 10px; }
.precio-row { display: flex; align-items: center; gap: 10px; }
.pr-badge {
  font-size: .68rem; font-weight: 600; padding: 2px 8px; border-radius: 99px;
}
.pr-green { background: rgba(22,163,74,.1); color: #16a34a; }
.pr-blue { background: rgba(37,99,235,.1); color: #2563eb; }
.pr-purple { background: rgba(124,58,237,.1); color: #7c3aed; }
.pr-val { font-size: .95rem; font-weight: 700; color: #111; }
.pr-meta { font-size: .75rem; color: #9ca3af; }

/* Roles & calidad */
.roles-list { display: flex; flex-wrap: wrap; gap: 8px; }
.role-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 8px; background: rgba(0,0,0,.03);
  font-size: .8rem;
}
.ri-name { color: #374151; }
.ri-count { font-weight: 700; color: #1A5C38; }
.calidad-mini { display: flex; flex-direction: column; gap: 8px; }
.cm-row { display: flex; align-items: center; gap: 8px; }
.cm-lbl { font-size: .75rem; color: #6b7280; min-width: 70px; }
.cm-track { flex: 1; height: 6px; border-radius: 99px; background: #e5e7eb; overflow: hidden; }
.cm-fill { height: 100%; border-radius: 99px; background: #1A5C38; transition: width .5s; }
.cm-pct { font-size: .75rem; font-weight: 600; color: #1A5C38; min-width: 32px; text-align: right; }

/* Loader */
.loader-row { display: flex; justify-content: center; padding: 40px; }
.loader {
  width: 28px; height: 28px; border: 3px solid #e5e7eb;
  border-top-color: #1A5C38; border-radius: 50%; animation: spin .7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══ Responsive ═══ */
@media (max-width: 1024px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .detail-row { grid-template-columns: 1fr; }
  .map-body { flex-direction: column; }
  .insights-panel { width: 100%; border-left: none; border-top: 1px solid rgba(0,0,0,.06); }
}
@media (max-width: 768px) {
  .dash { padding: 16px 14px 72px; gap: 14px; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi { padding: 12px 14px; }
  .kpi-val { font-size: 1.1rem; }
  .kpi .kpi-icon { width: 34px; height: 34px; }
  .charts-row { grid-template-columns: 1fr; }
  .detail-row { grid-template-columns: 1fr; }
  .map-container { min-height: 260px; }
  .dash-title { font-size: 1.25rem; }
}
@media (max-width: 480px) {
  .dash { padding: 12px 10px 80px; }
  .kpi-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi { padding: 10px 12px; gap: 8px; }
  .kpi-val { font-size: 1rem; }
  .kpi-lbl { font-size: .65rem; }
  .kpi .kpi-icon { width: 30px; height: 30px; }
  .map-header { padding: 14px 16px 10px; }
  .glass-card { padding: 16px; border-radius: 14px; }
  .dt th, .dt td { padding: 8px 10px; font-size: .78rem; }
}
</style>
