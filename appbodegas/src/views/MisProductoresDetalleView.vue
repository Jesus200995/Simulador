<template>
  <div class="page-container">
    <div class="page-nav">
      <button class="page-back-btn" @click="$router.push({ name: 'MisProductores' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Mis Productores
      </button>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
    </div>

    <template v-else-if="productor">
      <div class="view-header">
        <h1>{{ productor.apellido_paterno }} {{ productor.apellido_materno }}, {{ productor.nombres }}</h1>
        <p class="view-subtitle">CURP: {{ productor.curp }}</p>
      </div>

      <!-- Datos básicos -->
      <div class="glass-card info-card">
        <div class="info-row"><span class="info-label">Teléfono</span><span class="info-val">{{ productor.telefono || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-val">{{ productor.email || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Sexo</span><span class="info-val">{{ productor.sexo || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Estado</span><span class="info-val">{{ productor.state_id || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Municipio</span><span class="info-val">{{ productor.municipality_id || '—' }}</span></div>
        <div class="info-row"><span class="info-label">Localidad</span><span class="info-val">{{ productor.localidad || '—' }}</span></div>
      </div>

      <!-- UPs -->
      <div class="section-header">
        <h2 class="section-title">Unidades de Producción ({{ ups.length }})</h2>
      </div>
      <div v-if="ups.length === 0" class="glass-card state-empty-sm"><p>Sin UPs registradas.</p></div>
      <div v-for="up in ups" :key="up.up_id" class="glass-card up-card">
        <div class="up-header">
          <span class="up-name">{{ up.up_name }}</span>
          <span class="up-area" v-if="up.area_ha_calc">{{ Number(up.area_ha_calc).toFixed(2) }} ha</span>
        </div>
        <div class="up-meta">{{ up.state_name || '—' }} · {{ up.municipality_name || '—' }}</div>
        <div class="up-ciclos">{{ up.total_ciclos }} ciclo(s) registrado(s)</div>
      </div>

      <!-- Alertas -->
      <div class="section-header">
        <h2 class="section-title">Alertas recientes ({{ alertas.length }})</h2>
      </div>
      <div v-if="alertas.length === 0" class="glass-card state-empty-sm"><p>Sin alertas.</p></div>
      <div v-for="a in alertas" :key="a.id" class="glass-card seg-item">
        <div class="seg-fecha">{{ formatFecha(a.fecha_alerta) }}</div>
        <div class="seg-desc">{{ a.tipo_alerta }} · {{ a.up_name || '—' }}</div>
        <div class="seg-obs">{{ a.nivel_alerta }} · {{ a.estado_alerta }}</div>
      </div>

      <!-- Desvincular -->
      <div class="danger-zone">
        <button class="btn btn-danger-ghost" @click="confirmarDesvincular" :disabled="desvinculando">
          {{ desvinculando ? 'Desvinculando...' : 'Quitar de mi cartera' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()
const producerId = Number(route.params.producerId)

const loading = ref(true)
const productor = ref<any>(null)
const ups = ref<any[]>([])
const alertas = ref<any[]>([])
const desvinculando = ref(false)

async function cargar() {
  loading.value = true
  try {
    const data = await api.misProductores.obtener(producerId)
    productor.value = data.productor
    ups.value = data.ups || []
    alertas.value = data.alertas || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function confirmarDesvincular() {
  if (!confirm('¿Quitar a este productor de tu cartera?')) return
  desvinculando.value = true
  try {
    await api.misProductores.desvincular(producerId)
    router.push({ name: 'MisProductores' })
  } catch (e: any) {
    alert(e.message || 'Error al desvincular')
  } finally {
    desvinculando.value = false
  }
}

function formatFecha(f: string) {
  if (!f) return '—'
  return new Date(f.includes('T') ? f : f + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(cargar)
</script>

<style scoped>
.info-card { padding: 1.25rem; }
.info-row { display: flex; justify-content: space-between; padding: .5rem 0; border-bottom: .5px solid var(--color-separator); font-size: .875rem; }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--color-text-secondary); }
.info-val { font-weight: 600; color: var(--color-text); }

.section-header { margin: 1.25rem 0 .5rem; }
.section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-tertiary); }

.up-card { padding: 1rem 1.25rem; margin-bottom: .5rem; }
.up-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .25rem; }
.up-name { font-weight: 700; color: var(--color-text); }
.up-area { font-size: .78rem; font-weight: 600; padding: .15rem .5rem; background: rgba(15, 81, 50,.08); color: #0F5132; border-radius: 99px; }
.up-meta { font-size: .8125rem; color: var(--color-text-secondary); }
.up-ciclos { font-size: .75rem; color: var(--color-text-tertiary); margin-top: .15rem; }

.seg-item { padding: .875rem 1.25rem; margin-bottom: .5rem; }
.seg-fecha { font-size: .75rem; color: var(--color-text-tertiary); }
.seg-desc { font-size: .875rem; font-weight: 600; color: var(--color-text); }
.seg-obs { font-size: .78rem; color: var(--color-text-secondary); }

.danger-zone { margin-top: 2rem; display: flex; justify-content: center; }
.btn-danger-ghost {
  background: none; border: 1.5px solid #e53e3e; color: #e53e3e;
  padding: .6rem 1.5rem; border-radius: 99px; font-size: .85rem; font-weight: 600;
  font-family: var(--font-family); cursor: pointer; transition: all .2s;
}
.btn-danger-ghost:hover { background: #fff5f5; }
.btn-danger-ghost:disabled { opacity: .5; cursor: not-allowed; }

.state-empty-sm { padding: 1.25rem; text-align: center; color: var(--color-text-tertiary); font-size: .875rem; margin-bottom: .5rem; }
.state-loading { display: flex; align-items: center; justify-content: center; padding: 3rem; }

.spinner { display: inline-block; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.spinner-dark { border-top-color: var(--color-primary, #0F5132); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
