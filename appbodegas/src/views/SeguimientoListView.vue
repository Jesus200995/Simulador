<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Seguimiento de Cultivo</h1>
          <p class="view-subtitle">Selecciona un productor para registrar seguimiento</p>
        </div>
      </div>
    </div>

    <div class="search-bar-unified">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por nombre o CURP..."
        @input="buscar"
      />
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando productores...</p>
    </div>

    <div v-else-if="productores.length === 0" class="state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <p>No se encontraron productores registrados.</p>
    </div>

    <div v-else class="productores-lista">
      <div
        v-for="prod in productores"
        :key="prod.producer_id"
        class="glass-card prod-card"
      >
        <div class="prod-header">
          <div class="prod-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="prod-info">
            <div class="prod-name">{{ prod.apellido_paterno }} {{ prod.apellido_materno }}, {{ prod.nombres }}</div>
            <div class="prod-curp">{{ prod.curp }}</div>
          </div>
          <span class="badge" :class="prod.estatus_registro === 'completo' ? 'badge-green' : 'badge-yellow'">{{ prod.estatus_registro }}</span>
        </div>

        <div v-if="prod.ups && prod.ups.length > 0" class="ups-lista">
          <div v-for="up in prod.ups" :key="up.up_id" class="up-item">
            <div class="up-info">
              <span class="up-name">{{ up.up_name }}</span>
              <span class="up-meta">{{ up.area_ha_calc?.toFixed(2) }} ha · {{ up.municipality_name }}, {{ up.state_name }}</span>
            </div>

            <div v-if="up.ciclos && up.ciclos.length > 0" class="ciclos">
              <button
                v-for="ciclo in up.ciclos"
                :key="ciclo.cycle_id"
                class="ciclo-btn"
                @click="seleccionar(prod, up, ciclo)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>
                {{ ciclo.cycle_year }} {{ ciclo.cycle_type }}
              </button>
            </div>
            <div v-else class="no-ciclos">Sin ciclos registrados</div>
          </div>
        </div>
        <div v-else class="no-ups">Sin UPs registradas</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const productores = ref<any[]>([])
const loading = ref(true)
const busqueda = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function cargar(q?: string) {
  loading.value = true
  try {
    const data = await api.seguimiento.productores(q)
    productores.value = data.productores
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function buscar() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => cargar(busqueda.value || undefined), 400)
}

function seleccionar(prod: any, up: any, ciclo: any) {
  router.push({
    name: 'SeguimientoVisita',
    query: {
      producer_id: prod.producer_id,
      up_id: up.up_id,
      ciclo_id: ciclo.cycle_id,
      nombres: `${prod.apellido_paterno} ${prod.nombres}`,
      up_name: up.up_name,
      ciclo_label: `${ciclo.cycle_year} ${ciclo.cycle_type}`,
    },
  })
}

onMounted(() => cargar())
</script>

<style scoped>
.productores-lista { display: flex; flex-direction: column; gap: .75rem; }

.prod-card { padding: 1.25rem; }

.prod-header {
  display: flex; align-items: center; gap: .75rem;
  margin-bottom: 1rem; padding-bottom: .875rem;
  border-bottom: .5px solid var(--color-separator);
}

.prod-avatar {
  width: 42px; height: 42px; border-radius: var(--radius-md);
  background: var(--color-primary-subtle); color: var(--color-primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.prod-info { flex: 1; min-width: 0; }
.prod-name { font-size: .9375rem; font-weight: 650; color: var(--color-text); letter-spacing: -.015em; }
.prod-curp { font-size: .75rem; color: var(--color-text-tertiary); font-family: var(--font-mono); margin-top: 2px; }

.ups-lista { display: flex; flex-direction: column; gap: .5rem; }

.up-item {
  background: var(--color-fill-secondary);
  border-radius: var(--radius-md);
  padding: .875rem 1rem;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: .625rem;
  border: .5px solid var(--color-separator);
}

.up-info { display: flex; flex-direction: column; gap: 2px; }
.up-name { font-weight: 650; font-size: .875rem; color: var(--color-text); }
.up-meta { font-size: .78rem; color: var(--color-text-secondary); }

.ciclos { display: flex; gap: .5rem; flex-wrap: wrap; }

.ciclo-btn {
  background: linear-gradient(180deg, var(--color-primary-hover), var(--color-primary));
  color: #fff; border: none; border-radius: var(--radius-sm);
  padding: .4rem .875rem; font-size: .8125rem; font-weight: 600;
  cursor: pointer; transition: all .2s var(--ease-out);
  display: inline-flex; align-items: center; gap: .35rem;
  font-family: var(--font-family);
  box-shadow: 0 1px 3px rgba(105, 28, 50, 0.2);
}
.ciclo-btn:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(105, 28, 50, 0.25); }
.ciclo-btn:active { transform: scale(.97); }

.no-ciclos, .no-ups {
  font-size: .8125rem; color: var(--color-text-tertiary);
  font-style: italic; padding: .25rem 0;
}

@media (max-width: 1024px) {
  .prod-header { flex-wrap: wrap; }
  .up-item { flex-direction: column; align-items: flex-start; }
  .ciclos { width: 100%; }
}
</style>
