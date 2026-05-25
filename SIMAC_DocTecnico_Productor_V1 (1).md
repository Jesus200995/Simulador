# SIMAC — Documento Técnico: Módulo Productor V1
**Plan Nacional Maíz 2026 · Mayo 2026**
**Repo:** github.com/Jesus200995/Simulador
**Para:** Desarrollador frontend/backend
**Estado:** Especificación aprobada — listo para construir

---

> **REGLA DE ORO DEL MÓDULO PRODUCTOR**
> El productor es el actor más vulnerable técnicamente.
> Cada pantalla tiene **UNA sola acción principal**.
> Botones grandes. Texto mínimo. Íconos sobre texto siempre que sea posible.
> PIN de 4 dígitos. Ninguna pantalla requiere escribir más de un campo de texto libre.

---

## Índice

1. [Decisiones de arquitectura](#1-decisiones-de-arquitectura)
2. [Base de datos — tablas nuevas y modificaciones](#2-base-de-datos)
3. [Backend — endpoints nuevos y modificaciones](#3-backend)
4. [Onboarding — P-01, P-02, P-02b](#4-onboarding)
5. [Dashboard principal — P-03](#5-dashboard-p-03)
6. [Flujo de disponibilidad — P-04 a P-07](#6-flujo-de-disponibilidad)
7. [Mapa de bodegas — P-08, P-09, P-10](#7-mapa)
8. [Precios — P-11](#8-precios)
9. [Confirmar transacción — P-12](#9-confirmar-transacción)
10. [Alertas — P-13](#10-alertas)
11. [Incentivos y coberturas — P-14, P-15, P-16](#11-incentivos-y-coberturas)
12. [Mi perfil — P-17](#12-mi-perfil)
13. [Bug fixes urgentes](#13-bug-fixes-urgentes)
14. [Integración SENASICA — módulo preparado](#14-integración-senasica)
15. [Insumos externos requeridos](#15-insumos-externos-requeridos)

---

## 1. Decisiones de arquitectura

### 1.1 Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Frontend | **React + Vite** — mismo stack que `app-bodega/` | NO Vue. `appbodegas/` se congela, no se extiende. |
| Estilos | Tailwind CSS | Mismos tokens que bodega. Verde primario `#1A5C38`. |
| Mapas | Leaflet | Ya instalado en bodega. Reutilizar. |
| Estado global | Context API o Zustand | El que ya usa bodega — no agregar otro. |
| Backend | Node.js 20 + Express + TypeScript + PostgreSQL 15 + PostGIS | Sin cambios de stack. |

### 1.2 Estructura de carpetas — dónde va el código nuevo

```
app-bodega/
  src/
    pages/
      auth/
        ActivarCuentaPage.tsx          <- NUEVO (P-01)
        CrearPinPage.tsx               <- NUEVO (P-02)
        RegistroNuevoPage.tsx          <- NUEVO (P-02b)
      productor/
        DashboardProductorPage.tsx     <- NUEVO (P-03)
        DisponibilidadTipoPage.tsx     <- NUEVO (P-04)
        DisponibilidadVariedadPage.tsx <- NUEVO (P-05)
        DisponibilidadVolumenPage.tsx  <- NUEVO (P-06)
        DisponibilidadConfirmPage.tsx  <- NUEVO (P-07)
        MapaBodegasPage.tsx            <- NUEVO reescrito desde cero (P-08)
        DetalleBodegaPage.tsx          <- NUEVO (P-09)
        CompletarUbicacionPage.tsx     <- NUEVO (P-10)
        PreciosProductorPage.tsx       <- NUEVO (P-11)
        ConfirmarTransaccionPage.tsx   <- NUEVO (P-12)
        AlertasPage.tsx                <- NUEVO (P-13)
        IncentivosPage.tsx             <- NUEVO (P-14)
        VentanillasPage.tsx            <- NUEVO (P-15)
        EstadoSolicitudPage.tsx        <- NUEVO (P-16)
        MiPerfilPage.tsx               <- NUEVO (P-17)
    components/
      productor/
        PinInput.tsx                   <- NUEVO — 4 círculos táctiles
        MapaUP.tsx                     <- NUEVO — mapa con centroide y radio incertidumbre
        DisponibilidadStepper.tsx      <- NUEVO — indicador de paso 1/3
        BotonGrande.tsx                <- NUEVO — botón principal del productor
        NominatimSearch.tsx            <- NUEVO — buscador de dirección en mapa
    router/
      index.tsx                        <- MODIFICAR — agregar rutas /productor/* con guard
```

### 1.3 Router — rutas nuevas y guards

```typescript
// src/router/index.tsx — AGREGAR estas rutas al router existente

const RequireProductor = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.rol !== 'productor') return <Navigate to="/bodega" />;
  return <>{children}</>;
};

// Rutas de onboarding (sin autenticación requerida)
{ path: '/activar',         element: <ActivarCuentaPage /> },
{ path: '/activar/pin',     element: <CrearPinPage /> },
{ path: '/registro-nuevo',  element: <RegistroNuevoPage /> },

// Rutas del productor (requieren auth + rol productor)
{
  path: '/productor',
  element: <RequireProductor><Outlet /></RequireProductor>,
  children: [
    { index: true,                        element: <DashboardProductorPage /> },
    { path: 'disponibilidad/tipo',        element: <DisponibilidadTipoPage /> },
    { path: 'disponibilidad/variedad',    element: <DisponibilidadVariedadPage /> },
    { path: 'disponibilidad/volumen',     element: <DisponibilidadVolumenPage /> },
    { path: 'disponibilidad/confirmar',   element: <DisponibilidadConfirmPage /> },
    { path: 'mapa',                       element: <MapaBodegasPage /> },
    { path: 'mapa/bodega/:id',            element: <DetalleBodegaPage /> },
    { path: 'ubicacion',                  element: <CompletarUbicacionPage /> },
    { path: 'precios',                    element: <PreciosProductorPage /> },
    { path: 'transaccion/:id/confirmar',  element: <ConfirmarTransaccionPage /> },
    { path: 'alertas',                    element: <AlertasPage /> },
    { path: 'incentivos',                 element: <IncentivosPage /> },
    { path: 'ventanillas',                element: <VentanillasPage /> },
    { path: 'solicitud/:id',              element: <EstadoSolicitudPage /> },
    { path: 'perfil',                     element: <MiPerfilPage /> },
  ]
}

// MODIFICAR en el login existente — agregar redirección por rol después del JWT:
// user.rol === 'productor' -> navigate('/productor')
// user.rol === 'bodeguero' -> navigate('/bodega')   <- ya existe
// user.rol === 'admin'     -> navigate('/admin')
```

### 1.4 Tipo B — permisos en frontend

El productor Tipo B (pendiente de validación) ve todo igual que Tipo A.
La única diferencia es que el botón de disponibilidad aparece bloqueado.

```typescript
// Hook a usar en cualquier componente
const useProductorStatus = () => {
  const { user } = useAuth();
  const isPendiente = user?.estado_validacion === 'pendiente';
  return { isPendiente };
};

// Botón de disponibilidad bloqueado para Tipo B:
const { isPendiente } = useProductorStatus();

<button
  disabled={isPendiente}
  title={isPendiente ? 'Tu cuenta está en validación.' : ''}
  className={isPendiente ? 'opacity-50 cursor-not-allowed' : ''}
>
  Tengo maíz disponible
</button>
```

---

## 2. Base de datos

### 2.1 Tablas existentes que se usan sin modificar estructura

| Tabla | Campos clave que usa el productor | Estado |
|---|---|---|
| `usuarios` | `id`, `rol`, `password` (almacena PIN hasheado con bcrypt) | Existe ✅ |
| `producer` | `curp`, `nombres`, `apellido_paterno`, `apellido_materno`, `telefono` | Existe ✅ |
| `up` | `id`, `producer_id`, `centroid` (PostGIS Point), `state_name`, `municipality_name` | Existe ✅ |
| `cycle_crop` | `crop` (tipo maíz), `variety_id` | Existe ✅ |
| `cat_crop_variety` | `id`, `tipo_maiz`, `nombre_variedad` | Existe ✅ |
| `disponibilidad_productor` | `id`, `producer_id`, `tipo_maiz`, `variedad_id`, `volumen_ton`, `fecha_disponible_desde`, `fecha_disponible_hasta` | Existe ✅ |
| `senales_compra` | `id`, `bodega_id`, `tipo_maiz`, `precio_oferta`, `radio_km`, `activa` | Existe ✅ |
| `transacciones` | `id`, `bodega_id`, `producer_id`, `tipo_maiz`, `volumen_ton`, `precio_ton`, `confirmado_productor` | Existe ✅ |
| `notificaciones` | `id`, `usuario_id`, `tipo`, `mensaje`, `alerta_id` (nullable), `leida`, `created_at` | Existe ✅ |
| `infraestructura` | `id`, `nombre`, `municipio`, `estado`, `lat`, `lng`, `is_ventanilla`, `estado_compra` | Existe ✅ |

### 2.2 Columnas nuevas en tablas existentes

```sql
-- Tabla producer: agregar estado de validación, tipo de registro y programas
ALTER TABLE producer
  ADD COLUMN IF NOT EXISTS programas_beneficiario TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estado_validacion      VARCHAR(20) DEFAULT 'activo'
    CHECK (estado_validacion IN ('activo', 'pendiente', 'rechazado')),
  ADD COLUMN IF NOT EXISTS tipo_registro          VARCHAR(10) DEFAULT 'A'
    CHECK (tipo_registro IN ('A', 'B'));

-- Tabla up: campo para saber si el centroide es exacto o aproximado
ALTER TABLE up
  ADD COLUMN IF NOT EXISTS location_confirmed BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS centroid_source    VARCHAR(20) DEFAULT 'municipio'
    CHECK (centroid_source IN ('padron', 'productor', 'municipio'));

COMMENT ON COLUMN producer.programas_beneficiario IS
  'Valores posibles: fertilizantes_bienestar, produccion_bienestar, precios_garantia,
   maiz_blanco_precio_justo, maiz_es_raiz, cosechando_soberania, sembrando_vida';

COMMENT ON COLUMN producer.estado_validacion IS
  'activo = opera completo | pendiente = Tipo B sin validar | rechazado = bloqueado';

COMMENT ON COLUMN up.centroid_source IS
  'padron = vino del padrón | productor = lo marcó en el mapa | municipio = centroide aproximado';
```

### 2.3 Tablas nuevas

```sql
-- Catálogo de programas de gobierno
CREATE TABLE IF NOT EXISTS cat_programas_gobierno (
  id      SERIAL PRIMARY KEY,
  clave   VARCHAR(50)  UNIQUE NOT NULL,
  nombre  VARCHAR(200) NOT NULL,
  activo  BOOLEAN DEFAULT TRUE
);

INSERT INTO cat_programas_gobierno (clave, nombre) VALUES
  ('fertilizantes_bienestar',  'Fertilizantes para el Bienestar'),
  ('produccion_bienestar',     'Producción para el Bienestar'),
  ('precios_garantia',         'Precios de Garantía'),
  ('maiz_blanco_precio_justo', 'Programa de Maíz Blanco / Sistema Precio Justo'),
  ('maiz_es_raiz',             'Plan El Maíz es la Raíz'),
  ('cosechando_soberania',     'Cosechando Soberanía'),
  ('sembrando_vida',           'Sembrando Vida')
ON CONFLICT (clave) DO NOTHING;

-- Costos FIRA — actualizable por admin sin tocar código
-- Solo 3 estados tienen dato: Jalisco, Sinaloa, Guanajuato
CREATE TABLE IF NOT EXISTS costos_fira (
  id            SERIAL PRIMARY KEY,
  estado        VARCHAR(100) NOT NULL,
  modalidad     VARCHAR(10)  NOT NULL,  -- TMF, GMF, BMF
  ciclo         VARCHAR(10)  NOT NULL,  -- PV, OI, ANUAL
  costo_por_ha  NUMERIC(10,2) NOT NULL,
  precio_fira   NUMERIC(10,2) NOT NULL,
  pct_ganancia  NUMERIC(6,4)  NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  activo        BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Datos iniciales del Excel FIRA entregado (Mayo 2026)
INSERT INTO costos_fira (estado, modalidad, ciclo, costo_por_ha, precio_fira, pct_ganancia, vigente_desde) VALUES
  ('Jalisco',    'TMF', 'PV', 42200.00, 5619.00, 0.3490, '2026-01-01'),
  ('Jalisco',    'GMF', 'PV', 49985.00, 5619.00, 0.3490, '2026-01-01'),
  ('Sinaloa',    'GMF', 'OI', 48324.00, 5582.00, 0.3861, '2026-01-01'),
  ('Guanajuato', 'GMF', 'PV', 52727.00, 5619.00, 0.2788, '2026-01-01'),
  ('Guanajuato', 'BMF', 'PV', 48324.00, 5619.00, 0.2680, '2026-01-01');

COMMENT ON TABLE costos_fira IS
  'Actualizable por admin desde panel. Solo estados con dato activo=TRUE se muestran al productor.';

-- Municipios de referencia — centroides para el mapa del registro Tipo B
-- Cargar desde GeoJSON INEGI (ver sección 15)
CREATE TABLE IF NOT EXISTS municipios_referencia (
  cve_geo  VARCHAR(10)  PRIMARY KEY,
  nombre   VARCHAR(200) NOT NULL,
  estado   VARCHAR(100) NOT NULL,
  centroid GEOGRAPHY(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_municipios_referencia_nombre
  ON municipios_referencia (LOWER(nombre), LOWER(estado));

-- Alertas externas SENASICA/INIFAP — preparado, inactivo en piloto
CREATE TABLE IF NOT EXISTS alertas_externas (
  id               SERIAL PRIMARY KEY,
  tipo_alerta      VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('fitosanitaria', 'climatica')),
  subtipo          VARCHAR(100) NOT NULL,
  nivel_riesgo     VARCHAR(10) NOT NULL CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
  descripcion      TEXT NOT NULL,
  recomendacion    TEXT,
  cultivo_afectado VARCHAR(50) DEFAULT 'todos',
  coordenada       GEOGRAPHY(Point, 4326) NOT NULL,
  radio_km         INTEGER NOT NULL DEFAULT 30,
  estado           VARCHAR(100),
  municipio        VARCHAR(100),
  fecha_deteccion  DATE NOT NULL,
  fecha_vigencia   DATE,
  fuente           VARCHAR(50) NOT NULL,
  id_alerta_origen VARCHAR(100) UNIQUE,
  activa           BOOLEAN DEFAULT TRUE,
  importado_en     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_externas_geo
  ON alertas_externas USING GIST(coordenada);

-- Intersecciones alerta <-> UP (calculadas por proceso batch)
CREATE TABLE IF NOT EXISTS alertas_up (
  alerta_id    INTEGER REFERENCES alertas_externas(id) ON DELETE CASCADE,
  up_id        INTEGER REFERENCES up(id) ON DELETE CASCADE,
  distancia_km NUMERIC(8,2),
  notificado   BOOLEAN DEFAULT FALSE,
  calculado_en TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (alerta_id, up_id)
);

-- Solicitudes de apoyo del productor a ventanillas
CREATE TABLE IF NOT EXISTS solicitudes_apoyo (
  id                 SERIAL PRIMARY KEY,
  producer_id        INTEGER REFERENCES producer(id),
  infraestructura_id INTEGER REFERENCES infraestructura(id),
  tipo_apoyo         VARCHAR(20) NOT NULL CHECK (tipo_apoyo IN ('incentivo', 'cobertura')),
  estado             VARCHAR(20) DEFAULT 'enviada'
    CHECK (estado IN ('enviada','recibida','contactado','agendada','canalizada','rechazada')),
  notas_productor    TEXT,
  notas_ventanilla   TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Backend

### 3.1 Endpoints existentes que se reutilizan sin cambios

> El productor consume los mismos endpoints que bodega.
> Solo verificar que el middleware de auth permita el rol 'productor'.

| Método | Ruta | Pantalla | Estado |
|---|---|---|---|
| POST | `/api/auth/login` | P-01, P-02 | Existe ✅ |
| GET | `/api/auth/perfil` | Todas | Existe ✅ |
| GET | `/api/auth/states` | P-02b, P-17 | Existe ✅ |
| GET | `/api/auth/municipalities?state_id=X` | P-02b, P-17 | Existe ✅ |
| GET | `/api/mis-ups` | P-03, P-08, P-17 | Existe ✅ |
| GET | `/api/infraestructura` | P-08, P-15 | Existe ✅ |
| GET | `/api/infraestructura/:id` | P-09 | Existe ✅ |
| GET | `/api/precios/sistema/hoy` | P-03, P-11 | Existe ✅ |
| GET | `/api/precios/tendencia` | P-11 | Existe ✅ |
| GET | `/api/alertas/notificaciones/mis` | P-03, P-13 | Existe ✅ — ver bug fix §13 |
| GET | `/api/catalogos-productor` | P-04, P-05, P-02b | Existe ✅ |
| POST | `/api/productor/disponibilidad` | P-07 | Existe ✅ |
| GET | `/api/productor/disponibilidad` | P-17 | Existe ✅ |
| DELETE | `/api/productor/disponibilidad/:id` | P-17 | Existe ✅ |
| POST | `/api/senales-compra/:id/interes` | P-08 | Existe ✅ |
| PATCH | `/api/transacciones/:id/confirmar` | P-12 | Existe ✅ |

### 3.2 Endpoints nuevos

```typescript
// ─────────────────────────────────────────────
// AUTH — Activación por CURP (Tipo A)
// ─────────────────────────────────────────────

// POST /api/auth/buscar-curp
// Busca CURP en el padrón. Sin JWT. Solo devuelve nombre para confirmar identidad.
router.post('/buscar-curp', async (req, res) => {
  const { curp } = req.body;
  if (!curp || curp.length !== 18)
    return res.status(400).json({ error: 'CURP inválida' });

  const { rows } = await db.query(
    `SELECT p.id, p.nombres, p.apellido_paterno, p.estado_validacion,
            u.id AS usuario_id
     FROM producer p
     LEFT JOIN usuarios u ON u.id = p.usuario_id
     WHERE UPPER(p.curp) = UPPER($1)`,
    [curp]
  );

  if (!rows.length) return res.json({ encontrado: false });

  return res.json({
    encontrado:     true,
    nombres:        rows[0].nombres,
    apellido:       rows[0].apellido_paterno,
    producer_id:    rows[0].id,
    ya_tiene_cuenta: !!rows[0].usuario_id
  });
});

// POST /api/auth/activar-cuenta
// Crea cuenta Tipo A. Sin JWT.
// Verifica minLength de PIN solo para rol productor (4 dígitos, no 8).
router.post('/activar-cuenta', async (req, res) => {
  const { producer_id, pin } = req.body;

  if (!pin || !/^\d{4}$/.test(pin))
    return res.status(400).json({ error: 'El PIN debe ser exactamente 4 dígitos' });

  // Verificar que no tenga cuenta ya
  const existing = await db.query(
    `SELECT u.id FROM usuarios u JOIN producer p ON p.usuario_id = u.id WHERE p.id = $1`,
    [producer_id]
  );
  if (existing.rows.length)
    return res.status(409).json({ error: 'Este productor ya tiene cuenta activa' });

  const hashedPin = await bcrypt.hash(pin, 10);

  const result = await db.transaction(async (trx) => {
    const u = await trx.query(
      `INSERT INTO usuarios (password, rol) VALUES ($1, 'productor') RETURNING id`,
      [hashedPin]
    );
    await trx.query(
      `UPDATE producer
       SET usuario_id = $1, tipo_registro = 'A', estado_validacion = 'activo'
       WHERE id = $2`,
      [u.rows[0].id, producer_id]
    );
    return u.rows[0];
  });

  const token = jwt.sign(
    { id: result.id, rol: 'productor', producer_id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return res.json({ token, user: { id: result.id, rol: 'productor', producer_id } });
});

// POST /api/auth/registro-nuevo-productor
// Registro Tipo B. Sin JWT. Cuenta queda en estado 'pendiente'.
router.post('/registro-nuevo-productor', async (req, res) => {
  const {
    curp, nombres, apellido_paterno, apellido_materno,
    estado_up, municipio_up, tipo_maiz, variedad_id,
    lat, lng, telefono, pin, programas_beneficiario
  } = req.body;

  if (!/^\d{4}$/.test(pin))
    return res.status(400).json({ error: 'El PIN debe ser 4 dígitos' });

  const existe = await db.query(
    `SELECT id FROM producer WHERE UPPER(curp) = UPPER($1)`, [curp]
  );
  if (existe.rows.length)
    return res.status(409).json({ error: 'Esta CURP ya está registrada' });

  const hashedPin = await bcrypt.hash(pin, 10);

  await db.transaction(async (trx) => {
    const u = await trx.query(
      `INSERT INTO usuarios (password, rol) VALUES ($1, 'productor') RETURNING id`,
      [hashedPin]
    );
    const p = await trx.query(
      `INSERT INTO producer
         (usuario_id, curp, nombres, apellido_paterno, apellido_materno,
          telefono, tipo_registro, estado_validacion, programas_beneficiario)
       VALUES ($1,$2,$3,$4,$5,$6,'B','pendiente',$7) RETURNING id`,
      [u.rows[0].id, curp.toUpperCase(), nombres, apellido_paterno,
       apellido_materno, telefono, programas_beneficiario || []]
    );

    // Centroide: si marcó en mapa usar ese; si no, usar centroide del municipio
    const centroidSQL = (lat && lng)
      ? `ST_SetSRID(ST_MakePoint($4, $5), 4326)`
      : `(SELECT centroid FROM municipios_referencia
           WHERE LOWER(nombre) = LOWER($3) AND LOWER(estado) = LOWER($2) LIMIT 1)`;

    await trx.query(
      `INSERT INTO up
         (producer_id, state_name, municipality_name, centroid,
          location_confirmed, centroid_source)
       VALUES ($1, $2, $3, ${centroidSQL}, $6, $7)`,
      [p.rows[0].id, estado_up, municipio_up,
       ...(lat && lng ? [lng, lat] : []),
       !!(lat && lng),
       (lat && lng) ? 'productor' : 'municipio']
    );
  });

  return res.status(201).json({
    mensaje: 'Registro enviado. Tu cuenta será validada pronto. Ya puedes consultar precios y alertas.'
  });
});

// ─────────────────────────────────────────────
// PRODUCTOR — Endpoints nuevos
// ─────────────────────────────────────────────

// PATCH /api/productor/ubicacion
// Actualiza centroide de la UP. Requiere JWT productor.
router.patch('/productor/ubicacion', authMiddleware, async (req, res) => {
  const { lat, lng } = req.body;
  const producerId = req.user.producer_id;

  await db.query(
    `UPDATE up SET
       centroid         = ST_SetSRID(ST_MakePoint($1, $2), 4326),
       location_confirmed = TRUE,
       centroid_source  = 'productor'
     WHERE producer_id = $3`,
    [lng, lat, producerId]
  );
  return res.json({ ok: true });
});

// GET /api/productor/dashboard
// Todos los datos del dashboard en una sola llamada. Requiere JWT productor.
router.get('/productor/dashboard', authMiddleware, async (req, res) => {
  const producerId = req.user.producer_id;

  const [upRes, precioRes, alertaRes, bodegasRes] = await Promise.all([
    db.query(
      `SELECT centroid, municipality_name, state_name, location_confirmed, centroid_source
       FROM up WHERE producer_id = $1 LIMIT 1`,
      [producerId]
    ),
    // PO = precio de compra al productor (lo que le pagan)
    db.query(
      `SELECT po_hoy, po_ayer FROM precios_region
       WHERE estado = (SELECT state_name FROM up WHERE producer_id = $1 LIMIT 1)
       ORDER BY fecha DESC LIMIT 1`,
      [producerId]
    ),
    // Alerta activa más reciente sin leer
    db.query(
      `SELECT mensaje, tipo FROM notificaciones
       WHERE usuario_id = $1
         AND tipo IN ('alerta_climatica','alerta_sanitaria')
         AND leida = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    ),
    // 3 bodegas aliadas más cercanas al centroide de la UP
    db.query(
      `SELECT i.id, i.nombre, i.municipio, i.estado_compra,
              i.precio_compra_hoy, i.is_ventanilla,
              ST_Distance(
                ST_SetSRID(ST_MakePoint(i.lng, i.lat), 4326)::geography,
                u.centroid::geography
              ) / 1000 AS distancia_km
       FROM infraestructura i, up u
       WHERE u.producer_id = $1
         AND i.activa = TRUE AND i.es_aliada = TRUE
       ORDER BY distancia_km ASC
       LIMIT 3`,
      [producerId]
    )
  ]);

  const up = upRes.rows[0];
  return res.json({
    municipio:          up?.municipality_name,
    estado:             up?.state_name,
    location_confirmed: up?.location_confirmed,
    centroid_source:    up?.centroid_source,
    precio_hoy:         precioRes.rows[0]?.po_hoy,
    precio_ayer:        precioRes.rows[0]?.po_ayer,
    alerta_activa:      alertaRes.rows[0] || null,
    bodegas_cercanas:   bodegasRes.rows
  });
});

// GET /api/productor/precios
// Los tres precios para P-11. Requiere JWT productor.
router.get('/productor/precios', authMiddleware, async (req, res) => {
  const producerId = req.user.producer_id;

  const upData = await db.query(
    `SELECT state_name FROM up WHERE producer_id = $1 LIMIT 1`, [producerId]
  );
  const estado = upData.rows[0]?.state_name;

  const [precioRes, tendenciaRes, firaRes] = await Promise.all([
    db.query(
      `SELECT po_hoy, po_ayer, s_promedio, ps_hoy, fecha
       FROM precios_region WHERE estado = $1 ORDER BY fecha DESC LIMIT 1`,
      [estado]
    ),
    db.query(
      `SELECT fecha, po_hoy AS precio_compra FROM precios_region
       WHERE estado = $1 ORDER BY fecha DESC LIMIT 30`,
      [estado]
    ),
    // Solo devuelve dato si el estado tiene registro en costos_fira
    db.query(
      `SELECT costo_por_ha, precio_fira, pct_ganancia, modalidad
       FROM costos_fira WHERE estado = $1 AND activo = TRUE
       ORDER BY vigente_desde DESC LIMIT 1`,
      [estado]
    )
  ]);

  const p = precioRes.rows[0];
  return res.json({
    estado,
    fecha:          p?.fecha,
    precio_compra:  p?.po_hoy,                        // PO — lo que le pagan al productor
    precio_bodega:  p?.po_hoy && p?.s_promedio
                      ? p.po_hoy + p.s_promedio : null, // PO + S
    precio_mercado: p?.ps_hoy,                         // PO + S + M + F (Precio Sistema)
    fira:           firaRes.rows[0] || null,            // null si el estado no tiene dato
    tendencia:      tendenciaRes.rows.reverse()
  });
});

// POST /api/productor/solicitar-apoyo
// Manifiesto de interés en una ventanilla. Requiere JWT productor.
router.post('/productor/solicitar-apoyo', authMiddleware, async (req, res) => {
  const { infraestructura_id, tipo_apoyo, notas } = req.body;
  const producerId = req.user.producer_id;

  const solicitud = await db.query(
    `INSERT INTO solicitudes_apoyo (producer_id, infraestructura_id, tipo_apoyo, notas_productor)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [producerId, infraestructura_id, tipo_apoyo, notas]
  );

  // Notificar al bodeguero de esa ventanilla
  const bodeguero = await db.query(
    `SELECT u.id FROM usuarios u
     JOIN bodeguero_infraestructura bi ON bi.usuario_id = u.id
     WHERE bi.infraestructura_id = $1 LIMIT 1`,
    [infraestructura_id]
  );
  if (bodeguero.rows.length) {
    await db.query(
      `INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
       VALUES ($1, 'solicitud_apoyo',
               'Un productor solicita información sobre apoyos disponibles.', $2)`,
      [bodeguero.rows[0].id, solicitud.rows[0].id]
    );
  }

  return res.status(201).json({ solicitud_id: solicitud.rows[0].id });
});

// GET /api/productor/mis-solicitudes
// Estado de las solicitudes de apoyo. Requiere JWT productor.
router.get('/productor/mis-solicitudes', authMiddleware, async (req, res) => {
  const producerId = req.user.producer_id;
  const { rows } = await db.query(
    `SELECT s.id, s.tipo_apoyo, s.estado, s.created_at, s.updated_at,
            i.nombre AS ventanilla_nombre, i.municipio
     FROM solicitudes_apoyo s
     JOIN infraestructura i ON i.id = s.infraestructura_id
     WHERE s.producer_id = $1 ORDER BY s.created_at DESC`,
    [producerId]
  );
  return res.json(rows);
});

// PATCH /api/productor/perfil
// Edita datos editables del perfil. Requiere JWT productor.
router.patch('/productor/perfil', authMiddleware, async (req, res) => {
  const { telefono, programas_beneficiario } = req.body;
  const producerId = req.user.producer_id;

  await db.query(
    `UPDATE producer SET
       telefono               = COALESCE($1, telefono),
       programas_beneficiario = COALESCE($2, programas_beneficiario),
       updated_at             = NOW()
     WHERE id = $3`,
    [telefono, programas_beneficiario, producerId]
  );
  return res.json({ ok: true });
});
```

---

## 4. Onboarding

### P-01 — Activar cuenta (búsqueda por CURP)

**Ruta:** `/activar`
**Endpoint:** `POST /api/auth/buscar-curp` (nuevo)
**Una acción:** escribir CURP y tocar "Buscar"

**Flujo:**
1. Campo CURP — mayúsculas automáticas, máx 18 chars
2. Botón deshabilitado hasta tener 18 chars exactos
3. Al buscar:
   - Encontrado + sin cuenta → muestra nombre para confirmar → navega a P-02
   - Encontrado + ya tiene cuenta → "Ya tienes cuenta. Inicia sesión." → `/login`
   - No encontrado → muestra opción "Regístrate como productor nuevo" → `/registro-nuevo`

```tsx
// src/pages/auth/ActivarCuentaPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActivarCuentaPage() {
  const [curp, setCurp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleBuscar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/buscar-curp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curp })
      });
      const data = await res.json();

      if (!data.encontrado) {
        setError('Tu CURP no está en el padrón.');
        return;
      }
      if (data.ya_tiene_cuenta) {
        navigate('/login', { state: { mensaje: 'Ya tienes cuenta activa. Inicia sesión.' } });
        return;
      }
      sessionStorage.setItem('activacion', JSON.stringify({
        producer_id:    data.producer_id,
        nombres:        data.nombres,
        apellido:       data.apellido
      }));
      navigate('/activar/pin');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#1A5C38] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-2xl font-bold">M</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Plan Nacional Maíz</h1>
        <p className="text-gray-500 text-sm mt-1">Activa tu cuenta</p>
      </div>

      <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escribe tu CURP
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Son 18 caracteres. Los encuentras en tu credencial del INE o acta de nacimiento.
        </p>
        <input
          type="text"
          value={curp}
          onChange={e => setCurp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={18}
          placeholder="AAAA000000AAAAAA00"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg
                     font-mono tracking-widest focus:border-[#1A5C38] focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{curp.length}/18</p>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleBuscar}
          disabled={curp.length !== 18 || loading}
          className="mt-4 w-full bg-[#1A5C38] text-white rounded-xl py-4 text-lg
                     font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? 'Buscando...' : 'Buscar mi registro'}
        </button>

        <div className="mt-8 text-center border-t pt-6">
          <p className="text-gray-500 text-sm">¿Eres productor nuevo y no apareces?</p>
          <button
            onClick={() => navigate('/registro-nuevo')}
            className="mt-2 text-[#1A5C38] font-semibold text-sm underline"
          >
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
}
```

### P-02 — Confirmación de identidad + crear PIN

**Ruta:** `/activar/pin`
**Endpoint:** `POST /api/auth/activar-cuenta`

```tsx
// src/components/productor/PinInput.tsx
interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
}

export default function PinInput({ value, onChange }: PinInputProps) {
  const keys = [1,2,3,4,5,6,7,8,9,'',0,'⌫'];

  const handlePress = (key: number | string) => {
    if (key === '⌫') onChange(value.slice(0, -1));
    else if (typeof key === 'number' && value.length < 4) onChange(value + key);
  };

  return (
    <div>
      {/* 4 círculos indicadores */}
      <div className="flex justify-center gap-5 mb-10">
        {[0,1,2,3].map(i => (
          <div key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-150
              ${i < value.length
                ? 'bg-[#1A5C38] border-[#1A5C38] scale-110'
                : 'border-gray-300 bg-white'}`}
          />
        ))}
      </div>

      {/* Teclado numérico 3x4 */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {keys.map((k, i) => (
          <button key={i} onClick={() => handlePress(k)}
            disabled={k === ''}
            className={`h-16 rounded-2xl text-2xl font-semibold
              active:scale-90 transition-all select-none
              ${k === ''      ? 'invisible'
              : k === '⌫'    ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### P-02b — Registro nuevo Tipo B

**Ruta:** `/registro-nuevo`
**Endpoint:** `POST /api/auth/registro-nuevo-productor`

**Formulario en 5 pasos — un grupo por pantalla:**

| Paso | Campos | Notas de UX |
|---|---|---|
| 1 | Nombre, apellido paterno, apellido materno, CURP | Nota: "Escríbelos como aparecen en tu INE" |
| 2 | Estado y municipio de la UP | Nota: "¿En qué estado y municipio está tu parcela?" Municipios cargan por estado. |
| 3 | Cultivo y variedad | Mismos catálogos que bodega. Nota: "¿Qué siembras principalmente?" |
| 4 | **Ubicación en mapa** | Pantalla completa dedicada. Ver código abajo. |
| 5 | Teléfono, PIN, programas de beneficiario | Nota PIN: "Este es tu código secreto de 4 números para entrar a la app" |

**Paso 4 — Mapa (pantalla dedicada):**

```tsx
// Instrucciones en pantalla antes del mapa:
// "Toca el mapa donde está tu parcela"
// "Puedes buscar una referencia con la lupa (ejido, carretera, localidad)"
// "Si no encuentras tu parcela, toca 'Usar mi municipio'"

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useRef, useState } from 'react';
import L from 'leaflet';

const pinVerde = new L.Icon({
  iconUrl: '/icons/pin-verde.svg',  // SVG de pin verde a crear
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Dentro del Paso 4:
const [coords, setCoords] = useState<{lat: number; lng: number} | null>(null);
const mapRef = useRef<L.Map>(null);
// municipioCentroide viene del paso 2 (buscar en municipios_referencia por nombre)

<div className="flex flex-col h-screen">
  {/* Instrucciones */}
  <div className="px-4 pt-4 pb-3 bg-white">
    <p className="text-base font-semibold text-gray-800">Marca tu parcela en el mapa</p>
    <p className="text-sm text-gray-500 mt-1">
      Toca el punto donde está tu terreno. Puedes buscar una referencia con la lupa.
    </p>
  </div>

  {/* Mapa */}
  <div className="flex-1 relative">
    <MapContainer
      ref={mapRef}
      center={[municipioCentroide.lat, municipioCentroide.lng]}
      zoom={13}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onMapClick={(lat, lng) => setCoords({ lat, lng })} />
      {coords && (
        <Marker
          position={[coords.lat, coords.lng]}
          icon={pinVerde}
          draggable
          eventHandlers={{
            dragend: e => setCoords({
              lat: e.target.getLatLng().lat,
              lng: e.target.getLatLng().lng
            })
          }}
        />
      )}
    </MapContainer>

    {/* Buscador tipo lupa superpuesto */}
    <div className="absolute top-3 left-3 right-3 z-[1000]">
      <NominatimSearch
        placeholder="Buscar ejido, carretera, localidad..."
        onSelect={(lat, lng) => {
          setCoords({ lat, lng });
          mapRef.current?.flyTo([lat, lng], 15);
        }}
      />
    </div>
  </div>

  {/* Botones abajo */}
  <div className="px-4 py-4 bg-white space-y-2 border-t">
    <button
      onClick={() => avanzarPaso5(coords)}
      disabled={!coords}
      className="w-full bg-[#1A5C38] text-white py-4 rounded-2xl text-base font-bold
                 disabled:opacity-40"
    >
      {coords ? 'Confirmar ubicación' : 'Toca el mapa para marcar'}
    </button>
    <button
      onClick={() => usarCentroMunicipio()}
      className="w-full border border-gray-300 text-gray-600 py-3 rounded-2xl text-sm"
    >
      Usar el centro de mi municipio
    </button>
    <button
      onClick={() => avanzarPaso5(null)}
      className="w-full text-gray-400 py-2 text-sm"
    >
      Ahora no
    </button>
  </div>
</div>
```

```tsx
// src/components/productor/NominatimSearch.tsx
// Buscador de dirección usando Nominatim (OpenStreetMap — gratuito)
import { useState, useRef } from 'react';

interface Props {
  placeholder: string;
  onSelect: (lat: number, lng: number, nombre: string) => void;
}

export default function NominatimSearch({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const buscar = (q: string) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.length < 3) { setResultados([]); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=mx&format=json&limit=5`,
          { headers: { 'Accept-Language': 'es' } }
        );
        setResultados(await res.json());
      } finally { setLoading(false); }
    }, 500); // debounce 500ms para no saturar Nominatim
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-xl shadow-md px-3 py-2.5">
        <span className="text-gray-400 mr-2">🔍</span>
        <input
          value={query}
          onChange={e => buscar(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {loading && <span className="text-xs text-gray-400">Buscando...</span>}
      </div>

      {resultados.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl
                        shadow-lg z-10 overflow-hidden">
          {resultados.map((r, i) => (
            <button key={i}
              onClick={() => {
                onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                setResultados([]);
                setQuery(r.display_name.split(',')[0]);
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-700
                         hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Dashboard P-03

**Ruta:** `/productor` (índice)
**Endpoint:** `GET /api/productor/dashboard`
**Scroll vertical, sin tabs, sin menú complejo.**

```tsx
// src/pages/productor/DashboardProductorPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const SEMAFORO = {
  comprando:  { emoji: '🟢', texto: 'Comprando' },
  limitado:   { emoji: '🟡', texto: 'Capacidad limitada' },
  no_compra:  { emoji: '🔴', texto: 'No compra esta semana' },
};

export default function DashboardProductorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPendiente = user?.estado_validacion === 'pendiente';

  useEffect(() => {
    fetch('/api/productor/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;

  const delta = (data?.precio_hoy ?? 0) - (data?.precio_ayer ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Bloque 1 — Alerta activa (solo si hay) */}
      {data?.alerta_activa && (
        <div className={`px-4 py-3 flex items-center justify-between
          ${data.alerta_activa.tipo === 'alerta_climatica'
            ? 'bg-orange-500' : 'bg-red-600'}`}>
          <p className="text-white text-sm font-medium flex-1 leading-tight">
            ⚠ {data.alerta_activa.mensaje}
          </p>
          <button onClick={() => navigate('/productor/alertas')}
            className="ml-3 text-white text-xs border border-white/60
                       rounded-lg px-3 py-1.5 shrink-0 font-medium">
            Ver detalle
          </button>
        </div>
      )}

      {/* Header verde */}
      <div className="bg-[#1A5C38] px-4 pt-5 pb-6">
        <p className="text-green-200 text-sm">
          {data?.municipio} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-white text-lg font-semibold mt-0.5">
          Buenos días, {user?.nombres?.split(' ')[0]}
        </p>
      </div>

      {/* Bloque 2 — Precio del día */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Precio de compra hoy · tu región
        </p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">
            ${data?.precio_hoy?.toLocaleString('es-MX') ?? '—'}
          </span>
          <span className="text-base text-gray-400 pb-1">/ton</span>
          {delta !== 0 && (
            <span className={`text-sm pb-1 font-semibold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toLocaleString('es-MX')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Publicado 7:00 am · Promedio regional</p>
        <button onClick={() => navigate('/productor/precios')}
          className="mt-3 text-[#1A5C38] text-sm font-semibold">
          Ver desglose de precios →
        </button>
      </div>

      {/* Bloque 3 — Bodegas cercanas */}
      <div className="mx-4 mt-5">
        <p className="text-sm font-bold text-gray-700 mb-3">Bodegas comprando hoy</p>
        <div className="space-y-2">
          {(data?.bodegas_cercanas ?? []).map((b: any) => (
            <button key={b.id}
              onClick={() => navigate(`/productor/mapa/bodega/${b.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100
                         flex items-center justify-between active:scale-[0.98]
                         transition-transform text-left">
              <div className="flex items-center gap-3">
                <span className="text-xl">{SEMAFORO[b.estado_compra as keyof typeof SEMAFORO]?.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{b.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.municipio} · {parseFloat(b.distancia_km).toFixed(0)} km
                    {b.is_ventanilla && (
                      <span className="ml-2 bg-[#E8F5EE] text-[#1A5C38] text-xs
                                       px-2 py-0.5 rounded-full font-medium">
                        Ventanilla
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-gray-900 text-sm">
                  ${b.precio_compra_hoy?.toLocaleString('es-MX') ?? '—'}
                </p>
                <p className="text-xs text-gray-400">/ton</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/productor/mapa')}
          className="w-full mt-3 py-3 text-[#1A5C38] text-sm font-semibold
                     border-2 border-[#1A5C38] rounded-2xl active:bg-green-50">
          Ver mapa completo
        </button>
      </div>

      {/* Bloque 4 — Botón principal */}
      <div className="mx-4 mt-5">
        <button
          onClick={() => !isPendiente && navigate('/productor/disponibilidad/tipo')}
          disabled={isPendiente}
          className={`w-full py-5 rounded-2xl text-white text-lg font-bold
            flex items-center justify-center gap-3 transition-all
            ${isPendiente ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#1A5C38] active:scale-[0.97] shadow-lg shadow-green-900/20'}`}
        >
          <span className="text-2xl">🌽</span>
          Tengo maíz disponible
        </button>
        {isPendiente && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Tu cuenta está en validación. Te avisamos cuando puedas declarar disponibilidad.
          </p>
        )}
      </div>

      {/* Banner sugerido de ubicación (si centroide es aproximado) */}
      {data && !data.location_confirmed && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 text-sm font-semibold">
            📍 Mejora tu experiencia
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Marca tu parcela en el mapa para ver solo las bodegas más cercanas a ti.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => navigate('/productor/ubicacion')}
              className="flex-1 bg-amber-500 text-white text-sm py-2.5 rounded-xl font-semibold">
              Marcar mi parcela
            </button>
            <button onClick={() => {/* dismiss — guardar en localStorage */}}
              className="px-4 text-amber-600 text-sm">
              Ahora no
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Flujo de disponibilidad

**Rutas:** `P-04` → `P-05` → `P-06` → `P-07`
**Endpoint final:** `POST /api/productor/disponibilidad` (ya existe en backend ✅)
**Catálogos:** `GET /api/catalogos-productor` (ya existe ✅ — mismos que usa bodega)

### Stepper compartido

```tsx
// src/components/productor/DisponibilidadStepper.tsx
export default function DisponibilidadStepper({ paso }: { paso: 1|2|3 }) {
  const labels = ['Tipo', 'Variedad', 'Volumen y fecha'];
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-center gap-2">
        {[1,2,3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
              text-sm font-bold transition-all
              ${n < paso  ? 'bg-[#1A5C38] text-white'
              : n === paso ? 'bg-[#1A5C38] text-white ring-4 ring-green-100'
              : 'bg-gray-200 text-gray-400'}`}>
              {n < paso ? '✓' : n}
            </div>
            {n < 3 && (
              <div className={`h-0.5 w-8 transition-all
                ${n < paso ? 'bg-[#1A5C38]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">{labels[paso-1]}</p>
    </div>
  );
}
```

### P-04 — Tipo de maíz

```tsx
// src/pages/productor/DisponibilidadTipoPage.tsx
const TIPOS = [
  { valor: 'blanco',   etiqueta: 'Maíz Blanco',  emoji: '⬜', descripcion: 'H-40, H-59, H-564C y otros' },
  { valor: 'amarillo', etiqueta: 'Maíz Amarillo', emoji: '🟡', descripcion: 'H-384A, H-385, Búho y otros' },
  { valor: 'criollo',  etiqueta: 'Maíz Criollo',  emoji: '🌽', descripcion: 'Criollo local o nativo' },
];

export default function DisponibilidadTipoPage() {
  const navigate = useNavigate();

  const seleccionar = (tipo: string) => {
    sessionStorage.setItem('disp_tipo', tipo);
    navigate('/productor/disponibilidad/variedad');
  };

  return (
    <div className="min-h-screen bg-white">
      <DisponibilidadStepper paso={1} />
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
          ¿Qué tipo de maíz tienes?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">Toca una opción para continuar</p>

        <div className="space-y-3">
          {TIPOS.map(t => (
            <button key={t.valor} onClick={() => seleccionar(t.valor)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl
                         py-5 px-5 flex items-center gap-4 text-left
                         active:border-[#1A5C38] active:bg-green-50 transition-all">
              <span className="text-4xl">{t.emoji}</span>
              <div>
                <p className="text-lg font-semibold text-gray-800">{t.etiqueta}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### P-05 — Variedad

Cargar variedades del catálogo según el tipo guardado en sessionStorage.
Mismos datos que usa el formulario de bodega — `GET /api/catalogos-productor`.
Mostrar como lista de botones grandes, un toque selecciona y avanza.

### P-06 — Volumen y fecha de disponibilidad

```tsx
// Slider de volumen: 1 a 200 toneladas, step 1, display grande
// Fecha: 4 botones rápidos + opción de fechas personalizadas
// Etiqueta del campo de fecha: "¿Cuándo estará disponible?" — NO solo "fecha"

const RANGOS_RAPIDOS = [
  { label: 'Esta semana',       dias: 7  },
  { label: 'Este mes',          dias: 30 },
  { label: 'Próximos 2 meses',  dias: 60 },
  { label: 'Elegir fechas',     dias: null },
];
// Si elige "Elegir fechas" → mostrar dos date pickers nativos (tipo date)
```

### P-07 — Confirmación final

```tsx
// Resumen visual antes de enviar
// Al tocar Confirmar → POST /api/productor/disponibilidad

const payload = {
  tipo_maiz:              sessionStorage.getItem('disp_tipo'),
  variedad_id:            Number(sessionStorage.getItem('disp_variedad_id')),
  volumen_ton:            Number(sessionStorage.getItem('disp_volumen')),
  fecha_disponible_desde: sessionStorage.getItem('disp_fecha_desde'),
  fecha_disponible_hasta: sessionStorage.getItem('disp_fecha_hasta'),
  // El backend obtiene up_id del JWT del productor
};

// Mensaje en pantalla (NO modificar este texto):
// "Las bodegas cercanas a tu zona podrán ver que tienes maíz disponible.
//  Te notificamos si alguna está interesada."
```

---

## 7. Mapa

### P-08 — Mapa de bodegas con señales de compra

**Ruta:** `/productor/mapa`
**Reescribir desde cero en React — no adaptar el Vue existente.**

**Capas del mapa (Leaflet):**

```tsx
// src/pages/productor/MapaBodegasPage.tsx
// Capas en orden de z-index:

// 1. Pin verde — UP del productor
const ICON_UP = new L.Icon({
  iconUrl: '/icons/pin-up-productor.svg',
  iconSize: [36, 36], iconAnchor: [18, 36]
});

// 2. Radio de incertidumbre — si location_confirmed = FALSE y centroid_source = 'municipio'
// Muestra círculo semitransparente de 5km alrededor del centroide
{!up.location_confirmed && up.centroid_source === 'municipio' && (
  <Circle
    center={[up.lat, up.lng]}
    radius={5000}  // 5km en metros
    pathOptions={{ color: '#1A5C38', fillColor: '#1A5C38', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
  />
)}

// Tooltip educativo sobre el radio de incertidumbre:
// "Tu parcela está en esta zona aproximada. Toca aquí para marcar la ubicación exacta."

// 3. Marcadores de bodegas — color según estado_compra
const iconBodega = (estadoCompra: string, tieneSenal: boolean) => new L.DivIcon({
  className: '',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-md
        ${estadoCompra === 'comprando' ? 'bg-green-600'
        : estadoCompra === 'limitado'  ? 'bg-yellow-500'
        : 'bg-red-500'}
        ${tieneSenal ? 'ring-4 ring-green-300 animate-pulse' : ''}">
        <span class="text-white text-lg">🏪</span>
      </div>
    </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20]
});

// 4. Popup de bodega con botón "Me interesa"
<Popup>
  <div className="p-2 min-w-52">
    <p className="font-bold text-gray-800">{bodega.nombre}</p>
    <p className="text-sm text-gray-500">{bodega.municipio} · {bodega.distancia_km.toFixed(0)} km</p>

    {bodega.senal_activa && (
      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-green-800 font-medium">
          Busca {bodega.senal_activa.volumen_ton} ton · ${bodega.senal_activa.precio_oferta}/ton
        </p>
        <p className="text-xs text-green-600">
          Tipo: {bodega.senal_activa.tipo_maiz}
        </p>
        <button onClick={() => handleMeInteresa(bodega.senal_activa.id)}
          className="mt-2 w-full bg-[#1A5C38] text-white text-sm py-2
                     rounded-lg font-semibold">
          Me interesa →
        </button>
      </div>
    )}

    <button onClick={() => navigate(`/productor/mapa/bodega/${bodega.id}`)}
      className="mt-2 w-full border border-gray-300 text-gray-700
                 text-sm py-2 rounded-lg">
      Ver detalle completo
    </button>
  </div>
</Popup>

// Endpoint para "Me interesa" — YA EXISTE en backend bodega:
const handleMeInteresa = async (señalId: number) => {
  await fetch(`/api/senales-compra/${señalId}/interes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  // Mostrar toast: "Le avisamos a la bodega que estás interesado"
};
```

**Insumos para el mapa:**
- Tiles: OpenStreetMap (gratuito, sin API key)
- Geocodificador: Nominatim (gratuito)
- GeoJSON centroides: INEGI Marco Geoestadístico (ver §15)

### P-10 — Completar ubicación (sugerida, opcional)

Esta pantalla se muestra como sugerencia desde el dashboard, no como bloqueo.
Misma lógica del mapa del P-02b paso 4: buscador Nominatim, pin arrastrable, centroide del municipio como fallback.

Al guardar → `PATCH /api/productor/ubicacion`

---

## 8. Precios — P-11

**Ruta:** `/productor/precios`
**Endpoint:** `GET /api/productor/precios` (nuevo — ver §3.2)

**Tres precios — explicación pedagógica para el productor:**

```tsx
// src/pages/productor/PreciosProductorPage.tsx
const PRECIOS_CONFIG = [
  {
    clave: 'precio_compra',
    etiqueta: 'Precio de compra',
    descripcion: 'Lo que te pagan por tu maíz hoy en tu región',
    color: 'text-[#1A5C38]',
    bg: 'bg-green-50',
    importante: true,  // Este es el más importante para el productor
  },
  {
    clave: 'precio_bodega',
    etiqueta: 'Precio bodega',
    descripcion: 'Precio de compra más los servicios de secado y limpieza',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    importante: false,
  },
  {
    clave: 'precio_mercado',
    etiqueta: 'Precio de mercado',
    descripcion: 'Lo que paga la industria harinera. Incluye transporte.',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    importante: false,
  },
];

// Gráfica de tendencia 30 días — Chart.js LineChart
// Solo mostrar el precio de compra (PO) — la más relevante para el productor
// Eje Y en pesos, eje X en fechas cortas (15 abr, 22 abr...)

// Bloque FIRA — solo si data.fira !== null
{data.fira && (
  <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">
      Referencia de costos FIRA · {data.estado}
    </p>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Modalidad</span>
        <span className="font-medium">{data.fira.modalidad}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Costo por hectárea</span>
        <span className="font-semibold">${data.fira.costo_por_ha.toLocaleString('es-MX')}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Precio FIRA de referencia</span>
        <span className="font-semibold text-[#1A5C38]">${data.fira.precio_fira.toLocaleString('es-MX')}/ton</span>
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-3">
      Fuente: FIRA · Ciclo PV 2026. Solo disponible para estados con datos reportados.
    </p>
  </div>
)}
```

---

## 9. Confirmar transacción — P-12

**Ruta:** `/productor/transaccion/:id/confirmar`
**Endpoint:** `PATCH /api/transacciones/:id/confirmar` (ya existe ✅)
**Diseño muy visual — dos botones grandes, sin ambigüedad.**

```tsx
// src/pages/productor/ConfirmarTransaccionPage.tsx
// GET /api/transacciones/:id debe devolver:
// bodega_nombre, tipo_maiz, volumen_ton, precio_ton, fecha

const confirmar = async (esCorrecta: boolean) => {
  await fetch(`/api/transacciones/${id}/confirmar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ confirmado: esCorrecta })
  });
  navigate('/productor', { state: { mensaje: esCorrecta ? 'Transacción confirmada' : 'Discrepancia reportada' } });
};

return (
  <div className="min-h-screen bg-white flex flex-col px-4 pt-10">
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
                      justify-center mx-auto mb-4 text-4xl">
        🌽
      </div>
      <h2 className="text-xl font-bold text-gray-800">
        {txn.bodega_nombre} registró una compra
      </h2>
      <p className="text-gray-500 text-sm mt-2">¿Los datos son correctos?</p>
    </div>

    {/* Resumen */}
    <div className="bg-gray-50 rounded-2xl p-5 mb-8 space-y-3">
      {[
        { label: 'Bodega',        value: txn.bodega_nombre },
        { label: 'Tipo de maíz',  value: txn.tipo_maiz },
        { label: 'Volumen',       value: `${txn.volumen_ton} toneladas` },
        { label: 'Precio por ton',value: `$${txn.precio_ton?.toLocaleString('es-MX')}` },
        { label: 'Total',         value: `$${(txn.volumen_ton * txn.precio_ton)?.toLocaleString('es-MX')}`, bold: true },
      ].map(row => (
        <div key={row.label} className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">{row.label}</span>
          <span className={`text-sm ${row.bold ? 'font-bold text-gray-900 text-base' : 'font-medium text-gray-800'}`}>
            {row.value}
          </span>
        </div>
      ))}
    </div>

    {/* Dos botones grandes */}
    <button onClick={() => confirmar(true)}
      className="w-full bg-[#1A5C38] text-white py-5 rounded-2xl text-lg
                 font-bold active:scale-95 transition-transform mb-3 shadow-lg">
      ✓ Sí, es correcto
    </button>
    <button onClick={() => confirmar(false)}
      className="w-full border-2 border-red-400 text-red-600 py-5 rounded-2xl
                 text-lg font-bold active:scale-95 transition-transform">
      ✗ Los datos no son correctos
    </button>
    <p className="text-center text-xs text-gray-400 mt-4">
      Si hay un error, el equipo técnico lo revisará y te contactará.
    </p>
  </div>
);
```

---

## 10. Alertas — P-13

**Ruta:** `/productor/alertas`
**Endpoint:** `GET /api/alertas/notificaciones/mis` (CORREGIR BUG antes — ver §13)

Lista de alertas ordenada por fecha, más recientes primero.
Cada tarjeta muestra: ícono de tipo, badge de nivel (rojo/naranja/amarillo), descripción corta, fecha.
Al tocar: expande con la recomendación de acción completa.

```tsx
const NIVEL_CONFIG = {
  alto:   { color: 'bg-red-100 text-red-700 border-red-200',    label: 'Alto' },
  medio:  { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Medio' },
  bajo:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Bajo' },
  critico:{ color: 'bg-red-200 text-red-800 border-red-300',    label: 'Crítico' },
};
```

---

## 11. Incentivos y coberturas — P-14, P-15, P-16

### P-14 — Pantalla de apoyos

**Distinción visual MUY CLARA entre apoyos del gobierno y servicios de bodega:**

```tsx
// src/pages/productor/IncentivosPage.tsx
return (
  <div className="min-h-screen bg-gray-50 px-4 pt-6 pb-24">
    <h2 className="text-xl font-bold text-gray-800 mb-1">Apoyos disponibles</h2>
    <p className="text-gray-500 text-sm mb-6">Apoyos del gobierno para productores</p>

    {/* INCENTIVOS */}
    <button onClick={() => navigate('/productor/ventanillas?tipo=incentivo')}
      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                 flex items-center gap-4 mb-3 text-left active:scale-[0.98]">
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
        🏛
      </div>
      <div>
        <p className="font-bold text-gray-800">Incentivos</p>
        <p className="text-sm text-gray-500 mt-0.5">
          Apoyos económicos directos para tu producción de maíz.
          Consulta los programas disponibles en tu región.
        </p>
      </div>
      <span className="text-gray-400 ml-auto">›</span>
    </button>

    {/* COBERTURAS */}
    <button onClick={() => navigate('/productor/ventanillas?tipo=cobertura')}
      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                 flex items-center gap-4 mb-6 text-left active:scale-[0.98]">
      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
        🛡
      </div>
      <div>
        <p className="font-bold text-gray-800">Coberturas</p>
        <p className="text-sm text-gray-500 mt-0.5">
          Protección contra riesgos climáticos y de precio para tu ciclo productivo.
        </p>
      </div>
      <span className="text-gray-400 ml-auto">›</span>
    </button>

    {/* SEPARADOR — servicios de bodega NO son apoyos */}
    <div className="border-t border-gray-200 pt-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">
        Servicios comerciales de bodega
      </p>
      <div className="bg-gray-100 rounded-2xl p-4">
        <p className="text-sm text-gray-700 font-medium">
          Los servicios de secado, limpieza y almacenamiento tienen un costo.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          No son apoyos del gobierno. Los cobra la bodega directamente.
        </p>
        <button onClick={() => navigate('/productor/mapa')}
          className="mt-3 text-[#1A5C38] text-sm font-semibold">
          Ver bodegas con servicios →
        </button>
      </div>
    </div>
  </div>
);
```

### P-15 — Lista de ventanillas

**Endpoint:** `GET /api/infraestructura?is_ventanilla=true`
Filtrar por estado del productor. Lista de tarjetas con nombre, municipio, tipo de apoyo y distancia.
Botón "Solicitar información" en cada tarjeta → abre confirmación → `POST /api/productor/solicitar-apoyo`

### P-16 — Estado de mi solicitud

**Endpoint:** `GET /api/productor/mis-solicitudes`

```tsx
// Timeline vertical de estados:
const ESTADOS = ['enviada', 'recibida', 'contactado', 'agendada', 'canalizada'];
const ESTADO_LABELS = {
  enviada:    'Solicitud enviada',
  recibida:   'La ventanilla recibió tu solicitud',
  contactado: 'La ventanilla te va a contactar',
  agendada:   'Cita agendada',
  canalizada: 'Solicitud canalizada con éxito',
};
```

---

## 12. Mi perfil — P-17

**Ruta:** `/productor/perfil`
**Botón de edición en cada sección — no un formulario completo.**

```tsx
// src/pages/productor/MiPerfilPage.tsx
// Secciones y editabilidad:

const SECCIONES = [
  {
    titulo: 'Datos personales',
    editable: false,  // vienen del padrón — solo admin puede cambiar
    campos: ['nombres', 'apellido_paterno', 'apellido_materno', 'curp'],
    nota: 'Estos datos vienen del padrón. Si hay un error, contacta a tu técnico territorial.'
  },
  {
    titulo: 'Contacto',
    editable: true,   // PATCH /api/productor/perfil { telefono }
    campos: ['telefono'],
  },
  {
    titulo: 'Mi parcela',
    editable: true,   // Botón "Actualizar ubicación" → /productor/ubicacion
    campos: ['state_name', 'municipality_name'],
    accion: 'Actualizar ubicación en el mapa'
  },
  {
    titulo: 'Mi cultivo',
    editable: true,   // PATCH /api/productor/perfil — requiere validación admin
    campos: ['tipo_maiz', 'variedad'],
    nota: 'Los cambios en cultivo y variedad requieren validación.'
  },
  {
    titulo: 'Programas de beneficiario',
    editable: true,   // PATCH /api/productor/perfil { programas_beneficiario }
    tipo: 'multiselect',
    opciones: PROGRAMAS_GOBIERNO,  // los 7 programas del catálogo
  },
];

// Mapa mini de la UP (Leaflet estático, sin interacción)
// Muestra el centroide con pin verde y radio de incertidumbre si aplica

// Historial de disponibilidades — GET /api/productor/disponibilidad
// Historial de transacciones confirmadas — GET /api/transacciones (filtrado por productor)
```

---

## 13. Bug fixes urgentes

### Bug 1 — Notificaciones de mercado no llegan al productor 🔴

**Archivo a modificar:** el endpoint `GET /api/alertas/notificaciones/mis`

```typescript
// ANTES — INCORRECTO (INNER JOIN excluye notificaciones sin alerta_id):
`SELECT n.*, a.titulo FROM notificaciones n
 JOIN alertas a ON a.id = n.alerta_id
 WHERE n.usuario_id = $1 ORDER BY n.created_at DESC`

// DESPUÉS — CORRECTO (LEFT JOIN incluye todas):
`SELECT n.id, n.tipo, n.mensaje, n.leida, n.created_at, n.referencia_id,
        a.titulo AS alerta_titulo
 FROM notificaciones n
 LEFT JOIN alertas a ON a.id = n.alerta_id  -- LEFT JOIN, no INNER
 WHERE n.usuario_id = $1
 ORDER BY n.created_at DESC
 LIMIT 50`
```

**Impacto:** Sin este fix, el productor nunca ve notificaciones de señales de compra, transacciones o interés de bodegas. Hacer este fix ANTES de construir P-13.

### Bug 2 — minLength del PIN en registro

Antes de construir P-01, verificar en el código de registro/login:

```typescript
// Buscar en los controladores de auth — si existe:
if (password.length < 8) ...

// Agregar condición para rol productor:
const minLength = body.rol === 'productor' ? 4 : 8;
if (password.length < minLength) {
  return res.status(400).json({ error: 'Credencial demasiado corta' });
}
```

---

## 14. Integración SENASICA — módulo preparado, inactivo en piloto

> Las tablas ya están creadas (§2.3). Este módulo se activa cuando SENASICA entregue la primera base de datos. No requiere más trabajo de BD.

### Script de importación (crear antes del piloto)

```typescript
// backend/scripts/importar-alertas-senasica.ts
// Ejecutar manualmente o como cron job al recibir el CSV de SENASICA

async function importarAlertas(filePath: string) {
  const alertas = await parsearCSV(filePath);

  for (const a of alertas) {
    // 1. Insertar alerta
    const { rows } = await db.query(`
      INSERT INTO alertas_externas (
        tipo_alerta, subtipo, nivel_riesgo, descripcion, recomendacion,
        cultivo_afectado, coordenada, radio_km, estado, municipio,
        fecha_deteccion, fecha_vigencia, fuente, id_alerta_origen)
      VALUES ($1,$2,$3,$4,$5,$6,
              ST_SetSRID(ST_MakePoint($7,$8), 4326),
              $9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (id_alerta_origen) DO NOTHING
      RETURNING id`,
      [a.tipo_alerta, a.subtipo, a.nivel_riesgo, a.descripcion, a.recomendacion,
       a.cultivo_afectado, a.longitud, a.latitud, a.radio_km,
       a.estado, a.municipio, a.fecha_deteccion, a.fecha_vigencia,
       a.fuente, a.id_alerta_origen]
    );

    if (!rows.length) continue; // Ya existía
    const alertaId = rows[0].id;

    // 2. Calcular qué UPs están dentro del radio — ST_DWithin con geography
    // geography usa metros, radio_km * 1000 = metros
    const upsAfectadas = await db.query(`
      SELECT u.id AS up_id, p.usuario_id,
             ST_Distance(u.centroid::geography, ae.coordenada::geography) / 1000 AS distancia_km
      FROM up u
      JOIN producer p ON p.id = u.producer_id
      JOIN alertas_externas ae ON ae.id = $1
      WHERE ST_DWithin(
              u.centroid::geography,
              ae.coordenada::geography,
              ae.radio_km * 1000
            )
        AND ($2 = 'todos' OR EXISTS (
              SELECT 1 FROM cycle_crop cc
              WHERE cc.up_id = u.id AND cc.crop ILIKE '%' || $2 || '%'
            ))`,
      [alertaId, a.cultivo_afectado]
    );

    // 3. Insertar intersecciones y notificaciones
    for (const up of upsAfectadas.rows) {
      await db.query(`
        INSERT INTO alertas_up (alerta_id, up_id, distancia_km)
        VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [alertaId, up.up_id, up.distancia_km]
      );

      await db.query(`
        INSERT INTO notificaciones (usuario_id, tipo, mensaje, alerta_id)
        VALUES ($1, $2, $3, $4)`,
        [up.usuario_id,
         a.tipo_alerta === 'fitosanitaria' ? 'alerta_sanitaria' : 'alerta_climatica',
         `⚠ ${a.subtipo} detectado en tu zona. ${a.recomendacion}`,
         alertaId]
      );
    }
  }
}
```

### Requerimiento formal a SENASICA

**Contacto:** alerta.sanitaria@senasica.gob.mx
**Referencia:** Sistema de Alerta Fitosanitaria (SAF) — Pulso Sanitario
**URL:** https://dj.senasica.gob.mx/SAS/Home/SAF

**Petición en dos etapas:**

**Etapa 1 — Piloto (inmediata):** Envío de CSV semanal con alertas activas en el formato especificado abajo.

**Etapa 2 — Largo plazo:** Acceso a la API del SAF para consulta automatizada en tiempo real.

**Formato CSV requerido (Etapa 1):**

| Columna | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|
| `id_alerta` | Texto | Sí | `SAF-2026-0341` |
| `tipo_alerta` | Texto | Sí | `fitosanitaria` o `climatica` |
| `subtipo` | Texto | Sí | `gusano_cogollero` |
| `nivel_riesgo` | Texto | Sí | `alto` |
| `descripcion` | Texto | Sí | Máx. 200 chars |
| `recomendacion` | Texto | No | Acción sugerida, máx. 300 chars |
| `cultivo_afectado` | Texto | Sí | `maiz_blanco`, `maiz_amarillo` o `todos` |
| `latitud` | Decimal | Sí | `20.5432` |
| `longitud` | Decimal | Sí | `-103.7621` |
| `radio_afectacion_km` | Entero | Sí | `30` |
| `estado` | Texto | Sí | `Jalisco` |
| `municipio` | Texto | Sí | `Ameca` |
| `fecha_deteccion` | Fecha | Sí | `2026-06-01` |
| `fecha_vigencia` | Fecha | No | `2026-06-15` |
| `fuente` | Texto | Sí | `SENASICA`, `INIFAP`, `SMN` |

**Preguntas a confirmar con SENASICA:**
1. ¿El SAF tiene alertas clasificadas por cultivo (maíz específicamente)?
2. ¿Los datos incluyen coordenadas de punto, o solo municipio/estado?
3. ¿Existe mecanismo de descarga/exportación del SAF que podamos usar en Etapa 1?
4. ¿Proceso para solicitar acceso a la API en Etapa 2?

---

## 15. Insumos externos requeridos

El desarrollador necesita estos recursos antes de construir las pantallas de mapa.
**Todos son gratuitos.**

| Insumo | Para qué pantalla | Fuente | Cómo obtenerlo |
|---|---|---|---|
| GeoJSON centroides de municipios México | P-02b paso 4, P-10, P-08 | INEGI Marco Geoestadístico | Descargar de inegi.org.mx. Procesar con ogr2ogr y cargar en `municipios_referencia`. |
| Nominatim (geocodificador) | P-02b, P-08, P-10 | OpenStreetMap | No requiere instalación. Llamadas a `nominatim.openstreetmap.org`. Respetar límite de 1 req/seg. |
| OpenStreetMap tiles | Todos los mapas | openstreetmap.org | Ya configurado en Leaflet. Sin cambios. |
| Archivo CSV SENASICA | P-13 (alertas) | SENASICA | Solicitar por correo (ver §14). Inactivo en piloto. |

**Comando para cargar el GeoJSON de INEGI:**

```bash
# Después de descargar y descomprimir el Marco Geoestadístico de INEGI:
ogr2ogr \
  -f "PostgreSQL" \
  PG:"host=localhost dbname=simac user=postgres" \
  municipios.geojson \
  -nln municipios_referencia \
  -sql "SELECT CVE_GEO AS cve_geo, NOMGEO AS nombre, NOM_ENT AS estado,
               ST_Centroid(geometry) AS centroid
        FROM municipios"

# Verificar:
psql -d simac -c "SELECT COUNT(*) FROM municipios_referencia;"
# Debe devolver ~2,469 (total de municipios en México)
```

---

*Documento técnico generado: Mayo 2026*
*SIMAC — Plan Nacional Maíz 2026*
*Repo: github.com/Jesus200995/Simulador*
*Siguiente revisión: al completar P-01 a P-03 (onboarding y dashboard)*
