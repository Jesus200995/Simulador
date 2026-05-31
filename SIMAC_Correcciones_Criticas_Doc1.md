# SIMAC — Correcciones Críticas
## Documento 1 de 3 — Bloqueantes para Producción
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo — aplicar en orden estricto

> ⚠️ ANTES DE APLICAR CUALQUIER CORRECCIÓN:
> 1. Hacer `git commit` del estado actual del repo
> 2. Respaldar el `.env` real en lugar seguro
> 3. Cambiar manualmente la contraseña de BD en el servidor de producción
> 4. Aplicar las correcciones en el orden numerado — algunas son dependientes

---

## CORRECCIÓN #1
**ARCHIVO:** `backend/src/routes/productor.ts`
**LÍNEA:** 98
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```typescript
const secret = process.env.JWT_SECRET || 'default_secret';
```

**CÓDIGO CORRECTO:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('FATAL: JWT_SECRET no definida en variables de entorno. El servidor no puede arrancar sin esta variable.');
}
```

**CONTEXTO:** Este código está dentro del endpoint `activar-cuenta` (Tipo A). Sin esta corrección, cualquier atacante que conozca el fallback `'default_secret'` puede fabricar tokens válidos para cualquier productor del sistema.

**VERIFICAR:** Detener el servidor, eliminar `JWT_SECRET` del `.env` temporalmente, arrancar — debe lanzar error fatal y no arrancar. Restaurar `JWT_SECRET` y confirmar que arranca correctamente.

---

## CORRECCIÓN #2
**ARCHIVO:** `backend/src/routes/productor.ts`
**LÍNEA:** 158
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```typescript
const secret = process.env.JWT_SECRET || 'default_secret';
```

**CÓDIGO CORRECTO:**
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('FATAL: JWT_SECRET no definida en variables de entorno. El servidor no puede arrancar sin esta variable.');
}
```

**CONTEXTO:** Este código está dentro del endpoint `login-pin`. Mismo problema que Corrección #1 — afecta al login de todos los productores.

**VERIFICAR:** Igual que Corrección #1.

---

## CORRECCIÓN #3
**ARCHIVO:** `backend/.env.example`
**LÍNEAS:** 2-5
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```env
DB_HOST=31.97.8.51
DB_USER=jesus
DB_PASSWORD=2025
DB_NAME=bodegas
```

**CÓDIGO CORRECTO:**
```env
DB_HOST=tu_host_de_base_de_datos
DB_USER=tu_usuario_de_base_de_datos
DB_PASSWORD=tu_password_seguro_minimo_16_chars
DB_NAME=simac_db
```

**CONTEXTO:** Credenciales reales de producción expuestas en el repo. La contraseña de BD debe cambiarse manualmente en el servidor ANTES de hacer este commit — el historial de git ya tiene las credenciales anteriores.

**ACCIÓN MANUAL REQUERIDA (no es código):** Conectarse al servidor `31.97.8.51` y cambiar la contraseña del usuario `jesus` en PostgreSQL:
```sql
ALTER USER jesus WITH PASSWORD 'nueva_password_segura_aleatoria';
```

**VERIFICAR:** Confirmar que `.env.example` no contiene ningún valor real — solo placeholders descriptivos.

---

## CORRECCIÓN #4
**ARCHIVO:** `backend/.env.example`
**LÍNEAS:** 13-15
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```
B A N X I C O _ T O K E N = t u _ t o k e n ...
```
*(texto con espacios entre cada carácter — encoding corrupto)*

**CÓDIGO CORRECTO:**
```env
# Token Banxico — obtener GRATIS en: https://www.banxico.org.mx/SieAPIRest/service/v1/token
# Sin este token el tipo de cambio usa Yahoo Finance como fallback
# Instrucciones: registrarse, generar token, copiarlo completo sin espacios
BANXICO_TOKEN=tu_token_de_64_caracteres_sin_espacios
```

**VERIFICAR:** Abrir `.env.example` en editor de texto y confirmar que `BANXICO_TOKEN` aparece como una sola palabra sin espacios entre caracteres.

---

## CORRECCIÓN #5
**ARCHIVO:** `backend/src/routes/transacciones.ts`
**ACCIÓN:** AGREGAR ENDPOINT

**PROBLEMA:** `GET /api/transacciones/:id` no existe en el router. La pantalla `ConfirmarTransaccionPage.tsx` llama a este endpoint al cargar — siempre recibe 404 y el productor ve "Transacción no encontrada" aunque exista en BD.

**AGREGAR después del último endpoint GET existente en el archivo:**
```typescript
// GET /api/transacciones/:id — detalle individual de una transacción
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    const result = await pool.query(`
      SELECT 
        t.id,
        t.bodega_id,
        t.productor_id,
        t.volumen_ton,
        t.precio_por_ton,
        t.calidad,
        t.variedad,
        t.fecha_transaccion,
        t.estado_confirmacion,
        t.confirmacion_productor,
        t.peso_precio_sistema,
        b.nombre AS bodega_nombre,
        b.municipio AS bodega_municipio,
        b.estado AS bodega_estado
      FROM transacciones t
      LEFT JOIN bodegas b ON b.id = t.bodega_id
      WHERE t.id = $1
        AND (t.productor_id = $2 OR t.bodega_usuario_id = $2)
    `, [id, usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});
```

**VERIFICAR:** `GET /api/transacciones/1` con token válido debe devolver los datos de la transacción. Con token de otro usuario debe devolver 404.

---

## CORRECCIÓN #6
**ARCHIVO:** `app-bodega/src/pages/productor/ConfirmarTransaccionPage.tsx`
**LÍNEA:** 32
**ACCIÓN:** REEMPLAZAR

**CÓDIGO ACTUAL:**
```typescript
const response = await fetch(`/api/transacciones/${id}/confirmar`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirmado: esCorrecta })
});
```

**CÓDIGO CORRECTO:**
```typescript
const response = await fetch(`/api/transacciones/${id}/confirmar`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    confirmacion: esCorrecta ? 'confirmada' : 'discrepancia' 
  })
});
```

**CONTEXTO:** El backend espera el campo `confirmacion` con valor string `'confirmada'` o `'discrepancia'`. El frontend enviaba `confirmado: true/false` (booleano). El backend valida con `if (!['confirmada', 'discrepancia'].includes(confirmacion))` — siempre recibía `undefined` y respondía 400. La pantalla de confirmación nunca funcionó.

**VERIFICAR:** El productor puede tocar "Sí, es correcto" → backend responde 200 y actualiza `peso_precio_sistema = 0.75`. El productor puede tocar "Hay un error" → backend responde 200 y actualiza `peso_precio_sistema = 0`.

---

## CORRECCIÓN #7
**ARCHIVO:** `app-bodega/src/pages/productor/DisponibilidadVariedadPage.tsx`
**ACCIÓN:** REEMPLAZAR — guardar `v.code` en lugar de `v.id`

**BUSCAR este bloque (al seleccionar una variedad):**
```typescript
sessionStorage.setItem('disp_variedad_id', String(v.id));
sessionStorage.setItem('disp_variedad_nombre', v.nombre_variedad);
```

**REEMPLAZAR CON:**
```typescript
sessionStorage.setItem('disp_variedad_id', String(v.id));
sessionStorage.setItem('disp_variedad_code', v.code);
sessionStorage.setItem('disp_variedad_nombre', v.nombre_variedad);
```

**CONTEXTO:** La variedad tiene campo `code` (ej. `"H-438"`) e `id` (número). Solo se guardaba el ID. La corrección guarda ambos — el ID para compatibilidad y el code para enviarlo al backend.

**VERIFICAR:** Después de seleccionar variedad "H-438", `sessionStorage.getItem('disp_variedad_code')` debe devolver `"H-438"`, no `"12"`.

---

## CORRECCIÓN #8
**ARCHIVO:** `app-bodega/src/pages/productor/DisponibilidadConfirmPage.tsx`
**ACCIÓN:** REEMPLAZAR — enviar `variedad_code` al backend

**BUSCAR este bloque (lectura de sessionStorage y construcción del payload):**
```typescript
const variedadId = sessionStorage.getItem('disp_variedad_id');
// ...
body: JSON.stringify({
  variedad_id: Number(variedadId),
  volumen_ton: Number(volumen),
  // ... otros campos
})
```

**REEMPLAZAR CON:**
```typescript
const variedadId = sessionStorage.getItem('disp_variedad_id');
const variedadCode = sessionStorage.getItem('disp_variedad_code');
// ...
body: JSON.stringify({
  variedad_id: Number(variedadId),
  variedad_code: variedadCode,       // ← agregar este campo
  volumen_estimado_ton: Number(volumen),  // ← verificar que usa volumen_estimado_ton
  // ... otros campos
})
```

**CONTEXTO:** Esta corrección es dependiente de la Corrección #7. El backend de `disponibilidad.ts` acepta `variedad_code` directamente y lo almacena tal cual. Si se envía el code real `"H-438"`, la BD almacena `"H-438"`. Si no se envía, el backend hace `String(variedad_id)` → almacena `"12"`.

**VERIFICAR:** Completar el flujo Tengo Maíz → en BD, el campo `variedad_code` del registro nuevo debe ser `"H-438"` (o el code real de la variedad seleccionada), no un número como `"12"`.

---

## CORRECCIÓN #9
**ARCHIVO:** `backend/src/routes/cycles.ts`
**LÍNEA:** 33
**ACCIÓN:** REEMPLAZAR — agregar validación de ciclos duplicados

**CÓDIGO ACTUAL:**
```typescript
// INSERT directo sin verificación
const result = await pool.query(
  'INSERT INTO cycle (up_id, cycle_year, cycle_type) VALUES ($1, $2, $3) RETURNING *',
  [up_id, cycle_year, cycle_type]
);
```

**CÓDIGO CORRECTO:**
```typescript
// Verificar si ya existe un ciclo activo del mismo tipo y año en esta UP
const duplicado = await pool.query(`
  SELECT id FROM cycle 
  WHERE up_id = $1 
    AND cycle_year = $2 
    AND cycle_type = $3 
    AND COALESCE(estado_ciclo, 'activo') = 'activo'
`, [up_id, cycle_year, cycle_type]);

if (duplicado.rows.length > 0) {
  return res.status(409).json({ 
    error: `Ya tienes un ciclo ${cycle_type} ${cycle_year} activo en esta UP` 
  });
}

const result = await pool.query(
  'INSERT INTO cycle (up_id, cycle_year, cycle_type, estado_ciclo) VALUES ($1, $2, $3, $4) RETURNING *',
  [up_id, cycle_year, cycle_type, 'activo']
);
```

**CONTEXTO:** `CicloProductivoPage.tsx` llama a `POST /api/ups/:upId/cycles` (este archivo `cycles.ts`), no al endpoint `/api/productor/ciclo` donde sí existía la validación. El resultado era que un productor podía crear ciclos duplicados ilimitadamente.

**VERIFICAR:** Crear ciclo PV 2026 en una UP → éxito 201. Intentar crear otro ciclo PV 2026 en la misma UP → debe responder 409 con mensaje claro.

---

## CORRECCIÓN #10
**ARCHIVOS:**
- `app-bodega/src/pages/admin/ProduccionAdminPage.tsx`
- `app-bodega/src/pages/admin/MercadoAdminPage.tsx`
- `app-bodega/src/pages/admin/ConfiguracionAdminPage.tsx`

**ACCIÓN:** REEMPLAZAR en los 3 archivos — eliminar IP hardcodeada

**BUSCAR en cada archivo:**
```typescript
const BASE = import.meta.env.VITE_API_URL || 'http://31.97.8.51:3005/api';
```

**REEMPLAZAR CON:**
```typescript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**CONTEXTO:** Los módulos de Producción, Mercado y Configuración del Admin tienen la IP pública del servidor de producción hardcodeada como fallback. Si `VITE_API_URL` no está definida (por ejemplo en la máquina de un desarrollador nuevo), estos módulos apuntan directamente a producción. El puerto 3005 también es incorrecto — el backend corre en 3000.

**VERIFICAR:** Confirmar que ningún archivo en `app-bodega/src/` contiene la cadena `31.97.8.51`. Usar:
```bash
grep -r "31.97.8.51" app-bodega/src/
# Resultado esperado: sin resultados
```

---

## CORRECCIÓN #11
**ARCHIVO:** `app-bodega/src/pages/admin/PreciosAdminPage.tsx`
**ACCIÓN:** MODIFICAR estado inicial — eliminar valores hardcodeados

**BUSCAR el estado inicial con valores hardcodeados:**
```typescript
const [preciosData, setPreciosData] = useState<PreciosData>({
  chicago_usd_bushel: 6.28,
  chicago_usd_ton: 247.53,
  chicago_mxn: 4312.00,
  tc_banxico: 17.42,
  // ... otros valores numéricos hardcodeados
});
```

**REEMPLAZAR CON:**
```typescript
const [preciosData, setPreciosData] = useState<PreciosData | null>(null);
const [preciosError, setPreciosError] = useState<string | null>(null);
```

**Y agregar manejo de estado null en el render:**
```typescript
// Mientras carga o si hay error — NO mostrar números ficticios
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

**CONTEXTO:** Si el fetch falla, el Admin veía números que parecían reales (`chicago: 6.28`, `tc: 17.42`) pero eran del estado inicial hardcodeado. Un administrador podría tomar decisiones operativas basadas en datos ficticios.

**VERIFICAR:** Desconectar temporalmente el backend. La pantalla de Precios Admin debe mostrar skeleton loader o mensaje de error — nunca números.

---

## Checklist de verificación final

Después de aplicar todas las correcciones, ejecutar en orden:

```bash
# 1. Verificar que no hay credenciales reales en el repo
grep -r "31.97.8.51" .
grep -r "default_secret" backend/src/
grep -r "SIMAC2026" backend/src/   # este puede quedar — es Corrección del Doc 2

# 2. Verificar que el backend arranca sin JWT_SECRET
# Comentar JWT_SECRET en .env → npm run dev → debe lanzar error fatal

# 3. Verificar flujo de disponibilidad completo
# Login como productor → Tengo Maíz → seleccionar variedad → confirmar
# En BD: SELECT variedad_code FROM disponibilidad_productor ORDER BY id DESC LIMIT 1;
# Resultado esperado: "H-438" o nombre real — NO número como "12"

# 4. Verificar confirmación de transacción
# Como productor → ir a ConfirmarTransaccionPage → tocar "Sí, es correcto"
# Respuesta esperada: 200 OK — no 400

# 5. Verificar ciclos duplicados
# POST /api/ups/1/cycles con PV 2026 → 201 Created
# POST /api/ups/1/cycles con PV 2026 de nuevo → 409 Conflict

# 6. Verificar que Admin no muestra datos ficticios
# Desconectar backend → abrir /admin/precios → ver skeleton/error, no números
```

---

## Notas para el desarrollador

- Las Correcciones #7 y #8 son **dependientes** — deben aplicarse juntas o el flujo de disponibilidad sigue roto
- La Corrección #3 requiere **acción manual en el servidor** antes del commit (cambiar contraseña de BD)
- La Corrección #11 puede requerir ajustes adicionales dependiendo de cómo esté tipado `PreciosData` — adaptar el tipo para aceptar `null` si es necesario
- El historial de git ya tiene las credenciales de `.env.example` — considerar usar `git filter-branch` o BFG Repo Cleaner para limpiar el historial si el repo es público o semi-público

---

*SIMAC Plan Nacional Maíz 2026 · Documento 1 de 3 — Correcciones Críticas*
*Generado: Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
