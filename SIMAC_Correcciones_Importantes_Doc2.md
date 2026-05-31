# SIMAC — Correcciones Importantes
## Documento 2 de 3 — Antes del Piloto
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar después del Documento 1

> Aplicar estas correcciones DESPUÉS de haber completado y verificado
> todas las correcciones del Documento 1.
> Ninguna de estas es bloqueante para arrancar, pero todas deben
> estar resueltas antes del piloto con usuarios reales.

---

## CORRECCIÓN #1
**ARCHIVO:** `backend/src/routes/admin.ts`
**LÍNEA:** 36
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```typescript
const CODIGO_ADMIN = process.env.ADMIN_REGISTRO_CODIGO || 'SIMAC2026';
```

**CÓDIGO CORRECTO:**
```typescript
const CODIGO_ADMIN = process.env.ADMIN_REGISTRO_CODIGO;
if (!CODIGO_ADMIN) {
  throw new Error('FATAL: ADMIN_REGISTRO_CODIGO no definida en variables de entorno.');
}
```

**CONTEXTO:** El código `'SIMAC2026'` está en los documentos de diseño del proyecto — cualquier persona que los haya leído puede registrar una cuenta de administrador. Sin esta corrección el sistema no tiene control real sobre quién puede ser admin.

**VERIFICAR:** Eliminar `ADMIN_REGISTRO_CODIGO` del `.env` temporalmente → el servidor debe lanzar error fatal al arrancar. Restaurar la variable con un código secreto nuevo que solo conozca el equipo.

---

## CORRECCIÓN #2
**ARCHIVO:** `backend/src/routes/transacciones.ts`
**LÍNEA:** 63
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```typescript
pool.query(
  'SELECT u.id FROM usuarios u JOIN producer p ON p.email = u.email WHERE p.producer_id = $1',
  [producer_id]
)
```

**CÓDIGO CORRECTO:**
```typescript
pool.query(
  'SELECT u.id FROM usuarios u JOIN producer p ON p.usuario_id = u.id WHERE p.producer_id = $1',
  [producer_id]
)
```

**CONTEXTO:** Los productores Tipo A se registran con CURP — no tienen email en la tabla `producer`. El JOIN por `p.email = u.email` nunca encuentra al usuario Tipo A y la notificación de transacción nunca se envía. El JOIN correcto es por `usuario_id` que sí existe para todos los productores con cuenta activa.

**VERIFICAR:** Registrar una transacción donde el productor es Tipo A → la notificación debe aparecer en la campana del productor. Verificar en BD:
```sql
SELECT * FROM notificaciones 
WHERE usuario_id = (SELECT usuario_id FROM producer WHERE producer_id = ID_PRODUCTOR_TIPO_A)
ORDER BY created_at DESC LIMIT 1;
```

---

## CORRECCIÓN #3
**ARCHIVO:** `backend/src/routes/productor.ts`
**LÍNEA:** 523
**ACCIÓN:** REEMPLAZAR — calcular `servicios_promedio` real

**CÓDIGO ACTUAL:**
```typescript
servicios_promedio: 0
```

**CÓDIGO CORRECTO:**
```typescript
// Calcular promedio real de tarifarios activos en los últimos 60 días
const serviciosResult = await pool.query(`
  SELECT COALESCE(AVG(total_por_bodega), 0) AS promedio
  FROM (
    SELECT ts.bodega_id, SUM(ts.precio) AS total_por_bodega
    FROM tarifario_servicios ts
    JOIN bodeguero_bodegas bb ON bb.bodega_id = ts.bodega_id
    WHERE ts.updated_at >= NOW() - INTERVAL '60 days'
      AND ts.activo = true
    GROUP BY ts.bodega_id
  ) AS totales_por_bodega
`);

const servicios_promedio = parseFloat(serviciosResult.rows[0]?.promedio || '0');
```

**Y reemplazar la línea con el valor hardcodeado:**
```typescript
// ANTES:
servicios_promedio: 0

// DESPUÉS:
servicios_promedio: Math.round(servicios_promedio)
```

**CONTEXTO:** El componente S del precio (servicios de bodega) siempre mostraba $0 para el productor porque el backend devolvía `servicios_promedio: 0` hardcodeado. La tabla `tarifario_servicios` existe y tiene datos — solo faltaba la query.

**VERIFICAR:**
```bash
curl http://localhost:3000/api/productor/precios \
  -H "Authorization: Bearer TOKEN_PRODUCTOR"
# El campo servicios_promedio debe ser > 0 si hay tarifarios en BD
# Si no hay tarifarios activos → 0 es correcto
```

---

## CORRECCIÓN #4
**ARCHIVO:** `backend/src/routes/admin.ts`
**LÍNEA:** 86
**ACCIÓN:** AGREGAR — filtro `?rol=` en endpoint de usuarios

**BUSCAR el bloque donde se construyen las condiciones del query de usuarios:**
```typescript
const conditions: string[] = [];
const values: any[] = [];
let paramIndex = 1;

if (req.query.estado) {
  conditions.push(`u.estado_validacion = $${paramIndex++}`);
  values.push(req.query.estado);
}
```

**AGREGAR después del bloque de `req.query.estado`:**
```typescript
if (req.query.rol) {
  conditions.push(`u.rol = $${paramIndex++}`);
  values.push(req.query.rol);
}
```

**CONTEXTO:** El módulo Admin necesita filtrar usuarios por rol para mostrar solo productores, solo bodegueros o solo admins en diferentes vistas. Sin el filtro, el endpoint devuelve todos los usuarios mezclados.

**VERIFICAR:**
```bash
# Solo productores
curl "/api/admin/usuarios?rol=productor" -H "Authorization: Bearer TOKEN_ADMIN"

# Solo bodegueros
curl "/api/admin/usuarios?rol=bodega" -H "Authorization: Bearer TOKEN_ADMIN"

# Cada llamada debe devolver solo usuarios del rol solicitado
```

---

## CORRECCIÓN #5
**ARCHIVO:** `backend/src/routes/admin.ts`
**ACCIÓN:** AGREGAR — campo `nota_admin` en tabla `producer` y en endpoint de estatus

**PASO 5A — Migración SQL (ejecutar en BD):**
```sql
-- Agregar campo nota_admin a la tabla producer si no existe
ALTER TABLE producer ADD COLUMN IF NOT EXISTS nota_admin TEXT;
```

**PASO 5B — Modificar el endpoint `PATCH /api/admin/usuarios/:id/estatus`:**

**BUSCAR:**
```typescript
const { estado_validacion } = req.body;
```

**REEMPLAZAR CON:**
```typescript
const { estado_validacion, nota } = req.body;
```

**BUSCAR la query de UPDATE del productor:**
```typescript
await pool.query(
  'UPDATE producer SET estado_validacion = $1 WHERE usuario_id = $2',
  [estado_validacion, id]
);
```

**REEMPLAZAR CON:**
```typescript
await pool.query(
  'UPDATE producer SET estado_validacion = $1, nota_admin = $2 WHERE usuario_id = $3',
  [estado_validacion, nota || null, id]
);
```

**CONTEXTO:** El Admin necesita dejar una nota al aprobar o rechazar un productor Tipo B — especialmente al rechazar, para que quede documentado el motivo. El frontend ya tiene el campo `nota_interna` en el modal — solo faltaba que el backend lo recibiera y guardara.

**VERIFICAR:**
```sql
-- Aprobar un productor con nota desde el Admin
-- Luego verificar en BD:
SELECT estado_validacion, nota_admin 
FROM producer 
WHERE usuario_id = ID_PRODUCTOR;
-- Resultado esperado: estado y nota guardados correctamente
```

---

## CORRECCIÓN #6
**ARCHIVO:** `app-bodega/src/pages/admin/ProductoresAdminPage.tsx`
**ACCIÓN:** REEMPLAZAR — estados hardcodeados por carga dinámica

**BUSCAR el select de estados hardcodeado:**
```typescript
<select>
  <option value="">Todos los estados</option>
  <option value="Sinaloa">Sinaloa</option>
  <option value="Jalisco">Jalisco</option>
  <option value="Guanajuato">Guanajuato</option>
  <option value="Michoacán">Michoacán</option>
</select>
```

**REEMPLAZAR CON:**
```typescript
// Agregar estado al componente:
const [estados, setEstados] = useState<string[]>([]);

// Agregar en useEffect al montar:
useEffect(() => {
  fetch(`${API_URL}/admin/usuarios/estados-disponibles`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setEstados(data.estados || []))
    .catch(() => {
      // Fallback a estados conocidos si el endpoint falla
      setEstados(['Sinaloa', 'Jalisco', 'Guanajuato', 'Michoacán',
                  'Colima', 'Querétaro', 'Nayarit', 'Durango']);
    });
}, []);

// El select dinámico:
<select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
  <option value="">Todos los estados</option>
  {estados.map(estado => (
    <option key={estado} value={estado}>{estado}</option>
  ))}
</select>
```

**Y crear el endpoint en backend — agregar en `admin.ts`:**
```typescript
// GET /api/admin/usuarios/estados-disponibles
router.get('/usuarios/estados-disponibles', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.estado_up AS estado
      FROM producer p
      WHERE p.estado_up IS NOT NULL
        AND p.estado_up != ''
      ORDER BY estado ASC
    `);
    return res.json({ 
      estados: result.rows.map(r => r.estado) 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener estados' });
  }
});
```

**CONTEXTO:** El filtro de estados solo mostraba 4 estados fijos. Si el padrón tiene productores de otros estados, nunca aparecen en el filtro. La carga dinámica muestra exactamente los estados que existen en el padrón real.

**VERIFICAR:** El select de estados en Productores Admin debe mostrar todos los estados que existen en la tabla `producer.estado_up`, no solo los 4 hardcodeados.

---

## CORRECCIÓN #7
**ARCHIVO:** `app-bodega/src/pages/bodega/B10Requerimiento.tsx`
**ACCIÓN:** MEJORAR manejo de error cuando backend rechaza por máximo 5 requerimientos

**BUSCAR el bloque catch o el manejo de respuesta no-ok en `handleSubmit`:**
```typescript
if (!response.ok) {
  throw new Error('Error al publicar requerimiento');
}
```

**REEMPLAZAR CON:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  
  if (response.status === 400 && 
      errorData.error?.includes('5 requerimientos')) {
    setError('Ya tienes 5 requerimientos activos. Cancela uno antes de crear otro nuevo.');
    return;
  }
  
  throw new Error(errorData.error || 'Error al publicar requerimiento');
}
```

**Y agregar el mensaje de error visible en el JSX si no existe:**
```typescript
{error && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
    <p className="text-amber-800 font-medium">⚠️ {error}</p>
  </div>
)}
```

**CONTEXTO:** Cuando el bodeguero ya tiene 5 requerimientos activos e intenta crear uno más, el backend responde 400 con el mensaje correcto, pero el frontend solo mostraba un toast genérico de error. El bodeguero no entendía por qué fallaba.

**VERIFICAR:** Con 5 requerimientos activos, intentar crear uno más → debe aparecer el mensaje específico "Ya tienes 5 requerimientos activos. Cancela uno antes de crear otro nuevo."

---

## CORRECCIÓN #8
**ARCHIVO:** `app-bodega/src/pages/bodega/B15Tarifario.tsx`
**ACCIÓN:** AGREGAR — banner de alerta cuando el tarifario lleva más de 30 días sin actualizar

**AGREGAR estado al componente:**
```typescript
const [diasSinActualizar, setDiasSinActualizar] = useState<number | null>(null);
```

**AGREGAR cálculo después de cargar los datos del tarifario:**
```typescript
// Al cargar el tarifario, calcular días desde la última actualización
if (tarifarioData && tarifarioData.ultima_actualizacion) {
  const ultima = new Date(tarifarioData.ultima_actualizacion);
  const hoy = new Date();
  const dias = Math.floor(
    (hoy.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24)
  );
  setDiasSinActualizar(dias);
}
```

**AGREGAR banner en el JSX, antes del formulario principal:**
```typescript
{diasSinActualizar !== null && diasSinActualizar >= 30 && (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
    <div className="flex items-center gap-3">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="font-semibold text-amber-800">
          Tarifario desactualizado — {diasSinActualizar} días sin cambios
        </p>
        <p className="text-amber-700 text-sm mt-1">
          Las bodegas con tarifario desactualizado no se incluyen en el 
          cálculo del Precio Sistema regional. Actualiza tus precios 
          de servicios para seguir siendo visible.
        </p>
      </div>
    </div>
  </div>
)}
```

**CONTEXTO:** El cron job ya genera la notificación en la campana cuando pasan 30+ días. Pero un bodeguero ocupado puede no revisar las notificaciones. El banner en la pantalla del tarifario es la alerta más directa y visible — aparece justo donde el bodeguero necesita actuar.

**VERIFICAR:** Modificar temporalmente en BD la fecha `updated_at` de un tarifario a hace 35 días → abrir la pantalla del tarifario → debe aparecer el banner de alerta con el número de días correcto.

---

## CORRECCIÓN #9
**ARCHIVO:** `app-bodega/src/pages/admin/PreciosAdminPage.tsx`
**ACCIÓN:** CORREGIR — label de FIRA de `ton` a `ha`

**BUSCAR en el JSX cualquier texto o label que diga `costo_por_ton`, `MXN/ton` o `Costo/ton` en el contexto de la tabla FIRA:**
```typescript
// Buscar variantes de:
"costo_por_ton"
"MXN/ton"
"Costo por tonelada"
"Costo:"  // sin unidad
```

**REEMPLAZAR cada instancia con:**
```typescript
// Encabezado de columna:
"Costo de producción (MXN/ha)"

// Valor en celda — agregar unidad:
`$${fila.costo_por_ha?.toLocaleString('es-MX')} MXN/ha`
```

**CONTEXTO:** Los datos FIRA miden el costo de producción por hectárea (`costo_por_ha`), no por tonelada. Mostrar la unidad incorrecta confunde al Admin al interpretar la rentabilidad del productor.

**VERIFICAR:** La tabla FIRA en `/admin/precios` debe mostrar la columna como "Costo de producción (MXN/ha)" y los valores con la unidad `/ha`.

---

## Checklist de verificación final

```bash
# 1. ADMIN_REGISTRO_CODIGO sin fallback
# Eliminar del .env → servidor no arranca ✅

# 2. Notificación de transacción a Tipo A
# Registrar transacción con productor Tipo A
# Verificar notificación en BD:
SELECT COUNT(*) FROM notificaciones 
WHERE usuario_id = (
  SELECT usuario_id FROM producer WHERE curp = 'CURP_TIPO_A'
);
# Resultado esperado: >= 1 ✅

# 3. servicios_promedio > 0
curl /api/productor/precios -H "Authorization: Bearer TOKEN"
# campo servicios_promedio debe ser > 0 si hay tarifarios activos ✅

# 4. Filtro ?rol= en usuarios Admin
curl "/api/admin/usuarios?rol=productor" -H "Authorization: Bearer TOKEN_ADMIN"
# Solo debe devolver usuarios con rol='productor' ✅

# 5. nota_admin en BD después de rechazar productor
SELECT nota_admin FROM producer WHERE usuario_id = ID;
# Debe tener el texto de la nota ingresada ✅

# 6. Estados dinámicos en filtro de Productores Admin
# El select debe mostrar todos los estados del padrón real ✅

# 7. Error específico en Requerimientos con máx 5
# Con 5 requerimientos activos → crear uno más
# Debe aparecer mensaje específico, no toast genérico ✅

# 8. Banner de alerta en Tarifario
# Bodega con tarifario de hace 35+ días
# Abrir pantalla → banner visible ✅

# 9. Label FIRA correcto
# /admin/precios → tabla FIRA → columna dice "MXN/ha" ✅
```

---

*SIMAC Plan Nacional Maíz 2026 · Documento 2 de 3 — Correcciones Importantes*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
