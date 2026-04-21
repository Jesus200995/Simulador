<template>
  <div class="seguimiento-list">
    <div class="header">
      <h1>Seguimiento de Cultivo</h1>
      <p class="subtitle">Selecciona un productor para registrar seguimiento</p>
    </div>

    <div class="search-bar">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por nombre o CURP..."
        @input="buscar"
      />
    </div>

    <div v-if="loading" class="loading">Cargando productores...</div>

    <div v-else-if="productores.length === 0" class="empty">
      No se encontraron productores registrados.
    </div>

    <div v-else class="productores-lista">
      <div
        v-for="prod in productores"
        :key="prod.producer_id"
        class="productor-card"
      >
        <div class="prod-info">
          <strong>{{ prod.apellido_paterno }} {{ prod.apellido_materno }}, {{ prod.nombres }}</strong>
          <span class="curp">{{ prod.curp }}</span>
          <span class="badge" :class="prod.estatus_registro">{{ prod.estatus_registro }}</span>
        </div>

        <div v-if="prod.ups && prod.ups.length > 0" class="ups-lista">
          <div v-for="up in prod.ups" :key="up.up_id" class="up-item">
            <div class="up-info">
              <span class="up-name">{{ up.up_name }}</span>
              <span class="up-area">{{ up.area_ha_calc?.toFixed(2) }} ha</span>
              <span class="up-loc">{{ up.municipality_name }}, {{ up.state_name }}</span>
            </div>

            <div v-if="up.ciclos && up.ciclos.length > 0" class="ciclos">
              <button
                v-for="ciclo in up.ciclos"
                :key="ciclo.cycle_id"
                class="ciclo-btn"
                @click="seleccionar(prod, up, ciclo)"
              >
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
.seguimiento-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}
.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem;
}
.subtitle { color: #718096; font-size: 0.9rem; margin-bottom: 1.5rem; }
.search-bar input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
  box-sizing: border-box;
}
.loading, .empty { text-align: center; color: #718096; padding: 2rem; }
.productor-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff;
}
.prod-info { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.prod-info strong { font-size: 1rem; color: #2d3748; }
.curp { color: #718096; font-size: 0.8rem; font-family: monospace; }
.badge {
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e2e8f0;
  color: #4a5568;
}
.badge.completo { background: #c6f6d5; color: #276749; }
.badge.pendiente { background: #fef3c7; color: #92400e; }
.ups-lista { display: flex; flex-direction: column; gap: 0.5rem; }
.up-item {
  background: #f7fafc;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.up-info { display: flex; flex-direction: column; gap: 2px; }
.up-name { font-weight: 600; font-size: 0.9rem; color: #2d3748; }
.up-area, .up-loc { font-size: 0.78rem; color: #718096; }
.ciclos { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.ciclo-btn {
  background: #2f855a;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}
.ciclo-btn:hover { background: #276749; }
.no-ciclos, .no-ups { font-size: 0.82rem; color: #a0aec0; font-style: italic; }
</style>
