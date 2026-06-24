# SIMAC — Correcciones V7
**Fecha:** 2026-06-23
**Módulos afectados:** Productor — Ciclos productivos / Auth
**Correcciones incluidas:**
- C7 — Fix bug INACTIVO_PADRON + useEffect en RegistroNuevoPage
- C8 — Cancelar ciclo productivo (estado_ciclo = 'cancelado')
- C9 — Editar cultivo dentro de un ciclo existente

---

## C7 — Fix bug INACTIVO_PADRON + useEffect

### Contexto
Dos bugs detectados en pruebas del flujo de registro manual:

**Bug 1:** Cuando `consultar-curp` responde con código `INACTIVO_PADRON` (HTTP 403), el frontend mostraba un error bloqueante sin ofrecer salida al productor. Solo `NO_EN_PADRON` redirigía al modo manual — `INACTIVO_PADRON` quedaba atrapado.

**Bug 2:** Al navegar desde `/registro-nuevo` (Paso 1) hacia `/registro-nuevo?modo=manual&curp=XXX` (misma ruta, distintos query params), React Router no desmonta el componente, por lo que el `useEffect([])` no se re-ejecutaba y el salto al Paso 2 nunca ocurría.

### Archivo a modificar
**`app-bodega/src/pages/auth/RegistroNuevoPage.tsx`**

### Cambio 1 — Manejar INACTIVO_PADRON como ruta al modo manual

Localizar el bloque donde se maneja la respuesta de `consultar-curp` cuando `!res.ok` (línea ~156):

```typescript
// ANTES:
if (!res.ok) {
  setError(data.error || 'No se pudo verificar la CURP.');
  return;
}

// DESPUÉS:
if (!res.ok) {
  if (data.codigo === 'NO_EN_PADRON' || data.codigo === 'INACTIVO_PADRON') {
    navigate(`/registro-nuevo?modo=manual&curp=${curp.toUpperCase().trim()}`);
    return;
  }
  setError(data.error || 'No se pudo verificar la CURP.');
  return;
}
```

### Cambio 2 — Agregar esModoManual como dependencia del useEffect

Localizar el `useEffect` que controla el salto al Paso 2 en modo manual (línea ~181):

```typescript
// ANTES:
useEffect(() => {
  if (!esModoManual) return;
  if (curpDesdeActivar) setCurp(curpDesdeActivar);
  cargarEstados();
  setPaso(2);
}, []); // ← no reacciona a cambios de URL en la misma ruta

// DESPUÉS:
useEffect(() => {
  if (!esModoManual) return;
  if (curpDesdeActivar) setCurp(curpDesdeActivar);
  cargarEstados();
  setPaso(2);
}, [esModoManual]); // ← reacciona cuando React Router cambia los query params
```

### Comportamiento esperado después del cambio

| Código backend | HTTP | Antes | Después |
|---------------|------|-------|---------|
| `NO_EN_PADRON` | 404 | Redirigía a modo manual ✅ | Sin cambio ✅ |
| `INACTIVO_PADRON` | 403 | Error bloqueante ❌ | Redirige a modo manual ✅ |
| `CURP_DUPLICADA` | 409 | Error bloqueante ✅ | Sin cambio ✅ |
| `SADER_NO_DISPONIBLE` | 503 | Error bloqueante ✅ | Sin cambio ✅ |

### Checklist C7
- [ ] Bloque `if (!res.ok)` actualizado con condición para `INACTIVO_PADRON`
- [ ] Dependencia del `useEffect` cambiada de `[]` a `[esModoManual]`
- [ ] Probar con CURP inactiva en padrón → debe redirigir al formulario manual ✅
- [ ] Probar con CURP no existente → sigue funcionando como antes ✅
- [ ] Probar con CURP duplicada → sigue mostrando error bloqueante ✅

---

## C8 — Cancelar ciclo productivo

### Contexto
La auditoría confirmó que no existe endpoint para cambiar el `estado_ciclo` de un ciclo, y las tarjetas de ciclos en `CicloProductivoPage.tsx` son divs estáticos sin acciones. El productor no puede cancelar un ciclo registrado por error.

La cancelación **no elimina el registro de la DB** — cambia `estado_ciclo` a `'cancelado'` y el ciclo deja de aparecer en la lista activa. El historial queda intacto para auditoría.

### 1. Backend — Nuevo endpoint

**Archivo:** `backend/src/routes/cycles.ts`

Agregar al final del archivo, antes del `export default router`:

```typescript
// PATCH /api/cycles/:cycle_id/estado
// Cambia el estado de un ciclo: activo | cosechado | cancelado
router.patch('/:cycle_id/estado', authMiddleware, async (req, res) => {
  try {
    const { cycle_id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['activo', 'cosechado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    // Verificar que el ciclo pertenece a un productor del usuario autenticado
    const check = await pool.query(
      `SELECT c.cycle_id
       FROM cycle c
       JOIN up u ON u.up_id = c.up_id
       JOIN producer p ON p.producer_id = u.producer_id
       JOIN usuarios usr ON usr.id = p.usuario_id
       WHERE c.cycle_id = $1 AND usr.id = $2`,
      [cycle_id, (req as any).user?.id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: 'Ciclo no encontrado o sin permiso' });
    }

    const result = await pool.query(
      `UPDATE cycle
       SET estado_ciclo = $1
       WHERE cycle_id = $2
       RETURNING cycle_id, estado_ciclo`,
      [estado, cycle_id]
    );

    return res.json({
      ok: true,
      cycle_id: result.rows[0].cycle_id,
      estado_ciclo: result.rows[0].estado_ciclo
    });
  } catch (error) {
    console.error('Error al actualizar estado del ciclo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});
```

> **Nota:** Verificar cómo se accede al `user.id` del token en este proyecto — puede ser `req.user?.id`, `req.usuario?.id` o similar. Revisar cómo lo usan los otros endpoints de `cycles.ts` y usar el mismo patrón.

### 2. Frontend — CicloProductivoPage.tsx

#### Cambio 1 — Agregar estado para el modal de confirmación

Buscar donde están los `useState` del componente y agregar:

```typescript
const [cicloACancelar, setCicloACancelar] = useState<number | null>(null);
const [cancelando, setCancelando] = useState(false);
```

#### Cambio 2 — Agregar función para cancelar ciclo

Agregar antes del `return` del componente:

```typescript
const handleCancelarCiclo = async () => {
  if (!cicloACancelar) return;
  setCancelando(true);
  try {
    const res = await fetch(`${BASE}/cycles/${cicloACancelar}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: 'cancelado' })
    });

    if (res.ok) {
      // Remover el ciclo cancelado de la lista local sin recargar
      setCiclosExistentes(prev =>
        prev.filter(c => c.cycle_id !== cicloACancelar)
      );
    }
  } catch (error) {
    console.error('Error al cancelar ciclo:', error);
  } finally {
    setCancelando(false);
    setCicloACancelar(null);
  }
};
```

#### Cambio 3 — Actualizar las tarjetas de ciclos para mostrar botón de cancelar

Localizar el bloque `ciclosExistentes.map` (líneas ~319–356) donde se renderizan las tarjetas. Reemplazar el `<div>` estático por una tarjeta con botón de cancelar:

```tsx
{ciclosExistentes.map((ciclo) => (
  <div key={ciclo.cycle_id}
    className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-4">

    {/* Contenido existente — sin cambios */}
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="font-black text-[15px] text-slate-800">
          {ciclo.cycle_type === 'PV'    ? 'Primavera-Verano' :
           ciclo.cycle_type === 'OI'    ? 'Otoño-Invierno'   :
           ciclo.cycle_type === 'ANUAL' ? 'Ciclo Anual'      :
           ciclo.cycle_type} {ciclo.cycle_year}
        </p>
        {/* variedad · superficie */}
        {ciclo.variety && (
          <p className="text-[12px] text-slate-500 mt-0.5 font-medium">
            {ciclo.variety} · {ciclo.area_sown_ha} ha
          </p>
        )}
        {/* tipo de riego */}
        {ciclo.tipo_riego && (
          <p className="text-[12px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
            {ciclo.tipo_riego === 'riego'
              ? <><Droplets size={13} className="text-[#1A5C38]" /> Riego</>
              : <><CloudRain size={13} className="text-[#1A5C38]" /> Temporal</>}
          </p>
        )}
      </div>

      {/* Badge de estado */}
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full
        ${ciclo.estado_ciclo === 'activo'    ? 'bg-green-100 text-green-700'   :
          ciclo.estado_ciclo === 'cosechado' ? 'bg-blue-100 text-blue-700'     :
                                               'bg-slate-100 text-slate-500'}`}>
        {ciclo.estado_ciclo === 'activo'    ? 'Activo'    :
         ciclo.estado_ciclo === 'cosechado' ? 'Cosechado' : 'Cancelado'}
      </span>
    </div>

    {/* Botón cancelar — solo visible en ciclos activos */}
    {ciclo.estado_ciclo === 'activo' && (
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onClick={() => setCicloACancelar(ciclo.cycle_id)}
          className="text-[12px] text-red-500 font-medium flex items-center gap-1
                     active:opacity-60 transition-opacity">
          <X size={13} /> Cancelar ciclo
        </button>
      </div>
    )}
  </div>
))}
```

> **Nota para Jesus:** El ícono `X` viene de `lucide-react` — importar junto a los demás íconos del archivo si no está ya.

#### Cambio 4 — Agregar modal de confirmación antes del cierre del return

Agregar justo antes del último `</div>` del `return`:

```tsx
{/* Modal de confirmación para cancelar ciclo */}
{cicloACancelar && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
    <div className="bg-white w-full rounded-t-[20px] px-5 pt-5 pb-8 space-y-4">
      {/* Handle */}
      <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />

      <div className="flex items-center gap-2">
        <AlertCircle size={20} className="text-red-500" />
        <h2 className="font-bold text-slate-800 text-[16px]">
          ¿Cancelar este ciclo?
        </h2>
      </div>

      <p className="text-[13px] text-slate-600 leading-relaxed">
        El ciclo quedará cancelado y no aparecerá en tu lista activa.
        Tu información no se borrará — quedará guardada en el sistema.
      </p>

      <button
        type="button"
        onClick={handleCancelarCiclo}
        disabled={cancelando}
        className="w-full bg-red-500 text-white font-bold text-[15px] py-4
                   rounded-[14px] active:scale-95 transition-all
                   disabled:opacity-60">
        {cancelando ? 'Cancelando...' : 'Sí, cancelar ciclo'}
      </button>

      <button
        type="button"
        onClick={() => setCicloACancelar(null)}
        disabled={cancelando}
        className="w-full border border-slate-200 text-slate-600 font-medium
                   text-[14px] py-3 rounded-[14px] active:scale-95 transition-all">
        No, mantener ciclo
      </button>
    </div>
  </div>
)}
```

> **Nota para Jesus:** `AlertCircle` viene de `lucide-react` — verificar que esté importado en el archivo.

### Checklist C8
- [ ] Endpoint `PATCH /api/cycles/:cycle_id/estado` agregado en `cycles.ts`
- [ ] Verificar que el patrón de acceso a `user.id` es correcto según el proyecto
- [ ] Estado `cicloACancelar` y `cancelando` agregados en `CicloProductivoPage.tsx`
- [ ] Función `handleCancelarCiclo` agregada
- [ ] Botón "Cancelar ciclo" visible solo en tarjetas con `estado_ciclo === 'activo'`
- [ ] Modal de confirmación agregado al final del return
- [ ] Ícono `X` y `AlertCircle` importados de lucide-react
- [ ] Probar: dar clic en "Cancelar ciclo" → aparece modal de confirmación ✅
- [ ] Probar: confirmar cancelación → ciclo desaparece de la lista sin recargar página ✅
- [ ] Probar: ciclos cosechados → no muestran botón de cancelar ✅
- [ ] Verificar en DB que el ciclo cancelado tiene `estado_ciclo = 'cancelado'` ✅

---

## C9 — Editar cultivo dentro de un ciclo existente

### Contexto
La auditoría confirmó que `PATCH /api/cycle-crops/:id` ya existe en el backend y permite editar todos los campos del cultivo. Lo que falta es el frontend — un botón de editar en cada tarjeta de ciclo que abra un formulario con los datos actuales para modificarlos.

Los campos editables son los de la tabla `cycle_crop`:
`variety_id`, `variety_other`, `area_sown_ha`, `planting_date`, `estimated_harvest_date`, `yield_expected`, `destination`.

Los campos del ciclo padre (`cycle_type`, `cycle_year`, `tipo_riego`) **no son editables** en esta fase — no hay endpoint para modificarlos y cambiarlos podría generar inconsistencias en el historial.

### Archivo a modificar
**`app-bodega/src/pages/productor/CicloProductivoPage.tsx`**

#### Cambio 1 — Agregar estados para el modo edición

```typescript
const [cicloEditando, setCicloEditando] = useState<any | null>(null);
const [formEdicion, setFormEdicion] = useState<any | null>(null);
const [guardandoEdicion, setGuardandoEdicion] = useState(false);
const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
```

#### Cambio 2 — Agregar función para abrir el modo edición

```typescript
const handleAbrirEdicion = (ciclo: any) => {
  setCicloEditando(ciclo);
  // Pre-llenar el formulario con los datos actuales del cultivo
  setFormEdicion({
    variety_id:             ciclo.variety_id            ?? '',
    variety_other:          ciclo.variety_other         ?? '',
    area_sown_ha:           ciclo.area_sown_ha          ?? '',
    planting_date:          ciclo.planting_date
                              ? ciclo.planting_date.slice(0, 10)
                              : '',
    estimated_harvest_date: ciclo.estimated_harvest_date
                              ? ciclo.estimated_harvest_date.slice(0, 10)
                              : '',
    yield_expected:         ciclo.yield_expected        ?? '',
    destination:            ciclo.destination           ?? '',
  });
  setErrorEdicion(null);
};
```

#### Cambio 3 — Agregar función para guardar la edición

```typescript
const handleGuardarEdicion = async () => {
  if (!cicloEditando?.cycle_crop_id) return;
  setGuardandoEdicion(true);
  setErrorEdicion(null);

  try {
    const res = await fetch(`${BASE}/cycle-crops/${cicloEditando.cycle_crop_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        variety_id:             formEdicion.variety_id             || null,
        variety_other:          formEdicion.variety_other          || null,
        area_sown_ha:           Number(formEdicion.area_sown_ha)   || null,
        planting_date:          formEdicion.planting_date          || null,
        estimated_harvest_date: formEdicion.estimated_harvest_date || null,
        yield_expected:         formEdicion.yield_expected
                                  ? Number(formEdicion.yield_expected)
                                  : null,
        destination:            formEdicion.destination            || null,
      })
    });

    if (!res.ok) {
      const data = await res.json();
      setErrorEdicion(data.error || 'No se pudo guardar. Intenta de nuevo.');
      return;
    }

    // Actualizar la lista local con los nuevos datos sin recargar
    setCiclosExistentes(prev =>
      prev.map(c =>
        c.cycle_crop_id === cicloEditando.cycle_crop_id
          ? { ...c, ...formEdicion }
          : c
      )
    );

    setCicloEditando(null);
    setFormEdicion(null);
  } catch {
    setErrorEdicion('Error de conexión. Intenta de nuevo.');
  } finally {
    setGuardandoEdicion(false);
  }
};
```

#### Cambio 4 — Agregar botón "Editar" en cada tarjeta de ciclo

En el mismo bloque de tarjetas actualizado en C8, agregar el botón de editar junto al de cancelar:

```tsx
{/* Botones de acción — solo en ciclos activos */}
{ciclo.estado_ciclo === 'activo' && (
  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
    <button
      type="button"
      onClick={() => handleAbrirEdicion(ciclo)}
      className="text-[12px] text-[#1A5C38] font-medium flex items-center gap-1
                 active:opacity-60 transition-opacity">
      <Pencil size={13} /> Editar cultivo
    </button>
    <button
      type="button"
      onClick={() => setCicloACancelar(ciclo.cycle_id)}
      className="text-[12px] text-red-500 font-medium flex items-center gap-1
                 active:opacity-60 transition-opacity">
      <X size={13} /> Cancelar ciclo
    </button>
  </div>
)}
```

> **Nota para Jesus:** El ícono `Pencil` viene de `lucide-react` — importar junto a los demás.

#### Cambio 5 — Agregar panel de edición como bottom sheet

Agregar después del modal de confirmación de cancelar (C8), antes del cierre del `return`:

```tsx
{/* Panel de edición de cultivo */}
{cicloEditando && formEdicion && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
    <div className="bg-white w-full rounded-t-[20px] px-5 pt-5 pb-8
                    max-h-[90vh] overflow-y-auto space-y-4">

      {/* Handle */}
      <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-[16px]">Editar cultivo</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {cicloEditando.cycle_type === 'PV'    ? 'Primavera-Verano' :
             cicloEditando.cycle_type === 'OI'    ? 'Otoño-Invierno'   :
             'Ciclo Anual'} {cicloEditando.cycle_year}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setCicloEditando(null); setFormEdicion(null); }}
          className="text-slate-400 active:opacity-60">
          <X size={20} />
        </button>
      </div>

      {/* Superficie sembrada */}
      <div>
        <label className="text-[13px] font-bold text-slate-700 mb-1 block">
          Superficie sembrada (ha)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={formEdicion.area_sown_ha}
          onChange={e => setFormEdicion((f: any) => ({ ...f, area_sown_ha: e.target.value }))}
          className="w-full border border-slate-200 rounded-[10px] px-3 py-2.5
                     text-[14px] text-slate-700 focus:outline-none
                     focus:border-[#1A5C38] transition-colors"
        />
      </div>

      {/* Fecha de siembra */}
      <div>
        <label className="text-[13px] font-bold text-slate-700 mb-1 block">
          Fecha de siembra
        </label>
        <input
          type="date"
          value={formEdicion.planting_date}
          onChange={e => setFormEdicion((f: any) => ({ ...f, planting_date: e.target.value }))}
          className="w-full border border-slate-200 rounded-[10px] px-3 py-2.5
                     text-[14px] text-slate-700 focus:outline-none
                     focus:border-[#1A5C38] transition-colors"
        />
      </div>

      {/* Fecha estimada de cosecha */}
      <div>
        <label className="text-[13px] font-bold text-slate-700 mb-1 block">
          Fecha estimada de cosecha
          <span className="text-slate-400 font-normal ml-1">(opcional)</span>
        </label>
        <input
          type="date"
          value={formEdicion.estimated_harvest_date}
          onChange={e => setFormEdicion((f: any) => ({
            ...f, estimated_harvest_date: e.target.value
          }))}
          className="w-full border border-slate-200 rounded-[10px] px-3 py-2.5
                     text-[14px] text-slate-700 focus:outline-none
                     focus:border-[#1A5C38] transition-colors"
        />
      </div>

      {/* Rendimiento esperado */}
      <div>
        <label className="text-[13px] font-bold text-slate-700 mb-1 block">
          Rendimiento esperado (ton/ha)
          <span className="text-slate-400 font-normal ml-1">(opcional)</span>
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={formEdicion.yield_expected}
          onChange={e => setFormEdicion((f: any) => ({ ...f, yield_expected: e.target.value }))}
          className="w-full border border-slate-200 rounded-[10px] px-3 py-2.5
                     text-[14px] text-slate-700 focus:outline-none
                     focus:border-[#1A5C38] transition-colors"
        />
      </div>

      {/* Destino de la cosecha */}
      <div>
        <label className="text-[13px] font-bold text-slate-700 mb-1 block">
          Destino de la cosecha
          <span className="text-slate-400 font-normal ml-1">(opcional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['bodega', 'autoconsumo', 'venta_directa', 'otro'].map(dest => (
            <button
              key={dest}
              type="button"
              onClick={() => setFormEdicion((f: any) => ({ ...f, destination: dest }))}
              className={`py-2.5 px-3 rounded-[10px] border-2 text-[12px] font-bold
                transition-all active:scale-95
                ${formEdicion.destination === dest
                  ? 'border-[#1A5C38] bg-[#1A5C38]/5 text-[#1A5C38]'
                  : 'border-slate-200 text-slate-600'}`}>
              {dest === 'bodega'        ? '🏪 Bodega'         :
               dest === 'autoconsumo'  ? '🏠 Autoconsumo'    :
               dest === 'venta_directa'? '🤝 Venta directa'  :
               '📦 Otro'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {errorEdicion && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] p-3">
          <p className="text-red-600 text-[12px] font-medium">{errorEdicion}</p>
        </div>
      )}

      {/* Botón guardar */}
      <button
        type="button"
        onClick={handleGuardarEdicion}
        disabled={guardandoEdicion}
        className="w-full bg-[#1A5C38] text-white font-bold text-[15px] py-4
                   rounded-[14px] active:scale-95 transition-all
                   disabled:opacity-60 mt-2">
        {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
      </button>

    </div>
  </div>
)}
```

### Checklist C9
- [ ] Estados `cicloEditando`, `formEdicion`, `guardandoEdicion`, `errorEdicion` agregados
- [ ] Función `handleAbrirEdicion` agregada
- [ ] Función `handleGuardarEdicion` agregada y apunta a `PATCH /cycle-crops/:id`
- [ ] Botón "Editar cultivo" visible en tarjetas con `estado_ciclo === 'activo'`
- [ ] Ícono `Pencil` importado de lucide-react
- [ ] Bottom sheet de edición muestra los datos actuales del ciclo pre-llenados
- [ ] Probar: abrir edición → campos muestran valores actuales ✅
- [ ] Probar: modificar superficie y guardar → tarjeta se actualiza sin recargar ✅
- [ ] Probar: modificar fecha de siembra → se guarda correctamente en DB ✅
- [ ] Probar: cerrar sin guardar → no hay cambios ✅
- [ ] Verificar en DB que `PATCH /cycle-crops/:id` actualiza los campos correctos ✅
- [ ] Verificar que el panel de edición no interfiere con el modal de cancelar (C8) ✅

---

## Resumen de cambios por archivo

| Archivo | Tipo de cambio | Corrección |
|---------|---------------|------------|
| `app-bodega/src/pages/auth/RegistroNuevoPage.tsx` | Fix manejo INACTIVO_PADRON + dependencia useEffect | C7 |
| `backend/src/routes/cycles.ts` | Nuevo endpoint PATCH /:cycle_id/estado | C8 |
| `app-bodega/src/pages/productor/CicloProductivoPage.tsx` | Botón cancelar + modal confirmación | C8 |
| `app-bodega/src/pages/productor/CicloProductivoPage.tsx` | Botón editar + bottom sheet edición | C9 |

## Orden de implementación recomendado
1. **C7** — dos líneas de cambio, verificar primero que el bug está resuelto
2. **C8 backend** — endpoint nuevo en cycles.ts
3. **C8 frontend** — botón cancelar + modal en CicloProductivoPage
4. **C9** — botón editar + bottom sheet en CicloProductivoPage
5. Probar flujo completo: editar → guardar → cancelar → confirmar

## Sin nuevas migraciones de DB
Las tres correcciones usan estructuras existentes. `estado_ciclo` ya existe en la tabla `cycle` desde migrate_v18. `PATCH /cycle-crops/:id` ya existe en el backend. No se requieren migraciones nuevas.
