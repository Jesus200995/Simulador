# SIMAC — Correcciones Finales
## Documento Único — Lanzamiento + Piloto
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`

> Este documento tiene DOS tipos de acciones claramente separadas:
> 🤖 **AGENTE** — el agente de código lo aplica directamente en el repo
> 👨‍💻 **PROGRAMADOR** — acción manual que NO puede hacer el agente

---

## ÍNDICE DE CORRECCIONES

| # | Problema | Tipo | Urgencia |
|---|---|---|---|
| 1 | SOMEC → SIMAC en UI y PWA | 🤖 Agente | 🔴 Lanzamiento |
| 2 | Flujo "Soy Productor" → registro + link login | 🤖 Agente | 🔴 Lanzamiento |
| 3 | Modal registro exitoso | 🤖 Agente | 🔴 Lanzamiento |
| 4 | Semáforo default `sin_actividad` | 🤖 Agente | 🔴 Lanzamiento |
| 5 | POSTGIS_ENABLED en .env.example | 🤖 Agente + 👨‍💻 Programador | 🔴 Lanzamiento |
| 6 | Aviso centroide null en dashboard productor | 🤖 Agente | 🔴 Lanzamiento |
| 7 | Botón agregar segundo ciclo | 🤖 Agente | 🔴 Lanzamiento |
| 8 | DetalleBodegaPage con servicios y stock | 🤖 Agente | 🔴 Lanzamiento |
| 9 | JOIN notificaciones Tipo A | 🤖 Agente | 🟡 Piloto |
| 10 | PreciosAdmin estado inicial null | 🤖 Agente | 🟡 Piloto |
| 11 | Fallbacks Chicago y Banxico → error explícito | 🤖 Agente | 🟡 Piloto |
| 12 | Bono $50 USD → parámetro configurable | 🤖 Agente | 🟡 Piloto |
| 13 | Confirmación visible "Me interesa" | 🤖 Agente | 🟡 Piloto |

---

## 🔴 CORRECCIONES DE LANZAMIENTO
*Aplicar antes de abrir la plataforma a usuarios*

---

## CORRECCIÓN #1
### SOMEC → SIMAC en toda la interfaz de usuario
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVOS A MODIFICAR:**

**1A — `app-bodega/src/components/Layout.tsx`**
**BUSCAR (2 ocurrencias):**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1B — `app-bodega/src/components/LayoutProductor.tsx`**
**BUSCAR (2 ocurrencias):**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1C — `app-bodega/src/pages/B01Login.tsx`**
**BUSCAR:**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1D — `app-bodega/src/pages/B02Register.tsx`**
**BUSCAR:**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1E — `app-bodega/src/pages/MasPage.tsx`**
**BUSCAR:**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1F — `app-bodega/src/pages/WelcomePage.tsx`**
**BUSCAR:**
```typescript
SOMEC
```
**REEMPLAZAR CON:**
```typescript
SIMAC
```

**1G — `app-bodega/vite.config.ts` — nombre del PWA**
**BUSCAR:**
```typescript
name: 'SOMEC'
```
**REEMPLAZAR CON:**
```typescript
name: 'SIMAC'
```
**BUSCAR:**
```typescript
short_name: 'SOMEC'
```
**REEMPLAZAR CON:**
```typescript
short_name: 'SIMAC'
```

**VERIFICAR:**
```bash
# No debe quedar ninguna ocurrencia de SOMEC en el frontend
grep -r "SOMEC" app-bodega/src/
grep -r "SOMEC" app-bodega/vite.config.ts
# Resultado esperado: sin resultados
```

---

## CORRECCIÓN #2
### Flujo "Soy Productor" — ir al registro + agregar link "Ya tengo cuenta"
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVO:** `app-bodega/src/pages/WelcomePage.tsx`
**LÍNEA:** 51

**PROBLEMA:** Al tocar "Soy Productor" navega a `/login-productor`. Para el lanzamiento debe ir directamente al formulario de registro Tipo B. Además debe existir un link "Ya tengo cuenta — Iniciar sesión" para productores ya registrados.

**BUSCAR el bloque del botón "Soy Productor":**
```typescript
onClick={() => navigate('/login-productor')}
```

**REEMPLAZAR CON:**
```typescript
onClick={() => navigate('/registro-nuevo')}
```

**BUSCAR el bloque completo del botón "Soy Productor" en el JSX y agregar el link debajo:**
```typescript
{/* Después del botón "Soy Productor", agregar: */}
<div className="text-center mt-3">
  <button
    onClick={() => navigate('/login-productor')}
    className="text-sm text-green-300 underline hover:text-white transition-colors"
  >
    ¿Ya tienes cuenta? Inicia sesión aquí
  </button>
</div>
```

**VERIFICAR:** Abrir la app → pantalla de bienvenida → tocar "Soy Productor" → debe ir al formulario de registro. El link "¿Ya tienes cuenta?" debe llevar al login CURP+PIN.

---

## CORRECCIÓN #3
### Modal de registro exitoso con botón a login
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVOS:** 
- `app-bodega/src/pages/auth/RegistroNuevoPage.tsx` línea 181
- `app-bodega/src/pages/auth/ActivarCuentaPage.tsx`

**PROBLEMA:** Al terminar el registro navega directo a `/login-productor` sin confirmación. El usuario no sabe si su registro funcionó.

**3A — `RegistroNuevoPage.tsx`**

**AGREGAR estado del modal:**
```typescript
const [registroExitoso, setRegistroExitoso] = useState(false);
```

**BUSCAR la línea donde navega al terminar el registro exitosamente:**
```typescript
navigate('/login-productor');
```

**REEMPLAZAR CON:**
```typescript
setRegistroExitoso(true);
```

**AGREGAR el modal al final del JSX, antes del cierre del return:**
```typescript
{registroExitoso && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-6">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
      {/* Ícono de éxito */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-[#1A5C38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Registro exitoso!
      </h2>
      
      {/* Mensaje */}
      <p className="text-gray-600 mb-2">
        Tu cuenta ha sido creada correctamente en SIMAC.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Ya puedes iniciar sesión con tu CURP y PIN de 4 dígitos.
      </p>
      
      {/* Botón */}
      <button
        onClick={() => navigate('/login-productor')}
        className="w-full bg-[#1A5C38] text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-800 transition-colors"
      >
        Iniciar sesión
      </button>
    </div>
  </div>
)}
```

**3B — `ActivarCuentaPage.tsx`**
Aplicar el mismo modal. Mismo código, misma lógica — reemplazar `navigate('/login-productor')` por `setRegistroExitoso(true)` y agregar el modal idéntico al JSX.

**VERIFICAR:** Completar el formulario de registro → debe aparecer el modal con palomita verde → botón "Iniciar sesión" → navega a `/login-productor`. El modal debe aparecer tanto para Tipo A como para Tipo B.

---

## CORRECCIÓN #4
### Semáforo de bodegas — default `sin_actividad`
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**PROBLEMA:** Las bodegas nuevas aparecen en estado "comprando" aunque no hayan configurado nada. El default debe ser `sin_actividad`.

**4A — Backend `backend/src/routes/bodegas.ts`**

**BUSCAR donde se crea una bodega nueva (INSERT INTO bodegas):**
```typescript
INSERT INTO bodegas
```

**VERIFICAR que el campo `semaforo_compra` tiene valor explícito. Si no lo tiene, agregarlo:**
```typescript
// En el INSERT, agregar el campo:
semaforo_compra = 'sin_actividad'
```

**Si el INSERT usa un objeto de valores, buscar:**
```typescript
estatus: 'pendiente'
```

**Y agregar junto a ese campo:**
```typescript
estatus: 'pendiente',
semaforo_compra: 'sin_actividad'
```

**4B — Migración SQL — verificar y corregir el DEFAULT**

**BUSCAR en `backend/migrations/` el archivo que crea la tabla `bodegas`.**

**BUSCAR el campo `semaforo_compra`:**
```sql
semaforo_compra VARCHAR(20)
```

**REEMPLAZAR CON:**
```sql
semaforo_compra VARCHAR(20) DEFAULT 'sin_actividad'
```

**4C — Actualizar bodegas existentes en BD**

**AGREGAR archivo de migración nuevo: `backend/migrations/migrate_v19_semaforo_default.sql`:**
```sql
-- Migración v19 — Corregir semáforo default en bodegas existentes
-- Actualizar bodegas que tienen semaforo_compra NULL o 'verde'/'comprando'
-- a 'sin_actividad' para reflejar estado real inicial

UPDATE bodegas 
SET semaforo_compra = 'sin_actividad'
WHERE semaforo_compra IS NULL 
   OR semaforo_compra = 'verde'
   OR semaforo_compra = 'comprando';

-- Agregar DEFAULT a la columna
ALTER TABLE bodegas 
  ALTER COLUMN semaforo_compra SET DEFAULT 'sin_actividad';
```

**VERIFICAR:** Crear una bodega nueva → en BD debe tener `semaforo_compra = 'sin_actividad'`. En el mapa del productor las bodegas deben aparecer en gris/rojo, no en verde.

---

## CORRECCIÓN #5
### POSTGIS_ENABLED — variable de entorno faltante
**TIPO:** 🤖 Agente + 👨‍💻 Programador
**URGENCIA:** 🔴 Lanzamiento

> ⚠️ Esta corrección tiene DOS partes. Ambas son necesarias.
> Si solo se hace la parte del agente pero no la del programador,
> los polígonos siguen sin guardarse en producción.

**PARTE A — 🤖 AGENTE — agregar al `.env.example`**

**ARCHIVO:** `backend/.env.example`

**AGREGAR al final del archivo:**
```env
# ─── POSTGIS ─────────────────────────────────────────────────────
# Activar para guardar polígonos de parcelas como geometría real
# Requiere extensión PostGIS instalada en PostgreSQL
# Si no está activo, solo se guarda el centroide como punto simple
POSTGIS_ENABLED=true
```

**PARTE B — 👨‍💻 PROGRAMADOR — acción manual en el servidor**

Conectarse al servidor por SSH y ejecutar:

```bash
# 1. Verificar si POSTGIS_ENABLED ya está en el .env real
grep POSTGIS_ENABLED /ruta/proyecto/backend/.env

# 2. Si no aparece, agregar la línea:
echo "POSTGIS_ENABLED=true" >> /ruta/proyecto/backend/.env

# 3. Verificar que PostGIS está instalado en PostgreSQL:
psql -U postgres -c "SELECT PostGIS_version();"
# Resultado esperado: versión de PostGIS instalada

# 4. Si PostGIS no está instalado:
# En Ubuntu/Debian:
sudo apt-get install postgresql-15-postgis-3
# Luego activar en la BD:
psql -U postgres -d bodegas -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 5. Reiniciar el servidor:
pm2 restart simac-backend
```

**VERIFICAR:** Registrar un nuevo productor dibujando el polígono → en BD ejecutar:
```sql
SELECT ST_AsText(centroid), ST_AsText(geom) 
FROM up 
ORDER BY created_at DESC LIMIT 1;
-- centroid debe tener coordenadas reales, no NULL
-- geom debe tener el polígono, no NULL
```

---

## CORRECCIÓN #6
### Aviso en dashboard cuando el productor no tiene ubicación
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVO:** `app-bodega/src/pages/productor/DashboardProductorPage.tsx`

**PROBLEMA:** Si el centroide del productor es null en BD, el mapa de bodegas cercanas usa coordenadas ficticias del centro de México sin avisar al usuario.

**AGREGAR después de cargar los datos del dashboard:**
```typescript
// Detectar si el productor no tiene ubicación confirmada
const sinUbicacion = !dashboardData?.lat || !dashboardData?.location_confirmed;
```

**AGREGAR banner de aviso en el JSX, como primer elemento visible después del header:**
```typescript
{sinUbicacion && (
  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-6 flex items-start gap-4">
    <span className="text-2xl mt-0.5">📍</span>
    <div className="flex-1">
      <p className="font-semibold text-amber-800">
        Tu parcela no tiene ubicación confirmada
      </p>
      <p className="text-amber-700 text-sm mt-1">
        Sin ubicación no podemos mostrarte las bodegas más cercanas 
        ni calcular distancias reales. Actualiza tu UP para acceder 
        a toda la información del mercado.
      </p>
      <button
        onClick={() => navigate('/productor/ciclo')}
        className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
      >
        Actualizar mi parcela →
      </button>
    </div>
  </div>
)}
```

**VERIFICAR:** Productor con centroide null en BD → dashboard muestra el banner amarillo con botón. Productor con centroide real → banner no aparece.

---

## CORRECCIÓN #7
### Botón para agregar segundo ciclo productivo
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVO:** `app-bodega/src/pages/productor/CicloProductivoPage.tsx`

**PROBLEMA:** La página es un formulario fijo de 4 pasos. No detecta ciclos existentes ni muestra botón para agregar uno adicional. La decisión de diseño confirmada es que SÍ se pueden tener múltiples ciclos activos.

**AGREGAR estado para ciclos existentes:**
```typescript
const [ciclosExistentes, setCiclosExistentes] = useState<any[]>([]);
const [mostrarFormulario, setMostrarFormulario] = useState(false);
const [cargandoCiclos, setCargandoCiclos] = useState(true);
```

**AGREGAR fetch de ciclos al montar el componente:**
```typescript
useEffect(() => {
  fetch(`${BASE}/ups/${upId}/cycles`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      setCiclosExistentes(Array.isArray(data) ? data : data.cycles || []);
      // Si no hay ciclos, mostrar formulario directamente
      if (!data || data.length === 0) setMostrarFormulario(true);
    })
    .catch(() => setMostrarFormulario(true))
    .finally(() => setCargandoCiclos(false));
}, [upId]);
```

**AGREGAR vista de ciclos existentes + botón agregar, antes del formulario:**
```typescript
{!cargandoCiclos && ciclosExistentes.length > 0 && (
  <div className="mb-6">
    {/* Lista de ciclos existentes */}
    <h3 className="text-base font-semibold text-gray-800 mb-3">
      Ciclos registrados
    </h3>
    <div className="space-y-3 mb-4">
      {ciclosExistentes.map(ciclo => (
        <div
          key={ciclo.id}
          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-gray-800">
              {ciclo.cycle_type} {ciclo.cycle_year}
            </p>
            <p className="text-sm text-gray-500">
              {ciclo.variedad || 'Sin variedad'} · {ciclo.superficie_ha || '—'} ha
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            ciclo.estado_ciclo === 'activo'
              ? 'bg-green-100 text-green-700'
              : ciclo.estado_ciclo === 'cosechado'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {ciclo.estado_ciclo || 'activo'}
          </span>
        </div>
      ))}
    </div>

    {/* Botón para agregar nuevo ciclo */}
    {!mostrarFormulario && (
      <button
        onClick={() => setMostrarFormulario(true)}
        className="w-full py-3 border-2 border-dashed border-[#1A5C38] text-[#1A5C38] rounded-xl font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span>
        Agregar otro ciclo productivo
      </button>
    )}
  </div>
)}

{/* Formulario de nuevo ciclo — solo visible cuando se activa */}
{mostrarFormulario && (
  <div>
    {ciclosExistentes.length > 0 && (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">
          Nuevo ciclo
        </h3>
        <button
          onClick={() => setMostrarFormulario(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    )}
    {/* Aquí va el formulario existente de 4 pasos — no modificar */}
  </div>
)}
```

**VERIFICAR:** Productor con un ciclo activo → ve la lista con ese ciclo + botón "Agregar otro ciclo productivo" → al tocar el botón aparece el formulario de 4 pasos → al completarlo aparece en la lista. Backend ya valida que no haya dos ciclos del mismo tipo y año.

---

## CORRECCIÓN #8
### DetalleBodegaPage — agregar servicios y stock
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVO:** `app-bodega/src/pages/productor/DetalleBodegaPage.tsx`

**PROBLEMA:** Solo muestra nombre, ubicación, capacidad y teléfono. No hace fetch al tarifario ni al inventario. El productor no puede ver qué servicios ofrece la bodega ni si tiene stock disponible.

**AGREGAR estados:**
```typescript
const [tarifario, setTarifario] = useState<any[]>([]);
const [stockActual, setStockActual] = useState<number | null>(null);
const [cargandoServicios, setCargandoServicios] = useState(true);
```

**AGREGAR fetches al cargar la bodega:**
```typescript
useEffect(() => {
  if (!bodegaId) return;

  // Fetch tarifario de servicios
  fetch(`${BASE}/bodegas/${bodegaId}/tarifario-publico`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setTarifario(Array.isArray(data) ? data : data.servicios || []))
    .catch(() => setTarifario([]))
    .finally(() => setCargandoServicios(false));

  // Fetch stock actual
  fetch(`${BASE}/bodegas/${bodegaId}/stock-actual`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setStockActual(data.volumen_ton ?? null))
    .catch(() => setStockActual(null));
}, [bodegaId]);
```

**AGREGAR sección de servicios y stock en el JSX:**
```typescript
{/* Stock disponible */}
<div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
  <h3 className="text-base font-semibold text-gray-800 mb-3">
    📦 Stock actual
  </h3>
  {stockActual !== null ? (
    <p className="text-3xl font-bold text-[#1A5C38]">
      {stockActual.toLocaleString('es-MX')}
      <span className="text-base font-normal text-gray-500 ml-2">toneladas</span>
    </p>
  ) : (
    <p className="text-gray-400 text-sm">
      Sin información de stock disponible aún
    </p>
  )}
</div>

{/* Servicios y tarifario */}
<div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
  <h3 className="text-base font-semibold text-gray-800 mb-3">
    🔧 Servicios de la bodega
  </h3>
  {cargandoServicios ? (
    <div className="space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  ) : tarifario.length > 0 ? (
    <div className="divide-y divide-gray-100">
      {tarifario.map((servicio, i) => (
        <div key={i} className="flex items-center justify-between py-3">
          <p className="text-gray-700">{servicio.concepto || servicio.nombre}</p>
          <p className="font-semibold text-[#1A5C38]">
            ${servicio.precio?.toLocaleString('es-MX')} MXN
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-400 text-sm">
      Esta bodega aún no ha publicado su tarifario de servicios
    </p>
  )}
</div>
```

**ENDPOINT REQUERIDO — agregar en `backend/src/routes/bodegas.ts`:**
```typescript
// GET /api/bodegas/:id/tarifario-publico — visible para productores
router.get('/:id/tarifario-publico', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.concepto, ts.precio, ts.unidad
      FROM tarifario_servicios ts
      WHERE ts.bodega_id = $1
        AND ts.activo = true
        AND ts.updated_at >= NOW() - INTERVAL '90 days'
      ORDER BY ts.concepto ASC
    `, [req.params.id]);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener tarifario' });
  }
});

// GET /api/bodegas/:id/stock-actual — visible para productores
router.get('/:id/stock-actual', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(i.volumen_ton), 0) AS volumen_ton
      FROM inventarios i
      WHERE i.bodega_id = $1
        AND i.created_at = (
          SELECT MAX(created_at) FROM inventarios WHERE bodega_id = $1
        )
    `, [req.params.id]);
    return res.json({ volumen_ton: parseFloat(result.rows[0]?.volumen_ton || '0') });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener stock' });
  }
});
```

**VERIFICAR:** Abrir detalle de una bodega como productor → debe ver sección "Stock actual" y sección "Servicios de la bodega". Si la bodega no tiene tarifario → mensaje "aún no ha publicado su tarifario". Si no tiene stock → mensaje "Sin información de stock disponible aún". Cuando la bodega llene su información → aparece automáticamente.

---

## 🟡 CORRECCIONES ANTES DEL PILOTO

---

## CORRECCIÓN #9
### JOIN incorrecto — notificaciones no llegan a productores Tipo A
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `backend/src/routes/transacciones.ts`
**LÍNEA:** 113

**CÓDIGO ACTUAL:**
```typescript
SELECT u.id FROM usuarios u 
JOIN producer p ON p.email = u.email 
WHERE p.producer_id = $1
```

**CÓDIGO CORRECTO:**
```typescript
SELECT u.id FROM usuarios u 
JOIN producer p ON p.usuario_id = u.id 
WHERE p.producer_id = $1
```

**VERIFICAR:** Registrar transacción con productor Tipo A → notificación aparece en su campana.

---

## CORRECCIÓN #10
### PreciosAdmin — estado inicial sin valores ficticios
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `app-bodega/src/pages/admin/PreciosAdminPage.tsx`
**LÍNEAS:** 58-65

**BUSCAR el estado inicial con valores hardcodeados:**
```typescript
const [preciosData, setPreciosData] = useState<PreciosData>({
  po: 4680,
  s: 980,
  // ... otros valores numéricos
});
```

**REEMPLAZAR CON:**
```typescript
const [preciosData, setPreciosData] = useState<PreciosData | null>(null);
const [preciosError, setPreciosError] = useState<string | null>(null);
```

**AGREGAR guard en el render:**
```typescript
if (!preciosData) {
  return (
    <div className="p-6">
      {preciosError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error al cargar precios</p>
          <p className="text-red-600 text-sm mt-1">{preciosError}</p>
          <button
            onClick={cargarPrecios}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
}
```

**VERIFICAR:** Desconectar backend → pantalla de Precios Admin muestra skeleton o error, nunca números ficticios.

---

## CORRECCIÓN #11
### Fallbacks Chicago y Banxico — error explícito en lugar de valores ficticios
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `backend/src/services/preciosExternos.ts`

**11A — Chicago CME — eliminar fallback hardcodeado**

**BUSCAR:**
```typescript
console.log('Sin fallback en BD para Chicago. Usando por defecto 6.28');
return 6.28;
```

**REEMPLAZAR CON:**
```typescript
console.error('[PRECIOS] Sin datos de Chicago CME — ni API ni BD disponibles');
throw new Error(
  'No hay datos de Chicago CME disponibles. ' +
  'Verifica la conexión a Yahoo Finance o ingresa el valor manualmente desde el panel de Precios.'
);
```

**11B — Banxico TC — eliminar fallback hardcodeado**

**BUSCAR:**
```typescript
console.log('Sin fallback en BD para TC. Usando por defecto 17.42');
return 17.42;
```

**REEMPLAZAR CON:**
```typescript
console.error('[PRECIOS] Sin tipo de cambio disponible — ni Banxico ni Yahoo Finance ni BD');
throw new Error(
  'No hay datos de tipo de cambio disponibles. ' +
  'Verifica BANXICO_TOKEN en .env o la conexión a Yahoo Finance.'
);
```

**11C — Manejar el error en el cron y en el endpoint**

**ARCHIVO:** `backend/src/jobs/preciosCron.ts`

**BUSCAR:**
```typescript
} catch (err) {
  console.error('[CRON] Error al actualizar precios en cron diario:', err);
}
```

**REEMPLAZAR CON:**
```typescript
} catch (err: any) {
  console.error('[CRON] Error al actualizar precios en cron diario:', err.message);
  // Notificar al Admin mediante inserción en tabla de alertas
  try {
    await pool.query(`
      INSERT INTO alertas (tipo, mensaje, severidad, created_at)
      VALUES ('sistema', $1, 'ALTA', NOW())
    `, [`Error en actualización de precios: ${err.message}`]);
  } catch (_) { /* ignore si alertas falla */ }
}
```

**VERIFICAR:** Desactivar BANXICO_TOKEN y bloquear acceso a Yahoo Finance → el cron debe registrar error en logs y en tabla de alertas, sin guardar valores ficticios en BD.

---

## CORRECCIÓN #12
### Bono $50 USD — consolidar en constante única
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `backend/src/routes/precios-sistema.ts`

**PROBLEMA:** `BONO_MAIZ_USD = 50` aparece hardcodeado 4 veces en el mismo archivo.

**BUSCAR las 4 ocurrencias:**
```typescript
const BONO_MAIZ_USD = 50;
```

**ACCIÓN:** Eliminar las 4 declaraciones locales y agregar UNA SOLA declaración al inicio del archivo, después de los imports:

```typescript
// ─── CONSTANTES DEL PROGRAMA ─────────────────────────────────────
// Bono maíz blanco — Plan Nacional Maíz 2026
// Para modificar: cambiar este valor y reiniciar el servidor
const BONO_MAIZ_USD = 50;
```

**VERIFICAR:**
```bash
grep -n "BONO_MAIZ_USD" backend/src/routes/precios-sistema.ts
# Resultado esperado: 1 declaración (const) + N usos de la variable
# NO debe haber más de 1 línea con "const BONO_MAIZ_USD"
```

---

## CORRECCIÓN #13
### Confirmación visible cuando productor toca "Me interesa"
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx`

**PROBLEMA:** `handleMeInteresa` llama al endpoint y muestra un `alert()` nativo del navegador. En móvil esto se ve mal y no es consistente con el diseño de la app.

**AGREGAR estado de confirmación:**
```typescript
const [confirmacionVisible, setConfirmacionVisible] = useState(false);
const [bodegaConfirmada, setBodegaConfirmada] = useState<string>('');
```

**BUSCAR el `alert()` en `handleMeInteresa`:**
```typescript
alert('¡Interés registrado!');
// o cualquier variante de alert()
```

**REEMPLAZAR CON:**
```typescript
setBodegaConfirmada(nombreBodega || 'la bodega');
setConfirmacionVisible(true);
setTimeout(() => setConfirmacionVisible(false), 4000);
```

**AGREGAR toast de confirmación en el JSX:**
```typescript
{confirmacionVisible && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50
                  bg-[#1A5C38] text-white px-6 py-4 rounded-2xl shadow-2xl
                  flex items-center gap-3 animate-fade-in max-w-xs w-full mx-4">
    <span className="text-2xl">✅</span>
    <div>
      <p className="font-semibold text-sm">¡Interés registrado!</p>
      <p className="text-green-200 text-xs mt-0.5">
        {bodegaConfirmada} recibirá tu solicitud
      </p>
    </div>
  </div>
)}
```

**VERIFICAR:** Tocar "Me interesa" en una señal de compra → toast verde aparece en la parte inferior con el nombre de la bodega → desaparece automáticamente en 4 segundos. Sin `alert()` nativo.

---

## ACCIONES MANUALES DEL PROGRAMADOR
### Resumen de todo lo que NO puede hacer el agente

> Estas acciones las ejecuta el programador directamente en el servidor.
> El agente no tiene acceso SSH ni puede modificar el .env de producción.

```
□ 1. POSTGIS_ENABLED en servidor
     ssh al servidor → agregar POSTGIS_ENABLED=true al .env real
     Comando: echo "POSTGIS_ENABLED=true" >> /ruta/proyecto/backend/.env

□ 2. Verificar PostGIS instalado en PostgreSQL
     psql -U postgres -c "SELECT PostGIS_version();"
     Si no está: sudo apt-get install postgresql-15-postgis-3
     Activar: psql -U postgres -d bodegas -c "CREATE EXTENSION IF NOT EXISTS postgis;"

□ 3. Ejecutar migración v19 en BD de producción
     psql -U jesus -d bodegas -f backend/migrations/migrate_v19_semaforo_default.sql

□ 4. Reiniciar el servidor después de los cambios
     pm2 restart simac-backend

□ 5. Verificar BANXICO_TOKEN en .env real
     grep BANXICO_TOKEN /ruta/proyecto/backend/.env
     Debe ser el token real de 64 caracteres sin espacios

□ 6. Avisar a productores ya registrados
     Contactar por WhatsApp o teléfono a los productores del piloto
     que dibujaron su parcela y pedirles que actualicen su UP
     (el banner en el dashboard los guiará automáticamente)
```

---

## CHECKLIST FINAL ANTES DE LANZAR

```bash
# Frontend — sin SOMEC
grep -r "SOMEC" app-bodega/src/
# Esperado: sin resultados ✅

# Semáforo default
psql -c "SELECT COUNT(*) FROM bodegas WHERE semaforo_compra = 'comprando';"
# Esperado: 0 ✅

# POSTGIS activo
psql -c "SELECT PostGIS_version();"
# Esperado: versión instalada ✅

# Centroide de productor nuevo
# Registrar productor de prueba con polígono → verificar:
psql -c "SELECT ST_AsText(centroid) FROM up ORDER BY created_at DESC LIMIT 1;"
# Esperado: coordenadas reales, no NULL ✅

# Modal de registro
# Completar registro de prueba → modal aparece con botón ✅

# Flujo "Soy Productor" → registro directo ✅
# Link "¿Ya tienes cuenta?" visible ✅
# Segundo ciclo — botón agregar visible ✅
# DetalleBodegaPage — secciones stock y servicios visibles ✅
```

---

*SIMAC Plan Nacional Maíz 2026 · Correcciones Finales — Lanzamiento + Piloto*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
