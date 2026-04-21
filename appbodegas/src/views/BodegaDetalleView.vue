<template>
  <div class="page-container detalle-page">
    <div class="page-header">
      <button class="page-back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver al mapa
      </button>
    </div>

    <div class="detalle-main">
      <div v-if="loading" class="detalle-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando informacion...</span>
      </div>

      <div v-else-if="bodega" class="detalle-content">
        <!-- Encabezado -->
        <div class="detalle-header-card">
          <div class="detalle-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          </div>
          <div class="detalle-header-info">
            <h1 class="detalle-title">{{ bodega.nombre }}</h1>
            <p class="detalle-subtitle" v-if="bodega.clave">Clave centro de acopio: {{ bodega.clave }}</p>
            <p class="detalle-location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ bodega.municipio }}{{ bodega.municipio && bodega.estado ? ', ' : '' }}{{ bodega.estado }}
              <span v-if="bodega.ddr"> · DDR {{ bodega.ddr }}</span>
            </p>
            <div class="detalle-estatus-row">
              <span class="bodega-badge" :class="bodega.estatus || 'aprobada'">{{ bodega.estatus === 'pendiente' ? 'Pendiente' : 'Aprobada' }}</span>
              <span class="detalle-coords"><span>Lat: {{ bodega.latitud?.toFixed(6) }}</span> <span>Long: {{ bodega.longitud?.toFixed(6) }}</span></span>
            </div>
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
              <span class="info-label">Coordenadas</span>
              <span class="info-value">{{ bodega.latitud?.toFixed(4) }}, {{ bodega.longitud?.toFixed(4) }}</span>
            </div>
            <div class="info-row" v-if="bodega.fecha_actualizacion">
              <span class="info-label">Ultima actualizacion</span>
              <span class="info-value">{{ new Date(bodega.fecha_actualizacion).toLocaleDateString('es-MX') }}</span>
            </div>
          </div>
        </div>

        <!-- Aviso solo lectura para usuarios sin permisos -->
        <div v-if="!authStore.canCapture" class="detalle-readonly-notice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Vista informativa</strong>
            <p>Para registrar inventario necesitas el rol de responsable de bodega. Contacta al administrador.</p>
          </div>
        </div>

        <!-- Registrar inventario + Registros recientes -->
        <div v-if="authStore.canCapture" class="detalle-inventario-grid">
          <div class="detalle-inventario-form-card">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              Registrar inventario
            </h3>
            <div v-if="invSuccess" class="alert alert-success">{{ invSuccess }}</div>
            <div v-if="invError" class="alert alert-error">{{ invError }}</div>
            <form @submit.prevent="handleInventario" novalidate>
              <div class="form-group">
                <label class="form-label" for="ciclo">Ciclo *</label>
                <select id="ciclo" v-model="invForm.ciclo" class="form-input">
                  <option value="">Selecciona ciclo</option>
                  <option value="Primavera-Verano">Primavera-Verano</option>
                  <option value="Otono-Invierno">Otono-Invierno</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="tipo_maiz">Tipo de maíz *</label>
                <select id="tipo_maiz" v-model="invForm.tipo_maiz" class="form-input">
                  <option value="">Selecciona tipo</option>
                  <option value="Maiz blanco">Maíz blanco</option>
                  <option value="Maiz amarillo">Maíz amarillo</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="origen">Origen *</label>
                <select id="origen" v-model="invForm.origen" class="form-input">
                  <option value="">Selecciona origen</option>
                  <option value="Local">Local</option>
                  <option value="Importado">Importado</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="volumen">Volumen en toneladas de almacenamiento *</label>
                <input id="volumen" v-model.number="invForm.volumen_almacenamiento" type="number" min="1" step="any" class="form-input" placeholder="Toneladas" />
              </div>
              <div class="form-group">
                <label class="form-label" for="problemas">Volumen en toneladas con problemas para su venta</label>
                <input id="problemas" v-model.number="invForm.volumen_problemas" type="number" min="0" step="any" class="form-input" placeholder="Opcional" />
              </div>
              <button type="submit" class="btn btn-primary btn-block" :disabled="invLoading">
                <span v-if="invLoading" class="spinner"></span>
                <span v-else>Guardar</span>
              </button>
            </form>
          </div>

          <div class="detalle-inventario-records-card">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
              Registros recientes
            </h3>
            <div v-if="inventarios.length > 0" class="inv-table-wrap">
              <table class="inv-table">
                <thead>
                  <tr><th>Ciclo</th><th>Tipo</th><th>Origen</th><th>Almacen</th><th>Problemas</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  <tr v-for="inv in inventarios" :key="inv.id">
                    <td>{{ inv.ciclo === 'Primavera-Verano' ? 'PV' : 'OI' }} {{ new Date(inv.fecha_registro).getFullYear() }}</td>
                    <td>{{ inv.tipo_maiz || '-' }}</td>
                    <td>{{ inv.origen || '-' }}</td>
                    <td>{{ formatNumber(inv.volumen_almacenamiento) }} t</td>
                    <td>{{ inv.volumen_problemas ? formatNumber(inv.volumen_problemas) + ' t' : '-' }}</td>
                    <td>{{ new Date(inv.fecha_registro).toLocaleDateString('es-MX') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="inv-empty">Sin registros de inventario</div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Bodega, Inventario } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const bodega = ref<Bodega | null>(null)
const loading = ref(true)
const minimapContainer = ref<HTMLDivElement>()
let minimap: mapboxgl.Map | null = null

// Inventario
const inventarios = ref<Inventario[]>([])
const invForm = reactive({ ciclo: '', tipo_maiz: '', origen: '', volumen_almacenamiento: null as number | null, volumen_problemas: null as number | null })
const invLoading = ref(false)
const invError = ref('')
const invSuccess = ref('')

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

function formatNumber(n: number): string {
  if (n == null) return '0'
  return n.toLocaleString('es-MX')
}

async function fetchInventarios() {
  if (!bodega.value) return
  try {
    const res = await api.inventarios.listar(bodega.value.id)
    inventarios.value = res.inventarios
  } catch (err) {
    console.error('Error cargando inventarios:', err)
  }
}

async function handleInventario() {
  invError.value = ''
  invSuccess.value = ''
  if (!invForm.ciclo) { invError.value = 'Selecciona un ciclo'; return }
  if (!invForm.tipo_maiz) { invError.value = 'Selecciona un tipo de maíz'; return }
  if (!invForm.origen) { invError.value = 'Selecciona el origen'; return }
  if (!invForm.volumen_almacenamiento || invForm.volumen_almacenamiento <= 0) { invError.value = 'Ingresa un volumen valido'; return }
  if (!bodega.value) return

  invLoading.value = true
  try {
    await api.inventarios.registrar(bodega.value.id, {
      ciclo: invForm.ciclo,
      tipo_maiz: invForm.tipo_maiz,
      origen: invForm.origen,
      volumen_almacenamiento: invForm.volumen_almacenamiento,
      volumen_problemas: invForm.volumen_problemas || 0,
    })
    invSuccess.value = 'Inventario registrado exitosamente'
    invForm.ciclo = ''
    invForm.tipo_maiz = ''
    invForm.origen = ''
    invForm.volumen_almacenamiento = null
    invForm.volumen_problemas = null
    await fetchInventarios()
  } catch (err: any) {
    invError.value = err.message || 'Error al registrar inventario'
  } finally {
    invLoading.value = false
  }
}

async function loadBodega() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await api.bodegas.obtener(id)
    bodega.value = res.bodega
    await fetchInventarios()

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
})

onUnmounted(() => {
  if (minimap) { minimap.remove(); minimap = null }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 1rem;
}

.page-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  font-family: var(--font-family);
}

.page-back-btn:hover {
  background: var(--color-fill);
}

.detalle-main {
  max-width: 760px;
  margin: 0 auto;
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

/* ── Responsive ── */
@media (max-width: 768px) {
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

/* Readonly notice */
.detalle-readonly-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #EDF6FF;
  border: 1px solid #B3D7FF;
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
  color: #1B5E95;
}

.detalle-readonly-notice svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.detalle-readonly-notice strong {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.2rem;
}

.detalle-readonly-notice p {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.85;
}
</style>
