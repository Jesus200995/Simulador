<template>
  <!-- ═══════════════════════════════════════════════════
       ADMIN / RESPONSABLE — full map dashboard
  ════════════════════════════════════════════════════ -->
  <div v-if="isAdminView" class="adash">

    <!-- ── Header ── -->
    <div class="adash-header">
      <div class="adash-header-left">
        <h1 class="adash-title">Dashboard administrativo</h1>
        <p class="adash-sub">Visión general del sistema · {{ fechaHoy }}</p>
      </div>
      <div class="adash-header-right">
        <select class="adash-select" v-model="filtroEstado">
          <option value="">Todos los estados</option>
          <option v-for="e in estadosLista" :key="e" :value="e">{{ e }}</option>
        </select>
        <button class="adash-refresh-btn" @click="recargar" :disabled="loading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Actualizar
        </button>
      </div>
    </div>

    <!-- ── KPI strip ── -->
    <div class="kpi-strip" :class="{ 'kpi-loading': loading }">
      <div class="kpi-cell" @click="$router.push('/productor')">
        <div class="kpi-ico kpi-ico-green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtN(kpis.productores) }}</div>
          <div class="kpi-label">Productores activos</div>
          <div class="kpi-delta kpi-delta-up" v-if="kpis.ups_nuevas_mes">+{{ kpis.ups_nuevas_mes }} este mes</div>
        </div>
      </div>
      <div class="kpi-cell" @click="$router.push('/seguimiento')">
        <div class="kpi-ico kpi-ico-blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtN(kpis.ups) }}</div>
          <div class="kpi-label">UPs registradas</div>
          <div class="kpi-delta kpi-delta-up" v-if="kpis.delta_produccion !== null && kpis.delta_produccion > 0">↑ {{ kpis.delta_produccion }}% vs año ant.</div>
          <div class="kpi-delta kpi-delta-down" v-else-if="kpis.delta_produccion !== null && kpis.delta_produccion < 0">↓ {{ Math.abs(kpis.delta_produccion) }}% vs año ant.</div>
        </div>
      </div>
      <div class="kpi-cell" @click="$router.push('/infraestructura')">
        <div class="kpi-ico kpi-ico-purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtN(kpis.bodegas_activas) }}</div>
          <div class="kpi-label">Bodegas activas</div>
        </div>
      </div>
      <div class="kpi-cell" @click="$router.push('/mis-bodegas')">
        <div class="kpi-ico kpi-ico-teal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtTon(kpis.stock_ton) }}</div>
          <div class="kpi-label">Stock en bodegas</div>
        </div>
      </div>
      <div class="kpi-cell" @click="$router.push('/alertas')">
        <div class="kpi-ico kpi-ico-red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ fmtN(kpis.alertas_activas) }}</div>
          <div class="kpi-label">Alertas activas</div>
          <div class="kpi-delta kpi-delta-warn" v-if="kpis.alertas_activas > 0">Requieren atención</div>
          <div class="kpi-delta kpi-delta-ok" v-else>Todo en orden</div>
        </div>
      </div>
      <div class="kpi-cell" @click="$router.push('/precios')">
        <div class="kpi-ico kpi-ico-amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ kpis.precio_promedio_parcela > 0 ? '$' + fmtN(Math.round(kpis.precio_promedio_parcela)) : '—' }}</div>
          <div class="kpi-label">Precio promedio (parcela)</div>
          <div class="kpi-delta">por tonelada</div>
        </div>
      </div>
    </div>

    <!-- ── Map + Insights ── -->
    <div class="adash-main">
      <!-- Map panel -->
      <div class="map-panel">
        <div class="map-panel-header">
          <div>
            <div class="map-panel-title">Mapa general del sistema</div>
            <div class="map-panel-sub">{{ mapLayerSub }}</div>
          </div>
          <div class="map-tabs">
            <button
              v-for="tab in mapTabs" :key="tab.key"
              class="map-tab" :class="{ active: activeMapLayer === tab.key }"
              @click="setMapLayer(tab.key as MapLayer)"
            >{{ tab.label }}</button>
          </div>
        </div>
        <div class="map-wrap">
          <div ref="mapEl" class="mapbox-map"></div>
          <!-- Hover tooltip -->
          <div v-if="hoveredState" class="map-tooltip">
            <strong>{{ hoveredState.estado }}</strong>
            <div>Producción: {{ fmtTon(hoveredState.produccion_ton) }}</div>
            <div>Bodegas: {{ hoveredState.bodegas_count }}</div>
            <div v-if="hoveredState.alertas_count > 0" class="tooltip-alert">Alertas: {{ hoveredState.alertas_count }}</div>
          </div>
          <!-- Legend -->
          <div class="map-legend" v-if="activeMapLayer === 'produccion'">
            <div class="legend-title">Producción (ton)</div>
            <div class="legend-scale">
              <div class="legend-color" style="background: #D4F0E4;"></div>
              <div class="legend-color" style="background: #6BC89B;"></div>
              <div class="legend-color" style="background: #2D8A5F;"></div>
              <div class="legend-color" style="background: #1A5C38;"></div>
              <div class="legend-color" style="background: #0F3D26;"></div>
            </div>
            <div class="legend-labels">
              <span>Menos</span><span>Más</span>
            </div>
          </div>
          <div class="map-legend" v-else-if="activeMapLayer === 'alertas'">
            <div class="legend-title">Alertas pendientes</div>
            <div class="legend-scale">
              <div class="legend-color" style="background: #FFF3CD;"></div>
              <div class="legend-color" style="background: #FFAD60;"></div>
              <div class="legend-color" style="background: #EF4444;"></div>
              <div class="legend-color" style="background: #991B1B;"></div>
            </div>
            <div class="legend-labels"><span>Sin alertas</span><span>Crítico</span></div>
          </div>
          <div class="map-loading" v-if="mapaLoading">
            <div class="spinner-sm"></div>
          </div>
        </div>
      </div>

      <!-- Insights panel -->
      <div class="insights-panel">
        <div class="insights-header">Insights principales</div>
        <ul class="insights-list" v-if="insights.length">
          <li v-for="(ins, i) in insights" :key="i" class="insight-item" :class="'insight-' + ins.type">
            <div class="insight-dot"></div>
            <p class="insight-text">{{ ins.text }}</p>
          </li>
        </ul>
        <div class="insights-empty" v-else>Cargando análisis...</div>
        <router-link to="/admin/dashboard" class="insights-more">Ver análisis completo →</router-link>

        <!-- Quick stats -->
        <div class="quick-stats">
          <div class="qs-item" @click="$router.push('/seguimiento')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/></svg>
            <span>Seguimiento de campo</span>
          </div>
          <div class="qs-item" @click="$router.push('/precios')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Registro de precios</span>
          </div>
          <div class="qs-item" @click="$router.push('/admin')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Gestión de usuarios</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── State table ── -->
    <div class="state-section">
      <div class="state-header">
        <h2 class="state-title">Resumen por estado</h2>
        <span v-if="filtroEstado" class="filter-badge">{{ filtroEstado }} <button @click="filtroEstado = ''">×</button></span>
      </div>
      <div class="state-table-wrap">
        <table class="state-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th class="num">Producción (ton)</th>
              <th class="num">% total</th>
              <th class="num">Stock bodegas</th>
              <th class="num">Capacidad</th>
              <th class="num">Cobertura</th>
              <th class="num">Alertas</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in estadosFiltrados" :key="row.estado"
              @click="filtroEstado = filtroEstado === row.estado ? '' : row.estado"
              :class="{ 'row-selected': filtroEstado === row.estado }"
            >
              <td class="td-estado">{{ row.estado }}</td>
              <td class="num">{{ fmtTon(row.produccion_ton) }}</td>
              <td class="num">
                <div class="pct-wrap">
                  <div class="pct-bar" :style="{ width: row.pct_produccion + '%' }"></div>
                  <span>{{ row.pct_produccion }}%</span>
                </div>
              </td>
              <td class="num">{{ fmtTon(row.stock_ton) }}</td>
              <td class="num">{{ fmtTon(row.capacidad_ton) }}</td>
              <td class="num">
                <span class="cob-badge" :class="cobClass(row.cobertura_pct)">{{ row.cobertura_pct }}%</span>
              </td>
              <td class="num">
                <span v-if="row.alertas_activas > 0" class="alert-badge">{{ row.alertas_activas }}</span>
                <span v-else class="no-alert">—</span>
              </td>
            </tr>
            <tr v-if="estadosFiltrados.length === 0">
              <td colspan="7" class="empty-row">Sin datos para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════
       ROLE VIEW — productor / supervisor / bodeguero
  ════════════════════════════════════════════════════ -->
  <div v-else class="role-view">
    <header class="rv-hero">
      <div class="rv-hero-inner">
        <div class="rv-greeting">
          <p class="rv-eyebrow">{{ fechaHoy }}</p>
          <h1 class="rv-title">Hola, {{ firstName }}</h1>
          <p class="rv-sub">{{ roleSub }}</p>
        </div>
        <button class="rv-bell" @click="$router.push('/notificaciones')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span v-if="notifCount > 0" class="rv-bell-dot">{{ notifCount > 9 ? '9+' : notifCount }}</span>
        </button>
      </div>
    </header>

    <!-- Stats grid -->
    <div class="rv-stats">
      <div class="rv-stat" v-for="s in roleStats" :key="s.key" @click="$router.push(s.to)">
        <div class="rv-stat-ico" :class="'rv-ico-' + s.color">
          <span v-html="s.icon"></span>
        </div>
        <div class="rv-stat-body">
          <div class="rv-stat-val" :class="{ 'rv-skeleton': loading }">{{ loading ? '' : fmtN(s.value) }}</div>
          <div class="rv-stat-label">{{ s.label }}</div>
          <div class="rv-stat-hint" :class="'rv-hint-' + (s.tone || 'muted')">{{ s.hint }}</div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="rv-actions">
      <h2 class="rv-section-title">Acciones rápidas</h2>
      <div class="rv-action-grid">
        <button v-for="a in quickActions" :key="a.key" class="rv-action" @click="$router.push(a.to)">
          <div class="rv-action-ico" :class="'rv-ico-' + a.color"><span v-html="a.icon"></span></div>
          <span class="rv-action-label">{{ a.label }}</span>
        </button>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="rv-recent" v-if="recientes.length">
      <div class="rv-recent-header">
        <h2 class="rv-section-title">Actividad reciente</h2>
        <router-link to="/notificaciones" class="rv-recent-link">Ver todo</router-link>
      </div>
      <div class="rv-recent-list">
        <div v-for="r in recientes" :key="r.id" class="rv-recent-item">
          <div class="rv-dot" :class="nivelTone(r.nivel)"></div>
          <div class="rv-recent-body">
            <p class="rv-recent-title">{{ r.titulo }}</p>
            <p class="rv-recent-time">{{ timeAgo(r.fecha) }} · {{ r.estado || 'pendiente' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const auth = useAuthStore()
const router = useRouter()

const isAdminView = computed(() => auth.isAdmin || auth.rol === 'responsable')

// ── Shared ──────────────────────────────────
const loading = ref(true)
const notifCount = ref(0)
const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// ── ADMIN DASHBOARD ──────────────────────────
const kpis = ref({
  productores: 0, ups: 0, bodegas_activas: 0, stock_ton: 0,
  alertas_activas: 0, precio_promedio_parcela: 0,
  delta_produccion: null as number | null, ups_nuevas_mes: 0,
})
const porEstado = ref<any[]>([])
const filtroEstado = ref('')
const mapaLoading = ref(false)
const mapEl = ref<HTMLDivElement>()
let map: mapboxgl.Map | null = null
const hoveredState = ref<any>(null)

type MapLayer = 'produccion' | 'bodegas' | 'alertas' | 'precios'
const activeMapLayer = ref<MapLayer>('produccion')

const mapTabs = [
  { key: 'produccion', label: 'Producción' },
  { key: 'bodegas', label: 'Bodegas' },
  { key: 'alertas', label: 'Alertas' },
  { key: 'precios', label: 'Precios' },
]
const mapLayerSub = computed(() => {
  const m: Record<MapLayer, string> = {
    produccion: 'Producción estimada por estado (ton)',
    bodegas: 'Ubicación de bodegas aprobadas',
    alertas: 'Alertas pendientes por estado',
    precios: 'Bodegas con precio registrado',
  }
  return m[activeMapLayer.value]
})

const estadosLista = computed(() =>
  porEstado.value.map(r => r.estado).filter(Boolean).sort()
)

const estadosFiltrados = computed(() => {
  if (!filtroEstado.value) return porEstado.value
  return porEstado.value.filter(r => r.estado === filtroEstado.value)
})

const insights = computed(() => {
  const est = porEstado.value
  if (!est.length) return []
  const list: { type: string; text: string }[] = []

  const top = est[0]
  if (top?.pct_produccion > 0) {
    list.push({ type: 'success', text: `${top.estado} concentra el ${top.pct_produccion}% de la producción estimada nacional.` })
  }

  const lowCov = est.filter(s => s.cobertura_pct < 25 && parseFloat(s.capacidad_ton) > 0).slice(0, 2)
  if (lowCov.length) {
    list.push({ type: 'warning', text: `Déficit de capacidad de almacenamiento en ${lowCov.map(s => s.estado).join(' y ')}.` })
  }

  if (kpis.value.alertas_activas > 0) {
    list.push({ type: 'warning', text: `${fmtN(kpis.value.alertas_activas)} alertas pendientes requieren atención.` })
  } else {
    list.push({ type: 'success', text: 'Sin alertas pendientes en el sistema.' })
  }

  if (kpis.value.delta_produccion !== null) {
    const dir = kpis.value.delta_produccion >= 0 ? 'Incremento' : 'Reducción'
    list.push({ type: kpis.value.delta_produccion >= 0 ? 'success' : 'warning', text: `${dir} del ${Math.abs(kpis.value.delta_produccion)}% en producción estimada vs el año anterior.` })
  }

  return list.slice(0, 3)
})

async function loadDashboard() {
  loading.value = true
  try {
    const data = await api.home.dashboard()
    kpis.value = { ...kpis.value, ...data.kpis }
    porEstado.value = data.por_estado || []
  } catch { /* noop */ } finally {
    loading.value = false
  }
}

// ── Mapbox ──────────────────────────────────
async function initMap() {
  await nextTick()
  if (!mapEl.value) return
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-102.5528, 23.6345],
    zoom: 4.2,
    attributionControl: false,
    logoPosition: 'bottom-left',
  })

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

  mapaLoading.value = true
  try {
    const mapaData = await api.home.mapa()

    map.on('load', () => {
      if (!map) return
      // States source
      map.addSource('estados', { type: 'geojson', data: mapaData.estados })
      // Production fill
      map.addLayer({
        id: 'estados-fill',
        type: 'fill',
        source: 'estados',
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['get', 'intensidad_prod'],
            0, '#F0FAF5', 0.15, '#A8E6C8', 0.35, '#52BE95',
            0.6, '#2D7A5F', 0.85, '#1A5C38', 1, '#0F3D26',
          ],
          'fill-opacity': 0.72,
        },
      })
      // Borders
      map.addLayer({
        id: 'estados-border',
        type: 'line',
        source: 'estados',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-opacity': 0.8 },
      })
      // Bodegas source
      map.addSource('bodegas', { type: 'geojson', data: mapaData.bodegas })
      // Bodegas circles
      map.addLayer({
        id: 'bodegas-circle',
        type: 'circle',
        source: 'bodegas',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9],
          'circle-color': '#7c3aed',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
      })

      // Hover effects
      map.on('mousemove', 'estados-fill', (e) => {
        if (e.features?.[0]) {
          const p = e.features[0].properties as any
          hoveredState.value = p
          map!.getCanvas().style.cursor = 'pointer'
        }
      })
      map.on('mouseleave', 'estados-fill', () => {
        hoveredState.value = null
        map!.getCanvas().style.cursor = ''
      })
      // Click to filter table
      map.on('click', 'estados-fill', (e) => {
        if (e.features?.[0]) {
          const p = e.features[0].properties as any
          filtroEstado.value = filtroEstado.value === p.estado ? '' : p.estado
        }
      })

      // Bodega popup
      map.on('click', 'bodegas-circle', (e) => {
        const feat = e.features?.[0] as any
        if (!feat) return
        new mapboxgl.Popup({ closeButton: true, maxWidth: '220px', offset: 8 })
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${feat.properties.nombre}</strong><br>${feat.properties.estado}, ${feat.properties.municipio}<br>Capacidad: ${fmtTon(feat.properties.capacidad)}`)
          .addTo(map!)
      })
      map.on('mouseenter', 'bodegas-circle', () => { map!.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'bodegas-circle', () => { map!.getCanvas().style.cursor = '' })
    })
  } catch { /* map loads without data */ } finally {
    mapaLoading.value = false
  }
}

function setMapLayer(layer: MapLayer) {
  activeMapLayer.value = layer
  if (!map || !map.isStyleLoaded()) return
  try {
    if (layer === 'produccion') {
      map.setPaintProperty('estados-fill', 'fill-color', [
        'interpolate', ['linear'], ['get', 'intensidad_prod'],
        0, '#F0FAF5', 0.15, '#A8E6C8', 0.35, '#52BE95',
        0.6, '#2D7A5F', 0.85, '#1A5C38', 1, '#0F3D26',
      ])
      map.setPaintProperty('estados-fill', 'fill-opacity', 0.72)
      map.setLayoutProperty('bodegas-circle', 'visibility', 'visible')
      map.setPaintProperty('bodegas-circle', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9])
      map.setPaintProperty('bodegas-circle', 'circle-color', '#7c3aed')
    } else if (layer === 'bodegas') {
      map.setPaintProperty('estados-fill', 'fill-color', '#F3F4F6')
      map.setPaintProperty('estados-fill', 'fill-opacity', 0.5)
      map.setLayoutProperty('bodegas-circle', 'visibility', 'visible')
      map.setPaintProperty('bodegas-circle', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 4, 7, 8, 13])
      map.setPaintProperty('bodegas-circle', 'circle-color', '#7c3aed')
    } else if (layer === 'alertas') {
      map.setPaintProperty('estados-fill', 'fill-color', [
        'interpolate', ['linear'], ['get', 'intensidad_alerta'],
        0, '#FFF7ED', 0.2, '#FED7AA', 0.5, '#FB923C', 0.8, '#DC2626', 1, '#7F1D1D',
      ])
      map.setPaintProperty('estados-fill', 'fill-opacity', 0.75)
      map.setLayoutProperty('bodegas-circle', 'visibility', 'none')
    } else if (layer === 'precios') {
      map.setPaintProperty('estados-fill', 'fill-color', '#E0F2FE')
      map.setPaintProperty('estados-fill', 'fill-opacity', 0.45)
      map.setLayoutProperty('bodegas-circle', 'visibility', 'visible')
      map.setPaintProperty('bodegas-circle', 'circle-color', '#0ea5e9')
      map.setPaintProperty('bodegas-circle', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9])
    }
  } catch { /* layers not ready yet */ }
}

async function recargar() {
  await loadDashboard()
}

// ── ROLE VIEW ────────────────────────────────
const stats = ref<any>({ productores: 0, seguimientos: 0, seguimientos_pendientes: 0, alertas: 0, bodegas: 0 })
const recientes = ref<any[]>([])

const firstName = computed(() =>
  (auth.usuario?.nombre_completo || '').split(' ')[0] || 'Usuario'
)
const roleSub = computed(() => {
  const m: Record<string, string> = {
    productor: 'Gestiona tus unidades productivas y seguimiento',
    supervisor: 'Monitorea tu cartera de productores',
    bodeguero: 'Administra tus bodegas e inventarios',
    tecnico: 'Registra visitas y seguimiento de campo',
  }
  return m[auth.rol] || 'Bienvenido al sistema'
})

const roleStats = computed(() => {
  const s = stats.value
  if (auth.isProductor) return [
    { key: 'ups', label: 'Mis UPs', value: s.productores, hint: 'Unidades productivas', tone: 'muted', to: '/mis-ups', color: 'green', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' },
    { key: 'seg', label: 'Seguimientos', value: s.seguimientos, hint: s.seguimientos_pendientes > 0 ? `${s.seguimientos_pendientes} pendientes` : 'Al día', tone: s.seguimientos_pendientes > 0 ? 'warn' : 'ok', to: '/seguimiento', color: 'blue', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { key: 'alertas', label: 'Alertas', value: s.alertas, hint: s.alertas > 0 ? 'Requieren atención' : 'Sin alertas', tone: s.alertas > 0 ? 'danger' : 'ok', to: '/alertas', color: 'red', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' },
    { key: 'bodegas', label: 'Bodegas cercanas', value: s.bodegas, hint: 'En tu estado', tone: 'muted', to: '/infraestructura', color: 'purple', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' },
  ]
  if (auth.isSupervisor) return [
    { key: 'prod', label: 'En cartera', value: s.productores, hint: 'Productores asignados', tone: 'muted', to: '/mis-productores', color: 'green', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { key: 'seg', label: 'Seguimientos', value: s.seguimientos, hint: 'Total en cartera', tone: 'muted', to: '/seguimiento', color: 'blue', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/></svg>' },
    { key: 'alertas', label: 'Alertas', value: s.alertas, hint: s.alertas > 0 ? 'Pendientes en cartera' : 'Sin alertas', tone: s.alertas > 0 ? 'danger' : 'ok', to: '/alertas', color: 'red', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' },
    { key: 'bodegas', label: 'Bodegas', value: s.bodegas, hint: 'En sistema', tone: 'muted', to: '/infraestructura', color: 'purple', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>' },
  ]
  // bodeguero / default
  return [
    { key: 'bodegas', label: 'Mis bodegas', value: s.productores, hint: 'Registradas', tone: 'muted', to: '/mis-bodegas', color: 'purple', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' },
    { key: 'inv', label: 'Inventarios', value: s.seguimientos, hint: 'Registros', tone: 'muted', to: '/mis-bodegas', color: 'teal', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
    { key: 'total', label: 'Bodegas sistema', value: s.bodegas, hint: 'Total', tone: 'muted', to: '/infraestructura', color: 'blue', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>' },
  ]
})

const quickActions = computed(() => {
  const actions: any[] = []
  if (!auth.isBodeguero) {
    actions.push({ key: 'seg', label: 'Nuevo seguimiento', to: '/seguimiento', color: 'green', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' })
    actions.push({ key: 'precio', label: 'Registrar precio', to: '/precios/registrar', color: 'amber', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' })
  }
  if (auth.isBodeguero || auth.isAdmin) {
    actions.push({ key: 'inv', label: 'Inventarios', to: '/mis-bodegas', color: 'purple', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' })
  }
  actions.push({ key: 'mapa', label: 'Ver mapa', to: '/mapa', color: 'teal', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>' })
  actions.push({ key: 'alertas', label: 'Alertas', to: '/alertas', color: 'red', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' })
  return actions.slice(0, 4)
})

// ── Helpers ──────────────────────────────────
function fmtN(n: number) { return new Intl.NumberFormat('es-MX').format(Math.round(n || 0)) }
function fmtTon(n: any) {
  const v = parseFloat(n) || 0
  if (v >= 1000000) return (v / 1000000).toFixed(1) + ' M ton'
  if (v >= 1000) return new Intl.NumberFormat('es-MX').format(Math.round(v)) + ' ton'
  return v > 0 ? v.toFixed(0) + ' ton' : '—'
}
function cobClass(pct: number) {
  if (pct >= 70) return 'cob-high'
  if (pct >= 35) return 'cob-med'
  if (pct > 0) return 'cob-low'
  return 'cob-none'
}
function nivelTone(nivel?: string) {
  if (nivel === 'critico' || nivel === 'alto') return 'dot-danger'
  if (nivel === 'medio') return 'dot-warn'
  return 'dot-info'
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

// ── Lifecycle ────────────────────────────────
onMounted(async () => {
  if (isAdminView.value) {
    await loadDashboard()
    await initMap()
  } else {
    loading.value = true
    try {
      const res = await api.home.stats()
      stats.value = res.stats
      recientes.value = (res.stats as any).recientes ?? []
    } catch { /* noop */ } finally { loading.value = false }
    try {
      const r = await api.alertas.notificaciones()
      notifCount.value = r.total_no_leidas ?? 0
    } catch { /* noop */ }
  }
})

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   ADMIN DASHBOARD
════════════════════════════════════════════ */
.adash {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 0 0 60px;
}

/* Header */
.adash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 20px;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,.06);
  flex-wrap: wrap;
}
.adash-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0 0 3px;
  letter-spacing: -.025em;
}
.adash-sub { font-size: .8rem; color: #86868b; margin: 0; text-transform: capitalize; }
.adash-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.adash-select {
  padding: 7px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: .82rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  outline: none;
}
.adash-select:focus { border-color: #1A5C38; }
.adash-refresh-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: #1A5C38;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.adash-refresh-btn:hover { background: #155232; }
.adash-refresh-btn:disabled { opacity: .6; cursor: not-allowed; }

/* KPI Strip */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.kpi-strip.kpi-loading { opacity: .6; pointer-events: none; }
.kpi-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-right: 1px solid rgba(0,0,0,.05);
  cursor: pointer;
  transition: background .15s;
}
.kpi-cell:last-child { border-right: none; }
.kpi-cell:hover { background: #F9FAFB; }

.kpi-ico {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-ico-green  { background: rgba(26,92,56,.1);  color: #1A5C38; }
.kpi-ico-blue   { background: rgba(37,99,235,.1); color: #2563eb; }
.kpi-ico-purple { background: rgba(124,58,237,.1);color: #7c3aed; }
.kpi-ico-teal   { background: rgba(14,148,148,.1);color: #0e9494; }
.kpi-ico-red    { background: rgba(220,38,38,.1); color: #dc2626; }
.kpi-ico-amber  { background: rgba(217,119,6,.1); color: #d97706; }

.kpi-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -.03em;
  line-height: 1;
  margin-bottom: 2px;
}
.kpi-label { font-size: .72rem; color: #86868b; font-weight: 500; margin-bottom: 3px; }
.kpi-delta { font-size: .68rem; font-weight: 600; }
.kpi-delta-up   { color: #16a34a; }
.kpi-delta-down { color: #dc2626; }
.kpi-delta-warn { color: #d97706; }
.kpi-delta-ok   { color: #16a34a; }
.kpi-delta      { color: #9ca3af; }

/* Main area */
.adash-main {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 0;
  height: 520px;
  border-bottom: 1px solid rgba(0,0,0,.06);
}

/* Map panel */
.map-panel { display: flex; flex-direction: column; background: #fff; border-right: 1px solid rgba(0,0,0,.06); }
.map-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0,0,0,.05);
  flex-shrink: 0;
}
.map-panel-title { font-size: .9rem; font-weight: 600; color: #1d1d1f; }
.map-panel-sub   { font-size: .72rem; color: #86868b; margin-top: 1px; }
.map-tabs { display: flex; gap: 2px; background: #f3f4f6; padding: 3px; border-radius: 9px; }
.map-tab {
  padding: 5px 12px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: .78rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.map-tab.active { background: #fff; color: #1A5C38; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.map-wrap { position: relative; flex: 1; overflow: hidden; }
.mapbox-map { width: 100%; height: 100%; }

/* Map overlay elements */
.map-tooltip {
  position: absolute;
  top: 12px; left: 12px;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(8px);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: .8rem;
  color: #374151;
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
  pointer-events: none;
  min-width: 160px;
  line-height: 1.5;
}
.map-tooltip strong { display: block; font-size: .85rem; color: #1d1d1f; margin-bottom: 3px; }
.tooltip-alert { color: #dc2626; font-weight: 600; }

.map-legend {
  position: absolute;
  bottom: 40px; left: 12px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(6px);
  padding: 8px 12px;
  border-radius: 9px;
  font-size: .72rem;
  color: #6b7280;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}
.legend-title { font-weight: 600; color: #374151; margin-bottom: 5px; }
.legend-scale { display: flex; gap: 2px; margin-bottom: 3px; }
.legend-color { width: 24px; height: 8px; border-radius: 2px; }
.legend-labels { display: flex; justify-content: space-between; font-size: .66rem; color: #9ca3af; }
.map-loading {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.5);
}

/* Insights panel */
.insights-panel {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #fff;
  overflow-y: auto;
}
.insights-header {
  font-size: .95rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 16px;
  letter-spacing: -.015em;
}
.insights-list { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 12px; }
.insight-item { display: flex; align-items: flex-start; gap: 10px; }
.insight-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
}
.insight-success .insight-dot { background: #16a34a; }
.insight-warning .insight-dot { background: #d97706; }
.insight-info    .insight-dot { background: #2563eb; }
.insight-text { font-size: .82rem; color: #374151; line-height: 1.45; margin: 0; }
.insights-more {
  font-size: .8rem;
  font-weight: 600;
  color: #1A5C38;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
}
.insights-more:hover { text-decoration: underline; }
.insights-empty { color: #9ca3af; font-size: .82rem; margin-bottom: 16px; }

.quick-stats { display: flex; flex-direction: column; gap: 2px; margin-top: auto; border-top: 1px solid #f3f4f6; padding-top: 16px; }
.qs-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: #374151;
  font-size: .83rem;
  font-weight: 500;
  transition: background .12s;
  text-decoration: none;
}
.qs-item:hover { background: #F5F5F7; color: #1A5C38; }
.qs-item svg { color: #1A5C38; flex-shrink: 0; }

/* State table section */
.state-section { padding: 20px 28px 0; }
.state-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.state-title { font-size: 1rem; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -.015em; }
.filter-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: rgba(26,92,56,.1);
  color: #1A5C38;
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 600;
}
.filter-badge button {
  background: none; border: none; color: #1A5C38; cursor: pointer;
  font-size: .85rem; line-height: 1; padding: 0; font-weight: 700;
}

.state-table-wrap { overflow-x: auto; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; background: #fff; margin-bottom: 24px; }
.state-table { width: 100%; border-collapse: collapse; font-size: .83rem; }
.state-table thead tr { background: #FAFAFA; }
.state-table th {
  padding: 11px 16px;
  font-weight: 600;
  color: #6b7280;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid rgba(0,0,0,.07);
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.state-table th.num { text-align: right; }
.state-table td {
  padding: 11px 16px;
  color: #374151;
  border-bottom: 1px solid rgba(0,0,0,.04);
  vertical-align: middle;
}
.state-table td.num { text-align: right; }
.state-table tr:last-child td { border-bottom: none; }
.state-table tbody tr { cursor: pointer; transition: background .12s; }
.state-table tbody tr:hover td { background: #F9FAFB; }
.state-table tr.row-selected td { background: rgba(26,92,56,.06); }
.td-estado { font-weight: 600; color: #1d1d1f; }

.pct-wrap { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.pct-bar { height: 6px; border-radius: 3px; background: #1A5C38; min-width: 2px; }

.cob-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 8px; border-radius: 99px; font-size: .75rem; font-weight: 600;
}
.cob-high { background: rgba(22,163,74,.12); color: #16a34a; }
.cob-med  { background: rgba(217,119,6,.12); color: #d97706; }
.cob-low  { background: rgba(220,38,38,.12); color: #dc2626; }
.cob-none { background: #f3f4f6; color: #9ca3af; }

.alert-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 5px;
  background: rgba(220,38,38,.12); color: #dc2626;
  border-radius: 99px; font-size: .75rem; font-weight: 700;
}
.no-alert { color: #d1d5db; }
.empty-row { text-align: center; color: #9ca3af; padding: 20px !important; }

/* ═══════════════════════════════════════════
   ROLE VIEW (productor / supervisor / bodeguero)
════════════════════════════════════════════ */
.role-view { min-height: 100vh; background: #F5F5F7; padding-bottom: 80px; }

.rv-hero {
  background: linear-gradient(160deg, #0F3D26 0%, #1A5C38 50%, #2D7A52 100%);
  padding: 28px 20px 56px;
  border-radius: 0 0 32px 32px;
  position: relative; overflow: hidden;
}
.rv-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255,255,255,.08), transparent 50%);
  pointer-events: none;
}
.rv-hero-inner { position: relative; max-width: 680px; margin: 0 auto; display: flex; align-items: flex-start; justify-content: space-between; }
.rv-eyebrow { font-size: .75rem; color: rgba(255,255,255,.7); margin: 0 0 4px; text-transform: capitalize; font-weight: 500; }
.rv-title { font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -.03em; }
.rv-sub { font-size: .88rem; color: rgba(255,255,255,.75); margin: 0; font-weight: 400; }
.rv-bell {
  position: relative; width: 44px; height: 44px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.16);
  border-radius: 14px; color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: background .15s;
}
.rv-bell:hover { background: rgba(255,255,255,.2); }
.rv-bell-dot {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 4px;
  background: #FF3B30; color: #fff; border-radius: 99px;
  font-size: .62rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #1A5C38;
}

/* Stats */
.rv-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
  max-width: 680px;
  margin: -36px auto 0;
  position: relative; z-index: 2;
}
.rv-stat {
  background: #fff;
  border-radius: 20px;
  padding: 16px 18px;
  cursor: pointer;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  border: .5px solid rgba(0,0,0,.04);
  transition: transform .18s, box-shadow .18s;
}
.rv-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.09); }
.rv-stat:active { transform: scale(.97); }
.rv-stat-ico {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rv-ico-green  { background: rgba(26,92,56,.1);  color: #1A5C38; }
.rv-ico-blue   { background: rgba(37,99,235,.1); color: #2563eb; }
.rv-ico-purple { background: rgba(124,58,237,.1);color: #7c3aed; }
.rv-ico-teal   { background: rgba(14,148,148,.1);color: #0e9494; }
.rv-ico-red    { background: rgba(220,38,38,.1); color: #dc2626; }
.rv-ico-amber  { background: rgba(217,119,6,.1); color: #d97706; }
.rv-stat-val {
  font-size: 1.7rem; font-weight: 800; color: #1d1d1f;
  letter-spacing: -.04em; line-height: 1; margin-bottom: 3px;
}
.rv-stat-val.rv-skeleton {
  min-width: 52px; height: 28px;
  background: linear-gradient(90deg, #eee 0%, #f7f7f7 50%, #eee 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
.rv-stat-label { font-size: .75rem; color: #86868b; font-weight: 600; margin-bottom: 2px; }
.rv-stat-hint { font-size: .7rem; font-weight: 600; }
.rv-hint-ok      { color: #16a34a; }
.rv-hint-warn    { color: #d97706; }
.rv-hint-danger  { color: #dc2626; }
.rv-hint-muted   { color: #9ca3af; }

/* Quick actions */
.rv-actions { padding: 24px 16px 0; max-width: 680px; margin: 0 auto; }
.rv-section-title { font-size: .95rem; font-weight: 700; color: #1d1d1f; margin: 0 0 12px; letter-spacing: -.015em; }
.rv-action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.rv-action {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer;
  border: .5px solid rgba(0,0,0,.05);
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  text-align: left;
  font-family: inherit;
  transition: transform .15s, box-shadow .18s;
}
.rv-action:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.rv-action:active { transform: scale(.97); }
.rv-action-ico {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rv-action-label { font-size: .86rem; font-weight: 600; color: #1d1d1f; line-height: 1.2; }

/* Recent */
.rv-recent { padding: 20px 16px 0; max-width: 680px; margin: 0 auto; }
.rv-recent-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rv-recent-link { font-size: .8rem; font-weight: 600; color: #1A5C38; text-decoration: none; }
.rv-recent-list { background: #fff; border-radius: 18px; padding: 4px 16px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.rv-recent-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: .5px solid rgba(0,0,0,.05); }
.rv-recent-item:last-child { border-bottom: none; }
.rv-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-info   { background: #2563eb; }
.dot-warn   { background: #d97706; }
.dot-danger { background: #dc2626; }
.rv-recent-title { font-size: .86rem; font-weight: 600; color: #1d1d1f; margin: 0; }
.rv-recent-time { font-size: .72rem; color: #9ca3af; margin: 3px 0 0; }

/* Spinner */
.spinner-sm {
  width: 28px; height: 28px;
  border: 3px solid rgba(0,0,0,.08);
  border-top-color: #1A5C38;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .kpi-strip { grid-template-columns: repeat(3, 1fr); }
  .kpi-cell:nth-child(3) { border-right: none; }
  .adash-main { height: auto; grid-template-columns: 1fr; }
  .map-panel { height: 420px; }
  .insights-panel { border-right: none; border-top: 1px solid rgba(0,0,0,.06); }
}
@media (max-width: 768px) {
  .adash-header { padding: 16px 16px 14px; }
  .adash-title { font-size: 1.15rem; }
  .adash-header-right { width: 100%; }
  .adash-select, .adash-refresh-btn { flex: 1; }
  .kpi-strip { grid-template-columns: repeat(2, 1fr); overflow-x: auto; }
  .kpi-cell { padding: 14px 16px; min-width: 160px; }
  .kpi-cell:nth-child(2n) { border-right: none; }
  .map-panel { height: 360px; }
  .map-panel-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .state-section { padding: 16px 12px 0; }
  .rv-stats { grid-template-columns: repeat(2, 1fr); }
  .rv-action-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .map-panel { height: 300px; }
  .rv-title { font-size: 1.45rem; }
  .rv-stat-val { font-size: 1.45rem; }
}
@media (min-width: 1400px) {
  .adash-main { grid-template-columns: 1fr 360px; }
}
</style>
