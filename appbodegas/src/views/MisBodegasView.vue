<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Mis bodegas e inventarios</h1>
          <p class="view-subtitle">Gestión de bodegas, inventarios y solicitudes</p>
        </div>
        <div class="view-header-actions">
          <router-link to="/nueva-bodega" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva bodega
          </router-link>
        </div>
      </div>
    </div>

    <div class="segmented-control mis-tabs-wrap">
      <button :class="{ active: activeTab === 'catalogo' }" @click="activeTab = 'catalogo'">
        Buscar en catálogo
      </button>
      <button :class="{ active: activeTab === 'inventarios' }" @click="activeTab = 'inventarios'">
        Inventarios
        <span v-if="inventarios.length" class="tab-count">{{ inventarios.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'solicitudes' }" @click="activeTab = 'solicitudes'">
        Solicitudes
        <span v-if="solicitudes.length" class="tab-count">{{ solicitudes.length }}</span>
      </button>
      <button :class="{ active: activeTab === 'bodegas' }" @click="activeTab = 'bodegas'">
        Mis bodegas
        <span v-if="bodegas.length" class="tab-count">{{ bodegas.length }}</span>
      </button>
    </div>

    <div class="mis-main">

      <div v-if="loading" class="mis-bodegas-loading">
        <span class="spinner spinner-dark"></span> Cargando...
      </div>

      <div v-else-if="error" class="alert alert-error">{{ error }}</div>

      <!-- Tab: Buscar en catálogo -->
      <div v-else-if="activeTab === 'catalogo'" class="catalogo-tab">
        <div class="catalogo-search-card">
          <p class="catalogo-desc">Busca una bodega del catalogo nacional para registrar inventario.</p>
          <div class="catalogo-search-row">
            <div class="catalogo-search-input-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="catSearch" type="text" class="catalogo-search-input" placeholder="Nombre, clave, municipio..." @input="onCatSearch" />
            </div>
          </div>
          <div v-if="catSearching" class="catalogo-searching">
            <span class="spinner spinner-dark spinner-sm"></span> Buscando...
          </div>
          <div v-else-if="catResults.length > 0" class="catalogo-results">
            <div v-for="b in catResults" :key="b.id" class="catalogo-result-item" :class="{ selected: selectedCatBodega?.id === b.id }" @click="selectCatBodega(b)">
              <div class="catalogo-result-info">
                <div class="catalogo-result-nombre">{{ b.nombre }}</div>
                <div class="catalogo-result-meta">
                  <span v-if="b.clave" class="catalogo-result-clave">{{ b.clave }}</span>
                  <span>{{ b.municipio }}{{ b.municipio && b.estado ? ', ' : '' }}{{ b.estado }}</span>
                </div>
              </div>
              <div class="catalogo-result-cap">{{ b.capacidad_toneladas?.toLocaleString() || '—' }} ton</div>
            </div>
          </div>
          <div v-else-if="catSearch.length >= 2 && !catSearching" class="catalogo-no-results">
            <p>No se encontraron bodegas</p>
          </div>
          <div class="catalogo-no-bodega-link">
            <router-link to="/nueva-bodega" class="btn-link-nueva">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              No encuentro mi bodega — Registrar nueva
            </router-link>
          </div>
        </div>

        <!-- Formulario de inventario inline cuando se selecciona bodega -->
        <Transition name="slide-down">
          <div v-if="selectedCatBodega" class="catalogo-inv-card">
            <div class="catalogo-inv-header">
              <div>
                <h3>Registrar inventario</h3>
                <p class="catalogo-inv-bodega">{{ selectedCatBodega.nombre }} <span v-if="selectedCatBodega.clave">({{ selectedCatBodega.clave }})</span></p>
              </div>
              <button class="catalogo-inv-close" @click="selectedCatBodega = null" aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div v-if="invSuccess" class="alert alert-success">{{ invSuccess }}</div>
            <div v-if="invError" class="alert alert-error">{{ invError }}</div>
            <form @submit.prevent="handleInventario" novalidate class="catalogo-inv-form">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="cat-ciclo">Ciclo *</label>
                  <select id="cat-ciclo" v-model="invForm.ciclo" class="form-input">
                    <option value="">Selecciona ciclo</option>
                    <option value="Primavera-Verano">Primavera-Verano</option>
                    <option value="Otono-Invierno">Otono-Invierno</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="cat-tipo">Tipo de maiz *</label>
                  <select id="cat-tipo" v-model="invForm.tipo_maiz" class="form-input">
                    <option value="">Selecciona tipo</option>
                    <option value="Maiz blanco">Maiz blanco</option>
                    <option value="Maiz amarillo">Maiz amarillo</option>
                  </select>
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="cat-origen">Origen *</label>
                  <select id="cat-origen" v-model="invForm.origen" class="form-input">
                    <option value="">Selecciona origen</option>
                    <option value="Local">Local</option>
                    <option value="Importado">Importado</option>
                  </select>
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="cat-vol">Volumen almacenamiento (ton) *</label>
                  <input id="cat-vol" v-model.number="invForm.volumen_almacenamiento" type="number" min="1" step="any" class="form-input" placeholder="Toneladas" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="cat-prob">Volumen con problemas (ton)</label>
                  <input id="cat-prob" v-model.number="invForm.volumen_problemas" type="number" min="0" step="any" class="form-input" placeholder="Opcional" />
                </div>
              </div>
              <button type="submit" class="btn btn-primary" :disabled="invLoading">
                <span v-if="invLoading" class="spinner"></span>
                <span v-else>Guardar inventario</span>
              </button>
            </form>
          </div>
        </Transition>
      </div>

      <!-- Tab: Mis inventarios -->
      <div v-else-if="activeTab === 'inventarios'">
        <div v-if="inventarios.length === 0" class="mis-bodegas-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          <p>No tienes inventarios registrados</p>
          <p class="empty-hint">Usa la pestana "Buscar en catalogo" para registrar inventario en una bodega.</p>
        </div>
        <!-- Desktop table -->
        <div v-else class="mis-inv-table-wrap inv-desktop">
          <table class="mis-inv-table">
            <thead>
              <tr>
                <th>Bodega</th>
                <th>Ciclo</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Almacen</th>
                <th>Problemas</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in inventarios" :key="inv.id">
                <td>
                  <router-link :to="`/bodega/${inv.bodega_id}`" class="inv-bodega-link">{{ inv.bodega_nombre }}</router-link>
                  <div class="inv-bodega-ubi">{{ inv.municipio }}, {{ inv.estado }}</div>
                </td>
                <td>{{ inv.ciclo === 'Primavera-Verano' ? 'PV' : 'OI' }}</td>
                <td>{{ inv.tipo_maiz || '-' }}</td>
                <td>{{ inv.origen || '-' }}</td>
                <td>{{ inv.volumen_almacenamiento?.toLocaleString() }} t</td>
                <td>{{ inv.volumen_problemas ? inv.volumen_problemas.toLocaleString() + ' t' : '-' }}</td>
                <td>{{ new Date(inv.fecha_registro).toLocaleDateString('es-MX') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Mobile cards -->
        <div v-if="inventarios.length > 0" class="inv-mobile">
          <router-link v-for="inv in inventarios" :key="'m'+inv.id" :to="`/bodega/${inv.bodega_id}`" class="inv-card">
            <div class="inv-card-header">
              <span class="inv-card-bodega">{{ inv.bodega_nombre }}</span>
              <span class="inv-card-date">{{ new Date(inv.fecha_registro).toLocaleDateString('es-MX') }}</span>
            </div>
            <div class="inv-card-ubi">{{ inv.municipio }}, {{ inv.estado }}</div>
            <div class="inv-card-tags">
              <span class="inv-tag">{{ inv.ciclo === 'Primavera-Verano' ? 'PV' : 'OI' }}</span>
              <span v-if="inv.tipo_maiz" class="inv-tag">{{ inv.tipo_maiz }}</span>
              <span v-if="inv.origen" class="inv-tag">{{ inv.origen }}</span>
            </div>
            <div class="inv-card-stats">
              <div><strong>{{ inv.volumen_almacenamiento?.toLocaleString() }}</strong> <small>ton almacen</small></div>
              <div v-if="inv.volumen_problemas"><strong>{{ inv.volumen_problemas.toLocaleString() }}</strong> <small>ton problema</small></div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Tab: Mis solicitudes (bodegas pendientes) -->
      <div v-else-if="activeTab === 'solicitudes'">
        <div v-if="solicitudes.length === 0" class="mis-bodegas-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No tienes solicitudes pendientes</p>
        </div>
        <div v-else class="mis-bodegas-grid">
          <router-link v-for="b in solicitudes" :key="b.id" :to="`/bodega/${b.id}`" class="mis-bodega-card">
            <div class="mis-bodega-top">
              <span class="mis-bodega-clave">{{ b.clave || 'Sin clave' }}</span>
              <span class="bodega-badge" :class="b.estatus">{{ b.estatus }}</span>
            </div>
            <h3 class="mis-bodega-nombre">{{ b.nombre }}</h3>
            <p class="mis-bodega-ubicacion">{{ b.municipio }}, {{ b.estado }}</p>
            <div class="mis-bodega-pendiente-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              En espera de aprobacion
            </div>
          </router-link>
        </div>
      </div>

      <!-- Tab: Mis bodegas (todas) -->
      <div v-else-if="activeTab === 'bodegas'">
        <div v-if="bodegas.length === 0" class="mis-bodegas-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V13h6v8"/></svg>
          <p>No tienes bodegas registradas</p>
          <router-link to="/nueva-bodega" class="btn btn-primary">Registrar nueva bodega</router-link>
        </div>
        <div v-else class="mis-bodegas-grid">
          <router-link v-for="b in bodegas" :key="b.id" :to="`/bodega/${b.id}`" class="mis-bodega-card">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import type { MiBodega, MiInventario, Bodega } from '@/types'

const bodegas = ref<MiBodega[]>([])
const inventarios = ref<MiInventario[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref<'catalogo' | 'inventarios' | 'solicitudes' | 'bodegas'>('catalogo')

const solicitudes = computed(() => bodegas.value.filter(b => b.estatus === 'pendiente'))

// Catalog search
const catSearch = ref('')
const catResults = ref<Bodega[]>([])
const catSearching = ref(false)
const selectedCatBodega = ref<Bodega | null>(null)
let catTimer: ReturnType<typeof setTimeout> | null = null

// Inline inventory form
const invForm = reactive({ ciclo: '', tipo_maiz: '', origen: '', volumen_almacenamiento: null as number | null, volumen_problemas: null as number | null })
const invLoading = ref(false)
const invError = ref('')
const invSuccess = ref('')

function onCatSearch() {
  if (catTimer) clearTimeout(catTimer)
  if (catSearch.value.length < 2) {
    catResults.value = []
    return
  }
  catTimer = setTimeout(async () => {
    catSearching.value = true
    try {
      const res = await api.bodegas.listar({ q: catSearch.value.trim() })
      catResults.value = res.bodegas.slice(0, 20)
    } catch {
      catResults.value = []
    } finally {
      catSearching.value = false
    }
  }, 400)
}

function selectCatBodega(b: Bodega) {
  selectedCatBodega.value = b
  invForm.ciclo = ''
  invForm.tipo_maiz = ''
  invForm.origen = ''
  invForm.volumen_almacenamiento = null
  invForm.volumen_problemas = null
  invError.value = ''
  invSuccess.value = ''
}

async function handleInventario() {
  invError.value = ''
  invSuccess.value = ''
  if (!invForm.ciclo) { invError.value = 'Selecciona un ciclo'; return }
  if (!invForm.tipo_maiz) { invError.value = 'Selecciona un tipo de maiz'; return }
  if (!invForm.origen) { invError.value = 'Selecciona el origen'; return }
  if (!invForm.volumen_almacenamiento || invForm.volumen_almacenamiento <= 0) { invError.value = 'Ingresa un volumen valido'; return }
  if (!selectedCatBodega.value) return

  invLoading.value = true
  try {
    await api.inventarios.registrar(selectedCatBodega.value.id, {
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
    // Refresh inventarios
    const invRes = await api.misInventarios.listar()
    inventarios.value = invRes.inventarios
  } catch (err: any) {
    invError.value = err.message || 'Error al registrar inventario'
  } finally {
    invLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const [bodegasRes, invRes] = await Promise.all([
      api.misBodegas.listar(),
      api.misInventarios.listar(),
    ])
    bodegas.value = bodegasRes.bodegas
    inventarios.value = invRes.inventarios
  } catch (err: any) {
    error.value = err.message || 'Error al cargar datos'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.mis-tabs-wrap {
  margin-bottom: 1.5rem;
}

.tab-count {
  background: var(--color-primary);
  color: white;
  font-size: .6rem;
  font-weight: 700;
  padding: .1rem .4rem;
  border-radius: 10px;
  min-width: 1.1rem;
  text-align: center;
  line-height: 1.3;
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

.empty-hint {
  font-size: 0.82rem !important;
  opacity: 0.7;
}

.mis-bodegas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.mis-bodega-card {
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: all .25s var(--ease-out);
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
  background: var(--color-error-bg);
  color: var(--color-error);
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
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
}

/* Tabs are now handled by .segmented-control from main.css */

/* ── Catálogo search ── */
.catalogo-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.catalogo-search-card {
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
}

.catalogo-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem;
}

.catalogo-search-row {
  margin-bottom: 0.75rem;
}

.catalogo-search-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 0.75rem;
  transition: border-color 0.2s;
}

.catalogo-search-input-wrap:focus-within {
  border-color: var(--color-primary);
}

.catalogo-search-input-wrap svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.catalogo-search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.6rem 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text);
  outline: none;
}

.catalogo-searching {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.catalogo-results {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 300px;
  overflow-y: auto;
}

.catalogo-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-separator);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.catalogo-result-item:hover {
  background: var(--color-bg);
  border-color: var(--color-primary-light, #e0d4c8);
}

.catalogo-result-item.selected {
  background: #FFF3E8;
  border-color: var(--color-primary);
}

.catalogo-result-nombre {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
}

.catalogo-result-meta {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: flex;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.catalogo-result-clave {
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.catalogo-result-cap {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.catalogo-no-results {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--color-text-tertiary);
  font-size: 0.85rem;
}

.catalogo-no-bodega-link {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-separator);
}

.btn-link-nueva {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-link-nueva:hover {
  opacity: 0.8;
}

/* Inline inventory card */
.catalogo-inv-card {
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-primary);
}

.catalogo-inv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.catalogo-inv-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.15rem;
}

.catalogo-inv-bodega {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.catalogo-inv-bodega span {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}

.catalogo-inv-close {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.catalogo-inv-close:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.catalogo-inv-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* Inventory table */
.mis-inv-table-wrap {
  overflow-x: auto;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--color-border);
}

.mis-inv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.mis-inv-table th {
  text-align: left;
  padding: 0.7rem 0.85rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-separator);
  background: var(--color-bg);
}

.mis-inv-table td {
  padding: 0.65rem 0.85rem;
  border-bottom: 0.5px solid var(--color-separator);
  color: var(--color-text);
}

.mis-inv-table tbody tr:last-child td {
  border-bottom: none;
}

.inv-bodega-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.inv-bodega-link:hover {
  text-decoration: underline;
}

.inv-bodega-ubi {
  font-size: 0.72rem;
  color: var(--color-text-tertiary);
  margin-top: 0.1rem;
}

/* Slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── Mobile inventory cards ── */
.inv-mobile { display: none; flex-direction: column; gap: .625rem; }
.inv-card {
  display: flex; flex-direction: column; gap: .35rem;
  background: rgba(255,255,255,.92); border-radius: var(--radius-lg);
  padding: 1rem 1.125rem; text-decoration: none; color: inherit;
  border: .5px solid var(--color-border); box-shadow: var(--shadow-sm);
  transition: box-shadow .2s;
}
.inv-card:active { box-shadow: var(--shadow-md); }
.inv-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; }
.inv-card-bodega { font-size: .9rem; font-weight: 650; color: var(--color-primary); }
.inv-card-date { font-size: .72rem; color: var(--color-text-tertiary); white-space: nowrap; margin-top: 2px; }
.inv-card-ubi { font-size: .75rem; color: var(--color-text-secondary); }
.inv-card-tags { display: flex; gap: .35rem; flex-wrap: wrap; margin-top: .25rem; }
.inv-tag {
  font-size: .65rem; font-weight: 600; padding: .15rem .45rem;
  background: var(--color-fill); border-radius: 6px; color: var(--color-text-secondary);
}
.inv-card-stats {
  display: flex; gap: 1.25rem; margin-top: .5rem; padding-top: .5rem;
  border-top: .5px solid var(--color-separator);
}
.inv-card-stats strong { font-size: .95rem; font-weight: 700; color: var(--color-text); }
.inv-card-stats small { font-size: .68rem; color: var(--color-text-tertiary); margin-left: .2rem; }

@media (max-width: 1024px) {
  .form-row-2 { grid-template-columns: 1fr; }
  .mis-bodegas-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .mis-bodega-stats { gap: .5rem; }
  .stat-value { font-size: .88rem; }
  .stat-label { font-size: .62rem; }
  .catalogo-search-card { padding: 1rem; }
  .catalogo-inv-card { padding: 1rem; }
  .inv-desktop { display: none; }
  .inv-mobile { display: flex; }
}

@media (max-width: 640px) {
  .mis-bodegas-grid { grid-template-columns: 1fr; }
  .catalogo-result-item { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
  .mis-bodega-card { padding: 1rem; }
  .mis-bodega-nombre { font-size: .95rem; }
}
</style>
