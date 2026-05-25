# SIMAC — Ajustes Pre-Piloto Módulo Bodega
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Base:** Auditoría final Claude Code — 24 mayo 2026

> El módulo Bodega está listo para piloto con estos 4 ajustes finales. Son cambios pequeños — estimado total: 2-3 horas de trabajo.

---

## RESUMEN

| ID | Ajuste | Archivo | Tiempo estimado |
|---|---|---|---|
| A-01 | Query de precio promedio incluye bodegas propias | `home.ts` | 15 min |
| A-02 | Falta indicador comparativo precio propio vs promedio | `B04Dashboard.tsx` | 30 min |
| A-03 | Archivo de migración obsoleto — riesgo en producción | `add_tipo_maiz_variety.sql` | 5 min |
| A-04 | Alta de bodega nueva envía coordenadas en 0 | `B03SelectBodegas.tsx` | 1-2 hrs |

---

## AJUSTES DETALLADOS

---

### A-01 🔴 URGENTE — Query de precio promedio incluye las bodegas propias del usuario

**Archivo:** `backend/src/routes/home.ts`

**Problema:**
```
El KPI 1 del tablero calcula el "promedio regional"
incluyendo los precios de las propias bodegas del usuario.

Eso significa que el bodeguero se está comparando 
contra sí mismo — el dato no refleja el mercado real.
```

**Corrección — agregar UNA condición al WHERE del query:**

```typescript
// Buscar la query que calcula precio_promedio_regional
// en la rama bodega de home.ts
// Agregar esta condición al WHERE:

AND pr.bodega_id NOT IN (
  SELECT bodega_id 
  FROM bodeguero_bodegas 
  WHERE usuario_id = $1
)

// El query completo debe quedar así:
const precioMercado = await pool.query(`
  SELECT 
    ROUND(AVG(pr.precio)::numeric, 2) AS precio_promedio_regional,
    COUNT(DISTINCT pr.bodega_id) AS bodegas_en_calculo
  FROM precios pr
  JOIN bodegas b ON b.id = pr.bodega_id
  WHERE pr.created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND pr.tipo_precio = 'bodega'
    AND b.estado = (
      SELECT b2.estado FROM bodegas b2
      JOIN bodeguero_bodegas bb2 ON bb2.bodega_id = b2.id
      WHERE bb2.usuario_id = $1 AND bb2.estatus = 'aprobada'
      LIMIT 1
    )
    AND pr.bodega_id NOT IN (         -- ← AGREGAR ESTA CONDICIÓN
      SELECT bodega_id 
      FROM bodeguero_bodegas 
      WHERE usuario_id = $1
    )
`, [usuario_id]);
```

**Verificación:**
```sql
-- Confirmar que el promedio excluye las bodegas del usuario de prueba
-- Reemplazar X con el usuario_id de prueba
SELECT ROUND(AVG(pr.precio)::numeric, 2) AS promedio_regional,
       COUNT(DISTINCT pr.bodega_id) AS bodegas
FROM precios pr
JOIN bodegas b ON b.id = pr.bodega_id
WHERE pr.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND pr.tipo_precio = 'bodega'
  AND pr.bodega_id NOT IN (
    SELECT bodega_id FROM bodeguero_bodegas WHERE usuario_id = X
  );
-- El resultado debe excluir los precios propios del usuario
```

---

### A-02 🟡 IMPORTANTE — Falta indicador comparativo en el KPI de precio

**Archivo:** `app-bodega/src/pages/B04Dashboard.tsx`

**Problema:**
```
El KPI 1 muestra el promedio regional pero no le dice 
al bodeguero si su precio propio está por encima 
o por debajo de ese promedio.

Ese es el dato más valioso del KPI — sin él 
el bodeguero no sabe si está siendo competitivo.
```

**Corrección — agregar indicador debajo del valor del KPI:**

```tsx
// En el componente del KPI 1, después del valor numérico principal,
// agregar este bloque comparativo:

{(() => {
  const miPrecio = stats?.ultimo_precio || 0;
  const promedio = stats?.precio_promedio_regional || 0;
  const bodegas = stats?.bodegas_en_calculo || 0;

  // Sin datos suficientes para comparar
  if (bodegas < 3 || promedio === 0) {
    return (
      <p className="text-xs text-gray-400 mt-1">
        Sin suficientes datos regionales hoy
      </p>
    );
  }

  // Sin precio propio publicado hoy
  if (miPrecio === 0) {
    return (
      <p className="text-xs text-gray-400 mt-1">
        Sin precio publicado hoy
      </p>
    );
  }

  const diferencia = miPrecio - promedio;
  const esArriba = diferencia >= 0;

  return (
    <p className={`text-xs font-medium mt-1 ${
      esArriba ? 'text-green-600' : 'text-red-500'
    }`}>
      {esArriba ? '↑' : '↓'} Tu precio está{' '}
      ${Math.abs(diferencia).toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
      {esArriba ? 'por encima' : 'por debajo'} del promedio regional
    </p>
  );
})()}
```

**Cómo debe verse en pantalla:**

```
PRECIO PROMEDIO DE MAÍZ AL PRODUCTOR HOY

$4,380
MXN/ton · promedio regional · 8 bodegas

↑ Tu precio está $120 por encima del promedio regional
```

```
PRECIO PROMEDIO DE MAÍZ AL PRODUCTOR HOY

$4,380
MXN/ton · promedio regional · 8 bodegas

↓ Tu precio está $80 por debajo del promedio regional
```

> 💡 **Nota:** El campo `ultimo_precio` ya existe en el response de `home.ts`. Solo hay que usarlo para la comparación — no requiere cambios en backend.

---

### A-03 🔴 URGENTE — Archivo de migración obsoleto puede revertir variedades en producción

**Archivo:** `backend/sql/migrations/add_tipo_maiz_variety.sql`

**Problema detectado por Claude Code:**
```
Este archivo tiene:
1. Variedades de Maíz Amarillo INCORRECTAS 
   (H-40 Amarillo, H-59C, DK 2020)
2. Seeds con ON CONFLICT DO UPDATE

Si alguien aplica este archivo DESPUÉS de 
migrate_v11_variedades_correctas.sql en producción,
las variedades del Amarillo vuelven a quedar mal
y los codes de Criollo se revierten a los viejos.

El proyecto tiene DOS carpetas de migraciones
sin runner formal — este riesgo es real.
```

**Corrección — agregar encabezado de advertencia al archivo:**

```sql
-- ⚠️ DEPRECATED — NO APLICAR EN PRODUCCIÓN
-- Este archivo fue reemplazado por:
-- backend/migrations/migrate_v11_variedades_correctas.sql
--
-- Si se aplica después de v11, revertirá las variedades
-- de Maíz Amarillo a valores INCORRECTOS (H-40 Amarillo, 
-- H-59C, DK 2020) y los codes de Criollo a los viejos.
--
-- Conservado solo como referencia histórica.
-- Fecha de deprecación: Mayo 2026
-- ─────────────────────────────────────────────────────

-- [resto del contenido existente sin cambios]
```

**Opcionalmente — mover el archivo a carpeta de archivo histórico:**
```bash
mkdir -p backend/sql/migrations/archive
mv backend/sql/migrations/add_tipo_maiz_variety.sql \
   backend/sql/migrations/archive/add_tipo_maiz_variety.DEPRECATED.sql
```

> ⚠️ **Importante para el DBA:** Antes del despliegue a producción, verificar el orden de aplicación de migraciones. `migrate_v11_variedades_correctas.sql` debe ser SIEMPRE el último archivo que toca `cat_crop_variety`.

**Verificación post-despliegue:**
```sql
-- Ejecutar esto inmediatamente después de aplicar migraciones en producción:
SELECT tipo_maiz, COUNT(*) as total,
       string_agg(label, ', ' ORDER BY sort_order) as variedades
FROM cat_crop_variety
GROUP BY tipo_maiz ORDER BY tipo_maiz;

-- Resultado esperado:
-- amarillo → 7: H-384A, H-385, V-53A, V-55A, Búho, Criollo Amarillo, Otra
-- blanco   → 14: H-40, H-48, H-50, H-52, H-59, H-66, H-70, H-77, 
--                H-383, VS-22, VS-23, H-520, H-564C, Otra
-- criollo  → 2: Criollo Local (especificar), No sabe
-- NULL     → 0 filas (ninguna)
```

---

### A-04 🟡 PENDIENTE POST-PILOTO — Alta de bodega nueva envía coordenadas en 0

**Archivo:** `app-bodega/src/pages/B03SelectBodegas.tsx`

**Problema detectado por Claude Code:**
```
El formulario de solicitud de alta de bodega nueva
tiene todos los campos de texto correctos pero
envía las coordenadas hardcodeadas:

latitud: 0,   ← siempre cero
longitud: 0   ← siempre cero

El mapa para que el usuario marque la ubicación
de la bodega no está implementado.
```

**¿Bloquea el piloto?**
```
No — porque el admin valida y aprueba cada solicitud
manualmente antes de activarla. El admin puede 
corregir las coordenadas desde su panel.

Por eso este ajuste se marca como POST-PILOTO.
```

**Corrección a implementar después del piloto — mapa Leaflet en el formulario:**

```tsx
// B03SelectBodegas.tsx — dentro del formulario de alta de bodega nueva

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';

// Estado para coordenadas:
const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

// Componente interno para capturar el toque en el mapa:
const MapClickHandler = ({ onCoords }: { onCoords: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onCoords(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// En el JSX del formulario, agregar sección de ubicación:
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Ubicación de la bodega
  </label>
  <p className="text-xs text-gray-500 mb-2">
    Toca el mapa para marcar la ubicación de tu bodega
  </p>
  <div className="rounded-lg overflow-hidden border border-gray-200" 
       style={{ height: '200px' }}>
    <MapContainer
      center={[23.6345, -102.5528]} // Centro de México
      zoom={5}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onCoords={(lat, lon) => setCoords({ lat, lon })} />
      {coords && <Marker position={[coords.lat, coords.lon]} />}
    </MapContainer>
  </div>
  {coords ? (
    <p className="text-xs text-green-600 mt-1">
      ✓ Ubicación marcada: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
    </p>
  ) : (
    <p className="text-xs text-gray-400 mt-1">
      Sin ubicación marcada — el administrador la completará al aprobar
    </p>
  )}
</div>

// Al enviar el formulario, usar coords reales:
latitud: coords?.lat ?? 0,
longitud: coords?.lon ?? 0,
```

---

## CHECKLIST DE VERIFICACIÓN FINAL

Antes de lanzar el piloto ejecutar estas verificaciones:

```sql
-- 1. Precio promedio excluye bodegas propias
-- (resultado debe ser diferente al precio del usuario de prueba)
SELECT ROUND(AVG(pr.precio)::numeric, 2) AS promedio_sin_propias
FROM precios pr
JOIN bodegas b ON b.id = pr.bodega_id
WHERE pr.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND pr.tipo_precio = 'bodega'
  AND pr.bodega_id NOT IN (
    SELECT bodega_id FROM bodeguero_bodegas WHERE usuario_id = 24
  );

-- 2. Variedades correctas en BD (verificar antes del despliegue)
SELECT tipo_maiz, COUNT(*) as total
FROM cat_crop_variety
GROUP BY tipo_maiz ORDER BY tipo_maiz;
-- Esperado: amarillo=7, blanco=14, criollo=2, NULL=0

-- 3. No hay usuarios de prueba activos
SELECT id, nombre_completo, rol, activo
FROM usuarios
WHERE nombre_completo ILIKE '%prueba%'
   OR nombre_completo ILIKE '%test%'
   OR nombre_completo ILIKE '%bodeguero%';
-- Debe devolver 0 filas

-- 4. Roles correctos
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol ORDER BY rol;
-- No debe aparecer 'bodeguero' — solo 'bodega', 'productor', 'admin', etc.
```

```bash
# 5. Verificar que add_tipo_maiz_variety.sql está marcado como DEPRECATED
head -5 backend/sql/migrations/add_tipo_maiz_variety.sql
# Debe mostrar el comentario de advertencia

# 6. Verificar que no hay texto "bodeguero" visible al usuario
grep -ri "bodeguero" app-bodega/src/ --include="*.tsx" \
  | grep -v "api\." \
  | grep -v "//\|function\|const\|type\|interface"
# Debe devolver 0 resultados
```

---

## ESTADO FINAL DEL MÓDULO BODEGA

| Módulo | Estado para piloto |
|---|---|
| Autenticación y acceso | ✅ Listo |
| Selección y gestión de bodegas | ✅ Listo |
| Tablero — KPIs | ✅ Listo (pendiente A-01 y A-02) |
| Inventario y stock | ✅ Listo |
| Precio de compra diario | ✅ Listo |
| Requerimientos de maíz | ✅ Listo |
| Oferta de productores | ✅ Listo |
| Transacciones | ✅ Listo |
| Tarifario de servicios | ✅ Listo |
| Ventanillas y apoyos | ✅ Listo |
| Módulo de precios / mercado | ✅ Listo |
| Notificaciones | ✅ Listo |
| Alta de bodega nueva | ✅ Listo (coordenadas en 0 — admin corrige al aprobar) |

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Con estos 4 ajustes el módulo Bodega queda listo para piloto*
