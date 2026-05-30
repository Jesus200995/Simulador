# SIMAC — Correcciones Obligatorias Pre-Producción
**Fecha:** Mayo 2026 | **Para:** Desarrollador  
**Repo:** github.com/Jesus200995/Simulador  
**Base:** Auditoría final 29 Mayo 2026 — 69/80 puntos OK

> Estas correcciones son OBLIGATORIAS antes de lanzar a producción. No son opcionales. El sistema no debe abrirse a usuarios reales hasta que todos los puntos 🔴 estén resueltos.

---

## RESUMEN

| ID | Problema | Archivo | Urgencia |
|---|---|---|---|
| P-01 | JWT sin expiración — token eterno | `auth.ts` | 🔴 No lanzar sin esto |
| P-02 | JWT_SECRET con fallback público | `auth.ts` + `.env` servidor | 🔴 No lanzar sin esto |
| P-03 | Propuesta de conceptos sin backend | `ventanillas.ts` | 🔴 No lanzar sin esto |
| P-04 | Notificación de ventanilla a todos los usuarios sin filtro | `ventanillas.ts` | 🔴 No lanzar sin esto |
| P-05 | CORS — verificar dominio de producción | `index.ts` | 🟡 Verificar antes de lanzar |
| P-06 | Fallback de requerimientos notifica a todo el estado | `senales-compra.ts` | 🟡 Mejorar antes de lanzar |
| P-07 | Rol 'bodeguero' sigue aceptado en paralelo a 'bodega' | `auth.ts`, `home.ts` | 🟡 Post-piloto |
| P-08 | Gráfica B22 necesita 2 días de datos para funcionar | `B22PreciosMercado.tsx` | ℹ️ Informativo |

---

## CORRECCIONES DETALLADAS

---

### P-01 🔴 BLOQUEANTE — JWT sin expiración

**Archivo:** `backend/src/routes/auth.ts` — líneas 121 y 184

**Problema:**
```
Los tokens JWT nunca caducan.
Si un token se filtra o es robado,
es válido para siempre.
Esto no pasa un audit de seguridad básico.
```

**Corrección — agregar expiresIn en AMBAS llamadas a jwt.sign():**

```typescript
// Línea ~121 — registro:
// ❌ COMO ESTÁ:
const token = jwt.sign(
  { userId: newUser.id, email: newUser.email, rol: newUser.rol },
  process.env.JWT_SECRET!
);

// ✅ COMO DEBE QUEDAR:
const token = jwt.sign(
  { userId: newUser.id, email: newUser.email, rol: newUser.rol },
  process.env.JWT_SECRET!,
  { expiresIn: '8h' }  // ← agregar esto
);

// Línea ~184 — login:
// ❌ COMO ESTÁ:
const token = jwt.sign(
  { userId: user.id, email: user.email, rol: user.rol },
  process.env.JWT_SECRET!
);

// ✅ COMO DEBE QUEDAR:
const token = jwt.sign(
  { userId: user.id, email: user.email, rol: user.rol },
  process.env.JWT_SECRET!,
  { expiresIn: '8h' }  // ← agregar esto
);
```

> 💡 `'8h'` es un buen balance para una app de trabajo diario. Si el usuario no abre la app en 8 horas, vuelve a hacer login. Se puede ajustar a `'12h'` o `'24h'` según preferencia del equipo.

**En el frontend — manejar token expirado:**
```typescript
// En src/services/api.ts o donde está la función request(),
// agregar manejo del error 401 por token expirado:

if (response.status === 401) {
  // Token expirado — limpiar sesión y redirigir al login
  localStorage.removeItem('simac-auth');
  window.location.href = '/login';
  return;
}
```

---

### P-02 🔴 BLOQUEANTE — JWT_SECRET con fallback a valor público

**Archivo:** `backend/src/routes/auth.ts` — línea 20  
**Archivo adicional:** `.env` del servidor de producción

**Problema:**
```typescript
// ❌ COMO ESTÁ:
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Si JWT_SECRET no está definida en el servidor,
// todos los tokens se firman con 'default_secret'.
// Cualquier persona que conozca este valor
// puede fabricar tokens válidos y suplantar usuarios.
```

**Corrección en el código:**
```typescript
// ✅ COMO DEBE QUEDAR — fallar explícitamente si no hay secreto:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET no está definida en las variables de entorno. El servidor no puede arrancar sin ella.');
}
```

**Verificación en el servidor de producción:**
```bash
# Verificar que la variable está definida:
echo $JWT_SECRET
# Debe mostrar un valor largo y aleatorio (mínimo 32 caracteres)

# Si no está definida, agregar al .env del servidor:
JWT_SECRET=genera_un_valor_aleatorio_largo_aqui_minimo_32_chars

# Generar un valor seguro desde terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### P-03 🔴 BLOQUEANTE — Propuesta de conceptos de tarifario sin backend

**Archivo frontend:** `app-bodega/src/pages/B16ProponerConcepto.tsx`  
**Problema:** El archivo existe y es accesible desde el menú, pero el endpoint backend para crear conceptos en estado 'pendiente' no existe. Si el usuario llega a esa pantalla y envía el formulario → error.

**Opción A — Implementar el endpoint (recomendada si es parte del MVP):**

```typescript
// backend/src/routes/cat-conceptos.ts — agregar esta ruta:

router.post('/proponer', authMiddleware, async (req, res) => {
  const { nombre, unidad, descripcion } = req.body;
  const usuario_id = req.user!.userId;

  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre del concepto es obligatorio (mínimo 3 caracteres)' });
  }

  const result = await pool.query(`
    INSERT INTO cat_conceptos_servicio 
      (nombre, unidad_default, estatus, propuesto_por, created_at)
    VALUES ($1, $2, 'pendiente', $3, NOW())
    RETURNING id, nombre, estatus
  `, [nombre.trim(), unidad || 'MXN/ton', usuario_id]);

  return res.status(201).json({
    ok: true,
    concepto: result.rows[0],
    mensaje: 'Tu propuesta fue enviada. Te notificaremos cuando el administrador la apruebe.'
  });
});

// Registrar la ruta en index.ts:
app.use('/api/cat-conceptos-servicio', catConceptosRouter);
```

**Opción B — Ocultar el acceso hasta que esté implementado:**
```typescript
// En MasPage.tsx o donde está el enlace a B16:
// Comentar o eliminar el ítem del menú temporalmente:

// { path: '/tarifario/proponer', label: 'Proponer concepto', icon: PlusIcon }
// ← comentar esta línea hasta que el backend esté listo
```

> ⚠️ Elegir UNA opción. Si se deja el enlace sin backend, los usuarios verán un error al intentar usarlo.

---

### P-04 🔴 BLOQUEANTE — Notificación de nueva ventanilla sin filtro geográfico

**Archivo:** `backend/src/routes/ventanillas.ts` — líneas 61-62

**Problema:**
```typescript
// ❌ COMO ESTÁ — notifica a TODOS los productores activos del sistema:
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida)
SELECT id, $1, $2, 'nueva_ventanilla', FALSE
FROM usuarios 
WHERE rol IN ('productor', 'tecnico') AND activo = TRUE
-- Sin filtro geográfico → en producción con miles de usuarios = spam masivo
```

**Corrección — filtrar por productores cercanos a la bodega de la ventanilla:**
```typescript
// ✅ COMO DEBE QUEDAR:

// 1. Obtener las coordenadas de la bodega asociada a la ventanilla
const bodegaData = await pool.query(`
  SELECT b.latitud, b.longitud, b.estado
  FROM bodegas b
  JOIN ventanillas v ON v.bodega_id = b.id
  WHERE v.id = $1
`, [ventanilla_id]);

const bodega = bodegaData.rows[0];

// 2. Notificar solo a productores con UP dentro del radio (50km default)
//    Con fallback al estado si hay menos de 5 productores
let productoresQuery;

if (bodega?.latitud && bodega?.longitud) {
  productoresQuery = await pool.query(`
    SELECT DISTINCT u.id
    FROM usuarios u
    JOIN producer p ON p.curp = u.curp
    JOIN up ON up.producer_id = p.producer_id
    WHERE u.rol = 'productor' AND u.activo = TRUE
      AND ST_DWithin(
        up.centroid::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        50000  -- 50 km
      )
  `, [bodega.longitud, bodega.latitud]);

  // Fallback al estado si menos de 5 productores en radio
  if (productoresQuery.rows.length < 5 && bodega.estado) {
    productoresQuery = await pool.query(`
      SELECT DISTINCT u.id
      FROM usuarios u
      JOIN producer p ON p.curp = u.curp
      JOIN up ON up.producer_id = p.producer_id
      WHERE u.rol = 'productor' AND u.activo = TRUE
        AND up.state_name ILIKE $1
      LIMIT 500
    `, [bodega.estado]);
  }
} else {
  // Sin coordenadas: solo notificar al estado de la bodega
  productoresQuery = await pool.query(`
    SELECT DISTINCT u.id FROM usuarios u
    JOIN producer p ON p.curp = u.curp
    JOIN up ON up.producer_id = p.producer_id
    WHERE u.rol = 'productor' AND u.activo = TRUE
      AND up.state_name ILIKE $1
    LIMIT 500
  `, [bodega?.estado || '']);
}

// 3. Insertar notificación solo para los productores filtrados
for (const prod of productoresQuery.rows) {
  await pool.query(`
    INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida)
    VALUES ($1, $2, $3, 'nueva_ventanilla', FALSE)
  `, [
    prod.id,
    `Nueva ventanilla de apoyo cerca de ti`,
    `🏛️ La bodega "${bodega_nombre}" tiene una ventanilla de apoyo disponible cerca de tu zona. Tipo: ${tipo}. Responsable: ${nombre_enlace}.`
  ]);
}
```

---

### P-05 🟡 VERIFICAR ANTES DE LANZAR — CORS en producción

**Archivo:** `backend/src/index.ts` — línea 44

**Qué verificar:**
```typescript
// El código lista dominios permitidos incluyendo localhost.
// Verificar que el dominio de producción está en la lista:

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'https://bodega.geodatos.com.mx',  // ← verificar que este es el dominio real
  // agregar el dominio correcto si es diferente
];
```

**Antes de lanzar:**
```bash
# Verificar cuál es el dominio donde está desplegado el frontend:
# Si es diferente a 'https://bodega.geodatos.com.mx', 
# agregar el dominio correcto a la lista en index.ts
# y hacer redeploy del backend
```

---

### P-06 🟡 MEJORAR ANTES DE LANZAR — Fallback de requerimientos notifica a todo el estado

**Archivo:** `backend/src/routes/senales-compra.ts` — líneas 128-138

**Problema:**
```
Cuando PostGIS no está disponible o hay menos de 5 
productores en el radio, la notificación se envía a 
TODOS los productores activos del estado sin límite.

En Sinaloa por ejemplo, esto puede ser miles de 
notificaciones irrelevantes.
```

**Corrección — agregar LIMIT al fallback:**
```typescript
// En el fallback por estado, agregar LIMIT:
const fallbackQuery = await pool.query(`
  SELECT DISTINCT u.id AS usuario_id, 0 AS distancia_km
  FROM usuarios u
  JOIN producer p ON p.curp = u.curp
  JOIN up ON up.producer_id = p.producer_id
  WHERE u.rol = 'productor' AND u.activo = TRUE
    AND up.state_name ILIKE $1
  LIMIT 500  -- ← agregar este límite
`, [estado]);
```

---

### P-07 🟡 POST-PILOTO — Rol 'bodeguero' sigue aceptado en paralelo

**Archivos:** `auth.ts`, `home.ts`

**Problema:**
```
El sistema acepta tanto 'bodega' como 'bodeguero'
como roles válidos en varios lugares.
No bloquea el lanzamiento pero puede causar
inconsistencias en reportes futuros.
```

**Resolver después del piloto:**
```typescript
// Hacer una búsqueda global de 'bodeguero' en el código
// y decidir si se unifica completamente a 'bodega'
// o se mantiene el dual como legacy permanente.
// Documentar la decisión para el Admin.
```

---

### P-08 ℹ️ INFORMATIVO — Gráfica B22 necesita datos históricos

**No es un bug — es algo que el equipo debe saber:**

```
La gráfica de tendencia de 30 días en B22PreciosMercado
solo se renderiza si hay ≥ 2 puntos de datos históricos.

Al lanzar a producción la gráfica mostrará:
"Datos históricos en proceso de recopilación"

Esto es normal y esperado.
La gráfica comenzará a funcionar al día siguiente 
del lanzamiento cuando haya al menos 2 días de datos.

No requiere ninguna acción técnica.
Solo informar al equipo para que no lo reporten como bug.
```

---

## CHECKLIST FINAL ANTES DE LANZAR

```
CÓDIGO — completar antes del deploy:
□ P-01 — { expiresIn: '8h' } en ambas llamadas jwt.sign()
□ P-01 — Manejo de error 401 en el frontend (token expirado)
□ P-02 — JWT_SECRET sin fallback 'default_secret'
□ P-03 — Endpoint /proponer implementado O enlace oculto en menú
□ P-04 — Notificación de ventanilla con filtro geográfico
□ P-05 — Dominio de producción correcto en CORS
□ P-06 — LIMIT 500 en fallback de notificaciones de requerimientos

SERVIDOR — verificar antes de arrancar:
□ JWT_SECRET definida con valor aleatorio largo (≥ 64 chars)
□ DATABASE_URL apuntando a la BD de producción
□ VITE_API_URL apuntando al backend de producción
□ Migraciones aplicadas: v10, v11, v11b, v11c, v12b, v12c
□ Variedades correctas: blanco=14, amarillo=7, criollo=2
□ Sin usuarios con rol='bodeguero' activos
□ Sin usuarios con nombre de prueba activos

PRUEBA FUNCIONAL RÁPIDA (probar en producción antes de abrir):
□ Registro de usuario bodega y login funciona
□ El tablero muestra datos (no todo en cero)
□ El dropdown de variedades filtra correctamente
□ La campana de notificaciones muestra el badge
□ Publicar un requerimiento y verificar que no 
  dispara notificación masiva
□ Registrar una transacción de prueba
```

---

*Documento generado: Mayo 2026 · SIMAC Plan Nacional Maíz 2026*  
*Resolver todos los puntos 🔴 antes de abrir a usuarios reales*
