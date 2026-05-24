# SIMAC — Correcciones Finales v5
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Base:** Auditoría Claude Code + revisión visual de imágenes

> Este documento consolida TODAS las correcciones pendientes. Resolver en el orden en que aparecen — las primeras son las más urgentes.

---

## RESUMEN DE PENDIENTES

| ID | Problema | Módulo | Urgencia |
|---|---|---|---|
| C-01 | Notificaciones — campana muerta, sin pantalla, sin contador | Global | 🔴 Crítica — bloquea piloto |
| C-02 | KPI 1 — precio es "último propio" no promedio real de mercado | Tablero | 🔴 Crítica |
| C-03 | "BODEGUERO PRUEBA" visible en el tablero | Tablero | 🔴 Crítica |
| C-04 | Variedades de maíz — 3 capas de bugs en BD y frontend | Global | 🔴 Crítica |
| C-05 | Formulario de inventario — sin instrucción clara de qué registrar | Inventario | 🟡 Media |
| C-06 | Separador de miles: punto → coma en toda la app | Global | 🟡 Media |
| C-07 | Formulario de alta de bodega nueva — no existe en UI | B-03 Bodegas | 🟡 Media |
| C-08 | Filtro por municipio falta en B-03 búsqueda de bodegas | B-03 Bodegas | 🟡 Media |
| C-09 | Módulo precios — nombres incorrectos + falta despiece visual | B-22 Precios | 🟡 Media |
| C-10 | Módulo ventanillas — sin invitación clara a configurar | Ventanillas | 🟢 Baja |
| C-11 | Dashboard sin bodega — falta mensaje de onboarding | Tablero | 🟢 Baja |
| C-12 | Alerta de 30 días sin actualizar tarifario — no implementada | Tarifario | 🟢 Baja |

---

## CORRECCIONES DETALLADAS

---

### C-01 🔴 CRÍTICO — Notificaciones: campana muerta, sin pantalla, sin contador

**Por qué bloquea el piloto:**
```
El sistema SÍ genera notificaciones en la BD 
correctamente desde señales de compra, 
transacciones, ventanillas y oferta.

Pero NADIE las ve porque:
- La campana en Layout.tsx tiene action: () => {}
  (callback vacío — no hace nada al tocarla)
- No existe pantalla de notificaciones
- No hay badge con contador de no leídas
- Todo el ciclo bodega ↔ productor depende de esto
```

**Corrección en 3 pasos:**

**Paso 1 — Conectar el contador en Layout.tsx:**
```typescript
const [noLeidas, setNoLeidas] = useState(0);

useEffect(() => {
  const fetchNotifs = async () => {
    const data = await api.notificaciones.mis();
    setNoLeidas(data.total_no_leidas || 0);
  };
  fetchNotifs();
  const interval = setInterval(fetchNotifs, 60000); // cada 60s
  return () => clearInterval(interval);
}, []);

// Badge en el ícono de campana:
<div className="relative">
  <BellIcon className="w-6 h-6" />
  {noLeidas > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white 
                     text-xs rounded-full w-4 h-4 flex items-center 
                     justify-center font-bold">
      {noLeidas > 9 ? '9+' : noLeidas}
    </span>
  )}
</div>

// Cambiar action: () => {} por:
action: () => navigate('/notificaciones')
```

**Paso 2 — Crear pantalla `/notificaciones`:**
```typescript
// NotificacionesPage.tsx
// GET /api/alertas/notificaciones/mis

// Por cada notificación mostrar:
// - Ícono según tipo (🔔 señal, ✅ transacción, 🏛️ ventanilla, 📢 oferta)
// - Título y mensaje
// - Fecha/hora: "Hace 2 horas" o "Ayer a las 3:00 pm"
// - Badge "Nueva" si leida = false
// - Al tocar: PATCH /api/alertas/notificaciones/:id/leer
//             + navegar a la pantalla correspondiente

// Botón "Marcar todas como leídas"
// PATCH /api/alertas/notificaciones/leer-todas

// Estado vacío: "No tienes notificaciones por ahora"
```

**Paso 3 — Navegación por tipo de notificación:**

| Tipo | Pantalla destino |
|---|---|
| `nuevo_requerimiento` | `/requerimientos` |
| `interes_senal` | `/requerimientos` (con id activo) |
| `confirmacion_transaccion` | `/transacciones/:id` |
| `interes_bodega_oferta` | `/oferta` |
| `solicitud_apoyo` | `/ventanillas/:id/solicitudes` |
| `cambio_estado_solicitud` | Estado de solicitud del productor |
| `alerta_tarifario` | `/tarifario` |

**Verificación:**
```sql
SELECT tipo, COUNT(*) as total,
       SUM(CASE WHEN leida = FALSE THEN 1 ELSE 0 END) as no_leidas
FROM notificaciones 
GROUP BY tipo ORDER BY total DESC;
```

---

### C-02 🔴 CRÍTICO — KPI 1: precio debe ser promedio real de mercado regional

**Problema:**
```
La query actual hace MAX(pr.precio) sobre los 
precios publicados por las PROPIAS bodegas del usuario.
Muestra lo que el mismo bodeguero publicó ayer —
no el promedio del mercado regional.

El label dice "Precio promedio de maíz al productor hoy"
pero el dato es incorrecto.
```

**Corrección en backend — `home.ts`:**
```typescript
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
`, [usuario_id]);

// Agregar al response:
// precio_promedio_regional: number
// bodegas_en_calculo: number
```

**Corrección en frontend — `B04Dashboard.tsx`:**
```typescript
// Valor: precio_promedio_regional (no ultimo_precio)
// Subtexto: "MXN/ton · promedio de tu región · X bodegas"

// Indicador comparativo:
// precio propio > promedio → "↑ $X por encima del promedio" (verde)
// precio propio < promedio → "↓ $X por debajo del promedio" (rojo)
// sin precio propio hoy   → "Sin precio publicado hoy" (gris)
// menos de 3 bodegas      → "Sin suficientes datos regionales hoy"
```

---

### C-03 🔴 CRÍTICO — "BODEGUERO PRUEBA" visible en el tablero

**Problema:**
```
El tablero muestra "BODEGUERO PRUEBA" debajo del saludo.
1. Dice "BODEGUERO" en lugar de "BODEGA"
2. Es texto de prueba que no debe aparecer en producción
```

**Corrección en `B04Dashboard.tsx` y `Layout.tsx`:**
```typescript
// ❌ COMO ESTÁ:
<p>BODEGUERO PRUEBA</p>

// ✅ COMO DEBE QUEDAR:
<p>{usuario.nombre_completo || usuario.email}</p>

// Badge de rol:
<span>Bodega</span>  // ← no "Bodeguero"
```

**Búsqueda global en el repo:**
```bash
grep -ri "bodeguero" src/ --include="*.tsx" --include="*.vue"
# Reemplazar TODOS los casos visibles al usuario por "bodega"
# EXCEPCIÓN: nombres de funciones internas y rutas de API
# que no son visibles al usuario pueden mantenerse
```

---

### C-04 🔴 CRÍTICO — Variedades de maíz: 3 capas de bugs en BD y frontend

**Diagnóstico completo del problema:**

El bug tiene 3 capas que deben corregirse juntas:

```
CAPA 1 — Base de datos: 2 archivos SQL se pisan entre sí
CAPA 2 — Frontend: filtro de criollo hardcodeado con codes viejos
CAPA 3 — Archivo fantasma con tipos de maíz obsoletos
```

---

#### CAPA 1 — Base de datos: conflict entre migraciones

**El problema:**
```
Hay 3 archivos SQL que tocan cat_crop_variety en este orden:

1. add_tipo_maiz_variety.sql
   → Sembró variedades INCORRECTAS (8 de blanco, amarillo mal)

2. add_vigencia_inicio_senales.sql
   → Repite las mismas variedades incorrectas con ON CONFLICT DO UPDATE
   → Si se aplica DESPUÉS de v11, REVIERTE las correcciones correctas
   → Este archivo NO debería tocar cat_crop_variety

3. migrate_v11_variedades_correctas.sql
   → Corrige todo correctamente (DELETE → INSERT)
   → PERO si add_vigencia_inicio_senales.sql se aplica después, 
     el amarillo vuelve a quedar mal
```

**Estado actual de la BD (después de v11):**

| Tipo | En BD | Correcto |
|---|---|---|
| Blanco | H-40 a H-564C + Otra — 14 variedades | ✅ |
| Amarillo | H-384A, H-385, V-53A, V-55A, Búho, Criollo Amarillo, Otra | ✅ si v11 fue el último |
| Criollo | `MC_CRIOLLO` "Criollo Local", `MC_NOSABE` "No sabe" | ⚠️ codes cambiados |
| NULL | `NO_SABE` "No sabe / Sin especificar" — sobrevivió | ⚠️ duplicado |

**Corrección 1A — Limpiar `add_vigencia_inicio_senales.sql`:**
```sql
-- ELIMINAR de ese archivo TODAS las líneas que tocan cat_crop_variety.
-- Ese archivo solo debe alterar senales_compra.
-- Las variedades son responsabilidad exclusiva de migrate_v11.
-- Si se vuelve a aplicar add_vigencia_inicio_senales.sql en el futuro,
-- NO debe tocar cat_crop_variety.
```

**Corrección 1B — Verificar y garantizar el estado correcto de la BD:**
```sql
-- EJECUTAR ESTA VERIFICACIÓN para saber el estado actual:
SELECT tipo_maiz, COUNT(*) as total,
       string_agg(code, ', ' ORDER BY sort_order) as variedades
FROM cat_crop_variety
GROUP BY tipo_maiz ORDER BY tipo_maiz;

-- Resultado ESPERADO:
-- amarillo → 7 variedades (H-384A, H-385, V-53A, V-55A, Búho, Criollo Amarillo, Otra)
-- blanco   → 14 variedades (H-40, H-48, H-50, H-52, H-59, H-66, H-70, H-77, H-383, VS-22, VS-23, H-520, H-564C, Otra)
-- criollo  → 2 variedades (MC_CRIOLLO, MC_NOSABE)
-- NULL     → 1 (NO_SABE — sobreviviente)

-- Si el amarillo sigue mal (H-40 Amarillo, H-59C, DK 2020),
-- significa que add_vigencia_inicio_senales.sql se aplicó después de v11.
-- En ese caso ejecutar manualmente:

DELETE FROM cat_crop_variety WHERE tipo_maiz = 'amarillo';
INSERT INTO cat_crop_variety (code, label, tipo_maiz, sort_order) VALUES
  ('H-384A',           'H-384A',           'amarillo', 1),
  ('H-385',            'H-385',            'amarillo', 2),
  ('V-53A',            'V-53A',            'amarillo', 3),
  ('V-55A',            'V-55A',            'amarillo', 4),
  ('BUHO',             'Búho',             'amarillo', 5),
  ('CRIOLLO_AMARILLO', 'Criollo Amarillo', 'amarillo', 6),
  ('OTRA_A',           'Otra',             'amarillo', 7);

-- Eliminar el duplicado NULL si existe:
DELETE FROM cat_crop_variety WHERE tipo_maiz IS NULL AND code = 'NO_SABE';
```

---

#### CAPA 2 — Frontend: filtro de criollo hardcodeado con codes viejos

**El problema:**
```
La migración v11 cambió los codes de criollo:
  CRIOLLO_LOCAL → MC_CRIOLLO
  NO_SABE       → MC_NOSABE

Pero el frontend sigue buscando los codes VIEJOS.
Resultado: cuando el usuario selecciona "Criollo / Local",
el dropdown de variedad aparece vacío o solo muestra 
"No sabe / Sin especificar" (el sobreviviente con tipo_maiz NULL).
```

**Archivos afectados: `B07Inventario.tsx`, `B10Requerimiento.tsx`, `B13Transaccion.tsx`**

En los 3 archivos, líneas ~52, ~72 y ~80 respectivamente:

```typescript
// ❌ COMO ESTÁ (busca codes viejos que ya no existen):
const filteredVars = form.tipo_maiz === 'criollo'
  ? variedades.filter(v => ['CRIOLLO_LOCAL', 'NO_SABE'].includes(v.code))
  : variedades.filter(v => !v.tipo_maiz || v.tipo_maiz === form.tipo_maiz)

// ✅ COMO DEBE QUEDAR (incluye codes nuevos Y viejos por compatibilidad):
const filteredVars = form.tipo_maiz === 'criollo'
  ? variedades.filter(v => 
      ['MC_CRIOLLO', 'MC_NOSABE', 'CRIOLLO_LOCAL', 'NO_SABE'].includes(v.code)
      || v.tipo_maiz === 'criollo'
    )
  : variedades.filter(v => !v.tipo_maiz || v.tipo_maiz === form.tipo_maiz)
```

> 💡 Se incluyen tanto los codes nuevos (`MC_CRIOLLO`, `MC_NOSABE`) como los viejos (`CRIOLLO_LOCAL`, `NO_SABE`) para que funcione sin importar cuál migración quedó aplicada en cada ambiente.

---

#### CAPA 3 — Archivo fantasma con tipos obsoletos

**El problema:**
```
Existe app-bodega/src/pages/B10SenalCompra.tsx
que ya NO está en el router (código muerto)
pero tiene 5 tipos de maíz incorrectos:
forrajero, palomero, morado, blanco, amarillo.

No afecta al usuario pero confunde al leer el código.
```

**Corrección:**
```bash
# Eliminar el archivo completo:
rm app-bodega/src/pages/B10SenalCompra.tsx

# Verificar que no está referenciado en el router:
grep -r "B10SenalCompra" src/
# Debe devolver 0 resultados
```

---

#### Verificación final de variedades:
```sql
-- Confirmar que los desplegables tienen las opciones correctas:
SELECT tipo_maiz, code, label, sort_order
FROM cat_crop_variety
ORDER BY tipo_maiz, sort_order;

-- Debe mostrar exactamente:
-- blanco:   14 filas (H-40 hasta Otra)
-- amarillo:  7 filas (H-384A hasta Otra)
-- criollo:   2 filas (MC_CRIOLLO, MC_NOSABE)
-- Sin filas con tipo_maiz NULL
```

---

### C-05 🟡 MEDIO — Formulario de inventario: sin instrucción clara de qué registrar

**Problema:**
```
El formulario no explica si el bodeguero debe 
escribir lo que llegó hoy o el total que tiene.

Regla del negocio: el número es el TOTAL ACTUAL 
en bodega — no una entrada del día.
```

**Corrección en `B07Inventario.tsx` — agregar antes del campo de volumen:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
  <p className="text-sm font-semibold text-green-800 mb-1">
    📦 ¿Qué número debo escribir?
  </p>
  <p className="text-sm text-green-700 leading-relaxed">
    Escribe el <strong>total de toneladas que tienes almacenadas 
    en este momento</strong> en la bodega — no solo lo que llegó hoy.
  </p>
  <p className="text-sm text-green-600 mt-2">
    Ejemplo: Si tenías 800 ton y llegaron 200 ton más hoy, 
    escribe <strong>1,000</strong> (el total actual).
  </p>
</div>

// Cambiar el label del campo:
// ❌ "Volumen almacenado (ton)"   ← ambiguo
// ✅ "Stock actual total (ton)"   ← claro

// Cambiar el placeholder:
// ❌ "500"
// ✅ "Ej: 1,500"

// Agregar texto de ayuda debajo del campo:
<p className="text-xs text-gray-400 mt-1">
  Este número reemplaza el registro anterior y representa 
  el total que hay en tu bodega ahora mismo.
</p>
```

---

### C-06 🟡 MEDIO — Separador de miles: cambiar punto por coma en toda la app

**Problema:**
```
Los números se muestran con punto como separador 
de miles en lugar de coma:
"15.000 ton" → debe ser "15,000 ton"
"52.026 ton" → debe ser "52,026 ton"
```

**Corrección — crear archivo de utilidades y aplicar globalmente:**

```typescript
// src/utils/format.ts — CREAR este archivo

export const formatNum = (
  value: number | string | null | undefined, 
  decimals = 1
): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatPrecio = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined) return '$0';
  return `$${formatNum(value, 2)}`;
};

export const formatTon = (
  value: number | string | null | undefined
): string => {
  return `${formatNum(value, 1)} ton`;
};
```

**Aplicar en estos componentes — reemplazar `.toLocaleString()` sin parámetros:**

```typescript
import { formatTon, formatPrecio, formatNum } from '@/utils/format';

// ❌ COMO ESTÁ:
`${Number(valor).toLocaleString()} ton`
`$${precio}`

// ✅ COMO DEBE QUEDAR:
formatTon(valor)
formatPrecio(precio)
```

**Componentes donde aplicar:**
- `B04Dashboard.tsx` — KPIs de ocupación, stock, precio
- `B05MisBodegas.tsx` — tarjetas de cada bodega
- `B06BodegaDetalle.tsx` — capacidad
- `B07Inventario.tsx` — historial y último registro
- `B09PrecioCompra.tsx` — precio e historial
- `B14HistorialTransacciones.tsx` — volúmenes y precios
- `B22PreciosMercado.tsx` — todos los valores

---

### C-07 🟡 MEDIO — Formulario de alta de bodega nueva no existe en UI

**Problema:**
```
B03 solo muestra: "Contacta al administrador 
para que registre tu bodega en el catálogo"

Debe existir un formulario que el usuario llene
y quede en estado "pendiente" hasta que el admin apruebe.
```

**Corrección — agregar en `B03SelectBodegas.tsx`:**

```tsx
// Al final de la lista de resultados de búsqueda:
<div className="border-t pt-4 mt-4">
  <p className="text-sm text-gray-500 mb-3">
    ¿No encontraste tu bodega en el catálogo?
  </p>
  <button
    onClick={() => setMostrarFormularioAlta(true)}
    className="w-full border-2 border-dashed border-green-300 
               rounded-lg py-3 px-4 text-green-700 font-medium 
               text-sm hover:bg-green-50 transition-colors"
  >
    + Solicitar alta de bodega nueva
  </button>
</div>
```

**Campos del formulario de alta — todos usan catálogos existentes:**

```typescript
// SolicitudAltaBodega.tsx

// Nombre de la bodega       → text input, obligatorio
// Estado                    → SELECT, GET /api/auth/states, obligatorio
// Municipio                 → SELECT filtrado, 
//                             GET /api/auth/municipalities?state_id=XX, obligatorio
// Localidad                 → text input, opcional
// Capacidad (ton)           → número, obligatorio
//                             label: "Capacidad total de almacenamiento en toneladas"
// Ubicación en mapa         → Leaflet interactivo
//                             "Toca el mapa para marcar la ubicación de tu bodega"
//                             Al tocar: registrar lat/lon automáticamente
// Nombre del responsable    → text input, obligatorio
// Teléfono                  → 10 dígitos, obligatorio
// Correo                    → email, opcional

// Al enviar: POST /api/bodegas con estatus = 'pendiente'

// Mensaje de confirmación:
// "✅ Tu solicitud fue enviada. Te notificaremos cuando 
//  sea aprobada para que puedas comenzar a operar."
```

---

### C-08 🟡 MEDIO — Filtro por municipio falta en búsqueda de bodegas

**Problema:**
```
B03 tiene filtro por texto y por estado.
El backend /api/bodegas SÍ acepta municipio 
como query param — solo falta en el frontend.
```

**Corrección en `B03SelectBodegas.tsx`:**
```tsx
const [municipios, setMunicipios] = useState([]);
const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');

useEffect(() => {
  if (estadoSeleccionado) {
    api.auth.municipalities(estadoSeleccionado).then(setMunicipios);
    setMunicipioSeleccionado('');
  }
}, [estadoSeleccionado]);

// SELECT de municipio (aparece solo si hay estado seleccionado):
{estadoSeleccionado && (
  <select
    value={municipioSeleccionado}
    onChange={e => setMunicipioSeleccionado(e.target.value)}
  >
    <option value="">Todos los municipios</option>
    {municipios.map(m => (
      <option key={m.id} value={m.name}>{m.name}</option>
    ))}
  </select>
)}

// Incluir en el query de búsqueda:
// GET /api/bodegas?estado=XX&municipio=YY&q=texto
```

---

### C-09 🟡 MEDIO — Módulo precios: nombres incorrectos y falta despiece visual

**Problema:**
```
Los 3 tipos de precio tienen nombres distintos 
a los definidos en el sistema:

Actual            → Debe ser
──────────────────────────────────────
precio_bodega     → "Precio del Maíz"
precio_gobierno   → "Precio Internacional / Margen de negociación"
precio_mercado    → "Precio de Venta"

Además falta el despiece visual que explique
de dónde viene cada número.
```

**Corrección 1 — Renombrar en `B22PreciosMercado.tsx`:**
```typescript
// Tarjeta 1 (verde):
titulo: 'Precio del Maíz'
subtitulo: 'Lo que la bodega paga al productor'
fuente: 'Promedio ponderado · últimos 7 días'

// Tarjeta 2 (azul):
titulo: 'Precio Internacional'
subtitulo: 'Referencia Chicago CME + margen de negociación'
fuente: 'Actualización automática diaria'

// Tarjeta 3 (naranja):
titulo: 'Precio de Venta'
subtitulo: 'Precio total de la cadena hasta la harinera'
fuente: 'Calculado por el sistema'
```

**Corrección 2 — Agregar despiece visual:**
```tsx
<div className="bg-gray-50 rounded-xl p-4 mt-4">
  <p className="text-xs font-bold text-gray-500 uppercase mb-3">
    ¿Cómo se construye el Precio de Venta?
  </p>
  <div className="flex items-center gap-2 flex-wrap">
    
    <div className="bg-green-100 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-green-700 font-medium">PO</p>
      <p className="text-sm font-bold text-green-800">{formatPrecio(precio_origen)}</p>
      <p className="text-xs text-green-600">Precio al productor</p>
    </div>
    <span className="text-gray-400 font-bold">+</span>

    <div className="bg-blue-100 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-blue-700 font-medium">S</p>
      <p className="text-sm font-bold text-blue-800">{formatPrecio(servicios_bodega)}</p>
      <p className="text-xs text-blue-600">Servicios bodega</p>
    </div>
    <span className="text-gray-400 font-bold">+</span>

    <div className="bg-purple-100 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-purple-700 font-medium">M</p>
      <p className="text-sm font-bold text-purple-800">{formatPrecio(margen)}</p>
      <p className="text-xs text-purple-600">Margen</p>
    </div>
    <span className="text-gray-400 font-bold">+</span>

    <div className="bg-orange-100 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-orange-700 font-medium">F</p>
      <p className="text-sm font-bold text-orange-800">{formatPrecio(flete)}</p>
      <p className="text-xs text-orange-600">Flete</p>
    </div>
    <span className="text-gray-400 font-bold">=</span>

    <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-gray-300 font-medium">TOTAL</p>
      <p className="text-sm font-bold text-white">{formatPrecio(precio_venta)}</p>
      <p className="text-xs text-gray-300">Precio de Venta</p>
    </div>

  </div>
  <p className="text-xs text-gray-400 mt-3">
    💡 Los precios que capturas diariamente contribuyen a 
    construir estos valores para toda tu región.
  </p>
</div>
```

---

### C-10 🟢 BAJA — Ventanillas: sin invitación clara a configurar

**Corrección en `MasPage.tsx`:**
```tsx
<MenuItemRow
  icon={Building2}
  label="Mis ventanillas"
  sublabel={tieneVentanillas 
    ? `${conteoVentanillas} ventanilla(s) activa(s)`
    : "Toca para configurar una ventanilla de apoyo"
  }
  badge={!tieneVentanillas ? "Configura" : undefined}
  onClick={() => navigate('/ventanillas')}
/>
```

---

### C-11 🟢 BAJA — Dashboard sin bodega: falta mensaje de onboarding

**Corrección en `B04Dashboard.tsx`:**
```tsx
{misBodegas === 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
    <p className="font-semibold text-amber-800 mb-1">
      👋 ¡Bienvenido a SIMAC!
    </p>
    <p className="text-sm text-amber-700 mb-3">
      Para comenzar necesitas asociar las bodegas que operas.
      Sin bodegas no podrás registrar inventarios, precios 
      ni requerimientos de maíz.
    </p>
    <button
      onClick={() => navigate('/bodegas/seleccionar')}
      className="bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
    >
      Asociar mis bodegas →
    </button>
  </div>
)}
```

---

### C-12 🟢 BAJA — Alerta de 30 días sin actualizar tarifario

**Corrección en `bodegaDailyJobs.ts` — agregar como tarea 4:**
```typescript
const tarifasViejas = await pool.query(`
  SELECT DISTINCT ts.bodega_id, bb.usuario_id
  FROM tarifario_servicios ts
  JOIN bodeguero_bodegas bb ON bb.bodega_id = ts.bodega_id
  WHERE ts.activo = TRUE
    AND CURRENT_DATE - ts.updated_at::date > 30
  GROUP BY ts.bodega_id, bb.usuario_id
`);

for (const tarifa of tarifasViejas.rows) {
  const alertaReciente = await pool.query(`
    SELECT id FROM notificaciones
    WHERE usuario_id = $1 AND tipo = 'alerta_tarifario'
      AND created_at > NOW() - INTERVAL '7 days'
    LIMIT 1
  `, [tarifa.usuario_id]);
  
  if (alertaReciente.rows.length === 0) {
    await pool.query(`
      INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida)
      VALUES ($1, $2, $3, 'alerta_tarifario', FALSE)
    `, [
      tarifa.usuario_id,
      'Tu tarifario lleva más de 30 días sin actualizar',
      '⚠️ Actualiza tu tarifario de servicios para seguir ' +
      'apareciendo en el Precio del Maíz de tu región.'
    ]);
  }
}
```

---

## VERIFICACIÓN FINAL

```sql
-- 1. Notificaciones en BD (deben empezar a verse en la app)
SELECT tipo, COUNT(*) as total,
       SUM(CASE WHEN leida = FALSE THEN 1 ELSE 0 END) as no_leidas
FROM notificaciones GROUP BY tipo ORDER BY total DESC;

-- 2. Variedades correctas en BD
SELECT tipo_maiz, COUNT(*) as total,
       string_agg(code, ', ' ORDER BY sort_order) as variedades
FROM cat_crop_variety GROUP BY tipo_maiz ORDER BY tipo_maiz;
-- Esperado: blanco=14, amarillo=7, criollo=2, NULL=0

-- 3. Precio promedio regional tiene datos
SELECT b.estado,
       ROUND(AVG(pr.precio)::numeric, 2) as promedio,
       COUNT(DISTINCT pr.bodega_id) as bodegas
FROM precios pr
JOIN bodegas b ON b.id = pr.bodega_id
WHERE pr.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY b.estado ORDER BY b.estado;

-- 4. Usuarios sin texto de prueba
SELECT nombre_completo, rol FROM usuarios 
WHERE rol = 'bodega' ORDER BY created_at DESC;

-- 5. B10SenalCompra.tsx eliminado
-- Verificar manualmente que no existe en src/pages/
```

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Con estas 12 correcciones el módulo Bodega queda listo para piloto*
