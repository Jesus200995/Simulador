<template>
  <div class="page-container">
    <div class="page-nav">
      <button class="page-back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>
    </div>

    <div class="content-wrap">
      <div v-if="loading" class="state-loading">
        <div class="spinner spinner-dark"></div>
        <span>Cargando alerta...</span>
      </div>
      <div v-else-if="!alerta" class="state-empty">Alerta no encontrada.</div>

      <template v-else>
        <div class="glass-card detalle-card">
          <div class="badge-row">
            <span :class="['badge', 'nivel-' + alerta.nivel_alerta]">{{ alerta.nivel_alerta.toUpperCase() }}</span>
            <span :class="['badge', 'estado-' + alerta.estado_alerta]">{{ alerta.estado_alerta }}</span>
            <span class="badge badge-outline">{{ alerta.origen_alerta }}</span>
          </div>
          <h1 class="detalle-title">{{ tipoLabel(alerta.tipo_alerta) }}</h1>
          <p class="detalle-meta">
            {{ alerta.apellido_paterno }} {{ alerta.nombres }} ·
            {{ alerta.up_name }} · Ciclo {{ alerta.cycle_year }} {{ alerta.cycle_type }}
          </p>
          <p class="detalle-fecha">{{ formatFecha(alerta.fecha_alerta) }}</p>
        </div>

        <div v-if="alerta.observaciones" class="glass-card obs-card">
          <strong>Observaciones:</strong> {{ alerta.observaciones }}
        </div>

        <!-- Acciones de estado -->
        <div v-if="alerta.estado_alerta === 'pendiente'" class="glass-card acciones-card">
          <h3>Acciones</h3>
          <div class="acciones-btns">
            <button class="btn btn-sm btn-confirmar" @click="cambiarEstado('confirmada')">Confirmar</button>
            <button class="btn btn-sm btn-descartar" @click="cambiarEstado('descartada')">Descartar</button>
            <button class="btn btn-sm btn-atender" @click="cambiarEstado('atendida')">Marcar atendida</button>
          </div>
        </div>
        <div v-else-if="alerta.estado_alerta === 'confirmada'" class="glass-card acciones-card">
          <h3>Acciones</h3>
          <div class="acciones-btns">
            <button class="btn btn-sm btn-atender" @click="cambiarEstado('atendida')">Marcar atendida</button>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="glass-card meta-card">
          <p>Registrada por: {{ alerta.usuario_nombre || 'Sistema' }}</p>
          <p>Fecha registro: {{ formatFechaHora(alerta.created_at) }}</p>
          <p v-if="alerta.updated_at !== alerta.created_at">
            Última actualización: {{ formatFechaHora(alerta.updated_at) }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const alerta = ref<any>(null)
const loading = ref(true)
const error = ref('')

async function cargar() {
  loading.value = true
  try {
    const data = await api.alertas.obtener(Number(route.params.id))
    alerta.value = data.alerta
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function cambiarEstado(estado: string) {
  error.value = ''
  try {
    await api.alertas.cambiarEstado(Number(route.params.id), estado)
    await cargar()
  } catch (e: any) {
    error.value = e.message || 'Error al cambiar estado'
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
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatFechaHora(ts: string) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(cargar)
</script>

<style scoped>
.content-wrap { max-width: 680px; margin: 0 auto; }

.page-nav { margin-bottom: 1rem; }

.page-back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: none; border: none; color: var(--color-primary);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem; border-radius: var(--radius-sm);
  transition: background 0.2s; font-family: var(--font-family);
}
.page-back-btn:hover { background: var(--color-fill); }

.detalle-card { margin-bottom: 1rem; }

.badge-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.badge {
  padding: 3px 12px; border-radius: 99px; font-size: 0.72rem; font-weight: 700;
  text-transform: capitalize;
}
.nivel-bajo { background: var(--color-success-bg); color: var(--color-success); }
.nivel-medio { background: var(--color-warning-bg); color: var(--color-warning); }
.nivel-alto { background: var(--color-error-bg); color: var(--color-error); }
.estado-pendiente { background: var(--color-fill); color: var(--color-text-secondary); }
.estado-confirmada { background: rgba(0,122,255,0.1); color: #007AFF; }
.estado-descartada { background: var(--color-fill); color: var(--color-text-tertiary); }
.estado-atendida { background: var(--color-success-bg); color: var(--color-success); }
.badge-outline { background: var(--color-surface); color: var(--color-text-tertiary); border: 1px solid var(--color-border); }

.detalle-title { font-size: 1.35rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; letter-spacing: -0.02em; }
.detalle-meta { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 0.2rem; }
.detalle-fecha { font-size: 0.82rem; color: var(--color-text-tertiary); margin: 0; }

.obs-card { font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 1rem; padding: 1rem 1.25rem; }
.obs-card strong { color: var(--color-text); }

.acciones-card { margin-bottom: 1rem; }
.acciones-card h3 { font-size: 0.9rem; font-weight: 650; color: var(--color-text); margin: 0 0 0.75rem; }
.acciones-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

.btn-confirmar { background: #007AFF; color: #fff; border: none; border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-confirmar:hover { background: #0063D1; }
.btn-descartar { background: var(--color-fill); color: var(--color-text-secondary); border: none; border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-descartar:hover { background: var(--color-fill-secondary); }
.btn-atender { background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-atender:hover { filter: brightness(1.1); }

.meta-card { font-size: 0.8rem; color: var(--color-text-tertiary); }
.meta-card p { margin: 0.25rem 0; }
</style>
