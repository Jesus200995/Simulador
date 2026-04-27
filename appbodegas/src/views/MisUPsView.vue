<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Mis Unidades de Producción</h1>
          <p class="view-subtitle">Consulta y gestión de tus UPs registradas</p>
        </div>
        <div class="view-header-actions">
          <router-link to="/productor/paso1" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva UP
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando tus UPs...</p>
    </div>

    <div v-else-if="ups.length === 0" class="glass-card state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <p>Aún no tienes UPs registradas.</p>
      <router-link to="/productor/paso1" class="btn btn-primary">Registrar primera UP</router-link>
    </div>

    <div v-else class="ups-grid">
      <div
        v-for="up in ups"
        :key="up.up_id"
        class="glass-card interactive up-card"
        @click="$router.push({ name: 'MisUPsDetalle', params: { up_id: up.up_id } })"
      >
        <div class="up-header">
          <div class="up-name">{{ up.up_name }}</div>
          <span class="up-area" v-if="up.area_ha_calc">{{ Number(up.area_ha_calc).toFixed(2) }} ha</span>
        </div>
        <div class="up-meta">
          <span class="up-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ up.state_name || '—' }} · {{ up.municipality_name || '—' }}
          </span>
        </div>
        <div class="up-ciclo" v-if="up.ultimo_ciclo">
          Último ciclo: <strong>{{ up.ultimo_ciclo.cycle_year }} / {{ up.ultimo_ciclo.cycle_type }}</strong>
        </div>
        <div class="up-ciclo muted" v-else>Sin ciclos registrados</div>
        <div class="up-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const loading = ref(true)
const ups = ref<any[]>([])

async function cargar() {
  loading.value = true
  try {
    const data = await api.misUps.listar()
    ups.value = data.ups || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.ups-grid { display: flex; flex-direction: column; gap: .75rem; }

.up-card {
  display: flex; flex-direction: column; gap: .5rem;
  padding: 1.25rem !important; position: relative; cursor: pointer;
}

.up-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.up-name { font-size: 1rem; font-weight: 700; color: var(--color-text); }
.up-area {
  font-size: .78rem; font-weight: 600; padding: .2rem .6rem;
  background: rgba(15, 81, 50,.08); color: #0F5132; border-radius: 99px; white-space: nowrap;
}

.up-meta { display: flex; gap: .75rem; flex-wrap: wrap; }
.up-location {
  display: flex; align-items: center; gap: .3rem;
  font-size: .8125rem; color: var(--color-text-secondary);
}
.up-location svg { color: var(--color-text-tertiary); }

.up-ciclo { font-size: .78rem; color: var(--color-text-secondary); }
.up-ciclo.muted { color: var(--color-text-tertiary); }

.up-chevron {
  position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%);
  color: var(--color-text-tertiary); opacity: .4;
}
.up-card:hover .up-chevron { opacity: .7; }

.state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; gap: .75rem; color: var(--color-text-muted, #718096); }
.state-empty svg { width: 48px; height: 48px; opacity: .35; }
.state-empty .btn { margin-top: .5rem; }
.state-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: .75rem; color: var(--color-text-muted, #718096); }

.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.spinner-dark { border-top-color: var(--color-primary, #0F5132); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
