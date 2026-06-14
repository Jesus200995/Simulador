import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { reverseGeocode } from '../utils/geocode';

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

    // Obtener datos del productor para el INSERT de usuarios
    const prodInfo = await pool.query(
      `SELECT curp, nombres, apellido_paterno, apellido_materno,
              COALESCE(phone, '') AS telefono
       FROM producer WHERE producer_id = $1`,
      [producer_id]
    );
    if (!prodInfo.rows.length) {
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }
    const prod = prodInfo.rows[0];
    const nombreCompleto = [prod.nombres, prod.apellido_paterno, prod.apellido_materno]
      .filter(Boolean).join(' ');

    const hashedPin = await bcrypt.hash(pin, 10);

    // Transacción: crear usuario + vincular productor
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const u = await client.query(
        `INSERT INTO usuarios (curp, nombre_completo, password_hash, telefono, rol, activo)
         VALUES ($1, $2, $3, $4, 'productor', true) RETURNING id`,
        [prod.curp, nombreCompleto, hashedPin, prod.telefono]
      );

      const producer = await client.query(
        `UPDATE producer
         SET usuario_id = $1, tipo_registro = 'A', estado_validacion = 'activo'
         WHERE producer_id = $2 RETURNING nombres, apellido_paterno`,
        [u.rows[0].id, producer_id]
      );

      await client.query('COMMIT');

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('FATAL: JWT_SECRET no definida en variables de entorno. El servidor no puede arrancar sin esta variable.');
      }
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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('FATAL: JWT_SECRET no definida en variables de entorno. El servidor no puede arrancar sin esta variable.');
    }
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

// GET /api/productor/geo/reverse?lat=&lng= — reverse-geocoding público
// Devuelve el estado y municipio exactos según las coordenadas marcadas.
// Público porque se usa también durante el registro (sin sesión).
router.get('/geo/reverse', async (req, res): Promise<void> => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'lat y lng son requeridos' });
    return;
  }
  try {
    const g = await reverseGeocode(lat, lng);
    res.json({
      estado: g.state_name,
      municipio: g.municipality_name,
      state_id: g.state_id,
      municipality_id: g.municipality_id,
      source: g.source,
    });
  } catch (error) {
    console.error('Error en geo/reverse:', error);
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

    // Si el productor marcó su parcela, el estado y municipio se derivan de DÓNDE la marcó
    // (reverse-geocoding), no del formulario. Así el llenado es automático y exacto.
    let estadoFinal = estado_up;
    let municipioFinal = municipio_up;
    let stateIdFinal: string | null = null;
    let municipalityIdFinal: string | null = null;
    if (lat != null && lng != null && lat !== 0 && lng !== 0) {
      const g = await reverseGeocode(Number(lat), Number(lng));
      if (g.state_name) estadoFinal = g.state_name;
      if (g.municipality_name) municipioFinal = g.municipality_name;
      stateIdFinal = g.state_id;
      municipalityIdFinal = g.municipality_id;
    }

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

      // UP: tres casos según lo que envió el frontend
      const hasCoords  = lat != null && lng != null && lat !== 0 && lng !== 0;
      const hasPoligono = poligono && Array.isArray(poligono) && poligono.length >= 3;
      const postgisActivo = process.env.POSTGIS_ENABLED === 'true';

      // Verificar que el nuevo polígono no se intersecta con UPs existentes del mismo productor
      if (hasPoligono && postgisActivo) {
        const geojsonNueva = JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
            [poligono[0][1], poligono[0][0]],
          ]],
        });
        const overlapCheck = await client.query(
          `SELECT u.up_id, u.up_name
           FROM up u
           WHERE u.producer_id = $1
             AND u.geom IS NOT NULL
             AND ST_Intersects(u.geom, ST_SetSRID(ST_GeomFromGeoJSON($2::text), 4326))
           LIMIT 1`,
          [p.rows[0].producer_id, geojsonNueva]
        );
        if (overlapCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          res.status(409).json({
            error: `El polígono que dibujaste se intersecta con tu parcela "${overlapCheck.rows[0].up_name}" que ya está registrada. Por favor dibuja el polígono de tu nueva parcela en un área diferente.`,
            up_conflicto: overlapCheck.rows[0].up_name,
          });
          return;
        }
      }

      if (hasCoords) {
        // Caso 1 — Frontend envió centroide calculado por turf.js ✅
        // useGeomParam: $6 solo aparece en el SQL cuando ambas condiciones se cumplen
        const useGeomParam = hasPoligono && postgisActivo;
        // La columna up.geom es MultiPolygon → envolver con ST_Multi
        const geomSql = useGeomParam
          ? `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($6::text), 4326))`
          : 'NULL';
        const geomParam = useGeomParam
          ? JSON.stringify({
              type: 'Polygon',
              coordinates: [[
                ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
                [poligono[0][1], poligono[0][0]],
              ]],
            })
          : null;
        const qParams = [
          p.rows[0].producer_id, estadoFinal, municipioFinal, lng, lat,
          ...(useGeomParam ? [geomParam] : []),
          area_calc_ha || null, area_real_ha || null, coincide_area ?? null,
        ];
        const aIdx = useGeomParam ? 7 : 6;
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

      } else if (hasPoligono && postgisActivo) {
        // Caso 2 — RED DE SEGURIDAD: frontend envió polígono pero lat/lng llegaron null
        // El backend calcula el centroide directamente desde el polígono con PostGIS
        console.log('[UP] lat/lng null pero polígono disponible — calculando centroide con PostGIS');

        const geojson = JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
            [poligono[0][1], poligono[0][0]],
          ]],
        });

        await client.query(
          `INSERT INTO up
             (producer_id, up_name, up_type, production_system, water_regime,
              state_name, municipality_name,
              centroid, geom,
              area_ha_calc, area_ha_real, coincide_area,
              location_confirmed, centroid_source)
           VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
                   $2, $3,
                   ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)),
                   ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)),
                   $5, $6, $7,
                   TRUE, 'poligono_calculado')`,
          [p.rows[0].producer_id, estadoFinal, municipioFinal, geojson,
           area_calc_ha || null, area_real_ha || null, coincide_area ?? null]
        );

      } else {
        // Caso 3 — Sin coordenadas ni polígono: usar centroide del municipio
        console.log('[UP] Sin coordenadas ni polígono — usando centroide del municipio');
        let centroidVal = null;
        try {
          const muni = await client.query(
            `SELECT centroid::geometry AS centroid
             FROM municipios_referencia
             WHERE LOWER(nombre) = LOWER($1) AND LOWER(estado) = LOWER($2) LIMIT 1`,
            [municipioFinal, estadoFinal]
          );
          centroidVal = muni.rows[0]?.centroid || null;
        } catch (err) {
          console.warn('municipios_referencia no disponible:', err);
        }
        await client.query(
          `INSERT INTO up
             (producer_id, up_name, up_type, production_system, water_regime,
              state_name, municipality_name, centroid,
              location_confirmed, centroid_source)
           VALUES ($1, 'Parcela principal', 'temporal', 'tradicional', 'temporal',
                   $2, $3, $4::geometry, FALSE, 'municipio')`,
          [p.rows[0].producer_id, estadoFinal, municipioFinal, centroidVal]
        );
      }

      // Guardar ids canónicos de estado/municipio (en up y producer) cuando se resolvieron
      if (stateIdFinal || municipalityIdFinal) {
        await client.query(
          `UPDATE up SET state_id = COALESCE($1, state_id),
                         municipality_id = COALESCE($2, municipality_id)
           WHERE producer_id = $3`,
          [stateIdFinal, municipalityIdFinal, p.rows[0].producer_id]
        );
        await client.query(
          `UPDATE producer SET state_id = COALESCE($1, state_id),
                               municipality_id = COALESCE($2, municipality_id)
           WHERE producer_id = $3`,
          [stateIdFinal, municipalityIdFinal, p.rows[0].producer_id]
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
      res.status(409).json({ error: 'Esta CURP ya está registrada en el sistema' });
      return;
    }
    if (error.code === '42P01') {
      res.status(500).json({ error: 'Configuración de base de datos incompleta. Contacta al administrador.' });
      return;
    }
    if (error.message?.includes('ST_SetSRID') || error.message?.includes('ST_GeomFromGeoJSON') || error.message?.includes('PostGIS')) {
      console.warn('PostGIS no disponible — registro sin polígono');
      res.status(201).json({ mensaje: 'Registro enviado. La ubicación se actualizará después.' });
      return;
    }
    res.status(500).json({ error: 'Error al registrar. Intenta de nuevo.' });
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

    // 3 bodegas cercanas — distancia real con Haversine si el productor tiene centroide;
    // si no, fallback por estado (sin distancia)
    let bodegas_cercanas: any[] = [];
    try {
      const tieneCoordsUP = up?.lat != null && up?.lng != null;

      const bodegasQuery = tieneCoordsUP ? `
        SELECT b.id, b.nombre, b.municipio,
               COALESCE((SELECT pr.precio FROM precios pr
                 WHERE pr.bodega_id = b.id AND pr.tipo_precio = 'bodega'
                 ORDER BY pr.created_at DESC LIMIT 1), 0) AS precio_compra_hoy,
               FALSE AS is_ventanilla,
               CASE b.semaforo_compra
                 WHEN 'verde'    THEN 'comprando'
                 WHEN 'amarillo' THEN 'limitado'
                 WHEN 'rojo'     THEN 'no_compra'
                 ELSE 'sin_actividad'
               END AS estado_compra,
               ROUND((6371 * acos(
                 LEAST(1.0, cos(radians($1)) * cos(radians(b.latitud)) *
                 cos(radians(b.longitud) - radians($2)) +
                 sin(radians($1)) * sin(radians(b.latitud)))
               ))::numeric, 1) AS distancia_km
        FROM bodegas b
        WHERE b.latitud IS NOT NULL AND b.longitud IS NOT NULL
        ORDER BY distancia_km ASC
        LIMIT 3
      ` : `
        SELECT b.id, b.nombre, b.municipio,
               COALESCE((SELECT pr.precio FROM precios pr
                 WHERE pr.bodega_id = b.id AND pr.tipo_precio = 'bodega'
                 ORDER BY pr.created_at DESC LIMIT 1), 0) AS precio_compra_hoy,
               FALSE AS is_ventanilla,
               CASE b.semaforo_compra
                 WHEN 'verde'    THEN 'comprando'
                 WHEN 'amarillo' THEN 'limitado'
                 WHEN 'rojo'     THEN 'no_compra'
                 ELSE 'sin_actividad'
               END AS estado_compra,
               NULL AS distancia_km
        FROM bodegas b
        WHERE b.estado ILIKE $1
        LIMIT 3
      `;
      const bodegasParams = tieneCoordsUP ? [up.lat, up.lng] : [up?.state_name || ''];
      const bodegasRes = await pool.query(bodegasQuery, bodegasParams);
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

    // Referencias externas (Chicago y Tipo de Cambio)
    let precio_chicago_usd_bushel: number | null = null;
    let tipo_cambio_mxn: number | null = null;
    try {
      const refRes = await pool.query(
        `SELECT chicago_usd_bushel, tc_banxico FROM precio_referencias_externas ORDER BY created_at DESC LIMIT 1`
      );
      if (refRes.rows.length > 0) {
        precio_chicago_usd_bushel = Number(refRes.rows[0].chicago_usd_bushel);
        tipo_cambio_mxn = Number(refRes.rows[0].tc_banxico);
      }
    } catch (_) { /* ignore */ }

    // Calcular promedio real de tarifarios activos en los últimos 60 días
    let servicios_promedio = 0;
    try {
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
      servicios_promedio = parseFloat(serviciosResult.rows[0]?.promedio || '0');
    } catch (_) { /* ignore */ }

    res.json({
      estado,
      fecha: new Date().toISOString().split('T')[0],
      precio_compra,
      precio_bodega,
      precio_mercado,
      servicios_promedio: Math.round(servicios_promedio),
      precio_chicago_usd_bushel,
      tipo_cambio_mxn,
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
           geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326)),
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

    // Reverse-geocoding: el estado y municipio se derivan de DÓNDE quedó la parcela.
    let geo = null;
    if (lat != null && lng != null) {
      const g = await reverseGeocode(Number(lat), Number(lng));
      if (g.state_name || g.municipality_name) {
        // Actualizar la UP con el estado/municipio reales de la ubicación marcada
        await pool.query(
          `UPDATE up SET
             state_name = COALESCE($1, state_name),
             municipality_name = COALESCE($2, municipality_name),
             state_id = COALESCE($3, state_id),
             municipality_id = COALESCE($4, municipality_id),
             updated_at = NOW()
           WHERE producer_id = $5`,
          [g.state_name, g.municipality_name, g.state_id, g.municipality_id, producerId]
        );
        // Mantener el producer en sintonía (state_id/municipality_id)
        await pool.query(
          `UPDATE producer SET
             state_id = COALESCE($1, state_id),
             municipality_id = COALESCE($2, municipality_id)
           WHERE producer_id = $3`,
          [g.state_id, g.municipality_id, producerId]
        );
        geo = { estado: g.state_name, municipio: g.municipality_name };
      }
    }

    res.json({ ok: true, geo });
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

    // Consultar con funciones PostGIS si están disponibles, sino usar columnas lat/lng directas
    let rows: any[] = [];
    try {
      // Intentar primero con PostGIS (centroid geometry)
      const r = await pool.query(
        `SELECT up_id, up_name, state_name, municipality_name,
                location_confirmed, centroid_source,
                ST_Y(centroid::geometry) AS lat,
                ST_X(centroid::geometry) AS lng,
                area_ha_calc, area_ha_real, coincide_area,
                ST_AsGeoJSON(geom)::json AS geom_geojson,
                NULL AS geom_coordenadas
         FROM up WHERE producer_id = $1
         LIMIT 1`,
        [producerId]
      );
      rows = r.rows;
    } catch (e1) {
      console.error('Error en mi-up (query simple):', e1);
    }

    // Si no hay columnas lat/lng, intentar extraer de centroid geometry
    if (rows.length === 0 || (rows[0].lat === 0 && rows[0].lng === 0)) {
      try {
        const r2 = await pool.query(
          `SELECT up_id, up_name, state_name, municipality_name,
                  location_confirmed, centroid_source,
                  area_ha_calc, area_ha_real, coincide_area
           FROM up WHERE producer_id = $1 LIMIT 1`,
          [producerId]
        );
        if (r2.rows.length > 0) {
          rows = r2.rows.map((row: any) => ({ ...row, lat: null, lng: null, geom_geojson: null, geom_coordenadas: null }));
        }
      } catch (e2) {
        console.error('Error en mi-up (fallback):', e2);
      }
    }

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
    if (!infraestructura_id) { res.status(400).json({ error: 'infraestructura_id requerido' }); return; }

    // El esquema real de solicitudes_apoyo es ventanilla-based:
    // (ventanilla_id, apoyo_id, producer_id, estado, notas). Resolvemos la
    // ventanilla activa de la bodega y un apoyo (preferimos el del tipo pedido).
    const nombreApoyo =
      tipo_apoyo === 'incentivo' || tipo_apoyo === 'incentivos' ? 'incentivos' :
      tipo_apoyo === 'cobertura' || tipo_apoyo === 'coberturas' ? 'coberturas' : null;

    const resolve = await pool.query(
      `SELECT v.id AS ventanilla_id,
              (SELECT a.id FROM apoyos_ventanilla a
                 WHERE a.ventanilla_id = v.id
                   AND ($2::text IS NULL OR a.nombre_apoyo = $2)
                 ORDER BY a.created_at DESC LIMIT 1) AS apoyo_id_tipo,
              (SELECT a2.id FROM apoyos_ventanilla a2
                 WHERE a2.ventanilla_id = v.id
                 ORDER BY a2.created_at DESC LIMIT 1) AS apoyo_id_any
         FROM ventanillas v
        WHERE v.bodega_id = $1 AND v.estatus = 'activa'
        ORDER BY v.created_at DESC LIMIT 1`,
      [infraestructura_id, nombreApoyo]
    );
    if (resolve.rows.length === 0) {
      res.status(404).json({ error: 'Esta bodega no tiene una ventanilla de apoyos activa' });
      return;
    }
    const apoyoId = resolve.rows[0].apoyo_id_tipo || resolve.rows[0].apoyo_id_any;
    if (!apoyoId) {
      res.status(400).json({ error: 'La ventanilla aún no tiene apoyos publicados' });
      return;
    }

    const solicitud = await pool.query(
      `INSERT INTO solicitudes_apoyo (ventanilla_id, apoyo_id, producer_id, estado, notas)
       VALUES ($1, $2, $3, 'recibida', $4) RETURNING id`,
      [resolve.rows[0].ventanilla_id, apoyoId, producerId, notas || null]
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

    // Esquema real (ventanilla-based): solicitudes_apoyo(ventanilla_id, apoyo_id,
    // producer_id, estado, notas, created_at, updated_at)
    const r = await pool.query(
      `SELECT s.id, s.estado,
              s.notas,
              s.notas AS notas_ventanilla,
              s.created_at, s.updated_at,
              COALESCE(a.nombre_apoyo, 'Solicitud') AS tipo_apoyo,
              v.nombre_ventanilla AS ventanilla_nombre,
              b.nombre AS bodega_nombre
       FROM solicitudes_apoyo s
       LEFT JOIN ventanillas v ON v.id = s.ventanilla_id
       LEFT JOIN apoyos_ventanilla a ON a.id = s.apoyo_id
       LEFT JOIN bodegas b ON b.id = v.bodega_id
       WHERE s.producer_id = $1
       ORDER BY s.created_at DESC`,
      [producerId]
    );

    res.json(r.rows);
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

    // Validar que no exista ya un ciclo activo del mismo tipo+año en esta UP
    const existente = await pool.query(
      `SELECT cycle_id FROM cycle
       WHERE up_id = $1 AND cycle_type = $2 AND cycle_year = $3
         AND COALESCE(estado_ciclo, 'activo') = 'activo'
       LIMIT 1`,
      [upId, cycle_type, cycle_year]
    );
    if (existente.rows.length > 0) {
      res.status(409).json({
        error: `Ya tienes un ciclo ${cycle_type} ${cycle_year} activo en esta UP`,
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO cycle
         (up_id, cycle_year, cycle_type, declarado_por_productor,
          hectareas_sembradas, fecha_siembra, variedad_nombre, estado_ciclo)
       VALUES ($1, $2, $3, TRUE, $4, $5, $6, 'activo')
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

// =============================================
// POST /api/productor/ups — agregar UP adicional a un productor existente
// =============================================
router.post('/ups', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usuarioId = req.user!.userId;
    const { lat, lng, poligono, area_calc_ha, area_real_ha, coincide_area,
            estado_up, municipio_up, nombre_up } = req.body;

    const prodResult = await client.query(
      'SELECT producer_id FROM producer WHERE usuario_id = $1', [usuarioId]
    );
    if (prodResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Productor no encontrado' });
      return;
    }
    const producer_id = prodResult.rows[0].producer_id;
    const postgisActivo = process.env.POSTGIS_ENABLED === 'true';
    const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
    const hasPoligono = poligono && Array.isArray(poligono) && poligono.length >= 3;
    const upName = nombre_up || `Parcela ${new Date().getFullYear()}`;

    const geojson = hasPoligono ? JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        ...poligono.map(([plat, plng]: [number, number]) => [plng, plat]),
        [poligono[0][1], poligono[0][0]],
      ]],
    }) : null;

    // Validar overlap con UPs existentes del mismo productor
    if (hasPoligono && postgisActivo) {
      const overlap = await client.query(
        `SELECT up_id, up_name FROM up
         WHERE producer_id = $1 AND geom IS NOT NULL
           AND ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($2::text), 4326))
         LIMIT 1`,
        [producer_id, geojson]
      );
      if (overlap.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(409).json({
          error: `El polígono que dibujaste se intersecta con tu parcela "${overlap.rows[0].up_name}". Por favor dibuja en un área diferente.`,
          up_conflicto: overlap.rows[0].up_name,
        });
        return;
      }
    }

    let upResult;
    if (hasCoords) {
      const useGeom = hasPoligono && postgisActivo;
      const geomSql = useGeom ? `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($6::text), 4326))` : 'NULL';
      const aIdx = useGeom ? 7 : 6;
      const params = [
        producer_id, estado_up, municipio_up, lng, lat,
        ...(useGeom ? [geojson] : []),
        area_calc_ha || null, area_real_ha || null, coincide_area ?? null, upName,
      ];
      upResult = await client.query(
        `INSERT INTO up
           (producer_id, up_name, up_type, production_system, water_regime,
            state_name, municipality_name, centroid, geom,
            area_ha_calc, area_ha_real, coincide_area, location_confirmed, centroid_source)
         VALUES ($1, $${aIdx + 3}, 'temporal', 'tradicional', 'temporal',
                 $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), ${geomSql},
                 $${aIdx}, $${aIdx + 1}, $${aIdx + 2}, TRUE, 'productor')
         RETURNING up_id, up_name`,
        params
      );
    } else if (hasPoligono && postgisActivo) {
      upResult = await client.query(
        `INSERT INTO up
           (producer_id, up_name, up_type, production_system, water_regime,
            state_name, municipality_name, centroid, geom,
            area_ha_calc, area_ha_real, coincide_area, location_confirmed, centroid_source)
         VALUES ($1, $5, 'temporal', 'tradicional', 'temporal',
                 $2, $3,
                 ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)),
                 ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326)),
                 $6, $7, $8, TRUE, 'poligono_calculado')
         RETURNING up_id, up_name`,
        [producer_id, estado_up, municipio_up, geojson, upName,
         area_calc_ha || null, area_real_ha || null, coincide_area ?? null]
      );
    } else {
      let centroidVal = null;
      try {
        const muni = await client.query(
          `SELECT centroid::geometry AS centroid FROM municipios_referencia
           WHERE LOWER(nombre) = LOWER($1) AND LOWER(estado) = LOWER($2) LIMIT 1`,
          [municipio_up, estado_up]
        );
        centroidVal = muni.rows[0]?.centroid || null;
      } catch { /* tabla opcional */ }
      upResult = await client.query(
        `INSERT INTO up
           (producer_id, up_name, up_type, production_system, water_regime,
            state_name, municipality_name, centroid, geom,
            area_ha_calc, area_ha_real, coincide_area, location_confirmed, centroid_source)
         VALUES ($1, $5, 'temporal', 'tradicional', 'temporal',
                 $2, $3, $4::geometry, NULL,
                 $6, $7, $8, FALSE, 'municipio')
         RETURNING up_id, up_name`,
        [producer_id, estado_up, municipio_up, centroidVal, upName,
         area_calc_ha || null, area_real_ha || null, coincide_area ?? null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, up: upResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al agregar UP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// =============================================
// GET /api/productor/mis-ups-con-ciclos — UPs del productor con sus ciclos activos
// =============================================
router.get('/mis-ups-con-ciclos', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user!.userId;
    const result = await pool.query(
      `SELECT
         u.up_id, u.up_name, u.municipality_name, u.state_name,
         u.area_ha_calc, u.area_ha_real, u.location_confirmed,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'cycle_id', c.cycle_id,
               'cycle_type', c.cycle_type,
               'cycle_year', c.cycle_year,
               'area_sown_ha', COALESCE(cr.area_sown_ha, c.hectareas_sembradas),
               'variedad_code', cr.variety_id,
               'variedad_nombre', COALESCE(cv.label, cr.variety_id, c.variedad_nombre),
               'variedad_other', cr.variety_other,
               'estado_ciclo', COALESCE(c.estado_ciclo, 'activo')
             )
           ) FILTER (WHERE c.cycle_id IS NOT NULL),
           '[]'
         ) AS ciclos_activos
       FROM up u
       JOIN producer p ON p.producer_id = u.producer_id
       LEFT JOIN cycle c ON c.up_id = u.up_id AND COALESCE(c.estado_ciclo, 'activo') = 'activo'
       LEFT JOIN cycle_crop cr ON cr.cycle_id = c.cycle_id
       LEFT JOIN cat_crop_variety cv ON cv.code = cr.variety_id AND cv.is_active = TRUE
       WHERE p.usuario_id = $1
       GROUP BY u.up_id, u.up_name, u.municipality_name, u.state_name,
                u.area_ha_calc, u.area_ha_real, u.location_confirmed, u.created_at
       ORDER BY u.created_at ASC`,
      [usuarioId]
    );
    res.json({ ups: result.rows });
  } catch (error) {
    console.error('Error al obtener UPs con ciclos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


export default router;
