<template>
  <div class="detalle-page">
    <!-- Header -->
    <header class="app-header">
      <button class="sidebar-toggle" @click="mobileNavOpen = !mobileNavOpen; profileOpen = false" aria-label="Menu">
        <span v-if="!mobileNavOpen" class="toggle-bars">
          <span></span><span></span><span></span>
        </span>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="header-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
        <div class="header-brand-text">
          <span class="header-brand-title">Bodegas de Maiz</span>
          <span class="header-brand-subtitle">Sistema Nacional de Monitoreo</span>
        </div>
      </div>
      <nav class="header-nav">
        <router-link to="/">Mapa</router-link>
        <span>Inventarios</span>
        <span>Simulador</span>
      </nav>
      <div class="header-spacer"></div>
      <div class="header-profile" ref="profileRef">
        <button class="profile-avatar-btn" @click="profileOpen = !profileOpen; mobileNavOpen = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <svg class="avatar-chevron" :class="{ open: profileOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <Transition name="profile-pop">
          <div v-if="profileOpen" class="profile-dropdown">
            <div class="profile-dropdown-header">
              <div class="profile-dropdown-avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="profile-dropdown-name">{{ authStore.usuario?.nombre_completo }}</div>
            </div>
            <div class="profile-dropdown-body">
              <div class="profile-dropdown-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>{{ authStore.usuario?.email }}</span>
              </div>
              <div class="profile-dropdown-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
                <span>{{ authStore.usuario?.curp }}</span>
              </div>
            </div>
            <div class="profile-dropdown-footer">
              <button class="profile-logout-btn" @click="handleLogout">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Cerrar sesion
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </header>

    <!-- Sidebar panel (same as MapView) -->
    <div class="sidebar-overlay" :class="{ active: mobileNavOpen }" @click="mobileNavOpen = false"></div>
    <aside class="detalle-sidebar" :class="{ open: mobileNavOpen }">
      <div class="panel-mobile-header">
        <span>Explorar Bodegas</span>
        <button class="panel-close-btn" @click="mobileNavOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <!-- Nav tabs -->
      <div class="panel-nav-tabs">
        <router-link to="/" class="panel-nav-tab active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Mapa
        </router-link>
        <span class="panel-nav-tab disabled">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Inventarios
        </span>
        <span class="panel-nav-tab disabled">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          Simulador
        </span>
      </div>
      <!-- Search -->
      <div class="panel-search">
        <div class="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="sidebarSearch" type="text" class="search-input" placeholder="Buscar bodega, municipio..." />
        </div>
      </div>
      <!-- Bodega list -->
      <div class="panel-list-scroll">
        <router-link
          v-for="b in filteredBodegas"
          :key="b.id"
          :to="'/bodega/' + b.id"
          class="bodega-list-item"
          @click="mobileNavOpen = false"
        >
          <div class="bodega-list-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div class="bodega-list-info">
            <div class="bodega-list-name">{{ b.nombre }}</div>
            <div class="bodega-list-sub">{{ b.municipio }}, {{ b.estado }}</div>
            <div class="bodega-list-cap">{{ formatNumber(b.capacidad_toneladas) }} ton</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bodega-list-chevron"><polyline points="9 18 15 12 9 6"/></svg>
        </router-link>
        <div v-if="filteredBodegas.length === 0" class="bodega-list-empty">Sin resultados</div>
      </div>
    </aside>

    <main class="detalle-main">
      <div v-if="loading" class="detalle-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando informacion...</span>
      </div>

      <div v-else-if="bodega" class="detalle-content">
        <!-- Breadcrumb -->
        <div class="detalle-breadcrumb">
          <router-link to="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver al mapa
          </router-link>
        </div>

        <!-- Encabezado -->
        <div class="detalle-header-card">
          <div class="detalle-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div class="detalle-header-info">
            <h1 class="detalle-title">{{ bodega.nombre }}</h1>
            <p class="detalle-subtitle" v-if="bodega.clave">Clave: {{ bodega.clave }}</p>
            <p class="detalle-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ bodega.municipio }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado }}
              <span v-if="bodega.ddr"> · DDR {{ bodega.ddr }}</span>
            </p>
          </div>
        </div>

        <!-- KPI — colores semánticos:
             Capacidad (toneladas) = amber/gold (#A07A3A)
             DDR (división regional) = indigo (#5856D6)
             CADER (centro de apoyo) = forest green (#2D7D46) -->
        <div class="detalle-kpi-grid">
          <div class="detalle-kpi capacidad">
            <div class="detalle-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div class="detalle-kpi-data">
              <div class="detalle-kpi-value">{{ formatNumber(bodega.capacidad_toneladas) }}</div>
              <div class="detalle-kpi-label">Capacidad (ton)</div>
            </div>
          </div>
          <div class="detalle-kpi ddr">
            <div class="detalle-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            </div>
            <div class="detalle-kpi-data">
              <div class="detalle-kpi-value">{{ bodega.ddr || '-' }}</div>
              <div class="detalle-kpi-label">DDR</div>
            </div>
          </div>
          <div class="detalle-kpi cader">
            <div class="detalle-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="detalle-kpi-data">
              <div class="detalle-kpi-value">{{ bodega.cader || '-' }}</div>
              <div class="detalle-kpi-label">CADER</div>
            </div>
          </div>
        </div>

        <!-- Información detallada -->
        <div class="detalle-info-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Informacion de ubicacion
          </h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Direccion</span>
              <span class="info-value">{{ bodega.direccion || 'Sin direccion registrada' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Localidad</span>
              <span class="info-value">{{ bodega.localidad || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ejido</span>
              <span class="info-value">{{ bodega.ejido || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Municipio</span>
              <span class="info-value">{{ bodega.municipio || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="info-value">{{ bodega.estado || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">DDR</span>
              <span class="info-value">{{ bodega.ddr || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CADER</span>
              <span class="info-value">{{ bodega.cader || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Codigo Postal</span>
              <span class="info-value">{{ bodega.codigo_postal || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Capacidad</span>
              <span class="info-value">{{ bodega.capacidad_toneladas ? formatNumber(bodega.capacidad_toneladas) + ' ton' : '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CVEGEO</span>
              <span class="info-value">{{ bodega.cvegeo || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Coordenadas</span>
              <span class="info-value">{{ bodega.latitud?.toFixed(4) }}, {{ bodega.longitud?.toFixed(4) }}</span>
            </div>
            <div class="info-row" v-if="bodega.fecha_actualizacion">
              <span class="info-label">Ultima actualizacion</span>
              <span class="info-value">{{ new Date(bodega.fecha_actualizacion).toLocaleDateString('es-MX') }}</span>
            </div>
          </div>
        </div>

        <!-- Mini mapa -->
        <div class="detalle-map-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            Ubicacion en mapa
          </h3>
          <div class="detalle-minimap" ref="minimapContainer"></div>
        </div>
      </div>

      <div v-else class="detalle-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.25;margin-bottom:1rem"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No se encontro la bodega solicitada.</p>
        <router-link to="/" class="btn btn-primary">Volver al mapa</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const bodega = ref<Bodega | null>(null)
const loading = ref(true)
const mobileNavOpen = ref(false)
const sidebarSearch = ref('')
const allBodegas = ref<Bodega[]>([])
const minimapContainer = ref<HTMLDivElement>()
const profileOpen = ref(false)
const profileRef = ref<HTMLDivElement>()
let minimap: mapboxgl.Map | null = null

const userInitials = computed(() => {
  const name = authStore.usuario?.nombre_completo || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

function onClickOutsideProfile(e: MouseEvent) {
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
    profileOpen.value = false
  }
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

function formatNumber(n: number): string {
  if (n == null) return '0'
  return n.toLocaleString('es-MX')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

const filteredBodegas = computed(() => {
  const q = sidebarSearch.value.toLowerCase().trim()
  if (!q) return allBodegas.value.slice(0, 50)
  return allBodegas.value.filter(b =>
    b.nombre.toLowerCase().includes(q) ||
    (b.municipio && b.municipio.toLowerCase().includes(q)) ||
    (b.estado && b.estado.toLowerCase().includes(q))
  ).slice(0, 50)
})

async function loadBodegas() {
  try {
    const res = await api.bodegas.listar()
    allBodegas.value = res.bodegas || []
  } catch (e) {
    console.error('Error cargando bodegas sidebar:', e)
  }
}

async function loadBodega() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await api.bodegas.obtener(id)
    bodega.value = res.bodega

    // Init minimap after data loads
    setTimeout(() => {
      if (bodega.value && minimapContainer.value) {
        minimap = new mapboxgl.Map({
          container: minimapContainer.value,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [bodega.value.longitud, bodega.value.latitud],
          zoom: 12,
          interactive: false,
          attributionControl: false,
        })

        const el = document.createElement('div')
        el.style.cssText = 'width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#691C32,#8B2A45);border:3px solid white;box-shadow:0 2px 8px rgba(105,28,50,0.35);'

        new mapboxgl.Marker({ element: el })
          .setLngLat([bodega.value.longitud, bodega.value.latitud])
          .addTo(minimap)
      }
    }, 100)
  } catch (err) {
    console.error('Error cargando bodega:', err)
    bodega.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBodega()
  loadBodegas()
  document.addEventListener('click', onClickOutsideProfile)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideProfile)
  if (minimap) { minimap.remove(); minimap = null }
})
</script>

<style scoped>
.detalle-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

.detalle-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 72px 1.25rem 2.5rem;
}

.detalle-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  color: var(--color-text-tertiary);
  font-size: 0.85rem;
}

/* Breadcrumb */
.detalle-breadcrumb {
  margin-bottom: 1.25rem;
}

.detalle-breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.detalle-breadcrumb a:hover {
  opacity: 0.7;
}

/* Header card */
.detalle-header-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
  border: 0.5px solid var(--color-border);
  animation: fadeInUp 0.5s var(--ease-out);
}

.detalle-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(145deg, #D35400, #E67E22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(211, 84, 0, 0.3);
}

.detalle-header-info {
  flex: 1;
  min-width: 0;
}

.detalle-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.2rem;
  letter-spacing: -0.01em;
}

.detalle-subtitle {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.2rem;
  font-weight: 500;
}

.detalle-location {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* KPI grid — semantic colors matching MapView logic */
.detalle-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detalle-kpi {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-xs);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 0.5px solid var(--color-border);
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}

.detalle-kpi:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.detalle-kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Capacidad = amber/gold (peso, valor) */
.detalle-kpi.capacidad .detalle-kpi-icon {
  background: rgba(160, 122, 58, 0.12);
  color: #A07A3A;
}
.detalle-kpi.capacidad .detalle-kpi-value { color: #A07A3A; }

/* DDR = indigo (divisiones regionales) */
.detalle-kpi.ddr .detalle-kpi-icon {
  background: rgba(88, 86, 214, 0.1);
  color: #5856D6;
}
.detalle-kpi.ddr .detalle-kpi-value { color: #5856D6; }

/* CADER = forest green (centros de apoyo) */
.detalle-kpi.cader .detalle-kpi-icon {
  background: rgba(45, 125, 70, 0.1);
  color: #2D7D46;
}
.detalle-kpi.cader .detalle-kpi-value { color: #2D7D46; }

.detalle-kpi-data {
  flex: 1;
  min-width: 0;
}

.detalle-kpi-value {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detalle-kpi-label {
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  margin-top: 0.1rem;
}

/* Info card */
.detalle-info-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
  border: 0.5px solid var(--color-border);
  animation: fadeInUp 0.55s var(--ease-out);
}

.detalle-info-card h3,
.detalle-map-card h3 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-separator);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.detalle-info-card h3 svg,
.detalle-map-card h3 svg {
  color: var(--color-text-tertiary);
}

.info-grid {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-separator);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.82rem;
  color: var(--color-text);
  font-weight: 500;
  text-align: right;
}

/* Minimap */
.detalle-map-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  border: 0.5px solid var(--color-border);
  animation: fadeInUp 0.6s var(--ease-out);
}

.detalle-minimap {
  width: 100%;
  height: 260px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Error */
.detalle-error {
  text-align: center;
  padding: 5rem 1rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detalle-error p {
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

/* ── Sidebar Panel (reuses global styles) ── */
.sidebar-overlay { display: none; }
.panel-mobile-header { display: none; }
.panel-nav-tabs { display: none; }

.detalle-sidebar {
  display: none;
}

.bodega-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 0.5px solid var(--color-separator);
  transition: background 0.15s;
}

.bodega-list-item:active { background: var(--color-fill-tertiary); }

.bodega-list-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #D35400, #E67E22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.bodega-list-info {
  flex: 1;
  min-width: 0;
}

.bodega-list-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bodega-list-sub {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.bodega-list-cap {
  font-size: 0.6875rem;
  color: #2D7D46;
  font-weight: 600;
}

.bodega-list-chevron {
  flex-shrink: 0;
  color: var(--color-text-quaternary);
}

.bodega-list-empty {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .sidebar-toggle { display: flex; }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s var(--ease-out);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
  }
  .sidebar-overlay.active {
    opacity: 1;
    pointer-events: auto;
  }

  .detalle-sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 340px;
    max-width: 88vw;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.4s var(--ease-out);
    background: rgba(255, 255, 255, 0.96);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    backdrop-filter: blur(40px) saturate(200%);
    border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
    box-shadow: none;
  }

  .detalle-sidebar.open {
    transform: translateX(0);
    box-shadow: 8px 0 40px rgba(0, 0, 0, 0.18);
  }

  .panel-mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    font-weight: 700;
    font-size: 1.0625rem;
    color: var(--color-text);
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .panel-nav-tabs {
    display: flex;
    gap: 0;
    padding: 0;
    border-bottom: 0.5px solid var(--color-separator);
    flex-shrink: 0;
  }

  .panel-nav-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    flex: 1;
    padding: 0.6rem 0.4rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-decoration: none;
    border-radius: 0;
    background: none;
    white-space: nowrap;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .panel-nav-tab svg {
    flex-shrink: 0;
    color: var(--color-text-tertiary);
  }

  .panel-nav-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .panel-nav-tab.active svg { color: var(--color-primary); }

  .panel-nav-tab.disabled {
    opacity: 0.3;
    cursor: default;
    pointer-events: none;
  }

  .panel-list-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .detalle-main {
    padding: 64px 1rem 2rem;
  }

  .detalle-kpi-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .detalle-kpi {
    padding: 0.75rem 0.875rem;
  }

  .detalle-kpi-icon {
    width: 32px;
    height: 32px;
    border-radius: 7px;
  }

  .detalle-kpi-value {
    font-size: 1.1rem;
  }

  .detalle-header-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem;
  }

  .detalle-location {
    justify-content: center;
  }

  .info-row {
    flex-direction: column;
    gap: 0.15rem;
  }

  .info-value {
    text-align: left;
    color: var(--color-text-secondary);
  }

  .detalle-minimap {
    height: 200px;
  }
}
</style>
