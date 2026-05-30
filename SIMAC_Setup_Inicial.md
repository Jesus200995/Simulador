# SIMAC — Setup Inicial del Proyecto
**Plan Nacional Maíz 2026 · Mayo 2026 · Para el desarrollador**  
Repo: `github.com/Jesus200995/Simulador` · Verde primario: `#1A5C38`

> Ejecutar este documento **una sola vez** para dejar el sistema funcionando.  
> Después de completarlo, el precio funciona con datos reales, los productores  
> pueden registrarse y el cron job corre automáticamente cada día a las 7am.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Variables de entorno — .env](#2-variables-de-entorno--env)
3. [Base de datos — migraciones en orden](#3-base-de-datos--migraciones-en-orden)
4. [Token de Banxico — obtenerlo gratis](#4-token-de-banxico--obtenerlo-gratis)
5. [Instalar dependencias](#5-instalar-dependencias)
6. [Arrancar el proyecto](#6-arrancar-el-proyecto)
7. [Verificar que todo funciona](#7-verificar-que-todo-funciona)
8. [Verificar el precio en tiempo real](#8-verificar-el-precio-en-tiempo-real)
9. [Checklist final](#9-checklist-final)

---

## 1. Requisitos previos

Antes de empezar, verificar que tienes instalado:

```bash
node --version    # debe ser >= 18
npm --version     # debe ser >= 9
psql --version    # PostgreSQL >= 15
```

Verificar que PostgreSQL tiene PostGIS instalado:
```sql
-- Conectarse a la BD y ejecutar:
SELECT PostGIS_Version();
-- Si da error → instalar PostGIS:
-- Ubuntu/Debian: sudo apt install postgresql-15-postgis-3
-- Mac: brew install postgis
```

---

## 2. Variables de entorno — .env

### 2.1 Backend — crear `backend/.env`

Copiar `.env.example` y completar con los valores reales:

```bash
cp backend/.env.example backend/.env
```

Contenido completo de `backend/.env`:

```env
# ─── BASE DE DATOS ───────────────────────────────────────
DATABASE_URL=postgresql://usuario:password@localhost:5432/simac_db
# Ejemplo real: postgresql://postgres:mipassword@localhost:5432/simac

# ─── AUTENTICACIÓN ───────────────────────────────────────
JWT_SECRET=una_cadena_larga_y_aleatoria_minimo_32_caracteres
# Ejemplo: openssl rand -base64 32 → genera una cadena segura

# ─── BANXICO API (tipo de cambio USD/MXN) ────────────────
# Obtener gratis en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
# Ver instrucciones completas en Sección 4 de este documento
BANXICO_TOKEN=tu_token_de_64_caracteres_aqui

# ─── CONFIGURACIÓN DEL SERVIDOR ──────────────────────────
PORT=3000
NODE_ENV=development

# ─── CORS (dominio del frontend) ─────────────────────────
FRONTEND_URL=http://localhost:5173
```

### 2.2 Frontend — crear `app-bodega/.env`

```bash
# Crear archivo nuevo (no existe en el repo):
touch app-bodega/.env
```

Contenido de `app-bodega/.env`:

```env
# URL base del backend — sin slash final
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ Sin estos dos archivos `.env` el proyecto no conecta a nada. Es el paso más importante.

---

## 3. Base de datos — migraciones en orden

### 3.1 Crear la base de datos

```bash
# Conectarse a PostgreSQL como superusuario:
psql -U postgres

# Crear la BD:
CREATE DATABASE simac_db;
\c simac_db

# Activar PostGIS:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Salir:
\q
```

### 3.2 Ejecutar migraciones en orden estricto

**Conectarse a la BD del proyecto:**
```bash
psql -U postgres -d simac_db
```

**Ejecutar en este orden exacto — no saltarse ninguna:**

```sql
-- ── ESTRUCTURA BASE ──────────────────────────────────────
\i backend/sql/init.sql
\i backend/sql/migrate_v2_seguimiento.sql
\i backend/sql/migrate_v3_seguimiento.sql
\i backend/sql/migrate_v4_seguimiento.sql
\i backend/sql/migrate_v5_seguimiento.sql
\i backend/sql/migrate_v6_seguimiento.sql

-- ── MÓDULO BODEGUERO ─────────────────────────────────────
\i backend/migrations/migrate_v8_bodeguero.sql

-- ── MÓDULO PRODUCTOR ─────────────────────────────────────
\i backend/migrations/migrate_v13_modulo_productor.sql
\i backend/migrations/migrate_v14_productor_v2.sql
\i backend/migrations/migrate_v15_usuarios_nullable_for_producers.sql
\i backend/migrations/migrate_v16_productor_v3.sql

-- ── PRECIOS EXTERNOS ─────────────────────────────────────
\i backend/migrations/migrate_v17_precio_referencias_externas.sql

-- ── CICLOS MÚLTIPLES (nuevo) ─────────────────────────────
\i backend/migrations/migrate_v18_ciclos_multiples.sql
```

> ⚠️ Si `migrate_v17` y `migrate_v18` no existen todavía como archivos, crearlos con el contenido de las secciones 3.3 y 3.4.

### 3.3 Crear migración v17 — tabla precio_referencias_externas

Si el archivo no existe, crearlo en `backend/migrations/migrate_v17_precio_referencias_externas.sql`:

```sql
-- migrate_v17_precio_referencias_externas.sql
-- Tabla para guardar histórico de Chicago y TC desde Yahoo Finance y Banxico

CREATE TABLE IF NOT EXISTS precio_referencias_externas (
  id                  SERIAL PRIMARY KEY,
  chicago_usd_bushel  NUMERIC(10,4),
  chicago_usd_ton     NUMERIC(10,2),
  chicago_mxn         NUMERIC(10,2),
  tc_banxico          NUMERIC(10,4),
  garantia_sader      NUMERIC(10,2),
  fuente              VARCHAR(30) DEFAULT 'cron',
  -- fuente: 'cron' | 'admin_manual' | 'primer_arranque' | 'fallback'
  error               BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para obtener siempre el más reciente rápido
CREATE INDEX IF NOT EXISTS idx_precio_refs_created_at 
  ON precio_referencias_externas(created_at DESC);

-- Insertar un valor inicial para que el sistema no arranque vacío
-- (se sobreescribe en el primer cron exitoso)
INSERT INTO precio_referencias_externas 
  (chicago_usd_bushel, chicago_usd_ton, chicago_mxn, tc_banxico, fuente)
VALUES 
  (6.28, 247.43, 4306.23, 17.42, 'primer_arranque');
```

### 3.4 Crear migración v18 — ciclos múltiples

Si el archivo no existe, crearlo en `backend/migrations/migrate_v18_ciclos_multiples.sql`:

```sql
-- migrate_v18_ciclos_multiples.sql
-- Soporte para múltiples ciclos productivos por UP con historial

-- Estado del ciclo
ALTER TABLE cycle 
  ADD COLUMN IF NOT EXISTS estado_ciclo VARCHAR(20) DEFAULT 'activo';
  -- valores: 'activo' | 'cosechado' | 'cancelado'

-- Datos de cosecha real (declarada por el productor)
ALTER TABLE cycle
  ADD COLUMN IF NOT EXISTS fecha_cosecha_real DATE,
  ADD COLUMN IF NOT EXISTS produccion_real_ton NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS observaciones_cosecha TEXT;

-- Índice para queries frecuentes del Admin y del productor
CREATE INDEX IF NOT EXISTS idx_cycle_up_estado 
  ON cycle(up_id, cycle_type, cycle_year, estado_ciclo);

-- Actualizar ciclos existentes — todos pasan a 'activo'
UPDATE cycle SET estado_ciclo = 'activo' WHERE estado_ciclo IS NULL;
```

### 3.5 Verificar que las migraciones se aplicaron correctamente

Ejecutar estas queries de verificación:

```sql
-- ¿email es nullable en usuarios?
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'email';
-- Resultado esperado: is_nullable = YES ✅

-- ¿existen las columnas del productor?
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'producer' 
  AND column_name IN ('correo', 'programas_beneficiario', 
                      'estado_validacion', 'tipo_registro');
-- Resultado esperado: 4 filas ✅

-- ¿existe la tabla precio_referencias_externas con datos?
SELECT * FROM precio_referencias_externas ORDER BY created_at DESC LIMIT 1;
-- Resultado esperado: 1 fila con valores de Chicago y TC ✅

-- ¿existe estado_ciclo en cycle?
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cycle' AND column_name = 'estado_ciclo';
-- Resultado esperado: 1 fila ✅

-- ¿PostGIS está activo?
SELECT PostGIS_Version();
-- Resultado esperado: versión de PostGIS ✅
```

---

## 4. Token de Banxico — obtenerlo gratis

El token es gratuito, oficial y se obtiene en 2 minutos.

**Paso 1 — Ir a la página de Banxico:**
```
https://www.banxico.org.mx/SieAPIRest/service/v1/token
```

**Paso 2 — Llenar el formulario:**
- Nombre: tu nombre o "SIMAC Sistema"
- Correo: correo del proyecto
- Institución: nombre de tu organización

**Paso 3 — Banxico envía el token al correo.**  
Es una cadena de 64 caracteres como esta:
```
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

**Paso 4 — Pegar el token en `backend/.env`:**
```env
BANXICO_TOKEN=a1b2c3d4e5f6...tu_token_real_aqui
```

> **Límite de uso:** 5,000 llamadas por día. El cron hace 1 llamada diaria. Estamos muy por debajo del límite.  
> **Sin el token:** el sistema usa Yahoo Finance como fallback para el TC. Funciona, pero es menos oficial.

---

## 5. Instalar dependencias

### 5.1 Backend

```bash
cd backend
npm install

# Verificar que yahoo-finance2 está instalado:
npm list yahoo-finance2
# Debe mostrar: yahoo-finance2@2.x.x ✅

# Verificar que node-cron está instalado:
npm list node-cron
# Debe mostrar: node-cron@x.x.x ✅

# Si alguno falta:
npm install yahoo-finance2 node-cron
```

### 5.2 Frontend

```bash
cd app-bodega
npm install
```

---

## 6. Arrancar el proyecto

### 6.1 Arrancar el backend

```bash
cd backend
npm run dev
# El servidor debe arrancar en http://localhost:3000
# Buscar en los logs:
# ✅ "Servidor corriendo en puerto 3000"
# ✅ "Conectado a PostgreSQL"
# ✅ "Cron job de precios registrado — corre a las 7:00am"
```

### 6.2 Forzar la primera actualización de precios

El cron corre automáticamente a las 7am, pero en el primer arranque hay que forzarlo manualmente para tener datos reales inmediatamente:

```bash
# Con el servidor corriendo, ejecutar en otra terminal:
curl -X POST http://localhost:3000/api/precios/actualizar-externas \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json"

# Respuesta esperada:
# { "success": true, "datos": { "chicago_usd_bushel": X.XX, "tc_banxico": XX.XX } }
```

> Si no tienes token de Admin todavía, puedes llamar al servicio directamente desde el código una sola vez o esperar al cron de las 7am del día siguiente.

### 6.3 Arrancar el frontend

```bash
cd app-bodega
npm run dev
# El frontend debe arrancar en http://localhost:5173
```

---

## 7. Verificar que todo funciona

Ejecutar estas pruebas en orden después del arranque:

### 7.1 Verificar conexión backend + BD

```bash
curl http://localhost:3000/api/health
# Respuesta esperada: { "status": "ok", "db": "connected" }
```

### 7.2 Verificar que el precio tiene datos reales

```bash
curl http://localhost:3000/api/precios/referencias/externas
# Respuesta esperada:
# {
#   "chicago_usd_bushel": 6.28,   ← número real, no hardcodeado
#   "tc_banxico": 17.42,           ← número real de Banxico o Yahoo
#   "chicago_mxn": 4306.23,
#   "fuente": "cron" o "primer_arranque",
#   "updated_at": "2026-05-29T07:00:00Z"
# }
```

### 7.3 Verificar el Margen de Negociación

```bash
curl http://localhost:3000/api/precios/sistema/hoy
# Verificar que margen_negociacion ≈ 4,000-5,000 MXN/ton
# (NO debe ser $571 — ese era el bug)
# Cálculo manual: (chicago × 39.368 × tc) + (50 × tc)
# Ejemplo: (6.28 × 39.368 × 17.42) + (50 × 17.42) = ~4,310 MXN/ton ✅
```

### 7.4 Prueba de registro de productor Tipo B

1. Abrir `http://localhost:5173`
2. Ir al flujo de registro de nuevo productor
3. Llenar todos los campos
4. Crear PIN de 4 dígitos
5. Confirmar registro
6. ✅ Debe navegar a la pantalla de éxito sin error

### 7.5 Prueba del flujo Tengo Maíz

1. Login con productor activo
2. Dashboard → "Tengo maíz disponible"
3. Paso 1: seleccionar tipo "Blanco"
4. Paso 2: ✅ deben aparecer variedades (H-438, H-40, etc.)
5. Seleccionar variedad → Paso 3 → confirmar
6. ✅ registro exitoso

### 7.6 Verificar ciclos múltiples

```bash
# Crear dos ciclos del mismo tipo en la misma UP — debe fallar:
curl -X POST http://localhost:3000/api/ups/1/cycles \
  -H "Authorization: Bearer TOKEN_PRODUCTOR" \
  -H "Content-Type: application/json" \
  -d '{"cycle_type": "PV", "cycle_year": 2026}'

# Primera llamada: 201 Created ✅
# Segunda llamada con mismo PV 2026: 
# 409 Conflict — "Ya tienes un ciclo PV 2026 activo" ✅
```

---

## 8. Verificar el precio en tiempo real

Esta sección confirma que Chicago y el TC vienen de fuentes reales y no están hardcodeados.

### 8.1 Verificar la fuente del dato

```sql
-- En psql, verificar el último registro en la tabla:
SELECT fuente, chicago_usd_bushel, tc_banxico, error, created_at 
FROM precio_referencias_externas 
ORDER BY created_at DESC 
LIMIT 5;
```

| fuente | Significa |
|---|---|
| `primer_arranque` | Valor inicial de la migración — todavía no corre el cron |
| `cron` | ✅ Dato real de Yahoo Finance + Banxico, actualizado automáticamente |
| `admin_manual` | ✅ Actualizado manualmente desde el panel Admin |
| `fallback` | ⚠️ Yahoo Finance o Banxico fallaron — usando último valor conocido |

### 8.2 Verificar la fórmula del Margen de Negociación

Con los valores que devuelve `/api/precios/referencias/externas`, hacer el cálculo manual y comparar:

```
chicago_usd_bushel = X.XX   (de la API)
tc_banxico         = XX.XX  (de la API)

Paso 1: chicago_usd_ton = X.XX × 39.368
Paso 2: chicago_mxn     = chicago_usd_ton × tc_banxico
Paso 3: bono_mxn        = 50 × tc_banxico
Paso 4: margen          = chicago_mxn + bono_mxn

El campo margen_negociacion de /api/precios/sistema/hoy
debe coincidir con este cálculo. Si no coincide → el bug
de la fórmula (línea 66 de precios-sistema.ts) no fue corregido.
```

### 8.3 Si el cron no está corriendo

Verificar en los logs del servidor al arrancar. Si no aparece el mensaje del cron:

```bash
# Buscar en el código dónde se registra el cron:
grep -r "node-cron\|cron.schedule" backend/src/

# Verificar que el archivo de jobs se importa en el servidor principal:
grep -r "preciosCron\|jobs" backend/src/index.ts
# o
grep -r "preciosCron\|jobs" backend/src/app.ts
```

Si el archivo de jobs no se importa en el entry point del servidor, el cron nunca se registra aunque el código exista. Agregar la importación:

```typescript
// En backend/src/index.ts o app.ts — agregar:
import './jobs/preciosCron';
// Esta línea registra el cron al arrancar el servidor
```

---

## 9. Checklist final

Marcar cada punto antes de considerar el setup completo:

### Entorno
- [ ] Node >= 18 instalado
- [ ] PostgreSQL >= 15 con PostGIS instalado
- [ ] `backend/.env` creado con todos los valores reales
- [ ] `app-bodega/.env` creado con `VITE_API_URL`
- [ ] `BANXICO_TOKEN` obtenido y configurado en `.env`

### Base de datos
- [ ] BD `simac_db` creada con extensión PostGIS activa
- [ ] Todas las migraciones ejecutadas en orden (init → v6 → v8 → v13 → v18)
- [ ] Query de verificación: `email` es nullable en `usuarios`
- [ ] Query de verificación: 4 columnas nuevas existen en `producer`
- [ ] Query de verificación: `precio_referencias_externas` tiene al menos 1 fila
- [ ] Query de verificación: `estado_ciclo` existe en `cycle`

### Backend
- [ ] `npm install` completado sin errores
- [ ] `yahoo-finance2` y `node-cron` instalados
- [ ] Servidor arranca en puerto 3000 sin errores
- [ ] Log confirma conexión a PostgreSQL
- [ ] Log confirma que el cron job está registrado
- [ ] Import del cron en el entry point del servidor (`index.ts` o `app.ts`)

### Correcciones de código aplicadas
- [ ] Fórmula `margen_negociacion` corregida en `precios-sistema.ts` línea 66
- [ ] `GET /api/precios/referencias/externas` lee de la tabla — no hardcodeado
- [ ] `DisponibilidadVariedadPage.tsx` usa `data.varieties?.maiz` y `v.code` / `v.label`
- [ ] `DisponibilidadConfirmPage.tsx` envía `variedad_code` y `volumen_estimado_ton`
- [ ] `disponibilidad.ts` resuelve `up_id` del token JWT
- [ ] `requireRol` middleware creado y aplicado a endpoints de ciclos
- [ ] Catch mejorado en registro Tipo B con mensajes por código de error

### Verificaciones funcionales
- [ ] `GET /api/health` responde `{ status: "ok" }`
- [ ] `GET /api/precios/referencias/externas` devuelve datos reales (no hardcodeados)
- [ ] `margen_negociacion` en `/api/precios/sistema/hoy` es ~4,000-5,000 MXN/ton
- [ ] Registro de productor Tipo B funciona end-to-end
- [ ] Flujo Tengo Maíz muestra variedades y completa el registro
- [ ] Dos ciclos PV del mismo año en la misma UP dan error 409

### Primera actualización de precios
- [ ] `POST /api/precios/actualizar-externas` ejecutado manualmente una vez
- [ ] `SELECT fuente FROM precio_referencias_externas` muestra `cron` o `admin_manual`
- [ ] Cálculo manual del margen coincide con el valor en pantalla

---

## Resumen — qué hace cada documento

| Documento | Para qué sirve |
|---|---|
| **Este documento** (Setup Inicial) | Levantar el proyecto desde cero una sola vez |
| `SIMAC_Productor_Correcciones_V3.md` | Corregir errores del módulo productor + ciclos múltiples |
| `SIMAC_Admin_Correcciones_V2.md` | Corregir y expandir el módulo Admin |
| `SIMAC_Precios_Spec_V1.md` | Referencia completa de la lógica de precios |
| `SIMAC_Admin_Spec_V1.md` | Especificación original del módulo Admin |

**Orden de trabajo recomendado:**
```
1. Este documento → levanta todo
2. Productor V3    → corrige errores activos y agrega ciclos
3. Admin V2        → expande el Admin con módulos nuevos
```

---

*Plan Nacional Maíz 2026 · SIMAC — Setup Inicial · Mayo 2026*  
*Confidencial — Uso interno del equipo de desarrollo*
