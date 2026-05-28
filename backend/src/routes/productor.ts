import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Normalizar texto: MAYÚSCULAS y sin tildes/acentos
function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// ─────────────────────────────────────────────
// AUTH — Activación por CURP (Tipo A)
// ─────────────────────────────────────────────

// POST /api/productor/auth/buscar-curp
router.post('/auth/buscar-curp', async (req, res): Promise<void> => {
  try {
    const { curp } = req.body;
    if (!curp || curp.length !== 18) {
      res.status(400).json({ error: 'CURP inválida' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT p.producer_id, p.nombres, p.apellido_paterno, p.estado_validacion,
              u.id AS usuario_id
       FROM producer p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE UPPER(p.curp) = UPPER($1)`,
      [curp]
    );

    if (!rows.length) {
      res.json({ encontrado: false });
      return;
    }

    res.json({
      encontrado: true,
      nombres: rows[0].nombres,
      apellido: rows[0].apellido_paterno,
      producer_id: rows[0].producer_id,
      ya_tiene_cuenta: !!rows[0].usuario_id,
    });
  } catch (error) {
    console.error('Error en buscar-curp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productor/auth/activar-cuenta
router.post('/auth/activar-cuenta', async (req, res): Promise<void> => {
  try {
    const { producer_id, pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'El PIN debe ser exactamente 4 dígitos' });
      return;
    }

    const existing = await pool.query(
      `SELECT u.id FROM usuarios u JOIN producer p ON p.usuario_id = u.id WHERE p.producer_id = $1`,
      [producer_id]
    );
    if (existing.rows.length) {
      res.status(409).json({ error: 'Este productor ya tiene cuenta activa' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    // Transacción: crear usuario + vincular productor
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const u = await client.query(
        `INSERT INTO usuarios (password_hash, rol, activo) VALUES ($1, 'productor', true) RETURNING id`,
        [hashedPin]
      );

      const producer = await client.query(
        `UPDATE producer
         SET usuario_id = $1, tipo_registro = 'A', estado_validacion = 'activo'
         WHERE producer_id = $2 RETURNING nombres, apellido_paterno`,
        [u.rows[0].id, producer_id]
      );

      await client.query('COMMIT');

      const secret = process.env.JWT_SECRET || 'default_secret';
      const token = jwt.sign(
        { userId: u.rows[0].id, rol: 'productor', producer_id },
        secret,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: {
          id: u.rows[0].id,
          rol: 'productor',
          producer_id,
          nombres: producer.rows[0]?.nombres,
          apellido_paterno: producer.rows[0]?.apellido_paterno,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en activar-cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productor/auth/login-pin
// Login con CURP + PIN (para productores)
router.post('/auth/login-pin', async (req, res): Promise<void> => {
  try {
    const { curp, pin } = req.body;
    if (!curp || !pin) {
      res.status(400).json({ error: 'CURP y PIN son obligatorios' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT p.producer_id, p.nombres, p.apellido_paterno, p.estado_validacion,
              u.id AS user_id, u.password_hash, u.rol
       FROM producer p
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE UPPER(p.curp) = UPPER($1) AND u.activo = true`,
      [curp]
    );

    if (!rows.length) {
      res.status(401).json({ error: 'CURP no registrada o cuenta inactiva' });
      return;
    }

    const user = rows[0];
    const pinValido = await bcrypt.compare(pin, user.password_hash);
    if (!pinValido) {
      res.status(401).json({ error: 'PIN incorrecto' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      { userId: user.user_id, rol: 'productor', producer_id: user.producer_id },
      secret,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        rol: 'productor',
        producer_id: user.producer_id,
        nombres: user.nombres,
        apellido_paterno: user.apellido_paterno,
        estado_validacion: user.estado_validacion,
      },
    });
  } catch (error) {
    console.error('Error en login-pin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productor/auth/registro-nuevo
// Registro Tipo B — cuenta queda en estado 'pendiente'
router.post('/auth/registro-nuevo', async (req, res): Promise<void> => {
  try {
    const {
      curp, nombres, apellido_paterno, apellido_materno,
      estado_up, municipio_up, tipo_maiz, variedad_id,
      lat, lng, poligono, area_calc_ha, area_real_ha, coincide_area,
      telefono, pin, programas_beneficiario, correo
    } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'El PIN debe ser 4 dígitos' });
      return;
    }

    if (!curp || curp.length !== 18) {
      res.status(400).json({ error: 'CURP inválida' });
      return;
    }

    const existe = await pool.query(
      `SELECT producer_id FROM producer WHERE UPPER(curp) = UPPER($1)`, [curp]
    );
    if (existe.rows.length) {
      res.status(409).json({ error: 'Esta CURP ya está registrada' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Normalizar nombres: MAYÚSCULAS sin acentos
      const nombresN = normalizeText(nombres || '');
      const apPaternoN = normalizeText(apellido_paterno || '');
      const apMaternoN = normalizeText(apellido_materno || '');
      const curpN = curp.toUpperCase().trim();
      const nombreCompleto = [nombresN, apPaternoN, apMaternoN].filter(Boolean).join(' ');

      const u = await client.query(
        `INSERT INTO usuarios (curp, nombre_completo, password_hash, rol, telefono, activo)
         VALUES ($1, $2, $3, 'productor', $4, true) RETURNING id`,
        [curpN, nombreCompleto, hashedPin, telefono]
      );

      const p = await client.query(
        `INSERT INTO producer
           (usuario_id, curp, nombres, apellido_paterno, apellido_materno,
            phone, tipo_registro, estado_validacion, programas_beneficiario, correo)
         VALUES ($1,$2,$3,$4,$5,$6,'B','pendiente',$7,$8) RETURNING producer_id`,
        [u.rows[0].id, curpN, nombresN, apPaternoN,
         apMaternoN, telefono, programas_beneficiario || [], correo || null]
      );

      // UP: si marcó en mapa usar coordenadas, si no usar centroide del municipio
      const hasCoords = lat && lng && lat !== 0 && lng !== 0;
      if (hasCoords) {
        const hasPoligono = poligono && Array.isArray(poligono) && poligono.length >= 3;
        const geomSql = hasPoligono
          ? `ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)`
          : 'NULL';
        const geomParam = hasPoligono
          ? JSON.stringify({
              type: 'Polygon',
              coordinates: [[
                ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
                [poligono[0][1], poligono[0][0]],
              ]],
            })
          : null;
        const qParams = [
          p.rows[0].producer_id, estado_up, municipio_up, lng, lat,
          ...(hasPoligono ? [geomParam] : []),
          area_calc_ha || null, area_real_ha || null, coincide_area ?? null,
        ];
        const aIdx = hasPoligono ? 7 : 6;
        await client.query(
          `INSERT INTO up
             (producer_id, up_name, up_type, production_system, water_regime,
              state_name, municipality_name, centroid, geom,
              area_ha_calc, area_ha_real, coincide_area,
              location_confirmed, centroid_source)
           VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
                   $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), ${geomSql},
                   $${aIdx}, $${aIdx+1}, $${aIdx+2}, TRUE, 'productor')`,
          qParams
        );
      } else {
        // Intentar centroide del municipio desde municipios_referencia
        const muni = await client.query(
          `SELECT centroid FROM municipios_referencia
           WHERE LOWER(nombre) = LOWER($1) AND LOWER(estado) = LOWER($2) LIMIT 1`,
          [municipio_up, estado_up]
        );
        const centroidVal = muni.rows[0]?.centroid || null;
        await client.query(
          `INSERT INTO up
             (producer_id, up_name, up_type, production_system, water_regime,
              state_name, municipality_name, centroid,
              location_confirmed, centroid_source)
           VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
                   $2, $3, $4::geometry, FALSE, 'municipio')`,
          [p.rows[0].producer_id, estado_up, municipio_up, centroidVal]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        mensaje: 'Registro enviado. Tu cuenta será validada pronto. Ya puedes consultar precios y alertas.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error en registro-nuevo:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Esta CURP ya está registrada' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PRODUCTOR — Endpoints protegidos
// ─────────────────────────────────────────────

// Helper para obtener producer_id del token
async function getProducerId(userId: number): Promise<number | null> {
  const r = await pool.query('SELECT producer_id FROM producer WHERE usuario_id = $1 LIMIT 1', [userId]);
  return r.rows[0]?.producer_id || null;
}

// GET /api/productor/dashboard
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    // UP del productor
    const upRes = await pool.query(
      `SELECT state_name, municipality_name, location_confirmed, centroid_source,
              ST_Y(centroid::geometry) AS lat, ST_X(centroid::geometry) AS lng
       FROM up WHERE producer_id = $1 LIMIT 1`,
      [producerId]
    );
    const up = upRes.rows[0];

    // Precio promedio regional (últimos 7 días)
    let precio_hoy: number | null = null;
    let precio_ayer: number | null = null;
    try {
      const precioRes = await pool.query(
        `SELECT ROUND(AVG(pr.precio)::numeric, 2) AS precio_hoy
         FROM precios pr
         JOIN bodegas b ON b.id = pr.bodega_id
         WHERE pr.created_at >= CURRENT_DATE
           AND pr.tipo_precio = 'bodega'
           AND b.estado ILIKE $1`,
        [up?.state_name || '']
      );
      precio_hoy = precioRes.rows[0]?.precio_hoy;

      const ayerRes = await pool.query(
        `SELECT ROUND(AVG(pr.precio)::numeric, 2) AS precio_ayer
         FROM precios pr
         JOIN bodegas b ON b.id = pr.bodega_id
         WHERE pr.created_at >= CURRENT_DATE - INTERVAL '1 day'
           AND pr.created_at < CURRENT_DATE
           AND pr.tipo_precio = 'bodega'
           AND b.estado ILIKE $1`,
        [up?.state_name || '']
      );
      precio_ayer = ayerRes.rows[0]?.precio_ayer;
    } catch (_) { /* ignore */ }

    // Alerta activa más reciente sin leer
    let alerta_activa: any = null;
    try {
      const alertaRes = await pool.query(
        `SELECT mensaje, tipo FROM notificaciones
         WHERE usuario_id = $1
           AND tipo IN ('alerta_climatica','alerta_sanitaria')
           AND leida = FALSE
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      alerta_activa = alertaRes.rows[0] || null;
    } catch (_) { /* ignore */ }

    // 3 bodegas cercanas (fallback por estado)
    let bodegas_cercanas: any[] = [];
    try {
      const bodegasRes = await pool.query(
        `SELECT b.id, b.nombre, b.municipio,
                COALESCE((SELECT pr.precio FROM precios pr
                  WHERE pr.bodega_id = b.id AND pr.tipo_precio = 'bodega'
                  ORDER BY pr.created_at DESC LIMIT 1), 0) AS precio_compra_hoy,
                FALSE AS is_ventanilla,
                'comprando' AS estado_compra,
                0 AS distancia_km
         FROM bodegas b
         WHERE b.estado ILIKE $1
         LIMIT 3`,
        [up?.state_name || '']
      );
      bodegas_cercanas = bodegasRes.rows;
    } catch (_) { /* ignore */ }

    // Datos del productor (nombres, estado_validacion)
    const prodRes = await pool.query(
      `SELECT nombres, apellido_paterno, apellido_materno, estado_validacion FROM producer WHERE producer_id = $1`,
      [producerId]
    );

    res.json({
      municipio: up?.municipality_name,
      estado: up?.state_name,
      location_confirmed: up?.location_confirmed || false,
      centroid_source: up?.centroid_source,
      lat: up?.lat ?? null,
      lng: up?.lng ?? null,
      precio_hoy,
      precio_ayer,
      alerta_activa,
      bodegas_cercanas,
      nombres: prodRes.rows[0]?.nombres,
      apellido_paterno: prodRes.rows[0]?.apellido_paterno,
      apellido_materno: prodRes.rows[0]?.apellido_materno,
      estado_validacion: prodRes.rows[0]?.estado_validacion,
    });
  } catch (error) {
    console.error('Error en dashboard productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productor/precios
router.get('/precios', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const upData = await pool.query(
      `SELECT state_name FROM up WHERE producer_id = $1 LIMIT 1`, [producerId]
    );
    const estado = upData.rows[0]?.state_name;

    // Precio de compra promedio regional (hoy)
    let precio_compra: number | null = null;
    let precio_bodega: number | null = null;
    let precio_mercado: number | null = null;
    try {
      const precioRes = await pool.query(
        `SELECT ROUND(AVG(pr.precio)::numeric, 2) AS po_hoy
         FROM precios pr
         JOIN bodegas b ON b.id = pr.bodega_id
         WHERE pr.created_at >= CURRENT_DATE - INTERVAL '7 days'
           AND pr.tipo_precio = 'bodega'
           AND b.estado ILIKE $1`,
        [estado || '']
      );
      precio_compra = precioRes.rows[0]?.po_hoy;
      if (precio_compra) {
        precio_bodega = Math.round(Number(precio_compra) * 1.08 * 100) / 100;
        precio_mercado = Math.round(Number(precio_compra) * 1.15 * 100) / 100;
      }
    } catch (_) { /* ignore */ }

    // Tendencia 30 días
    let tendencia: any[] = [];
    try {
      const tendenciaRes = await pool.query(
        `SELECT pr.created_at::date AS fecha, ROUND(AVG(pr.precio)::numeric, 2) AS precio_compra
         FROM precios pr
         JOIN bodegas b ON b.id = pr.bodega_id
         WHERE pr.created_at >= CURRENT_DATE - INTERVAL '30 days'
           AND pr.tipo_precio = 'bodega'
           AND b.estado ILIKE $1
         GROUP BY pr.created_at::date
         ORDER BY fecha ASC`,
        [estado || '']
      );
      tendencia = tendenciaRes.rows;
    } catch (_) { /* ignore */ }

    // FIRA
    let fira: any = null;
    try {
      const firaRes = await pool.query(
        `SELECT costo_por_ha, precio_fira, pct_ganancia, modalidad
         FROM costos_fira WHERE estado ILIKE $1 AND activo = TRUE
         ORDER BY vigente_desde DESC LIMIT 1`,
        [estado || '']
      );
      fira = firaRes.rows[0] || null;
    } catch (_) { /* ignore */ }

    res.json({
      estado,
      fecha: new Date().toISOString().split('T')[0],
      precio_compra,
      precio_bodega,
      precio_mercado,
      fira,
      tendencia,
    });
  } catch (error) {
    console.error('Error en precios productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/productor/ubicacion
router.patch('/ubicacion', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, poligono, area_calc_ha, area_real_ha, coincide_area } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const hasPoligono = poligono && Array.isArray(poligono) && poligono.length >= 3;
    if (hasPoligono) {
      const geomGeoJSON = JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
          [poligono[0][1], poligono[0][0]],
        ]],
      });
      await pool.query(
        `UPDATE up SET
           centroid = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           geom = ST_SetSRID(ST_GeomFromGeoJSON($3), 4326),
           area_ha_calc = $4, area_ha_real = $5, coincide_area = $6,
           location_confirmed = TRUE,
           centroid_source = 'productor'
         WHERE producer_id = $7`,
        [lng, lat, geomGeoJSON, area_calc_ha || null, area_real_ha || null, coincide_area ?? null, producerId]
      );
    } else {
      await pool.query(
        `UPDATE up SET
           centroid = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           location_confirmed = TRUE,
           centroid_source = 'productor'
         WHERE producer_id = $3`,
        [lng, lat, producerId]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error en ubicacion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productor/mi-up — retorna la UP del productor con geom + centroide
router.get('/mi-up', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const { rows } = await pool.query(
      `SELECT up_id, up_name, state_name, municipality_name,
              location_confirmed, centroid_source,
              ST_Y(centroid::geometry) AS lat, ST_X(centroid::geometry) AS lng,
              area_ha_calc, area_ha_real, coincide_area,
              ST_AsGeoJSON(geom)::json AS geom_geojson,
              CASE WHEN geom IS NOT NULL THEN
                (SELECT array_agg(ARRAY[ST_Y(dp), ST_X(dp)] ORDER BY ordinality)
                 FROM unnest(ST_DumpPoints(ST_ExteriorRing(geom::geometry)).geom)
                      WITH ORDINALITY AS t(dp, ordinality)
                 WHERE ordinality < ST_NPoints(ST_ExteriorRing(geom::geometry)))
              ELSE NULL END AS geom_coordenadas
       FROM up WHERE producer_id = $1 LIMIT 1`,
      [producerId]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error en mi-up:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productor/solicitar-apoyo
router.post('/solicitar-apoyo', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { infraestructura_id, tipo_apoyo, notas } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const solicitud = await pool.query(
      `INSERT INTO solicitudes_apoyo (producer_id, infraestructura_id, tipo_apoyo, notas_productor)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [producerId, infraestructura_id, tipo_apoyo, notas]
    );

    res.status(201).json({ solicitud_id: solicitud.rows[0].id });
  } catch (error) {
    console.error('Error en solicitar-apoyo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productor/mis-solicitudes
router.get('/mis-solicitudes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const { rows } = await pool.query(
      `SELECT s.id, s.tipo_apoyo, s.estado, s.created_at, s.updated_at,
              s.notas_productor, s.notas_ventanilla
       FROM solicitudes_apoyo s
       WHERE s.producer_id = $1 ORDER BY s.created_at DESC`,
      [producerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en mis-solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/productor/perfil
router.patch('/perfil', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { telefono, programas_beneficiario, correo } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    await pool.query(
      `UPDATE producer SET
         phone                  = COALESCE($1, phone),
         programas_beneficiario = COALESCE($2, programas_beneficiario),
         correo                 = COALESCE($3, correo)
       WHERE producer_id = $4`,
      [telefono, programas_beneficiario, correo || null, producerId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error en perfil productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productor/perfil
router.get('/perfil', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    const { rows } = await pool.query(
      `SELECT p.producer_id, p.curp, p.nombres, p.apellido_paterno, p.apellido_materno,
              p.phone AS telefono, p.estado_validacion, p.tipo_registro,
              p.programas_beneficiario, p.correo,
              u.up_id, u.state_name AS state_name, u.municipality_name AS municipality_name,
              u.location_confirmed, u.centroid_source,
              u.area_ha_calc, u.area_ha_real,
              ST_Y(u.centroid::geometry) AS lat,
              ST_X(u.centroid::geometry) AS lng
       FROM producer p
       LEFT JOIN up u ON u.producer_id = p.producer_id
       WHERE p.producer_id = $1`,
      [producerId]
    );
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Error en get perfil productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productor/mi-ciclo — ciclo activo del productor
router.get('/mi-ciclo', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    // Obtener up_id
    const upRes = await pool.query('SELECT up_id FROM up WHERE producer_id = $1 LIMIT 1', [producerId]);
    if (!upRes.rows[0]) { res.json(null); return; }
    const upId = upRes.rows[0].up_id;

    const { rows } = await pool.query(
      `SELECT c.cycle_id, c.cycle_year, c.cycle_type,
              cc.area_sown_ha AS hectareas_sembradas,
              cc.planting_date AS fecha_siembra,
              COALESCE(cc.variety_other, cc.variety_id) AS variedad_nombre
       FROM cycle c
       LEFT JOIN cycle_crop cc ON cc.cycle_id = c.cycle_id
       WHERE c.up_id = $1
       ORDER BY c.cycle_year DESC, c.cycle_id DESC
       LIMIT 1`,
      [upId]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error en mi-ciclo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productor/ciclo — declarar ciclo productivo
router.post('/ciclo', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cycle_year, cycle_type, hectareas_sembradas, fecha_siembra, variedad_nombre } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    if (!cycle_year || !cycle_type) {
      res.status(400).json({ error: 'cycle_year y cycle_type son requeridos' });
      return;
    }

    const upRes = await pool.query('SELECT up_id FROM up WHERE producer_id = $1 LIMIT 1', [producerId]);
    if (!upRes.rows[0]) { res.status(404).json({ error: 'UP no encontrada' }); return; }
    const upId = upRes.rows[0].up_id;

    const result = await pool.query(
      `INSERT INTO cycle
         (up_id, cycle_year, cycle_type, declarado_por_productor,
          hectareas_sembradas, fecha_siembra, variedad_nombre)
       VALUES ($1, $2, $3, TRUE, $4, $5, $6)
       RETURNING cycle_id, cycle_year, cycle_type`,
      [upId, cycle_year, cycle_type, hectareas_sembradas || null,
       fecha_siembra || null, variedad_nombre || null]
    );

    res.status(201).json({ ok: true, ciclo: result.rows[0] });
  } catch (error) {
    console.error('Error en ciclo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
