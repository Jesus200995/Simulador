<template>
  <div class="page-container wide">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Infraestructura</h1>
          <p class="view-subtitle">Bodegas, ventanillas y centros de acopio</p>
        </div>
        <div class="view-header-actions">
          <div class="segmented-control segmented-equal">
            <button :class="{ active: filtros.tipo === '' }" @click="setTipo('')">Todas</button>
            <button :class="{ active: filtros.tipo === 'bodega' }" @click="setTipo('bodega')">Bodegas</button>
            <button :class="{ active: filtros.tipo === 'ventanilla' }" @click="setTipo('ventanilla')">Ventanillas</button>
          </div>
          <button class="btn btn-primary" @click="$router.push({ name: 'NuevaInfraestructura' })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Alta
          </button>
        </div>
      </div>
    </div>

    <div class="filter-row">
      <div class="search-bar-unified" style="flex:1;margin-bottom:0">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="filtros.q" type="text" placeholder="Buscar por nombre, clave o municipio..." @input="buscar" />
      </div>
      <div class="filter-bar" style="margin-bottom:0">
        <select v-model="filtros.estado" @change="cargar">
          <option value="">Todos los estados</option>
          <option v-for="e in catalogos.estados" :key="e" :value="e">{{ e }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando infraestructura...</p>
    </div>
    <div v-else-if="lista.length === 0" class="state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
      <p>No se encontraron resultados.</p>
    </div>

    <div v-else class="card-grid">
      <div
        v-for="item in lista"
        :key="item.id"
        class="glass-card interactive infra-card"
        @click="$router.push({ name: 'InfraestructuraDetalle', params: { id: item.id } })"
      >
        <div class="infra-badges">
          <span class="badge" :class="item.es_ventanilla ? 'badge-purple' : 'badge-blue'">
            {{ item.es_ventanilla ? 'Ventanilla' : 'Bodega' }}
          </span>
          <span class="badge" :class="item.estatus_operativo === 'activa' ? 'badge-green' : 'badge-red'">{{ item.estatus_operativo }}</span>
        </div>
        <div class="infra-nombre">{{ item.nombre }}</div>
        <div class="infra-ubicacion">{{ item.municipio }}, {{ item.estado }}</div>
        <div class="infra-meta">
          <span v-if="item.capacidad_ton">{{ item.capacidad_ton.toLocaleString() }} ton</span>
          <span v-if="item.clave" class="infra-clave">{{ item.clave }}</span>
        </div>
        <div v-if="item.ultimo_precio" class="infra-precio">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <strong>${{ item.ultimo_precio.precio?.toLocaleString() }}/ton</strong>
          <span>{{ item.ultimo_precio.tipo_maiz }} · {{ formatFecha(item.ultimo_precio.fecha) }}</span>
        </div>
        <div class="infra-tags">
          <span v-if="item.realiza_acopio" class="tag">Acopio</span>
          <span v-if="item.opera_incentivos" class="tag">Incentivos</span>
          <span v-if="item.opera_coberturas" class="tag">Coberturas</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const lista = ref<any[]>([])
const loading = ref(true)
const catalogos = ref<any>({ estados: [], municipios: [] })
const filtros = ref({ tipo: '', estado: '', q: '' })
let debounce: ReturnType<typeof setTimeout> | null = null

async function cargar() {
  loading.value = true
  try {
    const data = await api.infraestructura.listar({
      tipo: filtros.value.tipo || undefined,
      estado: filtros.value.estado || undefined,
      q: filtros.value.q || undefined,
    })
    lista.value = data.infraestructura
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarCatalogos() {
  try {
    const data = await api.infraestructura.catalogos()
    catalogos.value = data
  } catch (e) {
    console.error(e)
  }
}

function setTipo(tipo: string) {
  filtros.value.tipo = tipo
  cargar()
}

function buscar() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(cargar, 400)
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

onMounted(async () => {
  await Promise.all([cargar(), cargarCatalogos()])
})
</script>

<style scoped>
.filter-row {
  display: flex; gap: .75rem; margin-bottom: 1.5rem;
  align-items: center; flex-wrap: wrap;
}

.infra-card { padding: 1.25rem !important; }

.infra-badges { display: flex; gap: .375rem; margin-bottom: .75rem; }

.infra-nombre {
  font-size: 1rem; font-weight: 700; color: var(--color-text);
  letter-spacing: -.02em; margin-bottom: .15rem;
}

.infra-ubicacion { font-size: .8125rem; color: var(--color-text-secondary); margin-bottom: .5rem; }

.infra-meta {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .78rem; color: var(--color-text-tertiary); margin-bottom: .5rem;
}

.infra-clave { font-family: var(--font-mono); font-size: .75rem; }

.infra-precio {
  display: flex; align-items: center; gap: .375rem;
  font-size: .8125rem; color: var(--color-text-secondary);
  background: var(--color-success-bg); border-radius: var(--radius-sm);
  padding: .4rem .75rem; margin-bottom: .625rem;
}

.infra-precio strong { color: var(--color-text); }
.infra-precio span { font-size: .75rem; color: var(--color-text-tertiary); }
.infra-precio svg { color: var(--color-success); flex-shrink: 0; }

.infra-tags { display: flex; gap: .375rem; flex-wrap: wrap; }

@media (max-width: 1024px) {
  .filter-row { flex-direction: column; align-items: stretch; }
  .view-header-actions { flex-direction: column; align-items: stretch; }
}
</style>
