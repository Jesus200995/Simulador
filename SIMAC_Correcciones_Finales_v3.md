# SIMAC — Correcciones Finales v3
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Estado:** 21/27 correcciones completas — quedan 6 puntos

> ✅ Buen avance — 21 de 27 correcciones están bien. Este documento cubre únicamente los **6 puntos pendientes** ordenados por urgencia.

---

## RESUMEN DE PENDIENTES

| ID | Problema | Archivo | Urgencia |
|---|---|---|---|
| P-01 | Variedades de Maíz Amarillo incorrectas + 6 de Blanco faltantes | `cat_crop_variety` (BD) | 🔴 Crítica |
| P-02 | Capacidad de bodegas en 0 — datos reales no cargados | Tabla `bodegas` (BD) | 🔴 Crítica |
| P-03 | Frontend trata `0` como "sin datos" — bug de JavaScript | `B06BodegaDetalle.tsx` | 🔴 Crítica |
| P-04 | Ruta de disponibilidad montada incorrectamente | `index.ts` | 🔴 Crítica |
| P-05 | Leyenda incorrecta sobrevive en B06BodegaDetalle.tsx | `B06BodegaDetalle.tsx` | 🟡 Media |
| P-06 | "Bodeguero" visible en app Vue — riesgo de auth | `RegisterView.vue` + 2 archivos | 🟡 Media |
| P-07 | KPI 2 y KPI 3 con títulos incorrectos en Tablero | `B04Dashboard.tsx` | 🟡 Media |

---

## CORRECCIONES DETALLADAS

---

### P-01 🔴 CRÍTICO — Variedades de Maíz Amarillo incorrectas y 6 de Blanco faltantes

**Problema detectado:**  
Las variedades sembradas en BD no coinciden con las especificadas. El Maíz Amarillo tiene variedades completamente distintas a las correctas y al Maíz Blanco le faltan 6 variedades.

| Tipo | Sembradas actualmente | Problema |
|---|---|---|
| Blanco | H-40, H-48, H-50, H-52, H-66, H-70, VS-22, VS-23 | Faltan: H-59, H-77, H-383, H-520, H-564C, Otra |
| Amarillo | H-40 Amarillo, H-59C, DK 2020 | **Todas incorrectas** — deben ser otras |
| Criollo | Criollo / Local, No sabe | ✅ Correcto |

**Corrección — ejecutar este SQL completo:**

```sql
-- migrate_v11_variedades_correctas.sql

-- 1. Limpiar variedades incorrectas
DELETE FROM cat_crop_variety 
WHERE tipo_maiz IN ('blanco', 'amarillo', 'criollo');

-- 2. Insertar variedades correctas de MAÍZ BLANCO
-- (validadas con INIFAP/CIMMYT para las regiones del Plan Nacional Maíz)
INSERT INTO cat_crop_variety (code, label, tipo_maiz, sort_order) VALUES
  ('H-40',    'H-40',    'blanco', 1),
  ('H-48',    'H-48',    'blanco', 2),
  ('H-50',    'H-50',    'blanco', 3),
  ('H-52',    'H-52',    'blanco', 4),
  ('H-59',    'H-59',    'blanco', 5),  -- ← faltaba (Sinaloa/Noroeste)
  ('H-66',    'H-66',    'blanco', 6),
  ('H-70',    'H-70',    'blanco', 7),
  ('H-77',    'H-77',    'blanco', 8),  -- ← faltaba (Valles Altos)
  ('H-383',   'H-383',   'blanco', 9),  -- ← faltaba (Bajío/Norte-Centro)
  ('VS-22',   'VS-22',   'blanco', 10),
  ('VS-23',   'VS-23',   'blanco', 11),
  ('H-520',   'H-520',   'blanco', 12), -- ← faltaba (Trópico húmedo)
  ('H-564C',  'H-564C',  'blanco', 13), -- ← faltaba (Sur-Sureste)
  ('OTRA_B',  'Otra',    'blanco', 14); -- ← faltaba

-- 3. Insertar variedades correctas de MAÍZ AMARILLO
-- (reemplaza completamente las incorrectas H-40 Amarillo, H-59C, DK 2020)
INSERT INTO cat_crop_variety (code, label, tipo_maiz, sort_order) VALUES
  ('H-384A',          'H-384A',          'amarillo', 1),
  ('H-385',           'H-385',           'amarillo', 2),
  ('V-53A',           'V-53A',           'amarillo', 3),
  ('V-55A',           'V-55A',           'amarillo', 4),
  ('BUHO',            'Búho',            'amarillo', 5),
  ('CRIOLLO_AMARILLO','Criollo Amarillo', 'amarillo', 6),
  ('OTRA_A',          'Otra',            'amarillo', 7);

-- 4. Insertar variedades de CRIOLLO (ya estaban bien, se reinsertan por limpieza)
INSERT INTO cat_crop_variety (code, label, tipo_maiz, sort_order) VALUES
  ('CRIOLLO_LOCAL', 'Criollo Local (especificar)', 'criollo', 1),
  ('NO_SABE',       'No sabe',                     'criollo', 2);

-- 5. Verificar resultado final
SELECT tipo_maiz, COUNT(*) as total, 
       string_agg(code, ', ' ORDER BY sort_order) as variedades
FROM cat_crop_variety 
GROUP BY tipo_maiz ORDER BY tipo_maiz;
-- Debe mostrar: blanco=14, amarillo=7, criollo=2
```

---

### P-02 🔴 CRÍTICO — Capacidad de bodegas en 0 — datos reales no cargados en BD

**Problema detectado por Claude Code:**  
La migración `migrate_v6_seguimiento.sql` agregó `capacidad_ton` con `DEFAULT 0`. Todas las bodegas existentes recibieron `0` automáticamente. Nadie las actualizó con los valores reales.

**Corrección:**  
El desarrollador debe obtener la capacidad real de cada bodega y actualizarla. Dos opciones:

**Opción A — Actualización individual (si son pocas bodegas):**
```sql
-- Actualizar una por una con el valor real en toneladas
UPDATE bodegas SET 
  capacidad_ton = 5000,
  municipio = 'Culiacán',        -- si también está vacío
  localidad = 'Centro',          -- si también está vacío
  estatus_operativo = 'activa'   -- si también está vacío
WHERE id = 1;

UPDATE bodegas SET capacidad_ton = 8000 WHERE id = 2;
-- ... etc para cada bodega
```

**Opción B — Actualización masiva desde tabla de valores (recomendada):**
```sql
UPDATE bodegas b
SET capacidad_ton = d.capacidad
FROM (VALUES
  (1, 5000),
  (2, 8000),
  (3, 3500)
  -- agregar un renglón por cada bodega: (id, capacidad_real_en_toneladas)
) AS d(id, capacidad)
WHERE b.id = d.id;
```

**Verificación:**
```sql
-- Confirmar que ninguna bodega quedó en 0 o NULL
SELECT id, nombre, capacidad_ton, municipio, estatus_operativo
FROM bodegas
WHERE capacidad_ton IS NULL OR capacidad_ton = 0
ORDER BY nombre;
-- Esta consulta debe devolver 0 filas después de la corrección
```

> ⚠️ **Nota adicional detectada:** Algunas bodegas del `init.sql` original tienen `estado = 'disponible'` en lugar del nombre real de un estado mexicano, y `municipio = NULL`. Aprovechar este UPDATE para corregir también esos campos.

---

### P-03 🔴 CRÍTICO — Bug JavaScript: `0` es falsy — capacidad real no se muestra aunque exista

**Archivo:** `app-bodega/src/pages/B06BodegaDetalle.tsx` — línea 97  
**Problema:**  
```typescript
// ❌ COMO ESTÁ AHORA — incorrecto
// En JavaScript, 0 es falsy. Si capacidad_ton = 0, muestra "Sin datos registrados"
// aunque el valor SÍ existe en BD
['Capacidad', bodega.capacidad_ton 
  ? `${Number(bodega.capacidad_ton).toLocaleString()} ton`
  : 'Sin datos registrados'],
```

**Corrección — cambiar UNA condición:**
```typescript
// ✅ COMO DEBE QUEDAR
// Verificar explícitamente que sea mayor a 0
['Capacidad', (bodega.capacidad_ton != null && bodega.capacidad_ton > 0)
  ? `${Number(bodega.capacidad_ton).toLocaleString()} ton`
  : 'Sin datos registrados'],
```

> 💡 Este mismo patrón puede existir en otros campos numéricos del componente. Revisar también `total_stock`, `ocupacion_pct` y cualquier otro campo numérico que use el operador ternario con `?` sin comparación explícita.

---

### P-04 🔴 CRÍTICO — Endpoints de disponibilidad montados en ruta incorrecta

**Archivo:** `backend/src/index.ts`  
**Problema:**  
```typescript
// ❌ COMO ESTÁ AHORA
app.use('/api/disponibilidad', disponibilidadRoutes);
// El frontend llama a /api/productor/disponibilidad → 404 Not Found
```

**Corrección — cambiar UNA línea en index.ts:**
```typescript
// ✅ COMO DEBE QUEDAR
app.use('/api/productor/disponibilidad', disponibilidadRoutes);
```

**Verificar que el frontend use la ruta correcta:**
```typescript
// En cualquier componente que llame a disponibilidad, 
// confirmar que usa la ruta correcta:
const response = await request('/api/productor/disponibilidad'); // ✅
// y NO:
const response = await request('/api/disponibilidad'); // ❌
```

**Prueba rápida después del fix:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/productor/disponibilidad
# Debe responder 200, no 404
```

---

### P-05 🟡 MEDIO — Leyenda incorrecta sobrevive en pestaña Requerimientos de B06

**Archivo:** `app-bodega/src/pages/B06BodegaDetalle.tsx`  
**Problema:**  
En la pestaña "Requerimientos" del detalle de bodega aún aparece:
```html
<!-- ❌ ELIMINAR esta línea -->
<p className="text-[14px] text-gray-400">
  Las señales activas se ven en la sección Oferta
</p>
```

**Corrección — eliminar esa línea y reemplazar por:**
```tsx
// ✅ Si no hay requerimientos activos para esta bodega:
<p className="text-[14px] text-gray-400 text-center py-4">
  No hay requerimientos activos para esta bodega.
  <br />
  <span 
    className="text-green-700 underline cursor-pointer"
    onClick={() => navigate('/requerimientos/nuevo')}
  >
    Publicar un requerimiento
  </span>
</p>
```

---

### P-06 🟡 MEDIO — "Bodeguero" visible en app Vue — riesgo de inconsistencia de roles en auth

**Problema:**  
En la app Vue (`appbodegas`) el término "Bodeguero" sigue visible en 3 archivos. Si un usuario se registra con `rol = 'bodeguero'` y la BD ya usa `rol = 'bodega'`, el login fallará o el usuario quedará sin permisos correctos.

**Correcciones en 3 archivos:**

**Archivo 1 — `appbodegas/src/views/RegisterView.vue`:**
```html
<!-- ❌ COMO ESTÁ -->
<option value="bodeguero">Bodeguero</option>

<!-- ✅ COMO DEBE QUEDAR -->
<option value="bodega">Bodega</option>
```

**Archivo 2 — `appbodegas/src/views/InicioView.vue`:**
```javascript
// ❌ COMO ESTÁ
bodeguero: 'Bodeguero'

// ✅ COMO DEBE QUEDAR  
bodega: 'Bodega'
```

**Archivo 3 — `appbodegas/src/components/AppShell.vue`:**
```javascript
// ❌ COMO ESTÁ
bodeguero: 'Bodeguero'

// ✅ COMO DEBE QUEDAR
bodega: 'Bodega'
```

**Verificación en BD después del fix:**
```sql
-- Confirmar que no hay usuarios registrados con rol incorrecto
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol ORDER BY rol;
-- No debe aparecer 'bodeguero' — solo 'bodega', 'industria', 'admin', 'productor'

-- Si hay usuarios con rol incorrecto, corregirlos:
UPDATE usuarios SET rol = 'bodega' WHERE rol = 'bodeguero';
```

---

### P-07 🟡 MEDIO — KPI 2 y KPI 3 del Tablero con títulos incorrectos

**Archivo:** `app-bodega/src/pages/B04Dashboard.tsx`

**Corrección — 2 títulos:**

```typescript
// KPI 2
// ❌ COMO ESTÁ: "Solicitudes" con subtítulo "pendientes en ventanilla"
// ✅ COMO DEBE QUEDAR:
titulo: 'Solicitudes a ventanillas',
subtitulo: 'pendientes de atención',

// KPI 3  
// ❌ COMO ESTÁ: "Productores cercanos"
// ✅ COMO DEBE QUEDAR:
titulo: 'Productores de maíz cercanos',
subtitulo: 'a tus bodegas · ~{toneladas_cercanas} ton disponibles',
```

---

## ORDEN DE TRABAJO RECOMENDADO

```
DÍA 1 — Base de datos (resolver primero, todo depende de esto)
  1. Ejecutar migrate_v11_variedades_correctas.sql    (P-01)
  2. Actualizar capacidad_ton real en tabla bodegas   (P-02)
  3. Corregir usuarios con rol='bodeguero' en BD      (P-06)

DÍA 2 — Backend
  4. Cambiar una línea en index.ts para ruta correcta (P-04)
  5. Verificar que frontend usa /api/productor/disponibilidad

DÍA 3 — Frontend
  6. Fix condición capacidad_ton > 0 en B06           (P-03)
  7. Eliminar leyenda incorrecta en B06               (P-05)
  8. Corregir 3 archivos Vue con "Bodeguero"          (P-06)
  9. Corregir títulos KPI 2 y KPI 3 en B04           (P-07)
```

---

## VERIFICACIÓN FINAL — Queries de diagnóstico

Ejecutar estas 4 queries antes de cerrar las correcciones:

```sql
-- 1. Variedades correctas cargadas
SELECT tipo_maiz, COUNT(*) as total
FROM cat_crop_variety 
GROUP BY tipo_maiz;
-- Esperado: blanco=14, amarillo=7, criollo=2

-- 2. Bodegas con capacidad real
SELECT COUNT(*) as bodegas_sin_capacidad
FROM bodegas WHERE capacidad_ton IS NULL OR capacidad_ton = 0;
-- Esperado: 0

-- 3. Usuarios con rol incorrecto
SELECT COUNT(*) as usuarios_rol_incorrecto
FROM usuarios WHERE rol = 'bodeguero';
-- Esperado: 0

-- 4. Endpoint de disponibilidad respondiendo
-- (desde terminal con el servidor corriendo)
-- curl -H "Authorization: Bearer TOKEN" 
--   http://localhost:3000/api/productor/disponibilidad
-- Esperado: status 200
```

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Basado en: Auditoría Claude Code v2 — 23 mayo 2026*  
*Con estas 7 correcciones el módulo Bodega queda completo para piloto*
