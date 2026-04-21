<template>
  <div class="alertas-page">
    <div class="page-header">
      <h1>Alertas</h1>
      <button class="btn-primary" @click="showForm = true">+ Nueva alerta</button>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <select v-model="filtros.estado_alerta" @change="cargar">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="descartada">Descartada</option>
        <option value="atendida">Atendida</option>
      </select>
      <select v-model="filtros.nivel_alerta" @change="cargar">
        <option value="">Todos los niveles</option>
        <option value="bajo">Bajo</option>
        <option value="medio">Medio</option>
        <option value="alto">Alto</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Cargando alertas...</div>
    <div v-else-if="alertas.length === 0" class="empty">No hay alertas con los filtros seleccionados.</div>

    <div v-else class="alertas-lista">
      <div
        v-for="alerta in alertas"
        :key="alerta.id"
        class="alerta-card"
        @click="$router.push({ name: 'AlertaDetalle', params: { id: alerta.id } })"
      >
        <div class="alerta-top">
          <span :class="['nivel-badge', alerta.nivel_alerta]">{{ alerta.nivel_alerta.toUpperCase() }}</span>
          <span :class="['estado-badge', alerta.estado_alerta]">{{ alerta.estado_alerta }}</span>
          <span class="origen-badge">{{ alerta.origen_alerta }}</span>
        </div>
        <div class="alerta-body">
          <div class="tipo">{{ tipoLabel(alerta.tipo_alerta) }}</div>
          <div class="productor">
            {{ alerta.apellido_paterno }} {{ alerta.nombres }} · {{ alerta.up_name }}
          </div>
          <div class="fecha">{{ formatFecha(alerta.fecha_alerta) }}</div>
        </div>
      </div>
    </div>

    <!-- Modal nueva alerta -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h2>Nueva alerta manual</h2>
        <form @submit.prevent="crearAlerta">
          <div class="field">
            <label>UP ID <span class="req">*</span></label>
            <input v-model.number="newAlerta.up_id" type="number" placeholder="ID de la UP" required />
          </div>
          <div class="field">
            <label>Ciclo ID <span class="req">*</span></label>
            <input v-model.number="newAlerta.ciclo_id" type="number" placeholder="ID del ciclo" required />
          </div>
          <div class="field">
            <label>Tipo de alerta <span class="req">*</span></label>
            <select v-model="newAlerta.tipo_alerta" required>
              <option value="">-- Seleccionar --</option>
              <option value="helada">Helada</option>
              <option value="sequia">Sequía</option>
              <option value="lluvia_fuerte">Lluvia fuerte</option>
              <option value="viento_fuerte">Viento fuerte</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="field">
            <label>Nivel <span class="req">*</span></label>
            <select v-model="newAlerta.nivel_alerta" required>
              <option value="">-- Seleccionar --</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="field">
            <label>Fecha <span class="req">*</span></label>
            <input v-model="newAlerta.fecha_alerta" type="date" required />
          </div>
          <div class="field">
            <label>Observaciones</label>
            <textarea v-model="newAlerta.observaciones" rows="2" maxlength="500" />
          </div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showForm = false">Cancelar</button>
            <button type="submit" :disabled="formLoading" class="btn-primary">
              {{ formLoading ? 'Guardando...' : 'Crear alerta' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'

const alertas = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const formLoading = ref(false)
const formError = ref('')
const filtros = ref({ estado_alerta: '', nivel_alerta: '' })
const hoy = new Date().toISOString().split('T')[0]

const newAlerta = ref({
  up_id: null as number | null,
  ciclo_id: null as number | null,
  tipo_alerta: '',
  nivel_alerta: '',
  fecha_alerta: hoy,
  observaciones: '',
})

async function cargar() {
  loading.value = true
  try {
    const data = await api.alertas.listar(filtros.value)
    alertas.value = data.alertas
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function crearAlerta() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.alertas.crear(newAlerta.value)
    showForm.value = false
    newAlerta.value = { up_id: null, ciclo_id: null, tipo_alerta: '', nivel_alerta: '', fecha_alerta: hoy, observaciones: '' }
    await cargar()
  } catch (e: any) {
    formError.value = e.message || 'Error al crear alerta'
  } finally {
    formLoading.value = false
  }
}

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    helada: 'Helada', sequia: 'Sequía', lluvia_fuerte: 'Lluvia fuerte',
    viento_fuerte: 'Viento fuerte', otro: 'Otro',
  }
  return map[tipo] || tipo
}

function formatFecha(fecha: string) {
  if (!fecha) return ''
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(cargar)
</script>

<style scoped>
.alertas-page { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin: 0; }
.btn-primary { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1.1rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.filtros { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.filtros select { padding: 0.45rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; }
.loading, .empty { text-align: center; color: #718096; padding: 2rem; }
.alertas-lista { display: grid; gap: 0.75rem; }
.alerta-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 1rem; cursor: pointer; transition: box-shadow 0.15s;
}
.alerta-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.alerta-top { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; flex-wrap: wrap; }
.nivel-badge, .estado-badge, .origen-badge {
  padding: 2px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 700;
}
.nivel-badge.bajo { background: #c6f6d5; color: #276749; }
.nivel-badge.medio { background: #fef3c7; color: #92400e; }
.nivel-badge.alto { background: #fed7d7; color: #9b2c2c; }
.estado-badge.pendiente { background: #e2e8f0; color: #4a5568; }
.estado-badge.confirmada { background: #bee3f8; color: #2b6cb0; }
.estado-badge.descartada { background: #e2e8f0; color: #718096; }
.estado-badge.atendida { background: #c6f6d5; color: #276749; }
.origen-badge { background: #f7fafc; color: #718096; border: 1px solid #e2e8f0; }
.alerta-body .tipo { font-weight: 700; font-size: 1rem; color: #2d3748; margin-bottom: 0.2rem; }
.alerta-body .productor { font-size: 0.85rem; color: #718096; }
.alerta-body .fecha { font-size: 0.8rem; color: #a0aec0; margin-top: 0.2rem; }
/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 480px; }
.modal h2 { font-size: 1.2rem; font-weight: 700; margin: 0 0 1.25rem; color: #1a202c; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; color: #4a5568; margin-bottom: 0.3rem; }
.req { color: #e53e3e; }
.field input, .field select, .field textarea {
  width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;
}
.field textarea { resize: vertical; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
.btn-cancel { background: #edf2f7; color: #4a5568; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.9rem; cursor: pointer; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
</style>
