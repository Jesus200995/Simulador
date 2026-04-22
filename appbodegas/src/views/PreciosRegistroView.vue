<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <button class="btn-back" @click="$router.back()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
          <h1>Registrar Precio</h1>
          <p class="view-subtitle">Captura de precio de maíz por tipo y fuente</p>
        </div>
      </div>
    </div>

    <div class="registro-layout">
      <form class="glass-card form-card" @submit.prevent="guardar">
        <!-- Tipo de precio -->
        <div class="form-section">
          <h3 class="form-section-title">Tipo de mercado</h3>
          <div class="tipo-grid">
            <label
              v-for="opt in tiposPrecios"
              :key="opt.value"
              class="tipo-card"
              :class="{ selected: form.tipo_precio === opt.value }"
            >
              <input type="radio" :value="opt.value" v-model="form.tipo_precio" class="sr-only" />
              <div class="tipo-icon">
                <component :is="'span'" v-html="opt.icon" />
              </div>
              <div class="tipo-label">{{ opt.label }}</div>
              <div class="tipo-desc">{{ opt.desc }}</div>
            </label>
          </div>
        </div>

        <!-- Datos base -->
        <div class="form-section">
          <h3 class="form-section-title">Datos del precio</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de maíz <span class="form-required">*</span></label>
              <select v-model="form.tipo_maiz" class="form-input" required>
                <option value="">Selecciona...</option>
                <option value="blanco">Blanco</option>
                <option value="amarillo">Amarillo</option>
                <option value="especialidad">Especialidad</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha <span class="form-required">*</span></label>
              <input type="date" v-model="form.fecha" class="form-input" required :max="hoy" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Precio ($/ton) <span class="form-required">*</span></label>
              <input
                type="number"
                v-model.number="form.precio"
                class="form-input"
                min="0"
                step="0.01"
                placeholder="Ej: 4850.00"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Fuente</label>
              <input type="text" v-model="form.fuente" class="form-input" placeholder="Ej: ASERCA, CBOT, SADER..." />
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="form-section">
          <h3 class="form-section-title">Ubicación (opcional)</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Estado</label>
              <input type="text" v-model="form.estado" class="form-input" placeholder="Ej: Jalisco" list="estados-list" />
              <datalist id="estados-list">
                <option v-for="e in estadosMx" :key="e" :value="e" />
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Municipio</label>
              <input type="text" v-model="form.municipio" class="form-input" placeholder="Ej: Guadalajara" />
            </div>
          </div>
        </div>

        <!-- Campos condicionales: Internacional -->
        <Transition name="slide-down">
          <div class="form-section form-section-cond" v-if="form.tipo_precio === 'mercado_internacional'">
            <h3 class="form-section-title cond-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Datos internacionales
            </h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Valor en origen</label>
                <input type="number" v-model.number="form.valor_origen" class="form-input" min="0" step="0.01" placeholder="Ej: 245.50" />
              </div>
              <div class="form-group">
                <label class="form-label">Unidad de origen</label>
                <select v-model="form.unidad_origen" class="form-input">
                  <option value="">Selecciona...</option>
                  <option value="USD/bushel">USD/bushel</option>
                  <option value="USD/ton">USD/ton</option>
                  <option value="USD/MT">USD/MT</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipo de cambio (MXN/USD)</label>
                <input type="number" v-model.number="form.tipo_cambio" class="form-input" min="0" step="0.01" placeholder="Ej: 17.25" />
              </div>
            </div>
          </div>
        </Transition>

        <!-- Campos condicionales: Gobierno -->
        <Transition name="slide-down">
          <div class="form-section form-section-cond" v-if="form.tipo_precio === 'gobierno'">
            <h3 class="form-section-title cond-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Programa de gobierno
            </h3>
            <div class="form-group">
              <label class="form-label">Nombre del programa</label>
              <input type="text" v-model="form.programa" class="form-input" placeholder="Ej: SEGALMEX, FIRA, ASERCA..." />
            </div>
          </div>
        </Transition>

        <!-- Observaciones -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea v-model="form.observaciones" class="form-input form-textarea" rows="3" placeholder="Notas adicionales sobre el precio registrado..."></textarea>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="form-error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error }}
        </div>

        <!-- Acciones -->
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="$router.back()">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="guardando">
            <span v-if="guardando" class="spinner spinner-sm"></span>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ guardando ? 'Guardando...' : 'Guardar precio' }}
          </button>
        </div>
      </form>

      <!-- Resumen preview -->
      <div class="preview-panel" v-if="form.tipo_precio && form.precio && form.tipo_maiz">
        <div class="glass-card preview-card">
          <div class="preview-title">Vista previa</div>
          <div class="preview-badge-row">
            <span class="badge" :class="tipoBadge(form.tipo_precio)">{{ tipoLabel(form.tipo_precio) }}</span>
            <span class="badge badge-gray">{{ maizLabel(form.tipo_maiz) }}</span>
          </div>
          <div class="preview-precio">{{ formatPrecio(form.precio) }}</div>
          <div class="preview-meta">{{ form.fecha || '—' }}</div>
          <div class="preview-meta" v-if="form.fuente">{{ form.fuente }}</div>
          <div class="preview-meta" v-if="form.estado">{{ form.municipio ? form.municipio + ', ' : '' }}{{ form.estado }}</div>
          <div class="preview-meta" v-if="form.tipo_precio === 'mercado_internacional' && form.valor_origen">
            {{ form.valor_origen }} {{ form.unidad_origen }} × {{ form.tipo_cambio }} MXN/USD
          </div>
          <div class="preview-meta" v-if="form.tipo_precio === 'gobierno' && form.programa">
            Prog: {{ form.programa }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const guardando = ref(false)
const error = ref('')

const hoy = new Date().toISOString().split('T')[0]

const form = ref({
  tipo_precio: 'bodega',
  tipo_maiz: '',
  fecha: hoy,
  precio: null as number | null,
  fuente: '',
  estado: '',
  municipio: '',
  observaciones: '',
  valor_origen: null as number | null,
  unidad_origen: 'USD/bushel',
  tipo_cambio: null as number | null,
  programa: '',
})

const tiposPrecios = [
  {
    value: 'bodega',
    label: 'Bodega',
    desc: 'Precio registrado en bodega o ventanilla',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  },
  {
    value: 'mercado_internacional',
    label: 'Internacional',
    desc: 'CBOT, CME, referencia global',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  },
  {
    value: 'gobierno',
    label: 'Gobierno',
    desc: 'SEGALMEX, FIRA, ASERCA',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  },
]

const estadosMx = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua',
  'Ciudad de México','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'México','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro',
  'Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas',
]

function tipoLabel(t: string) {
  const map: Record<string, string> = { bodega: 'Bodega', mercado_internacional: 'Internacional', gobierno: 'Gobierno' }
  return map[t] || t
}
function maizLabel(t: string) {
  const map: Record<string, string> = { blanco: 'Blanco', amarillo: 'Amarillo', especialidad: 'Especialidad' }
  return map[t] || t
}
function tipoBadge(t: string) {
  if (t === 'bodega') return 'badge-orange'
  if (t === 'mercado_internacional') return 'badge-purple'
  if (t === 'gobierno') return 'badge-green'
  return 'badge-gray'
}
function formatPrecio(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)
}

async function guardar() {
  if (!form.value.tipo_precio || !form.value.tipo_maiz || !form.value.fecha || form.value.precio == null) {
    error.value = 'Completa los campos requeridos: tipo precio, tipo maíz, fecha y precio.'
    return
  }
  guardando.value = true
  error.value = ''
  try {
    await api.preciosMaiz.registrar({
      tipo_precio: form.value.tipo_precio,
      fuente: form.value.fuente || undefined,
      tipo_maiz: form.value.tipo_maiz,
      fecha: form.value.fecha,
      precio: form.value.precio!,
      estado: form.value.estado || undefined,
      municipio: form.value.municipio || undefined,
      observaciones: form.value.observaciones || undefined,
      valor_origen: form.value.valor_origen ?? undefined,
      unidad_origen: form.value.unidad_origen || undefined,
      tipo_cambio: form.value.tipo_cambio ?? undefined,
      programa: form.value.programa || undefined,
    })
    router.push('/precios')
  } catch (err: any) {
    error.value = err.message || 'Error al guardar el precio'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.registro-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 900px) {
  .registro-layout { grid-template-columns: 1fr; }
  .preview-panel { order: -1; }
}

.form-card { padding: 1.5rem; }

.form-section {
  margin-bottom: 1.75rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; }

.form-section-title {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #718096);
  margin: 0 0 1rem;
}
.cond-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-primary, #691C32);
}

.form-section-cond {
  background: rgba(105, 28, 50, 0.03);
  border-radius: 10px;
  padding: 1.25rem;
  border: 1.5px solid rgba(105, 28, 50, 0.12);
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
@media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.82rem; font-weight: 600; color: var(--color-text, #1a202c); }
.form-required { color: var(--color-primary, #691C32); }
.form-input {
  padding: 0.55rem 0.75rem;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  color: var(--color-text, #1a202c);
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--color-primary, #691C32); }
.form-textarea { resize: vertical; min-height: 80px; }

/* Tipo selector cards */
.tipo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
@media (max-width: 600px) { .tipo-grid { grid-template-columns: 1fr; } }

.tipo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem 0.75rem;
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  background: #fff;
}
.tipo-card:hover { border-color: var(--color-primary, #691C32); background: rgba(105,28,50,0.03); }
.tipo-card.selected {
  border-color: var(--color-primary, #691C32);
  background: rgba(105,28,50,0.06);
}
.tipo-icon { color: var(--color-primary, #691C32); }
.tipo-label { font-size: 0.82rem; font-weight: 700; color: var(--color-text, #1a202c); }
.tipo-desc { font-size: 0.72rem; color: var(--color-text-muted, #718096); line-height: 1.3; }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

/* Error */
.form-error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c53030;
  font-size: 0.85rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  margin-bottom: 1rem;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Preview */
.preview-card { padding: 1.25rem; }
.preview-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #718096);
  margin-bottom: 0.75rem;
}
.preview-badge-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.preview-precio {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-primary, #691C32);
  margin-bottom: 0.5rem;
}
.preview-meta { font-size: 0.8rem; color: var(--color-text-muted, #718096); margin-bottom: 0.2rem; }

/* badges */
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.badge-orange { background: #fff7ed; color: #c05621; }
.badge-purple { background: #f5f3ff; color: #7e3af2; }
.badge-green { background: #f0fff4; color: #276749; }
.badge-gray { background: #f7fafc; color: #718096; }

/* btn-back */
.btn-back {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted, #718096); font-size: 0.82rem;
  padding: 0; margin-bottom: 0.5rem; transition: color 0.15s;
}
.btn-back:hover { color: var(--color-primary, #691C32); }

/* spinner */
.spinner { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Transition */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; max-height: 400px; }
</style>
