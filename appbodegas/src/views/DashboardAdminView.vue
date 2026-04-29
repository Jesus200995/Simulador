<template>
  <AppShell>
    <div class="dash">
      <!-- Header -->
      <div class="dash-header">
        <div class="dash-header-left">
          <h1 class="dash-title">Dashboard Administrativo</h1>
          <p class="dash-subtitle">Sistema de Monitoreo de Maíz y Cultivos — SIMAC</p>
        </div>
        <div class="dash-header-right">
          <span class="dash-date">{{ fechaActual }}</span>
          <button class="dash-refresh" @click="recargarTodo" :class="{ loading: cargando }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <nav class="dash-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="dash-tab"
          :class="{ active: tabActiva === tab.key }"
          @click="tabActiva = tab.key"
        >
          <span v-html="tab.icon"></span>
          {{ tab.label }}
        </button>
      </nav>

      <!-- ════════ RESUMEN ════════ -->
      <div v-if="tabActiva === 'resumen'" class="tab-content">
        <div v-if="loadingResumen" class="loading-panel">
          <div class="spinner"></div><span>Cargando KPIs...</span>
        </div>
        <template v-else-if="resumen">
          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card green">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.productores.toLocaleString() }}</div>
                <div class="kpi-label">Productores registrados</div>
              </div>
            </div>
            <div class="kpi-card blue">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.ups.toLocaleString() }}</div>
                <div class="kpi-label">Unidades Productivas</div>
              </div>
            </div>
            <div class="kpi-card teal">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.superficie_ha.toLocaleString() }}</div>
                <div class="kpi-label">Hectáreas sembradas (año)</div>
              </div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12c0-2.76 1.12-5.26 2.93-7.07"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.produccion_estimada_ton.toLocaleString() }}</div>
                <div class="kpi-label">Ton estimadas (año)</div>
              </div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.bodegas_activas }}</div>
                <div class="kpi-label">Bodegas activas</div>
              </div>
            </div>
            <div class="kpi-card red">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.alertas_pendientes }}</div>
                <div class="kpi-label">Alertas pendientes</div>
              </div>
            </div>
            <div class="kpi-card slate">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.supervisores_activos }}</div>
                <div class="kpi-label">Supervisores activos</div>
              </div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>
              </div>
              <div class="kpi-body">
                <div class="kpi-value">{{ resumen.ciclos_activos }}</div>
                <div class="kpi-label">Ciclos año actual</div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-panel">No hay datos disponibles</div>
      </div>

      <!-- ════════ PRODUCCIÓN ════════ -->
      <div v-if="tabActiva === 'produccion'" class="tab-content">
        <div v-if="loadingProduccion" class="loading-panel"><div class="spinner"></div><span>Cargando...</span></div>
        <template v-else-if="produccion">
          <!-- Por año summary -->
          <div class="section-title">Resumen por Año</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Año</th><th>Ciclos</th><th>UPs</th><th>Área (ha)</th></tr></thead>
              <tbody>
                <tr v-for="row in produccion.por_anio" :key="row.cycle_year">
                  <td><strong>{{ row.cycle_year }}</strong></td>
                  <td>{{ row.ciclos }}</td>
                  <td>{{ row.ups }}</td>
                  <td>{{ Number(row.area_ha).toLocaleString() }} ha</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-title">Por Estado</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Estado</th><th>UPs</th><th>Cultivos</th><th>Área (ha)</th><th>Producción (ton)</th></tr></thead>
              <tbody>
                <tr v-for="row in produccion.por_estado" :key="row.estado">
                  <td>{{ row.estado || '—' }}</td>
                  <td>{{ row.ups }}</td>
                  <td>{{ row.cultivos }}</td>
                  <td>{{ Number(row.area_ha).toLocaleString() }}</td>
                  <td>{{ Number(row.produccion_ton).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-title">Por Tipo de Ciclo</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Tipo</th><th>Año</th><th>Ciclos</th><th>Cultivos</th><th>Área (ha)</th></tr></thead>
              <tbody>
                <tr v-for="row in produccion.por_ciclo" :key="`${row.cycle_type}-${row.cycle_year}`">
                  <td><span class="badge" :class="row.cycle_type === 'PV' ? 'badge-green' : 'badge-blue'">{{ row.cycle_type }}</span></td>
                  <td>{{ row.cycle_year }}</td>
                  <td>{{ row.ciclos }}</td>
                  <td>{{ row.cultivos }}</td>
                  <td>{{ Number(row.area_ha).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="info-note" v-if="produccion.ups_sin_ciclo > 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ produccion.ups_sin_ciclo }} UPs sin ciclo registrado
          </div>
        </template>
      </div>

      <!-- ════════ INFRAESTRUCTURA ════════ -->
      <div v-if="tabActiva === 'infraestructura'" class="tab-content">
        <div v-if="loadingInfraestructura" class="loading-panel"><div class="spinner"></div><span>Cargando...</span></div>
        <template v-else-if="infraestructura">
          <!-- Summary cards -->
          <div class="kpi-grid kpi-grid-3">
            <div class="kpi-card purple">
              <div class="kpi-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ infraestructura.bodegas_aprobadas }}</div>
                <div class="kpi-label">Bodegas aprobadas</div>
              </div>
            </div>
            <div class="kpi-card blue">
              <div class="kpi-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ Number(infraestructura.capacidad_total_ton).toLocaleString() }}</div>
                <div class="kpi-label">Capacidad total (ton)</div>
              </div>
            </div>
            <div class="kpi-card teal">
              <div class="kpi-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div class="kpi-body">
                <div class="kpi-value">{{ Number(infraestructura.stock_actual_ton).toLocaleString() }}</div>
                <div class="kpi-label">Stock actual (ton)</div>
              </div>
            </div>
          </div>

          <!-- Ocupación gauge -->
          <div class="ocupacion-wrap">
            <div class="ocupacion-label">Ocupación de bodegas</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: infraestructura.ocupacion_pct + '%' }" :class="ocupacionClass"></div>
            </div>
            <div class="ocupacion-pct">{{ infraestructura.ocupacion_pct }}%</div>
          </div>

          <div class="section-title">Por Estado</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Estado</th><th>Bodegas</th><th>Capacidad (ton)</th></tr></thead>
              <tbody>
                <tr v-for="row in infraestructura.por_estado" :key="row.estado">
                  <td>{{ row.estado || '—' }}</td>
                  <td>{{ row.total_bodegas }}</td>
                  <td>{{ Number(row.capacidad_ton).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section-title">Top Bodegas por Capacidad</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Nombre</th><th>Estado</th><th>Municipio</th><th>Capacidad (ton)</th><th>Stock (ton)</th><th>Ocupación</th></tr></thead>
              <tbody>
                <tr v-for="row in infraestructura.top_bodegas" :key="row.nombre">
                  <td>{{ row.nombre }}</td>
                  <td>{{ row.estado }}</td>
                  <td>{{ row.municipio }}</td>
                  <td>{{ Number(row.capacidad_toneladas).toLocaleString() }}</td>
                  <td>{{ Number(row.stock_actual).toLocaleString() }}</td>
                  <td>
                    <span class="mini-bar-wrap">
                      <span class="mini-bar" :style="{ width: Math.min(100, Math.round((row.stock_actual / row.capacidad_toneladas) * 100)) + '%' }"></span>
                    </span>
                    {{ Math.min(100, Math.round((row.stock_actual / row.capacidad_toneladas) * 100)) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- ════════ PRECIOS ════════ -->
      <div v-if="tabActiva === 'precios'" class="tab-content">
        <div v-if="loadingPrecios" class="loading-panel"><div class="spinner"></div><span>Cargando...</span></div>
        <template v-else-if="precios">
          <!-- Últimos precios registrados -->
          <div class="section-title">Últimos Precios por Tipo</div>
          <div class="precios-cards">
            <div v-for="p in precios.recientes" :key="p.tipo_precio" class="precio-card" :class="tipoPrecioClass(p.tipo_precio)">
              <div class="precio-tipo">{{ tipoPrecioLabel(p.tipo_precio) }}</div>
              <div class="precio-valor">${{ Number(p.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</div>
              <div class="precio-meta">{{ p.tipo_maiz }} · {{ formatFecha(p.fecha) }}</div>
              <div class="precio-lugar" v-if="p.estado">{{ p.estado }}<span v-if="p.municipio">, {{ p.municipio }}</span></div>
            </div>
          </div>

          <!-- Promedios 30 días -->
          <div class="section-title">Promedios últimos 30 días</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Tipo</th><th>Maíz</th><th>Promedio</th><th>Mín</th><th>Máx</th><th>Registros</th><th>Último</th></tr></thead>
              <tbody>
                <tr v-for="row in precios.promedios" :key="`${row.tipo_precio}-${row.tipo_maiz}`">
                  <td><span class="badge" :class="tipoPrecioClass(row.tipo_precio)">{{ tipoPrecioLabel(row.tipo_precio) }}</span></td>
                  <td>{{ row.tipo_maiz }}</td>
                  <td><strong>${{ Number(row.promedio).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</strong></td>
                  <td>${{ Number(row.minimo).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                  <td>${{ Number(row.maximo).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                  <td>{{ row.registros }}</td>
                  <td>{{ formatFecha(row.ultima_fecha) }}</td>
                </tr>
                <tr v-if="!precios.promedios?.length">
                  <td colspan="7" class="empty-cell">Sin datos en los últimos 30 días</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tendencia semanal -->
          <div class="section-title">Tendencia Semanal (90 días)</div>
          <div class="table-wrap" v-if="precios.tendencia?.length">
            <table class="dash-table">
              <thead><tr><th>Semana</th><th>Tipo</th><th>Promedio</th></tr></thead>
              <tbody>
                <tr v-for="row in precios.tendencia" :key="`${row.semana}-${row.tipo_precio}`">
                  <td>{{ formatFecha(row.semana) }}</td>
                  <td><span class="badge" :class="tipoPrecioClass(row.tipo_precio)">{{ tipoPrecioLabel(row.tipo_precio) }}</span></td>
                  <td>${{ Number(row.promedio).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-panel">Sin datos de tendencia</div>
        </template>
      </div>

      <!-- ════════ ALERTAS ════════ -->
      <div v-if="tabActiva === 'alertas'" class="tab-content">
        <div v-if="loadingAlertas" class="loading-panel"><div class="spinner"></div><span>Cargando...</span></div>
        <template v-else-if="alertasData">
          <!-- Por nivel -->
          <div class="kpi-grid kpi-grid-4">
            <div v-for="n in alertasData.por_nivel" :key="n.nivel_alerta" class="kpi-card" :class="nivelClass(n.nivel_alerta)">
              <div class="kpi-body">
                <div class="kpi-value">{{ n.total }}</div>
                <div class="kpi-label">{{ nivelLabel(n.nivel_alerta) }}</div>
              </div>
            </div>
          </div>

          <!-- Por estado -->
          <div class="section-title">Por Estado de Alerta</div>
          <div class="estado-bars">
            <div v-for="e in alertasData.por_estado" :key="e.estado_alerta" class="estado-bar-row">
              <span class="estado-bar-label">{{ e.estado_alerta }}</span>
              <div class="estado-bar-track">
                <div class="estado-bar-fill" :class="estadoAlertaClass(e.estado_alerta)"
                  :style="{ width: maxEstado > 0 ? Math.round((e.total / maxEstado) * 100) + '%' : '0%' }">
                </div>
              </div>
              <span class="estado-bar-val">{{ e.total }}</span>
            </div>
          </div>

          <!-- Pendientes críticas -->
          <div class="section-title">Alertas Pendientes (más críticas)</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Nivel</th><th>Tipo</th><th>Productor</th><th>UP</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                <tr v-for="a in alertasData.recientes_pendientes" :key="a.id">
                  <td><span class="badge" :class="nivelClass(a.nivel_alerta)">{{ nivelLabel(a.nivel_alerta) }}</span></td>
                  <td>{{ a.tipo_alerta }}</td>
                  <td>{{ a.nombres ? `${a.nombres} ${a.apellido_paterno}` : '—' }}</td>
                  <td>{{ a.up_name || '—' }}</td>
                  <td>{{ a.state_name || '—' }}</td>
                  <td>{{ formatFecha(a.fecha_alerta) }}</td>
                </tr>
                <tr v-if="!alertasData.recientes_pendientes?.length">
                  <td colspan="6" class="empty-cell">No hay alertas pendientes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tipos con pendientes -->
          <div class="section-title">Tipos con Alertas Pendientes</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Tipo</th><th>Nivel</th><th>Total</th></tr></thead>
              <tbody>
                <tr v-for="t in alertasData.por_tipo" :key="`${t.tipo_alerta}-${t.nivel_alerta}`">
                  <td>{{ t.tipo_alerta }}</td>
                  <td><span class="badge" :class="nivelClass(t.nivel_alerta)">{{ nivelLabel(t.nivel_alerta) }}</span></td>
                  <td>{{ t.total }}</td>
                </tr>
                <tr v-if="!alertasData.por_tipo?.length">
                  <td colspan="3" class="empty-cell">Sin alertas pendientes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- ════════ OPERACIÓN ════════ -->
      <div v-if="tabActiva === 'operacion'" class="tab-content">
        <div v-if="loadingOperacion" class="loading-panel"><div class="spinner"></div><span>Cargando...</span></div>
        <template v-else-if="operacion">
          <!-- Usuarios por rol -->
          <div class="section-title">Usuarios por Rol</div>
          <div class="roles-chips">
            <div v-for="r in operacion.usuarios_por_rol" :key="r.rol" class="rol-chip">
              <span class="rol-chip-name">{{ rolLabel(r.rol) }}</span>
              <span class="rol-chip-count">{{ r.total }}</span>
            </div>
          </div>

          <!-- Calidad de datos -->
          <div class="section-title">Calidad de Datos — UPs</div>
          <div class="calidad-grid">
            <div class="calidad-item">
              <div class="calidad-bar-wrap">
                <div class="calidad-bar" :style="{ width: operacion.calidad_datos.con_nombre_pct + '%' }"></div>
              </div>
              <div class="calidad-label">Con nombre <strong>{{ operacion.calidad_datos.con_nombre_pct }}%</strong></div>
            </div>
            <div class="calidad-item">
              <div class="calidad-bar-wrap">
                <div class="calidad-bar" :style="{ width: operacion.calidad_datos.con_area_pct + '%' }"></div>
              </div>
              <div class="calidad-label">Con área calculada <strong>{{ operacion.calidad_datos.con_area_pct }}%</strong></div>
            </div>
            <div class="calidad-item">
              <div class="calidad-bar-wrap">
                <div class="calidad-bar" :style="{ width: operacion.calidad_datos.con_ciclo_pct + '%' }"></div>
              </div>
              <div class="calidad-label">Con ciclo <strong>{{ operacion.calidad_datos.con_ciclo_pct }}%</strong></div>
            </div>
            <div class="calidad-item">
              <div class="calidad-bar-wrap">
                <div class="calidad-bar" :style="{ width: operacion.calidad_datos.con_cultivo_pct + '%' }"></div>
              </div>
              <div class="calidad-label">Con cultivo <strong>{{ operacion.calidad_datos.con_cultivo_pct }}%</strong></div>
            </div>
          </div>
          <div class="calidad-total">Total UPs: {{ operacion.calidad_datos.total_ups }}</div>

          <!-- Supervisores -->
          <div class="section-title">Actividad de Supervisores (últimos 30 días)</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Supervisor</th><th>Email</th><th>Productores</th><th>Visitas (mes)</th></tr></thead>
              <tbody>
                <tr v-for="s in operacion.supervisores" :key="s.supervisor_id">
                  <td>{{ s.nombre_completo }}</td>
                  <td class="cell-muted">{{ s.email }}</td>
                  <td>{{ s.productores_asignados }}</td>
                  <td>
                    <span class="badge" :class="s.visitas_mes > 0 ? 'badge-green' : 'badge-gray'">{{ s.visitas_mes }}</span>
                  </td>
                </tr>
                <tr v-if="!operacion.supervisores?.length">
                  <td colspan="4" class="empty-cell">Sin supervisores activos</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Visitas recientes -->
          <div class="section-title">Últimas Visitas de Campo</div>
          <div class="table-wrap">
            <table class="dash-table">
              <thead><tr><th>Fecha</th><th>Productor</th><th>UP</th><th>Tipo</th><th>Técnico</th></tr></thead>
              <tbody>
                <tr v-for="v in operacion.visitas_recientes" :key="v.id">
                  <td>{{ formatFecha(v.fecha_visita) }}</td>
                  <td>{{ v.nombres }} {{ v.apellido_paterno }}</td>
                  <td>{{ v.up_name || '—' }}</td>
                  <td>{{ v.tipo_visita || '—' }}</td>
                  <td class="cell-muted">{{ v.tecnico || '—' }}</td>
                </tr>
                <tr v-if="!operacion.visitas_recientes?.length">
                  <td colspan="5" class="empty-cell">Sin visitas recientes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { api } from '@/services/api'

type Tab = 'resumen' | 'produccion' | 'infraestructura' | 'precios' | 'alertas' | 'operacion'

const tabActiva = ref<Tab>('resumen')
const cargando = ref(false)

const resumen = ref<any>(null)
const produccion = ref<any>(null)
const infraestructura = ref<any>(null)
const precios = ref<any>(null)
const alertasData = ref<any>(null)
const operacion = ref<any>(null)

const loadingResumen = ref(false)
const loadingProduccion = ref(false)
const loadingInfraestructura = ref(false)
const loadingPrecios = ref(false)
const loadingAlertas = ref(false)
const loadingOperacion = ref(false)

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'resumen',        label: 'Resumen',        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { key: 'produccion',     label: 'Producción',     icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>' },
  { key: 'infraestructura',label: 'Infraestructura',icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' },
  { key: 'precios',        label: 'Precios',        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { key: 'alertas',        label: 'Alertas',        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { key: 'operacion',      label: 'Operación',      icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
]

const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const maxEstado = computed(() => {
  if (!alertasData.value?.por_estado?.length) return 1
  return Math.max(...alertasData.value.por_estado.map((e: any) => e.total))
})

const ocupacionClass = computed(() => {
  const pct = infraestructura.value?.ocupacion_pct ?? 0
  if (pct >= 90) return 'bar-red'
  if (pct >= 70) return 'bar-amber'
  return 'bar-green'
})

async function cargarResumen() {
  if (resumen.value) return
  loadingResumen.value = true
  try { resumen.value = await api.dashboardAdmin.resumen() } catch { } finally { loadingResumen.value = false }
}
async function cargarProduccion() {
  if (produccion.value) return
  loadingProduccion.value = true
  try { produccion.value = await api.dashboardAdmin.produccion() } catch { } finally { loadingProduccion.value = false }
}
async function cargarInfraestructura() {
  if (infraestructura.value) return
  loadingInfraestructura.value = true
  try { infraestructura.value = await api.dashboardAdmin.infraestructura() } catch { } finally { loadingInfraestructura.value = false }
}
async function cargarPrecios() {
  if (precios.value) return
  loadingPrecios.value = true
  try { precios.value = await api.dashboardAdmin.precios() } catch { } finally { loadingPrecios.value = false }
}
async function cargarAlertas() {
  if (alertasData.value) return
  loadingAlertas.value = true
  try { alertasData.value = await api.dashboardAdmin.alertas() } catch { } finally { loadingAlertas.value = false }
}
async function cargarOperacion() {
  if (operacion.value) return
  loadingOperacion.value = true
  try { operacion.value = await api.dashboardAdmin.operacion() } catch { } finally { loadingOperacion.value = false }
}

async function recargarTodo() {
  cargando.value = true
  resumen.value = null; produccion.value = null; infraestructura.value = null
  precios.value = null; alertasData.value = null; operacion.value = null
  await cargarTab(tabActiva.value)
  cargando.value = false
}

async function cargarTab(tab: Tab) {
  if (tab === 'resumen') await cargarResumen()
  else if (tab === 'produccion') await cargarProduccion()
  else if (tab === 'infraestructura') await cargarInfraestructura()
  else if (tab === 'precios') await cargarPrecios()
  else if (tab === 'alertas') await cargarAlertas()
  else if (tab === 'operacion') await cargarOperacion()
}

// Watch tab change and lazy-load
import { watch } from 'vue'
watch(tabActiva, (tab) => cargarTab(tab))

onMounted(() => cargarResumen())

// ── Helpers ──
function formatFecha(f: string | null): string {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tipoPrecioLabel(tipo: string): string {
  const m: Record<string, string> = {
    observado: 'Parcela',
    bodega: 'Bodega',
    mercado_internacional: 'Internacional',
  }
  return m[tipo] || tipo
}

function tipoPrecioClass(tipo: string): string {
  const m: Record<string, string> = {
    observado: 'badge-green',
    bodega: 'badge-blue',
    mercado_internacional: 'badge-purple',
  }
  return m[tipo] || 'badge-gray'
}

function nivelLabel(nivel: string): string {
  const m: Record<string, string> = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' }
  return m[nivel] || nivel
}

function nivelClass(nivel: string): string {
  const m: Record<string, string> = { critico: 'red', alto: 'amber', medio: 'blue', bajo: 'green' }
  return m[nivel] || 'slate'
}

function estadoAlertaClass(estado: string): string {
  const m: Record<string, string> = { pendiente: 'bar-amber', confirmada: 'bar-blue', atendida: 'bar-green', descartada: 'bar-gray' }
  return m[estado] || 'bar-gray'
}

function rolLabel(rol: string): string {
  const m: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', productor: 'Productor', bodeguero: 'Bodeguero', responsable: 'Responsable', tecnico: 'Técnico' }
  return m[rol] || rol
}
</script>

<style scoped>
.dash {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* Header */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.dash-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1A5C38;
  margin: 0 0 4px;
}
.dash-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}
.dash-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.dash-date {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: capitalize;
}
.dash-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.dash-refresh:hover { background: #f3f4f6; border-color: #9ca3af; }
.dash-refresh.loading svg { animation: spin 1s linear infinite; }

/* Tabs */
.dash-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
}
.dash-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: all 0.15s;
}
.dash-tab:hover { color: #1A5C38; }
.dash-tab.active { color: #1A5C38; border-bottom-color: #1A5C38; }

/* Tab content */
.tab-content { animation: fadeUp 0.2s ease; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}
.kpi-grid-3 { grid-template-columns: repeat(3, 1fr); }
.kpi-grid-4 { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}
.kpi-label { font-size: 0.78rem; color: #6b7280; }

/* Color variants */
.kpi-card.green .kpi-icon  { background: rgba(26,92,56,.1);  color: #1A5C38; }
.kpi-card.green .kpi-value { color: #1A5C38; }
.kpi-card.blue .kpi-icon   { background: rgba(37,99,235,.1); color: #2563eb; }
.kpi-card.blue .kpi-value  { color: #2563eb; }
.kpi-card.teal .kpi-icon   { background: rgba(14,148,148,.1);color: #0e9494; }
.kpi-card.teal .kpi-value  { color: #0e9494; }
.kpi-card.amber .kpi-icon  { background: rgba(217,119,6,.1);  color: #d97706; }
.kpi-card.amber .kpi-value { color: #d97706; }
.kpi-card.purple .kpi-icon { background: rgba(124,58,237,.1); color: #7c3aed; }
.kpi-card.purple .kpi-value{ color: #7c3aed; }
.kpi-card.red .kpi-icon    { background: rgba(220,38,38,.1);  color: #dc2626; }
.kpi-card.red .kpi-value   { color: #dc2626; }
.kpi-card.slate .kpi-icon  { background: rgba(100,116,139,.1);color: #64748b; }
.kpi-card.slate .kpi-value { color: #64748b; }

/* Sections */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 24px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
}

/* Tables */
.table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #e5e7eb; margin-bottom: 24px; }
.dash-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.dash-table thead tr { background: #f9fafb; }
.dash-table th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  border-bottom: 1px solid #e5e7eb;
}
.dash-table td {
  padding: 10px 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.dash-table tr:last-child td { border-bottom: none; }
.dash-table tr:hover td { background: #fafafa; }
.empty-cell { text-align: center; color: #9ca3af; padding: 20px !important; }
.cell-muted { color: #9ca3af !important; }

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-green  { background: rgba(26,92,56,.12);  color: #1A5C38; }
.badge-blue   { background: rgba(37,99,235,.12);  color: #2563eb; }
.badge-purple { background: rgba(124,58,237,.12); color: #7c3aed; }
.badge-gray   { background: rgba(100,116,139,.12);color: #64748b; }
.badge-amber  { background: rgba(217,119,6,.12);  color: #d97706; }
.red          { background: rgba(220,38,38,.12);  color: #dc2626; }
.amber        { background: rgba(217,119,6,.12);  color: #d97706; }
.green        { background: rgba(26,92,56,.12);   color: #1A5C38; }
.blue         { background: rgba(37,99,235,.12);  color: #2563eb; }
.slate        { background: rgba(100,116,139,.12);color: #64748b; }

/* Progress bars */
.progress-bar-wrap {
  height: 14px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
  flex: 1;
}
.progress-bar { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.bar-green  { background: #1A5C38; }
.bar-amber  { background: #d97706; }
.bar-red    { background: #dc2626; }
.bar-blue   { background: #2563eb; }
.bar-gray   { background: #9ca3af; }

.ocupacion-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.ocupacion-label { font-size: 0.85rem; font-weight: 500; color: #374151; min-width: 160px; }
.ocupacion-pct { font-size: 1.1rem; font-weight: 700; color: #111827; min-width: 48px; text-align: right; }

/* Mini bar in table */
.mini-bar-wrap {
  display: inline-block;
  width: 60px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  vertical-align: middle;
  margin-right: 6px;
}
.mini-bar { display: block; height: 100%; background: #1A5C38; border-radius: 4px; }

/* Precio cards */
.precios-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.precio-card {
  padding: 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: #fff;
}
.precio-card.badge-green  { border-color: rgba(26,92,56,.3);  background: rgba(26,92,56,.04); }
.precio-card.badge-blue   { border-color: rgba(37,99,235,.3); background: rgba(37,99,235,.04); }
.precio-card.badge-purple { border-color: rgba(124,58,237,.3);background: rgba(124,58,237,.04); }
.precio-tipo { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
.precio-valor { font-size: 1.8rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
.precio-meta { font-size: 0.78rem; color: #6b7280; }
.precio-lugar { font-size: 0.75rem; color: #9ca3af; margin-top: 4px; }

/* Estado bars */
.estado-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.estado-bar-row { display: flex; align-items: center; gap: 12px; }
.estado-bar-label { min-width: 100px; font-size: 0.85rem; color: #374151; text-transform: capitalize; }
.estado-bar-track { flex: 1; height: 10px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
.estado-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
.estado-bar-val { min-width: 36px; text-align: right; font-size: 0.85rem; font-weight: 600; color: #374151; }

/* Roles chips */
.roles-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
.rol-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
}
.rol-chip-name { font-size: 0.85rem; color: #374151; }
.rol-chip-count { font-size: 1.2rem; font-weight: 700; color: #1A5C38; }

/* Calidad */
.calidad-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.calidad-item { display: flex; align-items: center; gap: 12px; }
.calidad-bar-wrap { width: 180px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
.calidad-bar { height: 100%; background: #1A5C38; border-radius: 4px; transition: width 0.6s ease; }
.calidad-label { font-size: 0.85rem; color: #374151; }
.calidad-label strong { color: #1A5C38; }
.calidad-total { font-size: 0.78rem; color: #9ca3af; margin-bottom: 24px; }

/* Info note */
.info-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(217,119,6,.08);
  border: 1px solid rgba(217,119,6,.25);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #92400e;
  margin-bottom: 16px;
}

/* Loading & Empty */
.loading-panel, .empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 160px;
  color: #9ca3af;
  font-size: 0.9rem;
}
.spinner {
  width: 24px; height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #1A5C38;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 600px) {
  .dash { padding: 16px 12px 80px; }
  .dash-title { font-size: 1.2rem; }
  .kpi-grid, .kpi-grid-3 { grid-template-columns: 1fr 1fr; }
  .kpi-grid-4 { grid-template-columns: 1fr 1fr; }
  .dash-header { flex-direction: column; }
  .precios-cards { grid-template-columns: 1fr; }
}
</style>
