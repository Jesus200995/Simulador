<template>
  <div class="infra-page">
    <div class="page-header">
      <h1>Infraestructura</h1>
      <div class="header-actions">
        <div class="tipo-tabs">
          <button :class="{ active: filtros.tipo === '' }" @click="setTipo('')">Todas</button>
          <button :class="{ active: filtros.tipo === 'bodega' }" @click="setTipo('bodega')">Bodegas</button>
          <button :class="{ active: filtros.tipo === 'ventanilla' }" @click="setTipo('ventanilla')">Ventanillas</button>
        </div>
        <button class="btn-primary" @click="$router.push({ name: 'NuevaInfraestructura' })">+ Alta</button>
      </div>
    </div>

    <div class="filtros">
      <input v-model="filtros.q" type="text" placeholder="Buscar por nombre, clave o municipio..." @input="buscar" />
      <select v-model="filtros.estado" @change="cargar">
        <option value="">Todos los estados</option>
        <option v-for="e in catalogos.estados" :key="e" :value="e">{{ e }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Cargando infraestructura...</div>
    <div v-else-if="lista.length === 0" class="empty">No se encontraron resultados.</div>

    <div v-else class="lista-grid">
      <div
        v-for="item in lista"
        :key="item.id"
        class="infra-card"
        @click="$router.push({ name: 'InfraestructuraDetalle', params: { id: item.id } })"
      >
        <div class="card-top">
          <span :class="['tipo-badge', item.es_ventanilla ? 'ventanilla' : 'bodega']">
            {{ item.es_ventanilla ? 'Ventanilla' : 'Bodega' }}
          </span>
          <span :class="['estatus-badge', item.estatus_operativo]">{{ item.estatus_operativo }}</span>
        </div>
        <div class="card-nombre">{{ item.nombre }}</div>
        <div class="card-ubicacion">{{ item.municipio }}, {{ item.estado }}</div>
        <div class="card-meta">
          <span v-if="item.capacidad_ton">Cap: {{ item.capacidad_ton.toLocaleString() }} ton</span>
          <span v-if="item.clave" class="clave">{{ item.clave }}</span>
        </div>
        <div v-if="item.ultimo_precio" class="precio-info">
          Último precio: <strong>${{ item.ultimo_precio.precio?.toLocaleString() }}/ton</strong>
          {{ item.ultimo_precio.tipo_maiz }} · {{ formatFecha(item.ultimo_precio.fecha) }}
        </div>
        <div class="funciones">
          <span v-if="item.realiza_acopio" class="func-tag">Acopio</span>
          <span v-if="item.opera_incentivos" class="func-tag">Incentivos</span>
          <span v-if="item.opera_coberturas" class="func-tag">Coberturas</span>
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
.infra-page { max-width: 1000px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 0.75rem; }
.tipo-tabs { display: flex; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.tipo-tabs button { border: none; background: #fff; padding: 0.4rem 0.85rem; font-size: 0.85rem; cursor: pointer; color: #718096; }
.tipo-tabs button.active { background: #2f855a; color: #fff; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.filtros { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.filtros input { flex: 1; min-width: 200px; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; }
.filtros select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; }
.loading, .empty { text-align: center; color: #718096; padding: 2rem; }
.lista-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.infra-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 1.1rem; cursor: pointer; transition: box-shadow 0.15s;
}
.infra-card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.08); }
.card-top { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
.tipo-badge, .estatus-badge { padding: 2px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; }
.tipo-badge.bodega { background: #bee3f8; color: #2b6cb0; }
.tipo-badge.ventanilla { background: #d6bcfa; color: #553c9a; }
.estatus-badge.activa { background: #c6f6d5; color: #276749; }
.estatus-badge.inactiva { background: #fed7d7; color: #9b2c2c; }
.card-nombre { font-size: 1rem; font-weight: 700; color: #2d3748; margin-bottom: 0.2rem; }
.card-ubicacion { font-size: 0.8rem; color: #718096; margin-bottom: 0.4rem; }
.card-meta { display: flex; justify-content: space-between; font-size: 0.78rem; color: #a0aec0; margin-bottom: 0.4rem; }
.clave { font-family: monospace; }
.precio-info { font-size: 0.8rem; color: #4a5568; background: #f0fff4; border-radius: 6px; padding: 0.3rem 0.6rem; margin-bottom: 0.4rem; }
.funciones { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.func-tag { background: #edf2f7; color: #4a5568; padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; }
</style>
