import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

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
      `SELECT p.id, p.nombres, p.apellido_paterno, p.estado_validacion,
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
      producer_id: rows[0].id,
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
      `SELECT u.id FROM usuarios u JOIN producer p ON p.usuario_id = u.id WHERE p.id = $1`,
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
         WHERE id = $2 RETURNING nombres, apellido_paterno`,
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
      `SELECT p.id AS producer_id, p.nombres, p.apellido_paterno, p.estado_validacion,
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
      lat, lng, telefono, pin, programas_beneficiario
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
      `SELECT id FROM producer WHERE UPPER(curp) = UPPER($1)`, [curp]
    );
    if (existe.rows.length) {
      res.status(409).json({ error: 'Esta CURP ya está registrada' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const u = await client.query(
        `INSERT INTO usuarios (password_hash, rol, telefono, activo)
         VALUES ($1, 'productor', $2, true) RETURNING id`,
        [hashedPin, telefono]
      );

      const p = await client.query(
        `INSERT INTO producer
           (usuario_id, curp, nombres, apellido_paterno, apellido_materno,
            telefono, tipo_registro, estado_validacion, programas_beneficiario)
         VALUES ($1,$2,$3,$4,$5,$6,'B','pendiente',$7) RETURNING id`,
        [u.rows[0].id, curp.toUpperCase(), nombres, apellido_paterno,
         apellido_materno, telefono, programas_beneficiario || []]
      );

      // UP: si marcó en mapa usar coordenadas, si no usar centroide del municipio
      const hasCoords = lat && lng && lat !== 0 && lng !== 0;
      if (hasCoords) {
        await client.query(
          `INSERT INTO up
             (producer_id, state_name, municipality_name, centroid,
              location_confirmed, centroid_source)
           VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, TRUE, 'productor')`,
          [p.rows[0].id, estado_up, municipio_up, lng, lat]
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
             (producer_id, state_name, municipality_name, centroid,
              location_confirmed, centroid_source)
           VALUES ($1, $2, $3, $4, FALSE, 'municipio')`,
          [p.rows[0].id, estado_up, municipio_up, centroidVal]
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
  const r = await pool.query('SELECT id FROM producer WHERE usuario_id = $1 LIMIT 1', [userId]);
  return r.rows[0]?.id || null;
}

// GET /api/productor/dashboard
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    // UP del productor
    const upRes = await pool.query(
      `SELECT state_name, municipality_name, location_confirmed, centroid_source
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
      `SELECT nombres, apellido_paterno, estado_validacion FROM producer WHERE id = $1`,
      [producerId]
    );

    res.json({
      municipio: up?.municipality_name,
      estado: up?.state_name,
      location_confirmed: up?.location_confirmed || false,
      centroid_source: up?.centroid_source,
      precio_hoy,
      precio_ayer,
      alerta_activa,
      bodegas_cercanas,
      nombres: prodRes.rows[0]?.nombres,
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
    const { lat, lng } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    await pool.query(
      `UPDATE up SET
         centroid = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         location_confirmed = TRUE,
         centroid_source = 'productor'
       WHERE producer_id = $3`,
      [lng, lat, producerId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error en ubicacion:', error);
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
    const { telefono, programas_beneficiario } = req.body;
    const userId = req.user!.userId;
    const producerId = await getProducerId(userId);
    if (!producerId) { res.status(404).json({ error: 'Productor no encontrado' }); return; }

    await pool.query(
      `UPDATE producer SET
         telefono               = COALESCE($1, telefono),
         programas_beneficiario = COALESCE($2, programas_beneficiario)
       WHERE id = $3`,
      [telefono, programas_beneficiario, producerId]
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
      `SELECT p.id, p.curp, p.nombres, p.apellido_paterno, p.apellido_materno,
              p.telefono, p.estado_validacion, p.tipo_registro,
              p.programas_beneficiario,
              u.state_name AS state_name, u.municipality_name AS municipality_name,
              u.location_confirmed, u.centroid_source,
              ST_Y(u.centroid::geometry) AS lat,
              ST_X(u.centroid::geometry) AS lng
       FROM producer p
       LEFT JOIN up u ON u.producer_id = p.id
       WHERE p.id = $1`,
      [producerId]
    );
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Error en get perfil productor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
