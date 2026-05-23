# SIMAC — Documento de Correcciones Técnicas v2
**Backend + Frontend — Módulo Bodega**  
**Versión:** 2.0 · **Fecha:** Mayo 2026  
**Para:** Equipo de desarrollo frontend/backend  
**Repo:** github.com/Jesus200995/Simulador  
**Auditoría realizada con:** Claude Code sobre el repositorio completo

> ⚠️ Este documento consolida los errores detectados en la auditoría de backend (Claude Code) y las observaciones visuales del frontend. Está organizado por prioridad de impacto. Resolver primero los marcados como 🔴 CRÍTICO.

---

## RESUMEN EJECUTIVO

| Flujo | Estado actual | Prioridad |
|---|---|---|
| F1 — Productor anuncia disponibilidad de maíz | ❌ No implementado — columnas faltantes en BD | 🔴 Crítica |
| F2 — Bodegas ven oferta de productores cercanos | ⚠️ Parcial — existe pero sin PostGIS ni radio real | 🟡 Media |
| F3 — Bodega marca interés en oferta de productores | ❌ No implementado | 🔴 Crítica |
| F4 — Bodega publica requerimiento de maíz | ⚠️ Funcional pero notificación es broadcast masivo | 🟡 Media |
| F5 — KPI productores cercanos en tablero | ❌ KPI no existe en la respuesta del endpoint | 🔴 Crítica |
| F6 — Datos de bodega no aparecen (capacidad, KPI ocupación) | ❌ Capacidad siempre vacía — KPI incorrecto | 🔴 Crítica |
| F7 — Notificación al productor incompleta | ⚠️ Existe pero sin distancia, precio ni enlace al mapa | 🟡 Media |
| F8 — Contador "Me interesa" en tiempo real | ❌ No implementado en frontend | 🔴 Crítica |

---

## PARTE 1 — CORRECCIONES DE BACKEND

---

### B-01 🔴 CRÍTICO — Migración faltante en `cycle_crop`: columnas que no existen en BD

**Archivo afectado:** `migrate_v4_productor.sql`  
**Archivo de código:** `cycles.ts:142-153`

**Problema:**  
El código en `cycles.ts` hace INSERT con los campos `planting_date`, `estimated_harvest_date` y `yield_expected`, pero ninguna migración SQL define esas columnas en la tabla `cycle_crop`. Cualquier INSERT de ciclo falla en producción con:
```
ERROR: column "planting_date" does not exist
ERROR: column "estimated_harvest_date" does not exist  
ERROR: column "yield_expected" does not exist
```

**Corrección — ejecutar esta migración:**
```sql
-- migrate_v9_cycle_crop_campos.sql
ALTER TABLE cycle_crop 
  ADD COLUMN IF NOT EXISTS planting_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_harvest_date DATE,
  ADD COLUMN IF NOT EXISTS yield_expected NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tipo_maiz VARCHAR(20) 
    CHECK (tipo_maiz IN ('blanco','amarillo','criollo')),
  ADD COLUMN IF NOT EXISTS ventana_venta VARCHAR(20) 
    DEFAULT 'esta_semana'
    CHECK (ventana_venta IN ('esta_semana','quincena','mes')),
  ADD COLUMN IF NOT EXISTS disponible_para_venta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_disponibilidad DATE;
```

**Verificación después de la migración:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'cycle_crop'
ORDER BY ordinal_position;
-- Debe incluir: planting_date, estimated_harvest_date, 
-- yield_expected, tipo_maiz, ventana_venta, disponible_para_venta
```

---

### B-02 🔴 CRÍTICO — No existe tabla ni mecanismo de disponibilidad declarada por el productor

**Problema:**  
El sistema NO tiene forma de que un productor declare activamente que tiene maíz disponible para vender. La "disponibilidad" actual es inferida (cualquier productor con ciclo del año actual = disponible), lo cual es incorrecto.

**Lo que debe existir:**  
Cuando el productor toca "Tengo maíz disponible" en su app, debe crearse un registro real en BD.

**Corrección — crear tabla nueva:**
```sql
-- migrate_v9_disponibilidad_productor.sql
CREATE TABLE IF NOT EXISTS disponibilidad_productor (
  id                    SERIAL PRIMARY KEY,
  producer_id           BIGINT REFERENCES producer(producer_id) NOT NULL,
  up_id                 BIGINT REFERENCES up(up_id) NOT NULL,
  tipo_maiz             VARCHAR(20) NOT NULL 
                          CHECK (tipo_maiz IN ('blanco','amarillo','criollo')),
  variedad_code         VARCHAR(40),
  volumen_estimado_ton  NUMERIC(10,2),
  ventana_venta         VARCHAR(20) NOT NULL 
                          CHECK (ventana_venta IN ('esta_semana','quincena','mes')),
  fecha_disponible      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento     DATE NOT NULL,
  activa                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice espacial para consultas PostGIS
CREATE INDEX IF NOT EXISTS disp_up_idx ON disponibilidad_productor(up_id);
```

**Endpoint nuevo a crear:**
```
POST /api/productor/disponibilidad
Body: { up_id, tipo_maiz, variedad_code, volumen_estimado_ton, ventana_venta }
- Crea registro en disponibilidad_productor
- Calcula fecha_vencimiento según ventana_venta:
    esta_semana → domingo de la semana actual
    quincena    → CURRENT_DATE + 15
    mes         → CURRENT_DATE + 30
- Marca activa = FALSE en registros anteriores del mismo producer_id + up_id

GET /api/productor/disponibilidad
- Lista disponibilidades activas del productor autenticado

DELETE /api/productor/disponibilidad/:id
- Marca activa = FALSE (no eliminar)
```

**Verificación:**
```sql
-- ¿Cuántas disponibilidades activas hay?
SELECT COUNT(*) FROM disponibilidad_productor WHERE activa = TRUE;

-- ¿Tienen los campos necesarios?
SELECT dp.id, p.nombre_completo, dp.tipo_maiz, dp.volumen_estimado_ton,
       dp.ventana_venta, dp.fecha_vencimiento
FROM disponibilidad_productor dp
JOIN producer p ON p.producer_id = dp.producer_id
WHERE dp.activa = TRUE
ORDER BY dp.created_at DESC LIMIT 10;
```

---

### B-03 🔴 CRÍTICO — Oferta de productores no usa PostGIS — no filtra por radio real

**Archivo afectado:** `oferta.ts:9-46`  
**Problema detectado por Claude Code:**  
El endpoint `GET /api/oferta/municipios` NO recibe `bodega_id` y NO calcula `ST_Distance` ni `ST_DWithin`. Usa `municipality_name` de la UP como proxy geográfico — esto significa que muestra productores de CUALQUIER municipio del país, no solo los cercanos a las bodegas del usuario.

**Corrección — reescribir el endpoint:**

```typescript
// oferta.ts — reemplazar la query actual por esta:
router.get('/municipios', authMiddleware, async (req, res) => {
  const { bodega_id, tipo_maiz, radio_km = 60 } = req.query;
  const usuario_id = req.user.id;

  // 1. Obtener coordenadas de las bodegas del usuario
  const bodegas = await pool.query(`
    SELECT b.id, b.nombre, b.latitud, b.longitud
    FROM bodegas b
    JOIN bodeguero_bodegas bb ON bb.bodega_id = b.id
    WHERE bb.usuario_id = $1 AND bb.estatus = 'aprobada'
      AND b.latitud IS NOT NULL AND b.longitud IS NOT NULL
  `, [usuario_id]);

  if (bodegas.rows.length === 0) {
    return res.json({ data: [], mensaje: 'No tienes bodegas registradas' });
  }

  // 2. Para cada bodega, buscar disponibilidades en el radio
  // Usar la primera bodega como referencia (o el centroide de todas)
  const bodegaRef = bodegas.rows[0];
  const radioMetros = Number(radio_km) * 1000;

  const query = `
    SELECT 
      u.municipality_name AS municipio,
      u.state_name AS estado,
      COUNT(DISTINCT dp.producer_id) AS productores_count,
      COALESCE(SUM(dp.volumen_estimado_ton), 0) AS toneladas_aprox,
      MODE() WITHIN GROUP (ORDER BY dp.ventana_venta) AS ventana_predominante,
      MIN(ST_Distance(
        u.centroid::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography
      ) / 1000) AS distancia_km_min
    FROM disponibilidad_productor dp
    JOIN up u ON u.up_id = dp.up_id
    WHERE dp.activa = TRUE
      AND dp.fecha_vencimiento >= CURRENT_DATE
      AND ST_DWithin(
        u.centroid::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        $3
      )
      ${tipo_maiz && tipo_maiz !== 'all' ? 'AND dp.tipo_maiz = $4' : ''}
    GROUP BY u.municipality_name, u.state_name
    HAVING COUNT(DISTINCT dp.producer_id) > 0
    ORDER BY distancia_km_min ASC
  `;

  const params = [bodegaRef.longitud, bodegaRef.latitud, radioMetros];
  if (tipo_maiz && tipo_maiz !== 'all') params.push(tipo_maiz);

  let result = await pool.query(query, params);

  // 3. Fallback al estado si hay menos de 5 productores totales
  const totalProductores = result.rows.reduce((sum, r) => sum + Number(r.productores_count), 0);
  
  if (totalProductores < 5) {
    // Ampliar al estado de la bodega — sin límite de radio
    const fallbackQuery = `/* misma query sin ST_DWithin, filtrando por state_name */`;
    result = await pool.query(fallbackQuery, [bodegaRef.longitud, bodegaRef.latitud]);
    // Agregar campo en respuesta para que el frontend muestre el aviso
    return res.json({ 
      data: result.rows, 
      fallback: true,
      mensaje: `Mostrando productores en todo el estado porque no se encontraron suficientes en el radio de ${radio_km} km`
    });
  }

  return res.json({ data: result.rows, fallback: false });
});
```

**Verificación:**
```sql
-- ¿Las UPs tienen centroide calculado?
SELECT COUNT(*) AS total, 
       COUNT(centroid) AS con_centroide,
       COUNT(*) - COUNT(centroid) AS sin_centroide
FROM up;

-- ¿El índice espacial existe?
SELECT indexname FROM pg_indexes 
WHERE tablename = 'up' AND indexname LIKE '%gix%';
```

> ⚠️ **Importante:** Si `sin_centroide > 0`, hay UPs sin coordenadas. Esas UPs no aparecerán en ninguna búsqueda espacial. Hay que calcular el centroide faltante o marcarlo como nulo en la UI.

---

### B-04 🔴 CRÍTICO — No existe endpoint para que la bodega marque interés en oferta de productores

**Problema detectado por Claude Code:**  
`POST /api/senales-compra/:id/interes` existe pero está invertido — es para que un PRODUCTOR marque interés en una señal de la BODEGA. No existe el flujo contrario: bodega marca interés en la oferta de un municipio de productores.

**Corrección — crear nuevo endpoint:**

```typescript
// oferta.ts — agregar este endpoint nuevo
router.post('/municipios/:municipio/interes', authMiddleware, async (req, res) => {
  const { municipio } = req.params;
  const { bodega_id, tipo_maiz, precio_ofrecido } = req.body;
  const usuario_id = req.user.id;

  // 1. Verificar que la bodega pertenece al usuario
  const bodegaCheck = await pool.query(
    `SELECT b.id, b.nombre, b.municipio, b.estado, b.latitud, b.longitud,
            ic.telefono, ic.nombre AS contacto_nombre
     FROM bodegas b
     JOIN bodeguero_bodegas bb ON bb.bodega_id = b.id
     LEFT JOIN infraestructura_contactos ic ON ic.bodega_id = b.id AND ic.es_principal = TRUE
     WHERE b.id = $1 AND bb.usuario_id = $2 AND bb.estatus = 'aprobada'`,
    [bodega_id, usuario_id]
  );
  if (bodegaCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Bodega no encontrada o no autorizada' });
  }
  const bodega = bodegaCheck.rows[0];

  // 2. Obtener los producer_id de productores con disponibilidad en ese municipio
  const productores = await pool.query(
    `SELECT DISTINCT p.id AS usuario_id, dp.producer_id
     FROM disponibilidad_productor dp
     JOIN up u ON u.up_id = dp.up_id
     JOIN producer pr ON pr.producer_id = dp.producer_id
     JOIN usuarios p ON p.curp = pr.curp  -- join por CURP para obtener usuario_id
     WHERE u.municipality_name = $1
       AND dp.activa = TRUE
       AND dp.fecha_vencimiento >= CURRENT_DATE
       ${tipo_maiz ? 'AND dp.tipo_maiz = $2' : ''}`,
    tipo_maiz ? [municipio, tipo_maiz] : [municipio]
  );

  // 3. Crear notificación para cada productor con info completa de la bodega
  const notifTexto = 
    `🏪 La bodega "${bodega.nombre}" está interesada en comprar maíz en ${municipio}.\n\n` +
    `📍 Ubicación: ${bodega.municipio}, ${bodega.estado}\n` +
    `📞 Contacto: ${bodega.contacto_nombre} — ${bodega.telefono}\n` +
    `💰 Precio ofrecido: $${precio_ofrecido}/ton\n\n` +
    `Acércate a la bodega si quieres vender tu maíz.`;

  for (const prod of productores.rows) {
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, referencia_id, leida)
       VALUES ($1, $2, $3, 'interes_bodega_oferta', $4, FALSE)`,
      [prod.usuario_id, `Bodega interesada en tu maíz en ${municipio}`, notifTexto, bodega_id]
    );
  }

  return res.json({ 
    ok: true, 
    productores_notificados: productores.rows.length 
  });
});
```

**Verificación:**
```sql
-- ¿Notificaciones del tipo correcto se están creando?
SELECT tipo, COUNT(*) FROM notificaciones 
GROUP BY tipo ORDER BY COUNT(*) DESC;

-- ¿Qué tipos existen actualmente?
SELECT DISTINCT tipo FROM notificaciones;
```

---

### B-05 🟡 MEDIO — Notificación masiva en requerimientos: el radio_km se almacena pero nunca se usa

**Archivo afectado:** `senales-compra.ts:100-105`  
**Problema detectado por Claude Code:**  
Al publicar un requerimiento, la notificación se envía a TODOS los productores y técnicos activos del sistema con esta query:
```sql
SELECT id FROM usuarios WHERE rol IN ('productor','tecnico') AND activo = TRUE
```
Si hay 10,000 productores activos, los 10,000 reciben la notificación — ignorando completamente el `radio_km` almacenado en la señal.

**Corrección — reemplazar esa query por una con PostGIS:**
```typescript
// senales-compra.ts — reemplazar la query de notificación masiva

// Obtener coordenadas de la bodega del requerimiento
const bodegaCoords = await pool.query(
  `SELECT b.latitud, b.longitud, b.estado 
   FROM bodegas b WHERE b.id = $1`,
  [bodega_id]
);
const { latitud, longitud, estado } = bodegaCoords.rows[0];
const radioMetros = radio_km * 1000;

// Buscar productores en el radio usando PostGIS
let productoresQuery = await pool.query(`
  SELECT DISTINCT u.id AS usuario_id,
    ST_Distance(
      up.centroid::geography,
      ST_SetSRID(ST_Point($1, $2), 4326)::geography
    ) / 1000 AS distancia_km
  FROM usuarios u
  JOIN producer p ON p.curp = u.curp
  JOIN up ON up.producer_id = p.producer_id
  WHERE u.rol = 'productor' AND u.activo = TRUE
    AND ST_DWithin(
      up.centroid::geography,
      ST_SetSRID(ST_Point($1, $2), 4326)::geography,
      $3
    )
  ORDER BY distancia_km ASC
`, [longitud, latitud, radioMetros]);

// Fallback al estado si hay menos de 5 productores en el radio
if (productoresQuery.rows.length < 5) {
  productoresQuery = await pool.query(`
    SELECT DISTINCT u.id AS usuario_id, 0 AS distancia_km
    FROM usuarios u
    JOIN producer p ON p.curp = u.curp
    JOIN up ON up.producer_id = p.producer_id
    WHERE u.rol = 'productor' AND u.activo = TRUE
      AND up.state_name = $1
  `, [estado]);
}

// Insertar notificación para cada productor encontrado (con distancia real)
for (const prod of productoresQuery.rows) {
  const distanciaTexto = prod.distancia_km > 0 
    ? `a ${Math.round(prod.distancia_km)} km de tu parcela` 
    : `en tu estado`;
  
  await pool.query(`
    INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, referencia_id, leida)
    VALUES ($1, $2, $3, 'nuevo_requerimiento', $4, FALSE)
  `, [
    prod.usuario_id,
    `Bodega busca maíz ${distanciaTexto}`,
    `🔔 La bodega "${bodega.nombre}" busca ${volumen_ton} ton de ${tipo_maiz} a $${precio_ofrecido}/ton. Está ${distanciaTexto}.\n\n📍 ${bodega.municipio}, ${bodega.estado}\n📞 ${bodega.telefono}`,
    senal_id
  ]);
}
```

**Verificación:**
```sql
-- ¿A cuántos usuarios se notifica actualmente? (debería ser filtrado)
SELECT COUNT(*) FROM usuarios 
WHERE rol IN ('productor','tecnico') AND activo = TRUE;
-- Si este número es muy alto (>100), la notificación masiva está activa

-- Verificar CHECK constraint roto en vigencia:
SELECT pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'senales_compra' AND c.contype = 'c';
-- Debe incluir 'rango' en los valores permitidos o eliminar el constraint
```

**Fix adicional — CHECK constraint roto:**
```sql
-- El constraint actual no incluye 'rango' pero el código lo usa
-- Corrección:
ALTER TABLE senales_compra DROP CONSTRAINT IF EXISTS senales_compra_vigencia_check;
ALTER TABLE senales_compra ADD CONSTRAINT senales_compra_vigencia_check 
  CHECK (vigencia IN ('esta_semana', '15_dias', 'rango'));
```

---

### B-06 🔴 CRÍTICO — KPI "productores cercanos" no existe en `GET /api/home/stats`

**Archivo afectado:** `home.ts:165-220`  
**Problema detectado por Claude Code:**  
La rama bodega del endpoint devuelve: `mis_bodegas`, `total_stock`, `total_capacidad`, `ocupacion_pct`, `ultimo_precio`, `tiene_ventanilla`, `solicitudes_pendientes`. **No hay `productores_cercanos`.**

**Corrección — agregar la subconsulta en `home.ts`:**

```typescript
// home.ts — dentro de la rama bodega, agregar esta subconsulta:

const productoresCercanos = await pool.query(`
  SELECT 
    COUNT(DISTINCT dp.producer_id) AS productores_count,
    COALESCE(SUM(dp.volumen_estimado_ton), 0) AS toneladas_aprox
  FROM disponibilidad_productor dp
  JOIN up u ON u.up_id = dp.up_id
  WHERE dp.activa = TRUE
    AND dp.fecha_vencimiento >= CURRENT_DATE
    AND EXISTS (
      SELECT 1 FROM bodegas b
      JOIN bodeguero_bodegas bb ON bb.bodega_id = b.id
      WHERE bb.usuario_id = $1 
        AND bb.estatus = 'aprobada'
        AND b.latitud IS NOT NULL
        AND ST_DWithin(
          u.centroid::geography,
          ST_SetSRID(ST_Point(b.longitud, b.latitud), 4326)::geography,
          50000  -- 50 km default hasta que bodegas tenga radio_km propio
        )
    )
`, [usuario_id]);

// Agregar al objeto de respuesta:
return res.json({
  ...datosActuales,
  productores_cercanos: Number(productoresCercanos.rows[0].productores_count),
  toneladas_cercanas: Number(productoresCercanos.rows[0].toneladas_aprox),
});
```

**Verificación:**
```sql
-- Simular el cálculo del KPI manualmente:
SELECT COUNT(DISTINCT dp.producer_id) AS productores_en_radio
FROM disponibilidad_productor dp
JOIN up u ON u.up_id = dp.up_id
WHERE dp.activa = TRUE
  AND ST_DWithin(
    u.centroid::geography,
    ST_SetSRID(ST_Point(-102.5528, 19.9467), 4326)::geography,  -- coords de bodega ejemplo
    50000
  );
```

---

### B-07 🟡 MEDIO — Job diario usa `setTimeout` en cadena — no sobrevive reinicios del proceso

**Archivo afectado:** `bodegaDailyJobs.ts`  
**Problema detectado por Claude Code:**  
El job usa `setTimeout` encadenado. Si el proceso Node se reinicia, el job no se recupera hasta el día siguiente.

**Corrección recomendada — usar `node-cron`:**
```bash
npm install node-cron @types/node-cron
```

```typescript
// bodegaDailyJobs.ts — reemplazar setTimeout por cron
import cron from 'node-cron';

// Corre todos los días a las 00:01
cron.schedule('1 0 * * *', async () => {
  await pool.query(`
    UPDATE senales_compra 
    SET activa = FALSE 
    WHERE activa = TRUE AND fecha_vencimiento < CURRENT_DATE
  `);
  
  await pool.query(`
    UPDATE transacciones 
    SET confirmacion_productor = 'expirada'
    WHERE confirmacion_productor = 'pendiente' 
      AND created_at < NOW() - INTERVAL '48 hours'
  `);
  
  await pool.query(`
    UPDATE disponibilidad_productor
    SET activa = FALSE
    WHERE activa = TRUE AND fecha_vencimiento < CURRENT_DATE
  `);
  
  console.log(`[CRON] Jobs diarios ejecutados: ${new Date().toISOString()}`);
});
```

---

## PARTE 2 — CORRECCIONES DE FRONTEND

---

### F-01 🔴 CRÍTICO — Capacidad de bodega aparece vacía (`—`) en pantalla General

**Pantalla:** B-06 — Tab General (visible en Imagen 2)  
**Problema:** `Capacidad` muestra `—` en lugar del valor real.

**Qué revisar:**
1. Confirmar que `GET /api/infraestructura/:id` devuelve `capacidad_ton` con valor real:
   ```bash
   curl -H "Authorization: Bearer TOKEN" /api/infraestructura/ID_BODEGA
   # Verificar que capacidad_ton no es null en la respuesta JSON
   ```
2. Si la API devuelve `null`: el problema es que las bodegas en BD tienen `capacidad_ton = NULL`. Hay que cargar los datos reales o al menos mostrar `"Sin datos"` en lugar de `—`.
3. Si la API devuelve el valor correcto: el problema es en el componente React — verificar que mapea `response.capacidad_ton` correctamente al campo visual.

**Cómo debe quedar:**
```
Capacidad        500 ton     ← valor real
                             ← si es null: "Sin datos registrados"
```

> ⚠️ **Impacto en cadena:** Si `capacidad_ton` es NULL en la BD, el KPI de Ocupación del Tablero siempre será incorrecto (división por cero o 0%). Este bug bloquea el KPI 4.

**Fix en BD para las bodegas existentes:**
```sql
-- Ver cuáles bodegas tienen capacidad en NULL:
SELECT id, nombre, capacidad_ton FROM bodegas 
WHERE capacidad_ton IS NULL OR capacidad_ton = 0
ORDER BY nombre;

-- Si hay datos reales disponibles, actualizar manualmente:
-- UPDATE bodegas SET capacidad_ton = X WHERE id = Y;
```

---

### F-02 🔴 CRÍTICO — KPI Ocupación depende de `capacidad_ton` — siempre incorrecto si está en NULL

**Pantalla:** B-04 — Tablero  
**Problema:** El KPI de Ocupación muestra `0%` porque `capacidad_ton = 0` en BD (ver F-01).

**La fórmula correcta que debe usar el backend:**
```sql
SELECT
  COALESCE(SUM(i.volumen_almacenamiento), 0) AS stock_actual,
  COALESCE(SUM(b.capacidad_ton), 0) AS capacidad_total,
  CASE 
    WHEN SUM(b.capacidad_ton) > 0 
    THEN ROUND((SUM(i.volumen_almacenamiento) / SUM(b.capacidad_ton)) * 100, 1)
    ELSE 0 
  END AS ocupacion_pct,
  COALESCE(SUM(b.capacidad_ton), 0) - COALESCE(SUM(i.volumen_almacenamiento), 0) 
    AS espacio_libre
FROM bodeguero_bodegas bb
JOIN bodegas b ON b.id = bb.bodega_id
LEFT JOIN LATERAL (
  SELECT volumen_almacenamiento FROM inventarios
  WHERE bodega_id = b.id AND activa = TRUE
  ORDER BY fecha DESC LIMIT 1
) i ON TRUE
WHERE bb.usuario_id = $1 AND bb.estatus = 'aprobada'
```

**Cómo debe mostrarse en el frontend:**
```
Ocupación del almacén

        72%
████████████░░░░

3,600 ton almacenadas
de 5,000 ton de capacidad total
1,400 ton de espacio disponible
```

**Color de la barra:**
- Verde `#1A5C38`: ocupación < 70%
- Naranja `#E65100`: ocupación 70%–90%
- Rojo `#C62828`: ocupación > 90%

---

### F-03 🟡 MEDIO — Oferta de productores: falta botón "Publicar requerimiento para este municipio" con precarga

**Pantalla:** B-11 — Módulo Oferta (visible en Imagen 1)  
**Problema:** El botón "Publicar requerimiento" existe pero abre el formulario vacío. Debe precargar el municipio como destino del requerimiento.

**Corrección en frontend:**
```typescript
// Al tocar "Publicar requerimiento" en una fila de la tabla:
const handlePublicarRequerimiento = (municipio: string, estado: string) => {
  navigate('/requerimientos/nuevo', {
    state: { 
      municipio_destino: municipio,
      estado_destino: estado 
    }
  });
};

// En el formulario de nuevo requerimiento (B-10):
// Si viene state.municipio_destino, mostrar el campo pre-llenado 
// y con nota: "Requerimiento dirigido a productores de [municipio]"
```

---

### F-04 🟡 MEDIO — Falta mapa alternativo con puntos de calor en Oferta de productores

**Pantalla:** B-11/B-12 — Módulo Oferta  
**Problema:** Solo existe la vista de tarjetas por municipio. Falta el mapa con puntos de calor (heatmap) mostrando la concentración de oferta.

**Implementación requerida:**
```typescript
// Componente MapaOferta.tsx usando react-leaflet
import { MapContainer, TileLayer } from 'react-leaflet';
// Usar leaflet.heat para el heatmap

// Los puntos del heatmap se obtienen del mismo endpoint:
// GET /api/oferta/municipios — devuelve municipios con productores_count
// Convertir a coordenadas aproximadas del centroide del municipio
// El "peso" del punto es productores_count (más productores = punto más intenso)

// Al tocar un punto del mapa: mostrar popup con:
// - Nombre del municipio
// - Número de productores
// - Toneladas aproximadas
// - Ventana de tiempo predominante
// - Botón "Publicar requerimiento para este municipio"
```

---

### F-05 🔴 CRÍTICO — Contador "Me interesa" en tiempo real no está implementado en frontend

**Pantalla:** B-10 — Requerimientos activos  
**Problema:** Cuando los productores responden "Me interesa" a un requerimiento, el bodeguero debe ver el contador actualizarse en tiempo real. Esto no está implementado.

**Opciones de implementación (elegir una):**

**Opción A — Polling cada 30 segundos (más simple):**
```typescript
// En el componente de requerimientos activos:
useEffect(() => {
  const fetchRequerimientos = async () => {
    const data = await request('/api/senales-compra?activa=true');
    setRequerimientos(data);
  };
  
  fetchRequerimientos(); // carga inicial
  const interval = setInterval(fetchRequerimientos, 30000); // cada 30s
  return () => clearInterval(interval);
}, []);
```

**Opción B — WebSocket (más elegante, más complejo):**
```typescript
// Solo si el backend ya tiene soporte de WebSocket
// Suscribirse al evento 'interes_actualizado' para la señal específica
```

> 💡 **Recomendación:** Usar Opción A (polling) para el MVP. Es suficiente para el piloto y no requiere cambios en backend.

---

### F-06 🟡 MEDIO — Notificación al productor incompleta: falta distancia, precio y enlace al mapa

**Afecta:** Sistema de notificaciones (backend + frontend del productor)  
**Problema:** La notificación que recibe el productor cuando una bodega publica un requerimiento no incluye: distancia desde su UP, precio ofrecido, ni enlace al mapa con la ubicación de la bodega.

**Formato correcto de la notificación — ya especificado en B-05 del backend:**
```
🔔 La bodega "EL TRIGAL" busca maíz a 12 km de tu parcela.

📍 Pénjamo, Guanajuato
📞 Juan Ramírez — 477 123 4567
💰 Precio ofrecido: $4,500/ton
🌽 Busca: 50 ton de Maíz Blanco
📅 Para: del 26 mayo al 9 junio 2026

[Ver bodega en el mapa →]
```

**En el frontend del productor:** el botón "Ver bodega en el mapa" debe abrir la app centrada en las coordenadas de la bodega y mostrar su marcador en el mapa.

---

### F-07 🟡 MEDIO — Falta leyenda "Mi bodega no está en la lista" en onboarding de selección de bodegas

**Pantalla:** B-03 — Selección de bodegas  
**Problema:** No aparece la opción para el usuario que no encuentra su bodega en el catálogo.

**Corrección:**
```typescript
// Al final de la lista de resultados de búsqueda, siempre mostrar:
<div className="border-t pt-4 mt-4">
  <p className="text-sm text-gray-500 mb-2">
    ¿No encontraste tu bodega?
  </p>
  <button 
    onClick={() => setMostrarFormularioAlta(true)}
    className="text-green-700 font-medium text-sm underline"
  >
    + Mi bodega no está en la lista — solicitar alta
  </button>
</div>
```

> ⚠️ El formulario de alta de bodega nueva requiere validación del admin. Al enviarlo mostrar: *"Tu solicitud fue enviada. Te notificaremos cuando sea aprobada para que puedas comenzar a operar."*

---

### F-08 🟡 MEDIO — Módulo Transacciones: verificar conexión con base de productores y notificación de confirmación

**Pantalla:** B-13 — Registro de transacción  
**Pendiente de verificar:**

1. **¿El campo de búsqueda de productor consulta la BD real?**
   ```typescript
   // Debe hacer fetch a:
   GET /api/productores/buscar?q=TEXTO_BUSCADO
   // Con debounce de 300ms después de escribir 3+ caracteres
   // Mostrar dropdown con: nombre, municipio, últimos 4 de CURP
   ```

2. **¿Al guardar la transacción se envía notificación al productor?**
   ```sql
   -- Verificar en BD que las notificaciones de confirmación existen:
   SELECT * FROM notificaciones 
   WHERE tipo = 'confirmacion_transaccion'
   ORDER BY created_at DESC LIMIT 5;
   ```

3. **¿El productor puede confirmar o reportar discrepancia?**  
   Verificar que el endpoint `PATCH /api/transacciones/:id/confirmar` existe y actualiza `confirmacion_productor` y `peso_precio_sistema` correctamente.

---

## PARTE 3 — ORDEN DE TRABAJO RECOMENDADO

### Semana 1 — Bases de datos (sin esto nada funciona)
```
1. Ejecutar migrate_v9_cycle_crop_campos.sql         (B-01)
2. Ejecutar migrate_v9_disponibilidad_productor.sql  (B-02)
3. Cargar datos reales de capacidad_ton en bodegas   (F-01)
4. Fix CHECK constraint vigencia en senales_compra   (B-05)
5. Reemplazar setTimeout por node-cron               (B-07)
```

### Semana 2 — Backend core
```
6. Crear endpoints POST/GET /api/productor/disponibilidad  (B-02)
7. Reescribir GET /api/oferta/municipios con PostGIS        (B-03)
8. Crear POST /api/oferta/municipios/:municipio/interes     (B-04)
9. Corregir notificación masiva → filtro por radio PostGIS  (B-05)
10. Agregar productores_cercanos en GET /api/home/stats     (B-06)
```

### Semana 3 — Frontend
```
11. Fix capacidad en B-06 General                    (F-01)
12. Fix KPI Ocupación con fórmula correcta           (F-02)
13. Precarga de municipio en formulario requerimiento (F-03)
14. Agregar mapa de calor en Oferta                  (F-04)
15. Polling cada 30s para contador "Me interesa"     (F-05)
16. Fix formato de notificación al productor         (F-06)
17. Agregar leyenda "Mi bodega no está en la lista"  (F-07)
18. Verificar autocompletado y notificación en B-13  (F-08)
```

---

## PARTE 4 — QUERIES DE DIAGNÓSTICO RÁPIDO

Ejecutar estas queries directamente en PostgreSQL para verificar el estado actual antes de cada corrección:

```sql
-- 1. ¿Existen las columnas críticas en cycle_crop?
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cycle_crop' ORDER BY ordinal_position;

-- 2. ¿Existe la tabla disponibilidad_productor?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'disponibilidad_productor'
) AS existe;

-- 3. ¿Las UPs tienen centroide para PostGIS?
SELECT COUNT(*) total, COUNT(centroid) con_centroide 
FROM up;

-- 4. ¿Las bodegas tienen coordenadas para PostGIS?
SELECT COUNT(*) total, 
       COUNT(latitud) con_latitud,
       COUNT(longitud) con_longitud
FROM bodegas;

-- 5. ¿Cuántos productores activos hay (tamaño del broadcast actual)?
SELECT COUNT(*) FROM usuarios 
WHERE rol IN ('productor','tecnico') AND activo = TRUE;

-- 6. ¿Las transacciones se están guardando?
SELECT COUNT(*), MAX(created_at) as ultima
FROM transacciones;

-- 7. ¿El KPI de ocupación tiene datos reales?
SELECT b.nombre, b.capacidad_ton, 
       MAX(i.volumen_almacenamiento) AS ultimo_stock,
       CASE WHEN b.capacidad_ton > 0 
         THEN ROUND((MAX(i.volumen_almacenamiento)/b.capacidad_ton)*100,1) 
         ELSE 0 END AS ocupacion_pct
FROM bodegas b
LEFT JOIN inventarios i ON i.bodega_id = b.id
GROUP BY b.id, b.nombre, b.capacidad_ton
ORDER BY b.nombre;

-- 8. ¿Qué tipos de notificaciones existen actualmente?
SELECT tipo, COUNT(*) FROM notificaciones 
GROUP BY tipo ORDER BY COUNT(*) DESC;
```

---

## PARTE 5 — TABLA RESUMEN DE TODOS LOS CAMBIOS

| ID | Descripción | Archivo(s) afectado(s) | Tipo | Prioridad |
|---|---|---|---|---|
| B-01 | Migración columnas faltantes en cycle_crop | `migrate_v9_cycle_crop.sql` (nuevo) | SQL | 🔴 |
| B-02 | Crear tabla y endpoints de disponibilidad del productor | `migrate_v9_disponibilidad.sql` + `productor-disponibilidad.ts` (nuevo) | SQL + TS | 🔴 |
| B-03 | Reescribir oferta/municipios con PostGIS + fallback | `oferta.ts` | TS | 🔴 |
| B-04 | Crear endpoint interés de bodega en oferta de municipio | `oferta.ts` | TS | 🔴 |
| B-05 | Fix notificación masiva → filtro por radio PostGIS + fix CHECK constraint | `senales-compra.ts` + SQL | TS + SQL | 🟡 |
| B-06 | Agregar KPI productores_cercanos en home/stats | `home.ts` | TS | 🔴 |
| B-07 | Reemplazar setTimeout por node-cron en jobs diarios | `bodegaDailyJobs.ts` | TS | 🟡 |
| F-01 | Fix capacidad_ton en pantalla General de bodega | Componente General + BD | React + SQL | 🔴 |
| F-02 | Fix KPI Ocupación con fórmula correcta y tres datos | Componente Tablero + `home.ts` | React + TS | 🔴 |
| F-03 | Precarga de municipio en formulario de requerimiento | Componente Oferta + Requerimiento | React | 🟡 |
| F-04 | Agregar mapa de calor en Oferta de productores | Componente MapaOferta (nuevo) | React | 🟡 |
| F-05 | Polling cada 30s para contador "Me interesa" | Componente Requerimientos | React | 🔴 |
| F-06 | Fix formato notificación al productor con distancia y enlace | `senales-compra.ts` + `oferta.ts` | TS | 🟡 |
| F-07 | Agregar leyenda "Mi bodega no está en la lista" | Componente SeleccionBodegas | React | 🟡 |
| F-08 | Verificar autocompletado productor y notificación en transacciones | `transacciones.ts` + Componente B-13 | TS + React | 🟡 |

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Basado en: Auditoría Claude Code del repositorio github.com/Jesus200995/Simulador*  
*Próxima revisión: tras entrega de correcciones — semana 3*
