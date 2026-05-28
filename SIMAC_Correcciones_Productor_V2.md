# SIMAC — Correcciones y Nuevas Funcionalidades: Módulo Productor V2
**Fecha:** Mayo 2026 | **Repo:** github.com/Jesus200995/Simulador
**App:** `app-bodega/` (React + TypeScript + Vite + react-leaflet + Zustand)
**Para:** Desarrollador — implementar en el orden indicado al final

> Todo el código de referencia existente está en `appbodegas/` (Vue — módulo técnico).
> El backend está al 100% — tablas y endpoints ya existen. No crear tablas nuevas salvo las indicadas.
> Implementar en el orden del plan de trabajo al final del documento.

---

## Índice

1. [Bug fixes urgentes](#1-bug-fixes-urgentes)
2. [Mapa de bodegas — zoom al territorio](#2-mapa-de-bodegas--zoom-al-territorio)
3. [Mapa satelital — cambio de tiles](#3-mapa-satelital--cambio-de-tiles)
4. [Dibujo de polígono de UP](#4-dibujo-de-polígono-de-up)
5. [Ciclo productivo y rendimiento](#5-ciclo-productivo-y-rendimiento)
6. [Notificación persistente de completar perfil](#6-notificación-persistente)
7. [Campo correo en registro Tipo B](#7-campo-correo-en-registro-tipo-b)
8. [Pantalla de precios — nueva estructura](#8-pantalla-de-precios--nueva-estructura)
9. [MapaUP.tsx — mostrar polígono completo](#9-mapauptsx--mostrar-polígono)
10. [Plan de trabajo — orden de implementación](#10-plan-de-trabajo)

---

## 1. Bug fixes urgentes

### Bug 1 — `ya_tiene_cuenta` redirige al login del bodeguero
**Archivo:** `app-bodega/src/pages/auth/ActivarCuentaPage.tsx` **línea 29**

```typescript
// ANTES — manda al productor al flujo del bodeguero:
navigate('/login', { state: { mensaje: 'Ya tienes cuenta activa. Inicia sesion.' } });

// DESPUÉS — manda al login del productor:
navigate('/login-productor', { state: { mensaje: 'Ya tienes cuenta activa. Ingresa tu PIN.' } });
```

---

### Bug 2 — Coordenadas de la UP hardcodeadas en el mapa
**Archivo:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx` **líneas 49–54 y 68–75**

**Paso 1 — corregir el fetch del dashboard:**
```typescript
// ANTES — ignora las coordenadas reales del API:
.then(d => {
  if (d.municipio) setUp({
    lat: 23.6,      // HARDCODEADO
    lng: -102.5,    // HARDCODEADO
    location_confirmed: d.location_confirmed,
    centroid_source: d.centroid_source
  });
})

// DESPUÉS — usar coordenadas reales:
.then(d => {
  if (d.municipio) setUp({
    lat: d.lat ?? 23.6345,
    lng: d.lng ?? -102.5528,
    location_confirmed: d.location_confirmed,
    centroid_source: d.centroid_source,
    municipio: d.municipio,
    estado: d.estado
  });
})
```

**Paso 2 — corregir el MapContainer:**
```typescript
// ANTES:
<MapContainer center={[23.6345, -102.5528]} zoom={6} ...>

// DESPUÉS:
<MapContainer
  center={up ? [up.lat, up.lng] : [23.6345, -102.5528]}
  zoom={up?.location_confirmed ? 11 : 8}
  ...>
```

**Paso 3 — flyTo cuando cargue la UP:**
```typescript
useEffect(() => {
  if (up && mapRef) {
    mapRef.flyTo([up.lat, up.lng], up.location_confirmed ? 11 : 8, {
      animate: true, duration: 1.2
    });
  }
}, [up, mapRef]);
```

**Paso 4 — backend: agregar lat/lng al response de dashboard**
```typescript
// GET /api/productor/dashboard — modificar el SELECT de up:
const upData = await db.query(`
  SELECT municipality_name, state_name, location_confirmed, centroid_source,
         ST_Y(centroid::geometry) AS lat,
         ST_X(centroid::geometry) AS lng
  FROM up WHERE producer_id = $1 LIMIT 1
`, [producerId]);

// Agregar al response:
lat: upData.rows[0]?.lat,
lng: upData.rows[0]?.lng,
```

---

### Bug 3 — minLength del PIN
**Verificar** en el controlador de auth del backend:
```typescript
// Si existe validación de longitud mínima de password:
if (password.length < 8) return res.status(400)...

// Agregar excepción para productor:
const minLen = rol === 'productor' ? 4 : 8;
if (password.length < minLen)
  return res.status(400).json({ error: 'Credencial demasiado corta' });
```

---

## 2. Mapa de bodegas — zoom al territorio

### 2.1 Cargar bodegas filtradas por radio

```typescript
// MapaBodegasPage.tsx — línea 44
// ANTES: trae todas las bodegas sin filtro
fetch(`${BASE}/bodegas`, ...)

// DESPUÉS: esperar la UP y filtrar por radio de 150km
useEffect(() => {
  if (!up) return; // no cargar hasta tener coordenadas de la UP
  fetch(`${BASE}/bodegas?lat=${up.lat}&lng=${up.lng}&radio_km=150`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(d => setBodegas(Array.isArray(d) ? d : d.bodegas || []));
}, [up]);
```

### 2.2 Backend — agregar filtro por distancia a GET /api/bodegas

```typescript
// Agregar parámetros opcionales lat, lng, radio_km al endpoint existente
router.get('/bodegas', authMiddleware, async (req, res) => {
  const { lat, lng, radio_km } = req.query;

  let whereExtra = '';
  const params: any[] = [];

  if (lat && lng && radio_km) {
    whereExtra = `AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(b.longitud, b.latitud), 4326)::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3 * 1000
    )`;
    params.push(Number(lng), Number(lat), Number(radio_km));
  }

  const query = `
    SELECT b.*,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(b.longitud, b.latitud), 4326)::geography,
        ST_SetSRID(ST_MakePoint(
          COALESCE($1, -102.5528),
          COALESCE($2, 23.6345)
        ), 4326)::geography
      ) / 1000 AS distancia_km
    FROM bodegas b
    WHERE b.estatus = 'aprobada'
    ${whereExtra}
    ORDER BY distancia_km ASC
  `;

  const { rows } = await db.query(query, params.length ? params : [-102.5528, 23.6345]);
  return res.json(rows);
});
```

### 2.3 Mensaje cuando no hay bodegas en el radio

```tsx
{bodegas.length === 0 && up && !loadingBodegas && (
  <div className="absolute inset-0 flex items-center justify-center z-[1000]
                  bg-white/80 backdrop-blur-sm">
    <div className="text-center px-6 max-w-xs">
      <p className="text-4xl mb-3">🗺</p>
      <p className="font-semibold text-gray-800">
        No hay bodegas registradas en 150 km
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Estamos ampliando la red de bodegas. Intenta de nuevo pronto.
      </p>
      <button onClick={() => setRadioKm(500)}
        className="mt-4 text-[#1A5C38] font-semibold text-sm underline">
        Buscar en radio más amplio
      </button>
    </div>
  </div>
)}
```

---

## 3. Mapa satelital — cambio de tiles

**ESRI World Imagery — gratuito, sin API key, sin token.**
Reemplazar en los 4 archivos que tienen TileLayer:

| Archivo | Línea |
|---|---|
| `MapaBodegasPage.tsx` | 76 |
| `MapaUP.tsx` | 59 |
| `RegistroNuevoPage.tsx` (paso 4) | 254 |
| `CompletarUbicacionPage.tsx` | 63 |

```typescript
// ANTES (calles):
<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

// DESPUÉS (satelital ESRI — gratuito):
<TileLayer
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  attribution="Tiles &copy; Esri"
  maxZoom={19}
/>

// OPCIONAL pero recomendado: capa de nombres encima del satelital
// Ayuda al productor a orientarse con nombres de localidades y carreteras
<TileLayer
  url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
  opacity={0.6}
/>
```

---

## 4. Dibujo de polígono de UP

### 4.1 Instalar dependencias

```bash
# Desde app-bodega/
npm install leaflet-draw @turf/turf
npm install @types/leaflet-draw --save-dev
```

### 4.2 Crear componente `DibujarPoligonoUP.tsx`

```typescript
// app-bodega/src/components/productor/DibujarPoligonoUP.tsx
// Equivalente gratuito al Mapbox GL Draw que usa el técnico en ProductorUPView.vue
// Referencia técnica: ProductorUPView.vue líneas 327-331, 486-490

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface Props {
  poligonoInicial?: [number, number][];  // para redibujar — precarga el polígono existente
  onPoligonoCompleto: (
    coordenadas: [number, number][],
    centroide: { lat: number; lng: number },
    areaHa: number  // calculado con turf igual que el técnico
  ) => void;
  onPoligonoEliminado: () => void;
}

export default function DibujarPoligonoUP({
  poligonoInicial,
  onPoligonoCompleto,
  onPoligonoEliminado
}: Props) {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Si hay polígono existente (modo edición desde perfil), precargarlo
    if (poligonoInicial && poligonoInicial.length >= 3) {
      const latlngs = poligonoInicial.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      const poly = L.polygon(latlngs, {
        color: '#1A5C38',
        fillColor: '#1A5C38',
        fillOpacity: 0.2,
        weight: 2,
      });
      drawnItems.addLayer(poly);
      map.fitBounds(poly.getBounds(), { padding: [40, 40] });
    }

    const drawControl = new (L as any).Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#1A5C38',
            fillColor: '#1A5C38',
            fillOpacity: 0.2,
            weight: 2,
          },
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Los lados no pueden cruzarse.'
          },
        },
        // Deshabilitar todo lo que no se usa
        polyline:     false,
        rectangle:    false,
        circle:       false,
        circlemarker: false,
        marker:       false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      }
    });

    map.addControl(drawControl);

    // Al terminar de dibujar — calcular área con turf igual que el técnico
    // Referencia: ProductorUPView.vue líneas 486-490
    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);

      const latlngs: [number, number][] = e.layer.getLatLngs()[0].map(
        (p: L.LatLng) => [p.lat, p.lng] as [number, number]
      );

      // Calcular área en hectáreas con turf
      // Mismo cálculo que ProductorUPView.vue: turf.area(polygon) / 10000
      const turfPolygon = turf.polygon([[
        ...latlngs.map(([lat, lng]) => [lng, lat]), // turf usa [lng, lat]
        [latlngs[0][1], latlngs[0][0]]              // cerrar el polígono
      ]]);
      const areaHa = parseFloat((turf.area(turfPolygon) / 10000).toFixed(4));

      const centroide = e.layer.getBounds().getCenter();
      onPoligonoCompleto(latlngs, { lat: centroide.lat, lng: centroide.lng }, areaHa);
    });

    // Al eliminar el polígono
    map.on((L as any).Draw.Event.DELETED, () => {
      onPoligonoEliminado();
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED);
      map.off((L as any).Draw.Event.DELETED);
    };
  }, [map]);

  return null;
}
```

### 4.3 Actualizar `RegistroNuevoPage.tsx` — paso 4 (polígono)

El paso 4 del registro pasa de pin simple a dibujo de polígono completo.

```typescript
// RegistroNuevoPage.tsx — reemplazar el paso 4 completo

import DibujarPoligonoUP from '../../components/productor/DibujarPoligonoUP';
import * as turf from '@turf/turf';

// Agregar al state del formulario:
const [poligono, setPoligono]   = useState<[number,number][] | null>(null);
const [areaCalc, setAreaCalc]   = useState<number | null>(null);   // ha calculadas por turf
const [areaReal, setAreaReal]   = useState<string>('');            // ha declaradas si no coincide
const [coincideArea, setCoincideArea] = useState<boolean | null>(null);

// Render del paso 4:
<div className="flex flex-col h-screen">

  {/* Instrucciones */}
  <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
    <p className="text-base font-semibold text-gray-800">
      Dibuja tu parcela en el mapa
    </p>
    <p className="text-sm text-gray-500 mt-1">
      Toca el ícono de polígono (✏) y traza los límites de tu terreno
      tocando cada esquina. Puedes buscar tu zona con la lupa 🔍.
    </p>
    {areaCalc && (
      <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2
                      flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1A5C38]">
          Área calculada: {areaCalc} ha
        </p>
        <button
          onClick={() => { setPoligono(null); setAreaCalc(null); setCoincideArea(null); }}
          className="text-xs text-red-500 underline">
          Redibujar
        </button>
      </div>
    )}
  </div>

  {/* Mapa */}
  <div className="flex-1 relative">
    <MapContainer
      center={municipioCentroide
        ? [municipioCentroide.lat, municipioCentroide.lng]
        : [23.6345, -102.5528]}
      zoom={13}
      className="w-full h-full"
      zoomControl={false}
    >
      {/* Tiles satelital ESRI */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <TileLayer
        url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        opacity={0.6}
      />
      <DibujarPoligonoUP
        onPoligonoCompleto={(coords, centroide, ha) => {
          setPoligono(coords);
          setCoords(centroide);
          setAreaCalc(ha);
          setCoincideArea(null); // resetear la pregunta de coincidencia
        }}
        onPoligonoEliminado={() => {
          setPoligono(null);
          setAreaCalc(null);
          setCoincideArea(null);
        }}
      />
      <NominatimSearch
        placeholder="Buscar ejido, carretera, localidad..."
        onSelect={(lat, lng) => mapRef.current?.flyTo([lat, lng], 15)}
      />
    </MapContainer>
  </div>

  {/* Panel inferior — aparece después de dibujar */}
  <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-3">

    {/* Pregunta de coincidencia — igual que el técnico en ProductorUPView.vue paso 3 */}
    {areaCalc && coincideArea === null && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          El sistema calculó <strong>{areaCalc} ha</strong> de tu parcela.
          ¿Es correcto?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setCoincideArea(true)}
            className="flex-1 border-2 border-[#1A5C38] text-[#1A5C38] py-2.5
                       rounded-xl font-semibold text-sm">
            ✓ Sí, es correcto
          </button>
          <button onClick={() => setCoincideArea(false)}
            className="flex-1 border-2 border-gray-300 text-gray-600 py-2.5
                       rounded-xl font-semibold text-sm">
            No, tengo más/menos
          </button>
        </div>
      </div>
    )}

    {/* Campo de área real — si no coincide */}
    {coincideArea === false && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ¿Cuántas hectáreas tiene tu predio realmente?
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Puedes revisar esto en tu título de propiedad o certificado parcelario.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number" min="0.1" max="9999" step="0.1"
            value={areaReal}
            onChange={e => setAreaReal(e.target.value)}
            placeholder={String(areaCalc ?? '')}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg
                       font-bold text-center focus:border-[#1A5C38] focus:outline-none"
          />
          <span className="text-gray-500 font-medium">ha</span>
        </div>
      </div>
    )}

    {/* Botones de acción */}
    <button
      onClick={() => avanzarPaso5()}
      disabled={!poligono || (coincideArea === null && !!areaCalc)}
      className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base
                 font-bold disabled:opacity-40">
      {poligono ? 'Confirmar y continuar →' : 'Dibuja tu parcela para continuar'}
    </button>

    <button onClick={() => avanzarPaso5(true)}
      className="w-full text-gray-400 py-2 text-sm">
      Ahora no — completar después
    </button>
  </div>
</div>

// Al avanzar al paso 5, guardar en sessionStorage:
const avanzarPaso5 = (saltar = false) => {
  if (!saltar && poligono) {
    sessionStorage.setItem('reg_poligono', JSON.stringify(poligono));
    sessionStorage.setItem('reg_area_calc', String(areaCalc));
    sessionStorage.setItem('reg_area_real', areaReal || String(areaCalc));
    sessionStorage.setItem('reg_coincide_area', String(coincideArea));
  }
  setPaso(5);
};
```

### 4.4 Backend — guardar polígono en registro y actualización

```sql
-- La tabla up ya tiene columna geom (PostGIS MultiPolygon) — usar esa
-- No crear columna nueva. Referencia: migrate_v4_productor.sql líneas 144-162

-- Al crear la UP en POST /api/auth/registro-nuevo-productor:
-- Si viene polígono, guardarlo en geom y calcular area_ha_calc
-- Si no viene polígono, geom = NULL y area_ha_calc = NULL
```

```typescript
// POST /api/auth/registro-nuevo-productor — extender para recibir polígono
// Agregar al body: poligono (array de [lat,lng]), area_calc_ha, area_real_ha, coincide_area

const { poligono, area_calc_ha, area_real_ha, coincide_area } = req.body;

// Construir el INSERT de up con polígono si viene:
let geomSQL = 'NULL';
let areaHa = null;

if (poligono && poligono.length >= 3) {
  // Convertir array [lat,lng] a WKT — PostGIS usa lng,lat
  const puntos = poligono.map(([lat, lng]: [number,number]) => `${lng} ${lat}`).join(', ');
  const cierre = `${poligono[0][1]} ${poligono[0][0]}`;
  geomSQL = `ST_Multi(ST_GeomFromText('POLYGON((${puntos}, ${cierre}))', 4326))`;
  // Usar el área declarada si no coincidía, sino la calculada
  areaHa = coincide_area === false && area_real_ha
    ? Number(area_real_ha)
    : Number(area_calc_ha);
}

await trx.query(
  `INSERT INTO up
     (producer_id, state_name, municipality_name, centroid,
      location_confirmed, centroid_source, geom, area_ha_calc)
   VALUES ($1, $2, $3,
     ST_SetSRID(ST_MakePoint($4, $5), 4326),
     $6, $7,
     ${geomSQL},
     $8)`,
  [producerId, estado_up, municipio_up,
   lng ?? null, lat ?? null,
   !!(lat && lng),
   (lat && lng) ? 'productor' : 'municipio',
   areaHa]
);

// PATCH /api/productor/ubicacion — extender para recibir polígono (redibujo desde perfil)
router.patch('/productor/ubicacion', authMiddleware, async (req, res) => {
  const { lat, lng, poligono, area_calc_ha, area_real_ha, coincide_area } = req.body;
  const producerId = req.user.producer_id;

  let geomSQL = '';
  let areaHa = null;

  if (poligono && poligono.length >= 3) {
    const puntos = poligono.map(([lat, lng]: [number,number]) => `${lng} ${lat}`).join(', ');
    const cierre = `${poligono[0][1]} ${poligono[0][0]}`;
    geomSQL = `, geom = ST_Multi(ST_GeomFromText('POLYGON((${puntos}, ${cierre}))', 4326))`;
    areaHa = coincide_area === false && area_real_ha
      ? Number(area_real_ha)
      : Number(area_calc_ha);
  }

  await db.query(
    `UPDATE up SET
       centroid           = ST_SetSRID(ST_MakePoint($1, $2), 4326),
       location_confirmed = TRUE,
       centroid_source    = 'productor',
       area_ha_calc       = COALESCE($3, area_ha_calc)
       ${geomSQL}
     WHERE producer_id = $4`,
    [lng, lat, areaHa, producerId]
  );
  return res.json({ ok: true });
});
```

### 4.5 `CompletarUbicacionPage.tsx` — actualizar para polígono

Misma lógica del paso 4 del registro. Reemplazar el ClickHandler simple por `DibujarPoligonoUP`.
El polígono actual se precarga si ya existe (`poligonoInicial` prop).

```typescript
// CompletarUbicacionPage.tsx — obtener polígono actual del API antes de renderizar
// GET /api/mis-ups devuelve el geom — extraer coordenadas para precargar

useEffect(() => {
  fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(ups => {
      const up = ups[0];
      if (up?.geom_coordenadas) {  // el API debe devolver las coords del polígono
        setPoligonoExistente(up.geom_coordenadas);
      }
      if (up?.lat && up?.lng) setCenter({ lat: up.lat, lng: up.lng });
    });
}, []);

// Instrucción en pantalla cuando hay polígono existente:
// "Este es el polígono actual de tu parcela.
//  Puedes editarlo con el lápiz o dibujarlo de nuevo borrándolo primero."
```

**Nota backend:** `GET /api/mis-ups` debe devolver las coordenadas del polígono.
Verificar que el endpoint incluye el geom en formato array de [lat,lng]:
```typescript
// En el SELECT de mis-ups agregar:
ST_AsGeoJSON(geom)::json->'coordinates'->0 AS geom_coordenadas
// Devuelve array de coordenadas [lng, lat] — invertir a [lat, lng] en el frontend
```

---

## 5. Ciclo productivo y rendimiento

> El backend está al 100%. Tablas: `cycle`, `cycle_crop`.
> Endpoints existentes que se reutilizan — solo verificar que aceptan JWT de rol 'productor'.

### 5.1 Verificar guards de los endpoints del ciclo

```typescript
// Estos endpoints existen en cycles.ts — solo verificar el middleware:
// POST /api/ups/:up_id/cycles        — línea 10
// GET  /api/ups/:up_id/cycles        — línea 50
// POST /api/cycles/:cycle_id/crops   — línea 90
// PATCH /api/cycle-crops/:id         — línea 166

// Si el middleware solo permite rol 'tecnico' o 'admin', agregar 'productor':
const allowedRoles = ['tecnico', 'admin', 'productor']; // agregar productor
```

### 5.2 Flujo de ciclo al primer login

Al hacer login el productor, verificar si tiene ciclo registrado.
Si no tiene → redirigir a la secuencia: polígono (si falta) → ciclo → dashboard.

```typescript
// store/auth.ts o en el componente de login — después de autenticar:
const verificarCompletitud = async (token: string) => {
  const [upRes, ciclosRes] = await Promise.all([
    fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    // Obtener up_id para luego pedir ciclos
  ]);

  const up = upRes[0];
  const tienePoligono = up?.area_ha_calc !== null;

  if (!tienePoligono) {
    // Ir a dibujar polígono primero, luego ciclo
    navigate('/productor/ubicacion', { state: { desde: 'login', siguiente: '/productor/ciclo' } });
    return;
  }

  const ciclosData = await fetch(
    `${BASE}/ups/${up.up_id}/cycles`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(r => r.json());

  if (!ciclosData.length) {
    // Tiene polígono pero no ciclo — ir al ciclo
    navigate('/productor/ciclo', { state: { desde: 'login' } });
    return;
  }

  // Todo completo — ir al dashboard normal
  navigate('/productor');
};
```

### 5.3 Crear `CicloProductivoPage.tsx`

Ruta: `/productor/ciclo`
Campos: todos los del técnico (ProductorUPView.vue paso 4), adaptados para el productor.
Un solo cultivo por ciclo (solo maíz en esta versión).

```typescript
// app-bodega/src/pages/productor/CicloProductivoPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL;
const AÑO_ACTUAL = new Date().getFullYear();

const CICLOS = [
  { valor: 'PV',    label: 'Primavera-Verano',  desc: 'Siembra abril – junio' },
  { valor: 'OI',    label: 'Otoño-Invierno',    desc: 'Siembra octubre – diciembre' },
  { valor: 'ANUAL', label: 'Ciclo anual',        desc: 'Producción continua con riego' },
];

const DESTINOS = [
  { valor: 'autoconsumo',     label: 'Autoconsumo' },
  { valor: 'venta_local',     label: 'Venta local' },
  { valor: 'venta_nacional',  label: 'Venta nacional' },
  { valor: 'mixto',           label: 'Mixto (varios destinos)' },
];

export default function CicloProductivoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const esPrimerLogin = location.state?.desde === 'login';
  const token = localStorage.getItem('token');

  const [paso, setPaso] = useState(1);
  const [upId, setUpId] = useState<number | null>(null);
  const [areaHaCalc, setAreaHaCalc] = useState<number | null>(null); // referencia del polígono
  const [variedades, setVariedades] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    // Campos del ciclo — mismos que ProductorUPView.vue paso 4
    cycle_year:  AÑO_ACTUAL,
    cycle_type:  '',          // PV / OI / ANUAL
    // Campos del cultivo — cycle_crop
    crop:        'maiz',      // fijo para esta versión
    variety_id:  null as number | null,
    variety_other: '',        // si es criollo/otra
    area_sown_ha: '',         // superficie sembrada — puede ser menor al total
    planting_date: '',
    yield_expected: '',       // ton/ha esperadas
    estimated_harvest_date: '',
    destination: '',
  });

  // Cargar UP del productor para obtener up_id y area_ha_calc
  useEffect(() => {
    fetch(`${BASE}/mis-ups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(ups => {
        if (ups[0]) {
          setUpId(ups[0].up_id);
          setAreaHaCalc(ups[0].area_ha_calc);
        }
      });
  }, []);

  // Cargar variedades de maíz del catálogo existente
  useEffect(() => {
    fetch(`${BASE}/catalogos-productor?tipo=maiz`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setVariedades(d.variedades || []));
  }, []);

  const guardar = async () => {
    if (!upId) return;
    setGuardando(true);
    try {
      // 1. Crear el ciclo — POST /api/ups/:up_id/cycles
      const cicloRes = await fetch(`${BASE}/ups/${upId}/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cycle_year: form.cycle_year,
          cycle_type: form.cycle_type,
        })
      }).then(r => r.json());

      // 2. Agregar el cultivo al ciclo — POST /api/cycles/:cycle_id/crops
      await fetch(`${BASE}/cycles/${cicloRes.cycle.cycle_id}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          crop:                   form.crop,
          variety_id:             form.variety_id,
          variety_other:          form.variety_other || null,
          area_sown_ha:           Number(form.area_sown_ha),
          planting_date:          form.planting_date,
          yield_expected:         Number(form.yield_expected),
          estimated_harvest_date: form.estimated_harvest_date || null,
          destination:            form.destination || null,
        })
      });

      // Marcar ciclo como completado en localStorage para ocultar notificación
      localStorage.setItem('ciclo_completado', '1');
      navigate('/productor', { state: { mensaje: 'Ciclo productivo guardado' } });

    } finally {
      setGuardando(false);
    }
  };

  const saltar = () => {
    // Guardar que lo saltó para mostrar la notificación persistente
    localStorage.setItem('ciclo_pendiente', '1');
    navigate('/productor');
  };

  // ── PASO 1 — Ciclo y año ─────────────────────────────────────────────────
  if (paso === 1) return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24">
      {esPrimerLogin && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <p className="text-blue-800 text-sm font-semibold">
            Un último paso 🌽
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Registra tu ciclo productivo para que las bodegas conozcan tu oferta.
            Puedes completarlo ahora o después.
          </p>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-1">Mi ciclo productivo</h2>
      <p className="text-sm text-gray-500 mb-6">
        Puedes editarlo en cualquier momento desde tu perfil.
      </p>

      <p className="text-base font-semibold text-gray-800 mb-3">
        ¿Qué ciclo estás sembrando?
      </p>
      <div className="space-y-3 mb-6">
        {CICLOS.map(c => (
          <button key={c.valor}
            onClick={() => setForm(f => ({...f, cycle_type: c.valor}))}
            className={`w-full rounded-2xl p-4 border-2 text-left transition-all
              ${form.cycle_type === c.valor
                ? 'border-[#1A5C38] bg-green-50'
                : 'border-gray-200 bg-gray-50'}`}>
            <p className="font-semibold text-gray-800">{c.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
          </button>
        ))}
      </div>

      <p className="text-base font-semibold text-gray-800 mb-3">¿En qué año?</p>
      <div className="flex gap-3 mb-8">
        {[AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1].map(y => (
          <button key={y}
            onClick={() => setForm(f => ({...f, cycle_year: y}))}
            className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all
              ${form.cycle_year === y
                ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]'
                : 'border-gray-200 text-gray-600'}`}>
            {y}
          </button>
        ))}
      </div>

      <button onClick={() => setPaso(2)} disabled={!form.cycle_type}
        className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base
                   font-bold disabled:opacity-40">
        Continuar →
      </button>
      <button onClick={saltar}
        className="w-full mt-3 py-3 text-gray-400 text-sm">
        Ahora no — completar después
      </button>
    </div>
  );

  // ── PASO 2 — Variedad ────────────────────────────────────────────────────
  if (paso === 2) return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24">
      <button onClick={() => setPaso(1)} className="text-gray-400 text-xl mb-6">←</button>
      <h2 className="text-xl font-bold text-gray-800 mb-1">¿Qué variedad siembras?</h2>
      <p className="text-sm text-gray-500 mb-6">Toca la que más se acerca a tu semilla</p>

      <div className="space-y-2 mb-4">
        {variedades.map((v: any) => (
          <button key={v.id}
            onClick={() => setForm(f => ({...f, variety_id: v.id, variety_other: ''}))}
            className={`w-full rounded-xl p-3.5 border-2 text-left transition-all
              ${form.variety_id === v.id
                ? 'border-[#1A5C38] bg-green-50'
                : 'border-gray-200'}`}>
            <p className="text-sm font-medium text-gray-800">{v.nombre_variedad}</p>
          </button>
        ))}
        {/* Opción criollo/local */}
        <button
          onClick={() => setForm(f => ({...f, variety_id: null, variety_other: 'CRIOLLO_LOCAL'}))}
          className={`w-full rounded-xl p-3.5 border-2 text-left transition-all
            ${form.variety_other === 'CRIOLLO_LOCAL'
              ? 'border-[#1A5C38] bg-green-50'
              : 'border-gray-200'}`}>
          <p className="text-sm font-medium text-gray-800">Criollo / Local</p>
          <p className="text-xs text-gray-400 mt-0.5">Semilla propia o de la región</p>
        </button>
      </div>

      {/* Si es criollo, pedir nombre */}
      {form.variety_other === 'CRIOLLO_LOCAL' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Cómo se llama tu variedad? (opcional)
          </label>
          <input
            type="text"
            value={form.variety_other === 'CRIOLLO_LOCAL' ? '' : form.variety_other}
            onChange={e => setForm(f => ({...f, variety_other: e.target.value || 'CRIOLLO_LOCAL'}))}
            placeholder="Ej: Olotillo, Pepitilla, Olotón..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base
                       focus:border-[#1A5C38] focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={() => setPaso(3)}
        disabled={!form.variety_id && !form.variety_other}
        className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base
                   font-bold disabled:opacity-40 mt-4">
        Continuar →
      </button>
      <button onClick={saltar} className="w-full mt-3 py-3 text-gray-400 text-sm">
        Ahora no
      </button>
    </div>
  );

  // ── PASO 3 — Superficie sembrada ─────────────────────────────────────────
  if (paso === 3) return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24">
      <button onClick={() => setPaso(2)} className="text-gray-400 text-xl mb-6">←</button>
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        Superficie y fechas
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Estos datos nos ayudan a estimar tu producción total.
      </p>

      {/* Referencia del polígono si existe */}
      {areaHaCalc && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-green-700">
            📐 Tu predio tiene <strong>{areaHaCalc} ha</strong> registradas.
            La superficie sembrada puede ser igual o menor.
          </p>
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿Cuántas hectáreas vas a sembrar este ciclo?
      </label>
      <div className="flex items-center gap-3 mb-6">
        <input
          type="number" min="0.1" step="0.1"
          max={areaHaCalc ?? 9999}
          value={form.area_sown_ha}
          onChange={e => setForm(f => ({...f, area_sown_ha: e.target.value}))}
          placeholder={areaHaCalc ? String(areaHaCalc) : 'Ej: 5.5'}
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-4 text-2xl
                     font-bold text-center focus:border-[#1A5C38] focus:outline-none"
        />
        <span className="text-gray-500 font-medium text-base">ha</span>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Rendimiento que esperas
      </label>
      <p className="text-xs text-gray-400 mb-2">
        Toneladas por hectárea según tu experiencia en esta parcela
      </p>
      <div className="flex items-center gap-3 mb-2">
        <input
          type="number" min="0.1" max="30" step="0.1"
          value={form.yield_expected}
          onChange={e => setForm(f => ({...f, yield_expected: e.target.value}))}
          placeholder="Ej: 8"
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-4 text-2xl
                     font-bold text-center focus:border-[#1A5C38] focus:outline-none"
        />
        <span className="text-gray-500 font-medium text-base">ton/ha</span>
      </div>

      {/* Cálculo automático de producción estimada */}
      {form.area_sown_ha && form.yield_expected && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-xs text-gray-500">Producción estimada total</p>
          <p className="text-3xl font-bold text-[#1A5C38] mt-1">
            {(Number(form.area_sown_ha) * Number(form.yield_expected)).toFixed(1)} ton
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {form.area_sown_ha} ha × {form.yield_expected} ton/ha
          </p>
        </div>
      )}

      <button onClick={() => setPaso(4)}
        disabled={!form.area_sown_ha || !form.yield_expected}
        className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base
                   font-bold disabled:opacity-40">
        Continuar →
      </button>
      <button onClick={saltar} className="w-full mt-3 py-3 text-gray-400 text-sm">
        Ahora no
      </button>
    </div>
  );

  // ── PASO 4 — Fechas y destino ─────────────────────────────────────────────
  if (paso === 4) return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-24">
      <button onClick={() => setPaso(3)} className="text-gray-400 text-xl mb-6">←</button>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Fechas y destino</h2>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿Cuándo vas a sembrar?
      </label>
      <input
        type="date"
        value={form.planting_date}
        onChange={e => setForm(f => ({...f, planting_date: e.target.value}))}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base
                   focus:border-[#1A5C38] focus:outline-none mb-5"
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿Cuándo esperas cosechar? <span className="text-gray-400 font-normal">(opcional)</span>
      </label>
      <input
        type="date"
        value={form.estimated_harvest_date}
        onChange={e => setForm(f => ({...f, estimated_harvest_date: e.target.value}))}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base
                   focus:border-[#1A5C38] focus:outline-none mb-5"
      />

      <label className="block text-sm font-medium text-gray-700 mb-3">
        ¿A dónde va tu cosecha? <span className="text-gray-400 font-normal">(opcional)</span>
      </label>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {DESTINOS.map(d => (
          <button key={d.valor}
            onClick={() => setForm(f => ({...f, destination: d.valor}))}
            className={`rounded-xl p-3 border-2 text-sm font-medium text-left transition-all
              ${form.destination === d.valor
                ? 'border-[#1A5C38] bg-green-50 text-[#1A5C38]'
                : 'border-gray-200 text-gray-700'}`}>
            {d.label}
          </button>
        ))}
      </div>

      <button
        onClick={guardar}
        disabled={!form.planting_date || guardando}
        className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base
                   font-bold disabled:opacity-40">
        {guardando ? 'Guardando...' : '✓ Guardar ciclo productivo'}
      </button>
      <button onClick={saltar} className="w-full mt-3 py-3 text-gray-400 text-sm">
        Ahora no
      </button>
    </div>
  );

  return null;
}
```

### 5.4 Agregar ruta en `router.tsx`

```typescript
{ path: 'ciclo', element: <CicloProductivoPage /> },
// Ruta completa: /productor/ciclo
```

### 5.5 Sección de ciclo en `MiPerfilPage.tsx`

```typescript
// Agregar después de la sección "Mi parcela" — línea ~193

{/* Sección ciclo productivo */}
<div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100">
  <div className="flex items-center justify-between px-4 pt-4 pb-2">
    <p className="font-semibold text-gray-800">Mi ciclo productivo</p>
    <button onClick={() => navigate('/productor/ciclo')}
      className="text-[#1A5C38] text-sm font-semibold">
      {ciclos.length > 0 ? 'Editar' : '+ Agregar'}
    </button>
  </div>

  {ciclos.length === 0 ? (
    <div className="px-4 pb-4">
      <p className="text-sm text-gray-400 mb-2">
        No has registrado tu ciclo productivo.
      </p>
      <button onClick={() => navigate('/productor/ciclo')}
        className="text-[#1A5C38] text-sm font-semibold">
        Registrar ahora →
      </button>
    </div>
  ) : (
    <div className="px-4 pb-4 space-y-3">
      {ciclos.map((c: any) => (
        <div key={c.cycle_id} className="bg-gray-50 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-bold text-gray-800">
                {c.cycle_type === 'PV' ? 'Primavera-Verano'
                  : c.cycle_type === 'OI' ? 'Otoño-Invierno'
                  : 'Anual'} {c.cycle_year}
              </p>
              {c.crops?.[0] && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.crops[0].variety_other || c.crops[0].nombre_variedad || 'Maíz'}
                </p>
              )}
            </div>
            <button onClick={() => navigate('/productor/ciclo', { state: { cicloId: c.cycle_id } })}
              className="text-xs text-[#1A5C38] font-medium border border-[#1A5C38]
                         px-3 py-1 rounded-lg">
              Editar
            </button>
          </div>

          {c.crops?.[0] && (
            <div className="grid grid-cols-3 gap-2">
              {c.crops[0].area_sown_ha && (
                <div className="bg-white rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400">Sembrado</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {c.crops[0].area_sown_ha} ha
                  </p>
                </div>
              )}
              {c.crops[0].yield_expected && (
                <div className="bg-white rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400">Esperado</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {c.crops[0].yield_expected} t/ha
                  </p>
                </div>
              )}
              {c.crops[0].area_sown_ha && c.crops[0].yield_expected && (
                <div className="bg-green-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400">Total est.</p>
                  <p className="text-sm font-bold text-[#1A5C38] mt-0.5">
                    {(c.crops[0].area_sown_ha * c.crops[0].yield_expected).toFixed(1)} ton
                  </p>
                </div>
              )}
            </div>
          )}

          {c.crops?.[0]?.planting_date && (
            <p className="text-xs text-gray-400 mt-2">
              Siembra: {new Date(c.crops[0].planting_date).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
              {c.crops[0].estimated_harvest_date && (
                <span> · Cosecha estimada: {new Date(c.crops[0].estimated_harvest_date)
                  .toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>
```

---

## 6. Notificación persistente

Aparece hasta que el productor complete su ciclo productivo.
**Dos niveles:** banner en el dashboard + badge en el navbar.

### 6.1 Badge en el navbar — `LayoutProductor.tsx`

```typescript
// LayoutProductor.tsx — agregar badge en el ícono de perfil

const cicloPendiente = localStorage.getItem('ciclo_pendiente') === '1'
  && localStorage.getItem('ciclo_completado') !== '1';

// En el ícono de perfil del navbar:
<button onClick={() => navigate('/productor/perfil')}
  className="relative p-2">
  <UserIcon className="w-6 h-6 text-gray-600" />
  {cicloPendiente && (
    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500
                     rounded-full border-2 border-white" />
  )}
</button>
```

### 6.2 Banner en el dashboard — `DashboardProductorPage.tsx`

```typescript
// DashboardProductorPage.tsx — agregar banner de ciclo pendiente

const cicloPendiente = localStorage.getItem('ciclo_pendiente') === '1'
  && localStorage.getItem('ciclo_completado') !== '1';

// Agregar después del banner de ubicación:
{cicloPendiente && (
  <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
    <div className="flex items-start gap-3">
      <span className="text-2xl">🌱</span>
      <div className="flex-1">
        <p className="text-blue-800 text-sm font-semibold">
          Completa tu ciclo productivo
        </p>
        <p className="text-blue-700 text-xs mt-1">
          Registra qué siembras y cuánto esperas cosechar.
          Esto ayuda a las bodegas a prepararse para tu oferta.
        </p>
        <button
          onClick={() => navigate('/productor/ciclo')}
          className="mt-3 bg-blue-600 text-white text-sm px-4 py-2
                     rounded-xl font-semibold">
          Registrar ahora →
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 7. Campo correo en registro Tipo B

**Archivo:** `app-bodega/src/pages/auth/RegistroNuevoPage.tsx`

### 7.1 Frontend — agregar al paso 5

```typescript
// Agregar al state:
const [correo, setCorreo] = useState('');

// En el render del paso 5, después del campo teléfono:
<div className="mb-5">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Correo electrónico
    <span className="ml-2 text-xs text-gray-400 font-normal">(opcional)</span>
  </label>
  <p className="text-xs text-gray-400 mb-2">
    Para recibir avisos importantes sobre tu cuenta y precios del día.
  </p>
  <input
    type="email"
    value={correo}
    onChange={e => setCorreo(e.target.value)}
    placeholder="tucorreo@ejemplo.com"
    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base
               focus:border-[#1A5C38] focus:outline-none"
    autoCapitalize="off"
    autoCorrect="off"
    inputMode="email"
  />
</div>

// Agregar al payload del POST:
correo: correo || null,
```

### 7.2 Backend

```sql
ALTER TABLE producer
  ADD COLUMN IF NOT EXISTS correo VARCHAR(200);
```

```typescript
// POST /api/auth/registro-nuevo-productor — agregar correo al INSERT
// PATCH /api/productor/perfil — agregar correo al UPDATE con COALESCE
```

### 7.3 Mostrar en `MiPerfilPage.tsx`

```typescript
// En la sección Contacto (ya existe) — agregar junto al teléfono:
<div className="flex justify-between items-center py-2 border-t border-gray-50">
  <div>
    <p className="text-xs text-gray-400">Correo electrónico</p>
    <p className="text-sm text-gray-800 mt-0.5">
      {perfil.correo
        ? perfil.correo
        : <span className="text-gray-400 italic text-xs">No registrado</span>}
    </p>
  </div>
</div>
// El mismo botón Edit2 de la sección ya permite editar — solo agregar el campo al form
```

---

## 8. Pantalla de precios — nueva estructura

**Archivo:** `app-bodega/src/pages/productor/PreciosProductorPage.tsx`
**Estado actual:** usa estructura antigua (precio_compra, precio_bodega, precio_mercado)
**Referencia:** `SIMAC_Spec_Precios_MapaBodegas.md` — misma lógica que B22, presentación simplificada

### 8.1 Verificar campos en `GET /api/productor/precios`

El endpoint debe devolver estos campos. Si no los devuelve, agregarlos:
```typescript
{
  estado:                    string,
  fecha:                     string,
  precio_compra:             number,  // PO — lo que recibe el productor
  servicios_promedio:        number,  // S — promedio tarifario regional
  precio_chicago_usd_bushel: number,  // verificar que existe
  tipo_cambio_mxn:           number,  // verificar que existe
  fira:                      object | null,
  tendencia:                 [{ fecha, precio_compra }]
}
```

### 8.2 Lógica de los 3 precios — calcular en frontend

```typescript
const BONO_MAIZ_USD = 50; // fijo, no configurable

// Precio 1 — Margen de Negociación
const margenNegociacion =
  (chicagoBushel * 39.368 * tipoCambio) + (BONO_MAIZ_USD * tipoCambio);

// Precio 2 — Precio de Compra
const precioCompra = data.precio_compra + data.servicios_promedio; // PO + S

// Precio 3 — Precio de Venta
const precioVenta = precioCompra - margenNegociacion;
// Si negativo → mostrar en rojo, no ocultar
```

### 8.3 Visualización

```
┌─────────────────────────────────────┐
│ PRECIO 1 — Margen de Negociación    │
│ 4 mini-tarjetas: Chicago / Conv /   │
│ Tipo cambio / Bono Maíz             │
│ → Total: $X,XXX MXN/ton             │
├─────────────────────────────────────┤
│ PRECIO 2 — Precio de Compra         │
│ Bloque verde: 🌽 Lo que ganas tú   │
│              $X,XXX · XX%           │
│           +                         │
│ Bloque azul: 🏪 Servicios bodega   │
│              $XXX · XX%             │
│           =                         │
│ Total: $X,XXX MXN/ton               │
├─────────────────────────────────────┤
│ PRECIO 3 — Precio de Venta          │
│ Compra − Margen = $X,XXX            │
│ Verde si positivo, rojo si negativo │
├─────────────────────────────────────┤
│ PRECIO 4 — CEDIS [EN DESARROLLO]    │
│ Badge "En desarrollo"               │
├─────────────────────────────────────┤
│ Gráfica tendencia 30 días           │
│ Solo precio de compra (PO)          │
├─────────────────────────────────────┤
│ FIRA (solo si estado tiene dato)    │
│ Jalisco / Sinaloa / Guanajuato      │
└─────────────────────────────────────┘
```

El código completo de este componente ya fue especificado en el documento
`SIMAC_DocTecnico_Productor_V1.md` sección 8 — usar ese código como base
y ajustar los nombres de campos al endpoint verificado.

---

## 9. MapaUP.tsx — mostrar polígono completo

```typescript
// app-bodega/src/components/productor/MapaUP.tsx — línea 59
// El API debe devolver las coordenadas del polígono en /api/mis-ups

import { Polygon } from 'react-leaflet';

// En el componente, si la UP tiene polígono:
{up.geom_coordenadas && up.geom_coordenadas.length >= 3 && (
  <Polygon
    positions={up.geom_coordenadas.map(([lng, lat]: [number,number]) => [lat, lng])}
    pathOptions={{
      color:       '#1A5C38',
      fillColor:   '#1A5C38',
      fillOpacity: 0.2,
      weight:      2,
    }}
  />
)}

// Si no hay polígono, mostrar el pin existente (comportamiento actual)
// El mapa mini se centra en el polígono si existe:
// map.fitBounds(polygon.getBounds(), { padding: [20, 20] })
```

---

## 10. Plan de trabajo — orden de implementación

```
DÍA 1 — Bug fixes (2–3 horas)
  □ Bug 1: ActivarCuentaPage.tsx línea 29 — navigate a /login-productor
  □ Bug 2: MapaBodegasPage.tsx líneas 49–54 y 68–75 — coordenadas reales
  □ Bug 2: Backend GET /api/productor/dashboard — agregar lat/lng al response
  □ Bug 3: Verificar minLength de PIN en backend

DÍA 2 — Mapa de bodegas (3–4 horas)
  □ Cambiar TileLayer a ESRI satelital en los 4 archivos
  □ MapaBodegasPage.tsx — filtrar bodegas por radio 150km
  □ Backend GET /api/bodegas — agregar parámetros lat/lng/radio_km
  □ MapaBodegasPage.tsx — mensaje cuando no hay bodegas cercanas

DÍA 3 — Polígono de UP (5–6 horas)
  □ npm install leaflet-draw @turf/turf @types/leaflet-draw
  □ Crear DibujarPoligonoUP.tsx
  □ RegistroNuevoPage.tsx paso 4 — reemplazar ClickHandler por DibujarPoligonoUP
  □ Pregunta de coincidencia de área + campo de ha reales
  □ CompletarUbicacionPage.tsx — mismo cambio + precargar polígono existente
  □ Backend PATCH /api/productor/ubicacion — aceptar polígono y guardar en geom
  □ Backend POST /api/auth/registro-nuevo-productor — guardar polígono en geom
  □ MapaUP.tsx — mostrar polígono si existe

DÍA 4 — Ciclo productivo (5–6 horas)
  □ Verificar guards de /api/ups/:up_id/cycles y /api/cycles/:cycle_id/crops
     para rol 'productor'
  □ Crear CicloProductivoPage.tsx (4 pasos)
  □ Agregar ruta /productor/ciclo en router.tsx
  □ LoginPinPage.tsx — verificarCompletitud al hacer login
  □ DashboardProductorPage.tsx — banner de ciclo pendiente
  □ LayoutProductor.tsx — badge en ícono de perfil
  □ MiPerfilPage.tsx — sección de ciclo productivo

DÍA 5 — Correo y precios (3–4 horas)
  □ Backend: ALTER TABLE producer ADD COLUMN correo
  □ RegistroNuevoPage.tsx paso 5 — agregar campo correo
  □ MiPerfilPage.tsx — mostrar correo en sección contacto
  □ GET /api/productor/precios — verificar campos Chicago y tipo de cambio
  □ PreciosProductorPage.tsx — reescribir con nueva estructura 3 precios
```

---

## Resumen de cambios por archivo

| Archivo | Tipo | Qué cambia |
|---|---|---|
| `ActivarCuentaPage.tsx` línea 29 | Bug fix | navigate a `/login-productor` |
| `MapaBodegasPage.tsx` líneas 49–75 | Bug fix + feature | Coords reales + zoom territorio + filtro radio |
| `MapaBodegasPage.tsx` línea 76 | Feature | Tiles ESRI satelital |
| `MapaUP.tsx` línea 59 | Feature | Tiles ESRI + mostrar polígono |
| `RegistroNuevoPage.tsx` paso 4 | Feature | DibujarPoligonoUP + pregunta coincidencia área |
| `RegistroNuevoPage.tsx` paso 5 | Feature | Campo correo opcional |
| `CompletarUbicacionPage.tsx` | Feature | DibujarPoligonoUP + precargar polígono |
| `CicloProductivoPage.tsx` | Nuevo | 4 pasos, endpoints existentes del backend |
| `router.tsx` | Modificar | Ruta `/productor/ciclo` |
| `LoginPinPage.tsx` | Modificar | Verificar completitud al hacer login |
| `DashboardProductorPage.tsx` | Modificar | Banner ciclo pendiente |
| `LayoutProductor.tsx` | Modificar | Badge en ícono de perfil |
| `MiPerfilPage.tsx` | Modificar | Sección ciclo + campo correo |
| `PreciosProductorPage.tsx` | Reescribir | Nueva estructura 3 precios |
| `DibujarPoligonoUP.tsx` | Nuevo componente | leaflet-draw + turf.js |

## Resumen de cambios en backend

| Endpoint / Tabla | Tipo | Qué cambia |
|---|---|---|
| `GET /api/productor/dashboard` | Modificar | Agregar lat/lng al SELECT de up |
| `GET /api/bodegas` | Modificar | Parámetros opcionales lat/lng/radio_km |
| `PATCH /api/productor/ubicacion` | Modificar | Aceptar polígono → guardar en up.geom |
| `POST /api/auth/registro-nuevo-productor` | Modificar | Aceptar polígono y correo |
| `PATCH /api/productor/perfil` | Modificar | Aceptar correo |
| `GET /api/mis-ups` | Verificar | Que devuelva geom_coordenadas como array |
| `GET /api/productor/precios` | Verificar | Que devuelva precio_chicago y tipo_cambio_mxn |
| `cycles.ts` endpoints | Verificar | Que acepten JWT con rol 'productor' |
| `ALTER TABLE producer` | BD | Agregar columna `correo VARCHAR(200)` |

---

*SIMAC — Plan Nacional Maíz 2026 · Mayo 2026*
*Repo: github.com/Jesus200995/Simulador · App: app-bodega/*
*Basado en auditoría de código real — archivos y líneas verificados*
*Referencias: ProductorUPView.vue, SeguimientoEstimacionView.vue, cycles.ts, seguimiento.ts*
