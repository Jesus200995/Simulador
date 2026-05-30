# SIMAC — Correcciones Módulo Productor V3
**Fecha:** Mayo 2026 | **Repo:** github.com/Jesus200995/Simulador
**Basado en:** Auditoría técnica real — archivos y líneas verificados
**Para:** Desarrollador — implementar en el orden indicado

---

## Índice

1. [B1 — handleMeInteresa pasa ID incorrecto](#b1--handlemeinteresa-pasa-id-incorrecto)
2. [B2 — Error 500 en registro: tabla municipios_referencia](#b2--error-500-en-registro)
3. [B3 — Badge de notificaciones ausente en campana](#b3--badge-de-notificaciones-ausente)
4. [U1 — Error de PIN fuera del viewport](#u1--error-de-pin-fuera-del-viewport)
5. [U2 — Botón "Volver a ingresar PIN" inexistente](#u2--botón-volver-a-ingresar-pin)
6. [U3 — Variedades mezcladas y criollo duplicado](#u3--variedades-mezcladas-y-criollo-duplicado)
7. [U4 — Dashboard no consulta notificaciones](#u4--dashboard-no-consulta-notificaciones)
8. [Verificar PostGIS antes de producción](#verificar-postgis)
9. [Orden de implementación](#orden-de-implementación)

---

## B1 — handleMeInteresa pasa ID incorrecto

**Archivo:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx` **línea 143**
**Severidad:** 🔴 Crítico — el botón "Me interesa" nunca funciona correctamente

**Problema:**
El botón pasa `b.id` que es el ID de la bodega del catálogo.
El endpoint `POST /api/senales-compra/:id/interes` espera el ID de una
señal de compra (`senales_compra.id`), no el de la bodega.

```typescript
// ANTES — incorrecto:
<button onClick={() => handleMeInteresa(b.id)}>Me interesa</button>

// DESPUÉS — pasar el ID de la señal activa, no el de la bodega:
<button onClick={() => handleMeInteresa(b.senal_activa.id)}>Me interesa</button>
```

**Además verificar que el objeto bodega incluye `senal_activa`:**
```typescript
// El API GET /bodegas debe devolver en cada bodega:
{
  id: number,           // ID de la bodega
  nombre: string,
  // ...otros campos...
  senal_activa: {
    id: number,         // ← este es el ID que necesita handleMeInteresa
    precio_oferta: number,
    volumen_ton: number,
    tipo_maiz: string,
  } | null
}

// Si senal_activa es null, ocultar el botón:
{b.senal_activa && (
  <button onClick={() => handleMeInteresa(b.senal_activa.id)}>
    Me interesa
  </button>
)}
```

---

## B2 — Error 500 en registro

**Archivo:** `backend/src/routes/productor.ts` **línea ~274**
**Severidad:** 🔴 Crítico — bloquea el registro de nuevos productores Tipo B

La causa principal del "Error interno del servidor" es la query sobre
`municipios_referencia` dentro de una transacción sin manejo de error específico.
Si la tabla no existe o el municipio no se encuentra, la excepción propaga
y hace ROLLBACK sin mensaje útil al cliente.

**Corrección 1 — Verificar que la tabla existe y cargarla:**
```sql
-- Ejecutar en la base de datos antes de continuar:
-- 1. Verificar si existe:
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'municipios_referencia'
);

-- 2. Si no existe, crearla:
CREATE TABLE IF NOT EXISTS municipios_referencia (
  municipio_id  SERIAL PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL,
  estado_id     INTEGER NOT NULL,
  estado_nombre VARCHAR(100) NOT NULL,
  centroid_lat  NUMERIC(10, 7),
  centroid_lng  NUMERIC(10, 7)
);

-- 3. Cargar datos desde el GeoJSON de INEGI (ver instrucciones al final)
```

**Corrección 2 — Hacer la query tolerante a tabla vacía:**
```typescript
// backend/src/routes/productor.ts — línea ~274
// ANTES — falla si la tabla no existe o el municipio no está:
const munRow = await pool.query(
  `SELECT municipio_id FROM municipios_referencia
   WHERE LOWER(nombre) = LOWER($1) AND estado_id = $2`,
  [municipio, estadoId]
);

// DESPUÉS — envolver en try/catch con fallback:
let municipioId = null;
try {
  const munRow = await pool.query(
    `SELECT municipio_id FROM municipios_referencia
     WHERE LOWER(nombre) = LOWER($1) AND estado_id = $2
     LIMIT 1`,
    [municipio, estadoId]
  );
  municipioId = munRow.rows[0]?.municipio_id ?? null;
} catch (err) {
  // La tabla no existe o el municipio no se encontró
  // No es error fatal — el registro puede continuar sin centroide de municipio
  console.warn('municipios_referencia no disponible:', err);
}
```

**Corrección 3 — Mejorar el manejo de errores en la transacción:**
```typescript
// backend/src/routes/productor.ts — alrededor de línea ~210
// ANTES — error genérico:
} catch (err) {
  await client.query('ROLLBACK');
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// DESPUÉS — mensaje específico según el tipo de error:
} catch (err: any) {
  await client.query('ROLLBACK');
  console.error('Error en registro-nuevo-productor:', err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Esta CURP ya está registrada en el sistema' });
  }
  if (err.code === '42P01') {
    return res.status(500).json({ error: 'Configuración de base de datos incompleta. Contacta al administrador.' });
  }
  if (err.message?.includes('ST_SetSRID') || err.message?.includes('ST_GeomFromGeoJSON')) {
    // PostGIS no instalado — registrar sin polígono como fallback
    console.warn('PostGIS no disponible — registro sin polígono');
    // Continuar el registro sin guardar el polígono
    return res.status(201).json({ mensaje: 'Registro enviado. La ubicación se actualizará después.' });
  }

  return res.status(500).json({ error: 'Error al registrar. Intenta de nuevo.' });
}
```

**Corrección 4 — Validar el PIN antes de iniciar la transacción:**
```typescript
// Agregar al inicio de la función, antes del BEGIN:
const { pin } = req.body;
if (!pin || !/^\d{4}$/.test(String(pin))) {
  return res.status(400).json({ error: 'El PIN debe ser exactamente 4 dígitos numéricos' });
}
```

---

## B3 — Badge de notificaciones ausente en campana

**Archivo:** `app-bodega/src/components/LayoutProductor.tsx` **líneas 56–60**
**Severidad:** 🔴 Crítico — el productor no sabe cuando tiene notificaciones

El layout de bodega (`Layout.tsx`) ya tiene este badge con polling cada 60 segundos.
Replicar la misma lógica en el layout del productor.

```typescript
// LayoutProductor.tsx — agregar estado y polling de notificaciones

import { useEffect, useState } from 'react';

// Dentro del componente LayoutProductor:
const [notifNoLeidas, setNotifNoLeidas] = useState(0);
const token = localStorage.getItem('token');
const BASE = import.meta.env.VITE_API_URL;

// Polling cada 60 segundos — igual que Layout.tsx del bodeguero
useEffect(() => {
  const fetchNotifs = async () => {
    try {
      const r = await fetch(`${BASE}/alertas/notificaciones/mis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setNotifNoLeidas(d.total_no_leidas ?? 0);
      }
    } catch { /* silencioso */ }
  };

  fetchNotifs();
  const interval = setInterval(fetchNotifs, 60_000);
  return () => clearInterval(interval);
}, [token]);

// ANTES — campana sin badge:
<button onClick={() => navigate('/productor/alertas')}
  className="p-2 rounded-full hover:bg-white/20">
  <BellIcon className="w-6 h-6 text-white" />
</button>

// DESPUÉS — campana con badge:
<button onClick={() => navigate('/productor/alertas')}
  className="relative p-2 rounded-full hover:bg-white/20">
  <BellIcon className="w-6 h-6 text-white" />
  {notifNoLeidas > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                     bg-red-500 text-white text-[10px] font-bold rounded-full
                     flex items-center justify-center px-1">
      {notifNoLeidas > 9 ? '9+' : notifNoLeidas}
    </span>
  )}
</button>
```

---

## U1 — Error de PIN fuera del viewport

**Archivo:** `app-bodega/src/pages/auth/RegistroNuevoPage.tsx` **líneas 277–282**
**Severidad:** 🟡 UX importante — el usuario no ve el error y no sabe qué pasó

El div de error está al inicio del contenedor scrollable. Cuando el usuario
está tecleando el PIN en la parte inferior de la pantalla, el error aparece
arriba y queda fuera del viewport. El PIN se resetea sin feedback visible.

**Corrección — mover el mensaje de error al lado del teclado PIN:**

```typescript
// RegistroNuevoPage.tsx — en el render del paso 5

// ANTES — error al tope del scroll (fuera del viewport cuando el usuario usa el PIN):
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
  {error && (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
      {error}
    </div>
  )}
  {/* ...contenido... */}

// DESPUÉS — mover el error justo encima de los círculos del PIN:
// Buscar el bloque del PIN y agregar el error inline:

{/* Bloque del PIN — dentro del paso 5 */}
<div className="mt-4">
  <p className="text-base font-semibold text-gray-800 text-center mb-1">
    {pinStep === 'crear' ? 'Crea tu PIN de 4 números' : 'Confirma tu PIN'}
  </p>
  <p className="text-xs text-gray-400 text-center mb-4">
    {pinStep === 'crear'
      ? 'Este es tu código secreto para entrar a la app'
      : 'Escribe el mismo PIN de nuevo para confirmarlo'}
  </p>

  {/* ← Error aquí, justo antes de los círculos */}
  {error && (
    <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl
                    p-3 text-red-700 text-sm text-center flex items-center
                    justify-center gap-2">
      <span>⚠</span>
      <span>{error}</span>
    </div>
  )}

  {/* Círculos indicadores del PIN */}
  <PinInput
    value={pinStep === 'crear' ? pin : confirmPin}
    onChange={handlePinChange}
  />
</div>
```

---

## U2 — Botón "Volver a ingresar PIN"

**Archivo:** `app-bodega/src/pages/auth/RegistroNuevoPage.tsx` **líneas 98–111**
**Severidad:** 🟡 UX importante — el usuario queda bloqueado sin saber qué hacer

Cuando los PINs no coinciden, el estado se resetea silenciosamente.
El usuario no tiene feedback claro ni un botón explícito de reintento.

**Corrección — hacer el reset visible y agregar botón de reinicio:**

```typescript
// RegistroNuevoPage.tsx — reemplazar handlePinChange completo

const handlePinChange = (val: string) => {
  // Limpiar error al escribir
  if (error) setError('');

  if (pinStep === 'crear') {
    setPin(val);
    if (val.length === 4) {
      setPinStep('confirmar');
      // Scroll automático para asegurar que el usuario vea la confirmación
    }
  } else {
    setConfirmPin(val);
    if (val.length === 4) {
      if (val !== pin) {
        setError('Los PIN no coinciden. Inténtalo de nuevo.');
        // NO resetear automáticamente — dejar que el usuario vea el error
        // El botón de reinicio se encarga del reset explícito
        setConfirmPin(''); // solo limpiar la confirmación, no el PIN original
      }
    }
  }
};

// Agregar función de reinicio explícito:
const reiniciarPin = () => {
  setPin('');
  setConfirmPin('');
  setPinStep('crear');
  setError('');
};

// En el render — agregar botón de reinicio cuando hay error de PIN:
{error && error.includes('PIN') && (
  <div className="text-center mt-3">
    <button
      onClick={reiniciarPin}
      className="text-[#1A5C38] text-sm font-semibold underline">
      Volver a crear mi PIN desde cero
    </button>
  </div>
)}

// Actualizar el indicador de paso para que sea más claro:
<p className="text-base font-semibold text-gray-800 text-center mb-1">
  {pinStep === 'crear'
    ? '🔐 Crea tu PIN de 4 números'
    : '🔁 Confirma tu PIN'}
</p>
<p className="text-xs text-gray-400 text-center mb-4">
  {pinStep === 'crear'
    ? 'Este número secreto es para entrar a la app. Recuérdalo bien.'
    : 'Escribe exactamente los mismos 4 números para confirmar.'}
</p>
```

---

## U3 — Variedades mezcladas y criollo duplicado

**Archivo:** `app-bodega/src/pages/productor/CicloProductivoPage.tsx`
**Líneas:** 60–65 (fetch), 190 (render sin filtro), 201–217 (criollo hardcodeado)
**Severidad:** 🟡 UX importante — lista confusa e inconsistente

**Problema raíz:** El endpoint `/catalogos-productor` devuelve las 23 variedades
de todos los tipos mezcladas. Además hay un botón "Criollo / Local" hardcodeado
que duplica la opción que ya viene de la base de datos.

**Corrección 1 — Agregar selector de tipo de maíz ANTES de mostrar variedades:**

```typescript
// CicloProductivoPage.tsx — agregar estado para tipo de maíz
const [tipoMaiz, setTipoMaiz] = useState<'blanco' | 'amarillo' | 'criollo' | ''>('');

// Paso 2 del ciclo debe tener DOS sub-secciones:
// 2a — ¿Qué tipo de maíz siembras? (blanco/amarillo/criollo)
// 2b — ¿Qué variedad? (lista filtrada según el tipo)

// Solo mostrar la lista de variedades DESPUÉS de seleccionar el tipo:
{!tipoMaiz && (
  <div className="space-y-3">
    {['blanco', 'amarillo', 'criollo'].map(t => (
      <button key={t} onClick={() => setTipoMaiz(t as any)}
        className="w-full rounded-2xl p-4 border-2 border-gray-200 text-left">
        <p className="font-semibold text-gray-800 capitalize">Maíz {t}</p>
      </button>
    ))}
  </div>
)}
```

**Corrección 2 — Filtrar variedades por tipo y eliminar el criollo hardcodeado:**

```typescript
// CicloProductivoPage.tsx — reemplazar el fetch y el render de variedades

// Fetch con filtro por tipo:
useEffect(() => {
  if (!tipoMaiz) return;
  api.get(`/catalogos-productor?tipo_maiz=${tipoMaiz}`)
    .then(({ data: d }) => {
      setVariedades(d.varieties ?? []);
    });
}, [tipoMaiz]);

// ANTES — sin filtro + criollo duplicado hardcodeado:
{variedades.map((v) => (
  <button key={v.code} onClick={() => setVariedad(v.code)}>
    {v.label}
  </button>
))}
// + bloque hardcodeado de criollo (líneas 201-217)

// DESPUÉS — solo las del API, sin hardcoding:
{variedades.map((v) => (
  <button key={v.id ?? v.code}
    onClick={() => {
      setVariedad(v.id ?? v.code);
      setVariedadNombre(v.nombre_variedad ?? v.label);
      // Si es criollo/local, mostrar campo de texto para especificar
      setEsCriollo(
        v.nombre_variedad?.toLowerCase().includes('criollo') ||
        v.code === 'MC_CRIOLLO'
      );
    }}
    className={`w-full rounded-xl p-3.5 border-2 text-left transition-all
      ${variedad === (v.id ?? v.code)
        ? 'border-[#1A5C38] bg-green-50'
        : 'border-gray-200'}`}>
    <p className="text-sm font-medium text-gray-800">
      {v.nombre_variedad ?? v.label}
    </p>
  </button>
))}

{/* Campo para especificar si seleccionó criollo — aparece dinámicamente */}
{esCriollo && (
  <div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ¿Cómo se llama tu variedad criolla? <span className="text-gray-400 font-normal">(opcional)</span>
    </label>
    <input
      type="text"
      value={variedadCriollaEspecifica}
      onChange={e => setVariedadCriollaEspecifica(e.target.value)}
      placeholder="Ej: Olotillo, Pepitilla, Olotón..."
      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                 focus:border-[#1A5C38] focus:outline-none"
    />
  </div>
)}
```

**Corrección 3 — Backend: agregar filtro por tipo_maiz al endpoint:**

```typescript
// backend/src/routes/catalogos.ts (o donde esté /catalogos-productor)
// Agregar filtro opcional por tipo_maiz en el query:

router.get('/catalogos-productor', authMiddleware, async (req, res) => {
  const { tipo_maiz } = req.query;

  let whereClause = `WHERE crop = 'maiz'`;
  const params: any[] = [];

  if (tipo_maiz) {
    // Mapeo de tipo a prefijos de variedades en la BD
    // Blanco: H-*, V-5*, y similares del catálogo blanco
    // Amarillo: H-384A, H-385, V-53A, V-55A, Búho, etc.
    // Criollo: MC_CRIOLLO, CRIOLLO_*, NO_SABE
    whereClause += ` AND tipo_maiz = $1`;
    params.push(tipo_maiz);
  }

  const { rows } = await pool.query(
    `SELECT id, nombre_variedad, code, tipo_maiz
     FROM cat_crop_variety
     ${whereClause}
     ORDER BY
       CASE WHEN nombre_variedad = 'No sabe' THEN 1 ELSE 0 END,
       nombre_variedad ASC`,
    params
  );

  // Deduplicar por si hay registros repetidos
  const unique = rows.filter((v, i, arr) =>
    arr.findIndex(x => x.code === v.code) === i
  );

  res.json({ varieties: unique });
});
```

> **Nota:** Si la tabla `cat_crop_variety` no tiene columna `tipo_maiz`,
> agregar la migración correspondiente y actualizar los registros existentes
> clasificando cada variedad como 'blanco', 'amarillo' o 'criollo'.

---

## U4 — Dashboard no consulta notificaciones

**Archivo:** `app-bodega/src/pages/productor/DashboardProductorPage.tsx` **líneas 70–83**
**Severidad:** 🟡 UX importante — el bloque de alerta activa nunca aparece

El dashboard carga los datos del productor pero nunca consulta si hay
notificaciones sin leer para mostrar el banner de alerta activa en la parte superior.

```typescript
// DashboardProductorPage.tsx — agregar fetch de notificaciones al useEffect principal

useEffect(() => {
  const headers = { Authorization: `Bearer ${token}` };

  // Fetches existentes:
  fetch(`${BASE}/productor/dashboard`, { headers })
    .then(r => r.json()).then(setDashData);

  fetch(`${BASE}/productor/mi-ciclo`, { headers })
    .then(r => r.json()).then(setCiclo);

  // ← AGREGAR: consulta de notificaciones no leídas
  fetch(`${BASE}/alertas/notificaciones/mis`, { headers })
    .then(r => r.json())
    .then(d => {
      // Buscar la alerta activa más reciente para el banner superior
      const alertaActiva = d.notificaciones?.find(
        (n: any) => !n.leida &&
          ['alerta_climatica', 'alerta_sanitaria'].includes(n.tipo)
      ) ?? null;
      setAlertaActiva(alertaActiva);
      setNotifNoLeidas(d.total_no_leidas ?? 0);
    })
    .catch(() => {}); // silencioso — no romper el dashboard si falla

}, [token]);

// Agregar estado:
const [alertaActiva, setAlertaActiva] = useState<any>(null);
const [notifNoLeidas, setNotifNoLeidas] = useState(0);
```

---

## Verificar PostGIS

**Archivo:** `backend/src/routes/productor.ts` **línea ~244**

Antes de desplegar a producción, verificar que PostGIS está activo:

```sql
-- Ejecutar en la BD:
SELECT PostGIS_version();
-- Si lanza error → PostGIS no está instalado

-- Instalar si es necesario (requiere superuser):
CREATE EXTENSION IF NOT EXISTS postgis;
```

Si PostGIS **no está disponible** en el servidor de producción, desactivar
temporalmente el guardado del polígono hasta que se instale:

```typescript
// backend/src/routes/productor.ts — línea ~244
// Envolver en verificación:
const postgisDisponible = process.env.POSTGIS_ENABLED === 'true';

if (poligono && postgisDisponible) {
  await client.query(
    `UPDATE up SET
       poligono = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
       area_ha_calc = $2
     WHERE up_id = $3`,
    [JSON.stringify(poligono), superficieHa, upId]
  );
} else if (superficieHa) {
  // Al menos guardar el área aunque no haya polígono
  await client.query(
    `UPDATE up SET area_ha_calc = $1 WHERE up_id = $2`,
    [superficieHa, upId]
  );
}
```

Agregar en `.env`:
```
POSTGIS_ENABLED=true   # cambiar a false si no está instalado
```

---

## Orden de implementación

```
DÍA 1 — Críticos (3–4 horas)
  □ B2: Verificar y crear tabla municipios_referencia en BD
  □ B2: Mejorar manejo de errores en registro-nuevo-productor (catch específico)
  □ B2: Validar PIN antes del BEGIN en backend
  □ Verificar PostGIS — activar o agregar flag POSTGIS_ENABLED
  □ B1: Corregir handleMeInteresa — pasar b.senal_activa.id

DÍA 2 — UX del PIN (2–3 horas)
  □ U1: Mover div de error al lado del teclado PIN (inline con los círculos)
  □ U2: Cambiar handlePinChange — no resetear automáticamente
  □ U2: Agregar botón "Volver a crear mi PIN desde cero"
  □ U2: Actualizar textos del indicador de paso (crear / confirmar)

DÍA 3 — Variedades y notificaciones (3–4 horas)
  □ U3: Backend — agregar filtro tipo_maiz a /catalogos-productor
  □ U3: Backend — agregar columna tipo_maiz a cat_crop_variety si no existe
  □ U3: Frontend — agregar selector de tipo antes de mostrar variedades
  □ U3: Frontend — eliminar bloque hardcodeado de criollo (líneas 201–217)
  □ U3: Frontend — agregar campo "especificar" dinámico cuando es criollo
  □ U4: Dashboard — agregar fetch de notificaciones al useEffect
  □ B3: LayoutProductor — agregar badge con polling en la campana
```

---

## Resumen de cambios por archivo

| Archivo | Tipo | Cambio |
|---|---|---|
| `MapaBodegasPage.tsx` línea 143 | Bug fix | `handleMeInteresa(b.senal_activa.id)` |
| `backend/productor.ts` línea ~274 | Bug fix | Try/catch en municipios_referencia + errores específicos |
| `LayoutProductor.tsx` líneas 56–60 | Feature | Badge con contador + polling 60s en campana |
| `RegistroNuevoPage.tsx` líneas 98–111 | UX fix | handlePinChange sin reset automático |
| `RegistroNuevoPage.tsx` líneas 277–282 | UX fix | Error de PIN inline junto al teclado |
| `RegistroNuevoPage.tsx` nuevo | UX fix | Función `reiniciarPin` + botón visible |
| `CicloProductivoPage.tsx` líneas 60–65 | UX fix | Fetch con filtro `?tipo_maiz=` |
| `CicloProductivoPage.tsx` línea 190 | UX fix | Render filtrado por tipo |
| `CicloProductivoPage.tsx` líneas 201–217 | UX fix | Eliminar criollo hardcodeado |
| `CicloProductivoPage.tsx` nuevo | UX fix | Selector de tipo de maíz antes de variedades |
| `DashboardProductorPage.tsx` líneas 70–83 | UX fix | Agregar fetch de notificaciones al useEffect |
| `backend/catalogos.ts` | Feature | Filtro `tipo_maiz` + deduplicación + ORDER BY |
| `BD` | Migración | Verificar/crear `municipios_referencia` + columna `tipo_maiz` en `cat_crop_variety` |

---

*SIMAC — Plan Nacional Maíz 2026 · Mayo 2026*
*Basado en auditoría real — todos los archivos y líneas verificados*

---

## Corrección adicional — Pantalla de Precios del Productor (P-11)

**Archivo:** `app-bodega/src/pages/productor/PreciosProductorPage.tsx`
**Tipo:** Rediseño visual completo — la lógica de cálculo no cambia
**Referencia:** Mockup aprobado `Precio_productor_visual.png`

> Esta pantalla es **solo visual** — los datos vienen del backend que se
> configurará desde el módulo Admin. El productor solo consulta, no edita.
> Mientras el Admin no esté listo, mostrar los datos que ya devuelve
> `GET /api/productor/precios` con los estados de "Sin datos" donde falten.

---

### Nueva estructura visual — reemplazar el componente completo

```tsx
// PreciosProductorPage.tsx — reescribir completo con esta estructura

const BASE = import.meta.env.VITE_API_URL;
const BONO_MAIZ_BLANCO_USD = 50; // fijo — se configurará desde Admin en el futuro

export default function PreciosProductorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${BASE}/productor/precios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (!data) return null;

  // ── Cálculos ────────────────────────────────────────────────────────────
  const chicago     = data.precio_chicago_usd_bushel;
  const tipoCambio  = data.tipo_cambio_mxn;
  const po          = data.precio_compra;          // PO — lo que paga la bodega
  const servicios   = data.servicios_promedio;     // S — tarifario de servicios
  const tieneChicago   = chicago != null && tipoCambio != null;
  const tieneServicios = servicios != null;
  const tienePO        = po != null;

  // Margen de Negociación = (Chicago × 39.368 × tipo_cambio) + (Bono × tipo_cambio)
  const margen = tieneChicago
    ? (chicago * 39.368 * tipoCambio) + (BONO_MAIZ_BLANCO_USD * tipoCambio)
    : null;

  // Precio de Compra = PO + S
  const precioCompra = tienePO && tieneServicios ? po + servicios : null;

  // Precio de Venta = Precio de Compra − Margen de Negociación
  const precioVenta = precioCompra != null && margen != null
    ? precioCompra - margen
    : null;

  const esFavorable = precioVenta != null && precioVenta >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <button onClick={() => navigate('/productor')}
          className="text-gray-400 text-sm mb-3 flex items-center gap-1">
          ← Regresar
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌽</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Precios del maíz para productores
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Consulta la referencia internacional, el precio de compra
                y tu precio de venta.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-xs text-gray-400
                          bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
            <span>🔄</span>
            <span>Actualizado hoy · 7:00 am</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── PRECIO 1 — Referencia internacional ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <span className="w-7 h-7 bg-[#1A5C38] text-white rounded-full
                             flex items-center justify-center text-sm font-bold shrink-0">
              1
            </span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                Referencia internacional
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Se calcula con el futuro de Chicago, el tipo de cambio
                y el bono de maíz blanco.
              </p>
            </div>
          </div>

          {/* Bloque verde oscuro con el total y los 3 componentes */}
          <div className="mx-4 mb-4 bg-[#1A2F1F] rounded-2xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-4xl font-bold text-white">
                  {margen != null
                    ? `$${margen.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                    : <span className="text-2xl text-gray-400">Sin datos suficientes</span>
                  }
                </p>
                <p className="text-green-400 text-sm font-medium mt-0.5">
                  Margen de negociación
                </p>
                <p className="text-gray-400 text-xs mt-0.5">MXN/ton</p>
                <p className="text-gray-500 text-xs mt-2">
                  Referencia internacional para negociar el maíz blanco.
                </p>
              </div>
            </div>

            {/* 3 mini tarjetas de componentes */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                {
                  icon: '📈',
                  label: 'Futuro Chicago (contrato vigente)',
                  value: tieneChicago
                    ? `$${chicago} USD/bushel`
                    : 'Sin datos',
                },
                {
                  icon: '💵',
                  label: 'Tipo de cambio Banxico',
                  value: tipoCambio != null
                    ? `$${tipoCambio} MXN/USD`
                    : 'Sin datos',
                },
                {
                  icon: '🏷',
                  label: 'Bono maíz blanco',
                  value: `+$${BONO_MAIZ_BLANCO_USD} USD/ton`,
                },
              ].map(item => (
                <div key={item.label}
                  className="bg-white/10 rounded-xl p-2.5 text-center">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold text-white mt-1">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Fórmula visual */}
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-gray-400">
                🧮 (Futuro × 39.368 × dólar) + bono ={' '}
                <span className="text-green-400 font-semibold">
                  margen de negociación
                </span>
              </p>
            </div>

            <p className="text-[10px] text-gray-500 text-right mt-2">
              ⏱ Datos automáticos del día
            </p>
          </div>
        </div>

        {/* ── PRECIO 2 — Precio de compra ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-[#1A5C38] text-white rounded-full
                               flex items-center justify-center text-sm font-bold shrink-0">
                2
              </span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  Precio de compra
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Es el precio inicial que resulta de sumar lo que paga
                  la bodega más sus servicios.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1A5C38] bg-green-50
                             border border-green-200 rounded-full px-2 py-1 shrink-0">
              PRECIO EN BODEGA
            </span>
          </div>

          {/* Ecuación PO + S = Precio compra */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">

              {/* PO — Verde */}
              <div className="flex-1 bg-[#E8F5EE] border border-green-200
                              rounded-2xl p-3 text-center">
                <div className="w-8 h-8 bg-[#1A5C38] rounded-full flex items-center
                                justify-center mx-auto mb-2">
                  <span className="text-white text-sm">💰</span>
                </div>
                <p className="text-[10px] text-[#1A5C38] font-semibold uppercase
                              tracking-wide">
                  Lo que te paga la bodega (PO)
                </p>
                <p className="text-xl font-bold text-[#1A5C38] mt-1">
                  {tienePO
                    ? `$${po.toLocaleString('es-MX')}`
                    : <span className="text-sm text-gray-400">Sin datos suficientes</span>
                  }
                </p>
                <p className="text-[10px] text-green-600 mt-0.5">
                  Promedio pagado · últimos 7 días
                </p>
              </div>

              <span className="text-xl font-bold text-gray-400 shrink-0">+</span>

              {/* S — Azul */}
              <div className="flex-1 bg-blue-50 border border-blue-200
                              rounded-2xl p-3 text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center
                                justify-center mx-auto mb-2">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <p className="text-[10px] text-blue-700 font-semibold uppercase
                              tracking-wide">
                  Servicios de la bodega (S)
                </p>
                <p className="text-xl font-bold text-blue-700 mt-1">
                  {tieneServicios
                    ? `$${servicios.toLocaleString('es-MX')}`
                    : <span className="text-sm text-gray-400">Sin datos</span>
                  }
                </p>
                <p className="text-[10px] text-blue-500 mt-0.5">
                  Secado, limpieza, almacenamiento...
                </p>
              </div>

              <span className="text-xl font-bold text-gray-400 shrink-0">=</span>

              {/* Total — Gris oscuro */}
              <div className="flex-1 bg-gray-800 rounded-2xl p-3 text-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center
                                justify-center mx-auto mb-2">
                  <span className="text-white text-sm">🏷</span>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase
                              tracking-wide">
                  Precio de compra inicial
                </p>
                <p className="text-xl font-bold text-white mt-1">
                  {precioCompra != null
                    ? `$${precioCompra.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                    : <span className="text-sm text-gray-400">Sin datos</span>
                  }
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">MXN/ton</p>
              </div>
            </div>

            {/* Notas de pie — condiciones de datos faltantes */}
            <div className="flex gap-4 mt-3">
              <p className="flex-1 text-[10px] text-gray-400 flex items-start gap-1">
                <span>ℹ️</span>
                <span>
                  Si aún no hay tarifario de servicios, se muestra
                  "Sin datos" en lugar de $0.
                </span>
              </p>
              <p className="flex-1 text-[10px] text-gray-400 flex items-start gap-1">
                <span>📊</span>
                <span>
                  Si no hay precios recientes de bodegas, se muestra
                  "Sin datos suficientes".
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── PRECIO 3 — Precio de venta ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <span className="w-7 h-7 bg-[#1A5C38] text-white rounded-full
                             flex items-center justify-center text-sm font-bold shrink-0">
              3
            </span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                Precio de venta
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Es el resultado final después de restar la referencia
                internacional al precio de compra.
              </p>
            </div>
          </div>

          <div className="px-4 pb-4">
            {/* Versión 1 — Precio de venta al productor */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-3">
              <p className="text-xs text-gray-500 font-semibold uppercase
                            tracking-wide mb-3">
                Versión 1 — Precio pagado al productor con servicios
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    🛒 Precio de compra
                  </span>
                  <span className="font-semibold text-gray-800">
                    {precioCompra != null
                      ? `$${precioCompra.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN/ton`
                      : '—'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    ➖ Margen de negociación
                  </span>
                  <span className="font-semibold text-gray-800">
                    {margen != null
                      ? `$${margen.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN/ton`
                      : '—'
                    }
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between
                                items-center">
                  <span className="font-bold text-gray-800 flex items-center gap-2">
                    🏆 Precio de venta
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold
                      ${precioVenta == null ? 'text-gray-400'
                        : esFavorable ? 'text-[#1A5C38]'
                        : 'text-red-500'}`}>
                      {precioVenta != null
                        ? `$${Math.abs(precioVenta).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN/ton`
                        : 'Sin datos'
                      }
                    </span>
                    {precioVenta != null && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full
                        ${esFavorable
                          ? 'bg-green-50 text-[#1A5C38] border border-green-200'
                          : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {esFavorable ? '✓ Favorable' : '⚠ Desfavorable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {precioVenta != null && !esFavorable && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200
                               rounded-xl p-2">
                  ⚠ El precio de compra está por debajo del margen de negociación
                  internacional.
                </p>
              )}
              {precioVenta == null && (
                <p className="text-xs text-gray-400">
                  ℹ️ Si el resultado es negativo, se muestra en rojo.
                </p>
              )}
            </div>

            {/* Versión 2 — CEDIS (En desarrollo) */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-500">
                  Versión 2 — Precio CEDIS
                </p>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold
                                 px-2 py-1 rounded-full">
                  EN DESARROLLO
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Precio en Centrales de Abasto menos el Margen de Negociación.
                Próximamente disponible cuando se configure desde el panel
                administrativo.
              </p>
            </div>
          </div>
        </div>

        {/* ── HISTÓRICO 30 DÍAS ── */}
        {data.tendencia?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#1A5C38]">📈</span>
                <p className="text-sm font-semibold text-gray-700">
                  Histórico de precios · 30 días
                </p>
              </div>
              <p className="text-xs text-gray-400">Escala: MXN/ton</p>
            </div>
            {/* Chart.js LineChart — solo precio de compra (PO) */}
            <Line
              data={{
                labels: data.tendencia.map((t: any) =>
                  new Date(t.fecha).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short'
                  })
                ),
                datasets: [{
                  label: 'Precio de compra (PO)',
                  data: data.tendencia.map((t: any) => t.precio_compra),
                  borderColor: '#1A5C38',
                  backgroundColor: 'rgba(26,92,56,0.08)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 0,
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (v: any) =>
                        `$${Number(v).toLocaleString('es-MX')}`
                    }
                  },
                  x: { ticks: { maxTicksLimit: 6 } }
                }
              }}
            />
          </div>
        )}

        {/* ── FIRA — solo si el estado tiene dato ── */}
        {data.fira && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase
                          tracking-wide mb-3">
              Referencia de costos FIRA · {data.estado}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Modalidad</span>
                <span className="font-medium">{data.fira.modalidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Costo por hectárea</span>
                <span className="font-semibold">
                  ${data.fira.costo_por_ha.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio FIRA de referencia</span>
                <span className="font-semibold text-[#1A5C38]">
                  ${data.fira.precio_fira.toLocaleString('es-MX')}/ton
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Fuente: FIRA · Ciclo PV 2026 ·
              Solo disponible para estados con datos reportados.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
```

---

### Lógica de estados vacíos — resumen para el programador

El backend devolverá `null` para campos que aún no estén configurados
desde el módulo Admin. El frontend debe manejar cada caso sin romper:

| Campo | Si es `null` | Dónde aplica |
|---|---|---|
| `precio_chicago_usd_bushel` | Mostrar "Sin datos" en tarjeta Chicago | Precio 1 |
| `tipo_cambio_mxn` | Mostrar "Sin datos" en tarjeta Tipo de cambio | Precio 1 |
| `margen` (calculado) | Bloque verde oscuro muestra "Sin datos suficientes" | Precio 1 |
| `precio_compra` (PO) | Bloque verde muestra "Sin datos suficientes" | Precio 2 |
| `servicios_promedio` (S) | Bloque azul muestra "Sin datos" — NO mostrar $0 | Precio 2 |
| `precioCompra` (PO+S) | Bloque gris oscuro muestra "Sin datos" | Precio 2 |
| `precioVenta` (calculado) | Fila total muestra "Sin datos" sin badge | Precio 3 |

> **Importante:** Si `servicios_promedio` es `null` mostrar "Sin datos",
> no `$0`. Un servicio de $0 es un dato incorrecto —
> "Sin datos" comunica que aún no está configurado.

---

### Verificar en backend que `GET /api/productor/precios` devuelve estos campos

```typescript
// Confirmar que el response incluye:
{
  estado:                    string,
  fecha:                     string,
  precio_compra:             number | null,  // PO
  servicios_promedio:        number | null,  // S — null si no hay tarifario
  precio_chicago_usd_bushel: number | null,  // null si no está configurado
  tipo_cambio_mxn:           number | null,  // null si no está configurado
  fira:                      object | null,
  tendencia:                 [{ fecha, precio_compra }]
}

// Si precio_chicago_usd_bushel o tipo_cambio_mxn no existen aún en el endpoint,
// devolver null explícitamente — no omitir el campo:
precio_chicago_usd_bushel: rows[0]?.chicago_usd_bushel ?? null,
tipo_cambio_mxn:           rows[0]?.tipo_cambio ?? null,
```

---

*Corrección agregada: Mayo 2026 — basada en mockup Precio_productor_visual.png*
