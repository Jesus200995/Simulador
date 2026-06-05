# SIMAC — Correcciones Completas del Productor
## Auditoría Pre-Lanzamiento + Módulo Productor
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar en orden

> Este documento consolida las correcciones de la auditoría
> pre-lanzamiento más los hallazgos nuevos del módulo productor.
> Aplicar en el orden numerado — algunas correcciones son dependientes.

---

## ÍNDICE

| # | Corrección | Tipo | Urgencia |
|---|---|---|---|
| 1 | Servicios muestra $0 en lugar de "Sin tarifario" | 🤖 Agente | 🔴 Lanzamiento |
| 2 | Gráfica de tendencia sin mensaje cuando no hay datos | 🤖 Agente | 🔴 Lanzamiento |
| 3 | Notificaciones sin auto-refresco en página | 🤖 Agente | 🔴 Lanzamiento |
| 4 | Tarifario público sin filtro de 90 días | 🤖 Agente | 🔴 Lanzamiento |
| 5 | GET /transacciones no filtra por productor | 🤖 Agente | 🔴 Lanzamiento |
| 6 | Historial de ventas en Tablero del productor | 🤖 Agente | 🔴 Lanzamiento |
| 7 | Mis disponibilidades activas en Tablero | 🤖 Agente | 🔴 Lanzamiento |
| 8 | Semáforo y botón "Cómo llegar" en detalle bodega | 🤖 Agente | 🔴 Lanzamiento |
| 9 | Filtro tipo de maíz en mapa de bodegas | 🤖 Agente | 🟡 Piloto |
| 10 | Selector de radio en mapa (50/100/200/500 km) | 🤖 Agente | 🟡 Piloto |
| 11 | Variedad legible en disponibilidades activas | 🤖 Agente | 🟡 Piloto |
| 12 | Mapa de ubicación en detalle de bodega | 🤖 Agente | 🟡 Piloto |
| 13 | Ventanillas filtradas por distancia del productor | 🤖 Agente | 🟡 Piloto |
| 14 | POSTGIS + Migración v19 en servidor | 👨‍💻 Programador | 🔴 Lanzamiento |

---

## 🔴 CORRECCIONES DE LANZAMIENTO

---

## CORRECCIÓN #1
### Servicios muestra $0 en lugar de "Sin tarifario activo"
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/PreciosProductorPage.tsx`

**BUSCAR:**
```typescript
const tieneServicios = servicios != null;
```

**REEMPLAZAR CON:**
```typescript
const tieneServicios = servicios != null && servicios > 0;
```

**BUSCAR donde se renderiza el valor de servicios:**
```typescript
{tieneServicios ? `$${servicios.toLocaleString('es-MX')} MXN` : '—'}
```

**REEMPLAZAR CON:**
```typescript
{tieneServicios
  ? `$${servicios.toLocaleString('es-MX')} MXN`
  : <span className="text-gray-400 text-sm">Sin tarifario activo</span>
}
```

**VERIFICAR:** Con `servicios_promedio = 0` → pantalla muestra
"Sin tarifario activo", nunca "$0 MXN".

---

## CORRECCIÓN #2
### Gráfica de tendencia desaparece sin aviso
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/PreciosProductorPage.tsx`

**BUSCAR:**
```typescript
{data.tendencia?.length > 0 && (
  <LineChart ... />
)}
```

**REEMPLAZAR CON:**
```typescript
{data.tendencia?.length > 0
  ? (
    <LineChart ... />
  )
  : (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">📈</span>
      <p className="text-gray-600 font-medium">
        Historial en construcción
      </p>
      <p className="text-gray-400 text-sm mt-1 max-w-xs">
        El historial de precios estará disponible después
        de los primeros 30 días de operación del sistema.
      </p>
    </div>
  )
}
```

**VERIFICAR:** Con tabla de precios vacía → aparece mensaje
"Historial en construcción", no sección vacía.

---

## CORRECCIÓN #3
### Página de notificaciones sin auto-refresco
**TIPO:** 🤖 Agente
**ARCHIVOS:**
- `app-bodega/src/pages/bodega/B23Notificaciones.tsx`
- `app-bodega/src/pages/productor/AlertasPage.tsx`

**BUSCAR en ambos archivos el useEffect que carga al montar:**
```typescript
useEffect(() => {
  cargarNotificaciones();
}, []);
```

**REEMPLAZAR EN AMBOS ARCHIVOS CON:**
```typescript
useEffect(() => {
  cargarNotificaciones();

  // Auto-refresco cada 30 segundos mientras la página está abierta
  const interval = setInterval(() => {
    cargarNotificaciones();
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

**VERIFICAR:** Abrir página de notificaciones → llega notificación nueva
desde otro usuario → sin recargar, en máximo 30 segundos aparece en la lista.

---

## CORRECCIÓN #4
### Tarifario público sin filtro de 90 días
**TIPO:** 🤖 Agente
**ARCHIVO:** `backend/src/routes/bodegas.ts`
**ENDPOINT:** `GET /:id/tarifario-publico`

**BUSCAR la query del endpoint:**
```typescript
SELECT c.nombre AS concepto, ts.precio, c.unidad_default AS unidad
FROM tarifario_servicios ts
JOIN cat_conceptos_servicio c ON c.id = ts.concepto_id
WHERE ts.bodega_id = $1 AND ts.activo = TRUE
ORDER BY c.nombre ASC
```

**REEMPLAZAR CON:**
```typescript
SELECT c.nombre AS concepto, ts.precio, c.unidad_default AS unidad,
       ts.updated_at AS ultima_actualizacion
FROM tarifario_servicios ts
JOIN cat_conceptos_servicio c ON c.id = ts.concepto_id
WHERE ts.bodega_id = $1
  AND ts.activo = TRUE
  AND ts.updated_at >= NOW() - INTERVAL '90 days'
ORDER BY c.nombre ASC
```

**BUSCAR en `DetalleBodegaPage.tsx` el mensaje cuando no hay tarifario:**
```typescript
<p className="text-gray-400 text-sm">
  Esta bodega aún no ha publicado su tarifario de servicios
</p>
```

**REEMPLAZAR CON:**
```typescript
<p className="text-gray-400 text-sm text-center py-4">
  Esta bodega no tiene tarifario activo o sus precios
  tienen más de 90 días sin actualizar.
</p>
```

**VERIFICAR:** Bodega con tarifario de hace 100 días → endpoint devuelve
lista vacía → mensaje correcto. Bodega actualizada hace 30 días → devuelve
sus servicios.

---

## CORRECCIÓN #5
### GET /transacciones no filtra por productor autenticado
**TIPO:** 🤖 Agente
**ARCHIVO:** `backend/src/routes/transacciones.ts`

**PROBLEMA:** El endpoint `GET /transacciones` solo filtra por
`usuario_bodeguero`. Un productor autenticado recibe 0 resultados
porque no es usuario_bodeguero.

**BUSCAR la condición WHERE del endpoint GET /:**
```typescript
let where = isAdmin ? 'WHERE 1=1' : 'WHERE t.usuario_bodeguero = $1';
```

**REEMPLAZAR CON:**
```typescript
let where: string;
let params: any[];

if (isAdmin) {
  where = 'WHERE 1=1';
  params = [];
} else if (req.usuario?.rol === 'productor') {
  // Productor ve sus transacciones donde él es el vendedor
  where = `WHERE t.producer_id IN (
    SELECT p.producer_id FROM producer p
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.id = $1
  )`;
  params = [req.usuario.id];
} else {
  // Bodeguero ve sus transacciones
  where = 'WHERE t.usuario_bodeguero = $1';
  params = [req.usuario?.id];
}
```

**VERIFICAR:**
```bash
# Como productor autenticado:
curl GET /api/transacciones -H "Authorization: Bearer TOKEN_PRODUCTOR"
# Debe devolver sus transacciones como vendedor, no array vacío

# Como bodeguero:
curl GET /api/transacciones -H "Authorization: Bearer TOKEN_BODEGUERO"
# Debe devolver sus transacciones como comprador
```

---

## CORRECCIÓN #6
### Historial de ventas en Tablero del productor
**TIPO:** 🤖 Agente

**PASO 6A — Crear archivo nuevo:**
**ARCHIVO NUEVO:** `app-bodega/src/pages/productor/HistorialVentasSection.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Transaccion {
  id: number;
  bodega_nombre: string;
  volumen_ton: number;
  precio_por_ton: number;
  variedad: string;
  fecha: string;
  estado_confirmacion: string;
}

interface Props {
  token: string;
  apiUrl: string;
}

export default function HistorialVentasSection({ token, apiUrl }: Props) {
  const navigate = useNavigate();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/transacciones?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setTransacciones(Array.isArray(d) ? d : d.data || []))
      .catch(() => setTransacciones([]))
      .finally(() => setCargando(false));
  }, []);

  const badgeColor = (estado: string) => {
    if (estado === 'confirmada') return 'bg-green-100 text-green-700';
    if (estado === 'discrepancia') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const badgeLabel = (estado: string) => {
    if (estado === 'confirmada') return 'Confirmada';
    if (estado === 'discrepancia') return 'Discrepancia';
    return 'Pendiente';
  };

  if (cargando) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>📋</span> Mis ventas
        </h3>
        {transacciones.length > 0 && (
          <span className="text-xs text-gray-400">
            Últimas {transacciones.length}
          </span>
        )}
      </div>

      {/* Lista */}
      {transacciones.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🌽</p>
          <p className="text-gray-500 text-sm font-medium">
            Aún no tienes ventas registradas
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Tus transacciones con bodegas aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {transacciones.map(txn => (
            <div
              key={txn.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {txn.bodega_nombre}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {txn.volumen_ton} ton ·{' '}
                  ${txn.precio_por_ton?.toLocaleString('es-MX')}/ton ·{' '}
                  {txn.variedad || 'Sin variedad'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {txn.fecha
                    ? new Date(txn.fecha).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                    : '—'}
                </p>
              </div>
              <div className="ml-3 flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                  ${badgeColor(txn.estado_confirmacion)}`}>
                  {badgeLabel(txn.estado_confirmacion)}
                </span>
                {txn.estado_confirmacion === 'pendiente' && (
                  <button
                    onClick={() =>
                      navigate(`/productor/transaccion/${txn.id}/confirmar`)
                    }
                    className="text-xs text-[#1A5C38] underline"
                  >
                    Confirmar →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**PASO 6B — Importar y agregar en el Tablero:**
**ARCHIVO:** `app-bodega/src/pages/productor/DashboardProductorPage.tsx`

**AGREGAR import al inicio:**
```typescript
import HistorialVentasSection from './HistorialVentasSection';
```

**AGREGAR el componente en el JSX al final del contenido principal,
después de las bodegas cercanas:**
```typescript
{/* Historial de ventas */}
<HistorialVentasSection token={token} apiUrl={BASE} />
```

**VERIFICAR:** Tablero del productor → sección "Mis ventas" visible al
final → muestra últimas 5 transacciones con bodega, volumen, precio, fecha
y estado → si está pendiente aparece botón "Confirmar →" que navega a la
pantalla de confirmación.

---

## CORRECCIÓN #7
### Mis disponibilidades activas en Tablero
**TIPO:** 🤖 Agente

**PASO 7A — Crear archivo nuevo:**
**ARCHIVO NUEVO:** `app-bodega/src/pages/productor/MisDisponibilidadesSection.tsx`

```typescript
import { useEffect, useState } from 'react';

interface Disponibilidad {
  id: number;
  variedad_code: string;
  variedad_nombre?: string;
  volumen_estimado_ton: number;
  fecha_disponible_desde: string;
  fecha_disponible_hasta: string;
  activa: boolean;
  municipio: string;
  estado: string;
}

interface Props {
  token: string;
  apiUrl: string;
  onActualizar: () => void;
}

export default function MisDisponibilidadesSection({
  token, apiUrl, onActualizar
}: Props) {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const cargar = () => {
    fetch(`${apiUrl}/productor/disponibilidad`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setDisponibilidades(Array.isArray(d) ? d : d.data || []))
      .catch(() => setDisponibilidades([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta disponibilidad?')) return;
    setCancelando(id);
    try {
      await fetch(`${apiUrl}/productor/disponibilidad/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      cargar();
      onActualizar();
    } catch (_) {
      alert('Error al cancelar. Intenta de nuevo.');
    } finally {
      setCancelando(null);
    }
  };

  if (cargando) {
    return (
      <div className="h-20 bg-gray-100 rounded-xl animate-pulse mt-4" />
    );
  }

  if (disponibilidades.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌽</span>
        <h3 className="font-semibold text-green-800">
          Mi disponibilidad activa
        </h3>
        <span className="ml-auto bg-green-200 text-green-800 text-xs
          font-bold px-2 py-0.5 rounded-full">
          {disponibilidades.length} activa{disponibilidades.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {disponibilidades.map(disp => (
          <div
            key={disp.id}
            className="bg-white rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              {/* Variedad y volumen */}
              <p className="font-semibold text-gray-800 text-sm">
                {disp.variedad_nombre || disp.variedad_code}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {disp.volumen_estimado_ton} toneladas ·{' '}
                {disp.municipio}, {disp.estado}
              </p>
              {/* Ventana de venta */}
              {disp.fecha_disponible_desde && (
                <p className="text-xs text-gray-400 mt-1">
                  Disponible:{' '}
                  {new Date(disp.fecha_disponible_desde)
                    .toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short'
                    })}{' '}
                  —{' '}
                  {new Date(disp.fecha_disponible_hasta)
                    .toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </p>
              )}
            </div>
            {/* Botón cancelar */}
            <button
              onClick={() => cancelar(disp.id)}
              disabled={cancelando === disp.id}
              className="text-xs text-red-500 hover:text-red-700
                disabled:opacity-50 whitespace-nowrap mt-1"
            >
              {cancelando === disp.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-green-600 mt-3 text-center">
        Las bodegas de tu región pueden ver esta información de forma agregada
      </p>
    </div>
  );
}
```

**PASO 7B — Importar y agregar en el Tablero:**
**ARCHIVO:** `app-bodega/src/pages/productor/DashboardProductorPage.tsx`

**AGREGAR import:**
```typescript
import MisDisponibilidadesSection from './MisDisponibilidadesSection';
```

**AGREGAR en el JSX, justo debajo del botón "Tengo maíz disponible":**
```typescript
{/* Disponibilidades activas */}
<MisDisponibilidadesSection
  token={token}
  apiUrl={BASE}
  onActualizar={() => cargarDashboard()}
/>
```

**VERIFICAR:** Productor declara disponibilidad → vuelve al Tablero →
sección "Mi disponibilidad activa" aparece en verde con su declaración →
botón "Cancelar" elimina la disponibilidad y la sección desaparece si
no quedan más activas.

---

## CORRECCIÓN #8
### Semáforo y botón "Cómo llegar" en detalle de bodega
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/DetalleBodegaPage.tsx`

**PASO 8A — Agregar semáforo visible**

**BUSCAR donde se muestra el nombre y ubicación de la bodega:**
```typescript
<h1 className="...">{bodega.nombre}</h1>
<div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
  <MapPin size={14} /> {bodega.municipio}, {bodega.estado}
</div>
```

**AGREGAR el semáforo debajo de la ubicación:**
```typescript
{/* Semáforo de compra */}
{bodega.estado_compra && (
  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mt-2 ${
    bodega.estado_compra === 'comprando'
      ? 'bg-green-100 text-green-700'
      : bodega.estado_compra === 'limitado'
      ? 'bg-amber-100 text-amber-700'
      : bodega.estado_compra === 'no_compra'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500'
  }`}>
    <span className={`w-2 h-2 rounded-full ${
      bodega.estado_compra === 'comprando' ? 'bg-green-500'
      : bodega.estado_compra === 'limitado' ? 'bg-amber-500'
      : bodega.estado_compra === 'no_compra' ? 'bg-red-500'
      : 'bg-gray-400'
    }`} />
    {bodega.estado_compra === 'comprando' ? 'Comprando maíz'
      : bodega.estado_compra === 'limitado' ? 'Capacidad limitada'
      : bodega.estado_compra === 'no_compra' ? 'No compra por ahora'
      : 'Sin actividad'}
  </div>
)}
```

**PASO 8B — Agregar botón "Cómo llegar"**

**BUSCAR el botón de llamar a la bodega:**
```typescript
{bodega.telefono && (
  <a href={`tel:${bodega.telefono}`} ...>
    <Phone size={18} /> Llamar a la bodega
  </a>
)}
```

**AGREGAR botón de Google Maps justo antes del botón de llamar:**
```typescript
{/* Botón Cómo llegar — solo si tiene coordenadas */}
{bodega.latitud && bodega.longitud && (
  <a
    href={`https://www.google.com/maps/dir/?api=1&destination=${bodega.latitud},${bodega.longitud}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center gap-2 bg-blue-50
      text-blue-700 border border-blue-200 py-4 rounded-2xl
      font-semibold text-sm w-full mb-3"
  >
    <span>📍</span> Cómo llegar
  </a>
)}
```

**VERIFICAR:** Detalle de bodega → muestra badge de semáforo con color
correcto → botón "Cómo llegar" abre Google Maps con la ubicación de la
bodega como destino → botón solo aparece si la bodega tiene coordenadas.

---

## 🟡 CORRECCIONES ANTES DEL PILOTO

---

## CORRECCIÓN #9
### Filtro por tipo de maíz en mapa de bodegas
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx`

**AGREGAR estado del filtro:**
```typescript
const [filtroTipoMaiz, setFiltroTipoMaiz] = useState<string>('');
```

**MODIFICAR el fetch de bodegas para incluir el filtro:**
```typescript
// ANTES:
fetch(`${BASE}/bodegas?lat=${up.lat}&lng=${up.lng}&radio_km=${radioKm}`)

// DESPUÉS:
const params = new URLSearchParams({
  lat: String(up.lat),
  lng: String(up.lng),
  radio_km: String(radioKm),
  ...(filtroTipoMaiz ? { tipo_maiz: filtroTipoMaiz } : {})
});
fetch(`${BASE}/bodegas?${params.toString()}`)
```

**AGREGAR selector de filtro en el JSX, sobre el mapa:**
```typescript
<div className="flex gap-2 mb-3 overflow-x-auto pb-1">
  {['', 'blanco', 'amarillo', 'criollo'].map(tipo => (
    <button
      key={tipo}
      onClick={() => setFiltroTipoMaiz(tipo)}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
        transition-colors ${filtroTipoMaiz === tipo
          ? 'bg-[#1A5C38] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
      {tipo === '' ? 'Todos' : `Maíz ${tipo}`}
    </button>
  ))}
</div>
```

**VERIFICAR:** Mapa de bodegas → selector de tipo de maíz visible →
al tocar "Maíz blanco" el fetch incluye `&tipo_maiz=blanco` → bodegas
filtradas por tipo.

---

## CORRECCIÓN #10
### Selector de radio más completo en mapa
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx`

**BUSCAR el estado actual del radio:**
```typescript
const [radioKm, setRadioKm] = useState(150);
```

**REEMPLAZAR CON:**
```typescript
const [radioKm, setRadioKm] = useState(100);
```

**BUSCAR el botón de emergencia de 500 km y reemplazar con selector completo:**
```typescript
// BUSCAR:
{radioKm < 500 && <button onClick={() => setRadioKm(500)}>Buscar en 500 km</button>}

// REEMPLAZAR CON selector completo — agregar en el header del mapa:
<div className="flex items-center gap-2 mb-2">
  <span className="text-xs text-gray-500 font-medium">Radio:</span>
  <div className="flex gap-1">
    {[50, 100, 200, 500].map(km => (
      <button
        key={km}
        onClick={() => setRadioKm(km)}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
          radioKm === km
            ? 'bg-[#1A5C38] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {km} km
      </button>
    ))}
  </div>
</div>
```

**VERIFICAR:** Mapa → selector de radio visible con opciones 50/100/200/500 km
→ al cambiar el radio se recargan las bodegas.

---

## CORRECCIÓN #11
### Variedad legible en disponibilidades activas
**TIPO:** 🤖 Agente
**ARCHIVO:** `backend/src/routes/disponibilidad.ts`
**ENDPOINT:** `GET /` — disponibilidades activas del productor

**BUSCAR la query que devuelve las disponibilidades:**
```typescript
SELECT dp.*, u.municipality_name AS municipio, u.state_name AS estado
FROM disponibilidad_productor dp
JOIN up u ON u.up_id = dp.up_id
JOIN producer p ON p.producer_id = dp.producer_id
WHERE p.usuario_id = $1 AND dp.activa = TRUE
ORDER BY dp.created_at DESC
```

**REEMPLAZAR CON — agregar JOIN al catálogo de variedades:**
```typescript
SELECT
  dp.*,
  u.municipality_name AS municipio,
  u.state_name AS estado,
  COALESCE(cv.label, dp.variedad_code) AS variedad_nombre
FROM disponibilidad_productor dp
JOIN up u ON u.up_id = dp.up_id
JOIN producer p ON p.producer_id = dp.producer_id
LEFT JOIN cat_crop_variety cv
  ON cv.code = dp.variedad_code AND cv.is_active = TRUE
WHERE p.usuario_id = $1
  AND dp.activa = TRUE
ORDER BY dp.created_at DESC
```

**VERIFICAR:**
```bash
curl GET /api/productor/disponibilidad \
  -H "Authorization: Bearer TOKEN_PRODUCTOR"
# Resultado esperado: campo "variedad_nombre": "H-40" o "H-48"
# NO solo "MB_H40"
```

---

## CORRECCIÓN #12
### Mapa de ubicación en detalle de bodega
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/DetalleBodegaPage.tsx`

**AGREGAR mapa Leaflet pequeño cuando la bodega tiene coordenadas:**

**AGREGAR imports al inicio del archivo:**
```typescript
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
```

**BUSCAR la sección de ubicación (municipio/estado) y agregar el mapa debajo:**
```typescript
{/* Mapa de ubicación de la bodega */}
{bodega.latitud && bodega.longitud && (
  <div className="rounded-2xl overflow-hidden border border-gray-100 mt-4 mb-4"
    style={{ height: '200px' }}>
    <MapContainer
      center={[bodega.latitud, bodega.longitud]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Esri"
      />
      <Marker position={[bodega.latitud, bodega.longitud]} />
    </MapContainer>
  </div>
)}
```

**VERIFICAR:** Detalle de bodega con coordenadas → mapa estático visible
con marcador en la ubicación exacta → sin controles de zoom para no
confundir con el mapa principal.

---

## CORRECCIÓN #13
### Ventanillas filtradas por distancia del productor
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/VentanillasPage.tsx`

**AGREGAR lectura de coordenadas del productor:**
```typescript
const [coordsProductor, setCoordsProductor] = useState<{
  lat: number; lng: number
} | null>(null);

useEffect(() => {
  // Cargar coordenadas del productor desde el dashboard
  fetch(`${BASE}/productor/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => {
      if (d.lat && d.lng) {
        setCoordsProductor({ lat: d.lat, lng: d.lng });
      }
    })
    .catch(() => {});
}, []);
```

**MODIFICAR el fetch de ventanillas para incluir coordenadas:**
```typescript
// ANTES:
fetch(`${BASE}/infraestructura?is_ventanilla=true`)

// DESPUÉS:
const params = new URLSearchParams({ is_ventanilla: 'true' });
if (coordsProductor) {
  params.set('lat', String(coordsProductor.lat));
  params.set('lng', String(coordsProductor.lng));
  params.set('radio_km', '200');
}
fetch(`${BASE}/infraestructura?${params.toString()}`)
```

**VERIFICAR:** Pantalla de ventanillas → carga solo las ventanillas
en radio de 200 km del productor → si no tiene coordenadas muestra
todas (comportamiento actual como fallback).

---

## 👨‍💻 CORRECCIÓN #14 — ACCIÓN MANUAL DEL PROGRAMADOR
### POSTGIS en servidor + Migración v19
**URGENCIA:** 🔴 Antes de lanzar

**14A — Verificar y activar POSTGIS:**
```bash
# Conectarse al servidor
ssh usuario@IP_SERVIDOR

# Verificar POSTGIS_ENABLED en .env real
grep POSTGIS_ENABLED /ruta/proyecto/backend/.env
# Si no aparece:
echo "POSTGIS_ENABLED=true" >> /ruta/proyecto/backend/.env

# Verificar PostGIS instalado
psql -U jesus -d bodegas -c "SELECT PostGIS_version();"
# Si da error:
sudo apt-get install postgresql-15-postgis-3
psql -U postgres -d bodegas -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Reiniciar servidor
pm2 restart simac-backend
```

**14B — Ejecutar migración v19:**
```bash
cd /ruta/al/proyecto
git pull origin main
psql -U jesus -d bodegas \
  -f backend/migrations/migrate_v19_semaforo_default.sql

# Verificar
psql -U jesus -d bodegas -c "
  SELECT semaforo_compra, COUNT(*)
  FROM bodegas GROUP BY semaforo_compra;
"
# Esperado: sin_actividad | N
```

**14C — Verificar distancias con productor de prueba:**
```bash
psql -U jesus -d bodegas -c "
  SELECT municipality_name, centroid_source,
         location_confirmed, ST_AsText(centroid) AS coordenadas
  FROM up ORDER BY created_at DESC LIMIT 1;
"
# Esperado:
# centroid_source   : productor
# location_confirmed: true
# coordenadas       : POINT(-107.394 24.796)
```

---

## CHECKLIST FINAL

```
🤖 AGENTE — Lanzamiento:
□ #1 — Servicios $0 → "Sin tarifario activo"
□ #2 — Gráfica vacía → "Historial en construcción"
□ #3 — Notificaciones con polling 30s
□ #4 — Tarifario con filtro 90 días
□ #5 — GET /transacciones filtra por productor
□ #6 — Sección "Mis ventas" en Tablero
□ #7 — Sección "Mi disponibilidad activa" en Tablero
□ #8 — Semáforo + botón "Cómo llegar" en detalle bodega

🤖 AGENTE — Piloto:
□ #9  — Filtro tipo de maíz en mapa
□ #10 — Selector radio 50/100/200/500 km
□ #11 — Variedad legible en disponibilidades
□ #12 — Mapa en detalle de bodega
□ #13 — Ventanillas filtradas por distancia

👨‍💻 PROGRAMADOR — Servidor:
□ #14 — POSTGIS_ENABLED=true en .env real
□ #14 — PostGIS instalado en PostgreSQL
□ #14 — Migración v19 ejecutada
□ #14 — pm2 restart después de cambios

✅ VERIFICACIÓN FINAL:
□ Tablero productor → sección "Mis ventas" visible
□ Tablero productor → sección "Mi disponibilidad activa" visible
□ Detalle bodega → semáforo con color correcto
□ Detalle bodega → botón "Cómo llegar" abre Google Maps
□ Transacciones del productor → lista con sus ventas reales
□ Disponibilidad → puede cancelar desde el Tablero
□ Bodegas en mapa → semáforo gris/sin actividad (migración v19)
□ Productor de prueba con polígono → distancias reales en app
```

---

*SIMAC Plan Nacional Maíz 2026 · Correcciones Completas del Productor*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
