<template>
  <div class="page-container">
    <div class="view-header">
      <div class="view-header-row">
        <div>
          <h1>Mis Productores</h1>
          <p class="view-subtitle">Cartera de productores vinculados a tu supervisión</p>
        </div>
        <button class="btn btn-primary" @click="showForm = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar productor
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-loading">
      <span class="spinner spinner-dark spinner-lg"></span>
      <p>Cargando productores...</p>
    </div>

    <div v-else-if="productores.length === 0" class="glass-card state-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <p>Aún no tienes productores en tu cartera.</p>
      <button class="btn btn-primary" @click="showForm = true">Agregar primer productor</button>
    </div>

    <div v-else>
      <div class="search-bar">
        <input v-model="busqueda" type="text" placeholder="Buscar por nombre o CURP..." class="search-input" />
      </div>
      <div class="productores-list">
        <div
          v-for="p in producedoresFiltrados"
          :key="p.producer_id"
          class="glass-card interactive productor-card"
          @click="$router.push({ name: 'MisProductoresDetalle', params: { producerId: p.producer_id } })"
        >
          <div class="prod-avatar">{{ initials(p) }}</div>
          <div class="prod-body">
            <div class="prod-name">{{ p.apellido_paterno }} {{ p.apellido_materno }}, {{ p.nombres }}</div>
            <div class="prod-curp">CURP: {{ p.curp }}</div>
            <div class="prod-stats">
              <span>{{ p.total_ups }} UP(s)</span>
              <span>{{ p.total_ciclos }} ciclo(s)</span>
            </div>
          </div>
          <div class="prod-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal agregar productor -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-card">
        <h2>Agregar productor</h2>
        <p class="modal-desc">El productor debe estar previamente registrado en el sistema. Ingresa su CURP para vincularlo a tu cartera.</p>
        <div class="form-group">
          <label class="form-label">CURP del productor <span class="form-required">*</span></label>
          <input v-model="nuevoCurp" type="text" class="form-input" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase" />
        </div>
        <div v-if="formError" class="alert alert-error">{{ formError }}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showForm = false; nuevoCurp = ''; formError = ''">Cancelar</button>
          <button class="btn btn-primary" :disabled="formLoading || !nuevoCurp" @click="vincular">
            {{ formLoading ? 'Buscando...' : 'Vincular' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

const loading = ref(true)
const productores = ref<any[]>([])
const busqueda = ref('')
const showForm = ref(false)
const nuevoCurp = ref('')
const formLoading = ref(false)
const formError = ref('')

const producedoresFiltrados = computed(() => {
  if (!busqueda.value) return productores.value
  const q = busqueda.value.toLowerCase()
  return productores.value.filter(p =>
    p.nombres?.toLowerCase().includes(q) ||
    p.apellido_paterno?.toLowerCase().includes(q) ||
    p.curp?.toLowerCase().includes(q)
  )
})

function initials(p: any) {
  return ((p.nombres?.[0] || '') + (p.apellido_paterno?.[0] || '')).toUpperCase() || '?'
}

async function cargar() {
  loading.value = true
  try {
    const data = await api.misProductores.listar()
    productores.value = data.productores || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function vincular() {
  formError.value = ''
  formLoading.value = true
  try {
    await api.misProductores.vincular(nuevoCurp.value.toUpperCase().trim())
    showForm.value = false
    nuevoCurp.value = ''
    await cargar()
  } catch (e: any) {
    formError.value = e.message || 'Error al vincular productor'
  } finally {
    formLoading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.search-bar { margin-bottom: 1rem; }
.search-input {
  width: 100%; padding: .65rem 1rem; border: 1px solid var(--color-border);
  border-radius: 10px; font-size: .9rem; font-family: var(--font-family);
  box-sizing: border-box; background: var(--color-surface);
}

.productores-list { display: flex; flex-direction: column; gap: .75rem; }

.productor-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.25rem !important; cursor: pointer;
}

.prod-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(145deg, #4A0E20, #691C32); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; font-weight: 700;
}

.prod-body { flex: 1; min-width: 0; }
.prod-name { font-size: .9375rem; font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prod-curp { font-size: .75rem; color: var(--color-text-tertiary); font-family: monospace; margin-top: .1rem; }
.prod-stats { display: flex; gap: .75rem; margin-top: .35rem; }
.prod-stats span { font-size: .75rem; color: var(--color-text-secondary); background: var(--color-fill); padding: .15rem .5rem; border-radius: 99px; }

.prod-chevron { color: var(--color-text-tertiary); opacity: .4; flex-shrink: 0; }
.productor-card:hover .prod-chevron { opacity: .7; }

.modal-desc { font-size: .85rem; color: var(--color-text-secondary); margin-bottom: 1rem; }

.state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; gap: .75rem; color: var(--color-text-muted, #718096); }
.state-empty svg { width: 48px; height: 48px; opacity: .35; }
.state-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: .75rem; color: var(--color-text-muted, #718096); }

.spinner { display: inline-block; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.spinner-dark { border-top-color: var(--color-primary, #691C32); }
@keyframes spin { to { transform: rotate(360deg); } }

.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .4rem; }
.form-required { color: #c53030; }
.form-input { width: 100%; padding: .6rem .85rem; border: 1px solid var(--color-border); border-radius: 8px; font-size: .9rem; font-family: var(--font-family); box-sizing: border-box; }
.alert-error { color: #c53030; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: .6rem .85rem; font-size: .85rem; margin-bottom: .75rem; }
.modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }
</style>
