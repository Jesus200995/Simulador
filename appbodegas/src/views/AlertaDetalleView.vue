<template>
  <div class="detalle-page">
    <button class="back-btn" @click="$router.back()">← Volver</button>

    <div v-if="loading" class="loading">Cargando alerta...</div>
    <div v-else-if="!alerta" class="empty">Alerta no encontrada.</div>

    <template v-else>
      <div class="detalle-header">
        <div class="header-top">
          <span :class="['nivel-badge', alerta.nivel_alerta]">{{ alerta.nivel_alerta.toUpperCase() }}</span>
          <span :class="['estado-badge', alerta.estado_alerta]">{{ alerta.estado_alerta }}</span>
          <span class="origen-badge">{{ alerta.origen_alerta }}</span>
        </div>
        <h1>{{ tipoLabel(alerta.tipo_alerta) }}</h1>
        <p class="meta">
          {{ alerta.apellido_paterno }} {{ alerta.nombres }} ·
          {{ alerta.up_name }} · Ciclo {{ alerta.cycle_year }} {{ alerta.cycle_type }}
        </p>
        <p class="fecha">{{ formatFecha(alerta.fecha_alerta) }}</p>
      </div>

      <div v-if="alerta.observaciones" class="obs-card">
        <strong>Observaciones:</strong> {{ alerta.observaciones }}
      </div>

      <!-- Acciones de estado -->
      <div v-if="alerta.estado_alerta === 'pendiente'" class="acciones">
        <h3>Acciones</h3>
        <div class="acciones-btns">
          <button class="btn-confirmar" @click="cambiarEstado('confirmada')">Confirmar</button>
          <button class="btn-descartar" @click="cambiarEstado('descartada')">Descartar</button>
          <button class="btn-atender" @click="cambiarEstado('atendida')">Marcar atendida</button>
        </div>
      </div>
      <div v-else-if="alerta.estado_alerta === 'confirmada'" class="acciones">
        <h3>Acciones</h3>
        <div class="acciones-btns">
          <button class="btn-atender" @click="cambiarEstado('atendida')">Marcar atendida</button>
        </div>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="meta-info">
        <p>Registrada por: {{ alerta.usuario_nombre || 'Sistema' }}</p>
        <p>Fecha registro: {{ formatFechaHora(alerta.created_at) }}</p>
        <p v-if="alerta.updated_at !== alerta.created_at">
          Última actualización: {{ formatFechaHora(alerta.updated_at) }}
        </p>
      </div>
    </template>
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
.detalle-page { max-width: 680px; margin: 0 auto; padding: 1.5rem; }
.back-btn { background: none; border: none; color: #2f855a; cursor: pointer; font-size: 0.9rem; margin-bottom: 1rem; padding: 0; }
.loading, .empty { text-align: center; color: #718096; padding: 2rem; }
.detalle-header { margin-bottom: 1.5rem; }
.header-top { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.nivel-badge, .estado-badge, .origen-badge {
  padding: 3px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700;
}
.nivel-badge.bajo { background: #c6f6d5; color: #276749; }
.nivel-badge.medio { background: #fef3c7; color: #92400e; }
.nivel-badge.alto { background: #fed7d7; color: #9b2c2c; }
.estado-badge.pendiente { background: #e2e8f0; color: #4a5568; }
.estado-badge.confirmada { background: #bee3f8; color: #2b6cb0; }
.estado-badge.descartada { background: #e2e8f0; color: #718096; }
.estado-badge.atendida { background: #c6f6d5; color: #276749; }
.origen-badge { background: #f7fafc; color: #718096; border: 1px solid #e2e8f0; }
.detalle-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin: 0 0 0.25rem; }
.meta { font-size: 0.875rem; color: #718096; margin: 0 0 0.2rem; }
.fecha { font-size: 0.85rem; color: #a0aec0; margin: 0; }
.obs-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: #4a5568; }
.acciones { margin-bottom: 1.25rem; }
.acciones h3 { font-size: 1rem; font-weight: 700; color: #2d3748; margin-bottom: 0.75rem; }
.acciones-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.btn-confirmar { background: #3182ce; color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.btn-descartar { background: #e2e8f0; color: #4a5568; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.875rem; cursor: pointer; }
.btn-atender { background: #2f855a; color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.error-msg { color: #e53e3e; font-size: 0.85rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
.meta-info { border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.8rem; color: #a0aec0; }
.meta-info p { margin: 0.2rem 0; }
</style>
