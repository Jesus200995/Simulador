<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Precios de Maíz</h1>
          <p class="view-subtitle">Consulta y monitoreo de precios por fuente y región</p>
        </div>
        <div class="view-header-actions">
          <router-link to="/precios/dashboard" class="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Resumen
          </router-link>
          <router-link to="/precios/registrar" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar precio
          </router-link>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
      <select v-model="filtros.tipo_precio" @change="cargar">
        <option value="">Todos los tipos</option>
        <option value="observado">Observado (técnico)</option>
        <option value="bodega">Bodega</option>
        <option value="mercado_internacional">Internacional</option>
        <option value="gobierno">Gobierno</option>
      </select>
      <select v-model="filtros.tipo_maiz" @change="cargar">
        <option value="">Todos los maíces</option>
        <option value="blanco">Blanco</option>
        <option value="amarillo">Amarillo</option>
        <option value="especialidad">Especialidad</option>
      </select>
      <select v-model="filtros.estado" @change="onEstadoChange">
        <option value="">Todos los estados</option>
        <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
      </select>
      <select v-model="filtros.municipio" @change="cargar" :disabled="!filtros.estado">
        <option value="">Todos los municipios</option>
        <option v-for="m in municipiosFiltrados" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        type="date"
        v-model="filtros.fecha_inicio"
        @change="cargar"
        class="date-input"
        placeholder="Desde"
      />
      <input
        type="date"
        v-model="filtros.fecha_fin"
        @change="cargar"
        class="date-input"
        placeholder="Hasta"
      />
    </div>

    <!-- Estado loading -->
    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando precios...</p>
    </div>

    <!-- Estado vacío -->
    <div v-else-if="precios.length === 0" class="state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      <p>No se encontraron registros de precios con los filtros aplicados.</p>
      <router-link to="/precios/registrar" class="btn btn-primary">Registrar primer precio</router-link>
    </div>

    <!-- Tabla -->
    <div v-else class="glass-card table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo precio</th>
            <th>Fuente</th>
            <th>Tipo maíz</th>
            <th class="text-right">Precio $/ton</th>
            <th>Estado</th>
            <th>Municipio</th>
            <th>Infraestructura</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in precios" :key="p.id">
            <td class="td-fecha">{{ formatFecha(p.fecha) }}</td>
            <td>
              <span class="badge" :class="tipoBadge(p.tipo_precio)">{{ tipoLabel(p.tipo_precio) }}</span>
            </td>
            <td class="td-fuente">{{ p.fuente || '—' }}</td>
            <td>{{ maizLabel(p.tipo_maiz) }}</td>
            <td class="text-right td-precio">{{ formatPrecio(p.precio) }}</td>
            <td>{{ p.estado || '—' }}</td>
            <td>{{ p.municipio || '—' }}</td>
            <td class="td-infra">{{ p.infraestructura_nombre || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

const loading = ref(false)
const precios = ref<any[]>([])

const filtros = ref({
  tipo_precio: '',
  tipo_maiz: '',
  estado: '',
  municipio: '',
  fecha_inicio: '',
  fecha_fin: '',
})

const estados = ref<string[]>([])
const municipiosMap = ref<Record<string, string[]>>({})

const municipiosFiltrados = computed(() => {
  if (!filtros.value.estado) return []
  return municipiosMap.value[filtros.value.estado] || []
})

async function cargar() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filtros.value.tipo_precio) params.tipo_precio = filtros.value.tipo_precio
    if (filtros.value.tipo_maiz) params.tipo_maiz = filtros.value.tipo_maiz
    if (filtros.value.estado) params.estado = filtros.value.estado
    if (filtros.value.municipio) params.municipio = filtros.value.municipio
    if (filtros.value.fecha_inicio) params.fecha_inicio = filtros.value.fecha_inicio
    if (filtros.value.fecha_fin) params.fecha_fin = filtros.value.fecha_fin
    const data = await api.preciosMaiz.listar(params)
    precios.value = data.precios

    // Build estado/municipio catalog from results
    const estSet = new Set<string>()
    const munMap: Record<string, Set<string>> = {}
    for (const p of data.precios) {
      if (p.estado) {
        estSet.add(p.estado)
        if (!munMap[p.estado]) munMap[p.estado] = new Set()
        if (p.municipio) munMap[p.estado].add(p.municipio)
      }
    }
    // Merge with existing to not lose filter options
    for (const e of estSet) {
      if (!estados.value.includes(e)) estados.value.push(e)
      if (!municipiosMap.value[e]) municipiosMap.value[e] = []
      const existing = new Set(municipiosMap.value[e])
      for (const m of munMap[e] || []) existing.add(m)
      municipiosMap.value[e] = [...existing].sort()
    }
    estados.value.sort()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function onEstadoChange() {
  filtros.value.municipio = ''
  cargar()
}

function formatFecha(f: string) {
  if (!f) return '—'
  const d = new Date(f)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPrecio(n: number | string) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(n))
}

function tipoLabel(t: string) {
  const map: Record<string, string> = {
    observado: 'Observado',
    bodega: 'Bodega',
    mercado_internacional: 'Internacional',
    gobierno: 'Gobierno',
  }
  return map[t] || t
}

function maizLabel(t: string) {
  const map: Record<string, string> = { blanco: 'Blanco', amarillo: 'Amarillo', especialidad: 'Especialidad' }
  return map[t] || t
}

function tipoBadge(t: string) {
  if (t === 'observado') return 'badge-blue'
  if (t === 'bodega') return 'badge-orange'
  if (t === 'mercado_internacional') return 'badge-purple'
  if (t === 'gobierno') return 'badge-green'
  return 'badge-gray'
}

onMounted(cargar)
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.filter-bar select,
.date-input {
  flex: 1 1 160px;
  min-width: 130px;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  color: var(--color-text, #1a202c);
  outline: none;
  transition: border-color 0.15s;
}
.filter-bar select:focus,
.date-input:focus {
  border-color: var(--color-primary, #0F5132);
}
.filter-bar select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-wrapper {
  overflow-x: auto;
  padding: 0;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.data-table thead th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #718096);
  border-bottom: 1.5px solid var(--color-border, #e2e8f0);
  white-space: nowrap;
}
.data-table tbody tr {
  border-bottom: 1px solid var(--color-border, #f0f4f8);
  transition: background 0.12s;
}
.data-table tbody tr:last-child {
  border-bottom: none;
}
.data-table tbody tr:hover {
  background: rgba(15, 81, 50, 0.03);
}
.data-table td {
  padding: 0.7rem 1rem;
  color: var(--color-text, #1a202c);
  vertical-align: middle;
}
.text-right { text-align: right !important; }
.td-fecha { white-space: nowrap; font-size: 0.82rem; color: var(--color-text-muted, #718096); }
.td-precio { font-weight: 600; font-size: 0.9rem; }
.td-fuente { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-infra { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: var(--color-text-muted, #718096); }

/* badges */
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.badge-blue { background: #ebf4ff; color: #1a56db; }
.badge-orange { background: #fff7ed; color: #c05621; }
.badge-purple { background: #f5f3ff; color: #7e3af2; }
.badge-green { background: #f0fff4; color: #276749; }
.badge-gray { background: #f7fafc; color: #718096; }

.state-empty .btn { margin-top: 1rem; }

@media (max-width: 1024px) {
  .filter-bar select,
  .date-input { flex: 1 1 100%; }
  .data-table thead th:nth-child(6),
  .data-table thead th:nth-child(7),
  .data-table thead th:nth-child(8),
  .data-table tbody td:nth-child(6),
  .data-table tbody td:nth-child(7),
  .data-table tbody td:nth-child(8) { display: none; }
  .data-table { font-size: .75rem; }
  .data-table th, .data-table td { padding: .5rem .4rem; }
}
</style>
