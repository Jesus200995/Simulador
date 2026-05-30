# SIMAC — Admin · Correcciones + Módulos Nuevos
**Plan Nacional Maíz 2026 · Mayo 2026 · Para el desarrollador**  
Repo: `github.com/Jesus200995/Simulador` · App: `app-bodega/` · Verde primario: `#1A5C38`

> Este documento integra correcciones a lo ya construido + especificación de módulos nuevos.  
> Basado en auditoría real del repo. Todos los schemas y endpoints son los nombres reales confirmados.

---

## Índice

1. [Correcciones críticas — backend](#1-correcciones-críticas--backend)
2. [Correcciones — módulo Admin existente](#2-correcciones--módulo-admin-existente)
3. [A0 — Resumen General (modificar + mapa nuevo)](#3-a0--resumen-general-modificar--mapa-nuevo)
4. [A1 — Productores (agregar estadísticas)](#4-a1--productores-agregar-estadísticas)
5. [A2 — Bodegas (agregar estadísticas + ventanillas)](#5-a2--bodegas-agregar-estadísticas--ventanillas)
6. [A3 — Alertas (agregar estadísticas)](#6-a3--alertas-agregar-estadísticas)
7. [A4 — Precios (corregir fórmula + rediseño visual)](#7-a4--precios-corregir-fórmula--rediseño-visual)
8. [A5 — Producción (módulo nuevo)](#8-a5--producción-módulo-nuevo)
9. [A6 — Mercado (módulo nuevo)](#9-a6--mercado-módulo-nuevo)
10. [A7 — Configuración (módulo nuevo)](#10-a7--configuración-módulo-nuevo)
11. [Sidebar — estructura final](#11-sidebar--estructura-final)
12. [Endpoints nuevos requeridos](#12-endpoints-nuevos-requeridos)
13. [Checklist de entrega](#13-checklist-de-entrega)

---

## 1. Correcciones críticas — backend

### 1.1 🔴 BUG CRÍTICO — Fórmula del Margen de Negociación

**Archivo:** `backend/src/routes/precios-sistema.ts` — línea 66  
**Problema:** La fórmula actual calcula el margen como `(PO + S) × margen_pct%`. Eso es incorrecto — el Margen de Negociación es una referencia internacional, no un porcentaje del precio local.

**Código actual (ELIMINAR):**
```typescript
const m = Math.round((po + s) * (parseFloat(params.margen_pct) / 100) * 100) / 100;
```

**Código correcto (REEMPLAZAR):**
```typescript
const FACTOR_CONVERSION = 39.368;  // 1 ton métrica = 39.368 bushels — constante fija
const BONO_MAIZ_USD = 50;          // Bono maíz blanco — constante del programa

// chicago_usd_bushel y tc_banxico vienen de obtenerReferenciasExternasActuales()
const chicago_usd_ton = refs.chicago_usd_bushel * FACTOR_CONVERSION;
const chicago_mxn = chicago_usd_ton * refs.tc_banxico;
const bono_mxn = BONO_MAIZ_USD * refs.tc_banxico;
const margen_negociacion = Math.round((chicago_mxn + bono_mxn) * 100) / 100;
```

**Verificar que el response de `GET /api/precios/sistema/hoy` devuelva:**
```json
{
  "margen_negociacion": 4310.50,
  "chicago_usd_bushel": 6.28,
  "chicago_usd_ton": 247.43,
  "chicago_mxn": 4310.50,
  "tc_banxico": 17.42,
  "bono_mxn": 871.00,
  "po": 3509,
  "s": 980,
  "precio_compra": 4489,
  "precio_venta": 178.50,
  "fecha": "2026-05-29",
  "updated_at": "2026-05-29T07:00:00Z"
}
```

> Con Chicago en $6.28 USD/bushel y TC en $17.42 MXN/USD:  
> Margen = (6.28 × 39.368 × 17.42) + (50 × 17.42) = **$4,310 MXN/ton** — no $571.

---

### 1.2 🟡 BANXICO_TOKEN — documentar en .env.example

**Archivo:** `backend/.env.example`  
**Problema:** El token existe en el código pero no está documentado. Si alguien levanta el proyecto sin el token, cae silenciosamente al fallback hardcodeado 17.42 sin aviso visible.

**Agregar en `.env.example`:**
```
# Token Banxico — obtener GRATIS en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
# Sin este token el TC usa Yahoo Finance como fallback
BANXICO_TOKEN=tu_token_aqui_64_caracteres
```

**Agregar log de advertencia en `preciosExternos.ts`:**
```typescript
if (!process.env.BANXICO_TOKEN) {
  console.warn('⚠️  BANXICO_TOKEN no configurado — usando Yahoo Finance como fallback para TC');
}
```

---

### 1.3 🟡 Fallback hardcodeado en tendencia

**Archivo:** `backend/src/routes/precios-sistema.ts` — línea 125  
**Problema:** Si no hay datos en BD, chicago cae a `6.28` hardcodeado sin que el frontend lo sepa.

**Agregar campo `es_fallback` en el response:**
```typescript
const refs = await obtenerReferenciasExternasActuales();
const es_fallback = refs.fuente === 'fallback_hardcodeado';

return res.json({
  tendencia: [...],
  es_fallback,  // el frontend muestra badge "Datos estimados" si es true
  ultima_actualizacion: refs.created_at
});
```

---

### 1.4 🟡 costos_fira — el campo es `costo_por_ha`, no `costo_por_ton`

**Impacto:** Solo en la UI — no hay cambio de BD ni de backend.  
**Acción:** En todos los componentes que muestren datos FIRA, usar el label **"Costo de producción (MXN/ha)"** en lugar de "MXN/ton".  
**Archivos a modificar:** `PreciosAdminPage.tsx` — cualquier columna o label que diga "costo/ton" referente a FIRA.

---

### 1.5 🟡 Filtro `?rol=` faltante en `/api/admin/usuarios`

**Archivo:** `backend/src/routes/admin.ts` — línea 86  
**Agregar filtro por rol:**
```typescript
if (req.query.rol) {
  conditions.push(`u.rol = $${paramIndex++}`);
  values.push(req.query.rol);
}
```

---

## 2. Correcciones — módulo Admin existente

### 2.1 Quitar tarjeta de Precios del Resumen General

**Archivo:** `app-bodega/src/pages/admin/DashboardAdminPage.tsx`  
**Acción:** Eliminar el bloque de precios en vivo (`GET /precios/mercado`) del dashboard.  
El resumen debe mostrar solo KPIs operativos — los precios tienen su propia pantalla `/admin/precios`.

**Eliminar:**
- La llamada a `GET /precios/mercado`
- El componente/bloque que renderiza "PRECIOS EN VIVO" con los 3 valores
- El botón "Ver detalle"

---

### 2.2 Agregar campo `nota` al endpoint de aprobar/rechazar productor

**Archivo:** `backend/src/routes/admin.ts` — `PATCH /api/admin/usuarios/:id/estatus`  
**Agregar** que el body acepte `{ estado_validacion, nota }` y guarde la nota en un campo o tabla de log.  
Si no existe campo `nota` en `producer`, agregar:
```sql
ALTER TABLE producer ADD COLUMN IF NOT EXISTS nota_admin TEXT;
```

---

## 3. A0 — Resumen General (modificar + mapa nuevo)

**Archivo:** `app-bodega/src/pages/admin/DashboardAdminPage.tsx`

### 3.1 KPI Cards — mantener con ajuste

Conservar las 6 KPI cards actuales. Ajustar card 3 (Operaciones):
- Renombrar a **"Transacciones"** — mostrar `COUNT(transacciones últimos 7 días)`
- Fuente: `GET /api/dashboard/admin/resumen` — agregar campo `transacciones_7dias` al response si no existe

### 3.2 Mapa Global — crear desde cero

**Componente nuevo:** `app-bodega/src/components/admin/MapaGlobalAdmin.tsx`  
**Librería:** Leaflet (ya instalado en el proyecto)  
**Tiles:** ESRI World Imagery

```
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

**Layout del mapa:**
- Ancho completo debajo de los KPI cards
- Altura: `480px`
- Centrado en México: `lat 23.6345, lon -102.5528, zoom 5`

**3 capas toggle (checkboxes encima del mapa):**

| Capa | Marcador | Fuente de datos | Color |
|---|---|---|---|
| 🟢 Productores | Círculo pequeño 8px | `GET /api/dashboard/admin/mapa` → campo `ups` | `#1A5C38` |
| 🏭 Bodegas | Ícono cuadrado 10px | mismo endpoint → campo `bodegas` | `#2563EB` |
| 🚨 Alertas | Triángulo 10px | mismo endpoint → campo `alertas` | `#DC2626` |

**Endpoint a usar:** `GET /api/dashboard/admin/mapa` — ya existe, devuelve `ups`, `bodegas`, `alertas` con coordenadas.

**Filtros sobre el mapa:**
- Select "Estado" → Select "Municipio" (dinámico)
- Al seleccionar estado: `map.fitBounds()` a los marcadores del estado
- Al seleccionar municipio: zoom más cerrado al municipio

**Panel lateral derecho del mapa (aparece al seleccionar zona):**  
Al hacer clic en un municipio o aplicar filtro de municipio, mostrar panel con:
```
📍 [Nombre Municipio], [Estado]
─────────────────────────────
👥 Productores registrados: X
🏭 Bodegas activas:         X
🌽 Toneladas disponibles:   X ton
📋 Requerimientos activos:  X
🚨 Alertas activas:         X
```
Fuente: filtrar los datos ya cargados del mapa por municipio — sin llamada extra al backend.

**Interacción con marcadores:**  
Popup al hacer clic en cualquier marcador:
- **Productor:** nombre, municipio, tipo maíz, variedad, volumen disponible (si tiene)
- **Bodega:** nombre, semáforo (🟢/🟡/🔴), capacidad, estatus
- **Alerta:** tipo, nivel, descripción corta

### 3.3 Tabla de Actividad Reciente — mantener

Ya existe con `GET /api/admin/actividad-reciente`. No modificar.

---

## 4. A1 — Productores (agregar estadísticas)

**Archivo:** `app-bodega/src/pages/admin/ProductoresAdminPage.tsx`

### 4.1 Mantener los 3 tabs actuales

Pendientes / Todos / Suspendidos — sin cambios en la lógica existente.  
**Agregar:** campo `nota_admin` en el modal de rechazar (textarea obligatorio mínimo 20 caracteres).

### 4.2 Nuevo bloque estadístico — debajo de los tabs

Agregar debajo de la tabla principal un bloque colapsable titulado **"Estadísticas del padrón"**.

**Bloque A — Demografía** (extraída del CURP en frontend):

> El CURP codifica: posición 11 = sexo (H/M), posiciones 5-10 = fecha nacimiento (AAMMDD).  
> Calcular en frontend al recibir la lista de productores — sin endpoint extra.

```typescript
// Extraer del CURP en frontend
const sexo = curp[10]; // 'H' o 'M'
const anioNac = parseInt('19' + curp.substring(4, 6)); // ajustar para >= 2000
const edad = new Date().getFullYear() - anioNac;
```

**Gráficas a mostrar:**
- **Donut Chart.js:** Hombres vs. Mujeres — colores `#1A5C38` y `#4A9B6A`
- **Bar Chart.js horizontal:** Rangos de edad: 18-30 / 31-45 / 46-60 / 60+
- **KPI texto:** Edad promedio del padrón

**Bloque B — Programas sociales:**

Fuente: campo `programas_beneficiario TEXT[]` de la tabla `producer` — ya existe en BD (migración v13).  
Endpoint: `GET /api/admin/usuarios` ya devuelve este campo.

- **Bar Chart.js horizontal:** Top 5 programas por número de beneficiarios
- **KPI:** % de productores con al menos 1 programa
- **Nota:** Un productor puede tener varios programas — contar ocurrencias, no productores únicos

**Datos que devuelve el endpoint existente:** usar `programas_beneficiario[]` del array de usuarios ya cargado — sin llamada extra.

### 4.3 Superficie total en detalle del productor

**Archivo:** `app-bodega/src/pages/admin/ProductorDetalleAdminPage.tsx`

Agregar dos KPIs en la sección de UP:
- **Superficie del predio:** `up.area_ha_calc` en ha — label "Superficie total del predio"
- **Superficie sembrada:** `cycle_crop.area_sown_ha` del ciclo activo — label "Superficie sembrada (ciclo activo)"

---

## 5. A2 — Bodegas (agregar estadísticas + ventanillas)

**Archivo:** `app-bodega/src/pages/admin/BodegasAdminPage.tsx`

### 5.1 Agregar pestaña "Estadísticas" al módulo de Bodegas

Agregar un tab nuevo **"Estadísticas"** junto a la lista+mapa existente.

**KPIs globales (fila superior):**

| KPI | Fuente | Campo |
|---|---|---|
| Capacidad total instalada | `GET /api/dashboard/admin/infraestructura` | `capacidad` |
| Stock total declarado | mismo endpoint | `stock` (suma de `inventarios.volumen_almacenamiento`) |
| % Ocupación promedio | calculado: `stock / capacidad × 100` | — |
| Bodegas con tarifario activo | contar bodegas con `tarifario_servicios.activo = true AND updated_at > NOW()-60d` | endpoint nuevo |
| Total ventanillas activas | `COUNT(ventanillas)` | endpoint nuevo |

**Gráfica 1 — Stock por estado (barras verticales Chart.js):**
- Eje X: estados
- Eje Y: toneladas almacenadas (suma de `volumen_almacenamiento`)
- Filtro: select de ciclo (PV/OI/Anual) — al cambiar refiltrar barras
- Fuente: `GET /api/dashboard/admin/infraestructura` → campo `top_bodegas` o endpoint nuevo `/api/admin/bodegas/stats-inventario`

**Gráfica 2 — Distribución por variedad de maíz (Pie Chart.js):**
- Segmentos: cada variedad con su % del stock total
- Filtro: estado → municipio
- Fuente: agrupar `inventarios` por `variedad_code`

**Gráfica 3 — Stock por municipio dentro del estado seleccionado (barras horizontales):**
- Se activa al seleccionar un estado en el filtro
- Muestra top 10 municipios con más stock

**Tabla de ventanillas:**

| Columna | Fuente |
|---|---|
| Bodega | `ventanillas.bodega_id` → nombre de bodega |
| Tipo de apoyo | `ventanillas.tipo` (coberturas/incentivos/ambos) |
| Enlace Agricultura | `ventanillas.nombre_enlace_agricultura` |
| Apoyos solicitados | `COUNT(solicitudes_apoyo WHERE ventanilla_id = ...)` |
| Apoyos atendidos | `COUNT(solicitudes_apoyo WHERE estado = 'canalizada' OR 'cerrada')` |

Fuente: endpoint nuevo `GET /api/admin/ventanillas/resumen`

### 5.2 Agregar sección Ventanillas en Detalle de Bodega

**Archivo:** `app-bodega/src/pages/admin/BodegaDetalleAdminPage.tsx`

Agregar sección al final del detalle:

**"Ventanillas de apoyo"** — mostrar si `ventanillas.bodega_id = bodega.id`:
- Tipo de apoyo, nombre del enlace, teléfono, correo
- Tabla de apoyos gestionados: tipo de apoyo, estatus, fecha solicitud
- KPI: total solicitudes recibidas / total atendidas

Fuente: `GET /api/ventanillas/:id/solicitudes` ya existe.

---

## 6. A3 — Alertas (agregar estadísticas)

**Archivo:** `app-bodega/src/pages/admin/AlertasAdminPage.tsx`

### 6.1 Agregar panel estadístico

Agregar columna derecha (o panel colapsable) con:

**KPIs:**
- Total alertas activas por tipo (4 contadores con ícono)
- Alertas críticas (nivel = alta): contador en rojo destacado

**Donut Chart.js — Alertas por tipo:**
- 4 segmentos: Fitosanitaria / Climática / Operativa / Mercado
- Colores: `#DC2626`, `#2563EB`, `#D97706`, `#1A5C38`

**Barras horizontales — Estados con más alertas activas:**
- Top 5 estados, ordenados por número de alertas

**Productores potencialmente afectados:**
- Cruzar `up.state_name` con los estados de las alertas activas
- Mostrar: "X productores en zonas con alerta activa"
- Fuente: contar `up.state_name IN (estados de alertas activas)` — calcular en frontend con datos ya cargados

**Línea de tendencia 30 días (Chart.js):**
- Eje X: fechas
- Eje Y: número de alertas activas por día
- Fuente: agregar campo `tendencia_30dias` al endpoint `GET /api/dashboard/admin/alertas`

---

## 7. A4 — Precios (corregir fórmula + rediseño visual)

**Archivo:** `app-bodega/src/pages/admin/PreciosAdminPage.tsx`

### 7.1 Fix de fórmula

Ver sección 1.1 — el fix es en el backend. El frontend ya consume el campo del response; una vez corregido el backend, el valor en pantalla será correcto automáticamente.

**Verificar** que `PreciosAdminPage.tsx` muestre el campo `margen_negociacion` del response y no esté recalculando en frontend.

### 7.2 Rediseño visual del bloque de precios

Reemplazar el layout actual por bloques visuales separados y explicativos.

**Bloque 1 — Margen de Negociación** (fondo `#1A5C38`):

```
┌─────────────────────────────────────────────────────────┐
│  📈 MARGEN DE NEGOCIACIÓN        Fuente: CME + Banxico  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Chicago CME  │  │ Conversión   │                    │
│  │ $6.28        │  │ × 39.368     │                    │
│  │ USD/bushel   │  │ = $247 USD/t │                    │
│  └──────────────┘  └──────────────┘                    │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Tipo cambio  │  │ Bono Maíz   │                    │
│  │ $17.42       │  │ +$50 USD/t   │                    │
│  │ MXN/USD      │  │ = $871 MXN/t │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  MARGEN DE NEGOCIACIÓN = $4,310 MXN/ton                │
│  Actualizado hoy 07:00am                                │
└─────────────────────────────────────────────────────────┘
```

**Bloque 2 — Precio de Compra** (dos sub-bloques):

```
┌──────────────────────────┐   ┌──────────────────────────┐
│  🌽 PRECIO ORIGEN (PO)   │ + │  🏪 SERVICIOS BODEGA (S) │
│  $3,509 MXN/ton          │   │  $980 MXN/ton             │
│  Promedio bodegas (7d)   │   │  Promedio tarifarios       │
│  X bodegas incluidas     │   │  X bodegas con tarifario   │
└──────────────────────────┘   └──────────────────────────┘
         PRECIO DE COMPRA = $4,489 MXN/ton
```

**Bloque 3 — Precio de Venta** (fondo según resultado):

```
┌─────────────────────────────────────────────────────────┐
│  Precio de Compra      $4,489 MXN/ton                   │
│  − Margen Negociación  $4,310 MXN/ton                   │
│  ────────────────────────────────                       │
│  PRECIO DE VENTA     = $179 MXN/ton  ✅ (verde)         │
└─────────────────────────────────────────────────────────┘
```

**Bloque 4 — Precio CEDIS** (siempre badge, no calcular):

```
┌─────────────────────────────────────────────────────────┐
│  🏗️  PRECIO CEDIS                    [PRÓXIMAMENTE]     │
│  Precio de compra en Centrales de Abasto menos el       │
│  Margen de Negociación. Disponible en la siguiente      │
│  versión del sistema.                                   │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Filtro por región/estado

Agregar selector de **Estado** en la parte superior de la pantalla.  
Al cambiar el estado:
- PO se recalcula con el promedio de bodegas de ese estado (`GET /api/precios?estado=Jalisco`)
- S se recalcula con tarifarios de bodegas de ese estado
- El título muestra: "Precios para **Jalisco** — puedes cambiar el estado con el filtro"
- El Margen de Negociación NO cambia (es referencia nacional)

### 7.4 Bloque FIRA — Costo de producción por estado

Mostrar debajo de los 3 precios, solo visible para Admin:

**Tabla — Costo de producción FIRA:**

| Estado | Ciclo | Modalidad | Costo (MXN/ha) | PO del estado | Rentabilidad |
|---|---|---|---|---|---|
| Jalisco | PV | Riego | $X,XXX | $X,XXX | ✅ o 🔴 |
| Jalisco | PV | Temporal | $X,XXX | $X,XXX | ✅ o 🔴 |
| Sinaloa | PV | Riego | $X,XXX | $X,XXX | ✅ o 🔴 |

- Label: **"Costo de producción (MXN/ha)"** — no MXN/ton
- Columna Rentabilidad: si `PO > costo_por_ha / rendimiento_promedio` → ✅ Verde / 🔴 Rojo
- Fuente: `GET /api/precios/referencias/externas` ya devuelve `costo_fira`
- Botón "Actualizar datos FIRA" → modal con input CSV

### 7.5 Verificar que nada esté hardcodeado

Revisar en `PreciosAdminPage.tsx`:
- [ ] Chicago viene de `refs.chicago_usd_bushel` — no de una constante en el frontend
- [ ] TC viene de `refs.tc_banxico` — no de una constante en el frontend
- [ ] La gráfica de tendencia usa el endpoint real — no datos mock

---

## 8. A5 — Producción (módulo nuevo)

**Archivo nuevo:** `app-bodega/src/pages/admin/ProduccionAdminPage.tsx`  
**Ruta:** `/admin/produccion`  
**Sidebar:** 🌽 Producción

### 8.1 Endpoint a usar

`GET /api/dashboard/admin/produccion` — ya existe. Devuelve: `por_estado`, `por_ciclo`, `por_anio`, `ups_sin_ciclo`.

Para los mapas y detalles geográficos: `GET /api/dashboard/admin/mapa` → campo `ups` con coordenadas.

### 8.2 KPIs globales (fila superior)

| KPI | Campo | Label |
|---|---|---|
| Superficie total de predios | `SUM(up.area_ha_calc)` | "Superficie total registrada (ha)" |
| Superficie sembrada | `SUM(cycle_crop.area_sown_ha)` del ciclo activo | "Superficie sembrada ciclo activo (ha)" |
| Producción esperada | `SUM(cycle_crop.yield_expected × area_sown_ha)` | "Cosecha esperada (ton)" |
| Productores con ciclo activo | `COUNT(cycles activos)` | "Productores con ciclo registrado" |
| Productores sin ciclo | `ups_sin_ciclo` del endpoint | "Sin ciclo capturado ⚠️" — en naranja |

> Agregar los campos `superficie_total_ha`, `superficie_sembrada_ha` y `produccion_esperada_ton` al response de `GET /api/dashboard/admin/produccion` si no existen.

### 8.3 Mapa de calor por estado

**Componente:** Mapa Leaflet con capa coroplética  
**Dato:** `area_sown_ha` por estado — más oscuro = más superficie sembrada  

```typescript
// Escala de colores por rango de superficie
const getColor = (ha: number) => {
  if (ha > 50000) return '#1A5C38';  // verde muy oscuro
  if (ha > 20000) return '#2E7D52';
  if (ha > 10000) return '#4A9B6A';
  if (ha > 5000)  return '#7EC8A0';
  return '#C8E6D4';                   // verde muy claro
};
```

**Datos para el mapa:**  
Usar GeoJSON de estados de México (ya debería estar en el proyecto si el módulo productor tiene mapas).  
Cruzar con `por_estado[]` del endpoint de producción.

**Filtros del mapa:**
- Selector ciclo: PV / OI / Anual / Todos
- Selector año
- Al cambiar: los colores del mapa se recalculan con los datos del filtro

**Al hacer clic en un estado:**  
Panel lateral con:
```
📍 [Estado]
──────────────────────────────
🌾 Superficie sembrada: X,XXX ha
🌽 Producción esperada: X,XXX ton
👥 Productores con ciclo: X
📊 Variedad principal: [nombre]
```

### 8.4 Gráfica — Producción esperada por estado (barras apiladas)

- Eje X: estados
- Eje Y: toneladas esperadas
- Apilado por ciclo: PV (verde oscuro) / OI (verde claro)
- Filtro: año
- Tooltip: estado, ciclo, toneladas, número de productores
- Fuente: `por_estado[]` del endpoint

### 8.5 Gráfica — Distribución por variedad (Pie)

- Segmentos: cada variedad con % del total de superficie sembrada
- Filtro: estado → municipio
- Al hacer clic en segmento: muestra lista de municipios con esa variedad

### 8.6 Semáforo de cobertura de ciclos

Tabla por estado mostrando:

| Estado | Productores totales | Con ciclo | Sin ciclo | Cobertura |
|---|---|---|---|---|
| Jalisco | 120 | 98 | 22 | 🟢 82% |
| Sinaloa | 85 | 45 | 40 | 🟡 53% |
| Guanajuato | 60 | 20 | 40 | 🔴 33% |

- 🟢 Verde: ≥ 70% de cobertura
- 🟡 Amarillo: 40-69%
- 🔴 Rojo: < 40%

Fuente: cruzar `por_estado[]` con `ups_sin_ciclo` del endpoint.

### 8.7 Proyección logística (indicador de alerta)

Cruzar producción esperada por estado con capacidad de almacenamiento disponible en bodegas de ese estado:

```
⚠️  Jalisco: Producción esperada (8,500 ton) supera 
    capacidad disponible en bodegas (6,200 ton). 
    Déficit estimado: 2,300 ton.
```

Fuente: cruzar `GET /api/dashboard/admin/produccion` con `GET /api/dashboard/admin/infraestructura`.  
Calcular en frontend — sin endpoint extra.

---

## 9. A6 — Mercado (módulo nuevo)

**Archivo nuevo:** `app-bodega/src/pages/admin/MercadoAdminPage.tsx`  
**Ruta:** `/admin/mercado`  
**Sidebar:** 📊 Mercado

### 9.1 Endpoint a usar

- `GET /api/dashboard/admin/resumen` → ya tiene `disponibilidades` y `requerimientos`
- Para el detalle geográfico: crear endpoint nuevo `GET /api/admin/mercado/mapa`

**Endpoint nuevo `GET /api/admin/mercado/mapa`:**
```json
{
  "disponibilidades": [
    {
      "id": 1,
      "lat": 20.6597,
      "lon": -103.3496,
      "municipio": "Guadalajara",
      "estado": "Jalisco",
      "tipo_maiz": "blanco",
      "variedad_code": "H-438",
      "volumen_estimado_ton": 250,
      "fecha_disponible": "2026-07-01"
    }
  ],
  "requerimientos": [
    {
      "id": 1,
      "lat": 20.6797,
      "lon": -103.3596,
      "municipio": "Zapopan",
      "estado": "Jalisco",
      "nombre_bodega": "Bodega Norte",
      "tipo_maiz": "blanco",
      "variedad_code": "H-438",
      "volumen_ton": 500,
      "precio_ofrecido": 3600,
      "radio_km": 50
    }
  ]
}
```

Query para disponibilidades:
```sql
SELECT d.id, u.lat, u.lng, u.municipality_name AS municipio, u.state_name AS estado,
       d.tipo_maiz, d.variedad_code, d.volumen_estimado_ton, d.fecha_disponible
FROM disponibilidad_productor d
JOIN up u ON d.up_id = u.up_id
WHERE d.activa = true AND d.fecha_vencimiento > NOW();
```

Query para requerimientos:
```sql
SELECT s.id, b.latitud AS lat, b.longitud AS lon,
       b.municipio, b.estado, b.nombre AS nombre_bodega,
       s.tipo_maiz, s.variedad_code, s.volumen_ton,
       s.precio_ofrecido, s.radio_km
FROM senales_compra s
JOIN bodegas b ON s.bodega_id = b.id
WHERE s.activa = true AND s.fecha_vencimiento > NOW();
```

### 9.2 KPIs globales

| KPI | Dato | Color |
|---|---|---|
| Toneladas ofertadas | `SUM(disponibilidad_productor.volumen_estimado_ton WHERE activa=true)` | Verde |
| Toneladas demandadas | `SUM(senales_compra.volumen_ton WHERE activa=true)` | Azul |
| Balance oferta/demanda | ofertadas − demandadas | Verde si positivo, rojo si negativo |
| Precio promedio ofrecido | `AVG(senales_compra.precio_ofrecido)` | Neutro |
| Productores con disponibilidad | `COUNT DISTINCT producer_id` | Verde |
| Bodegas buscando maíz | `COUNT DISTINCT bodega_id` | Azul |

### 9.3 Mapa de oferta y demanda

**Mismo stack Leaflet + ESRI World Imagery**

**Marcadores:**
- 🌽 **Marcador verde** `#1A5C38`: disponibilidad declarada por productor
  - Popup: municipio, tipo maíz, variedad, volumen disponible, fecha disponible
- 🏭 **Marcador azul** `#2563EB`: requerimiento activo de bodega
  - Popup: nombre bodega, tipo maíz buscado, volumen, precio ofrecido, radio de búsqueda
- 🔵 **Círculo semitransparente** azul: radio de búsqueda de la bodega (radio_km desde su ubicación)

**Marcador especial — coincidencia geográfica:**  
Cuando un productor con disponibilidad está dentro del radio de búsqueda de una bodega:
- Ambos marcadores se resaltan con borde amarillo `#D97706`
- Línea punteada amarilla entre productor y bodega
- Leyenda: "X coincidencias activas en el mapa"

**Filtros del mapa:**
- Estado → Municipio
- Tipo de maíz (blanco/amarillo/criollo)
- Variedad (select dinámico según tipo)
- Fecha disponibilidad (desde/hasta)

**Al filtrar:** solo se muestran los marcadores que cumplen el filtro. El mapa hace `fitBounds()` a los marcadores visibles.

### 9.4 Panel estadístico

**Gráfica — Volumen oferta vs demanda por estado (barras agrupadas):**
- Barras verdes = toneladas disponibles
- Barras azules = toneladas demandadas
- Tooltip: estado, oferta, demanda, balance
- Filtro: variedad de maíz

**Tabla — Top 10 municipios por actividad de mercado:**

| Municipio | Estado | Oferta (ton) | Demanda (ton) | Balance | Transacciones (30d) |
|---|---|---|---|---|---|
| Zapopan | Jalisco | 1,200 | 800 | +400 | 45 |

- Ordenada por `oferta + demanda` descendente
- Clic en fila → mapa hace zoom a ese municipio

---

## 10. A7 — Configuración (módulo nuevo)

**Archivo nuevo:** `app-bodega/src/pages/admin/ConfiguracionAdminPage.tsx`  
**Ruta:** `/admin/configuracion`  
**Sidebar:** ⚙️ Configuración  
**Acceso:** Solo rol `admin` — rol `responsable` no ve este módulo

### 10.1 Secciones

**Parámetros del sistema** (tabla `precio_parametros` ya existe):
- Umbral brecha crítica (default 20%) — input numérico con botón guardar
- Días sin tarifario para alerta de bodega (default 60) — input numérico
- Ventana de promedio PO en días (default 7) — input numérico

**Catálogos editables:**
- Programas sociales (`cat_programas_gobierno`) — tabla con botones agregar/desactivar
- Conceptos de servicio (`cat_conceptos_servicio`) — tabla con botones agregar/desactivar

**Gestión de usuarios Admin:**
- Tabla de usuarios con rol `admin` o `responsable`
- Botón "Crear nuevo usuario admin" → modal con email, nombre, rol
- Botón "Cambiar rol" por usuario
- Botón "Desactivar" (no eliminar)

---

## 11. Sidebar — estructura final

Modificar `app-bodega/src/components/admin/AdminShell.tsx`:

```typescript
const navItems = [
  { path: '/admin',              icon: '🏠', label: 'Resumen'       },
  { path: '/admin/productores',  icon: '👥', label: 'Productores'   },
  { path: '/admin/bodegas',      icon: '🏭', label: 'Bodegas'       },
  { path: '/admin/produccion',   icon: '🌽', label: 'Producción'    },  // NUEVO
  { path: '/admin/mercado',      icon: '📊', label: 'Mercado'       },  // NUEVO
  { path: '/admin/alertas',      icon: '🚨', label: 'Alertas'       },
  { path: '/admin/precios',      icon: '💰', label: 'Precios'       },
  { path: '/admin/configuracion',icon: '⚙️', label: 'Configuración' },  // NUEVO
];
```

**Agregar al router.tsx:**
```typescript
<Route path="/admin/produccion"    element={<RequireAdmin><ProduccionAdminPage /></RequireAdmin>} />
<Route path="/admin/mercado"       element={<RequireAdmin><MercadoAdminPage /></RequireAdmin>} />
<Route path="/admin/configuracion" element={<RequireAdmin><ConfiguracionAdminPage /></RequireAdmin>} />
```

---

## 12. Endpoints nuevos requeridos

| Endpoint | Método | Para qué | Prioridad |
|---|---|---|---|
| `GET /api/admin/ventanillas/resumen` | GET | Tabla de ventanillas en estadísticas de Bodegas | 🟡 Media |
| `GET /api/admin/mercado/mapa` | GET | Mapa de oferta/demanda — disponibilidades + requerimientos con coords | 🔴 Alta |
| `GET /api/admin/bodegas/stats-inventario` | GET | Stock por estado/municipio/variedad para gráficas | 🟡 Media |

**Modificaciones a endpoints existentes:**

| Endpoint | Modificación |
|---|---|
| `GET /api/dashboard/admin/produccion` | Agregar: `superficie_total_ha`, `superficie_sembrada_ha`, `produccion_esperada_ton` |
| `GET /api/dashboard/admin/resumen` | Agregar: `transacciones_7dias` |
| `GET /api/precios/sistema/hoy` | 🔴 CRÍTICO: Corregir fórmula de `margen_negociacion` (ver sección 1.1) |
| `PATCH /api/admin/usuarios/:id/estatus` | Agregar campo `nota` en body |
| `GET /api/admin/usuarios` | Agregar filtro `?rol=` |

---

## 13. Checklist de entrega

### 🔴 Correcciones críticas (bloquean producción)
- [ ] Fórmula `margen_negociacion` corregida en `precios-sistema.ts` línea 66
- [ ] Verificar con Chicago $6.28 y TC $17.42 → resultado debe ser ~$4,310 MXN/ton
- [ ] `GET /api/precios/sistema/hoy` devuelve los campos correctos del nuevo response
- [ ] `BANXICO_TOKEN` documentado en `.env.example` con instrucciones

### 🟡 Correcciones al Admin existente
- [ ] Bloque "PRECIOS EN VIVO" eliminado de `DashboardAdminPage.tsx`
- [ ] Llamada `GET /precios/mercado` eliminada del Dashboard
- [ ] Label "costo_por_ton" cambiado a "Costo de producción (MXN/ha)" en `PreciosAdminPage.tsx`
- [ ] Filtro `?rol=` implementado en `GET /api/admin/usuarios`
- [ ] Campo `nota_admin` agregado a tabla `producer` y al modal de rechazo

### 🟢 A0 — Resumen General
- [ ] Componente `MapaGlobalAdmin.tsx` creado con Leaflet
- [ ] 3 capas toggle: Productores, Bodegas, Alertas
- [ ] Filtros Estado/Municipio con zoom automático
- [ ] Panel lateral con resumen de la zona seleccionada
- [ ] Datos del mapa desde `GET /api/dashboard/admin/mapa`

### 🟢 A1 — Productores
- [ ] Bloque "Estadísticas del padrón" colapsable añadido
- [ ] Donut Hombres/Mujeres (calculado del CURP en frontend)
- [ ] Barras de rangos de edad (calculado del CURP en frontend)
- [ ] Barras top 5 programas sociales
- [ ] Superficie total del predio y sembrada en detalle del productor

### 🟢 A2 — Bodegas
- [ ] Tab "Estadísticas" añadido al módulo
- [ ] KPIs: capacidad total, stock total, % ocupación, bodegas con tarifario, ventanillas
- [ ] Gráfica stock por estado (barras) con filtro de ciclo
- [ ] Gráfica distribución por variedad (pie)
- [ ] Gráfica stock por municipio (barras horizontales)
- [ ] Tabla de ventanillas con apoyos solicitados/atendidos
- [ ] Sección ventanillas añadida en `BodegaDetalleAdminPage.tsx`
- [ ] Endpoint `GET /api/admin/ventanillas/resumen` creado

### 🟢 A3 — Alertas
- [ ] Panel estadístico añadido: donut por tipo, barras por estado
- [ ] KPI productores potencialmente afectados
- [ ] Línea de tendencia 30 días

### 🟢 A4 — Precios
- [ ] Rediseño visual con 4 bloques separados y explicativos
- [ ] Bloque CEDIS con badge "Próximamente" — sin cálculo
- [ ] Selector de estado/región que filtra PO y S
- [ ] Tabla FIRA con label "MXN/ha" y columna de rentabilidad
- [ ] Verificar que ningún valor esté hardcodeado en el frontend

### 🟢 A5 — Producción (nuevo)
- [ ] Archivo `ProduccionAdminPage.tsx` creado
- [ ] Ruta `/admin/produccion` y entrada en sidebar
- [ ] 5 KPIs globales incluyendo superficie total y sembrada
- [ ] Mapa de calor coroplético por estado
- [ ] Gráfica barras apiladas por estado y ciclo
- [ ] Gráfica pie por variedad
- [ ] Tabla semáforo de cobertura de ciclos
- [ ] Indicador de alerta logística (producción vs. capacidad bodegas)
- [ ] Endpoint `GET /api/dashboard/admin/produccion` actualizado con campos nuevos

### 🟢 A6 — Mercado (nuevo)
- [ ] Archivo `MercadoAdminPage.tsx` creado
- [ ] Ruta `/admin/mercado` y entrada en sidebar
- [ ] 6 KPIs globales
- [ ] Mapa con marcadores verdes (oferta) y azules (demanda)
- [ ] Círculos de radio de búsqueda de bodegas
- [ ] Resaltado y líneas de coincidencias geográficas
- [ ] Filtros: estado, municipio, tipo maíz, variedad, fecha
- [ ] Gráfica barras agrupadas oferta/demanda por estado
- [ ] Tabla top 10 municipios por actividad
- [ ] Endpoint `GET /api/admin/mercado/mapa` creado

### 🟢 A7 — Configuración (nuevo)
- [ ] Archivo `ConfiguracionAdminPage.tsx` creado
- [ ] Ruta `/admin/configuracion` y entrada en sidebar (solo rol `admin`)
- [ ] Parámetros del sistema editables
- [ ] Catálogos editables (programas, conceptos de servicio)
- [ ] Gestión de usuarios Admin

---

*Plan Nacional Maíz 2026 · SIMAC — Admin v2.0 · Mayo 2026*  
*Confidencial — Uso interno del equipo de desarrollo*
