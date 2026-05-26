# SIMAC — Verificación de Despliegue y Correcciones Finales
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Objetivo:** Verificar que el servidor de producción está listo para el piloto

> Este documento tiene dos partes: correcciones de código que deben aplicarse y verificaciones que deben correrse directamente en el servidor de producción antes de abrir el sistema a usuarios reales.

---

## PARTE 1 — CORRECCIONES DE CÓDIGO

Estas correcciones ya fueron identificadas en la última auditoría. Aplicar en el repo y desplegar.

---

### CC-01 🔴 URGENTE — Bug de variedades: filtro roto en backend y frontend

**Problema:**
```
Al seleccionar un tipo de maíz en los formularios 
de inventario, requerimiento y transacción, 
el dropdown de variedades muestra TODO el catálogo 
sin filtrar — con duplicados.

Causa raíz — dos capas:
1. Backend: el SELECT de variedades no incluía 
   el campo tipo_maiz → llegaba como undefined
2. Frontend: el filtro !v.tipo_maiz era TRUE 
   para todas las entradas → se mostraban todas
```

**Corrección en backend — `infraestructura.ts`:**
```typescript
// Buscar el query que devuelve variedades del catálogo
// Agregar tipo_maiz al SELECT y excluir entradas legacy:

// ❌ COMO ESTÁ:
SELECT code, label FROM cat_crop_variety

// ✅ COMO DEBE QUEDAR:
SELECT code, label, tipo_maiz 
FROM cat_crop_variety
WHERE tipo_maiz IS NOT NULL  -- excluir entradas legacy sin tipo
ORDER BY tipo_maiz, sort_order
```

**Corrección en frontend — aplicar en los 3 componentes:**

`B07Inventario.tsx`, `B10Requerimiento.tsx`, `B13Transaccion.tsx`

```typescript
// ❌ COMO ESTÁ (filtro roto — muestra todo):
const filteredVars = form.tipo_maiz === 'criollo'
  ? variedades.filter(v => 
      ['MC_CRIOLLO','MC_NOSABE','CRIOLLO_LOCAL','NO_SABE'].includes(v.code)
      || v.tipo_maiz === 'criollo'
    )
  : variedades.filter(v => !v.tipo_maiz || v.tipo_maiz === form.tipo_maiz)
//                         ↑ !v.tipo_maiz era TRUE para todas → mostraba todo

// ✅ COMO DEBE QUEDAR (filtro correcto):
const filteredVars = variedades.filter(v => v.tipo_maiz === form.tipo_maiz)
// Simple y directo — solo muestra variedades del tipo seleccionado
// El backend ya excluye las entradas legacy con tipo_maiz IS NOT NULL
```

**Verificación visual:**
```
Al seleccionar "Maíz Blanco" → solo deben aparecer 
las 14 variedades de blanco (H-40 a Otra)

Al seleccionar "Maíz Amarillo" → solo las 7 
variedades de amarillo (H-384A a Otra)

Al seleccionar "Criollo / Local" → solo 2 opciones
(Criollo Local y No sabe)

En ningún caso debe aparecer el catálogo completo
ni variedades duplicadas.
```

---

### CC-02 🟡 IMPORTANTE — Mapbox como tiles para el mapa

**Archivo:** `app-bodega/src/pages/B03SelectBodegas.tsx`

**Problema:**
```
El mapa usa tiles de OpenStreetMap directamente.
Con más de ~100 usuarios simultáneos, OSM puede 
bloquear las peticiones por política de uso.
```

**Corrección — usar Mapbox con fallback a CartoDB:**
```typescript
// B03SelectBodegas.tsx — reemplazar el TileLayer actual

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// En el JSX:
{MAPBOX_TOKEN ? (
  <TileLayer
    url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
    attribution="© Mapbox © OpenStreetMap"
  />
) : (
  // Fallback gratuito sin token — apto para uso comercial
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    attribution="© CartoDB © OpenStreetMap"
  />
)}
```

**Agregar variable de entorno en el servidor de producción:**
```bash
# En el archivo .env del servidor o en las variables 
# de entorno de tu plataforma de despliegue:
VITE_MAPBOX_TOKEN=tu_token_de_mapbox_aqui

# Si no tienes token de Mapbox todavía:
# El fallback CartoDB funciona sin token y es gratuito.
# No hay riesgo de bloqueo. Puedes dejarlo así para el piloto.
```

---

## PARTE 2 — VERIFICACIÓN DE MIGRACIONES EN PRODUCCIÓN

Estas queries deben correrse DIRECTAMENTE en la base de datos del servidor de producción para confirmar que las migraciones se aplicaron correctamente.

> ⚠️ **Importante:** El código en el repo puede estar correcto pero si las migraciones no se aplicaron en el servidor, los datos en producción siguen mal. Estas queries confirman el estado real de la BD.

---

### VM-01 — Verificar roles de usuarios

**Migración que debe estar aplicada:** `migrate_v11c_fix_roles.sql`

```sql
-- Query 1: Ver todos los roles existentes
SELECT rol, COUNT(*) as usuarios
FROM usuarios 
GROUP BY rol 
ORDER BY rol;

-- Resultado ESPERADO:
-- bodega     → X usuarios  ✅
-- productor  → X usuarios  ✅
-- admin      → X usuarios  ✅
-- industria  → X usuarios  ✅ (si los hay)
-- El rol 'bodeguero' NO debe aparecer

-- Query 2: Confirmar que no hay bodegueros
SELECT COUNT(*) as bodegueros_incorrectos
FROM usuarios 
WHERE rol = 'bodeguero';

-- Resultado ESPERADO: 0
-- Si devuelve > 0: la migración NO se aplicó
-- Solución: ejecutar manualmente:
-- UPDATE usuarios SET rol = 'bodega' WHERE rol = 'bodeguero';
```

---

### VM-02 — Verificar usuarios de prueba

**Migración que debe estar aplicada:** `migrate_v12b_fix_test_users.sql`

```sql
-- Buscar usuarios con nombres de prueba activos
SELECT id, nombre_completo, rol, activo
FROM usuarios
WHERE nombre_completo ILIKE ANY(
  ARRAY['%prueba%', '%test%', '%bodeguero%', '%PRUEBA%']
) AND activo = true;

-- Resultado ESPERADO: 0 filas
-- Si devuelve filas: ejecutar la migración manualmente
-- o renombrar esos usuarios:
-- UPDATE usuarios 
-- SET nombre_completo = 'Usuario Piloto'
-- WHERE nombre_completo ILIKE '%prueba%' AND activo = true;
```

---

### VM-03 — Verificar variedades de maíz

**Migración que debe estar aplicada:** `migrate_v11_variedades_correctas.sql` + `migrate_v12c_fix_variedades.sql`

```sql
-- Query 1: Conteo por tipo de maíz
SELECT tipo_maiz, COUNT(*) as total
FROM cat_crop_variety
GROUP BY tipo_maiz 
ORDER BY tipo_maiz;

-- Resultado ESPERADO:
-- amarillo  → 7
-- blanco    → 14
-- criollo   → 2
-- NULL      → 0  (ninguna fila sin tipo)

-- Query 2: Ver las variedades de amarillo
-- (las que estaban mal antes)
SELECT code, label 
FROM cat_crop_variety 
WHERE tipo_maiz = 'amarillo'
ORDER BY sort_order;

-- Resultado ESPERADO:
-- H-384A, H-385, V-53A, V-55A, Búho, Criollo Amarillo, Otra
-- Si aparece H-40 Amarillo, H-59C o DK 2020 → migración NO aplicada

-- Query 3: Confirmar que no hay entradas legacy sin tipo
SELECT COUNT(*) as entradas_sin_tipo
FROM cat_crop_variety 
WHERE tipo_maiz IS NULL;

-- Resultado ESPERADO: 0
-- Si devuelve > 0: ejecutar:
-- DELETE FROM cat_crop_variety WHERE tipo_maiz IS NULL;
```

---

### VM-04 — Verificar disponibilidad del productor

**Migración que debe estar aplicada:** `migrate_v10_correcciones.sql`

```sql
-- Verificar que la tabla existe con todos sus campos
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'disponibilidad_productor'
ORDER BY ordinal_position;

-- Resultado ESPERADO — debe incluir estas columnas:
-- id, producer_id, up_id, tipo_maiz, variedad_code,
-- volumen_estimado_ton, ventana_venta, fecha_disponible,
-- fecha_vencimiento, activa, created_at, updated_at

-- Si la tabla NO existe: la migración no se aplicó
-- Ejecutar migrate_v10_correcciones.sql manualmente
```

---

### VM-05 — Verificar constraint de vigencia en señales

**Migración que debe estar aplicada:** `fix_vigencia_constraint.sql`

```sql
-- Verificar que el constraint incluye 'rango'
SELECT pg_get_constraintdef(c.oid) as constraint_definicion
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'senales_compra' 
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) LIKE '%vigencia%';

-- Resultado ESPERADO:
-- CHECK (vigencia IN ('esta_semana', '15_dias', 'rango'))
-- Si no incluye 'rango' → ejecutar:
-- ALTER TABLE senales_compra DROP CONSTRAINT IF EXISTS senales_compra_vigencia_check;
-- ALTER TABLE senales_compra ADD CONSTRAINT senales_compra_vigencia_check 
--   CHECK (vigencia IN ('esta_semana', '15_dias', 'rango'));
```

---

### VM-06 — Verificar capacidades de bodegas

```sql
-- ¿Cuántas bodegas tienen capacidad en 0 o NULL?
SELECT COUNT(*) as bodegas_sin_capacidad
FROM bodegas 
WHERE capacidad_ton IS NULL OR capacidad_ton = 0;

-- Resultado ESPERADO: 0
-- Si devuelve > 0: verificar que migrate_v11b_capacidad_bodegas.sql 
-- se aplicó en producción

-- Ver las bodegas problemáticas si las hay:
SELECT id, nombre, capacidad_ton, municipio, estado
FROM bodegas
WHERE capacidad_ton IS NULL OR capacidad_ton = 0
ORDER BY nombre;
```

---

## PARTE 3 — CÓMO EJECUTAR ESTAS QUERIES EN PRODUCCIÓN

Dependiendo de dónde está desplegado el servidor, hay diferentes formas de conectarse:

### Si el servidor está en Railway / Render / Heroku:
```
1. Ir al panel de control de la plataforma
2. Buscar la sección "Database" o "PostgreSQL"
3. Copiar el DATABASE_URL o las credenciales
4. Conectarse con cualquier cliente SQL:
   - TablePlus (recomendado, visual)
   - DBeaver (gratuito)
   - psql desde terminal
   - O directamente desde la consola de la plataforma
```

### Si el servidor está en VPS (DigitalOcean, AWS, etc.):
```bash
# Desde terminal con las credenciales del .env:
psql -h HOST -U USUARIO -d NOMBRE_BD -p PUERTO

# O con el DATABASE_URL completo:
psql "postgresql://usuario:password@host:puerto/nombre_bd"
```

### Desde Claude Code (opción más fácil):
```
Pedirle a Claude Code que se conecte a la BD 
usando las variables de entorno del .env.production
y ejecute las queries de verificación.
```

---

## PARTE 4 — CHECKLIST FINAL PRE-PILOTO

Marcar cada punto antes de abrir el sistema a usuarios reales:

```
CÓDIGO
□ CC-01 — Bug de variedades corregido en backend y 
          en los 3 componentes (B07, B10, B13)
□ CC-02 — Mapbox o CartoDB configurado en el mapa

MIGRACIONES EN PRODUCCIÓN
□ VM-01 — Rol 'bodeguero' no existe → solo 'bodega'
□ VM-02 — Sin usuarios de prueba activos
□ VM-03 — Variedades: blanco=14, amarillo=7, criollo=2, NULL=0
□ VM-04 — Tabla disponibilidad_productor existe
□ VM-05 — Constraint vigencia incluye 'rango'
□ VM-06 — Capacidades de bodegas cargadas (no 0 ni NULL)

VERIFICACIÓN FUNCIONAL (probar en el sistema real)
□ Login con usuario bodega funciona
□ El tablero muestra los 4 KPIs con datos
□ El dropdown de variedades filtra correctamente
□ La campana de notificaciones muestra el contador
□ El mapa de oferta de productores carga
□ Publicar un requerimiento de maíz funciona
□ Registrar una transacción funciona
```

---

## NOTAS PARA EL PILOTO

**Para resolver post-piloto (no bloquean):**
```
1. Si el bodeguero opera bodegas en más de un estado, 
   el promedio regional solo toma el estado de la 
   primera bodega. Ajustar la query para considerar 
   todos los estados del usuario.

2. Si el bodeguero no tiene precio propio publicado, 
   el KPI puede mostrar el promedio regional con 
   un título confuso. Ajustar el texto del label 
   según si hay o no precio propio.

3. Mapa con coordenadas en 0 para altas de bodegas 
   nuevas — el admin debe completar la ubicación 
   al aprobar cada solicitud.
```

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Completar el checklist de la Parte 4 antes de activar usuarios reales*
