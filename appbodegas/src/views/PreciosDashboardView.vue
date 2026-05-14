<template>
  <div class="ps-page">
    <!-- ── Header ─────────────────────────────────────── -->
    <div class="ps-header">
      <div class="ps-header-left">
        <h1 class="ps-title">Dashboard Administrativo</h1>
        <p class="ps-subtitle">Módulo de Precios — Precio Sistema en tiempo real</p>
      </div>
      <button class="ps-refresh-btn" @click="cargarTodo" title="Actualizar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin': cargando }"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>
    </div>

    <!-- ── Sub-tabs ────────────────────────────────────── -->
    <div class="ps-tabs">
      <button v-for="t in tabs" :key="t.key"
        class="ps-tab" :class="{ active: tabActivo === t.key }"
        @click="tabActivo = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- ══ TAB: PRECIOS ════════════════════════════════════════ -->
    <div v-if="tabActivo === 'precios'">

      <!-- ── Filtros ─────────────────────────────────── -->
      <div class="ps-filters">
        <span class="ps-filters-label">Filtros</span>
        <select v-model="filtros.region" class="ps-select">
          <option value="bajio_sinaloa">Bajío + Sinaloa (piloto)</option>
          <option value="bajio">Solo Bajío</option>
          <option value="sinaloa">Solo Sinaloa</option>
          <option value="nacional">Nacional</option>
        </select>
        <select v-model="filtros.estado" class="ps-select">
          <option value="todos">Todos los estados</option>
          <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
        </select>
        <select v-model="filtros.municipio" class="ps-select">
          <option value="todos">Todos los municipios</option>
          <option v-for="m in municipiosFiltrados" :key="m" :value="m">{{ m }}</option>
        </select>
        <select v-model="filtros.variedad" class="ps-select">
          <option value="todos">Maíz blanco (todos)</option>
          <option value="blanco">Híbrido</option>
          <option value="nativo">Nativo</option>
          <option value="amarillo">Amarillo</option>
        </select>
        <select v-model="filtros.periodo" class="ps-select">
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="ciclo">Ciclo PV 2026</option>
        </select>
        <button class="ps-btn-apply" @click="aplicarFiltros">Aplicar</button>
        <button class="ps-btn-clear" @click="limpiarFiltros">Limpiar</button>
        <span class="ps-live-badge"><span class="ps-live-dot"></span>EN VIVO</span>
      </div>

      <!-- ── Barra fórmula ──────────────────────────── -->
      <div class="ps-formula-bar">
        <div class="ps-formula-item ps-formula-total">
          <div class="ps-f-label">PRECIO SISTEMA HOY</div>
          <div class="ps-f-value ps-f-accent">{{ fmt(hoy?.ps) }}</div>
          <div class="ps-f-sub">MXN / tonelada</div>
        </div>
        <div class="ps-formula-eq">= =</div>
        <div class="ps-formula-item">
          <div class="ps-f-label">PO · PRECIO ORIGEN</div>
          <div class="ps-f-value">{{ fmt(hoy?.po) }}</div>
          <div class="ps-f-sub">Promedio {{ params?.ventana_dias ?? 7 }} días</div>
        </div>
        <div class="ps-formula-op">+ +</div>
        <div class="ps-formula-item">
          <div class="ps-f-label">S · SERVICIOS BODEGA</div>
          <div class="ps-f-value">{{ fmt(hoy?.s) }}</div>
          <div class="ps-f-sub">Promedio regional</div>
        </div>
        <div class="ps-formula-op">+ +</div>
        <div class="ps-formula-item">
          <div class="ps-f-label">M · MARGEN ({{ params?.margen_pct ?? 10 }}%)</div>
          <div class="ps-f-value">{{ fmt(hoy?.m) }}</div>
          <div class="ps-f-sub">Parámetro config.</div>
        </div>
        <div class="ps-formula-op">+ +</div>
        <div class="ps-formula-item">
          <div class="ps-f-label">F · FLETE GIS</div>
          <div class="ps-f-value">{{ fmt(hoy?.f) }}</div>
          <div class="ps-f-sub">Promedio regional</div>
        </div>
      </div>

      <!-- ── KPI Cards ──────────────────────────────── -->
      <div class="ps-kpi-grid">
        <!-- Precio Sistema -->
        <div class="ps-kpi-card" style="--bar: #1A5C38">
          <div class="ps-kpi-icon" style="color:#1A5C38">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#1A5C38">{{ fmt(hoy?.ps) }}</div>
            <div class="ps-kpi-label">Precio Sistema</div>
            <div class="ps-kpi-sub">MXN/ton · Bajío+Sinaloa</div>
            <span class="ps-delta" :class="hoy?.delta_vs_ayer >= 0 ? 'delta-up' : 'delta-down'">
              {{ hoy?.delta_vs_ayer >= 0 ? '↑' : '↓' }} {{ fmt(Math.abs(hoy?.delta_vs_ayer ?? 0)) }} vs ayer
            </span>
          </div>
        </div>

        <!-- Brecha de Mercado -->
        <div class="ps-kpi-card" style="--bar: #DC2626">
          <div class="ps-kpi-icon" style="color:#DC2626">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#DC2626">{{ fmtBrecha(brecha) }}</div>
            <div class="ps-kpi-label">Brecha de Mercado</div>
            <div class="ps-kpi-sub">P.Ref ({{ fmt(pRef) }}) − PO real ({{ fmt(hoy?.po) }})</div>
            <span class="ps-delta delta-down">↓ Productor pierde {{ fmt(Math.abs(brecha)) }}/ton</span>
          </div>
        </div>

        <!-- Utilidad Estimada -->
        <div class="ps-kpi-card" style="--bar: #D97706">
          <div class="ps-kpi-icon" style="color:#D97706">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#D97706">{{ fmtBrecha(utilidadEstimada) }}</div>
            <div class="ps-kpi-label">Utilidad Estimada</div>
            <div class="ps-kpi-sub">PO real − Costo FIRA ({{ fmt(refs?.costo_fira) }})</div>
            <span class="ps-delta" :class="utilidadEstimada >= 0 ? 'delta-up' : 'delta-down'">
              {{ utilidadEstimada >= 0 ? 'Ganancia' : 'Pérdida' }} por tonelada
            </span>
          </div>
        </div>

        <!-- Chicago -->
        <div class="ps-kpi-card" style="--bar: #2563EB">
          <div class="ps-kpi-icon" style="color:#2563EB">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#2563EB">{{ fmt(refs?.chicago_mxn) }}</div>
            <div class="ps-kpi-label">Chicago (ref.)</div>
            <div class="ps-kpi-sub">Maíz amarillo · TC ${{ refs?.tc_banxico }}</div>
            <span class="ps-delta delta-neutral">▸ {{ fmt((refs?.chicago_mxn ?? 0) - (hoy?.ps ?? 0)) }} vs P.Sistema</span>
          </div>
        </div>

        <!-- Transacciones -->
        <div class="ps-kpi-card" style="--bar: #4A9B6A">
          <div class="ps-kpi-icon" style="color:#4A9B6A">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#4A9B6A">{{ txns?.total ?? 312 }}</div>
            <div class="ps-kpi-label">Transacciones (7d)</div>
            <div class="ps-kpi-sub">Trianguladas: {{ txns?.trianguladas_pct ?? 68 }}% · Confianza: Alta</div>
            <span class="ps-delta delta-up">↑ {{ txns?.nuevas_hoy ?? 23 }} nuevas hoy</span>
          </div>
        </div>

        <!-- Discrepancias -->
        <div class="ps-kpi-card ps-kpi-card-link" style="--bar: #6B7280" @click="scrollToDiscrepancias">
          <div class="ps-kpi-icon" style="color:#6B7280">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div class="ps-kpi-body">
            <div class="ps-kpi-value" style="color:#6B7280">{{ discrepancias.length }}</div>
            <div class="ps-kpi-label">Discrepancias</div>
            <div class="ps-kpi-sub">Pendientes de revisión</div>
            <span class="ps-delta delta-warn">{{ discrepanciasAlta }} de alta prioridad</span>
          </div>
        </div>
      </div>

      <!-- ── Layout dos columnas ──────────────────────── -->
      <div class="ps-two-col">

        <!-- COLUMNA IZQUIERDA -->
        <div class="ps-col-left">

          <!-- Gráfica tendencia -->
          <div class="ps-card">
            <div class="ps-card-header">
              <div class="ps-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Tendencia del Precio Sistema
                <span class="ps-card-sub">— últimos {{ filtros.periodo }} días · Bajío + Sinaloa</span>
              </div>
              <div class="ps-chart-legend">
                <span class="ps-leg-chip" style="--c:#1A5C38">Precio Sistema</span>
                <span class="ps-leg-chip" style="--c:#2563EB">Chicago</span>
                <span class="ps-leg-chip ps-leg-dash" style="--c:#D97706">Precio Garantía</span>
              </div>
            </div>
            <div class="ps-chart-wrap">
              <canvas ref="chartCanvas" height="160"></canvas>
            </div>
          </div>

          <!-- Tabla desglose cadena -->
          <div class="ps-card">
            <div class="ps-card-header">
              <div class="ps-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                Desglose por eslabón de la cadena
                <span class="ps-card-sub">— ponderado regional · PV 2026</span>
              </div>
              <button class="ps-btn-export" @click="exportarCSV">⬇ Exportar</button>
            </div>
            <div class="ps-table-wrap">
              <table class="ps-table">
                <thead>
                  <tr>
                    <th>COMPONENTE</th>
                    <th>DESCRIPCIÓN</th>
                    <th class="tar">VALOR (MXN/TON)</th>
                    <th class="tac">% DEL PS</th>
                    <th>DISTRIBUCIÓN</th>
                    <th>FUENTE PRINCIPAL</th>
                    <th class="tac">CONFIANZA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in componentes" :key="c.componente">
                    <td><span class="ps-comp-badge" :class="`comp-${c.componente.toLowerCase()}`">{{ c.componente }}</span></td>
                    <td class="ps-tdesc">{{ c.descripcion }}</td>
                    <td class="tar ps-tvalor" :class="`val-${c.componente.toLowerCase()}`"><strong>{{ fmt(c.valor) }}</strong></td>
                    <td class="tac">{{ c.pct }}%</td>
                    <td>
                      <div class="ps-bar-wrap">
                        <div class="ps-bar" :class="`bar-${c.componente.toLowerCase()}`" :style="{ width: c.pct + '%' }"></div>
                      </div>
                    </td>
                    <td><span class="ps-fuente-badge">{{ c.fuente }}</span></td>
                    <td class="tac">{{ '★'.repeat(c.confianza) }}<span style="color:#e2e8f0">{{ '★'.repeat(5 - c.confianza) }}</span></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="ps-total-row">
                    <td colspan="2"><strong>PRECIO SISTEMA TOTAL</strong></td>
                    <td class="tar"><strong>{{ fmt(hoy?.ps) }}</strong></td>
                    <td class="tac">100%</td>
                    <td></td>
                    <td><span class="ps-fuente-badge">Publicado 7:00 am</span></td>
                    <td class="tac">★★★★★</td>
                  </tr>
                </tfoot>
              </table>
              <div class="ps-info-box">
                ℹ️
                <strong>Precio Origen Referencial:</strong> {{ fmt(pRef) }}/ton (PS − S − M − F) ·
                <span style="color:#DC2626"><strong>Brecha de Mercado: {{ fmtBrecha(brecha) }}/ton</strong></span>
                (el productor recibe {{ fmt(Math.abs(brecha)) }} menos de lo que le correspondería según la cadena) ·
                <strong>Precio de Garantía SADER:</strong> {{ fmt(refs?.garantia_sader) }}/ton (referencia externa)
              </div>
            </div>
          </div>

          <!-- Mapa de calor -->
          <div class="ps-card">
            <div class="ps-card-header">
              <div class="ps-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Mapa de calor — Brecha de Mercado por estado
                <span class="ps-card-sub">— Precio Origen Referencial vs. PO real</span>
              </div>
            </div>
            <div class="ps-heatmap">
              <div
                v-for="b in brechas" :key="b.estado"
                class="ps-heat-row"
                :class="`heat-${b.nivel_criticidad.toLowerCase()}`">
                <span class="ps-heat-estado">{{ b.estado }}</span>
                <div class="ps-heat-bar-wrap">
                  <div class="ps-heat-bar" :style="{ width: heatWidth(b.brecha) + '%' }"></div>
                </div>
                <span class="ps-heat-val">{{ fmtBrecha(b.brecha) }}</span>
                <span class="ps-heat-badge" :class="`nivel-${b.nivel_criticidad.toLowerCase()}`">{{ b.nivel_criticidad }}</span>
              </div>
              <div class="ps-heat-legend">
                <span class="ps-hleg-item"><span class="ps-hleg-dot" style="background:#EF4444"></span>Crítica (&gt;$1,000)</span>
                <span class="ps-hleg-item"><span class="ps-hleg-dot" style="background:#F59E0B"></span>Alta ($500–$1,000)</span>
                <span class="ps-hleg-item"><span class="ps-hleg-dot" style="background:#4A9B6A"></span>Media/Baja (&lt;$500)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div class="ps-col-right">

          <!-- 7A: Referencias externas -->
          <div class="ps-card">
            <div class="ps-card-title" style="padding: 1rem 1rem 0.75rem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Referencias de mercado
            </div>
            <div class="ps-refs">
              <div class="ps-ref-row">
                <div class="ps-ref-key">
                  <span class="ps-ref-dot" style="background:#2563EB"></span>Precio Chicago
                </div>
                <div class="ps-ref-vals">
                  <span class="ps-ref-main">${{ refs?.chicago_usd_bushel }} USD/bushel</span>
                  <span class="ps-ref-sub">≈ {{ fmt(refs?.chicago_mxn) }} MXN/ton</span>
                </div>
              </div>
              <div class="ps-ref-row">
                <div class="ps-ref-key">
                  <span class="ps-ref-dot" style="background:#6B7280"></span>Tipo de cambio Banxico
                </div>
                <div class="ps-ref-vals">
                  <span class="ps-ref-main">${{ refs?.tc_banxico }} MXN/USD</span>
                  <span class="ps-ref-sub">Actualización diaria</span>
                </div>
              </div>
              <div class="ps-ref-row">
                <div class="ps-ref-key">
                  <span class="ps-ref-dot" style="background:#D97706"></span>Precio Garantía SADER
                </div>
                <div class="ps-ref-vals">
                  <span class="ps-ref-main">{{ fmt(refs?.garantia_sader) }}</span>
                  <span class="ps-ref-sub">MXN/ton · referencia oficial</span>
                </div>
              </div>
              <div class="ps-ref-row ps-ref-highlight">
                <div class="ps-ref-key">
                  <span class="ps-ref-dot" style="background:#1A5C38"></span>P. Origen Referencial
                </div>
                <div class="ps-ref-vals">
                  <span class="ps-ref-main" style="color:#1A5C38;font-size:1.1rem">{{ fmt(pRef) }}</span>
                  <span class="ps-ref-sub">PS − S − M − F · valor justo productor</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 7B: Parámetros del modelo -->
          <div class="ps-card">
            <div class="ps-card-header" style="padding: 1rem 1rem 0.5rem">
              <div class="ps-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Parámetros del modelo
              </div>
            </div>
            <div class="ps-params">
              <div v-for="p in parametrosList" :key="p.key" class="ps-param-row">
                <div class="ps-param-info">
                  <span class="ps-param-label">{{ p.label }}</span>
                  <span class="ps-param-hint">{{ p.hint }}</span>
                </div>
                <div class="ps-param-val-wrap">
                  <span v-if="!p.editando" class="ps-param-val">{{ params?.[p.key] }}{{ p.unit }}</span>
                  <div v-else class="ps-param-edit">
                    <input v-model="p.tmpVal" class="ps-param-input" :type="p.type || 'number'" />
                    <button class="ps-pbtn-save" @click="guardarParametro(p)">✓</button>
                    <button class="ps-pbtn-cancel" @click="p.editando = false">✕</button>
                  </div>
                  <button v-if="authStore.isAdmin && !p.editando" class="ps-pbtn-edit" @click="editarParametro(p)">✏</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 7C: Discrepancias -->
          <div class="ps-card" ref="discrepanciasRef">
            <div class="ps-card-header" style="padding: 1rem 1rem 0.5rem">
              <div class="ps-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Discrepancias pendientes
              </div>
              <span class="ps-disc-count">{{ discrepancias.length }}</span>
            </div>
            <div v-if="discrepancias.length === 0" class="ps-disc-empty">
              ✓ Sin discrepancias pendientes. Todos los datos están validados.
            </div>
            <div v-else class="ps-disc-list">
              <div
                v-for="d in discrepancias" :key="d.id"
                class="ps-disc-item"
                :class="`disc-${d.prioridad.toLowerCase()}`">
                <div class="ps-disc-header">
                  <span class="ps-disc-badge" :class="`badge-${d.prioridad.toLowerCase()}`">{{ d.prioridad }}</span>
                  <span class="ps-disc-tipo">{{ discTipoLabel(d.tipo) }}</span>
                </div>
                <p class="ps-disc-desc">{{ d.descripcion }}</p>
                <button class="ps-disc-action" @click="resolverDiscrepancia(d)">{{ d.accion }}</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ═══ OTROS TABS (placeholder) ════════════════════════ -->
    <div v-else class="ps-tab-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      <p>Módulo <strong>{{ tabActivo }}</strong> en desarrollo</p>
    </div>

    <!-- Skeleton loader global -->
    <div v-if="cargando" class="ps-skeleton-overlay">
      <div class="ps-skeleton-spinner"></div>
    </div>

    <!-- Modal edición parámetro -->
    <Transition name="modal-fade">
      <div v-if="modalConfirm.show" class="ps-modal-backdrop" @click.self="modalConfirm.show = false">
        <div class="ps-modal">
          <h3>Confirmar cambio de parámetro</h3>
          <p>Cambiar <strong>{{ modalConfirm.label }}</strong> de <code>{{ modalConfirm.anterior }}</code> a <code>{{ modalConfirm.nuevo }}</code></p>
          <p class="ps-modal-warn">Este cambio aplica desde el siguiente ciclo nocturno. El histórico no se recalcula.</p>
          <div class="ps-modal-actions">
            <button class="ps-btn-apply" @click="confirmarParametro">Confirmar</button>
            <button class="ps-btn-clear" @click="modalConfirm.show = false">Cancelar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'

Chart.register(...registerables)

const authStore = useAuthStore()

// ── Estado ─────────────────────────────────────────────
const cargando    = ref(false)
const tabActivo   = ref('precios')
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const discrepanciasRef = ref<HTMLElement | null>(null)
let chartInstance: Chart | null = null

const tabs = [
  { key: 'vision',          label: 'Visión general' },
  { key: 'produccion',      label: 'Producción' },
  { key: 'infraestructura', label: 'Infraestructura' },
  { key: 'precios',         label: '$ Precios' },
  { key: 'alertas',         label: 'Alertas' },
  { key: 'operacion',       label: 'Operación' },
]

const filtros = reactive({
  region:    'bajio_sinaloa',
  estado:    'todos',
  municipio: 'todos',
  variedad:  'todos',
  periodo:   '30',
})

const estados    = ['Guanajuato', 'Jalisco', 'Michoacán', 'Sinaloa', 'Querétaro', 'Colima']
const municipios: Record<string, string[]> = {
  Guanajuato: ['Celaya', 'Salvatierra', 'León', 'Irapuato'],
  Jalisco:    ['La Piedad', 'Lagos de Moreno', 'Degollado'],
  Michoacán:  ['Apatzingán', 'Zamora', 'Uruapan'],
  Sinaloa:    ['Los Mochis', 'Culiacán', 'Guasave'],
  Querétaro:  ['Querétaro', 'San Juan del Río'],
  Colima:     ['Colima', 'Manzanillo'],
}
const municipiosFiltrados = computed(() =>
  filtros.estado !== 'todos' ? (municipios[filtros.estado] || []) : []
)

// ── Datos ──────────────────────────────────────────────
const hoy           = ref<any>(null)
const tendencia     = ref<any[]>([])
const componentes   = ref<any[]>([])
const brechas       = ref<any[]>([])
const refs          = ref<any>(null)
const params        = ref<any>(null)
const discrepancias = ref<any[]>([])
const txns          = ref<any>(null)

// ── Calculados ─────────────────────────────────────────
const pRef = computed(() => {
  if (!hoy.value) return 0
  return Math.round((hoy.value.ps - hoy.value.s - hoy.value.m - hoy.value.f) * 100) / 100
})
const brecha = computed(() => {
  if (!hoy.value) return 0
  return Math.round((pRef.value - hoy.value.po) * 100) / 100
})
const utilidadEstimada = computed(() => {
  if (!hoy.value || !refs.value) return 0
  return Math.round((hoy.value.po - refs.value.costo_fira) * 100) / 100
})
const discrepanciasAlta = computed(() =>
  discrepancias.value.filter((d: any) => d.prioridad === 'ALTA').length
)

// ── Parámetros editables ───────────────────────────────
const parametrosList = reactive([
  { key: 'margen_pct',      label: '% Margen intermediación', hint: 'Default: 10%. Rango: 0–30%', unit: '%', editando: false, tmpVal: '', type: 'number' },
  { key: 'ventana_dias',    label: 'Ventana promedio PO (días)', hint: 'Default: 7. Rango: 1–30',    unit: ' días', editando: false, tmpVal: '', type: 'number' },
  { key: 'min_txns',        label: 'Mín. transacciones por municipio', hint: 'Default: 10. Si &lt; min → promedio estatal', unit: '', editando: false, tmpVal: '', type: 'number' },
  { key: 'harineras_n',     label: 'Harineras en cálculo de flete', hint: 'Default: 3. Las N más cercanas por GIS', unit: '', editando: false, tmpVal: '', type: 'number' },
  { key: 'servicios_default', label: 'Servicios bodega (S) default', hint: 'Promedio tarifario regional MXN/ton', unit: ' $/ton', editando: false, tmpVal: '', type: 'number' },
  { key: 'flete_default',   label: 'Flete GIS (F) default', hint: 'Promedio flete regional MXN/ton', unit: ' $/ton', editando: false, tmpVal: '', type: 'number' },
])

const modalConfirm = reactive({
  show: false, label: '', anterior: '', nuevo: '', paramRef: null as any,
})

// ── Helpers de formato ─────────────────────────────────
function fmt(n: number | undefined | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtBrecha(n: number | undefined | null) {
  if (n == null) return '—'
  const sign = n < 0 ? '-' : '+'
  return sign + new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n))
}
function heatWidth(brecha: number) {
  const maxBrecha = Math.max(...brechas.value.map((b: any) => Math.abs(b.brecha)), 1)
  return Math.round((Math.abs(brecha) / maxBrecha) * 100)
}
function discTipoLabel(tipo: string) {
  const map: Record<string, string> = {
    precio_diferencia: 'Precio bodeguero ≠ productor',
    precio_fuera_rango: 'Precio fuera de rango',
    sin_tecnico_activo: 'Zona sin técnico activo',
    datos_insuficientes: 'Municipio sin datos suficientes',
    tarifario_desactualizado: 'Tarifario desactualizado',
    ventanilla_pendiente: 'Ventanilla pendiente de aprobación',
    variedad_sin_homologar: 'Variedad sin homologar',
  }
  return map[tipo] || tipo
}

// ── Carga de datos ─────────────────────────────────────
async function cargarTodo() {
  cargando.value = true
  try {
    const q: Record<string, string> = {}
    if (filtros.estado    !== 'todos') q.estado    = filtros.estado
    if (filtros.municipio !== 'todos') q.municipio = filtros.municipio
    if (filtros.variedad  !== 'todos') q.variedad  = filtros.variedad
    q.region = filtros.region
    q.dias   = filtros.periodo

    const [hoyData, tendData, compData, brechasData, refsData, paramsData, discData, txnsData] = await Promise.all([
      api.preciosSistema.hoy(q),
      api.preciosSistema.tendencia(q),
      api.preciosSistema.componentesDetalle(q),
      api.preciosSistema.brechasEstados(q),
      api.preciosSistema.referenciasExternas(),
      api.preciosSistema.parametros(),
      api.preciosSistema.discrepancias(),
      api.preciosSistema.transaccionesResumen(q),
    ])

    hoy.value         = hoyData
    tendencia.value   = tendData.tendencia || []
    componentes.value = compData.componentes || []
    brechas.value     = brechasData.brechas || []
    refs.value        = refsData
    params.value      = paramsData.parametros
    discrepancias.value = discData.discrepancias || []
    txns.value        = txnsData

    await nextTick()
    renderChart()
  } catch (err) {
    console.error('Error cargando módulo precios:', err)
  } finally {
    cargando.value = false
  }
}

function aplicarFiltros() { cargarTodo() }
function limpiarFiltros() {
  Object.assign(filtros, { region: 'bajio_sinaloa', estado: 'todos', municipio: 'todos', variedad: 'todos', periodo: '30' })
  cargarTodo()
}

// ── Chart.js ───────────────────────────────────────────
function renderChart() {
  if (!chartCanvas.value || tendencia.value.length === 0) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const labels = tendencia.value.map((t: any) => {
    const d = new Date(t.fecha)
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  })

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Precio Sistema',
          data: tendencia.value.map((t: any) => t.ps),
          borderColor: '#1A5C38',
          backgroundColor: 'rgba(26,92,56,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Chicago (MXN/ton)',
          data: tendencia.value.map((t: any) => t.chicago),
          borderColor: '#2563EB',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [4, 3],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Precio Garantía',
          data: tendencia.value.map((t: any) => t.garantia),
          borderColor: '#D97706',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [8, 4],
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#d1d5db',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString('es-MX')}/ton`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#9ca3af', maxTicksLimit: 8 },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: {
            font: { size: 11 }, color: '#9ca3af',
            callback: (v) => '$' + Number(v).toLocaleString('es-MX'),
          },
        },
      },
    },
  })
}

// ── Acciones ───────────────────────────────────────────
function scrollToDiscrepancias() {
  discrepanciasRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function editarParametro(p: any) {
  p.tmpVal  = params.value?.[p.key] ?? ''
  p.editando = true
}

function guardarParametro(p: any) {
  modalConfirm.label    = p.label
  modalConfirm.anterior = String(params.value?.[p.key] ?? '')
  modalConfirm.nuevo    = String(p.tmpVal)
  modalConfirm.paramRef = p
  modalConfirm.show     = true
}

async function confirmarParametro() {
  const p = modalConfirm.paramRef
  if (!p) return
  try {
    await api.preciosSistema.actualizarParametros({ [p.key]: p.tmpVal })
    p.editando       = false
    modalConfirm.show = false
    await cargarTodo()
  } catch (err) {
    console.error('Error actualizando parámetro:', err)
  }
}

async function resolverDiscrepancia(d: any) {
  try {
    await api.preciosSistema.resolverDiscrepancia(d.id, { resolucion: 'resuelto_manual', notas: '' })
    discrepancias.value = discrepancias.value.filter((x: any) => x.id !== d.id)
  } catch (err) {
    console.error('Error resolviendo discrepancia:', err)
  }
}

function exportarCSV() {
  const rows = [
    ['Componente', 'Descripción', 'Valor MXN/ton', '% del PS', 'Fuente'],
    ...componentes.value.map((c: any) => [c.componente, c.descripcion, c.valor, c.pct + '%', c.fuente]),
    ['TOTAL', 'Precio Sistema', hoy.value?.ps, '100%', 'Publicado 7:00 am'],
  ]
  const csv   = rows.map(r => r.join(',')).join('\n')
  const blob  = new Blob([csv], { type: 'text/csv' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = `desglose_precio_sistema_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(cargarTodo)
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────── */
.ps-page { min-height: 100vh; background: #F3F4F6; padding: 0; }
.ps-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem 0; }
.ps-title { font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0; }
.ps-subtitle { font-size: 0.8rem; color: #6B7280; margin: 0.2rem 0 0; }
.ps-refresh-btn { background: none; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0.4rem; cursor: pointer; color: #6B7280; transition: all 0.2s; }
.ps-refresh-btn:hover { background: #f9fafb; color: #1A5C38; }

/* ─── Tabs ───────────────────────────────────────────── */
.ps-tabs { display: flex; gap: 0; padding: 0 1.5rem; border-bottom: 1.5px solid #E5E7EB; margin-top: 0.75rem; }
.ps-tab { background: none; border: none; border-bottom: 2.5px solid transparent; padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 500; color: #6B7280; cursor: pointer; margin-bottom: -1.5px; transition: all 0.15s; }
.ps-tab:hover { color: #374151; }
.ps-tab.active { color: #1A5C38; border-bottom-color: #1A5C38; font-weight: 700; }

/* ─── Filtros ────────────────────────────────────────── */
.ps-filters { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #fff; border-bottom: 1px solid #E5E7EB; flex-wrap: wrap; position: sticky; top: 0; z-index: 10; }
.ps-filters-label { font-size: 0.78rem; font-weight: 600; color: #6B7280; }
.ps-select { border: 1px solid #E5E7EB; border-radius: 6px; padding: 0.35rem 0.6rem; font-size: 0.8rem; background: #fff; color: #374151; cursor: pointer; }
.ps-select:focus { outline: 2px solid #1A5C38; }
.ps-btn-apply { background: #1A5C38; color: #fff; border: none; border-radius: 6px; padding: 0.38rem 0.9rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.ps-btn-apply:hover { background: #2E7D52; }
.ps-btn-clear { background: none; border: 1px solid #E5E7EB; border-radius: 6px; padding: 0.38rem 0.75rem; font-size: 0.8rem; color: #6B7280; cursor: pointer; }
.ps-btn-clear:hover { background: #f9fafb; }
.ps-live-badge { display: flex; align-items: center; gap: 0.35rem; margin-left: auto; font-size: 0.75rem; font-weight: 700; color: #1A5C38; }
.ps-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #1A5C38; animation: pulse-dot 1.5s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

/* ─── Barra fórmula ──────────────────────────────────── */
.ps-formula-bar { display: flex; align-items: stretch; gap: 0; background: #1A5C38; border-radius: 12px; margin: 1rem 1.5rem; padding: 0; overflow: hidden; }
.ps-formula-item { flex: 1; padding: 1rem 1.25rem; }
.ps-formula-total { border-right: 1px solid rgba(255,255,255,0.15); }
.ps-formula-eq, .ps-formula-op { display: flex; align-items: center; padding: 0 0.6rem; color: rgba(255,255,255,0.5); font-size: 1.1rem; font-weight: 300; white-space: pre; }
.ps-f-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.6); margin-bottom: 0.35rem; }
.ps-f-value { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1; }
.ps-f-accent { color: #7EC89A !important; font-size: 1.6rem !important; }
.ps-f-sub { font-size: 0.68rem; color: rgba(255,255,255,0.55); margin-top: 0.25rem; }

/* ─── KPI Grid ───────────────────────────────────────── */
.ps-kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; padding: 0 1.5rem; margin-bottom: 1rem; }
@media (max-width: 1280px) { .ps-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .ps-kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.ps-kpi-card {
  background: #fff; border: 1px solid #E5E7EB; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  border-left: 3px solid var(--bar); padding: 0.9rem;
  display: flex; align-items: flex-start; gap: 0.75rem;
}
.ps-kpi-card-link { cursor: pointer; }
.ps-kpi-card-link:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.ps-kpi-icon { flex-shrink: 0; margin-top: 0.15rem; }
.ps-kpi-body { min-width: 0; }
.ps-kpi-value { font-size: 1.3rem; font-weight: 800; line-height: 1.1; }
.ps-kpi-label { font-size: 0.75rem; font-weight: 700; color: #374151; margin: 0.15rem 0 0.1rem; }
.ps-kpi-sub { font-size: 0.7rem; color: #9CA3AF; margin-bottom: 0.3rem; }
.ps-delta { font-size: 0.7rem; font-weight: 600; }
.delta-up   { color: #1A5C38; }
.delta-down { color: #DC2626; }
.delta-warn { color: #D97706; }
.delta-neutral { color: #6B7280; }

/* ─── Dos columnas ───────────────────────────────────── */
.ps-two-col { display: grid; grid-template-columns: 1fr 380px; gap: 1rem; padding: 0 1.5rem 2rem; }
@media (max-width: 1200px) { .ps-two-col { grid-template-columns: 1fr; } }
.ps-col-left, .ps-col-right { display: flex; flex-direction: column; gap: 1rem; }

/* ─── Card genérica ──────────────────────────────────── */
.ps-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; }
.ps-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1rem 0.5rem; }
.ps-card-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 700; color: #111827; }
.ps-card-sub { font-size: 0.75rem; font-weight: 400; color: #6B7280; }

/* ─── Chart ──────────────────────────────────────────── */
.ps-chart-legend { display: flex; gap: 0.5rem; flex-shrink: 0; }
.ps-leg-chip { font-size: 0.7rem; font-weight: 600; color: var(--c); display: flex; align-items: center; gap: 0.3rem; }
.ps-leg-chip::before { content: ''; display: inline-block; width: 16px; height: 2px; background: var(--c); border-radius: 2px; }
.ps-leg-dash::before { background: repeating-linear-gradient(to right, var(--c) 0, var(--c) 4px, transparent 4px, transparent 7px); }
.ps-chart-wrap { padding: 0.5rem 1rem 1rem; height: 180px; }

/* ─── Tabla desglose ─────────────────────────────────── */
.ps-table-wrap { overflow-x: auto; }
.ps-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.ps-table thead th { padding: 0.6rem 0.85rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; border-bottom: 1.5px solid #F3F4F6; white-space: nowrap; }
.ps-table tbody tr { border-bottom: 1px solid #F9FAFB; }
.ps-table tbody tr:hover { background: #F9FAFB; }
.ps-table td { padding: 0.7rem 0.85rem; vertical-align: middle; }
.tar { text-align: right !important; }
.tac { text-align: center !important; }
.ps-tdesc { font-size: 0.77rem; color: #6B7280; }
.ps-tvalor { font-size: 0.95rem; }
.val-po { color: #1A5C38 !important; }
.val-s  { color: #D97706 !important; }
.val-m  { color: #DC2626 !important; }
.val-f  { color: #2563EB !important; }

.ps-comp-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; }
.comp-po { background: #E8F5EE; color: #1A5C38; }
.comp-s  { background: #FEF3C7; color: #D97706; }
.comp-m  { background: #FEF2F2; color: #DC2626; }
.comp-f  { background: #EFF6FF; color: #2563EB; }

.ps-bar-wrap { width: 80px; height: 6px; background: #F3F4F6; border-radius: 3px; overflow: hidden; }
.ps-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.bar-po { background: #1A5C38; }
.bar-s  { background: #D97706; }
.bar-m  { background: #DC2626; }
.bar-f  { background: #2563EB; }

.ps-fuente-badge { display: inline-block; background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.7rem; color: #374151; white-space: nowrap; }

.ps-total-row { background: #E8F5EE !important; }
.ps-total-row td { font-size: 0.88rem; color: #1A5C38; border-top: 1.5px solid #c6e6d4; }

.ps-info-box { margin: 0.75rem 1rem; padding: 0.65rem 1rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; font-size: 0.75rem; color: #374151; line-height: 1.6; }

.ps-btn-export { background: none; border: 1px solid #E5E7EB; border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.75rem; color: #6B7280; cursor: pointer; }
.ps-btn-export:hover { background: #F9FAFB; }

/* ─── Mapa de calor ──────────────────────────────────── */
.ps-heatmap { padding: 0.75rem 1rem 0.5rem; }
.ps-heat-row { display: grid; grid-template-columns: 110px 1fr 70px 80px; align-items: center; gap: 0.75rem; padding: 0.55rem 0.5rem; border-radius: 8px; margin-bottom: 0.35rem; }
.heat-crítica { background: #FEF2F2; }
.heat-alta    { background: #FFFBEB; }
.heat-media   { background: #E8F5EE; }
.heat-baja    { background: #F9FAFB; }
.ps-heat-estado { font-size: 0.8rem; font-weight: 600; color: #374151; }
.ps-heat-bar-wrap { height: 8px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
.ps-heat-bar { height: 100%; border-radius: 4px; }
.heat-crítica .ps-heat-bar { background: #EF4444; }
.heat-alta    .ps-heat-bar { background: #F59E0B; }
.heat-media   .ps-heat-bar { background: #4A9B6A; }
.heat-baja    .ps-heat-bar { background: #9CA3AF; }
.ps-heat-val { font-size: 0.82rem; font-weight: 700; color: #111827; text-align: right; }
.heat-crítica .ps-heat-val { color: #DC2626; }
.heat-alta    .ps-heat-val { color: #D97706; }
.ps-heat-badge { font-size: 0.68rem; font-weight: 700; padding: 0.18rem 0.45rem; border-radius: 4px; text-align: center; }
.nivel-crítica { background: #FEE2E2; color: #DC2626; }
.nivel-alta    { background: #FEF3C7; color: #D97706; }
.nivel-media   { background: #D1FAE5; color: #065F46; }
.nivel-baja    { background: #F3F4F6; color: #6B7280; }
.ps-heat-legend { display: flex; gap: 1rem; padding: 0.5rem 0; margin-top: 0.35rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
.ps-hleg-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #6B7280; }
.ps-hleg-dot { width: 8px; height: 8px; border-radius: 50%; }

/* ─── Panel referencias ──────────────────────────────── */
.ps-refs { padding: 0 1rem 1rem; }
.ps-ref-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #F3F4F6; gap: 0.75rem; }
.ps-ref-row:last-child { border-bottom: none; }
.ps-ref-highlight { background: #F0FDF4; border-radius: 8px; padding: 0.6rem 0.5rem; margin: 0.25rem -0.5rem; }
.ps-ref-key { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: #374151; font-weight: 500; flex-shrink: 0; }
.ps-ref-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ps-ref-vals { text-align: right; }
.ps-ref-main { display: block; font-size: 0.9rem; font-weight: 700; color: #111827; }
.ps-ref-sub  { display: block; font-size: 0.7rem; color: #9CA3AF; }

/* ─── Parámetros ─────────────────────────────────────── */
.ps-params { padding: 0 1rem 0.75rem; }
.ps-param-row { display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0; border-bottom: 1px solid #F9FAFB; gap: 0.75rem; }
.ps-param-row:last-child { border-bottom: none; }
.ps-param-info { flex: 1; min-width: 0; }
.ps-param-label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; }
.ps-param-hint  { display: block; font-size: 0.68rem; color: #9CA3AF; margin-top: 0.1rem; }
.ps-param-val-wrap { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }
.ps-param-val { font-size: 0.88rem; font-weight: 700; color: #1A5C38; }
.ps-param-edit { display: flex; align-items: center; gap: 0.3rem; }
.ps-param-input { width: 70px; border: 1.5px solid #1A5C38; border-radius: 6px; padding: 0.25rem 0.4rem; font-size: 0.82rem; }
.ps-pbtn-edit   { background: none; border: 1px solid #E5E7EB; border-radius: 5px; padding: 0.2rem 0.4rem; font-size: 0.75rem; cursor: pointer; color: #6B7280; }
.ps-pbtn-save   { background: #1A5C38; color: #fff; border: none; border-radius: 5px; padding: 0.2rem 0.45rem; font-size: 0.75rem; cursor: pointer; }
.ps-pbtn-cancel { background: none; border: 1px solid #E5E7EB; border-radius: 5px; padding: 0.2rem 0.4rem; font-size: 0.75rem; cursor: pointer; color: #6B7280; }

/* ─── Discrepancias ──────────────────────────────────── */
.ps-disc-count { background: #FEF2F2; color: #DC2626; font-size: 0.72rem; font-weight: 700; border-radius: 99px; padding: 0.15rem 0.5rem; }
.ps-disc-empty { padding: 1rem; font-size: 0.82rem; color: #1A5C38; background: #F0FDF4; margin: 0.5rem; border-radius: 8px; text-align: center; }
.ps-disc-list { max-height: 340px; overflow-y: auto; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.ps-disc-item { border-radius: 8px; padding: 0.7rem 0.85rem; border: 1px solid; }
.disc-alta  { background: #FEF2F2; border-color: #FECACA; }
.disc-media { background: #FFFBEB; border-color: #FDE68A; }
.disc-baja  { background: #F9FAFB; border-color: #E5E7EB; }
.ps-disc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
.ps-disc-badge { font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; }
.badge-alta  { background: #FEE2E2; color: #DC2626; }
.badge-media { background: #FEF3C7; color: #D97706; }
.badge-baja  { background: #F3F4F6; color: #6B7280; }
.ps-disc-tipo { font-size: 0.77rem; font-weight: 600; color: #374151; }
.ps-disc-desc { font-size: 0.75rem; color: #6B7280; margin: 0 0 0.4rem; line-height: 1.45; }
.ps-disc-action { background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; padding: 0.25rem 0.65rem; font-size: 0.73rem; font-weight: 600; color: #374151; cursor: pointer; }
.ps-disc-action:hover { background: #F3F4F6; }

/* ─── Tab placeholder ────────────────────────────────── */
.ps-tab-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 4rem; color: #9CA3AF; font-size: 0.9rem; }

/* ─── Skeleton overlay ───────────────────────────────── */
.ps-skeleton-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; }
.ps-skeleton-spinner { width: 36px; height: 36px; border: 3px solid #E5E7EB; border-top-color: #1A5C38; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Modal ──────────────────────────────────────────── */
.ps-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; }
.ps-modal { background: #fff; border-radius: 12px; padding: 1.5rem; max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.ps-modal h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #111827; }
.ps-modal p  { font-size: 0.85rem; color: #374151; margin: 0.3rem 0; }
.ps-modal-warn { color: #D97706; font-size: 0.78rem !important; }
.ps-modal code { background: #F3F4F6; border-radius: 4px; padding: 0.1rem 0.3rem; font-family: monospace; }
.ps-modal-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* ─── spin util ──────────────────────────────────────── */
.spin { animation: spin 0.8s linear infinite; }
</style>
