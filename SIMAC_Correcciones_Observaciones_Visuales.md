# SIMAC — Correcciones Observaciones y Pendientes
## Correcciones visuales + fixes de auditoría
**Plan Nacional Maíz 2026 · Junio 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar en orden

> Incluye las correcciones pendientes de la última verificación
> más los errores detectados en pruebas visuales del sistema.

---

## ÍNDICE

| # | Corrección | Tipo | Urgencia |
|---|---|---|---|
| 1 | Selector visual "mapa vs caminata" en DibujarPoligonoUP | 🤖 Agente | 🔴 Lanzamiento |
| 2 | "Mis parcelas" en lugar de "Mi parcela" | 🤖 Agente | 🔴 Lanzamiento |
| 3 | Lista de estados/municipios en AgregarUPPage | 🤖 Agente | 🔴 Lanzamiento |
| 4 | Precio mínimo en propuesta de venta | 🤖 Agente + 👨‍💻 Programador | 🔴 Lanzamiento |
| 5 | Múltiples propuestas de venta — no blanquear todas | 🤖 Agente | 🔴 Lanzamiento |
| 6 | Selector de UP en ciclo productivo | 🤖 Agente | 🔴 Lanzamiento |
| 7 | Ventanilla — solicitud no se envía | 🤖 Agente | 🔴 Lanzamiento |
| 8 | Notificación de transacción lleva a confirmación | 🤖 Agente | 🔴 Lanzamiento |
| 9 | Señal de compra con pestañas "Me interesa / No me interesa" | 🤖 Agente | 🔴 Lanzamiento |

---

## CORRECCIÓN #1
### Selector visual "En el mapa" vs "Caminando" en DibujarPoligonoUP
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/components/productor/DibujarPoligonoUP.tsx`

**PROBLEMA:** El modo GPS existe (`addPointGPS`) pero el productor
no sabe que puede usarlo — no hay selector visual antes de empezar.

**BUSCAR el estado idle del componente — donde no se ha empezado
a dibujar todavía. Puede ser una condición como:**
```typescript
{estado === 'idle' && (...)}
// o
{!dibujando && vertices.length === 0 && (...)}
```

**AGREGAR selector de modo en ese bloque:**
```typescript
{/* Selector de modo — visible antes de empezar */}
<div className="absolute bottom-24 left-4 right-4 z-[1000]
  bg-white rounded-2xl shadow-lg p-4">
  <p className="text-sm font-semibold text-gray-800 mb-3 text-center">
    ¿Cómo quieres dibujar tu parcela?
  </p>
  <div className="grid grid-cols-2 gap-3 mb-4">
    {/* Modo manual */}
    <button
      onClick={() => startDraw()}
      className="p-4 rounded-xl border-2 border-[#1A5C38]
        bg-green-50 text-center active:scale-95 transition-transform"
    >
      <span className="text-2xl block mb-1">👆</span>
      <p className="text-sm font-semibold text-gray-800">En el mapa</p>
      <p className="text-xs text-gray-500 mt-0.5">
        Toca cada esquina en la pantalla
      </p>
    </button>
    {/* Modo GPS */}
    <button
      onClick={() => iniciarModoGPS()}
      className="p-4 rounded-xl border-2 border-gray-200
        bg-white text-center active:scale-95 transition-transform"
    >
      <span className="text-2xl block mb-1">🚶</span>
      <p className="text-sm font-semibold text-gray-800">Caminando</p>
      <p className="text-xs text-gray-500 mt-0.5">
        Camina por tu parcela con GPS
      </p>
    </button>
  </div>
  {/* Instrucción contextual */}
  <p className="text-xs text-center text-gray-400">
    Elige cómo prefieres registrar los límites de tu parcela
  </p>
</div>
```

**Donde `iniciarModoGPS()` activa el modo GPS que ya existe.
Si la función se llama diferente (ej. `addPointGPS`, `startGPS`),
usar el nombre exacto que ya existe en el componente.**

**VERIFICAR:** Pantalla de dibujo → antes de tocar nada → aparece
selector con dos opciones → "En el mapa" inicia el modo manual →
"Caminando" activa el GPS.

---

## CORRECCIÓN #2
### "Mis parcelas" en lugar de "Mi parcela"
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/MiPerfilPage.tsx`

**BUSCAR:**
```typescript
Mi parcela
```

**REEMPLAZAR CON:**
```typescript
Mis parcelas
```

**VERIFICAR:** Perfil del productor → sección dice "Mis parcelas" con
botón "+ Agregar" visible.

---

## CORRECCIÓN #3
### Lista de estados/municipios en AgregarUPPage
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/AgregarUPPage.tsx`

**PROBLEMA:** Los campos de estado y municipio son inputs de texto
libre. Deben usar el mismo catálogo que el registro inicial.

**BUSCAR el endpoint que devuelve estados en el registro inicial:**
```bash
grep -n "estados\|catalogos\|state" app-bodega/src/pages/auth/RegistroNuevoPage.tsx | head -10
```

**Usar ese mismo endpoint en AgregarUPPage. El patrón típico es:**
```typescript
// AGREGAR estados al componente:
const [estados, setEstados] = useState<any[]>([]);
const [municipios, setMunicipios] = useState<any[]>([]);
const [estadoId, setEstadoId] = useState('');

// AGREGAR fetch de estados al montar:
useEffect(() => {
  fetch(`${BASE}/catalogos/estados`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => setEstados(Array.isArray(d) ? d : d.estados || []))
    .catch(() => {});
}, []);

// AGREGAR fetch de municipios cuando cambia el estado:
useEffect(() => {
  if (!estadoId) return;
  fetch(`${BASE}/catalogos/municipios?estado_id=${estadoId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => setMunicipios(Array.isArray(d) ? d : d.municipios || []))
    .catch(() => {});
}, [estadoId]);
```

**REEMPLAZAR los inputs de texto libre por selectores:**
```typescript
{/* ANTES — input texto libre: */}
<input type="text" value={estadoUp}
  onChange={e => setEstadoUp(e.target.value)}
  placeholder="Ej: Sinaloa" ... />

{/* DESPUÉS — select con catálogo: */}
<select
  value={estadoId}
  onChange={e => {
    const selected = estados.find(s => s.id === e.target.value
      || s.estado_id === e.target.value);
    setEstadoId(e.target.value);
    setEstadoUp(selected?.nombre || selected?.state_name || '');
    setMunicipios([]);
    setMunicipioUp('');
  }}
  className="w-full border border-gray-200 rounded-xl px-4 py-3
    text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
>
  <option value="">Selecciona tu estado</option>
  {estados.map(e => (
    <option key={e.id || e.estado_id} value={e.id || e.estado_id}>
      {e.nombre || e.state_name}
    </option>
  ))}
</select>

{/* Municipio — solo aparece después de seleccionar estado */}
{estadoId && (
  <select
    value={municipioUp}
    onChange={e => setMunicipioUp(e.target.value)}
    className="w-full border border-gray-200 rounded-xl px-4 py-3
      text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
  >
    <option value="">Selecciona tu municipio</option>
    {municipios.map(m => (
      <option key={m.id || m.municipio_id}
        value={m.nombre || m.municipality_name}>
        {m.nombre || m.municipality_name}
      </option>
    ))}
  </select>
)}
```

**NOTA:** Verificar primero cómo se llaman exactamente los endpoints
y campos en `RegistroNuevoPage.tsx` y usar los mismos — no inventar
nombres de endpoints.

**VERIFICAR:** Agregar parcela → selector de estado con lista completa →
al seleccionar estado aparece selector de municipios filtrados →
no hay campos de texto libre.

---

## CORRECCIÓN #4
### Precio mínimo en propuesta de venta
**TIPO:** 🤖 Agente + 👨‍💻 Programador
**URGENCIA:** 🔴 Lanzamiento

**PASO 4A — 👨‍💻 Programador: agregar campo en BD**
```bash
psql -U jesus -d bodegas -c "
ALTER TABLE disponibilidad_productor
  ADD COLUMN IF NOT EXISTS precio_minimo_ton NUMERIC(10,2);
"
```

**PASO 4B — 🤖 Agente: agregar campo en PropuestaVentaPage.tsx**

**AGREGAR estado:**
```typescript
const [precioMinimo, setPrecioMinimo] = useState('');
```

**AGREGAR campo en el paso de datos — entre toneladas y fechas:**
```typescript
{/* Precio mínimo */}
<div className="bg-white rounded-2xl border border-gray-100 p-5">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Precio mínimo por tonelada
    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
  </label>
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2
      text-gray-400 font-medium">$</span>
    <input
      type="number"
      value={precioMinimo}
      onChange={e => setPrecioMinimo(e.target.value)}
      placeholder="Ej: 5000"
      min="0"
      step="50"
      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3
        text-lg focus:outline-none focus:ring-2 focus:ring-[#1A5C38]"
    />
    <span className="absolute right-4 top-1/2 -translate-y-1/2
      text-gray-400 text-sm">MXN/ton</span>
  </div>
  <p className="text-xs text-gray-400 mt-1">
    Las bodegas verán este precio como punto de partida para negociar
  </p>
</div>
```

**AGREGAR en el payload del fetch:**
```typescript
body: JSON.stringify({
  // ... campos existentes
  precio_minimo_ton: precioMinimo ? Number(precioMinimo) : null,
})
```

**PASO 4C — 🤖 Agente: mostrar precio en sección de oferta del bodeguero**

**ARCHIVO:** `app-bodega/src/pages/bodega/B11OfertaTabla.tsx`

**BUSCAR donde se muestran los datos de cada municipio y agregar
el precio mínimo si existe:**
```typescript
{row.precio_minimo_promedio && (
  <p className="text-sm font-semibold text-[#1A5C38] mt-1">
    desde ${Number(row.precio_minimo_promedio)
      .toLocaleString('es-MX')}/ton
  </p>
)}
```

**ARCHIVO:** `backend/src/routes/oferta.ts`

**AGREGAR en la query de municipios el precio mínimo promedio:**
```typescript
ROUND(AVG(dp.precio_minimo_ton) FILTER (
  WHERE dp.precio_minimo_ton IS NOT NULL
), 0) AS precio_minimo_promedio
```

**VERIFICAR:** Propuesta de venta → campo de precio mínimo visible →
ingresar $5,000 → en sección Oferta del bodeguero aparece
"desde $5,000/ton" junto a las toneladas disponibles.

---

## CORRECCIÓN #5
### Múltiples propuestas de venta — no blanquear todas
**TIPO:** 🤖 Agente
**ARCHIVO:** `backend/src/routes/disponibilidad.ts`
**ENDPOINT:** `POST /`

**PROBLEMA:** Al crear una nueva propuesta de venta, el backend
desactiva TODAS las anteriores del productor. Debe desactivar
solo la que tenga la misma variedad en la misma UP.

**BUSCAR el UPDATE que desactiva disponibilidades anteriores:**
```typescript
await pool.query(`
  UPDATE disponibilidad_productor
  SET activa = FALSE
  WHERE producer_id = $1
    AND up_id = $2
    AND activa = TRUE
`, [producer_id, up_id]);
```

**REEMPLAZAR CON — solo desactivar la misma variedad en la misma UP:**
```typescript
await pool.query(`
  UPDATE disponibilidad_productor
  SET activa = FALSE
  WHERE producer_id = $1
    AND up_id = $2
    AND variedad_code = $3
    AND activa = TRUE
`, [producer_id, up_id, variedad_code]);
```

**REGLA DE NEGOCIO CONFIRMADA:**
- Un productor puede tener múltiples propuestas activas
- Siempre que sean de diferente variedad O diferente ciclo
- Solo se desactiva la anterior si tiene la misma variedad en la misma UP

**VERIFICAR:**
```sql
-- Crear propuesta UP1/H-40
-- Crear propuesta UP1/H-48
-- Verificar que ambas están activas:
SELECT variedad_code, activa, up_id
FROM disponibilidad_productor
WHERE producer_id = ID_PRODUCTOR
ORDER BY created_at DESC;
-- Resultado esperado: H-40 activa=TRUE, H-48 activa=TRUE
```

---

## CORRECCIÓN #6
### Selector de UP en ciclo productivo
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/CicloProductivoPage.tsx`

**PROBLEMA:** El componente siempre toma `ups[0]` — si el productor
tiene múltiples UPs el ciclo siempre se asigna a la primera.

**BUSCAR el fetch de UPs que toma solo la primera:**
```typescript
fetch(`${BASE}/mis-ups`, ...)
  .then(d => {
    const up = d.ups?.[0] ?? d[0];  // ← siempre la primera
    if (up) {
      setUpId(up.up_id);
      setAreaHaCalc(up.area_ha_calc);
    }
  })
```

**REEMPLAZAR CON — cargar todas y mostrar selector si hay más de una:**
```typescript
const [todasLasUPs, setTodasLasUPs] = useState<any[]>([]);
const [upSeleccionadaId, setUpSeleccionadaId] = useState<number | null>(null);

// En el fetch:
fetch(`${BASE}/mis-ups`, ...)
  .then(d => {
    const ups = Array.isArray(d) ? d : d.ups || [];
    setTodasLasUPs(ups);

    if (ups.length === 1) {
      // Solo una UP — seleccionar automáticamente
      setUpId(ups[0].up_id);
      setUpSeleccionadaId(ups[0].up_id);
      setAreaHaCalc(ups[0].area_ha_calc);
    }
    // Si hay más de una → mostrar selector
  })
```

**AGREGAR selector de UP en el JSX — antes del formulario del ciclo:**
```typescript
{todasLasUPs.length > 1 && !upSeleccionadaId && (
  <div className="p-4">
    <p className="text-sm font-medium text-gray-700 mb-3">
      ¿En qué parcela es este ciclo?
    </p>
    <div className="space-y-3">
      {todasLasUPs.map(up => (
        <button
          key={up.up_id}
          onClick={() => {
            setUpId(up.up_id);
            setUpSeleccionadaId(up.up_id);
            setAreaHaCalc(up.area_ha_calc);
          }}
          className="w-full bg-white rounded-2xl border border-gray-200
            p-4 text-left hover:border-[#1A5C38] hover:bg-green-50
            transition-colors"
        >
          <p className="font-semibold text-gray-800">{up.up_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {up.municipality_name}, {up.state_name} · {up.area_ha_calc} ha
          </p>
        </button>
      ))}
    </div>
  </div>
)}

{/* Formulario del ciclo — solo visible cuando hay UP seleccionada */}
{(todasLasUPs.length === 1 || upSeleccionadaId) && (
  <div>
    {/* Aquí va el formulario existente de 4 pasos — no modificar */}
  </div>
)}
```

**VERIFICAR:** Productor con 2 UPs → va a Ciclo productivo →
ve selector "¿En qué parcela es este ciclo?" → selecciona una →
formulario aparece → ciclo se guarda con el `up_id` correcto.

---

## CORRECCIÓN #7
### Ventanilla — solicitud no se envía
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**PASO 7A — Auditar el endpoint y el fetch**

**BUSCAR en el frontend el endpoint que llama "Solicitar información":**
```bash
grep -n "solicitar\|apoyo\|ventanilla" app-bodega/src/pages/productor/VentanillasPage.tsx | head -20
```

**BUSCAR el endpoint en el backend:**
```bash
grep -n "solicitar-apoyo\|solicitud" backend/src/routes/productor.ts | head -10
```

**VERIFICAR que el endpoint existe y está montado en index.ts:**
```bash
grep -n "solicitar\|apoyo" backend/src/index.ts
```

**PASO 7B — Corregir el fetch en VentanillasPage.tsx**

**BUSCAR la función que maneja el clic en "Solicitar información":**
```typescript
const solicitarInfo = async (infraId: number, tipo: string) => {
  await fetch(`${BASE}/productor/solicitar-apoyo`, {
    method: 'POST',
    // ...
  });
};
```

**VERIFICAR que incluye todos los campos requeridos y maneja errores:**
```typescript
const solicitarInfo = async (infraId: number, tipo: string) => {
  try {
    const res = await fetch(`${BASE}/productor/solicitar-apoyo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        infraestructura_id: infraId,
        tipo_apoyo: tipo
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error al enviar solicitud.');
      return;
    }

    // Éxito — navegar al estado de solicitud
    navigate(`/productor/solicitud/${data.solicitud_id || data.id}`);

  } catch (_) {
    setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
  }
};
```

**PASO 7C — Notificación a la bodega cuando llega solicitud**

**BUSCAR en `backend/src/routes/productor.ts` el endpoint
`POST /solicitar-apoyo` — verificar si notifica al bodeguero:**

```typescript
// Después de crear la solicitud, agregar notificación si no existe:
const bodegaUsuario = await pool.query(`
  SELECT bb.usuario_id
  FROM bodeguero_bodegas bb
  WHERE bb.bodega_id = $1 AND bb.estatus = 'aprobada'
  LIMIT 1
`, [infraestructura_id]);

if (bodegaUsuario.rows.length > 0) {
  await pool.query(`
    INSERT INTO notificaciones
      (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
    VALUES ($1, 'solicitud_apoyo', $2, $3, 'solicitudes')
  `, [
    bodegaUsuario.rows[0].usuario_id,
    `Un productor solicita información sobre tu ventanilla de apoyo.`,
    solicitud.id
  ]);
}
```

**VERIFICAR:** Productor toca "Solicitar información" →
la solicitud se crea → navega a EstadoSolicitudPage →
bodega recibe notificación tipo `solicitud_apoyo`.

---

## CORRECCIÓN #8
### Notificación de transacción lleva a pantalla de confirmación
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/AlertasPage.tsx`

**PROBLEMA:** Al tocar una notificación de tipo
`confirmacion_transaccion` no lleva a ninguna pantalla.

**BUSCAR el mapa de tipos de notificación en AlertasPage.tsx:**
```typescript
const TIPO_CONFIG: Record<string, {
  label: string; icon: any; ruta: string
}> = {
  senal_compra: { ... },
  interes_bodega_oferta: { ... },
  // ...
};
```

**VERIFICAR que `confirmacion_transaccion` tiene ruta correcta.
Si no existe o la ruta es incorrecta, agregar o corregir:**
```typescript
confirmacion_transaccion: {
  label: 'Transacción pendiente de confirmar',
  icon: ClipboardCheck,
  // La ruta debe incluir el ID de la transacción:
  ruta: '/productor/transaccion'  // se completará con el referencia_id
},
```

**BUSCAR cómo se construye la ruta al tocar una notificación:**
```typescript
// Si la ruta se construye así:
onClick={() => navigate(config.ruta)}

// CORREGIR para incluir el ID:
onClick={() => {
  if (notif.tipo === 'confirmacion_transaccion' && notif.referencia_id) {
    navigate(`/productor/transaccion/${notif.referencia_id}/confirmar`);
  } else {
    navigate(config.ruta);
  }
}}
```

**TAMBIÉN verificar en `backend/src/routes/transacciones.ts` que
cuando se crea la notificación de transacción, el `referencia_id`
es el ID de la transacción:**
```typescript
INSERT INTO notificaciones
  (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
VALUES ($1, 'confirmacion_transaccion', $2, $3, 'transacciones')
--                                               ↑ referencia_id = transaccion.id
```

**VERIFICAR:** Llega notificación "Tienes una transacción pendiente" →
tocar la notificación → navega directo a
`/productor/transaccion/:id/confirmar` con los datos de la transacción.

---

## CORRECCIÓN #9
### Señal de compra — pestañas "Me interesa / No me interesa"
**TIPO:** 🤖 Agente
**ARCHIVO:** `app-bodega/src/pages/productor/AlertasPage.tsx`

**PROBLEMA:** Las notificaciones de tipo `senal_compra` solo muestran
información pero no tienen acciones directas. El productor debe
poder responder desde la notificación misma.

**BUSCAR donde se renderiza cada notificación en AlertasPage.tsx:**
```typescript
{notificaciones.map(notif => (
  <div key={notif.id} className="...">
    {/* contenido de la notificación */}
  </div>
))}
```

**AGREGAR acciones especiales cuando el tipo es `senal_compra`:**
```typescript
{notificaciones.map(notif => (
  <div key={notif.id}
    className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">

    {/* Contenido existente de la notificación */}
    <div className="flex items-start gap-3 mb-3">
      {/* ícono + mensaje — no modificar */}
    </div>

    {/* Acciones especiales para señal de compra */}
    {notif.tipo === 'senal_compra' && !notif.leida && (
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3
        border-t border-gray-100">

        {/* Botón Me interesa */}
        <button
          onClick={async () => {
            try {
              // 1. Registrar interés
              await fetch(
                `${BASE}/senales-compra/${notif.referencia_id}/interes`,
                {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                }
              );

              // 2. Marcar notificación como leída
              await fetch(
                `${BASE}/alertas/notificaciones/${notif.id}/leer`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${token}` }
                }
              );

              // 3. Abrir Google Maps con la dirección de la bodega
              // El mensaje de la notificación contiene lat/lng o dirección
              // Intentar extraer coordenadas del referencia o usar municipio
              if (notif.bodega_lat && notif.bodega_lng) {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${notif.bodega_lat},${notif.bodega_lng}`,
                  '_blank'
                );
              } else if (notif.bodega_municipio) {
                window.open(
                  `https://www.google.com/maps/search/${encodeURIComponent(notif.bodega_municipio)}`,
                  '_blank'
                );
              }

              // 4. Refrescar notificaciones
              cargarNotificaciones();

            } catch (_) {
              alert('Error al registrar tu interés. Intenta de nuevo.');
            }
          }}
          className="flex items-center justify-center gap-2
            bg-[#1A5C38] text-white py-3 rounded-xl
            text-sm font-semibold active:scale-95 transition-transform"
        >
          ✅ Me interesa
        </button>

        {/* Botón No me interesa */}
        <button
          onClick={async () => {
            try {
              // Solo marcar como leída
              await fetch(
                `${BASE}/alertas/notificaciones/${notif.id}/leer`,
                {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              cargarNotificaciones();
            } catch (_) {}
          }}
          className="flex items-center justify-center gap-2
            border border-gray-200 text-gray-600 py-3 rounded-xl
            text-sm font-medium active:scale-95 transition-transform"
        >
          ❌ No me interesa
        </button>
      </div>
    )}

    {/* Para señales ya respondidas — mostrar badge */}
    {notif.tipo === 'senal_compra' && notif.leida && (
      <div className="mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          ✓ Ya respondiste a esta señal
        </span>
      </div>
    )}
  </div>
))}
```

**PASO 9B — Agregar campos de bodega en la notificación**

Para que el botón "Me interesa" pueda abrir Google Maps necesita
las coordenadas o municipio de la bodega. Estas deben estar en la
notificación al momento de crearla.

**ARCHIVO:** `backend/src/routes/senales-compra.ts`

**BUSCAR el INSERT de notificación cuando se crea la señal:**
```typescript
INSERT INTO notificaciones
  (usuario_id, tipo, mensaje, referencia_id, referencia_tipo)
VALUES ($1, 'senal_compra', $2, $3, 'senales_compra')
```

**VERIFICAR que la tabla notificaciones tiene campos para datos extra.
Si no existen, agregar en el mensaje como JSON o texto estructurado.
Si la tabla tiene campo `datos` o `metadata`, usarlo:**

```typescript
// Incluir datos de la bodega para el botón de Maps:
const datosExtra = JSON.stringify({
  bodega_lat: bodega.latitud,
  bodega_lng: bodega.longitud,
  bodega_municipio: bodega.municipio,
  bodega_estado: bodega.estado
});

// En el INSERT agregar datos_extra si existe la columna:
INSERT INTO notificaciones
  (usuario_id, tipo, mensaje, referencia_id, referencia_tipo, datos_extra)
VALUES ($1, 'senal_compra', $2, $3, 'senales_compra', $4)
```

**Si la tabla NO tiene columna `datos_extra`, el programador debe
ejecutar antes:**
```bash
psql -U jesus -d bodegas -c "
ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS datos_extra JSONB;
"
```

**En el frontend, al leer la notificación:**
```typescript
const datosExtra = notif.datos_extra
  ? (typeof notif.datos_extra === 'string'
    ? JSON.parse(notif.datos_extra)
    : notif.datos_extra)
  : {};

// Usar:
datosExtra.bodega_lat
datosExtra.bodega_lng
datosExtra.bodega_municipio
```

**VERIFICAR:** Llega notificación de señal de compra →
muestra dos botones "✅ Me interesa" y "❌ No me interesa" →
"Me interesa" registra el interés Y abre Google Maps con
la bodega como destino → "No me interesa" marca como leída
y la notificación desaparece del contador.

---

## ACCIONES MANUALES DEL PROGRAMADOR

```bash
# Antes de Corrección #4:
psql -U jesus -d bodegas -c "
ALTER TABLE disponibilidad_productor
  ADD COLUMN IF NOT EXISTS precio_minimo_ton NUMERIC(10,2);
"

# Antes de Corrección #9 (si tabla no tiene datos_extra):
psql -U jesus -d bodegas -c "
ALTER TABLE notificaciones
  ADD COLUMN IF NOT EXISTS datos_extra JSONB;
"

# Reiniciar servidor después de cambios en BD:
pm2 restart simac-backend
```

---

## CHECKLIST FINAL

```
🤖 AGENTE:
□ #1 — Selector visual mapa vs caminata en DibujarPoligonoUP
□ #2 — "Mis parcelas" en MiPerfilPage
□ #3 — Selectores de estado/municipio en AgregarUPPage
□ #4B — Campo precio mínimo en PropuestaVentaPage
□ #4C — Precio mínimo visible en B11OfertaTabla
□ #4C — precio_minimo_promedio en query de oferta.ts
□ #5 — Solo desactivar misma variedad+UP en disponibilidad
□ #6 — Selector de UP en CicloProductivoPage
□ #7 — Fix del fetch en VentanillasPage con manejo de errores
□ #7 — Notificación al bodeguero cuando llega solicitud
□ #8 — Notificación transacción navega a /confirmar con ID
□ #9 — Pestañas Me interesa/No me interesa en notificaciones
□ #9 — datos_extra con coords de bodega en INSERT notificación

👨‍💻 PROGRAMADOR:
□ ALTER TABLE disponibilidad_productor ADD precio_minimo_ton
□ ALTER TABLE notificaciones ADD datos_extra JSONB
□ pm2 restart simac-backend
```

---

*SIMAC Plan Nacional Maíz 2026 · Correcciones Observaciones y Pendientes*
*Junio 2026 · Confidencial — Uso interno del equipo de desarrollo*
