# SIMAC — Features Pendientes
## Documento 3 de 3 — Módulos por completar
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — implementar después de Doc 1 y Doc 2

> Este documento especifica funcionalidades que están parcialmente
> implementadas o que no existen aún. No son bugs — son features
> incompletas. Implementar en el orden sugerido por prioridad.

---

## FEATURE #1 — PRIORIDAD ALTA
### Mapa con toggle lista/mapa en Mis Bodegas
**ARCHIVO:** `app-bodega/src/pages/bodega/B05MisBodegas.tsx`
**ACCIÓN:** AGREGAR vista mapa con toggle

**Estado actual:** Solo existe vista lista. La spec define "vista lista + mapa con toggle".

**Agregar estado de vista:**
```typescript
const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
```

**Agregar toggle en el header de la página:**
```typescript
<div className="flex gap-2">
  <button
    onClick={() => setVista('lista')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      vista === 'lista'
        ? 'bg-[#1A5C38] text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    ☰ Lista
  </button>
  <button
    onClick={() => setVista('mapa')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      vista === 'mapa'
        ? 'bg-[#1A5C38] text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    🗺 Mapa
  </button>
</div>
```

**Agregar vista mapa con Leaflet (ya instalado en el proyecto):**
```typescript
{vista === 'mapa' && (
  <MapContainer
    center={[23.6345, -102.5528]}
    zoom={5}
    style={{ height: '500px', width: '100%', borderRadius: '12px' }}
  >
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      attribution="Esri"
    />
    {bodegas.map(bodega => (
      bodega.latitud && bodega.longitud ? (
        <Marker
          key={bodega.id}
          position={[bodega.latitud, bodega.longitud]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{bodega.nombre}</p>
              <p className="text-gray-600">{bodega.municipio}, {bodega.estado}</p>
              <p>Stock: {bodega.stock_actual_ton} ton</p>
              <div className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                bodega.estado_semaforo === 'comprando'
                  ? 'bg-green-100 text-green-800'
                  : bodega.estado_semaforo === 'limitado'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {bodega.estado_semaforo === 'comprando' ? '🟢 Comprando'
                  : bodega.estado_semaforo === 'limitado' ? '🟡 Cap. limitada'
                  : '🔴 No compra'}
              </div>
            </div>
          </Popup>
        </Marker>
      ) : null
    ))}
  </MapContainer>
)}
```

**VERIFICAR:** En Mis Bodegas → toggle "Mapa" → mapa Leaflet con marcadores de cada bodega del bodeguero. Clic en marcador → popup con nombre, municipio, stock y semáforo.

---

## FEATURE #2 — PRIORIDAD ALTA
### Mapa Global en Dashboard Admin con 3 capas toggle
**ARCHIVO NUEVO:** `app-bodega/src/components/admin/MapaGlobalAdmin.tsx`
**ARCHIVO MODIFICAR:** `app-bodega/src/pages/admin/DashboardAdminPage.tsx`

**Crear componente `MapaGlobalAdmin.tsx`:**
```typescript
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

interface MapaGlobalAdminProps {
  token: string;
  apiUrl: string;
}

export default function MapaGlobalAdmin({ token, apiUrl }: MapaGlobalAdminProps) {
  const [capas, setCapas] = useState({
    productores: true,
    bodegas: true,
    alertas: true
  });
  const [datos, setDatos] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/dashboard/admin/mapa`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setDatos)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Mapa Nacional — Actividad en tiempo real
        </h2>
        <div className="flex gap-4">
          {/* Checkboxes de capas */}
          {[
            { key: 'productores', label: '🌽 Productores', color: '#1A5C38' },
            { key: 'bodegas',     label: '🏭 Bodegas',     color: '#2563EB' },
            { key: 'alertas',     label: '🚨 Alertas',     color: '#DC2626' },
          ].map(capa => (
            <label key={capa.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={capas[capa.key as keyof typeof capas]}
                onChange={e => setCapas(prev => ({
                  ...prev, [capa.key]: e.target.checked
                }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium" style={{ color: capa.color }}>
                {capa.label}
              </span>
            </label>
          ))}
          {/* Filtro de estado */}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1"
          >
            <option value="">Todos los estados</option>
            {['Sinaloa','Jalisco','Guanajuato','Michoacán','Colima','Querétaro']
              .map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <MapContainer
        center={[23.6345, -102.5528]}
        zoom={5}
        style={{ height: '480px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Imagery"
        />

        {/* Capa Productores */}
        {capas.productores && datos?.ups?.map((up: any) => (
          (!filtroEstado || up.estado === filtroEstado) && (
            <CircleMarker
              key={`up-${up.id}`}
              center={[up.latitud, up.longitud]}
              radius={6}
              pathOptions={{ fillColor: '#1A5C38', color: '#1A5C38', fillOpacity: 0.8 }}
            >
              <Popup>
                <p className="font-semibold text-sm">{up.municipio}, {up.estado}</p>
                <p className="text-xs text-gray-600">Productor registrado</p>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Capa Bodegas */}
        {capas.bodegas && datos?.bodegas?.map((bodega: any) => (
          (!filtroEstado || bodega.estado === filtroEstado) && (
            <CircleMarker
              key={`bodega-${bodega.id}`}
              center={[bodega.latitud, bodega.longitud]}
              radius={8}
              pathOptions={{ fillColor: '#2563EB', color: '#2563EB', fillOpacity: 0.8 }}
            >
              <Popup>
                <p className="font-semibold text-sm">{bodega.nombre}</p>
                <p className="text-xs text-gray-600">{bodega.municipio}, {bodega.estado}</p>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Capa Alertas */}
        {capas.alertas && datos?.alertas?.map((alerta: any) => (
          (!filtroEstado || alerta.estado === filtroEstado) && (
            <CircleMarker
              key={`alerta-${alerta.id}`}
              center={[alerta.latitud, alerta.longitud]}
              radius={7}
              pathOptions={{ fillColor: '#DC2626', color: '#DC2626', fillOpacity: 0.8 }}
            >
              <Popup>
                <p className="font-semibold text-sm text-red-700">{alerta.tipo}</p>
                <p className="text-xs text-gray-600">{alerta.municipio}, {alerta.estado}</p>
              </Popup>
            </CircleMarker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
```

**Importar y agregar en `DashboardAdminPage.tsx` al final del contenido, debajo de los KPI cards:**
```typescript
import MapaGlobalAdmin from '../../components/admin/MapaGlobalAdmin';

// En el JSX, después de las 6 KPI cards:
<MapaGlobalAdmin token={token} apiUrl={API_URL} />
```

**VERIFICAR:** Dashboard Admin → mapa visible debajo de los KPIs → 3 capas toggle funcionando → marcadores de productores (verde), bodegas (azul) y alertas (rojo) visibles → filtro por estado hace zoom a los marcadores del estado seleccionado.

---

## FEATURE #3 — PRIORIDAD MEDIA
### Panel estadístico en Alertas Admin
**ARCHIVO:** `app-bodega/src/pages/admin/AlertasAdminPage.tsx`
**ACCIÓN:** AGREGAR panel colapsable con estadísticas

**Agregar estado:**
```typescript
const [mostrarStats, setMostrarStats] = useState(false);
```

**Agregar antes del layout principal de lista+mapa:**
```typescript
{/* Toggle estadísticas */}
<button
  onClick={() => setMostrarStats(!mostrarStats)}
  className="mb-4 px-4 py-2 text-sm font-medium text-[#1A5C38] border border-[#1A5C38] rounded-lg hover:bg-green-50"
>
  {mostrarStats ? '▲ Ocultar estadísticas' : '▼ Ver estadísticas'}
</button>

{mostrarStats && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {/* KPI — Productores potencialmente afectados */}
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="text-sm text-red-600 font-medium">Productores afectados</p>
      <p className="text-3xl font-bold text-red-700 mt-1">
        {stats?.productores_afectados?.toLocaleString('es-MX') ?? '—'}
      </p>
      <p className="text-xs text-red-500 mt-1">En zonas con alerta activa</p>
    </div>

    {/* KPI — Alertas activas */}
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm text-amber-600 font-medium">Alertas activas hoy</p>
      <p className="text-3xl font-bold text-amber-700 mt-1">
        {alertas.filter(a => a.estado === 'activa').length}
      </p>
    </div>

    {/* KPI — Atendidas este mes */}
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <p className="text-sm text-green-600 font-medium">Atendidas este mes</p>
      <p className="text-3xl font-bold text-green-700 mt-1">
        {alertas.filter(a => a.estado === 'atendida').length}
      </p>
    </div>
  </div>
)}
```

**VERIFICAR:** Botón "Ver estadísticas" → panel expandible con 3 KPIs → valores correctos según alertas en BD.

---

## FEATURE #4 — PRIORIDAD MEDIA
### Estadísticas demográficas en Productores Admin
**ARCHIVO:** `app-bodega/src/pages/admin/ProductoresAdminPage.tsx`
**ACCIÓN:** AGREGAR bloque colapsable de estadísticas del padrón

**Contexto técnico:** El género y la edad se calculan del CURP en el frontend:
- Posición 10 del CURP: `H` = Hombre, `M` = Mujer
- Posiciones 5-10: fecha de nacimiento (AAMMDD)

**Agregar función de utilidad:**
```typescript
const calcularGeneroDesadeCurp = (curp: string): 'H' | 'M' | null => {
  if (!curp || curp.length < 11) return null;
  const genero = curp[10]?.toUpperCase();
  return genero === 'H' || genero === 'M' ? genero : null;
};

const calcularEdadDesdeCurp = (curp: string): number | null => {
  if (!curp || curp.length < 10) return null;
  const anio = parseInt(curp.slice(4, 6));
  const mes = parseInt(curp.slice(6, 8));
  const dia = parseInt(curp.slice(8, 10));
  const anioCompleto = anio > 25 ? 1900 + anio : 2000 + anio;
  const nacimiento = new Date(anioCompleto, mes - 1, dia);
  const hoy = new Date();
  return Math.floor((hoy.getTime() - nacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};
```

**Agregar bloque de estadísticas (colapsable) antes de la tabla de productores:**
```typescript
{/* Estadísticas del padrón */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
  <h3 className="text-base font-semibold text-gray-900 mb-4">
    Estadísticas del padrón
  </h3>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="text-center">
      <p className="text-2xl font-bold text-[#1A5C38]">
        {productores.filter(p => calcularGeneroDesadeCurp(p.curp) === 'H').length}
      </p>
      <p className="text-sm text-gray-600">Hombres</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-blue-600">
        {productores.filter(p => calcularGeneroDesadeCurp(p.curp) === 'M').length}
      </p>
      <p className="text-sm text-gray-600">Mujeres</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-700">
        {Math.round(
          productores
            .map(p => calcularEdadDesdeCurp(p.curp))
            .filter(Boolean)
            .reduce((a, b) => a! + b!, 0)! /
          productores.filter(p => calcularEdadDesdeCurp(p.curp) !== null).length
        ) || '—'}
      </p>
      <p className="text-sm text-gray-600">Edad promedio</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-amber-600">
        {productores.filter(p => {
          const edad = calcularEdadDesdeCurp(p.curp);
          return edad !== null && edad >= 60;
        }).length}
      </p>
      <p className="text-sm text-gray-600">Mayores de 60</p>
    </div>
  </div>
</div>
```

**VERIFICAR:** Sección de estadísticas visible en Productores Admin con conteos de género y edad calculados dinámicamente del CURP.

---

## FEATURE #5 — PRIORIDAD MEDIA
### Tab Estadísticas en Bodegas Admin
**ARCHIVO:** `app-bodega/src/pages/admin/BodegasAdminPage.tsx`
**ACCIÓN:** AGREGAR tab de estadísticas

**Agregar estado:**
```typescript
const [tabActivo, setTabActivo] = useState<'lista' | 'estadisticas'>('lista');
```

**Agregar tabs en el header:**
```typescript
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setTabActivo('lista')}
    className={`px-4 py-2 rounded-lg text-sm font-medium ${
      tabActivo === 'lista'
        ? 'bg-[#1A5C38] text-white'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    Lista + Mapa
  </button>
  <button
    onClick={() => setTabActivo('estadisticas')}
    className={`px-4 py-2 rounded-lg text-sm font-medium ${
      tabActivo === 'estadisticas'
        ? 'bg-[#1A5C38] text-white'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    Estadísticas
  </button>
</div>
```

**Tab de estadísticas — KPIs principales:**
```typescript
{tabActivo === 'estadisticas' && (
  <div className="space-y-6">
    {/* KPIs */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        { label: 'Capacidad total', valor: `${stats?.capacidad_total?.toLocaleString('es-MX')} ton`, color: 'blue' },
        { label: 'Stock actual', valor: `${stats?.stock_total?.toLocaleString('es-MX')} ton`, color: 'green' },
        { label: '% Ocupación', valor: `${stats?.pct_ocupacion}%`, color: 'amber' },
        { label: 'Con tarifario', valor: stats?.con_tarifario, color: 'green' },
        { label: 'Ventanillas', valor: stats?.ventanillas_activas, color: 'purple' },
      ].map(kpi => (
        <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{kpi.valor ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  </div>
)}
```

**Endpoint requerido — agregar en `backend/src/routes/admin.ts`:**
```typescript
// GET /api/admin/bodegas/estadisticas
router.get('/bodegas/estadisticas', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        SUM(b.capacidad_almacenamiento_ton) AS capacidad_total,
        SUM(i.volumen_ton) AS stock_total,
        ROUND(SUM(i.volumen_ton) * 100.0 / NULLIF(SUM(b.capacidad_almacenamiento_ton), 0), 1) AS pct_ocupacion,
        COUNT(DISTINCT ts.bodega_id) FILTER (
          WHERE ts.updated_at >= NOW() - INTERVAL '60 days'
        ) AS con_tarifario,
        COUNT(DISTINCT v.id) FILTER (WHERE v.activa = true) AS ventanillas_activas
      FROM bodegas b
      LEFT JOIN (
        SELECT DISTINCT ON (bodega_id) bodega_id, volumen_ton
        FROM inventarios ORDER BY bodega_id, created_at DESC
      ) i ON i.bodega_id = b.id
      LEFT JOIN tarifario_servicios ts ON ts.bodega_id = b.id
      LEFT JOIN ventanillas v ON v.bodega_id = b.id
      WHERE b.activa = true
    `);
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estadísticas de bodegas' });
  }
});
```

**VERIFICAR:** Tab "Estadísticas" en Bodegas Admin → 5 KPIs con valores reales de BD.

---

## FEATURE #6 — PRIORIDAD MEDIA
### Coincidencias geográficas en Mercado Admin
**ARCHIVO:** `app-bodega/src/pages/admin/MercadoAdminPage.tsx`
**ACCIÓN:** AGREGAR detección y resaltado de coincidencias

**Agregar función de detección de coincidencias:**
```typescript
// Calcular distancia entre dos puntos en km (fórmula Haversine)
const calcularDistanciaKm = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// IDs de disponibilidades y requerimientos que coinciden geográficamente
const coincidencias = useMemo(() => {
  const pares: Array<{ dispId: number; reqId: number }> = [];
  disponibilidades.forEach(disp => {
    requerimientos.forEach(req => {
      if (!disp.latitud || !req.latitud) return;
      const distancia = calcularDistanciaKm(
        disp.latitud, disp.longitud,
        req.latitud, req.longitud
      );
      if (distancia <= (req.radio_km || 50)) {
        pares.push({ dispId: disp.id, reqId: req.id });
      }
    });
  });
  return pares;
}, [disponibilidades, requerimientos]);

const idsDisponibilidadesConCoincidencia = new Set(coincidencias.map(c => c.dispId));
const idsRequerimientosConCoincidencia = new Set(coincidencias.map(c => c.reqId));
```

**Modificar los CircleMarker para resaltar coincidencias:**
```typescript
// Disponibilidades — resaltar si hay coincidencia
<CircleMarker
  key={`disp-${disp.id}`}
  center={[disp.latitud, disp.longitud]}
  radius={idsDisponibilidadesConCoincidencia.has(disp.id) ? 10 : 7}
  pathOptions={{
    fillColor: '#1A5C38',
    color: idsDisponibilidadesConCoincidencia.has(disp.id) ? '#D97706' : '#1A5C38',
    weight: idsDisponibilidadesConCoincidencia.has(disp.id) ? 3 : 1,
    fillOpacity: 0.8
  }}
>
  ...
</CircleMarker>
```

**Agregar contador de coincidencias sobre el mapa:**
```typescript
{coincidencias.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-3 flex items-center gap-2">
    <span className="text-amber-600 font-semibold">⚡</span>
    <span className="text-amber-800 text-sm font-medium">
      {coincidencias.length} coincidencia{coincidencias.length !== 1 ? 's' : ''} activa{coincidencias.length !== 1 ? 's' : ''} en el mapa
    </span>
  </div>
)}
```

**VERIFICAR:** Mapa de Mercado Admin → cuando una disponibilidad de productor cae dentro del radio de un requerimiento de bodega, ambos marcadores se resaltan con borde ámbar y aparece el contador de coincidencias.

---

## FEATURE #7 — PRIORIDAD BAJA
### Catálogos editables en Configuración Admin
**ARCHIVO:** `app-bodega/src/pages/admin/ConfiguracionAdminPage.tsx`
**ACCIÓN:** AGREGAR sección de catálogos editables

**Agregar sección en el JSX después de "Parámetros del sistema":**
```typescript
{/* Catálogos editables */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
  <h3 className="text-base font-semibold text-gray-900 mb-4">
    Catálogos del sistema
  </h3>

  {/* Conceptos de servicio */}
  <div className="mb-6">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-gray-700">
        Conceptos de servicio de bodega
      </h4>
      <button
        onClick={() => setModalNuevoConcepto(true)}
        className="text-sm px-3 py-1.5 bg-[#1A5C38] text-white rounded-lg hover:bg-green-800"
      >
        + Agregar concepto
      </button>
    </div>
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 text-gray-600">Concepto</th>
            <th className="text-left px-4 py-2 text-gray-600">Estado</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {conceptos.map(concepto => (
            <tr key={concepto.id} className="border-t border-gray-100">
              <td className="px-4 py-2">{concepto.nombre}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  concepto.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {concepto.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => toggleConcepto(concepto.id, !concepto.activo)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {concepto.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

**Endpoints requeridos — agregar en `admin.ts`:**
```typescript
// GET /api/admin/catalogos/conceptos-servicio
router.get('/catalogos/conceptos-servicio', requireAdmin, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM cat_conceptos_servicio ORDER BY nombre ASC'
  );
  return res.json(result.rows);
});

// PATCH /api/admin/catalogos/conceptos-servicio/:id
router.patch('/catalogos/conceptos-servicio/:id', requireAdmin, async (req, res) => {
  const { activo } = req.body;
  await pool.query(
    'UPDATE cat_conceptos_servicio SET activo = $1 WHERE id = $2',
    [activo, req.params.id]
  );
  return res.json({ ok: true });
});

// POST /api/admin/catalogos/conceptos-servicio
router.post('/catalogos/conceptos-servicio', requireAdmin, async (req, res) => {
  const { nombre } = req.body;
  const result = await pool.query(
    'INSERT INTO cat_conceptos_servicio (nombre, activo) VALUES ($1, true) RETURNING *',
    [nombre]
  );
  return res.json(result.rows[0]);
});
```

**VERIFICAR:** Configuración Admin → sección "Catálogos del sistema" → tabla de conceptos de servicio → botón desactivar/activar funciona → botón agregar nuevo concepto funciona.

---

## Resumen de prioridades

| # | Feature | Prioridad | Archivos afectados |
|---|---|---|---|
| 1 | Toggle lista/mapa en Mis Bodegas | 🔴 Alta | `B05MisBodegas.tsx` |
| 2 | Mapa Global con 3 capas en Dashboard Admin | 🔴 Alta | `DashboardAdminPage.tsx` + nuevo `MapaGlobalAdmin.tsx` |
| 3 | Panel estadístico en Alertas Admin | 🟡 Media | `AlertasAdminPage.tsx` |
| 4 | Estadísticas demográficas en Productores Admin | 🟡 Media | `ProductoresAdminPage.tsx` |
| 5 | Tab Estadísticas en Bodegas Admin | 🟡 Media | `BodegasAdminPage.tsx` + endpoint nuevo |
| 6 | Coincidencias geográficas en Mercado Admin | 🟡 Media | `MercadoAdminPage.tsx` |
| 7 | Catálogos editables en Configuración Admin | 🟢 Baja | `ConfiguracionAdminPage.tsx` + endpoints nuevos |

---

*SIMAC Plan Nacional Maíz 2026 · Documento 3 de 3 — Features Pendientes*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
