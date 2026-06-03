# SIMAC — Corrección Urgente
## Distancias incorrectas — Centroide de parcela no se guarda bien
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar de inmediato

> El productor dibuja su parcela pero las distancias a las bodegas
> salen incorrectas o en 0 km. La causa es que el centroide calculado
> por turf.js se pierde antes de llegar a la base de datos.
> Son dos correcciones coordinadas — aplicar las dos juntas.

---

## DIAGNÓSTICO

**Bug 1 — Frontend:** usa `||` en lugar de `??` para enviar las coordenadas.
En JavaScript `coords?.lat || null` convierte a null cualquier valor falso —
incluyendo casos donde coords no se hidrata correctamente aunque el polígono
sí fue dibujado.

**Bug 2 — Backend:** si `lat`/`lng` llegan como null pero el polígono sí llegó,
el backend descarta el polígono completamente y usa el centroide del municipio.
No tiene red de seguridad para calcular el centroide desde el polígono.

**Resultado visible:** el productor dibuja su parcela, el sistema guarda el
centroide del municipio en lugar del centroide real → las distancias a bodegas
son incorrectas o muestran 0 km.

---

## CORRECCIÓN A — Frontend
**ARCHIVO:** `app-bodega/src/pages/auth/RegistroNuevoPage.tsx`
**LÍNEAS:** 178-179
**ACCIÓN:** REEMPLAZAR — cambiar `||` por `??`

**BUSCAR:**
```typescript
lat: coords?.lat || null,
lng: coords?.lng || null,
poligono: poligono || null,
```

**REEMPLAZAR CON:**
```typescript
lat: coords?.lat ?? null,
lng: coords?.lng ?? null,
poligono: poligono ?? null,
```

**Por qué importa este cambio:**
- `||` convierte a null cualquier valor "falso" — incluyendo `0`, `undefined`, o
  si `coords` no se llenó por una condición de carrera
- `??` solo convierte a null cuando el valor es exactamente `null` o `undefined`
- En México ningún centroide real debería ser exactamente `0`, pero el patrón
  `||` es frágil y puede perder coordenadas válidas en condiciones de borde

**VERIFICAR:**
```bash
grep -n "coords?.lat" app-bodega/src/pages/auth/RegistroNuevoPage.tsx
# Resultado esperado: coords?.lat ?? null — con ?? no con ||
```

---

## CORRECCIÓN B — Backend
**ARCHIVO:** `backend/src/routes/productor.ts`
**LÍNEAS:** 262-319
**ACCIÓN:** MODIFICAR — agregar cálculo de centroide desde polígono como red de seguridad

**BUSCAR el bloque completo de la condición hasCoords:**
```typescript
const hasCoords = lat && lng && lat !== 0 && lng !== 0;
if (hasCoords) {
  // ... INSERT con centroide del frontend
} else {
  // Busca el centroide del MUNICIPIO en municipios_referencia
  const muni = await client.query(
    `SELECT centroid::geometry AS centroid
     FROM municipios_referencia
     WHERE LOWER(nombre) = LOWER($1) AND LOWER(estado) = LOWER($2) LIMIT 1`,
    [municipio_up, estado_up]
  );
  centroidVal = muni.rows[0]?.centroid || null;
  await client.query(
    `INSERT INTO up (..., centroid, location_confirmed, centroid_source)
     VALUES ($1, ..., $4::geometry, FALSE, 'municipio')`,
    [producer_id, estado_up, municipio_up, centroidVal]
  );
}
```

**REEMPLAZAR CON:**
```typescript
const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
const hasPoligono = poligono && Array.isArray(poligono) && poligono.length >= 3;
const postgisActivo = process.env.POSTGIS_ENABLED === 'true';

if (hasCoords) {
  // Caso 1 — Frontend envió centroide calculado por turf.js ✅
  const geomSql = (hasPoligono && postgisActivo)
    ? `ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)`
    : 'NULL';

  const geomParam = (hasPoligono && postgisActivo)
    ? JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
          [poligono[0][1], poligono[0][0]],
        ]],
      })
    : null;

  const qParams = [
    producer_id, estado_up, municipio_up,
    lng, lat,  // $4=lng, $5=lat para ST_MakePoint
    ...(geomParam ? [geomParam] : []),
    area_calc_ha, area_real_ha, coincide_area,
  ];

  await client.query(
    `INSERT INTO up
       (producer_id, up_name, up_type, production_system, water_regime,
        state_name, municipality_name,
        centroid, geom,
        area_ha_calc, area_ha_real, coincide_area,
        location_confirmed, centroid_source)
     VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
             $2, $3,
             ST_SetSRID(ST_MakePoint($4, $5), 4326),
             ${geomSql},
             $${geomParam ? 7 : 6}, $${geomParam ? 8 : 7}, $${geomParam ? 9 : 8},
             TRUE, 'productor')`,
    qParams
  );

} else if (hasPoligono && postgisActivo) {
  // Caso 2 — RED DE SEGURIDAD: frontend envió polígono pero lat/lng llegaron null
  // El backend calcula el centroide directamente desde el polígono con PostGIS
  console.log('[UP] lat/lng null pero polígono disponible — calculando centroide con PostGIS');

  const geojson = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
      [poligono[0][1], poligono[0][0]],
    ]],
  });

  await client.query(
    `INSERT INTO up
       (producer_id, up_name, up_type, production_system, water_regime,
        state_name, municipality_name,
        centroid, geom,
        area_ha_calc, area_ha_real, coincide_area,
        location_confirmed, centroid_source)
     VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
             $2, $3,
             ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)),
             ST_SetSRID(ST_GeomFromGeoJSON($4), 4326),
             $5, $6, $7,
             TRUE, 'poligono_calculado')`,
    [producer_id, estado_up, municipio_up, geojson,
     area_calc_ha, area_real_ha, coincide_area]
  );

} else {
  // Caso 3 — Sin coordenadas ni polígono: usar centroide del municipio
  console.log('[UP] Sin coordenadas ni polígono — usando centroide del municipio');

  const muni = await client.query(
    `SELECT centroid::geometry AS centroid
     FROM municipios_referencia
     WHERE LOWER(nombre) = LOWER($1)
       AND LOWER(estado) = LOWER($2)
     LIMIT 1`,
    [municipio_up, estado_up]
  );

  const centroidVal = muni.rows[0]?.centroid || null;

  await client.query(
    `INSERT INTO up
       (producer_id, up_name, up_type, production_system, water_regime,
        state_name, municipality_name,
        centroid, geom,
        area_ha_calc, area_ha_real, coincide_area,
        location_confirmed, centroid_source)
     VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
             $2, $3,
             $4::geometry, NULL,
             $5, $6, $7,
             FALSE, 'municipio')`,
    [producer_id, estado_up, municipio_up, centroidVal,
     area_calc_ha, area_real_ha, coincide_area]
  );
}
```

---

## VERIFICAR — Prueba completa después de aplicar

### Verificación A — Caso normal (productor dibuja polígono)
1. Registrar productor de prueba dibujando polígono en el mapa
2. Verificar en BD:
```sql
SELECT
  up_id,
  municipality_name,
  centroid_source,
  location_confirmed,
  ST_AsText(centroid) AS centroide,
  CASE WHEN geom IS NULL THEN 'NO' ELSE 'SI' END AS tiene_poligono
FROM up
ORDER BY created_at DESC
LIMIT 1;
```
**Resultado esperado:**
```
centroid_source  : productor
location_confirmed: true
centroide        : POINT(-107.394 24.796)  ← coordenadas reales
tiene_poligono   : SI
```

### Verificación B — Red de seguridad (lat/lng null pero polígono existe)
Para probar este caso específico, temporalmente cambiar en el frontend:
```typescript
lat: null,   // forzar null para probar
lng: null,
poligono: poligono ?? null,  // polígono sí se envía
```
Registrar productor → verificar en BD:
```sql
SELECT centroid_source, location_confirmed, ST_AsText(centroid)
FROM up ORDER BY created_at DESC LIMIT 1;
```
**Resultado esperado:**
```
centroid_source  : poligono_calculado   ← red de seguridad activada
location_confirmed: true
centroide        : POINT(-107.394 24.796)  ← calculado por PostGIS
```
Revertir el cambio temporal del frontend después de la prueba.

### Verificación C — Distancias en la app
1. Login con el productor de prueba
2. Dashboard → bodegas cercanas
3. Las distancias deben mostrar km reales
4. **NO debe aparecer** el banner amarillo "Distancias aproximadas"

### Verificación D — grep para confirmar el cambio en frontend
```bash
grep -n "coords?.lat\|coords?.lng" app-bodega/src/pages/auth/RegistroNuevoPage.tsx
# Resultado esperado:
# coords?.lat ?? null   ← con ?? 
# coords?.lng ?? null   ← con ??
# NO debe aparecer || null
```

---

## Resumen de los 3 casos que cubre esta corrección

| Caso | Frontend envía | Backend hace | Resultado |
|---|---|---|---|
| Normal | lat/lng + polígono | Usa lat/lng del frontend | ✅ Centroide exacto de turf |
| Red de seguridad | null + polígono | Calcula centroide con PostGIS | ✅ Centroide calculado del polígono |
| Sin mapa | null + null | Usa centroide del municipio | ⚠️ Aproximado — con banner de aviso |

---

*SIMAC Plan Nacional Maíz 2026 · Corrección Urgente — Centroide y Distancias*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
