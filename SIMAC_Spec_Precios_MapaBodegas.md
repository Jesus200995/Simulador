# SIMAC — Especificación Técnica: Módulo de Precios y Mapa de Bodegas
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Módulo afectado:** B22 Precios / Mercado + B03 Selección de Bodegas

> Este documento especifica dos modificaciones al módulo Bodega. Implementar en el orden en que aparecen.

---

## MODIFICACIÓN 1 — Redefinición completa del Módulo de Precios (B22)

### Contexto

El módulo de precios ahora maneja **3 tipos de precio** con lógica y visualización específica para cada uno. El desarrollador debe reemplazar la pantalla actual de B22PreciosMercado.tsx con la nueva estructura definida aquí.

---

### Estructura de la pantalla B22 (de arriba hacia abajo)

```
┌─────────────────────────────────────────┐
│  MÓDULO DE PRECIOS                      │
│  Precios del maíz blanco · Hoy          │
├─────────────────────────────────────────┤
│  [1] MARGEN DE NEGOCIACIÓN              │
│  [2] PRECIO DE COMPRA                   │
│  [3] PRECIO DE VENTA                    │
│  [4] PRECIO CEDIS  ← En desarrollo      │
└─────────────────────────────────────────┘
```

---

### PRECIO 1 — Margen de Negociación

**Descripción:**
Precio de referencia internacional calculado a partir del precio de la Bolsa de Chicago (CME Group), convertido a MXN/ton, más un bono fijo de $50 USD/ton por maíz blanco.

**Fórmula exacta:**
```
Margen de Negociación (MXN/ton) =
  ( Precio Chicago (USD/bushel) × 39.368 )  ← conversión bushels a toneladas
  × Tipo de cambio USD/MXN (Banxico)
  + ( $50 USD × Tipo de cambio USD/MXN )    ← Bono Maíz (fijo, no ajustable)
```

**Desglose visual — 4 componentes en tarjetas pequeñas:**

```
┌──────────────────┐  ┌──────────────────┐
│ Precio Chicago   │  │ Conversión       │
│ $4.85 USD/bushel │  │ × 39.368         │
│ CME Group · Hoy  │  │ = $191/USD/ton   │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ Tipo de cambio   │  │ Bono Maíz        │
│ $17.82 MXN/USD   │  │ +$50 USD/ton     │
│ Banxico · Hoy    │  │ = $891 MXN/ton   │
└──────────────────┘  └──────────────────┘

┌─────────────────────────────────────────┐
│  MARGEN DE NEGOCIACIÓN TOTAL            │
│           $4,055 MXN/ton                │  ← número grande
│  Chicago convertido + Bono Maíz         │
└─────────────────────────────────────────┘
```

**Notas para el desarrollador:**

```
Fuente del precio Chicago:
→ Ya existe GET /api/precios/sistema/hoy que devuelve 
  referencias externas incluyendo Chicago CME.
→ Verificar que el endpoint devuelve:
  precio_chicago_usd_bushel: number
  tipo_cambio_mxn: number
→ Si no los devuelve, agregar al endpoint existente.

Conversión bushels → toneladas:
→ Factor fijo: 1 tonelada métrica = 39.368 bushels
→ Precio USD/ton = precio_chicago_usd_bushel × 39.368
→ Precio MXN/ton = Precio USD/ton × tipo_cambio_mxn

Bono Maíz:
→ Valor fijo: $50 USD/ton — NO configurable por el usuario
→ Label en pantalla: "Bono Maíz"
→ En MXN: 50 × tipo_cambio_mxn
→ Este valor NO viene de BD — se hardcodea como constante:
  const BONO_MAIZ_USD = 50;

Frecuencia de actualización:
→ Precio Chicago: actualizar 1 vez por día (7:00 am)
→ Tipo de cambio: actualizar 1 vez por día (7:00 am)
→ Mostrar timestamp: "Actualizado hoy a las 7:00 am"
→ Si no hay datos del día: mostrar datos de ayer 
  con badge "Datos de ayer"
```

---

### PRECIO 2 — Precio de Compra

**Descripción:**
Precio que refleja lo que cuesta el maíz en el proceso de bodega. Se compone de dos partes claramente diferenciadas visualmente: lo que recibe el productor y lo que cobra la bodega por sus servicios.

**Fórmula:**
```
Precio de Compra = PO (Precio Origen) + S (Servicios de Bodega)
```

**Visualización — dos bloques de color diferente:**

```
┌─────────────────────────────────────────┐
│  PRECIO DE COMPRA                       │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ 🌽 LO QUE GANA EL PRODUCTOR      │   │
│  │    color: verde #1A5C38          │   │
│  │                                  │   │
│  │    $4,680 MXN/ton                │   │
│  │    Precio promedio pagado        │   │
│  │    en bodegas · últimos 7 días   │   │
│  └──────────────────────────────────┘   │
│           +                             │
│  ┌──────────────────────────────────┐   │
│  │ 🏪 SERVICIOS DE LA BODEGA        │   │
│  │    color: azul #1B4F8A           │   │
│  │                                  │   │
│  │    $980 MXN/ton                  │   │
│  │    Secado, limpieza,             │   │
│  │    almacenamiento, etc.          │   │
│  └──────────────────────────────────┘   │
│           =                             │
│  ┌──────────────────────────────────┐   │
│  │  PRECIO DE COMPRA TOTAL          │   │
│  │         $5,660 MXN/ton           │   │  ← número grande
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Notas para el desarrollador:**

```
Fuente del dato PO (Precio Origen):
→ Promedio ponderado de transacciones confirmadas 
  de los últimos 7 días
→ Endpoint existente: GET /api/precios/dashboard
  Verificar que devuelve precio_origen o precio_bodega
→ Si no existe el campo: agregar al endpoint

Fuente del dato S (Servicios):
→ Promedio de los tarifarios publicados por bodegas 
  activas en la región
→ Endpoint existente: GET /api/tarifario/:bodegaId
→ Para el promedio regional: crear o usar endpoint 
  GET /api/precios/componentes/detalle que ya existe

Diferenciación visual OBLIGATORIA:
→ El bloque verde (productor) y el bloque azul (bodega) 
  deben ser visualmente distintos y claramente etiquetados
→ El usuario debe entender de un vistazo qué parte 
  va al productor y qué parte es costo de bodega
→ Mostrar también el porcentaje de cada componente:
  PO = 82.4% del precio de compra
  S  = 17.6% del precio de compra
```

---

### PRECIO 3 — Precio de Venta

**Descripción:**
Resultado de restar el Margen de Negociación al Precio de Compra.

**Fórmula:**
```
Precio de Venta = Precio de Compra − Margen de Negociación

Ejemplo:
Precio de Compra    = $5,660 MXN/ton
Margen Negociación  = $4,055 MXN/ton
─────────────────────────────────────
Precio de Venta     = $1,605 MXN/ton
```

**Visualización:**

```
┌─────────────────────────────────────────┐
│  PRECIO DE VENTA                        │
│                                         │
│  Precio de Compra      $5,660 MXN/ton   │
│  − Margen Negociación  $4,055 MXN/ton   │
│  ─────────────────────────────────────  │
│  PRECIO DE VENTA       $1,605 MXN/ton   │  ← número grande
│                                         │
└─────────────────────────────────────────┘
```

**Notas para el desarrollador:**

```
→ Este precio se calcula en el frontend con los 
  valores ya obtenidos de los precios 1 y 2
→ No requiere endpoint adicional
→ Si el resultado es negativo: mostrar en rojo 
  con el valor tal cual (no ocultar ni ajustar)
→ Si el resultado es positivo: mostrar en verde
```

---

### PRECIO 4 — Precio CEDIS ← EN DESARROLLO

**Descripción:**
Precio de compra en Centrales de Abasto (CEDIS) menos el Margen de Negociación. Segunda fase del desarrollo — por el momento mostrar como sección en construcción.

**Fórmula (cuando esté disponible):**
```
Precio CEDIS = Precio de Compra CEDIS − Margen de Negociación
```

**Cómo mostrarlo ahora:**

```tsx
// Mostrar sección con estado "En desarrollo"
<div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mt-4">
  <div className="flex items-center gap-2 mb-2">
    <span className="bg-amber-100 text-amber-700 text-xs font-bold 
                     px-2 py-1 rounded-full">
      EN DESARROLLO
    </span>
    <h3 className="text-sm font-semibold text-gray-600">
      Precio CEDIS
    </h3>
  </div>
  <p className="text-xs text-gray-400 leading-relaxed">
    Precio de compra en Centrales de Abasto menos el Margen de 
    Negociación. Próximamente disponible — en proceso de integración 
    con fuentes de datos por contrato con CEDIS.
  </p>
</div>
```

**Notas para fases posteriores:**
```
→ El precio de compra CEDIS varía por estado
→ Fase 1: captura manual por el admin desde su panel
→ Fase 2: revisar si hay API pública o requiere 
  scraping de fuentes de CEDIS/Centrales de Abasto
→ Cuando esté disponible: mismo formato visual 
  que Precio de Venta (resta sobre Margen Negociación)
```

---

### Estructura del endpoint requerido

```typescript
// GET /api/precios/mercado — nuevo endpoint o modificar existente
// Debe devolver todos los datos necesarios en una sola llamada:

{
  // Para Precio 1 — Margen de Negociación
  precio_chicago_usd_bushel: number,    // ej: 4.85
  tipo_cambio_mxn: number,              // ej: 17.82
  bono_maiz_usd: number,                // siempre 50 (constante)
  margen_negociacion_mxn: number,       // calculado: (chicago×39.368 + 50) × tc
  timestamp_chicago: string,            // "2026-05-28T07:00:00"

  // Para Precio 2 — Precio de Compra
  precio_origen_mxn: number,            // PO — promedio pagado al productor
  servicios_bodega_mxn: number,         // S — promedio tarifarios región
  precio_compra_mxn: number,            // PO + S
  pct_productor: number,                // % que representa PO del total
  pct_servicios: number,                // % que representa S del total

  // Para Precio 3 — Precio de Venta
  precio_venta_mxn: number,             // precio_compra - margen_negociacion

  // Precio CEDIS — fase posterior
  precio_cedis_disponible: boolean,     // false por ahora
  precio_cedis_mxn: number | null,      // null por ahora
}
```

---

### Gráfica de tendencia (mantener del diseño actual)

```
→ Conservar la gráfica de línea (Recharts) de 30 días
→ Agregar 3 líneas con leyenda:
  · Línea verde:   Precio de Compra
  · Línea azul:    Margen de Negociación  
  · Línea naranja: Precio de Venta
→ Tooltip al hover: mostrar los 3 valores del día
→ Solo renderizar si hay ≥ 2 puntos de datos
```

---

## MODIFICACIÓN 2 — Mapa de bodegas en B03 Selección de Bodegas

### Contexto

La pantalla B03 actualmente solo tiene vista de lista. Se agrega una **vista de mapa** como opción alternativa. Ambas vistas tienen el mismo propósito: que el bodeguero encuentre y asocie las bodegas que opera. No es una pantalla nueva — es una segunda forma de ver el mismo contenido.

---

### Estructura de la pantalla con las dos vistas

```
┌─────────────────────────────────────────┐
│  Selecciona las bodegas que operas      │
│                                         │
│  KPIs globales del catálogo:            │
│  [📦 X bodegas registradas] [🏗 X,XXX ton] │
│                                         │
│  Filtros: [Estado ▼] [Municipio ▼] [🔍] │
│                                         │
│  [≡ Lista]  [🗺 Mapa]  ← toggle de vista │
│                                         │
│  ─────────────────────────────────────  │
│  [Contenido según vista activa]         │
└─────────────────────────────────────────┘
```

---

### KPIs globales del catálogo (nuevos)

Mostrar siempre en la parte superior, independientemente de la vista activa:

```tsx
// Dos tarjetas pequeñas lado a lado
<div className="grid grid-cols-2 gap-3 mb-4">
  
  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
    <p className="text-xl font-bold text-green-700">
      {formatNum(totalBodegas)}
    </p>
    <p className="text-xs text-green-600 mt-1">
      Bodegas en el catálogo
    </p>
  </div>

  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
    <p className="text-xl font-bold text-blue-700">
      {formatTon(totalCapacidad)}
    </p>
    <p className="text-xs text-blue-600 mt-1">
      Capacidad total registrada
    </p>
  </div>

</div>

// Fuente de datos:
// GET /api/bodegas/stats — crear endpoint nuevo
// Devuelve: { total_bodegas: number, total_capacidad_ton: number }
// O agregar estos campos al response existente de GET /api/bodegas
```

---

### Toggle de vista Lista / Mapa

```tsx
// Botones de selección de vista
<div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4">
  <button
    onClick={() => setVista('lista')}
    className={`flex-1 py-2 text-sm font-medium flex items-center 
                justify-center gap-2 transition-colors ${
      vista === 'lista' 
        ? 'bg-green-700 text-white' 
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    <ListIcon className="w-4 h-4" />
    Lista
  </button>
  <button
    onClick={() => setVista('mapa')}
    className={`flex-1 py-2 text-sm font-medium flex items-center 
                justify-center gap-2 transition-colors ${
      vista === 'mapa' 
        ? 'bg-green-700 text-white' 
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    <MapIcon className="w-4 h-4" />
    Mapa
  </button>
</div>
```

---

### Vista Lista (conservar la existente)

```
→ Mantener exactamente como está hoy
→ Los filtros de estado, municipio y búsqueda 
  por texto aplican igual
→ Cada resultado tiene botón "+ Agregar"
→ Al agregar: la bodega pasa a "Mis bodegas seleccionadas"
```

---

### Vista Mapa (nueva)

**Comportamiento general:**
```
→ Mapa Leaflet (o Mapbox si VITE_MAPBOX_TOKEN está definido)
→ Centrado en México al cargar: lat 23.6345, lon -102.5528, zoom 5
→ Los mismos filtros de estado, municipio y texto 
  aplican al mapa — filtran los puntos visibles
→ Cuando se aplica un filtro de estado: 
  el mapa hace zoom automático al estado seleccionado
→ Cuando se aplica un filtro de municipio: 
  el mapa hace zoom al municipio seleccionado
```

**Marcadores en el mapa:**
```
→ Un punto verde por cada bodega del catálogo
→ Las bodegas ya asociadas por el usuario: 
  punto verde más oscuro con ícono de check ✓
→ Al tocar un punto: aparece popup (ver abajo)
```

**Popup al tocar una bodega:**
```
┌────────────────────────────────┐
│  NOMBRE DE LA BODEGA           │
│  Municipio, Estado             │
│                                │
│  Capacidad: X,XXX ton          │
│  Semáforo: 🟢 Comprando        │
│                                │
│  [+ Agregar esta bodega]       │  ← botón verde
└────────────────────────────────┘
```

**Implementación del popup:**
```tsx
// Cada Marker en el mapa tiene un Popup de react-leaflet
<Marker
  key={bodega.id}
  position={[bodega.latitud, bodega.longitud]}
  icon={bodegaYaAgregada(bodega.id) ? iconoVerdeDark : iconoVerde}
  eventHandlers={{
    click: () => {
      // El mapa hace zoom a la bodega tocada
      mapRef.current?.flyTo(
        [bodega.latitud, bodega.longitud], 
        14,  // zoom level de detalle
        { animate: true, duration: 0.8 }
      );
    }
  }}
>
  <Popup>
    <div className="min-w-48">
      <p className="font-bold text-sm text-gray-800">
        {bodega.nombre}
      </p>
      <p className="text-xs text-gray-500 mb-2">
        {bodega.municipio}, {bodega.estado}
      </p>
      {bodega.capacidad_ton > 0 && (
        <p className="text-xs text-gray-600 mb-1">
          Capacidad: {formatTon(bodega.capacidad_ton)}
        </p>
      )}
      <p className="text-xs mb-3">
        {bodega.semaforo_compra === 'verde' && '🟢 Comprando'}
        {bodega.semaforo_compra === 'amarillo' && '🟡 Cap. limitada'}
        {bodega.semaforo_compra === 'rojo' && '🔴 No compra'}
      </p>
      {bodegaYaAgregada(bodega.id) ? (
        <p className="text-xs text-green-600 font-medium">
          ✓ Ya agregada
        </p>
      ) : (
        <button
          onClick={() => agregarBodega(bodega)}
          className="w-full bg-green-700 text-white text-xs 
                     font-medium py-2 px-3 rounded-lg"
        >
          + Agregar esta bodega
        </button>
      )}
    </div>
  </Popup>
</Marker>
```

**Zoom automático al filtrar por estado o municipio:**
```typescript
// Al seleccionar un estado en el filtro:
useEffect(() => {
  if (estadoSeleccionado && vista === 'mapa') {
    // Calcular el bounding box de las bodegas del estado filtrado
    const bodegasDelEstado = bodegas.filter(b => b.estado === estadoSeleccionado);
    if (bodegasDelEstado.length > 0) {
      const bounds = bodegasDelEstado.map(b => [b.latitud, b.longitud]);
      mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}, [estadoSeleccionado, vista]);

// Al seleccionar un municipio: mismo patrón con las bodegas del municipio
```

---

### Estado compartido entre vistas

```typescript
// Las dos vistas comparten exactamente el mismo estado:
const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');
const [textoBusqueda, setTextoBusqueda] = useState('');
const [bodegasSeleccionadas, setBodegasSeleccionadas] = useState<Bodega[]>([]);

// Al cambiar de vista: los filtros se mantienen
// Al agregar una bodega desde cualquier vista: 
// aparece en "Mis bodegas seleccionadas" en ambas vistas

// Los filtros siempre están visibles arriba, 
// independientemente de qué vista esté activa
```

---

### Endpoint nuevo requerido para los KPIs

```typescript
// GET /api/bodegas/stats
// Sin autenticación requerida (es info pública del catálogo)
// Respuesta:
{
  total_bodegas: number,           // COUNT(*) FROM bodegas WHERE estatus='aprobada'
  total_capacidad_ton: number,     // SUM(capacidad_ton) FROM bodegas WHERE estatus='aprobada'
}

// Query SQL:
SELECT 
  COUNT(*) AS total_bodegas,
  COALESCE(SUM(capacidad_ton), 0) AS total_capacidad_ton
FROM bodegas 
WHERE estatus = 'aprobada';
```

---

## RESUMEN DE CAMBIOS

| Archivo | Tipo de cambio | Descripción |
|---|---|---|
| `B22PreciosMercado.tsx` | Reescribir | Nueva estructura con 4 precios + desglose visual |
| `B03SelectBodegas.tsx` | Extender | Agregar toggle vista + mapa Leaflet + KPIs |
| `backend/src/routes/precios.ts` | Modificar | Agregar Chicago, tipo cambio, bono y componentes al endpoint |
| `backend/src/routes/bodegas.ts` | Agregar | Nuevo endpoint GET /api/bodegas/stats |

---

## VERIFICACIÓN FUNCIONAL

Probar estos flujos después de implementar:

```
MÓDULO DE PRECIOS:
□ El Margen de Negociación muestra los 4 componentes
  (Chicago, conversión, tipo de cambio, Bono Maíz $50 USD)
□ El Precio de Compra muestra 2 bloques de color diferente
  (verde productor / azul servicios bodega)
□ El Precio de Venta muestra la resta correctamente
□ El Precio CEDIS muestra el badge "En desarrollo"
□ La gráfica de 30 días tiene las 3 líneas con leyenda

MAPA DE BODEGAS:
□ Los KPIs globales muestran total de bodegas y capacidad
□ El toggle Lista/Mapa funciona y conserva los filtros
□ Los puntos del mapa se muestran en las coordenadas correctas
□ Al tocar un punto: aparece el popup con el botón Agregar
□ Al filtrar por estado: el mapa hace zoom automático
□ Al filtrar por municipio: el mapa hace zoom automático
□ Las bodegas ya agregadas se muestran con marcador distinto
□ Al agregar desde el mapa: aparece en "Mis bodegas seleccionadas"
```

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*
