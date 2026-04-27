<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Resumen de Precios</h1>
          <p class="view-subtitle">KPIs y análisis por tipo de maíz · últimos 90 días</p>
        </div>
        <div class="view-header-actions">
          <router-link to="/precios" class="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Ver todos
          </router-link>
          <router-link to="/precios/registrar" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando resumen...</p>
    </div>

    <template v-else>
      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-icon kpi-icon-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ formatPrecio(kpi?.promedio) }}</div>
            <div class="kpi-label">Precio promedio</div>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon kpi-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ formatPrecio(kpi?.maximo) }}</div>
            <div class="kpi-label">Precio máximo</div>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon kpi-icon-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ formatPrecio(kpi?.minimo) }}</div>
            <div class="kpi-label">Precio mínimo</div>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon kpi-icon-gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ kpi?.total_registros ?? 0 }}</div>
            <div class="kpi-label">Registros (90 días)</div>
          </div>
        </div>
      </div>

      <!-- Última referencia internacional y gobierno -->
      <div class="ref-grid">
        <div class="glass-card ref-card" v-if="ultimoInt">
          <div class="ref-header">
            <span class="badge badge-purple">Internacional</span>
            <span class="ref-fecha">{{ formatFecha(ultimoInt.fecha) }}</span>
          </div>
          <div class="ref-precio">{{ formatPrecio(ultimoInt.precio) }}</div>
          <div class="ref-maiz">{{ maizLabel(ultimoInt.tipo_maiz) }}</div>
          <div class="ref-detalle" v-if="ultimoInt.valor_origen">
            {{ ultimoInt.valor_origen }} {{ ultimoInt.unidad_origen }}
            <span v-if="ultimoInt.tipo_cambio"> · TC: {{ ultimoInt.tipo_cambio }}</span>
          </div>
        </div>
        <div class="glass-card ref-card ref-empty" v-else>
          <div class="badge badge-purple">Internacional</div>
          <p>Sin registro reciente</p>
        </div>

        <div class="glass-card ref-card" v-if="ultimoGob">
          <div class="ref-header">
            <span class="badge badge-green">Gobierno</span>
            <span class="ref-fecha">{{ formatFecha(ultimoGob.fecha) }}</span>
          </div>
          <div class="ref-precio">{{ formatPrecio(ultimoGob.precio) }}</div>
          <div class="ref-maiz">{{ maizLabel(ultimoGob.tipo_maiz) }}</div>
          <div class="ref-detalle" v-if="ultimoGob.programa">{{ ultimoGob.programa }}</div>
        </div>
        <div class="glass-card ref-card ref-empty" v-else>
          <div class="badge badge-green">Gobierno</div>
          <p>Sin registro reciente</p>
        </div>
      </div>

      <!-- Tabla por tipo de maíz (pivot por fuente) -->
      <div class="glass-card table-wrapper" v-if="porTipoMaiz.length > 0">
        <div class="table-header-row">
          <h3 class="table-title">Promedio por tipo de maíz · últimos 90 días</h3>
          <p class="table-sub">Precio promedio ($/ton) según la fuente del registro</p>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de maíz</th>
              <th class="text-right">
                <span class="badge badge-blue th-badge">Observado</span>
              </th>
              <th class="text-right">
                <span class="badge badge-orange th-badge">Bodega</span>
              </th>
              <th class="text-right">
                <span class="badge badge-purple th-badge">Internacional</span>
              </th>
              <th class="text-right">
                <span class="badge badge-green th-badge">Gobierno</span>
              </th>
              <th class="text-right">Registros</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in porTipoMaiz" :key="row.tipo_maiz">
              <td>
                <span class="maiz-dot" :class="maizDot(row.tipo_maiz)"></span>
                {{ maizLabel(row.tipo_maiz) }}
              </td>
              <td class="text-right td-precio">{{ formatPrecio(row.observado) }}</td>
              <td class="text-right td-precio">{{ formatPrecio(row.bodega) }}</td>
              <td class="text-right td-precio">{{ formatPrecio(row.internacional) }}</td>
              <td class="text-right td-precio">{{ formatPrecio(row.gobierno) }}</td>
              <td class="text-right">{{ row.registros }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="glass-card state-empty" v-else>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <p>No hay datos de precios en los últimos 90 días.</p>
        <router-link to="/precios/registrar" class="btn btn-primary">Registrar primer precio</router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const loading = ref(false)
const kpi = ref<any>(null)
const porTipoMaiz = ref<any[]>([])
const ultimoInt = ref<any>(null)
const ultimoGob = ref<any>(null)

async function cargar() {
  loading.value = true
  try {
    const data = await api.preciosMaiz.dashboard()
    kpi.value = data.kpi
    porTipoMaiz.value = data.por_tipo_maiz
    ultimoInt.value = data.ultimo_internacional
    ultimoGob.value = data.ultimo_gobierno
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function formatPrecio(n: number | string | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(n))
}

function formatFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function maizLabel(t: string) {
  const map: Record<string, string> = { blanco: 'Blanco', amarillo: 'Amarillo', especialidad: 'Especialidad' }
  return map[t] || t
}

function maizDot(t: string) {
  if (t === 'blanco') return 'dot-white'
  if (t === 'amarillo') return 'dot-yellow'
  return 'dot-purple'
}

onMounted(cargar)
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}
.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon-primary { background: rgba(15, 81, 50,0.1); color: var(--color-primary, #0F5132); }
.kpi-icon-green { background: #f0fff4; color: #276749; }
.kpi-icon-red { background: #fff5f5; color: #c53030; }
.kpi-icon-gray { background: #f7fafc; color: #4a5568; }

.kpi-value { font-size: 1.25rem; font-weight: 800; color: var(--color-text, #1a202c); }
.kpi-label { font-size: 0.78rem; color: var(--color-text-muted, #718096); margin-top: 0.1rem; }

/* Referencias */
.ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
@media (max-width: 600px) { .ref-grid { grid-template-columns: 1fr; } }

.ref-card { padding: 1.25rem; }
.ref-empty {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 0.5rem; color: var(--color-text-muted, #718096);
  font-size: 0.85rem;
}
.ref-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
.ref-fecha { font-size: 0.78rem; color: var(--color-text-muted, #718096); }
.ref-precio { font-size: 1.5rem; font-weight: 800; color: var(--color-primary, #0F5132); margin-bottom: 0.25rem; }
.ref-maiz { font-size: 0.82rem; font-weight: 600; color: var(--color-text, #1a202c); margin-bottom: 0.2rem; }
.ref-detalle { font-size: 0.78rem; color: var(--color-text-muted, #718096); }

/* Table */
.table-wrapper { overflow-x: auto; padding: 0; }
.table-header-row { padding: 1rem 1.25rem 0; }
.table-title { font-size: 0.9rem; font-weight: 700; color: var(--color-text, #1a202c); margin: 0 0 0.5rem; }

.data-table {
  width: 100%; border-collapse: collapse; font-size: 0.875rem;
}
.data-table thead th {
  padding: 0.7rem 1rem; text-align: left; font-weight: 600;
  font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--color-text-muted, #718096); border-bottom: 1.5px solid var(--color-border, #e2e8f0);
  white-space: nowrap;
}
.data-table tbody tr { border-bottom: 1px solid var(--color-border, #f0f4f8); }
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: rgba(15, 81, 50,0.03); }
.data-table td { padding: 0.7rem 1rem; color: var(--color-text, #1a202c); vertical-align: middle; }
.text-right { text-align: right !important; }
.td-precio { font-weight: 700; }

/* Maiz dots */
.maiz-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.4rem; vertical-align: middle; }
.dot-white { background: #a0aec0; border: 1.5px solid #cbd5e0; }
.dot-yellow { background: #d69e2e; }
.dot-purple { background: #7e3af2; }

/* Badges */
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.badge-blue { background: #ebf4ff; color: #1a56db; }
.badge-orange { background: #fff7ed; color: #c05621; }
.badge-purple { background: #f5f3ff; color: #7e3af2; }
.badge-green { background: #f0fff4; color: #276749; }
.th-badge { font-size: 0.65rem; }

/* table sub */
.table-sub { font-size: 0.75rem; color: var(--color-text-muted, #718096); margin: 0 0 0.5rem; }

/* spinner */
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.spinner-dark { border-top-color: var(--color-primary, #0F5132); }
@keyframes spin { to { transform: rotate(360deg); } }

.state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; gap: 0.75rem; color: var(--color-text-muted, #718096); }
.state-empty svg { width: 48px; height: 48px; opacity: 0.35; }
.state-empty .btn { margin-top: 0.5rem; }
.state-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 0.75rem; color: var(--color-text-muted, #718096); }
</style>
