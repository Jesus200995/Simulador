<template>
  <div class="page-container">
    <div class="page-nav">
      <button class="page-back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
    </div>

    <div v-if="loading" class="state-loading">
      <div class="spinner spinner-dark"></div>
      <span>Cargando...</span>
    </div>
    <template v-else-if="bodega">
      <!-- Ficha básica -->
      <div class="glass-card ficha">
        <div class="ficha-top">
          <span :class="['badge', bodega.es_ventanilla ? 'badge-ventanilla' : 'badge-bodega']">
            {{ bodega.es_ventanilla ? 'Ventanilla' : 'Bodega' }}
          </span>
          <span :class="['badge', bodega.estatus_operativo === 'activa' ? 'badge-success' : 'badge-error']">{{ bodega.estatus_operativo }}</span>
        </div>
        <h1>{{ bodega.nombre }}</h1>
        <p class="ubicacion">{{ bodega.localidad }}, {{ bodega.municipio }}, {{ bodega.estado }}</p>
        <div class="ficha-meta">
          <span v-if="bodega.clave">Clave: <strong>{{ bodega.clave }}</strong></span>
          <span v-if="bodega.capacidad_ton">Capacidad: <strong>{{ bodega.capacidad_ton?.toLocaleString() }} ton</strong></span>
          <span>Lat: {{ bodega.latitud?.toFixed(4) }}, Lon: {{ bodega.longitud?.toFixed(4) }}</span>
        </div>
        <div v-if="bodega.es_ventanilla" class="funciones">
          <span class="func-tag">Acopio</span>
          <span class="func-tag">Incentivos</span>
          <span class="func-tag">Coberturas</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="segmented-control">
        <button :class="{ active: tab === 'inventario' }" @click="tab = 'inventario'">Inventario</button>
        <button :class="{ active: tab === 'precios' }" @click="tab = 'precios'; cargarPrecios()">Precios</button>
        <button v-if="bodega.es_ventanilla" :class="{ active: tab === 'contactos' }" @click="tab = 'contactos'">Contactos</button>
      </div>

      <!-- Tab: Inventario -->
      <div v-if="tab === 'inventario'" class="tab-content">
        <div class="tab-header">
          <h2>Inventario</h2>
          <button class="btn-sm" @click="showInventarioForm = true">+ Registrar</button>
        </div>
        <div v-if="inventarios.length === 0" class="empty">Sin registros de inventario.</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Ciclo</th><th>Tipo maíz</th>
              <th>Almacenado (ton)</th><th>Problema (ton)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in inventarios" :key="inv.id">
              <td>{{ formatFecha(inv.fecha) }}</td>
              <td>{{ inv.ciclo }}</td>
              <td>{{ inv.tipo_maiz }}</td>
              <td>{{ inv.volumen_almacenamiento?.toLocaleString() }}</td>
              <td>{{ inv.volumen_problema?.toLocaleString() || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab: Precios -->
      <div v-if="tab === 'precios'" class="tab-content">
        <div class="tab-header">
          <h2>Precios</h2>
          <button class="btn-sm" @click="showPrecioForm = true">+ Registrar precio</button>
        </div>
        <div v-if="ultimoPrecio" class="ultimo-precio">
          <span>Último precio:</span>
          <strong>${{ ultimoPrecio.precio?.toLocaleString() }}/ton</strong>
          <span class="tipo-maiz-tag">{{ ultimoPrecio.tipo_maiz }}</span>
          <span class="fecha-precio">{{ formatFecha(ultimoPrecio.fecha) }}</span>
        </div>
        <div v-if="precios.length === 0" class="empty">Sin precios registrados.</div>
        <table v-else class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Tipo maíz</th><th>Precio ($/ton)</th><th>Fuente</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in precios" :key="p.id">
              <td>{{ formatFecha(p.fecha) }}</td>
              <td>{{ p.tipo_maiz }}</td>
              <td>${{ p.precio?.toLocaleString() }}</td>
              <td>{{ p.fuente }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab: Contactos -->
      <div v-if="tab === 'contactos'" class="tab-content">
        <div class="tab-header">
          <h2>Contactos</h2>
          <button class="btn-sm" @click="showContactoForm = true">+ Agregar</button>
        </div>
        <div v-if="contactos.length === 0" class="empty">Sin contactos registrados.</div>
        <div v-else class="contactos-lista">
          <div v-for="c in contactos" :key="c.id" class="contacto-card">
            <div class="c-nombre">{{ c.nombre }} <span v-if="c.es_principal" class="principal-tag">Principal</span></div>
            <div v-if="c.cargo" class="c-meta">{{ c.cargo }}</div>
            <div v-if="c.telefono" class="c-meta">{{ c.telefono }}</div>
            <div v-if="c.correo" class="c-meta">{{ c.correo }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal inventario -->
    <div v-if="showInventarioForm" class="modal-overlay" @click.self="showInventarioForm = false">
      <div class="modal-card">
        <h2>Registrar inventario</h2>
        <form @submit.prevent="guardarInventario">
          <div class="field"><label>Ciclo <span class="req">*</span></label>
            <input v-model="invForm.ciclo" required placeholder="Ej. PV-2025" /></div>
          <div class="field"><label>Tipo de maíz <span class="req">*</span></label>
            <select v-model="invForm.tipo_maiz" required>
              <option value="">--</option>
              <option value="blanco">Blanco</option><option value="amarillo">Amarillo</option>
              <option value="forrajero">Forrajero</option><option value="criollo">Criollo</option>
            </select></div>
          <div class="field"><label>Volumen almacenado (ton) <span class="req">*</span></label>
            <input v-model.number="invForm.volumen_almacenado" type="number" min="0" step="0.01" required /></div>
          <div class="field"><label>Volumen con problema (ton)</label>
            <input v-model.number="invForm.volumen_problema" type="number" min="0" step="0.01" /></div>
          <div class="field"><label>Fecha <span class="req">*</span></label>
            <input v-model="invForm.fecha" type="date" :max="hoy" required /></div>
          <div class="field"><label>Observaciones</label>
            <textarea v-model="invForm.observaciones" rows="2" /></div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showInventarioForm = false">Cancelar</button>
            <button type="submit" :disabled="formLoading" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal precio -->
    <div v-if="showPrecioForm" class="modal-overlay" @click.self="showPrecioForm = false">
      <div class="modal-card">
        <h2>Registrar precio</h2>
        <form @submit.prevent="guardarPrecio">
          <div class="field"><label>Precio ($/ton) <span class="req">*</span></label>
            <input v-model.number="precioForm.precio" type="number" min="0.01" step="0.01" required /></div>
          <div class="field"><label>Tipo de maíz <span class="req">*</span></label>
            <select v-model="precioForm.tipo_maiz" required>
              <option value="">--</option>
              <option value="blanco">Blanco</option><option value="amarillo">Amarillo</option>
              <option value="forrajero">Forrajero</option><option value="criollo">Criollo</option>
            </select></div>
          <div class="field"><label>Fecha <span class="req">*</span></label>
            <input v-model="precioForm.fecha" type="date" :max="hoy" required /></div>
          <div class="field"><label>Observaciones</label>
            <textarea v-model="precioForm.observaciones" rows="2" /></div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showPrecioForm = false">Cancelar</button>
            <button type="submit" :disabled="formLoading" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal contacto -->
    <div v-if="showContactoForm" class="modal-overlay" @click.self="showContactoForm = false">
      <div class="modal-card">
        <h2>Agregar contacto</h2>
        <form @submit.prevent="guardarContacto">
          <div class="field"><label>Nombre <span class="req">*</span></label>
            <input v-model="contactoForm.nombre" required /></div>
          <div class="field"><label>Cargo</label><input v-model="contactoForm.cargo" /></div>
          <div class="field"><label>Teléfono</label><input v-model="contactoForm.telefono" /></div>
          <div class="field"><label>Correo</label><input v-model="contactoForm.correo" type="email" /></div>
          <div class="field">
            <label><input type="checkbox" v-model="contactoForm.es_principal" /> Contacto principal</label>
          </div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showContactoForm = false">Cancelar</button>
            <button type="submit" :disabled="formLoading" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const id = Number(route.params.id)
const hoy = new Date().toISOString().split('T')[0]

const bodega = ref<any>(null)
const contactos = ref<any[]>([])
const inventarios = ref<any[]>([])
const precios = ref<any[]>([])
const ultimoPrecio = ref<any>(null)
const loading = ref(true)
const tab = ref('inventario')

const showInventarioForm = ref(false)
const showPrecioForm = ref(false)
const showContactoForm = ref(false)
const formLoading = ref(false)
const formError = ref('')

const invForm = ref({ ciclo: '', tipo_maiz: '', volumen_almacenado: null as number | null, volumen_problema: null as number | null, fecha: hoy, observaciones: '' })
const precioForm = ref({ precio: null as number | null, tipo_maiz: '', fecha: hoy, observaciones: '' })
const contactoForm = ref({ nombre: '', cargo: '', telefono: '', correo: '', es_principal: false })

async function cargar() {
  loading.value = true
  try {
    const data = await api.infraestructura.obtener(id)
    bodega.value = data.bodega
    contactos.value = data.contactos
    inventarios.value = data.inventarios
    ultimoPrecio.value = data.ultimo_precio
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cargarPrecios() {
  try {
    const data = await api.infraestructura.precios(id)
    precios.value = data.precios
    ultimoPrecio.value = data.ultimo_precio
  } catch (e) {
    console.error(e)
  }
}

async function guardarInventario() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.infraestructura.registrarInventario(id, invForm.value)
    showInventarioForm.value = false
    await cargar()
  } catch (e: any) {
    formError.value = e.message || 'Error al guardar'
  } finally {
    formLoading.value = false
  }
}

async function guardarPrecio() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.infraestructura.registrarPrecio(id, precioForm.value)
    showPrecioForm.value = false
    await cargarPrecios()
  } catch (e: any) {
    formError.value = e.message || 'Error al guardar'
  } finally {
    formLoading.value = false
  }
}

async function guardarContacto() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.infraestructura.agregarContacto(id, contactoForm.value)
    showContactoForm.value = false
    await cargar()
  } catch (e: any) {
    formError.value = e.message || 'Error al guardar'
  } finally {
    formLoading.value = false
  }
}

function formatFecha(fecha: string) {
  if (!fecha) return '—'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(cargar)
</script>

<style scoped>
.page-nav { margin-bottom: 1rem; }
.page-back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: none; border: none; color: var(--color-primary);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem; border-radius: var(--radius-sm);
  transition: background 0.2s; font-family: var(--font-family);
}
.page-back-btn:hover { background: var(--color-fill); }

.state-loading {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 4rem 1rem; color: var(--color-text-tertiary); font-size: 0.85rem;
}

/* Ficha */
.ficha { margin-bottom: 1.25rem; }
.ficha-top { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.badge { padding: 3px 12px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; }
.badge-bodega { background: rgba(0,122,255,0.1); color: #007AFF; }
.badge-ventanilla { background: rgba(88,86,214,0.1); color: #5856D6; }
.badge-success { background: var(--color-success-bg); color: var(--color-success); }
.badge-error { background: var(--color-error-bg); color: var(--color-error); }
.ficha h1 { font-size: 1.35rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; letter-spacing: -0.02em; }
.ubicacion { font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; }
.ficha-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--color-text-tertiary); flex-wrap: wrap; margin-bottom: 0.5rem; }
.ficha-meta strong { color: var(--color-text); }
.funciones { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
.func-tag { background: var(--color-fill); color: var(--color-text-secondary); padding: 2px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }

/* Segmented tabs */
.segmented-control {
  display: inline-flex; gap: 2px; padding: 3px;
  background: var(--color-fill); border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
}
.segmented-control button {
  border: none; background: none; padding: 0.5rem 1rem; border-radius: var(--radius-sm);
  font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.2s; font-family: var(--font-family);
}
.segmented-control button.active {
  background: var(--color-surface); color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* Tab content */
.tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.tab-header h2 { font-size: 1rem; font-weight: 650; color: var(--color-text); margin: 0; }
.btn-sm {
  background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm);
  padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;
  transition: filter 0.2s; font-family: var(--font-family);
}
.btn-sm:hover { filter: brightness(1.1); }
.empty { color: var(--color-text-tertiary); font-size: 0.85rem; padding: 1rem 0; }

/* Data table */
.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  text-align: left; padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--color-separator); color: var(--color-text-tertiary);
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
}
.data-table td { padding: 0.55rem 0.75rem; border-bottom: 0.5px solid var(--color-separator); color: var(--color-text); }

/* Precio highlight */
.ultimo-precio {
  background: var(--color-success-bg); border: 1px solid rgba(52,199,89,0.2);
  border-radius: var(--radius-md); padding: 0.75rem 1rem;
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.875rem;
}
.tipo-maiz-tag { background: var(--color-fill); color: var(--color-text-secondary); padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }
.fecha-precio { color: var(--color-text-tertiary); font-size: 0.78rem; }

/* Contacts */
.contactos-lista { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.contacto-card { background: var(--color-fill-secondary); border-radius: var(--radius-md); padding: 0.9rem; }
.c-nombre { font-weight: 650; color: var(--color-text); margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.principal-tag { background: var(--color-success-bg); color: var(--color-success); font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 99px; }
.c-meta { font-size: 0.78rem; color: var(--color-text-secondary); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--color-surface); border-radius: var(--radius-xl);
  padding: 1.75rem; width: 100%; max-width: 480px; max-height: 85vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.06);
}
.modal-card h2 { font-size: 1.1rem; font-weight: 700; margin: 0 0 1.1rem; color: var(--color-text); letter-spacing: -0.02em; }

.field { margin-bottom: 0.9rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.3rem; }
.req { color: var(--color-error); }
.field input, .field select, .field textarea {
  width: 100%; box-sizing: border-box; padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 0.875rem; font-family: var(--font-family);
  background: var(--color-surface); color: var(--color-text);
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none; border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}
.field textarea { resize: vertical; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel {
  background: var(--color-fill); color: var(--color-text-secondary); border: none;
  border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.84rem;
  cursor: pointer; font-family: var(--font-family); transition: background 0.2s;
}
.btn-cancel:hover { background: var(--color-fill-secondary); }
.btn-primary {
  background: var(--color-primary); color: #fff; border: none;
  border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.84rem;
  font-weight: 600; cursor: pointer; font-family: var(--font-family); transition: filter 0.2s;
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg {
  color: var(--color-error); font-size: 0.82rem;
  background: var(--color-error-bg); border: 1px solid rgba(255,59,48,0.15);
  border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .segmented-control { display: flex; width: 100%; }
  .segmented-control button { flex: 1; text-align: center; padding: 0.45rem 0.5rem; font-size: 0.78rem; }
  .data-table { font-size: 0.78rem; }
  .data-table th, .data-table td { padding: 0.45rem 0.5rem; }
}
</style>
