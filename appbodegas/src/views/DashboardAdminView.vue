<template>
  <AppShell>
    <div class="dash" :style="{ '--sticky-h': stickyH + 'px' }">

      <!-- ─── STICKY: HERO + TABS ─── -->
      <div class="dash-sticky" ref="stickyRef">
        <div class="dash-hero">
          <div class="dash-hero-inner">
            <div class="dash-hero-text">
              <h1 class="dash-title">Dashboard Administrativo</h1>
              <p class="dash-subtitle">Vision global de la produccion agricola en tiempo real</p>
            </div>
            <div class="header-right">
              <button class="btn-refresh" :class="{ spinning: cargando }" @click="recargarTodo" title="Actualizar datos">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- ─── LOADER INICIAL ─── -->
        <div v-if="cargandoInicial" class="loader-row">
          <div class="loader"></div><span>Cargando datos del sistema...</span>
        </div>

        <template v-if="!cargandoInicial">
          <!-- ─── TABS: NAV PLANO en desktop ─── -->
          <nav class="tabs-nav-flat">
          <button
            v-for="t in tabs"
            :key="t.key"
            class="tnf-btn"
            :class="{ active: t.key === tabActiva }"
            @click="tabActiva = t.key"
          >
            <span class="tnf-icon" v-html="t.icon"></span>
            <span class="tnf-lbl">{{ t.label }}</span>
          </button>
        </nav>

        <!-- ─── TABS: CARRUSEL solo en móvil ─── -->
        <div class="tabs-carousel" :style="{ opacity: carouselReady ? 1 : 0 }">
          <button class="nav-arr" @click="selectPrev" aria-label="Anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="tabs-viewport" ref="tabsViewportRef">
            <div
              class="tabs-track"
              :style="{ transform: `translateX(${trackX}px)`, transition: animating ? 'transform 0.22s cubic-bezier(.22,.68,0,1)' : 'none' }"
              @transitionend="onTransitionEnd"
            >
              <button
                v-for="(t, i) in extTabs"
                :key="i"
                class="tab-btn"
                :class="{ active: t.key === tabActiva }"
                @click="setTabByExt(t.key)"
              >
                <span class="tab-icon" v-html="t.icon"></span>
                <span class="tab-lbl">{{ t.label }}</span>
              </button>
            </div>
          </div>
          <button class="nav-arr" @click="selectNext" aria-label="Siguiente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        </template>
      </div><!-- /dash-sticky -->

      <!-- ─── CONTENIDO: PANELES ─── -->
      <template v-if="!cargandoInicial">

        <!-- ════════════ PANEL 1: VISION GENERAL ════════════ -->
        <div v-show="tabActiva === 'vision'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge live"><span class="live-dot"></span>En vivo</span>
              <h2 class="p-title">Vision General</h2>
              <p class="p-desc">Resumen en tiempo real del ecosistema agricola SIMAC</p>
            </div>
          </div>

          <!-- KPIs -->
          <div class="kpi-row" v-if="resumen">
            <div v-for="k in kpisVision" :key="k.key" class="kpi glass-card">
              <div class="kpi-ico" :style="{ background: k.bg, color: k.color }" v-html="k.icon"></div>
              <div class="kpi-body">
                <span class="kpi-val">{{ k.val }}</span>
                <span class="kpi-lbl">{{ k.label }}</span>
              </div>
            </div>
          </div>

          <!-- Mapa + Insights -->
          <section class="map-card glass-card">
            <div class="map-hdr">
              <div class="map-hdr-left">
                <svg class="map-hdr-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <h2 class="sec-heading">Mapa del sistema</h2>
              </div>
              <nav class="maptabs">
                <button v-for="t in mapTabs" :key="t" class="mtab" :class="{ active: mapTab === t }" @click="setMapTab(t)">{{ t }}</button>
              </nav>
            </div>
            <div class="map-body">
              <div ref="mapContainer" class="map-cont"></div>
              <aside class="side-panel">
                <h3 class="side-heading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Insights prioritarios
                </h3>
                <ul class="ins-list" v-if="insights.length">
                  <li v-for="(ins, i) in insights" :key="i" class="ins-item">
                    <span class="ins-dot" :class="ins.type"></span>
                    <span>{{ ins.text }}</span>
                  </li>
                </ul>
                <p v-else class="ins-empty">Sin datos suficientes</p>
                <div class="map-leyenda">
                  <div class="ley-row"><span class="ley-dot" style="background:#15803d"></span>UPs productivas</div>
                  <div class="ley-row"><span class="ley-dot" style="background:#7c3aed"></span>Bodegas</div>
                  <div class="ley-row"><span class="ley-dot" style="background:#ef4444"></span>Alertas</div>
                </div>
              </aside>
            </div>
          </section>

          <!-- Tabla resumen por estado -->
          <section class="glass-card tbl-card">
            <div class="tbl-hdr">
              <h2 class="sec-heading mb0">Resumen por estado</h2>
              <span class="tbl-count">{{ filteredEstadoRows.length }} estados</span>
            </div>
            <div class="tbl-wrap">
              <table class="dt">
                <thead><tr><th>Estado</th><th>UPs</th><th>Productores</th><th>Superficie (ha)</th><th>Produccion est. (ton)</th></tr></thead>
                <tbody>
                  <tr v-for="(row, i) in filteredEstadoRows" :key="row.estado" :class="i%2===1?'tr-alt':''">
                    <td><span class="td-estado">{{ row.estado || '—' }}</span></td>
                    <td><span class="td-num">{{ row.ups }}</span></td>
                    <td><span class="td-num">{{ row.productores }}</span></td>
                    <td class="td-b">{{ fmtNum(row.superficie_ha) }}</td>
                    <td class="td-b">{{ fmtNum(row.produccion_ton) }}</td>
                  </tr>
                  <tr v-if="!filteredEstadoRows.length"><td colspan="5" class="td-empty">Sin datos disponibles</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- ════════════ PANEL 2: PRODUCCION ════════════ -->
        <div v-if="tabActiva === 'produccion'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge green">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>
                Produccion
              </span>
              <h2 class="p-title">Rendimiento Agricola</h2>
              <p class="p-desc">Superficie sembrada, UPs activas y ciclos de cultivo registrados</p>
            </div>
          </div>
          <div class="inline-filters">
            <svg class="filter-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <div class="filter-item">
              <label class="filter-lbl">Estado</label>
              <select class="filter-sel" v-model="filtros.estado">
                <option value="">Todos los estados</option>
                <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
            <div class="filter-item">
              <label class="filter-lbl">Ciclo</label>
              <select class="filter-sel" v-model="filtros.ciclo">
                <option value="">Todos</option>
                <option value="PV">PV — Primavera/Verano</option>
                <option value="OI">OI — Otono/Invierno</option>
              </select>
            </div>
            <div class="filter-spacer"></div>
            <span v-if="filtros.estado || filtros.ciclo" class="filter-badge">Filtros activos</span>
            <button v-if="filtros.estado || filtros.ciclo" class="btn-clear-f" @click="limpiarFiltros">&#10005; Limpiar</button>
          </div>
          <div v-if="!produccion" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-3">
              <div class="kpi glass-card kpi-green">
                <div class="kpi-ico" style="background:rgba(26,92,56,.08);color:#15803d"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(produccion.por_anio?.[0]?.area_ha ?? 0) }} ha</span><span class="kpi-lbl">Superficie sembrada (ano actual)</span></div>
              </div>
              <div class="kpi glass-card kpi-blue">
                <div class="kpi-ico" style="background:rgba(37,99,235,.08);color:#2563eb"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ produccion.por_anio?.[0]?.ups ?? 0 }}</span><span class="kpi-lbl">UPs con produccion registrada</span></div>
              </div>
              <div class="kpi glass-card kpi-amber">
                <div class="kpi-ico" style="background:rgba(217,119,6,.08);color:#d97706"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ produccion.ups_sin_ciclo ?? 0 }}</span><span class="kpi-lbl">UPs sin ciclo registrado</span></div>
              </div>
            </div>
            <div class="charts-2col">
              <div class="glass-card chart-card">
                <div class="chart-hdr">
                  <h3 class="card-hdg mb0">Produccion estimada por estado</h3>
                  <span class="chart-unit">toneladas</span>
                </div>
                <div class="cwrap"><Bar v-if="produccionBarData" :data="produccionBarData" :options="barOpts"/><div v-else class="cph"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg><span>Sin datos</span></div></div>
              </div>
              <div class="glass-card chart-card">
                <div class="chart-hdr">
                  <h3 class="card-hdg mb0">Distribucion de ciclos</h3>
                  <span class="chart-unit">ha sembradas</span>
                </div>
                <div class="cwrap cwrap-sm"><Doughnut v-if="cicloDonutData" :data="cicloDonutData" :options="donutOpts"/><div v-else class="cph"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><circle cx="12" cy="12" r="10"/></svg><span>Sin datos</span></div></div>
              </div>
            </div>
            <div class="tbl-2col">
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Produccion por estado</h3>
                  <span class="tbl-count">{{ filteredProduccionEstado.length }} estados</span>
                </div>
                <div class="tbl-wrap">
                  <table class="dt">
                    <thead><tr><th>Estado</th><th>UPs</th><th>Cultivos</th><th>Area (ha)</th><th>Ton</th></tr></thead>
                    <tbody>
                      <tr v-for="(row,i) in filteredProduccionEstado" :key="row.estado" :class="i%2===1?'tr-alt':''">
                        <td><span class="td-estado">{{ row.estado || '—' }}</span></td><td>{{ row.ups }}</td><td>{{ row.cultivos }}</td><td class="td-b">{{ fmtNum(row.area_ha) }}</td><td class="td-b">{{ fmtNum(row.produccion_ton) }}</td>
                      </tr>
                      <tr v-if="!filteredProduccionEstado.length"><td colspan="5" class="td-empty">Sin datos</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Por tipo de ciclo</h3>
                </div>
                <div class="tbl-wrap">
                  <table class="dt">
                    <thead><tr><th>Tipo</th><th>Ano</th><th>Ciclos</th><th>Cultivos</th><th>Area (ha)</th></tr></thead>
                    <tbody>
                      <tr v-for="(row,i) in filteredCiclos" :key="`${row.cycle_type}-${row.cycle_year}`" :class="i%2===1?'tr-alt':''">
                        <td><span class="pill" :class="row.cycle_type==='PV'?'pill-g':'pill-b'">{{ row.cycle_type }}</span></td>
                        <td>{{ row.cycle_year }}</td><td>{{ row.ciclos }}</td><td>{{ row.cultivos }}</td><td class="td-b">{{ fmtNum(row.area_ha) }}</td>
                      </tr>
                      <tr v-if="!filteredCiclos.length"><td colspan="5" class="td-empty">Sin datos</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </template>
        </div>

        <!-- ════════════ PANEL 3: INFRAESTRUCTURA ════════════ -->
        <div v-if="tabActiva === 'infraestructura'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge purple">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                Infraestructura
              </span>
              <h2 class="p-title">Red de Almacenamiento</h2>
              <p class="p-desc">Bodegas activas, capacidad total, stock actual y nivel de ocupacion</p>
            </div>
          </div>
          <div class="inline-filters">
            <svg class="filter-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <div class="filter-item">
              <label class="filter-lbl">Estado</label>
              <select class="filter-sel" v-model="filtros.estado">
                <option value="">Todos los estados</option>
                <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
            <div class="filter-spacer"></div>
            <span v-if="filtros.estado" class="filter-badge">Filtros activos</span>
            <button v-if="filtros.estado" class="btn-clear-f" @click="limpiarFiltros">&#10005; Limpiar</button>
          </div>
          <div v-if="!infraestructura" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-4">
              <div class="kpi glass-card kpi-purple">
                <div class="kpi-ico" style="background:rgba(124,58,237,.08);color:#7c3aed"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ infraestructura.bodegas_aprobadas }}</span><span class="kpi-lbl">Bodegas activas</span></div>
              </div>
              <div class="kpi glass-card kpi-blue">
                <div class="kpi-ico" style="background:rgba(37,99,235,.08);color:#2563eb"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V8l9-5 9 5v13"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(infraestructura.capacidad_total_ton) }}</span><span class="kpi-lbl">Capacidad total (ton)</span></div>
              </div>
              <div class="kpi glass-card kpi-teal">
                <div class="kpi-ico" style="background:rgba(14,148,148,.08);color:#0e9494"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(infraestructura.stock_actual_ton) }}</span><span class="kpi-lbl">Stock actual (ton)</span></div>
              </div>
              <div class="kpi glass-card" :class="infraestructura.ocupacion_pct >= 90 ? 'kpi-alert kpi-red' : 'kpi-amber'">
                <div class="kpi-ico" :style="infraestructura.ocupacion_pct>=90?'background:rgba(220,38,38,.08);color:#dc2626':'background:rgba(217,119,6,.08);color:#d97706'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ infraestructura.ocupacion_pct }}%</span><span class="kpi-lbl">Ocupacion bodegas</span></div>
              </div>
            </div>
            <section class="glass-card deficit-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Produccion estimada vs Capacidad de almacenamiento</h3>
                <span class="def-tag" :class="deficitTon>=0?'def-tag-ok':'def-tag-err'">{{ deficitTon>=0?'Superavit':'Deficit' }}</span>
              </div>
              <div class="def-body">
                <div class="def-row">
                  <span class="def-lbl">Produccion estimada</span>
                  <div class="def-track"><div class="def-bar def-prod" :style="{ width: deficitProduccionPct + '%' }"></div></div>
                  <span class="def-val">{{ fmtCompact(resumen?.produccion_estimada_ton ?? 0) }} ton</span>
                </div>
                <div class="def-row">
                  <span class="def-lbl">Capacidad disponible</span>
                  <div class="def-track"><div class="def-bar def-cap" :style="{ width: deficitCapacidadPct + '%' }"></div></div>
                  <span class="def-val">{{ fmtCompact(infraestructura.capacidad_total_ton) }} ton</span>
                </div>
                <div class="def-summary" :class="deficitTon >= 0 ? 'surplus' : 'deficit'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span v-if="deficitTon >= 0">Superavit: +{{ fmtCompact(deficitTon) }} ton de capacidad disponible</span>
                  <span v-else>Deficit: faltan {{ fmtCompact(Math.abs(deficitTon)) }} ton de capacidad</span>
                </div>
              </div>
            </section>
            <div class="tbl-2col">
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Bodegas por estado</h3>
                  <span class="tbl-count">{{ infraestructura.por_estado?.length ?? 0 }} estados</span>
                </div>
                <div class="tbl-wrap">
                  <table class="dt">
                    <thead><tr><th>Estado</th><th>Bodegas</th><th>Capacidad (ton)</th></tr></thead>
                    <tbody>
                      <tr v-for="(row,i) in infraestructura.por_estado" :key="row.estado" :class="i%2===1?'tr-alt':''"><td><span class="td-estado">{{ row.estado||'—' }}</span></td><td>{{ row.total_bodegas }}</td><td class="td-b">{{ fmtNum(row.capacidad_ton) }}</td></tr>
                      <tr v-if="!infraestructura.por_estado?.length"><td colspan="3" class="td-empty">Sin datos</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Top bodegas por capacidad</h3>
                </div>
                <div class="tbl-wrap">
                  <table class="dt">
                    <thead><tr><th>Bodega</th><th>Estado</th><th>Cap. (ton)</th><th>Ocupacion</th></tr></thead>
                    <tbody>
                      <tr v-for="(b,i) in infraestructura.top_bodegas" :key="b.nombre" :class="i%2===1?'tr-alt':''">
                        <td class="td-b">{{ b.nombre }}</td><td>{{ b.estado }}</td><td>{{ fmtNum(b.capacidad_toneladas) }}</td>
                        <td>
                          <div class="ocu-cell">
                            <div class="mbar-wrap"><div class="mbar-fill" :class="mbarClass(b)" :style="{ width: mbarPct(b)+'%' }"></div></div>
                            <span class="mbar-pct">{{ mbarPct(b) }}%</span>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!infraestructura.top_bodegas?.length"><td colspan="4" class="td-empty">Sin datos</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </template>
        </div>

        <!-- ════════════ PANEL 4: PRECIOS ════════════ -->
        <div v-if="tabActiva === 'precios'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge amber">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Precios
              </span>
              <h2 class="p-title">Mercado de Maiz</h2>
              <p class="p-desc">Precios actuales, tendencias y brechas de comercializacion MXN/ton</p>
            </div>
          </div>
          <div class="inline-filters">
            <svg class="filter-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <div class="filter-item">
              <label class="filter-lbl">Estado</label>
              <select class="filter-sel" v-model="filtros.estado">
                <option value="">Todos los estados</option>
                <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
            <div class="filter-spacer"></div>
            <span v-if="filtros.estado" class="filter-badge">Filtros activos</span>
            <button v-if="filtros.estado" class="btn-clear-f" @click="limpiarFiltros">&#10005; Limpiar</button>
          </div>
          <div v-if="!precios" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="precio-cards">
              <div class="pc pc-green">
                <div class="pc-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg></div>
                <span class="pc-tipo">Pie de parcela</span>
                <span class="pc-val">${{ fmtPrice(precioParcela) }}</span>
                <span class="pc-unit">MXN/ton · prom. 30 dias</span>
              </div>
              <div class="pc pc-blue">
                <div class="pc-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/></svg></div>
                <span class="pc-tipo">Precio bodega</span>
                <span class="pc-val">${{ fmtPrice(precioBodega) }}</span>
                <span class="pc-unit">MXN/ton · prom. 30 dias</span>
              </div>
              <div class="pc pc-purple">
                <div class="pc-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
                <span class="pc-tipo">Internacional</span>
                <span class="pc-val">${{ fmtPrice(precioInternacional) }}</span>
                <span class="pc-unit">MXN/ton · ultimo registro</span>
              </div>
              <div class="pc pc-amber">
                <div class="pc-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
                <span class="pc-tipo">Brecha bodega vs parcela</span>
                <span class="pc-val" :class="brechaPrecio>=0?'pc-pos':'pc-neg'">{{ brechaPrecio>=0?'+':'' }}${{ fmtPrice(brechaPrecio) }}</span>
                <span class="pc-unit">Diferencia promedio</span>
              </div>
            </div>
            <section class="glass-card chart-card chart-tall">
              <div class="chart-hdr">
                <h3 class="card-hdg mb0">Tendencia de precios</h3>
                <span class="chart-unit">ultimas semanas</span>
              </div>
              <div class="cwrap cwrap-lg"><Line v-if="preciosLineData" :data="preciosLineData" :options="lineOpts"/><div v-else class="cph"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg><span>Sin datos de tendencia. Registre precios para ver la grafica.</span></div></div>
            </section>
            <section class="glass-card tbl-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Promedios ultimos 30 dias</h3>
              </div>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Tipo</th><th>Maiz</th><th>Promedio</th><th>Minimo</th><th>Maximo</th><th>Registros</th><th>Ultima act.</th></tr></thead>
                  <tbody>
                    <tr v-for="(row,i) in precios.promedios" :key="`${row.tipo_precio}-${row.tipo_maiz}`" :class="i%2===1?'tr-alt':''">
                      <td><span class="pill" :class="tipoPrecioClass(row.tipo_precio)">{{ tipoPrecioLabel(row.tipo_precio) }}</span></td>
                      <td>{{ row.tipo_maiz }}</td><td class="td-b td-price">${{ fmtPrice(row.promedio) }}</td><td class="td-muted">${{ fmtPrice(row.minimo) }}</td><td class="td-muted">${{ fmtPrice(row.maximo) }}</td><td>{{ row.registros }}</td><td class="td-muted">{{ fmtFecha(row.ultima_fecha) }}</td>
                    </tr>
                    <tr v-if="!precios.promedios?.length"><td colspan="7" class="td-empty">Sin registros en los ultimos 30 dias</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 5: ALERTAS ════════════ -->
        <div v-if="tabActiva === 'alertas'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge red">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                Alertas
              </span>
              <h2 class="p-title">Centro de Monitoreo</h2>
              <p class="p-desc">Incidencias activas, niveles de severidad y seguimiento de alertas criticas</p>
            </div>
          </div>
          <div class="inline-filters">
            <svg class="filter-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <div class="filter-item">
              <label class="filter-lbl">Estado</label>
              <select class="filter-sel" v-model="filtros.estado">
                <option value="">Todos los estados</option>
                <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
            <div class="filter-spacer"></div>
            <span v-if="filtros.estado" class="filter-badge">Filtros activos</span>
            <button v-if="filtros.estado" class="btn-clear-f" @click="limpiarFiltros">&#10005; Limpiar</button>
          </div>
          <div v-if="!alertasData" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-4">
              <div v-for="n in alertasData.por_nivel" :key="n.nivel_alerta" class="kpi glass-card" :class="`kpi-nivel-${n.nivel_alerta}`">
                <div class="kpi-ico" :style="nivelStyle(n.nivel_alerta)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ n.total }}</span><span class="kpi-lbl">{{ nivelLabel(n.nivel_alerta) }}</span></div>
              </div>
            </div>
            <div class="tbl-2col">
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Estado de alertas</h3>
                </div>
                <div class="estado-bars">
                  <div v-for="e in alertasData.por_estado" :key="e.estado_alerta" class="ebar-row">
                    <span class="ebar-lbl">{{ e.estado_alerta }}</span>
                    <div class="ebar-track"><div class="ebar-fill" :class="estadoAlertaClass(e.estado_alerta)" :style="{ width: maxAlertaEstado>0 ? Math.round((e.total/maxAlertaEstado)*100)+'%':'0%' }"></div></div>
                    <span class="ebar-val">{{ e.total }}</span>
                  </div>
                </div>
              </section>
              <section class="glass-card tbl-card">
                <div class="tbl-hdr">
                  <h3 class="sec-heading mb0">Tipos de alerta pendientes</h3>
                </div>
                <div class="tbl-wrap">
                  <table class="dt">
                    <thead><tr><th>Tipo de alerta</th><th>Nivel</th><th>Total</th></tr></thead>
                    <tbody>
                      <tr v-for="(t,i) in alertasData.por_tipo" :key="`${t.tipo_alerta}-${t.nivel_alerta}`" :class="i%2===1?'tr-alt':''">
                        <td>{{ t.tipo_alerta }}</td><td><span class="pill" :class="nivelPillClass(t.nivel_alerta)">{{ nivelLabel(t.nivel_alerta) }}</span></td><td class="td-b">{{ t.total }}</td>
                      </tr>
                      <tr v-if="!alertasData.por_tipo?.length"><td colspan="3" class="td-empty">Sin alertas pendientes</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <section class="glass-card tbl-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Alertas pendientes mas criticas</h3>
                <span class="tbl-count">{{ alertasData.recientes_pendientes?.length ?? 0 }} alertas</span>
              </div>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Severidad</th><th>Tipo</th><th>Productor</th><th>UP</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    <tr v-for="(a,i) in alertasData.recientes_pendientes" :key="a.id" :class="i%2===1?'tr-alt':''">
                      <td><span class="pill" :class="nivelPillClass(a.nivel_alerta)">{{ nivelLabel(a.nivel_alerta) }}</span></td>
                      <td>{{ a.tipo_alerta }}</td><td class="td-b">{{ a.nombres ? `${a.nombres} ${a.apellido_paterno}` : '—' }}</td><td>{{ a.up_name||'—' }}</td><td>{{ a.state_name||'—' }}</td><td class="td-muted">{{ fmtFecha(a.fecha_alerta) }}</td>
                    </tr>
                    <tr v-if="!alertasData.recientes_pendientes?.length"><td colspan="6" class="td-empty">No hay alertas pendientes</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 6: OPERACION ════════════ -->
        <div v-if="tabActiva === 'operacion'" class="panel fade-in">
          <div class="p-header">
            <div class="p-header-left">
              <span class="p-header-badge blue">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Operacion
              </span>
              <h2 class="p-title">Equipo y Calidad</h2>
              <p class="p-desc">Usuarios del sistema, calidad de datos, supervisores y visitas de campo</p>
            </div>
          </div>
          <div v-if="!operacion" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <section class="glass-card roles-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Usuarios activos por rol</h3>
                <span class="tbl-count">{{ operacion.usuarios_por_rol?.reduce((a:number,r:any)=>a+r.total,0) }} usuarios</span>
              </div>
              <div class="roles-row">
                <div v-for="r in operacion.usuarios_por_rol" :key="r.rol" class="role-chip">
                  <div class="rc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  <span class="rc-num">{{ r.total }}</span>
                  <span class="rc-lbl">{{ rolLabel(r.rol) }}</span>
                </div>
              </div>
            </section>
            <section class="glass-card quality-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Calidad de datos — UPs</h3>
                <span class="tbl-count">{{ operacion.calidad_datos.total_ups }} UPs totales</span>
              </div>
              <div class="q-bars">
                <div v-for="q in calidadItems" :key="q.label" class="q-row">
                  <span class="q-lbl">{{ q.label }}</span>
                  <div class="q-track">
                    <div class="q-fill" :class="q.pct>=80?'qg':q.pct>=50?'qa':'qr'" :style="{ width: q.pct+'%' }"></div>
                  </div>
                  <span class="q-pct" :class="q.pct>=80?'tc-g':q.pct>=50?'tc-a':'tc-r'">{{ q.pct }}%</span>
                </div>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Ranking de supervisores — ultimos 30 dias</h3>
                <span class="tbl-count">{{ operacion.supervisores?.length ?? 0 }} supervisores</span>
              </div>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>#</th><th>Supervisor</th><th>Email</th><th>Productores</th><th>Visitas</th></tr></thead>
                  <tbody>
                    <tr v-for="(s, i) in operacion.supervisores" :key="s.supervisor_id" :class="i%2===1?'tr-alt':''">
                      <td class="td-rank">{{ (i as number)+1 }}</td><td class="td-b">{{ s.nombre_completo }}</td><td class="td-muted">{{ s.email }}</td><td>{{ s.productores_asignados }}</td>
                      <td><span class="pill" :class="s.visitas_mes>0?'pill-g':'pill-gray'">{{ s.visitas_mes }} visita{{ s.visitas_mes!==1?'s':'' }}</span></td>
                    </tr>
                    <tr v-if="!operacion.supervisores?.length"><td colspan="5" class="td-empty">Sin supervisores</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <div class="tbl-hdr">
                <h3 class="sec-heading mb0">Ultimas visitas de campo</h3>
              </div>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Fecha</th><th>Productor</th><th>UP</th><th>Tipo</th><th>Tecnico</th></tr></thead>
                  <tbody>
                    <tr v-for="v in operacion.visitas_recientes" :key="v.id">
                      <td>{{ fmtFecha(v.fecha_visita) }}</td><td>{{ v.nombres }} {{ v.apellido_paterno }}</td><td>{{ v.up_name||'—' }}</td><td>{{ v.tipo_visita||'—' }}</td><td class="td-muted">{{ v.tecnico||'—' }}</td>
                    </tr>
                    <tr v-if="!operacion.visitas_recientes?.length"><td colspan="5" class="td-empty">Sin visitas recientes</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

      </template>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { api } from '@/services/api'
import mapboxgl from 'mapbox-gl'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// ── State ──
const cargando = ref(false)
const cargandoInicial = ref(true)
const tabActiva = ref<'vision'|'produccion'|'infraestructura'|'precios'|'alertas'|'operacion'>('vision')
const resumen = ref<any>(null)
const produccion = ref<any>(null)
const infraestructura = ref<any>(null)
const precios = ref<any>(null)
const alertasData = ref<any>(null)
const operacion = ref<any>(null)
const mapaData = ref<any>(null)
const filtros = ref({ estado: '', ciclo: '' })

// ── Sticky height tracker ──
const stickyRef = ref<HTMLElement | null>(null)
const stickyH = ref(120)
let stickyObserver: ResizeObserver | null = null

// ── Map ──
const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []
const mapTab = ref('UPs')
const mapTabs = ['UPs', 'Bodegas', 'Alertas']

// ── Carousel config ──
const ITEM_W = 160
const ITEM_GAP = 10

const tabs: Array<{ key: typeof tabActiva.value; label: string; icon: string }> = [
  { key: 'vision',         label: 'Vision general',   icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>' },
  { key: 'produccion',     label: 'Produccion',        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { key: 'infraestructura',label: 'Infraestructura',   icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>' },
  { key: 'precios',        label: 'Precios',           icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9.35a4 4 0 0 0-3-1.35c-2.2 0-4 1.34-4 3s1.8 3 4 3a4 4 0 0 0 3-1.35"/><line x1="12" y1="5" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="19"/></svg>' },
  { key: 'alertas',        label: 'Alertas',           icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  { key: 'operacion',      label: 'Operacion',         icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' },
]

// Extended: [clone_last, real_0..real_n, clone_first]
const extTabs = computed(() => [
  { ...tabs[tabs.length - 1] },
  ...tabs,
  { ...tabs[0] },
])

// Visual index in extTabs: 0=clone_last, 1..n=real tabs, n+1=clone_first
const visualIdx = ref(1)
const animating = ref(false)
const tabsViewportRef = ref<HTMLElement | null>(null)
const carouselReady = ref(false)
// Start at 0 — ResizeObserver is the ONLY source of truth for width
const viewportW = ref(0)
let resizeObs: ResizeObserver | null = null

// Track x offset: centers visualIdx item in viewport
const trackX = computed(() => {
  if (viewportW.value === 0) return 0  // not measured yet
  const center = viewportW.value / 2
  return center - ITEM_W / 2 - visualIdx.value * (ITEM_W + ITEM_GAP)
})

// Watch the ref — it becomes non-null when v-else renders the carousel
watch(tabsViewportRef, (el) => {
  if (!el) return
  resizeObs?.disconnect()
  resizeObs = new ResizeObserver(entries => {
    const w = entries[0].contentRect.width
    if (w === 0) return
    viewportW.value = w
    if (!carouselReady.value) {
      visualIdx.value = tabs.findIndex(t => t.key === tabActiva.value) + 1
      carouselReady.value = true
    }
  })
  resizeObs.observe(el)
})

onUnmounted(() => { resizeObs?.disconnect() })

function onTransitionEnd() {
  animating.value = false
  // If we reached clone of last (idx=0), jump instantly to real last
  if (visualIdx.value === 0) {
    visualIdx.value = tabs.length
  }
  // If we reached clone of first (idx=extTabs.length-1), jump instantly to real first
  else if (visualIdx.value === extTabs.value.length - 1) {
    visualIdx.value = 1
  }
}

function setTabByExt(key: string) {
  const realIdx = tabs.findIndex(t => t.key === key)
  if (realIdx === -1) return
  tabActiva.value = key as typeof tabActiva.value
  visualIdx.value = realIdx + 1
}

function setTab(k: string) {
  tabActiva.value = k as typeof tabActiva.value
  const realIdx = tabs.findIndex(t => t.key === k)
  if (realIdx !== -1) visualIdx.value = realIdx + 1
}

function selectPrev() {
  if (animating.value) return
  animating.value = true
  visualIdx.value--
  const key = extTabs.value[visualIdx.value]?.key
  if (key) tabActiva.value = (key === tabs[tabs.length-1].key || key === tabs[0].key
    ? (visualIdx.value === 0 ? tabs[tabs.length-1].key : tabs[0].key)
    : key) as typeof tabActiva.value
  // Sync active to real key
  const realKey = tabs[(visualIdx.value - 1 + tabs.length) % tabs.length]?.key
  if (realKey) tabActiva.value = realKey as typeof tabActiva.value
}

function selectNext() {
  if (animating.value) return
  animating.value = true
  visualIdx.value++
  const realKey = tabs[(visualIdx.value - 1) % tabs.length]?.key
  if (realKey) tabActiva.value = realKey as typeof tabActiva.value
}

// ── Computed ──
const fechaActual = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
)

const estadosDisponibles = computed(() => {
  const set = new Set<string>()
  ;(mapaData.value?.por_estado ?? []).forEach((r: any) => { if (r.estado) set.add(r.estado) })
  return [...set].sort()
})

function limpiarFiltros() { filtros.value = { estado: '', ciclo: '' } }

// Vision KPIs
const precioParcela = computed(() => Number(precios.value?.promedios?.find((x: any) => x.tipo_precio === 'observado')?.promedio ?? 0))
const precioBodega = computed(() => Number(precios.value?.promedios?.find((x: any) => x.tipo_precio === 'bodega')?.promedio ?? 0))
const precioInternacional = computed(() => Number(precios.value?.recientes?.find((x: any) => x.tipo_precio === 'mercado_internacional')?.precio ?? 0))
const brechaPrecio = computed(() => precioBodega.value - precioParcela.value)

const kpisVision = computed(() => {
  if (!resumen.value) return []
  return [
    { key: 'productores', label: 'Productores activos', val: fmtCompact(resumen.value.productores), bg: 'rgba(26,92,56,.08)', color: '#15803d', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { key: 'ups', label: 'UPs registradas', val: fmtCompact(resumen.value.ups), bg: 'rgba(37,99,235,.08)', color: '#2563eb', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { key: 'produccion', label: 'Produccion est. (ton)', val: fmtCompact(resumen.value.produccion_estimada_ton), bg: 'rgba(14,148,148,.08)', color: '#0e9494', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>' },
    { key: 'stock', label: 'Stock en bodegas (ton)', val: fmtCompact(infraestructura.value?.stock_actual_ton ?? 0), bg: 'rgba(124,58,237,.08)', color: '#7c3aed', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' },
    { key: 'alertas', label: 'Alertas activas', val: String(resumen.value.alertas_pendientes), bg: 'rgba(220,38,38,.08)', color: '#dc2626', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    { key: 'precio', label: 'Precio parcela (MXN/ton)', val: precioParcela.value > 0 ? `$${fmtPrice(precioParcela.value)}` : 'N/D', bg: 'rgba(217,119,6,.08)', color: '#d97706', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  ]
})

// Filtered rows
const filteredEstadoRows = computed(() => {
  let rows = mapaData.value?.por_estado ?? []
  if (filtros.value.estado) rows = rows.filter((r: any) => r.estado === filtros.value.estado)
  return rows
})
const filteredProduccionEstado = computed(() => {
  let rows = produccion.value?.por_estado ?? []
  if (filtros.value.estado) rows = rows.filter((r: any) => r.estado === filtros.value.estado)
  return rows
})
const filteredCiclos = computed(() => {
  let rows = produccion.value?.por_ciclo ?? []
  if (filtros.value.ciclo) rows = rows.filter((r: any) => r.cycle_type === filtros.value.ciclo)
  return rows
})

// Insights
const insights = computed(() => {
  const arr: { text: string; type: string }[] = []
  const estados = mapaData.value?.por_estado ?? []
  if (estados.length > 0) {
    const top = estados[0]
    const total = estados.reduce((s: number, e: any) => s + Number(e.produccion_ton || 0), 0)
    const pct = total > 0 ? Math.round((Number(top.produccion_ton) / total) * 100) : 0
    if (pct > 0) arr.push({ text: `${top.estado} concentra el ${pct}% de la produccion estimada.`, type: 'green' })
  }
  if (resumen.value?.alertas_pendientes > 0)
    arr.push({ text: `${resumen.value.alertas_pendientes} alertas pendientes requieren atencion inmediata.`, type: 'red' })
  if (infraestructura.value) {
    const p = infraestructura.value.ocupacion_pct
    if (p >= 80) arr.push({ text: `Bodegas al ${p}% de ocupacion — capacidad limitada.`, type: 'amber' })
    else arr.push({ text: `Bodegas al ${p}% de ocupacion — hay capacidad disponible.`, type: 'blue' })
  }
  if (brechaPrecio.value !== 0 && precioParcela.value > 0)
    arr.push({ text: `Brecha de precio: bodega paga $${fmtPrice(Math.abs(brechaPrecio.value))}/ton ${brechaPrecio.value >= 0 ? 'mas' : 'menos'} que a pie de parcela.`, type: brechaPrecio.value >= 0 ? 'green' : 'red' })
  if (!arr.length) arr.push({ text: 'Cargando datos para generar insights...', type: 'blue' })
  return arr
})

// Chart data
const produccionBarData = computed(() => {
  const rows = filteredProduccionEstado.value.slice(0, 8)
  if (!rows.length) return null
  return {
    labels: rows.map((r: any) => (r.estado || '—').substring(0, 14)),
    datasets: [{ label: 'Produccion (ton)', data: rows.map((r: any) => Number(r.produccion_ton)), backgroundColor: 'rgba(26,92,56,.72)', borderRadius: 6 }],
  }
})

const cicloDonutData = computed(() => {
  const ciclos = produccion.value?.por_ciclo ?? []
  if (!ciclos.length) return null
  const agrupado: Record<string, number> = {}
  ciclos.forEach((c: any) => { const t = c.cycle_type || 'Otro'; agrupado[t] = (agrupado[t] || 0) + Number(c.area_ha) })
  const colors = ['#1a5c38', '#2563eb', '#f59e0b', '#7c3aed']
  return {
    labels: Object.keys(agrupado),
    datasets: [{ data: Object.values(agrupado), backgroundColor: Object.keys(agrupado).map((_, i) => colors[i % colors.length]), borderWidth: 0 }],
  }
})

const preciosLineData = computed(() => {
  const tendencia = precios.value?.tendencia ?? []
  if (!tendencia.length) return null
  const semanas = ([...new Set(tendencia.map((t: any) => t.semana as string))] as string[]).sort()
  const tipos = [
    { key: 'observado', label: 'Parcela', color: '#16a34a' },
    { key: 'bodega', label: 'Bodega', color: '#2563eb' },
    { key: 'mercado_internacional', label: 'Internacional', color: '#7c3aed' },
  ]
  const datasets = tipos.map(tipo => ({
    label: tipo.label,
    data: semanas.map(s => { const r = tendencia.find((t: any) => t.semana === s && t.tipo_precio === tipo.key); return r ? Number(r.promedio) : null }),
    borderColor: tipo.color,
    backgroundColor: tipo.color + '15',
    tension: 0.4,
    fill: false,
    pointRadius: 3,
    spanGaps: true,
  })).filter(d => d.data.some(v => v !== null))
  return { labels: semanas.map((s: string) => fmtFechaSemana(s)), datasets }
})

// Chart options
const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false } } } }
const donutOpts = { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 14, font: { size: 12 } } } } }
const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const, labels: { boxWidth: 12, padding: 12, font: { size: 12 } } } }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } } }, interaction: { mode: 'index' as const, intersect: false } }

// Infraestructura
const deficitTon = computed(() => (infraestructura.value?.capacidad_total_ton ?? 0) - (resumen.value?.produccion_estimada_ton ?? 0))
const deficitProduccionPct = computed(() => {
  const cap = infraestructura.value?.capacidad_total_ton ?? 0
  const prod = resumen.value?.produccion_estimada_ton ?? 0
  return Math.min(100, Math.round((prod / Math.max(cap, prod, 1)) * 100))
})
const deficitCapacidadPct = computed(() => {
  const cap = infraestructura.value?.capacidad_total_ton ?? 0
  const prod = resumen.value?.produccion_estimada_ton ?? 0
  return Math.min(100, Math.round((cap / Math.max(cap, prod, 1)) * 100))
})

// Alertas
const maxAlertaEstado = computed(() => {
  if (!alertasData.value?.por_estado?.length) return 1
  return Math.max(...alertasData.value.por_estado.map((e: any) => e.total))
})

// Operacion
const calidadItems = computed(() => {
  const c = operacion.value?.calidad_datos
  if (!c) return []
  return [
    { label: 'Con nombre registrado', pct: c.con_nombre_pct },
    { label: 'Con area calculada', pct: c.con_area_pct },
    { label: 'Con ciclo asignado', pct: c.con_ciclo_pct },
    { label: 'Con cultivo registrado', pct: c.con_cultivo_pct },
  ]
})

// ── Helpers ──
function fmtCompact(v: any): string {
  const n = Number(v || 0)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + ' K'
  return String(Math.round(n))
}
function fmtNum(v: any): string { return Number(v || 0).toLocaleString('es-MX') }
function fmtPrice(v: any): string { return Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtFecha(f: any): string { if (!f) return '—'; try { return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '—' } }
function fmtFechaSemana(f: string): string { try { return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) } catch { return f } }
function tipoPrecioLabel(t: string): string { return ({ observado: 'Parcela', bodega: 'Bodega', mercado_internacional: 'Internacional' } as any)[t] || t }
function tipoPrecioClass(t: string): string { return ({ observado: 'pill-g', bodega: 'pill-b', mercado_internacional: 'pill-p' } as any)[t] || 'pill-gray' }
function nivelLabel(n: string): string { return ({ critico: 'Critico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' } as any)[n] || n }
function nivelPillClass(n: string): string { return ({ critico: 'pill-r', alto: 'pill-amber', medio: 'pill-b', bajo: 'pill-g' } as any)[n] || 'pill-gray' }
function nivelStyle(n: string): string { return ({ critico: 'background:rgba(220,38,38,.08);color:#dc2626', alto: 'background:rgba(217,119,6,.08);color:#d97706', medio: 'background:rgba(37,99,235,.08);color:#2563eb', bajo: 'background:rgba(22,163,74,.08);color:#16a34a' } as any)[n] || '' }
function estadoAlertaClass(e: string): string { return ({ pendiente: 'ebar-amber', confirmada: 'ebar-blue', atendida: 'ebar-green', descartada: 'ebar-gray' } as any)[e] || 'ebar-gray' }
function rolLabel(r: string): string { return ({ admin: 'Admin', supervisor: 'Supervisor', productor: 'Productor', bodeguero: 'Bodeguero', responsable: 'Responsable', tecnico: 'Tecnico' } as any)[r] || r }
function mbarPct(b: any): number { return b.capacidad_toneladas > 0 ? Math.min(100, Math.round((b.stock_actual / b.capacidad_toneladas) * 100)) : 0 }
function mbarClass(b: any): string { const p = mbarPct(b); return p >= 90 ? 'mbar-r' : p >= 70 ? 'mbar-a' : 'mbar-g' }

// ── Map ──
function initMap() {
  if (!mapContainer.value || map) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-102.5, 23.5],
    zoom: 4.3,
    attributionControl: false,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.on('load', () => updateMarkers())
}

function clearMarkers() { markers.forEach(m => m.remove()); markers.length = 0 }

function updateMarkers() {
  clearMarkers()
  if (!map || !mapaData.value) return
  const cfg: Record<string, { items: any[]; color: string }> = {
    'UPs':     { items: mapaData.value.ups     || [], color: '#15803d' },
    'Bodegas': { items: mapaData.value.bodegas || [], color: '#7c3aed' },
    'Alertas': { items: (mapaData.value.ups    || []).filter((u: any) => u.alertas > 0), color: '#ef4444' },
  }
  const { items, color } = cfg[mapTab.value] || cfg['UPs']
  items.forEach((item: any) => {
    if (!item.lng || !item.lat) return
    const el = document.createElement('div')
    el.style.cssText = `width:11px;height:11px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.3);cursor:pointer;transition:transform .15s;`
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.6)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
    const name = item.up_name || item.nombre || '—'
    const sub = item.state_name || item.estado || ''
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([Number(item.lng), Number(item.lat)])
      .setPopup(new mapboxgl.Popup({ offset: 14 }).setHTML(`<strong style="font-size:13px">${name}</strong><br><span style="font-size:12px;color:#555">${sub}</span>`))
      .addTo(map!)
    markers.push(marker)
  })
}

function setMapTab(t: string) { mapTab.value = t; updateMarkers() }

// ── Data loading ──
async function loadAll() {
  cargandoInicial.value = true
  const results = await Promise.allSettled([
    api.dashboardAdmin.resumen(),
    api.dashboardAdmin.produccion(),
    api.dashboardAdmin.infraestructura(),
    api.dashboardAdmin.precios(),
    api.dashboardAdmin.alertas(),
    api.dashboardAdmin.operacion(),
    api.dashboardAdmin.mapa(),
  ])
  resumen.value        = results[0].status === 'fulfilled' ? results[0].value : null
  produccion.value     = results[1].status === 'fulfilled' ? results[1].value : null
  infraestructura.value= results[2].status === 'fulfilled' ? results[2].value : null
  precios.value        = results[3].status === 'fulfilled' ? results[3].value : null
  alertasData.value    = results[4].status === 'fulfilled' ? results[4].value : null
  operacion.value      = results[5].status === 'fulfilled' ? results[5].value : null
  mapaData.value       = results[6].status === 'fulfilled' ? results[6].value : null
  cargandoInicial.value = false
  await nextTick()
  if (tabActiva.value === 'vision') initMap()
}

async function recargarTodo() {
  cargando.value = true
  clearMarkers()
  if (map) { map.remove(); map = null }
  await loadAll()
  cargando.value = false
}

watch(tabActiva, async (tab) => {
  if (tab === 'vision') { await nextTick(); if (!map) initMap(); else if (map.loaded()) updateMarkers() }
})

onMounted(() => {
  loadAll()
  nextTick(() => {
    if (stickyRef.value) {
      stickyObserver = new ResizeObserver(entries => {
        for (const e of entries) stickyH.value = Math.round(e.contentRect.height)
      })
      stickyObserver.observe(stickyRef.value)
    }
  })
})
onUnmounted(() => {
  if (map) { map.remove(); map = null }
  if (stickyObserver) stickyObserver.disconnect()
})
</script>

<style scoped>
/* ════════════════════════════════════════
   SIMAC Admin Dashboard — Apple 2026 style
   ════════════════════════════════════════ */

/* ═══ BASE ═══ */
.dash {
  width: 100%;
  padding: 0 0 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
  background: #f6f8fa;
  min-height: 100vh;
}
/* Tipografía base */
.dash {
  font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.glass-card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,.07);
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.03);
  padding: 18px 20px;
  transition: box-shadow .2s ease;
}
.glass-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.07), 0 8px 24px rgba(0,0,0,.04); }
/* padding-top = altura real del sticky + 16px de respiro */
.panel { display: flex; flex-direction: column; gap: 12px; padding: calc(var(--sticky-h, 120px) + 16px) 3rem 28px; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeIn .22s cubic-bezier(.4,0,.2,1) both; }

/* ═══ STICKY WRAPPER (hero + tabs fijos arriba) ═══ */
.dash-sticky {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 90;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ═══ HERO HEADER ═══ */
.dash-hero {
  background: linear-gradient(160deg, var(--color-primary-darker) 0%, var(--color-primary) 55%, var(--color-primary-hover) 100%);
  padding: .75rem 3rem .85rem;
  border-radius: 0 0 24px 24px;
  margin: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(26,92,56,.18);
}
.dash-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 85% 15%, rgba(255,255,255,.08), transparent 45%);
  pointer-events: none;
}
.dash-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  position: relative;
  z-index: 1;
}
.dash-hero-text { flex: 1; min-width: 0; }
.dash-title { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 1px; line-height: 1.1; letter-spacing: -.025em; }
.dash-subtitle { font-size: .7rem; color: rgba(255,255,255,.65); margin: 0; line-height: 1; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-refresh {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(12px);
  cursor: pointer; color: rgba(255,255,255,.9); transition: all .2s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.btn-refresh:hover { background: rgba(255,255,255,.22); transform: scale(1.05); }
.btn-refresh.spinning svg { animation: spin .8s linear infinite; }

/* ═══ INLINE FILTERS (dentro de cada panel) ═══ */
.inline-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.07);
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.filter-icon { color: #b0b7c3; flex-shrink: 0; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-lbl { font-size: .67rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
.filter-sel {
  font-size: .78rem; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 6px 12px; background: #f9fafb; color: #1e293b; outline: none;
  min-width: 160px; cursor: pointer; transition: all .18s; font-weight: 500;
}
.filter-sel:hover { background: #f1f5f9; border-color: #d1d5db; }
.filter-sel:focus { background: #fff; border-color: #1B6B3A; box-shadow: 0 0 0 3px rgba(27,107,58,.1); }
.filter-spacer { flex: 1; }
.filter-badge {
  font-size: .67rem; font-weight: 600; padding: 4px 11px;
  border-radius: 99px; background: rgba(27,107,58,.08); color: #15803d;
  letter-spacing: .01em; border: 1px solid rgba(27,107,58,.15);
}
.btn-clear-f {
  font-size: .72rem; padding: 5px 12px; border-radius: 8px; font-weight: 600;
  border: 1px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer;
  transition: all .18s; display: flex; align-items: center; gap: 4px;
}
.btn-clear-f:hover { background: rgba(220,38,38,.06); border-color: rgba(220,38,38,.2); color: #dc2626; }

/* ═══ LOADER ═══ */
.loader-row { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 16px; color: #94a3b8; font-size: .85rem; }
.loader { width: 22px; height: 22px; border: 2.5px solid #e2e8f0; border-top-color: #1a5c38; border-radius: 50%; animation: spin .7s linear infinite; }

/* ═══ TABS FLAT NAV (desktop) ═══ */
.tabs-nav-flat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 3rem 8px;
  background: linear-gradient(180deg, rgba(26,92,56,.08) 0%, rgba(26,92,56,.03) 100%);
  border-bottom: 1px solid rgba(26,92,56,.1);
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-nav-flat::-webkit-scrollbar { display: none; }
.tnf-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 18px;
  border: 1.5px solid rgba(26,92,56,.15);
  background: rgba(255,255,255,.7);
  font-size: .8rem; font-weight: 600;
  color: #3d7a57;
  cursor: pointer;
  border-radius: 10px;
  white-space: nowrap;
  transition: all .18s ease;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}
.tnf-btn:hover:not(.active) {
  color: #1B6B3A;
  border-color: rgba(26,92,56,.3);
  background: rgba(255,255,255,.9);
}
.tnf-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #1B6B3A 0%, #15843F 100%);
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(27,107,58,.3);
}
.tnf-icon { display: flex; align-items: center; opacity: .75; }
.tnf-btn.active .tnf-icon { opacity: 1; }
.tnf-lbl { letter-spacing: -.01em; }

/* ═══ TABS CAROUSEL (mobile only) ═══ */
.tabs-carousel {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 1.2rem 0;
  transition: opacity .3s ease;
}
.tabs-viewport {
  flex: 1;
  max-width: 480px;
  overflow: hidden;
  position: relative;
  height: 44px;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
  mask-image: linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%);
}
.tabs-track {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  will-change: transform;
}
.nav-arr {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #9ca3af;
  cursor: pointer;
  transition: all .18s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.nav-arr:hover {
  color: #15603a;
  border-color: #15603a;
  transform: scale(1.08);
  box-shadow: 0 3px 10px rgba(21,96,58,.16);
}
.nav-arr:active { transform: scale(.94); }

@keyframes tab-pop {
  0%   { transform: scale(0.88); box-shadow: 0 2px 8px rgba(27,107,58,.15); }
  60%  { transform: scale(1.06); box-shadow: 0 6px 22px rgba(27,107,58,.38); }
  100% { transform: scale(1.04); box-shadow: 0 5px 18px rgba(27,107,58,.35); }
}
.tab-btn {
  flex-shrink: 0;
  width: 160px;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 8px 14px;
  border: 1.5px solid #e5e7eb;
  background: #ffffff;
  font-size: .78rem; font-weight: 600;
  color: #b0b7c3;
  cursor: pointer;
  border-radius: 99px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  opacity: 0.4;
  transform: scale(0.88);
  transition: opacity .18s ease, transform .2s cubic-bezier(.22,.68,0,1), background .15s, color .15s, border-color .15s, box-shadow .2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  letter-spacing: -.01em;
}
.tab-btn:hover:not(.active) {
  opacity: 0.65;
  color: #4b5563;
  border-color: #d1d5db;
  transform: scale(0.93);
}
.tab-btn.active {
  opacity: 1;
  color: #fff;
  background: linear-gradient(135deg, #1B6B3A 0%, #15843F 100%);
  border-color: transparent;
  box-shadow: 0 5px 18px rgba(27,107,58,.35), 0 2px 4px rgba(0,0,0,.06);
  transform: scale(1.04);
  animation: tab-pop .24s cubic-bezier(.22,.68,0,1) both;
}
.tab-icon { display: flex; align-items: center; opacity: .8; flex-shrink: 0; }
.tab-btn.active .tab-icon { opacity: 1; }
.tab-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ═══ PANEL HEADER (universal) ═══ */
.p-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0; gap: 16px; flex-wrap: wrap;
}
.p-header-left {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; min-width: 0;
}
.p-header-badge {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 4px 11px; border-radius: 99px;
  font-size: .67rem; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase;
}
.p-header-badge.live  { background: rgba(34,197,94,.12);  color: #16a34a; border: 1px solid rgba(34,197,94,.2); }
.p-header-badge.green { background: rgba(22,163,74,.10);  color: #15803d; border: 1px solid rgba(22,163,74,.2); }
.p-header-badge.purple{ background: rgba(124,58,237,.10); color: #7c3aed; border: 1px solid rgba(124,58,237,.2); }
.p-header-badge.amber { background: rgba(217,119,6,.10);  color: #b45309; border: 1px solid rgba(217,119,6,.2); }
.p-header-badge.red   { background: rgba(239,68,68,.10);  color: #dc2626; border: 1px solid rgba(239,68,68,.2); }
.p-header-badge.blue  { background: rgba(37,99,235,.10);  color: #1d4ed8; border: 1px solid rgba(37,99,235,.2); }
.live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .5; transform: scale(1.35); }
}
.p-title {
  font-size: 1.05rem; font-weight: 700; color: #0a0f1e;
  margin: 0; letter-spacing: -.02em; line-height: 1.2; white-space: nowrap;
}
.p-desc {
  font-size: .75rem; color: #94a3b8; margin: 0;
  font-weight: 500; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ═══ TABLE HEADER row ═══ */
.tbl-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 10px; flex-wrap: wrap;
}
.tbl-count {
  font-size: .67rem; font-weight: 600; color: #94a3b8;
  background: rgba(0,0,0,.04); padding: 3px 10px; border-radius: 99px;
  letter-spacing: .02em; flex-shrink: 0;
}
.mb0 { margin-bottom: 0 !important; }

/* ═══ 2-column table grid ═══ */
.tbl-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ═══ CHART HEADER ═══ */
.chart-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 8px;
}
.chart-unit {
  font-size: .67rem; color: #94a3b8; font-weight: 600;
  background: rgba(0,0,0,.04); padding: 3px 10px; border-radius: 99px;
}

/* ═══ DEFICIT TAG ═══ */
.def-tag {
  font-size: .67rem; font-weight: 700; padding: 3px 10px;
  border-radius: 99px; flex-shrink: 0; letter-spacing: .02em;
}
.def-tag-ok  { background: rgba(22,163,74,.1);  color: #15803d; }
.def-tag-err { background: rgba(220,38,38,.1);  color: #dc2626; }

/* ═══ OCU CELL ═══ */
.ocu-cell { display: flex; align-items: center; gap: 6px; }

/* ═══ PRICE CARD ICON ═══ */
.pc-icon-wrap {
  width: 36px; height: 36px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px; opacity: .7;
}
.pc-green  .pc-icon-wrap { background: rgba(22,163,74,.12);  color: #15803d; }
.pc-blue   .pc-icon-wrap { background: rgba(37,99,235,.12);  color: #1d4ed8; }
.pc-purple .pc-icon-wrap { background: rgba(124,58,237,.12); color: #6d28d9; }
.pc-amber  .pc-icon-wrap { background: rgba(217,119,6,.12);  color: #92400e; }

/* ═══ TABLE ALTERNATING ROWS ═══ */
.tr-alt td { background: rgba(0,0,0,.015) !important; }

/* ═══ TABLE ESTADO CHIP ═══ */
.td-estado {
  display: inline-flex; align-items: center;
  font-weight: 600; color: #0f172a;
}
.td-num {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 22px; border-radius: 6px;
  background: rgba(0,0,0,.04); font-size: .75rem; font-weight: 600; color: #374151;
}
.td-price { font-size: .9rem; letter-spacing: -.01em; }

/* ═══ ROLE CHIP ICON ═══ */
.rc-icon {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(27,107,58,.08); color: #1B6B3A; margin-bottom: 4px;
}

/* ═══ KPI COLOR ACCENTS (bottom border) ═══ */
.kpi-green  { border-bottom: 3px solid rgba(22,163,74,.3); }
.kpi-blue   { border-bottom: 3px solid rgba(37,99,235,.3); }
.kpi-amber  { border-bottom: 3px solid rgba(217,119,6,.3); }
.kpi-purple { border-bottom: 3px solid rgba(124,58,237,.3); }
.kpi-teal   { border-bottom: 3px solid rgba(14,148,148,.3); }
.kpi-red    { border-bottom: 3px solid rgba(220,38,38,.3); }
.kpi-nivel-critico { border-bottom: 3px solid rgba(220,38,38,.4); }
.kpi-nivel-alto    { border-bottom: 3px solid rgba(217,119,6,.4); }
.kpi-nivel-medio   { border-bottom: 3px solid rgba(37,99,235,.3); }
.kpi-nivel-bajo    { border-bottom: 3px solid rgba(22,163,74,.3); }

/* ═══ KPI ROW ═══ */
.kpi-row { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; }
.kpi-3 { grid-template-columns: repeat(3,1fr); }
.kpi-4 { grid-template-columns: repeat(4,1fr); }
.kpi {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 4px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.03);
  transition: transform .18s ease, box-shadow .18s ease;
  cursor: default;
}
.kpi:hover { transform: translateY(-3px); box-shadow: 0 4px 18px rgba(0,0,0,.09); }
.kpi.kpi-alert { border-color: rgba(220,38,38,.18); background: rgba(220,38,38,.02); }
.kpi-ico {
  width: 42px; height: 42px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-body { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.kpi-val { font-size: 1.35rem; font-weight: 750; line-height: 1; color: #0a0f1e; letter-spacing: -.03em; }
.kpi-lbl { font-size: .64rem; color: #94a3b8; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: .01em; }

/* ═══ HEADINGS ═══ */
.sec-heading {
  font-size: .85rem; font-weight: 700; color: #0a0f1e; margin: 0 0 14px;
  display: flex; align-items: center; gap: 7px;
  letter-spacing: -.01em;
}
.sec-heading svg { color: #b0b7c3; flex-shrink: 0; }
.card-hdg {
  font-size: .84rem; font-weight: 700; color: #0a0f1e; margin: 0 0 14px;
  letter-spacing: -.01em;
}

/* ═══ MAP CARD ═══ */
.map-card { padding: 0; overflow: hidden; }
.map-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 10px; flex-wrap: wrap; gap: 8px;
  border-bottom: 1px solid rgba(0,0,0,.05);
}
.map-hdr-left {
  display: flex; align-items: center; gap: 6px;
}
.map-hdr-left .sec-heading { margin: 0; }
.map-hdr-icon { color: #1B6B3A; flex-shrink: 0; }
.map-hdr .sec-heading { margin: 0; }
.maptabs { display: flex; gap: 3px; }
.mtab {
  padding: 5px 14px; border-radius: 99px; border: 1px solid transparent;
  font-size: .74rem; font-weight: 600; cursor: pointer;
  background: #f1f5f9; color: #64748b; transition: all .15s ease;
}
.mtab.active { background: #1B6B3A; color: #fff; border-color: #1B6B3A; box-shadow: 0 2px 8px rgba(27,107,58,.25); }
.mtab:hover:not(.active) { background: #e2e8f0; color: #374151; }
.map-body { display: flex; min-height: 380px; }
.map-cont { flex: 1; min-height: 380px; }
.side-panel {
  width: 240px; flex-shrink: 0; padding: 16px 18px;
  border-left: 1px solid rgba(0,0,0,.04);
  display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
}
.side-heading {
  font-size: .82rem; font-weight: 650; color: #0f172a; margin: 0;
  display: flex; align-items: center; gap: 5px;
}
.side-heading svg { color: #94a3b8; }
.ins-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ins-item { display: flex; align-items: flex-start; gap: 7px; font-size: .77rem; color: #475569; line-height: 1.45; }
.ins-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.ins-dot.green { background: #22c55e; }
.ins-dot.red { background: #ef4444; }
.ins-dot.amber { background: #f59e0b; }
.ins-dot.blue { background: #3b82f6; }
.ins-empty { font-size: .78rem; color: #94a3b8; margin: 0; }
.map-leyenda { margin-top: auto; display: flex; flex-direction: column; gap: 5px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,.04); }
.ley-row { display: flex; align-items: center; gap: 6px; font-size: .73rem; color: #64748b; }
.ley-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ═══ TABLES ═══ */
.tbl-card { padding-bottom: 6px; }
.tbl-wrap { overflow-x: auto; margin-top: 4px; border-radius: 10px; }
.dt { width: 100%; border-collapse: collapse; font-size: .8rem; }
.dt thead tr { border-bottom: 1px solid rgba(0,0,0,.06); }
.dt th {
  padding: 10px 14px; text-align: left; font-weight: 600;
  color: #b0b7c3; font-size: .67rem; text-transform: uppercase;
  letter-spacing: .07em; white-space: nowrap; background: #fafbfc;
}
.dt th:first-child { border-radius: 10px 0 0 0; }
.dt th:last-child  { border-radius: 0 10px 0 0; }
.dt td { padding: 10px 14px; color: #475569; border-bottom: 1px solid rgba(0,0,0,.04); }
.dt tbody tr:last-child td { border-bottom: none; }
.dt tbody tr { transition: background .12s; }
.dt tbody tr:hover td { background: rgba(27,107,58,.025); }
.td-b { font-weight: 650; color: #0a0f1e; }
.td-muted { color: #b0b7c3; font-size: .77rem; }
.td-rank { font-weight: 800; color: #1B6B3A; width: 28px; font-size: .9rem; }
.td-empty { text-align: center; color: #c8cdd5; padding: 28px 12px !important; font-size: .8rem; letter-spacing: .02em; }

/* ═══ CHARTS ═══ */
.charts-2col { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
.chart-card { display: flex; flex-direction: column; }
.cwrap { height: 220px; position: relative; }
.cwrap-sm { height: 220px; }
.cwrap-lg { height: 270px; }
.cph { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #c8cdd5; font-size: .8rem; text-align: center; padding: 20px; gap: 6px; }

/* ═══ PRICE CARDS ═══ */
.precio-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.pc {
  display: flex; flex-direction: column; gap: 6px;
  padding: 20px 20px 18px;
  border-radius: 18px; border: 1.5px solid transparent;
  transition: transform .18s ease;
}
.pc:hover { transform: translateY(-2px); }
.pc-tipo { font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; opacity: .6; }
.pc-val { font-size: 1.85rem; font-weight: 800; letter-spacing: -.04em; color: #0a0f1e; line-height: 1; }
.pc-unit { font-size: .66rem; opacity: .5; font-weight: 500; }
.pc-pos { color: #16a34a !important; }
.pc-neg { color: #dc2626 !important; }
.pc-green  { background: linear-gradient(135deg,rgba(22,163,74,.06),rgba(22,163,74,.02)); border-color: rgba(22,163,74,.2); color: #15803d; }
.pc-blue   { background: linear-gradient(135deg,rgba(37,99,235,.06),rgba(37,99,235,.02)); border-color: rgba(37,99,235,.2); color: #1d4ed8; }
.pc-purple { background: linear-gradient(135deg,rgba(124,58,237,.06),rgba(124,58,237,.02)); border-color: rgba(124,58,237,.2); color: #6d28d9; }
.pc-amber  { background: linear-gradient(135deg,rgba(217,119,6,.06),rgba(217,119,6,.02)); border-color: rgba(217,119,6,.2); color: #92400e; }

/* ═══ DEFICIT CARD ═══ */
.def-body { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
.def-row { display: flex; align-items: center; gap: 14px; }
.def-lbl { font-size: .78rem; color: #6b7280; min-width: 200px; font-weight: 500; }
.def-track { flex: 1; height: 10px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.def-bar { height: 100%; border-radius: 99px; transition: width .7s cubic-bezier(.4,0,.2,1); }
.def-prod { background: linear-gradient(90deg, #1B6B3A, #2DB44C); }
.def-cap  { background: linear-gradient(90deg, #2563eb, #60a5fa); }
.def-val { font-size: .85rem; font-weight: 700; color: #0a0f1e; min-width: 80px; text-align: right; }
.def-summary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 12px; font-size: .8rem; font-weight: 600;
}
.def-summary.surplus { background: rgba(22,163,74,.07); color: #15803d; border: 1px solid rgba(22,163,74,.15); }
.def-summary.deficit  { background: rgba(220,38,38,.06); color: #dc2626; border: 1px solid rgba(220,38,38,.15); }

/* ═══ MINI BAR ═══ */
.mbar-wrap { display: inline-block; width: 60px; height: 7px; border-radius: 99px; background: #f1f5f9; overflow: hidden; vertical-align: middle; margin-right: 6px; }
.mbar-fill { height: 100%; border-radius: 99px; transition: width .5s cubic-bezier(.4,0,.2,1); }
.mbar-g { background: linear-gradient(90deg,#22c55e,#4ade80); }
.mbar-a { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
.mbar-r { background: linear-gradient(90deg,#ef4444,#f87171); }
.mbar-pct { font-size: .73rem; font-weight: 600; color: #6b7280; }

/* ═══ ALERT BARS ═══ */
.estado-bars { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.ebar-row { display: flex; align-items: center; gap: 12px; }
.ebar-lbl { font-size: .78rem; color: #6b7280; min-width: 100px; text-transform: capitalize; font-weight: 500; }
.ebar-track { flex: 1; height: 9px; border-radius: 99px; background: rgba(0,0,0,.04); overflow: hidden; }
.ebar-fill { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }
.ebar-amber { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
.ebar-blue  { background: linear-gradient(90deg,#3b82f6,#60a5fa); }
.ebar-green { background: linear-gradient(90deg,#22c55e,#4ade80); }
.ebar-gray  { background: linear-gradient(90deg,#94a3b8,#cbd5e1); }
.ebar-val { font-size: .78rem; font-weight: 700; color: #374151; min-width: 26px; text-align: right; }

/* ═══ PILLS ═══ */
.pill { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 99px; font-size: .67rem; font-weight: 700; white-space: nowrap; letter-spacing: .01em; }
.pill-g    { background: rgba(22,163,74,.1);   color: #15803d; }
.pill-b    { background: rgba(37,99,235,.1);   color: #1d4ed8; }
.pill-p    { background: rgba(124,58,237,.1);  color: #6d28d9; }
.pill-r    { background: rgba(220,38,38,.1);   color: #dc2626; }
.pill-amber{ background: rgba(217,119,6,.1);   color: #92400e; }
.pill-gray { background: rgba(100,116,139,.1); color: #64748b; }

/* ═══ ROLES ═══ */
.roles-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.role-chip {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 14px 22px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(27,107,58,.05), rgba(27,107,58,.02));
  border: 1px solid rgba(27,107,58,.1);
  min-width: 80px;
  transition: transform .15s ease;
}
.role-chip:hover { transform: translateY(-2px); }
.rc-num { font-size: 1.5rem; font-weight: 800; color: #1B6B3A; letter-spacing: -.03em; line-height: 1; }
.rc-lbl { font-size: .68rem; color: #6b7280; font-weight: 500; text-align: center; }

/* ═══ QUALITY ═══ */
.q-bars { display: flex; flex-direction: column; gap: 12px; margin-top: 6px; }
.q-row { display: flex; align-items: center; gap: 12px; }
.q-lbl { font-size: .78rem; color: #6b7280; min-width: 190px; font-weight: 500; }
.q-track { flex: 1; height: 8px; border-radius: 99px; background: rgba(0,0,0,.04); overflow: hidden; }
.q-fill { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }
.qg { background: linear-gradient(90deg,#22c55e,#4ade80); }
.qa { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
.qr { background: linear-gradient(90deg,#ef4444,#f87171); }
.q-pct { font-size: .78rem; font-weight: 700; min-width: 36px; text-align: right; }
.tc-g { color: #16a34a; }
.tc-a { color: #d97706; }
.tc-r { color: #dc2626; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1100px) {
  .kpi-row { grid-template-columns: repeat(3,1fr); }
  .charts-2col { grid-template-columns: 1fr; }
  .tbl-2col { grid-template-columns: 1fr; }
  .precio-cards { grid-template-columns: repeat(2,1fr); }
  .map-body { flex-direction: column; }
  .side-panel { width: 100%; border-left: none; border-top: 1px solid rgba(0,0,0,.05); }
}
/* iPad/tablet: topbar baja a 52px desde 1024px */
@media (max-width: 1024px) {
  .dash-sticky { top: 52px; }
}
@media (max-width: 768px) {
  .tabs-nav-flat { display: none; }
  .tabs-carousel { display: flex; }
  .panel { padding: calc(var(--sticky-h, 169px) + 16px) 1.25rem 20px; gap: 10px; }
  .dash-hero { padding: .65rem 1.25rem .75rem; border-radius: 0 0 20px 20px; margin: 0; }
  .dash-title { font-size: 1.2rem; }
  .kpi-row { grid-template-columns: repeat(2,1fr); gap: 8px; }
  .kpi-3, .kpi-4 { grid-template-columns: repeat(2,1fr); }
  .kpi { padding: 14px 14px; }
  .kpi-val { font-size: 1.15rem; }
  .kpi-ico { width: 36px; height: 36px; }
  .precio-cards { grid-template-columns: 1fr 1fr; }
  .charts-2col { grid-template-columns: 1fr; }
  .tbl-2col { grid-template-columns: 1fr; }
  .def-lbl { min-width: 120px; }
  .q-lbl { min-width: 130px; }
  .p-title { font-size: 1.1rem; }
}
@media (max-width: 480px) {
  .dash-hero { padding: .55rem .85rem .65rem; border-radius: 0 0 16px 16px; margin: 0; }
  .filters-bar { margin: 8px .85rem 0; flex-direction: column; align-items: stretch; gap: 8px; border-radius: 18px; }
  .filter-item { flex-direction: column; align-items: stretch; gap: 4px; }
  .filter-sel { min-width: 100%; }
  .dash-title { font-size: 1.05rem; }
  .panel { padding: calc(var(--sticky-h, 160px) + 12px) .85rem 16px; gap: 8px; }
  .kpi-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi { padding: 12px 12px; gap: 10px; }
  .kpi-val { font-size: 1rem; }
  .kpi-lbl { font-size: .6rem; }
  .kpi-ico { width: 32px; height: 32px; border-radius: 10px; }
  .precio-cards { grid-template-columns: 1fr 1fr; }
  .glass-card { padding: 14px 15px; border-radius: 14px; }
  .dt th, .dt td { padding: 8px 10px; font-size: .74rem; }
  .role-chip { padding: 10px 14px; min-width: 64px; }
  .rc-num { font-size: 1.2rem; }
  .panel-title { font-size: .95rem; }
  .vision-title { font-size: .95rem; }
  .panel-badge, .vision-badge { display: none; }
  .roles-row { gap: 6px; }
}
</style>
