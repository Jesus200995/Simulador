# SIMAC — Correcciones Finales de Cierre
## 5 correcciones para lanzamiento y piloto
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** `github.com/Jesus200995/Simulador`
**Para:** Agente de desarrollo + Programador

> Estas son las últimas correcciones antes de lanzar.
> Después de aplicarlas la plataforma está lista para producción.

---

## ÍNDICE

| # | Problema | Tipo | Urgencia |
|---|---|---|---|
| 1 | Modal éxito en `CrearPinPage.tsx` — Tipo A | 🤖 Agente | 🔴 Lanzamiento |
| 2 | Fallbacks `6.28` y `17.42` inline en `precios-sistema.ts` | 🤖 Agente | 🔴 Lanzamiento |
| 3 | Migración v19 ejecutar en servidor | 👨‍💻 Programador | 🔴 Lanzamiento |
| 4 | `preciosHoy` hardcodeado en `PreciosAdminPage.tsx` | 🤖 Agente | 🟡 Piloto |
| 5 | Aviso distancias aproximadas en mapa productor | 🤖 Agente | 🟡 Piloto |

---

## 🔴 CORRECCIONES DE LANZAMIENTO

---

## CORRECCIÓN #1
### Modal de registro exitoso en flujo Tipo A — archivo correcto
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**CONTEXTO:**
El flujo Tipo A tiene 2 pasos:
1. `ActivarCuentaPage.tsx` — busca CURP en el padrón
2. `CrearPinPage.tsx` — crea el PIN de 4 dígitos ← aquí termina el registro

El modal de éxito debe ir en `CrearPinPage.tsx` — es la última pantalla del flujo.
`ActivarCuentaPage.tsx` no necesita modal porque no termina el registro.

**ARCHIVO:** `app-bodega/src/pages/auth/CrearPinPage.tsx`
**ACCIÓN:** AGREGAR modal de registro exitoso

**AGREGAR estado del modal:**
```typescript
const [registroExitoso, setRegistroExitoso] = useState(false);
```

**BUSCAR la línea donde navega al terminar exitosamente la creación del PIN:**
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
        ¡Cuenta activada!
      </h2>

      {/* Mensaje */}
      <p className="text-gray-600 mb-2">
        Tu cuenta SIMAC ha sido activada correctamente.
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

**NOTA:** El título dice "¡Cuenta activada!" en lugar de "¡Registro exitoso!" porque el Tipo A no se registra — activa una cuenta que ya existe en el padrón. Es más preciso para el usuario.

**VERIFICAR:**
1. Login como nuevo usuario Tipo A
2. Ingresar CURP → verificar que está en padrón
3. Crear PIN de 4 dígitos → confirmar PIN
4. Debe aparecer modal "¡Cuenta activada!" con botón "Iniciar sesión"
5. Botón → navega a `/login-productor`
6. Login con CURP + PIN → accede al dashboard del productor ✅

---

## CORRECCIÓN #2
### Fallbacks ficticios inline en precios-sistema.ts
**TIPO:** 🤖 Agente
**URGENCIA:** 🔴 Lanzamiento

**ARCHIVO:** `backend/src/routes/precios-sistema.ts`
**LÍNEAS:** 72-73

**PROBLEMA:** Aunque `preciosExternos.ts` ya lanza error correctamente cuando no hay datos, el endpoint tiene sus propios fallbacks inline que evitan que el error llegue al frontend:

```typescript
const chicago_usd_bushel = parseFloat(refs.chicago_usd_bushel || '6.28');
const tc_banxico         = parseFloat(refs.tc_banxico         || '17.42');
```

Si `refs` tiene valores null o vacíos, usa `6.28` y `17.42` como si fueran reales.

**BUSCAR:**
```typescript
const chicago_usd_bushel = parseFloat(refs.chicago_usd_bushel || '6.28');
const tc_banxico         = parseFloat(refs.tc_banxico         || '17.42');
```

**REEMPLAZAR CON:**
```typescript
// Validar que los datos externos son reales antes de calcular
if (!refs?.chicago_usd_bushel || !refs?.tc_banxico) {
  return res.status(503).json({
    error: 'Datos de mercado no disponibles',
    detalle: 'No hay cotización de Chicago CME ni tipo de cambio Banxico disponibles. ' +
             'El administrador puede actualizar los valores manualmente desde el panel de Precios.',
    ultimo_intento: refs?.updated_at ?? null
  });
}

const chicago_usd_bushel = parseFloat(refs.chicago_usd_bushel);
const tc_banxico         = parseFloat(refs.tc_banxico);

// Validar que los valores parseados son números reales
if (isNaN(chicago_usd_bushel) || isNaN(tc_banxico) ||
    chicago_usd_bushel <= 0   || tc_banxico <= 0) {
  return res.status(503).json({
    error: 'Datos de mercado inválidos',
    detalle: 'Los valores almacenados no son números válidos. Actualiza manualmente desde Precios.'
  });
}
```

**VERIFICAR:**
```bash
# Vaciar la tabla de referencias externas temporalmente
# (solo en ambiente de prueba)
# DELETE FROM precio_referencias_externas;

# Llamar al endpoint de precios
curl http://localhost:3000/api/precios/sistema/hoy \
  -H "Authorization: Bearer TOKEN"

# Resultado esperado: 503 con mensaje claro
# {
#   "error": "Datos de mercado no disponibles",
#   "detalle": "No hay cotización de Chicago CME..."
# }
# NO debe devolver 200 con valores ficticios
```

**EN EL FRONTEND — verificar que `PreciosProductorPage.tsx` y `B22PreciosMercado.tsx` manejan el 503:**

Si alguno de estos componentes no maneja el error 503, agregar:
```typescript
if (response.status === 503) {
  setError('Precios en actualización. Intenta en unos minutos.');
  return;
}
```

---

## 👨‍💻 CORRECCIÓN #3 — ACCIÓN MANUAL DEL PROGRAMADOR
### Ejecutar migración v19 en servidor de producción
**TIPO:** 👨‍💻 Programador — acción manual
**URGENCIA:** 🔴 Lanzamiento

> El agente NO puede hacer esto. El programador debe conectarse
> al servidor y ejecutarlo manualmente ANTES de lanzar.

**¿Por qué es necesario?**
La migración v19 actualiza el campo `semaforo_compra` de todas las bodegas
existentes de `NULL` o `'comprando'` a `'sin_actividad'`. Sin esto, las bodegas
que ya están creadas seguirán apareciendo en verde en el mapa del productor
aunque no estén activas comprando.

**Pasos:**

```bash
# 1. Conectarse al servidor
ssh usuario@IP_SERVIDOR

# 2. Ir a la carpeta del proyecto
cd /ruta/al/proyecto

# 3. Hacer git pull para traer la migración v19
git pull origin main

# 4. Ejecutar la migración
psql -U jesus -d bodegas -f backend/migrations/migrate_v19_semaforo_default.sql

# 5. Verificar que se ejecutó correctamente
psql -U jesus -d bodegas -c "
  SELECT semaforo_compra, COUNT(*) 
  FROM bodegas 
  GROUP BY semaforo_compra;
"
# Resultado esperado:
# semaforo_compra | count
# ----------------+-------
# sin_actividad   |  N    ← todas las bodegas en sin_actividad

# 6. Reiniciar el servidor
pm2 restart simac-backend
```

**VERIFICAR:**
Abrir la app como productor → mapa de bodegas → todas las bodegas deben aparecer con semáforo gris/sin actividad, NO en verde.

---

## 🟡 CORRECCIONES ANTES DEL PILOTO

---

## CORRECCIÓN #4
### preciosHoy — eliminar estado inicial hardcodeado
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `app-bodega/src/pages/admin/PreciosAdminPage.tsx`
**LÍNEAS:** 58-65

**PROBLEMA:** Existe un segundo estado `preciosHoy` con valores numéricos hardcodeados que se muestran si el fetch falla. Es diferente al `preciosData` principal que ya es `null`.

**BUSCAR:**
```typescript
const [preciosHoy, setPreciosHoy] = useState({
  po: 4680,
  s: 980,
  total_compra: 5660,
  precio_venta: 770,
  pct_productor: 82.7,
  pct_servicios: 17.3
});
```

**REEMPLAZAR CON:**
```typescript
const [preciosHoy, setPreciosHoy] = useState<{
  po: number;
  s: number;
  total_compra: number;
  precio_venta: number;
  pct_productor: number;
  pct_servicios: number;
} | null>(null);
```

**BUSCAR en el JSX donde se usan estos valores y agregar guard:**
```typescript
// Donde se renderiza preciosHoy, envolver con:
{preciosHoy ? (
  // ... contenido existente con preciosHoy.po, preciosHoy.s, etc.
) : (
  <div className="animate-pulse space-y-2">
    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
  </div>
)}
```

**VERIFICAR:** Desconectar backend → pantalla Precios Admin → las tarjetas de `preciosHoy` deben mostrar skeleton, nunca `$4,680` ni `$980` ficticios.

---

## CORRECCIÓN #5
### Aviso visible cuando distancias son aproximadas
**TIPO:** 🤖 Agente
**URGENCIA:** 🟡 Piloto

**ARCHIVO:** `app-bodega/src/pages/productor/MapaBodegasPage.tsx`

**PROBLEMA:** Cuando el productor no tiene centroide real en BD, el frontend usa `23.6345, -102.5528` (centro de México) silenciosamente. Las distancias calculadas son ficticias pero se muestran como si fueran reales.

**BUSCAR el bloque donde se detecta y aplica el fallback:**
```typescript
lat: d.lat ?? 23.6345,
lng: d.lng ?? -102.5528,
```

**AGREGAR estado de coordenadas aproximadas:**
```typescript
const [coordsAproximadas, setCoordsAproximadas] = useState(false);
```

**MODIFICAR el bloque de carga para detectar el fallback:**
```typescript
.then(d => {
  const latReal = d.lat ?? null;
  const lngReal = d.lng ?? null;
  const usandoFallback = !latReal || !lngReal;

  setCoordsAproximadas(usandoFallback);

  if (d.municipio) setUp({
    lat: latReal ?? 23.6345,
    lng: lngReal ?? -102.5528,
    location_confirmed: d.location_confirmed,
    centroid_source: d.centroid_source,
    municipio: d.municipio,
    estado: d.estado,
  });
})
```

**AGREGAR banner de aviso en el JSX, visible sobre el mapa:**
```typescript
{coordsAproximadas && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
    <span className="text-lg">📍</span>
    <div className="flex-1">
      <p className="text-amber-800 text-sm font-medium">
        Distancias aproximadas
      </p>
      <p className="text-amber-700 text-xs mt-0.5">
        Tu parcela no tiene ubicación exacta. 
        Las distancias mostradas son estimadas desde tu municipio.
      </p>
    </div>
    <button
      onClick={() => navigate('/productor/ubicacion')}
      className="text-xs text-amber-700 underline whitespace-nowrap"
    >
      Actualizar →
    </button>
  </div>
)}
```

**VERIFICAR:** Productor sin centroide en BD → mapa muestra banner "Distancias aproximadas" con botón "Actualizar →". Productor con centroide real → banner no aparece, distancias son exactas.

---

## NOTA MENOR — GuestOnly para Admin
**NO es una corrección urgente — documentar para versión siguiente.**

`GuestOnly` en `/bienvenida` manda al admin a `/dashboard` en lugar de `/admin` si intenta acceder directo a esa ruta con sesión activa. `SmartRedirect` en `/` sí lo manda correctamente a `/admin`. No afecta el flujo normal de uso — solo si un admin escribe `/bienvenida` manualmente en la URL.

**Corrección futura en `GuestOnly`:**
```typescript
function GuestOnly({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.rol === 'productor') return <Navigate to="/productor" replace />;
    if (user?.rol === 'admin' || user?.rol === 'responsable') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
```

---

## CHECKLIST FINAL DE CIERRE

```
AGENTE — aplicar hoy:
□ Corrección #1 — Modal "¡Cuenta activada!" en CrearPinPage.tsx
□ Corrección #2 — Eliminar fallbacks 6.28 y 17.42 en precios-sistema.ts
□ Corrección #4 — preciosHoy null en PreciosAdminPage.tsx
□ Corrección #5 — Banner distancias aproximadas en MapaBodegasPage.tsx

PROGRAMADOR — acción manual hoy:
□ Corrección #3 — Ejecutar migración v19 en servidor de producción
□ Confirmar que pm2 restart simac-backend se ejecutó después de la migración
□ Verificar en BD que todas las bodegas tienen semaforo_compra = 'sin_actividad'

VERIFICACIÓN FINAL:
□ Flujo Tipo A completo → modal "¡Cuenta activada!" aparece al crear PIN
□ Flujo Tipo B completo → modal "¡Registro exitoso!" aparece al terminar
□ Mapa productor → bodegas en gris/sin actividad, no en verde
□ Precios Admin → sin números ficticios cuando backend no responde
□ Mapa bodegas → banner "Distancias aproximadas" cuando no hay centroide
□ Endpoint /precios/sistema/hoy → 503 limpio cuando no hay datos, no 200 ficticio
```

---

*SIMAC Plan Nacional Maíz 2026 · Correcciones Finales de Cierre*
*Mayo 2026 · Confidencial — Uso interno del equipo de desarrollo*
