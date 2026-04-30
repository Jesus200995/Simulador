<template>
  <AppShell>
    <div class="dash">

      <!-- ─── HERO HEADER ─── -->
      <div class="dash-hero">
        <div class="dash-hero-inner">
          <div class="dash-hero-text">
            <p class="dash-eyebrow">SIMAC — Sistema de Monitoreo</p>
            <h1 class="dash-title">Dashboard Administrativo</h1>
            <p class="dash-subtitle">Vision global de la produccion agricola en tiempo real</p>
          </div>
          <div class="header-right">
            <span class="dash-date">{{ fechaActual }}</span>
            <button class="btn-refresh" :class="{ spinning: cargando }" @click="recargarTodo" title="Actualizar datos">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── FILTROS GLOBALES ─── -->
      <section class="filters-bar">
        <svg class="filter-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
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
        <button v-if="filtros.estado || filtros.ciclo" class="btn-clear-f" @click="limpiarFiltros">Limpiar</button>
      </section>

      <!-- ─── LOADER INICIAL ─── -->
      <div v-if="cargandoInicial" class="loader-row">
        <div class="loader"></div><span>Cargando datos del sistema...</span>
      </div>

      <template v-else>
        <!-- ─── TABS NAV ─── -->
        <nav class="tabs-nav">
          <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: tabActiva === t.key }" @click="setTab(t.key)">
            <span class="tab-icon" v-html="t.icon"></span>
            <span class="tab-lbl">{{ t.label }}</span>
          </button>
        </nav>

        <!-- ════════════ PANEL 1: VISION GENERAL ════════════ -->
        <div v-if="tabActiva === 'vision'" class="panel fade-in">
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
              <h2 class="sec-heading">Mapa general del sistema</h2>
              <nav class="maptabs">
                <button v-for="t in mapTabs" :key="t" class="mtab" :class="{ active: mapTab === t }" @click="setMapTab(t)">{{ t }}</button>
              </nav>
            </div>
            <div class="map-body">
              <div ref="mapContainer" class="map-cont"></div>
              <aside class="side-panel">
                <h3 class="side-heading">Insights prioritarios</h3>
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
            <h2 class="sec-heading">Resumen por estado</h2>
            <div class="tbl-wrap">
              <table class="dt">
                <thead><tr><th>Estado</th><th>UPs</th><th>Productores</th><th>Superficie (ha)</th><th>Produccion est. (ton)</th></tr></thead>
                <tbody>
                  <tr v-for="row in filteredEstadoRows" :key="row.estado">
                    <td class="td-b">{{ row.estado || '—' }}</td>
                    <td>{{ row.ups }}</td>
                    <td>{{ row.productores }}</td>
                    <td>{{ fmtNum(row.superficie_ha) }}</td>
                    <td>{{ fmtNum(row.produccion_ton) }}</td>
                  </tr>
                  <tr v-if="!filteredEstadoRows.length"><td colspan="5" class="td-empty">Sin datos disponibles</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- ════════════ PANEL 2: PRODUCCION ════════════ -->
        <div v-else-if="tabActiva === 'produccion'" class="panel fade-in">
          <div v-if="!produccion" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-3">
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(26,92,56,.08);color:#15803d"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(produccion.por_anio?.[0]?.area_ha ?? 0) }} ha</span><span class="kpi-lbl">Superficie sembrada (ano actual)</span></div>
              </div>
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(37,99,235,.08);color:#2563eb"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ produccion.por_anio?.[0]?.ups ?? 0 }}</span><span class="kpi-lbl">UPs con produccion registrada</span></div>
              </div>
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(217,119,6,.08);color:#d97706"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ produccion.ups_sin_ciclo ?? 0 }}</span><span class="kpi-lbl">UPs sin ciclo registrado</span></div>
              </div>
            </div>
            <div class="charts-2col">
              <div class="glass-card chart-card">
                <h3 class="card-hdg">Produccion estimada por estado (ton)</h3>
                <div class="cwrap"><Bar v-if="produccionBarData" :data="produccionBarData" :options="barOpts"/><div v-else class="cph">Sin datos</div></div>
              </div>
              <div class="glass-card chart-card">
                <h3 class="card-hdg">Distribucion de ciclos (ha sembradas)</h3>
                <div class="cwrap cwrap-sm"><Doughnut v-if="cicloDonutData" :data="cicloDonutData" :options="donutOpts"/><div v-else class="cph">Sin datos</div></div>
              </div>
            </div>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Produccion por estado</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Estado</th><th>UPs</th><th>Cultivos</th><th>Area (ha)</th><th>Produccion (ton)</th></tr></thead>
                  <tbody>
                    <tr v-for="row in filteredProduccionEstado" :key="row.estado">
                      <td class="td-b">{{ row.estado || '—' }}</td><td>{{ row.ups }}</td><td>{{ row.cultivos }}</td><td>{{ fmtNum(row.area_ha) }}</td><td>{{ fmtNum(row.produccion_ton) }}</td>
                    </tr>
                    <tr v-if="!filteredProduccionEstado.length"><td colspan="5" class="td-empty">Sin datos</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Por tipo de ciclo</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Tipo</th><th>Ano</th><th>Ciclos</th><th>Cultivos</th><th>Area (ha)</th></tr></thead>
                  <tbody>
                    <tr v-for="row in filteredCiclos" :key="`${row.cycle_type}-${row.cycle_year}`">
                      <td><span class="pill" :class="row.cycle_type==='PV'?'pill-g':'pill-b'">{{ row.cycle_type }}</span></td>
                      <td>{{ row.cycle_year }}</td><td>{{ row.ciclos }}</td><td>{{ row.cultivos }}</td><td>{{ fmtNum(row.area_ha) }}</td>
                    </tr>
                    <tr v-if="!filteredCiclos.length"><td colspan="5" class="td-empty">Sin datos</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 3: INFRAESTRUCTURA ════════════ -->
        <div v-else-if="tabActiva === 'infraestructura'" class="panel fade-in">
          <div v-if="!infraestructura" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-4">
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(124,58,237,.08);color:#7c3aed"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ infraestructura.bodegas_aprobadas }}</span><span class="kpi-lbl">Bodegas activas</span></div>
              </div>
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(37,99,235,.08);color:#2563eb"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21V8l9-5 9 5v13"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(infraestructura.capacidad_total_ton) }}</span><span class="kpi-lbl">Capacidad total (ton)</span></div>
              </div>
              <div class="kpi glass-card">
                <div class="kpi-ico" style="background:rgba(14,148,148,.08);color:#0e9494"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ fmtCompact(infraestructura.stock_actual_ton) }}</span><span class="kpi-lbl">Stock actual (ton)</span></div>
              </div>
              <div class="kpi glass-card" :class="infraestructura.ocupacion_pct >= 90 ? 'kpi-alert' : ''">
                <div class="kpi-ico" :style="infraestructura.ocupacion_pct>=90?'background:rgba(220,38,38,.08);color:#dc2626':'background:rgba(217,119,6,.08);color:#d97706'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ infraestructura.ocupacion_pct }}%</span><span class="kpi-lbl">Ocupacion bodegas</span></div>
              </div>
            </div>
            <section class="glass-card deficit-card">
              <h3 class="sec-heading">Produccion estimada vs Capacidad de almacenamiento</h3>
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
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Bodegas por estado</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Estado</th><th>Bodegas</th><th>Capacidad (ton)</th></tr></thead>
                  <tbody>
                    <tr v-for="row in infraestructura.por_estado" :key="row.estado"><td class="td-b">{{ row.estado||'—' }}</td><td>{{ row.total_bodegas }}</td><td>{{ fmtNum(row.capacidad_ton) }}</td></tr>
                    <tr v-if="!infraestructura.por_estado?.length"><td colspan="3" class="td-empty">Sin datos</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Top bodegas por capacidad</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Bodega</th><th>Estado</th><th>Municipio</th><th>Capacidad (ton)</th><th>Stock (ton)</th><th>Ocupacion</th></tr></thead>
                  <tbody>
                    <tr v-for="b in infraestructura.top_bodegas" :key="b.nombre">
                      <td class="td-b">{{ b.nombre }}</td><td>{{ b.estado }}</td><td>{{ b.municipio }}</td><td>{{ fmtNum(b.capacidad_toneladas) }}</td><td>{{ fmtNum(b.stock_actual) }}</td>
                      <td><div class="mbar-wrap"><div class="mbar-fill" :class="mbarClass(b)" :style="{ width: mbarPct(b)+'%' }"></div></div><span class="mbar-pct">{{ mbarPct(b) }}%</span></td>
                    </tr>
                    <tr v-if="!infraestructura.top_bodegas?.length"><td colspan="6" class="td-empty">Sin datos</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 4: PRECIOS ════════════ -->
        <div v-else-if="tabActiva === 'precios'" class="panel fade-in">
          <div v-if="!precios" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="precio-cards">
              <div class="pc pc-green"><span class="pc-tipo">Precio a pie de parcela</span><span class="pc-val">${{ fmtPrice(precioParcela) }}</span><span class="pc-unit">MXN/ton — promedio 30 dias</span></div>
              <div class="pc pc-blue"><span class="pc-tipo">Precio de bodega</span><span class="pc-val">${{ fmtPrice(precioBodega) }}</span><span class="pc-unit">MXN/ton — promedio 30 dias</span></div>
              <div class="pc pc-purple"><span class="pc-tipo">Precio internacional</span><span class="pc-val">${{ fmtPrice(precioInternacional) }}</span><span class="pc-unit">MXN/ton — ultimo registrado</span></div>
              <div class="pc pc-amber"><span class="pc-tipo">Brecha (bodega − parcela)</span><span class="pc-val" :class="brechaPrecio>=0?'pc-pos':'pc-neg'">{{ brechaPrecio>=0?'+':'' }}${{ fmtPrice(brechaPrecio) }}</span><span class="pc-unit">Diferencia promedio</span></div>
            </div>
            <section class="glass-card chart-card chart-tall">
              <h3 class="card-hdg">Tendencia de los tres precios — ultimas semanas</h3>
              <div class="cwrap cwrap-lg"><Line v-if="preciosLineData" :data="preciosLineData" :options="lineOpts"/><div v-else class="cph">Sin datos de tendencia. Registre precios para ver la grafica.</div></div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Promedios ultimos 30 dias</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Tipo</th><th>Maiz</th><th>Promedio</th><th>Minimo</th><th>Maximo</th><th>Registros</th><th>Ultima act.</th></tr></thead>
                  <tbody>
                    <tr v-for="row in precios.promedios" :key="`${row.tipo_precio}-${row.tipo_maiz}`">
                      <td><span class="pill" :class="tipoPrecioClass(row.tipo_precio)">{{ tipoPrecioLabel(row.tipo_precio) }}</span></td>
                      <td>{{ row.tipo_maiz }}</td><td class="td-b">${{ fmtPrice(row.promedio) }}</td><td>${{ fmtPrice(row.minimo) }}</td><td>${{ fmtPrice(row.maximo) }}</td><td>{{ row.registros }}</td><td>{{ fmtFecha(row.ultima_fecha) }}</td>
                    </tr>
                    <tr v-if="!precios.promedios?.length"><td colspan="7" class="td-empty">Sin registros en los ultimos 30 dias</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 5: ALERTAS ════════════ -->
        <div v-else-if="tabActiva === 'alertas'" class="panel fade-in">
          <div v-if="!alertasData" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <div class="kpi-row kpi-4">
              <div v-for="n in alertasData.por_nivel" :key="n.nivel_alerta" class="kpi glass-card">
                <div class="kpi-ico" :style="nivelStyle(n.nivel_alerta)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                <div class="kpi-body"><span class="kpi-val">{{ n.total }}</span><span class="kpi-lbl">{{ nivelLabel(n.nivel_alerta) }}</span></div>
              </div>
            </div>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Estado de alertas</h3>
              <div class="estado-bars">
                <div v-for="e in alertasData.por_estado" :key="e.estado_alerta" class="ebar-row">
                  <span class="ebar-lbl">{{ e.estado_alerta }}</span>
                  <div class="ebar-track"><div class="ebar-fill" :class="estadoAlertaClass(e.estado_alerta)" :style="{ width: maxAlertaEstado>0 ? Math.round((e.total/maxAlertaEstado)*100)+'%':'0%' }"></div></div>
                  <span class="ebar-val">{{ e.total }}</span>
                </div>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Alertas pendientes — mas criticas</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Severidad</th><th>Tipo</th><th>Productor</th><th>UP</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    <tr v-for="a in alertasData.recientes_pendientes" :key="a.id">
                      <td><span class="pill" :class="nivelPillClass(a.nivel_alerta)">{{ nivelLabel(a.nivel_alerta) }}</span></td>
                      <td>{{ a.tipo_alerta }}</td><td>{{ a.nombres ? `${a.nombres} ${a.apellido_paterno}` : '—' }}</td><td>{{ a.up_name||'—' }}</td><td>{{ a.state_name||'—' }}</td><td>{{ fmtFecha(a.fecha_alerta) }}</td>
                    </tr>
                    <tr v-if="!alertasData.recientes_pendientes?.length"><td colspan="6" class="td-empty">No hay alertas pendientes</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Tipos de alerta pendientes</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>Tipo de alerta</th><th>Nivel</th><th>Total</th></tr></thead>
                  <tbody>
                    <tr v-for="t in alertasData.por_tipo" :key="`${t.tipo_alerta}-${t.nivel_alerta}`">
                      <td>{{ t.tipo_alerta }}</td><td><span class="pill" :class="nivelPillClass(t.nivel_alerta)">{{ nivelLabel(t.nivel_alerta) }}</span></td><td>{{ t.total }}</td>
                    </tr>
                    <tr v-if="!alertasData.por_tipo?.length"><td colspan="3" class="td-empty">Sin alertas pendientes</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>

        <!-- ════════════ PANEL 6: OPERACION ════════════ -->
        <div v-else-if="tabActiva === 'operacion'" class="panel fade-in">
          <div v-if="!operacion" class="loader-row"><div class="loader"></div></div>
          <template v-else>
            <section class="glass-card roles-card">
              <h3 class="sec-heading">Usuarios activos por rol</h3>
              <div class="roles-row">
                <div v-for="r in operacion.usuarios_por_rol" :key="r.rol" class="role-chip">
                  <span class="rc-num">{{ r.total }}</span>
                  <span class="rc-lbl">{{ rolLabel(r.rol) }}</span>
                </div>
              </div>
            </section>
            <section class="glass-card quality-card">
              <h3 class="sec-heading">Calidad de datos — UPs ({{ operacion.calidad_datos.total_ups }} total)</h3>
              <div class="q-bars">
                <div v-for="q in calidadItems" :key="q.label" class="q-row">
                  <span class="q-lbl">{{ q.label }}</span>
                  <div class="q-track"><div class="q-fill" :class="q.pct>=80?'qg':q.pct>=50?'qa':'qr'" :style="{ width: q.pct+'%' }"></div></div>
                  <span class="q-pct" :class="q.pct>=80?'tc-g':q.pct>=50?'tc-a':'tc-r'">{{ q.pct }}%</span>
                </div>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Ranking de supervisores — ultimos 30 dias</h3>
              <div class="tbl-wrap">
                <table class="dt">
                  <thead><tr><th>#</th><th>Supervisor</th><th>Email</th><th>Productores</th><th>Visitas</th></tr></thead>
                  <tbody>
                    <tr v-for="(s, i) in operacion.supervisores" :key="s.supervisor_id">
                      <td class="td-rank">{{ (i as number)+1 }}</td><td class="td-b">{{ s.nombre_completo }}</td><td class="td-muted">{{ s.email }}</td><td>{{ s.productores_asignados }}</td>
                      <td><span class="pill" :class="s.visitas_mes>0?'pill-g':'pill-gray'">{{ s.visitas_mes }} visita{{ s.visitas_mes!==1?'s':'' }}</span></td>
                    </tr>
                    <tr v-if="!operacion.supervisores?.length"><td colspan="5" class="td-empty">Sin supervisores</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="glass-card tbl-card">
              <h3 class="sec-heading">Ultimas visitas de campo</h3>
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

// ── Map ──
const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []
const mapTab = ref('UPs')
const mapTabs = ['UPs', 'Bodegas', 'Alertas']

// ── Tabs config ──
function setTab(k: string) { tabActiva.value = k as typeof tabActiva.value }

const tabs: Array<{ key: typeof tabActiva.value; label: string; icon: string }> = [
  { key: 'vision',         label: 'Vision general',   icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { key: 'produccion',     label: 'Produccion',        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><polyline points="18 9 12 15 8 11 3 16"/></svg>' },
  { key: 'infraestructura',label: 'Infraestructura',   icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>' },
  { key: 'precios',        label: 'Precios',           icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { key: 'alertas',        label: 'Alertas',           icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { key: 'operacion',      label: 'Operacion',         icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
]

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

onMounted(() => loadAll())
onUnmounted(() => { if (map) { map.remove(); map = null } })
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
.glass-card {
  background: #fff;
  border: 1px solid #e8edf2;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  padding: 16px 18px;
}
.panel { display: flex; flex-direction: column; gap: 10px; padding: 14px 3rem 24px; }
@keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeIn .18s ease; }

/* ═══ HERO HEADER ═══ */
.dash-hero {
  background: linear-gradient(160deg, var(--color-primary-darker) 0%, var(--color-primary) 55%, var(--color-primary-hover) 100%);
  padding: 1.5rem 3rem 1.75rem;
  border-radius: 0 0 28px 28px;
  position: relative;
  overflow: hidden;
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
  gap: 10px;
  position: relative;
  z-index: 1;
}
.dash-hero-text { flex: 1; min-width: 0; }
.dash-eyebrow { font-size: .72rem; font-weight: 600; color: rgba(255,255,255,.55); margin: 0 0 3px; letter-spacing: .06em; text-transform: uppercase; }
.dash-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0 0 2px; letter-spacing: -.025em; }
.dash-subtitle { font-size: .8rem; color: rgba(255,255,255,.65); margin: 0; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dash-date { font-size: .74rem; color: rgba(255,255,255,.5); text-transform: capitalize; }
.btn-refresh {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.1);
  backdrop-filter: blur(6px);
  cursor: pointer; color: rgba(255,255,255,.85); transition: all .15s;
}
.btn-refresh:hover { background: rgba(255,255,255,.18); }
.btn-refresh.spinning svg { animation: spin .8s linear infinite; }

/* ═══ FILTERS ═══ */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 3rem;
  background: #fff;
  border-bottom: 1px solid #e8edf2;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
}
.filter-icon { color: #94a3b8; flex-shrink: 0; }
.filter-item { display: flex; flex-direction: column; gap: 2px; }
.filter-lbl { font-size: .64rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
.filter-sel {
  font-size: .82rem; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 5px 10px; background: #fff; color: #334155; outline: none;
  min-width: 150px; cursor: pointer; transition: border .15s;
}
.filter-sel:focus { border-color: #1a5c38; }
.filter-spacer { flex: 1; }
.filter-badge {
  font-size: .69rem; font-weight: 600; padding: 2px 10px;
  border-radius: 99px; background: rgba(26,92,56,.08); color: #15803d;
}
.btn-clear-f {
  font-size: .76rem; padding: 4px 10px; border-radius: 7px;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  transition: background .12s;
}
.btn-clear-f:hover { background: #f1f5f9; }

/* ═══ LOADER ═══ */
.loader-row { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 16px; color: #94a3b8; font-size: .85rem; }
.loader { width: 22px; height: 22px; border: 2.5px solid #e2e8f0; border-top-color: #1a5c38; border-radius: 50%; animation: spin .7s linear infinite; }

/* ═══ TABS NAV ═══ */
.tabs-nav {
  display: flex;
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #e8edf2;
  padding: 0 3rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs-nav::-webkit-scrollbar { display: none; }
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px; border: none; background: none;
  font-size: .8rem; font-weight: 500; color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer; transition: all .12s; white-space: nowrap;
  border-radius: 0;
}
.tab-btn:hover { color: #1a5c38; background: rgba(26,92,56,.03); }
.tab-btn.active {
  color: #1a5c38; font-weight: 650;
  border-bottom-color: #1a5c38;
  background: rgba(26,92,56,.04);
}
.tab-icon { display: flex; align-items: center; }
.tab-lbl { white-space: nowrap; }

/* ═══ KPI ROW ═══ */
.kpi-row { display: grid; grid-template-columns: repeat(6,1fr); gap: 10px; padding: 14px 3rem 0; }
.kpi-3 { grid-template-columns: repeat(3,1fr); }
.kpi-4 { grid-template-columns: repeat(4,1fr); }
.kpi {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  transition: transform .15s, box-shadow .15s;
  cursor: default;
}
.kpi:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.08); }
.kpi.kpi-alert { border-color: rgba(220,38,38,.2) !important; }
.kpi-ico {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-body { display: flex; flex-direction: column; min-width: 0; }
.kpi-val { font-size: 1.3rem; font-weight: 700; line-height: 1.1; color: #0f172a; letter-spacing: -.025em; }
.kpi-lbl { font-size: .66rem; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ═══ HEADINGS ═══ */
.sec-heading { font-size: .92rem; font-weight: 650; color: #0f172a; margin: 0 0 12px; }
.card-hdg { font-size: .86rem; font-weight: 600; color: #0f172a; margin: 0 0 12px; }

/* ═══ MAP CARD ═══ */
.map-card { padding: 0; overflow: hidden; }
.map-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 10px; flex-wrap: wrap; gap: 8px;
  border-bottom: 1px solid #e8edf2;
}
.map-hdr .sec-heading { margin: 0; }
.maptabs { display: flex; gap: 3px; }
.mtab {
  padding: 4px 13px; border-radius: 99px; border: none;
  font-size: .76rem; font-weight: 550; cursor: pointer;
  background: #f1f5f9; color: #64748b; transition: all .12s;
}
.mtab.active { background: #1a5c38; color: #fff; }
.mtab:hover:not(.active) { background: #e2e8f0; }
.map-body { display: flex; min-height: 380px; }
.map-cont { flex: 1; min-height: 380px; }
.side-panel {
  width: 240px; flex-shrink: 0; padding: 16px 18px;
  border-left: 1px solid #f1f5f9;
  display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
}
.side-heading { font-size: .82rem; font-weight: 650; color: #0f172a; margin: 0; }
.ins-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ins-item { display: flex; align-items: flex-start; gap: 7px; font-size: .77rem; color: #475569; line-height: 1.45; }
.ins-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.ins-dot.green { background: #22c55e; }
.ins-dot.red { background: #ef4444; }
.ins-dot.amber { background: #f59e0b; }
.ins-dot.blue { background: #3b82f6; }
.ins-empty { font-size: .78rem; color: #94a3b8; margin: 0; }
.map-leyenda { margin-top: auto; display: flex; flex-direction: column; gap: 5px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
.ley-row { display: flex; align-items: center; gap: 6px; font-size: .75rem; color: #64748b; }
.ley-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ═══ TABLES ═══ */
.tbl-card { padding-bottom: 14px; }
.tbl-wrap { overflow-x: auto; margin-top: 2px; }
.dt { width: 100%; border-collapse: collapse; font-size: .8rem; }
.dt thead tr { border-bottom: 1.5px solid #f1f5f9; }
.dt th {
  padding: 8px 12px; text-align: left; font-weight: 600;
  color: #94a3b8; font-size: .68rem; text-transform: uppercase;
  letter-spacing: .05em; white-space: nowrap;
}
.dt td { padding: 9px 12px; color: #475569; border-bottom: 1px solid #f8fafc; }
.dt tbody tr:last-child td { border-bottom: none; }
.dt tbody tr:hover td { background: #fafafa; }
.td-b { font-weight: 600; color: #0f172a; }
.td-muted { color: #94a3b8; }
.td-rank { font-weight: 700; color: #1a5c38; width: 28px; }
.td-empty { text-align: center; color: #94a3b8; padding: 24px 12px !important; font-size: .8rem; }

/* ═══ CHARTS ═══ */
.charts-2col { display: grid; grid-template-columns: 1.6fr 1fr; gap: 10px; }
.chart-card { display: flex; flex-direction: column; }
.cwrap { height: 210px; position: relative; }
.cwrap-sm { height: 210px; }
.cwrap-lg { height: 260px; }
.cph { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: .82rem; text-align: center; padding: 20px; }

/* ═══ PRICE CARDS ═══ */
.precio-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.pc { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 12px; border: 1.5px solid transparent; }
.pc-tipo { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; opacity: .65; }
.pc-val { font-size: 1.65rem; font-weight: 800; letter-spacing: -.03em; color: #0f172a; }
.pc-unit { font-size: .68rem; opacity: .55; }
.pc-pos { color: #16a34a !important; }
.pc-neg { color: #dc2626 !important; }
.pc-green { background: rgba(22,163,74,.05); border-color: rgba(22,163,74,.18); color: #15803d; }
.pc-blue  { background: rgba(37,99,235,.05); border-color: rgba(37,99,235,.18); color: #1d4ed8; }
.pc-purple{ background: rgba(124,58,237,.05); border-color: rgba(124,58,237,.18); color: #6d28d9; }
.pc-amber { background: rgba(217,119,6,.05); border-color: rgba(217,119,6,.18); color: #92400e; }

/* ═══ DEFICIT CARD ═══ */
.def-body { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
.def-row { display: flex; align-items: center; gap: 12px; }
.def-lbl { font-size: .79rem; color: #475569; min-width: 190px; }
.def-track { flex: 1; height: 8px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.def-bar { height: 100%; border-radius: 99px; transition: width .6s ease; }
.def-prod { background: #1a5c38; }
.def-cap  { background: #2563eb; }
.def-val { font-size: .84rem; font-weight: 600; color: #0f172a; min-width: 72px; text-align: right; }
.def-summary { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 9px; font-size: .81rem; font-weight: 500; }
.def-summary.surplus { background: rgba(22,163,74,.07); color: #15803d; border: 1px solid rgba(22,163,74,.18); }
.def-summary.deficit  { background: rgba(220,38,38,.06); color: #dc2626; border: 1px solid rgba(220,38,38,.18); }

/* ═══ MINI BAR ═══ */
.mbar-wrap { display: inline-block; width: 56px; height: 6px; border-radius: 99px; background: #f1f5f9; overflow: hidden; vertical-align: middle; margin-right: 5px; }
.mbar-fill { height: 100%; border-radius: 99px; transition: width .4s; }
.mbar-g { background: #22c55e; }
.mbar-a { background: #f59e0b; }
.mbar-r { background: #ef4444; }
.mbar-pct { font-size: .75rem; font-weight: 500; color: #64748b; }

/* ═══ ALERT BARS ═══ */
.estado-bars { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
.ebar-row { display: flex; align-items: center; gap: 10px; }
.ebar-lbl { font-size: .79rem; color: #475569; min-width: 96px; text-transform: capitalize; }
.ebar-track { flex: 1; height: 8px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.ebar-fill { height: 100%; border-radius: 99px; transition: width .5s; }
.ebar-amber { background: #f59e0b; }
.ebar-blue  { background: #3b82f6; }
.ebar-green { background: #22c55e; }
.ebar-gray  { background: #94a3b8; }
.ebar-val { font-size: .79rem; font-weight: 600; color: #334155; min-width: 24px; text-align: right; }

/* ═══ PILLS ═══ */
.pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 99px; font-size: .69rem; font-weight: 600; white-space: nowrap; }
.pill-g    { background: rgba(22,163,74,.1);   color: #15803d; }
.pill-b    { background: rgba(37,99,235,.1);   color: #1d4ed8; }
.pill-p    { background: rgba(124,58,237,.1);  color: #6d28d9; }
.pill-r    { background: rgba(220,38,38,.1);   color: #dc2626; }
.pill-amber{ background: rgba(217,119,6,.1);   color: #92400e; }
.pill-gray { background: rgba(100,116,139,.1); color: #475569; }

/* ═══ ROLES ═══ */
.roles-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.role-chip {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-radius: 9px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.rc-num { font-size: 1.15rem; font-weight: 700; color: #1a5c38; }
.rc-lbl { font-size: .79rem; color: #475569; }

/* ═══ QUALITY ═══ */
.q-bars { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.q-row { display: flex; align-items: center; gap: 10px; }
.q-lbl { font-size: .79rem; color: #475569; min-width: 180px; }
.q-track { flex: 1; height: 7px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
.q-fill { height: 100%; border-radius: 99px; transition: width .5s; }
.qg { background: #22c55e; }
.qa { background: #f59e0b; }
.qr { background: #ef4444; }
.q-pct { font-size: .79rem; font-weight: 600; min-width: 34px; text-align: right; }
.tc-g { color: #15803d; }
.tc-a { color: #92400e; }
.tc-r { color: #dc2626; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1100px) {
  .kpi-row { grid-template-columns: repeat(3,1fr); }
  .charts-2col { grid-template-columns: 1fr; }
  .precio-cards { grid-template-columns: repeat(2,1fr); }
  .map-body { flex-direction: column; }
  .side-panel { width: 100%; border-left: none; border-top: 1px solid #e8edf2; }
}
@media (max-width: 768px) {
  .dash-hero { padding: 1.25rem 1rem 1.5rem; border-radius: 0 0 22px 22px; }
  .dash-title { font-size: 1.2rem; }
  .panel { padding: 10px 1.25rem 16px; gap: 8px; }
  .kpi-row { grid-template-columns: repeat(2,1fr); gap: 8px; padding: 10px 1.25rem 0; }
  .kpi-3, .kpi-4 { grid-template-columns: repeat(2,1fr); }
  .kpi { padding: 12px 13px; }
  .kpi-val { font-size: 1.1rem; }
  .kpi-ico { width: 32px; height: 32px; }
  .precio-cards { grid-template-columns: 1fr 1fr; }
  .charts-2col { grid-template-columns: 1fr; }
  .def-lbl { min-width: 120px; }
  .q-lbl { min-width: 130px; }
  .tab-btn { padding: 8px 10px; font-size: .76rem; }
  .tabs-nav { padding: 0 1rem; }
  .filters-bar { padding: 8px 1.25rem; }
}
@media (max-width: 480px) {
  .dash-hero { padding: 1rem .85rem 1.35rem; border-radius: 0 0 18px 18px; }
  .dash-title { font-size: 1.08rem; }
  .panel { padding: 8px .85rem 14px; gap: 7px; }
  .kpi-row { grid-template-columns: 1fr 1fr; gap: 7px; padding: 8px .85rem 0; }
  .kpi { padding: 10px 11px; gap: 8px; }
  .kpi-val { font-size: .96rem; }
  .kpi-lbl { font-size: .62rem; }
  .kpi-ico { width: 28px; height: 28px; }
  .precio-cards { grid-template-columns: 1fr 1fr; }
  .glass-card { padding: 13px 14px; border-radius: 10px; }
  .dt th, .dt td { padding: 7px 9px; font-size: .74rem; }
  .tab-lbl { display: none; }
  .tab-btn { padding: 8px 11px; }
  .filters-bar { gap: 8px; }
  .filter-sel { min-width: 110px; }
}
</style>
