<template>
  <div class="detalle-page">
    <header class="app-header">
      <router-link to="/" class="detalle-back-btn" aria-label="Volver al mapa">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span class="detalle-back-label">Mapa</span>
      </router-link>
      <div class="header-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <div class="header-brand-text">
          <span class="header-brand-title">Bodegas de Maiz</span>
          <span class="header-brand-subtitle">Sistema Nacional de Monitoreo</span>
        </div>
      </div>
      <div class="header-spacer"></div>
    </header>

    <main class="detalle-main">
      <div class="mis-bodegas-header">
        <h1>Mis bodegas</h1>
        <router-link to="/nueva-bodega" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva bodega
        </router-link>
      </div>

      <div v-if="loading" class="mis-bodegas-loading">
        <span class="spinner spinner-dark"></span> Cargando tus bodegas...
      </div>

      <div v-else-if="error" class="alert alert-error">{{ error }}</div>

      <div v-else-if="bodegas.length === 0" class="mis-bodegas-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <p>No tienes bodegas registradas</p>
        <router-link to="/nueva-bodega" class="btn btn-primary">Registrar nueva bodega</router-link>
      </div>

      <div v-else class="mis-bodegas-grid">
        <router-link
          v-for="b in bodegas"
          :key="b.id"
          :to="`/bodega/${b.id}`"
          class="mis-bodega-card"
        >
          <div class="mis-bodega-top">
            <span class="mis-bodega-clave">{{ b.clave || 'Sin clave' }}</span>
            <span class="bodega-badge" :class="b.estatus">{{ b.estatus }}</span>
          </div>
          <h3 class="mis-bodega-nombre">{{ b.nombre }}</h3>
          <p class="mis-bodega-ubicacion">{{ b.municipio }}, {{ b.estado }}</p>
          <div class="mis-bodega-stats">
            <div class="mis-bodega-stat">
              <span class="stat-value">{{ b.total_inventarios }}</span>
              <span class="stat-label">Registros</span>
            </div>
            <div class="mis-bodega-stat">
              <span class="stat-value">{{ b.capacidad_toneladas?.toLocaleString() || '—' }}</span>
              <span class="stat-label">Ton capacidad</span>
            </div>
            <div class="mis-bodega-stat">
              <span class="stat-value">{{ b.ultimo_inventario ? new Date(b.ultimo_inventario).toLocaleDateString() : '—' }}</span>
              <span class="stat-label">Ultimo registro</span>
            </div>
          </div>
          <div v-if="b.estatus === 'rechazada'" class="mis-bodega-rechazada">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Bodega rechazada
          </div>
          <div v-if="b.estatus === 'pendiente'" class="mis-bodega-pendiente-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            En espera de aprobacion
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import type { MiBodega } from '@/types'

const bodegas = ref<MiBodega[]>([])
const loading = ref(true)
const error = ref('')

async function fetchMisBodegas() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.misBodegas.listar()
    bodegas.value = data.bodegas
  } catch (err: any) {
    error.value = err.message || 'Error al cargar bodegas'
  } finally {
    loading.value = false
  }
}

onMounted(fetchMisBodegas)
</script>

<style scoped>
.mis-bodegas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.mis-bodegas-header h1 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.mis-bodegas-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.mis-bodegas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
  color: var(--color-text-tertiary);
}

.mis-bodegas-empty p {
  font-size: 0.95rem;
  margin: 0;
}

.mis-bodegas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.mis-bodega-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.25s, transform 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mis-bodega-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.mis-bodega-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mis-bodega-clave {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mis-bodega-nombre {
  font-size: 1.05rem;
  font-weight: 650;
  color: var(--color-text);
  margin: 0.15rem 0 0;
}

.mis-bodega-ubicacion {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.mis-bodega-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 0.5px solid var(--color-separator);
}

.mis-bodega-stat {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mis-bodega-rechazada {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.7rem;
  background: #FFEAEA;
  color: #C0392B;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
}

.mis-bodega-pendiente-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.7rem;
  background: #FFF8E1;
  color: #F57F17;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .mis-bodegas-grid {
    grid-template-columns: 1fr;
  }
}
</style>
